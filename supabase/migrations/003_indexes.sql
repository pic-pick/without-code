-- ============================================================
-- 003_indexes.sql
-- 코드없이 — 성능 최적화 인덱스
-- ============================================================

-- ─────────────────────────────────────────────
-- 피드
-- ─────────────────────────────────────────────
CREATE INDEX idx_projects_created_at   ON projects(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_projects_popularity   ON projects(like_count DESC, view_count DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_projects_author       ON projects(author_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_posts_created_at      ON posts(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_posts_author          ON posts(author_id, created_at DESC) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────
-- 툴 태그 필터
-- ─────────────────────────────────────────────
CREATE INDEX idx_project_tools_tool    ON project_tools(tool_id);
CREATE INDEX idx_project_tools_proj    ON project_tools(project_id);

-- ─────────────────────────────────────────────
-- 알림
-- ─────────────────────────────────────────────
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- ─────────────────────────────────────────────
-- 팔로우
-- ─────────────────────────────────────────────
CREATE INDEX idx_follows_follower      ON follows(follower_id);
CREATE INDEX idx_follows_following     ON follows(following_id);

-- ─────────────────────────────────────────────
-- 차단
-- ─────────────────────────────────────────────
CREATE INDEX idx_blocks_blocker        ON blocks(blocker_id);

-- ─────────────────────────────────────────────
-- 댓글
-- ─────────────────────────────────────────────
CREATE INDEX idx_comments_project      ON comments(project_id, created_at) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_post         ON comments(post_id, created_at) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_parent       ON comments(parent_id);

-- ─────────────────────────────────────────────
-- 검색 Full-text Search
-- ─────────────────────────────────────────────
CREATE INDEX idx_projects_fts ON projects USING GIN(
  to_tsvector('simple', title || ' ' || description)
) WHERE is_deleted = FALSE;

CREATE INDEX idx_qna_fts ON qna_questions USING GIN(
  to_tsvector('simple', title || ' ' || content)
);

-- ─────────────────────────────────────────────
-- 주간 베스트
-- ─────────────────────────────────────────────
CREATE INDEX idx_weekly_bests_week     ON weekly_bests(week_start DESC, rank ASC);

-- ─────────────────────────────────────────────
-- 구독·결제
-- ─────────────────────────────────────────────
CREATE INDEX idx_subscriptions_user    ON subscriptions(user_id, status, expires_at);

-- ─────────────────────────────────────────────
-- 신고
-- ─────────────────────────────────────────────
CREATE INDEX idx_reports_status        ON reports(status, created_at) WHERE status = 'pending';

-- ─────────────────────────────────────────────
-- 프로젝트 초안 (본인)
-- ─────────────────────────────────────────────
CREATE INDEX idx_project_drafts_author ON project_drafts(author_id, updated_at DESC);

-- ─────────────────────────────────────────────
-- DM
-- ─────────────────────────────────────────────
CREATE INDEX idx_dm_rooms_user_a       ON dm_rooms(user_a_id);
CREATE INDEX idx_dm_rooms_user_b       ON dm_rooms(user_b_id);
CREATE INDEX idx_dm_messages_room      ON dm_messages(room_id, created_at DESC);

-- ─────────────────────────────────────────────
-- Q&A
-- ─────────────────────────────────────────────
CREATE INDEX idx_qna_questions_author  ON qna_questions(author_id);
CREATE INDEX idx_qna_answers_question  ON qna_answers(question_id);

-- ─────────────────────────────────────────────
-- 빌드 일지
-- ─────────────────────────────────────────────
CREATE INDEX idx_build_logs_project    ON build_logs(project_id, created_at DESC);
