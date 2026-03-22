-- ============================================================
-- 005_functions.sql
-- 코드없이 — 피드 알고리즘 + 주간베스트 집계 함수
-- ============================================================

-- ─────────────────────────────────────────────
-- 팔로잉 기반 피드 (cursor pagination)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_following_feed(
  p_user_id   UUID,
  p_cursor    TIMESTAMPTZ DEFAULT NOW(),
  p_limit     INT         DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  author_id     UUID,
  title         TEXT,
  description   TEXT,
  thumbnail_url TEXT,
  demo_url      TEXT,
  category      TEXT,
  like_count    INT,
  comment_count INT,
  bookmark_count INT,
  view_count    INT,
  has_prompt    BOOLEAN,
  created_at    TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id, p.author_id, p.title, p.description,
    p.thumbnail_url, p.demo_url, p.category,
    p.like_count, p.comment_count, p.bookmark_count,
    p.view_count, p.has_prompt, p.created_at
  FROM projects p
  WHERE
    p.is_deleted = FALSE
    AND p.created_at < p_cursor
    AND p.author_id IN (
      SELECT following_id FROM follows WHERE follower_id = p_user_id
    )
    AND p.author_id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = p_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

-- ─────────────────────────────────────────────
-- 인기 피드 (스코어 기반, cursor pagination)
-- 스코어 = 좋아요×3 + 댓글×5 + 북마크×4 + 조회×1
-- 최근 7일 이내 프로젝트 우선
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_popular_feed(
  p_user_id   UUID    DEFAULT NULL,
  p_cursor    FLOAT8  DEFAULT NULL,   -- 마지막 score (NULL = 첫 페이지)
  p_cursor_id UUID    DEFAULT NULL,   -- 동점 처리용 id
  p_limit     INT     DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  author_id     UUID,
  title         TEXT,
  description   TEXT,
  thumbnail_url TEXT,
  demo_url      TEXT,
  category      TEXT,
  like_count    INT,
  comment_count INT,
  bookmark_count INT,
  view_count    INT,
  has_prompt    BOOLEAN,
  created_at    TIMESTAMPTZ,
  score         FLOAT8
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id, p.author_id, p.title, p.description,
    p.thumbnail_url, p.demo_url, p.category,
    p.like_count, p.comment_count, p.bookmark_count,
    p.view_count, p.has_prompt, p.created_at,
    (p.like_count * 3.0 + p.comment_count * 5.0 + p.bookmark_count * 4.0 + p.view_count * 1.0) AS score
  FROM projects p
  WHERE
    p.is_deleted = FALSE
    AND (
      p_user_id IS NULL OR
      p.author_id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = p_user_id
      )
    )
    AND (
      p_cursor IS NULL OR
      (p.like_count * 3.0 + p.comment_count * 5.0 + p.bookmark_count * 4.0 + p.view_count * 1.0) < p_cursor OR
      (
        (p.like_count * 3.0 + p.comment_count * 5.0 + p.bookmark_count * 4.0 + p.view_count * 1.0) = p_cursor
        AND p.id < p_cursor_id
      )
    )
  ORDER BY score DESC, p.id DESC
  LIMIT p_limit;
$$;

-- ─────────────────────────────────────────────
-- 주간베스트 집계 함수
-- 매주 월요일 00:00 UTC 크론으로 호출
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_weekly_bests()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week_start DATE := date_trunc('week', NOW())::DATE;  -- ISO: 월요일
BEGIN
  -- 이미 집계된 주는 스킵
  IF EXISTS (SELECT 1 FROM weekly_bests WHERE week_start = v_week_start) THEN
    RETURN;
  END IF;

  INSERT INTO weekly_bests (project_id, week_start, rank, score)
  SELECT
    id AS project_id,
    v_week_start,
    ROW_NUMBER() OVER (ORDER BY weekly_score DESC) AS rank,
    weekly_score::INT AS score
  FROM (
    SELECT
      id,
      (like_count * 3.0 + comment_count * 5.0 + bookmark_count * 4.0 + view_count * 1.0) AS weekly_score
    FROM projects
    WHERE
      is_deleted = FALSE
      AND created_at >= (NOW() - INTERVAL '7 days')
    ORDER BY weekly_score DESC
    LIMIT 5
  ) sub;
END;
$$;

-- ─────────────────────────────────────────────
-- 조회수 증가 (중복 방지는 앱 레이어)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_view_count(p_project_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE projects SET view_count = view_count + 1 WHERE id = p_project_id;
$$;

-- ─────────────────────────────────────────────
-- 프롬프트 복사 수 증가
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_prompt_copy(p_prompt_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE project_prompts SET copy_count = copy_count + 1 WHERE id = p_prompt_id;
  UPDATE projects
    SET prompt_copy_count = prompt_copy_count + 1
    WHERE id = (SELECT project_id FROM project_prompts WHERE id = p_prompt_id);
$$;

-- ─────────────────────────────────────────────
-- Q&A 투표 처리 (업서트)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION vote_qna_answer(
  p_answer_id UUID,
  p_user_id   UUID,
  p_helpful   BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_helpful BOOLEAN;
  v_delta       INT;
BEGIN
  SELECT is_helpful INTO v_old_helpful
    FROM qna_votes WHERE answer_id = p_answer_id AND user_id = p_user_id;

  IF v_old_helpful IS NULL THEN
    -- 신규 투표
    INSERT INTO qna_votes (answer_id, user_id, is_helpful)
    VALUES (p_answer_id, p_user_id, p_helpful);
    v_delta := CASE WHEN p_helpful THEN 1 ELSE -1 END;
  ELSIF v_old_helpful = p_helpful THEN
    -- 동일 투표 → 취소
    DELETE FROM qna_votes WHERE answer_id = p_answer_id AND user_id = p_user_id;
    v_delta := CASE WHEN p_helpful THEN -1 ELSE 1 END;
  ELSE
    -- 반대 투표로 변경
    UPDATE qna_votes SET is_helpful = p_helpful
      WHERE answer_id = p_answer_id AND user_id = p_user_id;
    v_delta := CASE WHEN p_helpful THEN 2 ELSE -2 END;
  END IF;

  UPDATE qna_answers SET vote_score = vote_score + v_delta WHERE id = p_answer_id;
END;
$$;
