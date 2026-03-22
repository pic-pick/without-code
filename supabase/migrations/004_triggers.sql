-- ============================================================
-- 004_triggers.sql
-- 코드없이 — 카운터 자동 집계 + 알림 자동 생성 트리거
-- ============================================================

-- ─────────────────────────────────────────────
-- updated_at 자동 갱신 함수
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_project_drafts_updated_at
  BEFORE UPDATE ON project_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- 좋아요 카운터
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.project_id IS NOT NULL THEN
      UPDATE projects SET like_count = like_count + 1 WHERE id = NEW.project_id;
    ELSIF NEW.post_id IS NOT NULL THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.project_id IS NOT NULL THEN
      UPDATE projects SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.project_id;
    ELSIF OLD.post_id IS NOT NULL THEN
      UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION handle_like_count();

-- ─────────────────────────────────────────────
-- 댓글 카운터
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.project_id IS NOT NULL THEN
      UPDATE projects SET comment_count = comment_count + 1 WHERE id = NEW.project_id;
    ELSIF NEW.post_id IS NOT NULL THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    IF OLD.project_id IS NOT NULL THEN
      UPDATE projects SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.project_id;
    ELSIF OLD.post_id IS NOT NULL THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comment_count
  AFTER INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_count();

-- ─────────────────────────────────────────────
-- 북마크 카운터
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.project_id IS NOT NULL THEN
    UPDATE projects SET bookmark_count = bookmark_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' AND OLD.project_id IS NOT NULL THEN
    UPDATE projects SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_bookmark_count
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION handle_bookmark_count();

-- ─────────────────────────────────────────────
-- 팔로우 카운터
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follow_count
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_count();

-- ─────────────────────────────────────────────
-- 프로젝트 카운터 (profile)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_project_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET project_count = project_count + 1 WHERE id = NEW.author_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    UPDATE profiles SET project_count = GREATEST(project_count - 1, 0) WHERE id = OLD.author_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_project_count
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_project_count();

-- ─────────────────────────────────────────────
-- 알림 자동 INSERT 트리거
-- ─────────────────────────────────────────────

-- 좋아요 알림
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  target_author UUID;
  target_entity_type TEXT;
  target_entity_id UUID;
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    SELECT author_id INTO target_author FROM projects WHERE id = NEW.project_id;
    target_entity_type := 'project';
    target_entity_id   := NEW.project_id;
  ELSIF NEW.post_id IS NOT NULL THEN
    SELECT author_id INTO target_author FROM posts WHERE id = NEW.post_id;
    target_entity_type := 'post';
    target_entity_id   := NEW.post_id;
  ELSE
    RETURN NULL;
  END IF;

  -- 자기 자신 좋아요는 알림 제외
  IF target_author IS NOT NULL AND target_author != NEW.user_id THEN
    INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id)
    VALUES (target_author, NEW.user_id, 'like', target_entity_type, target_entity_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- 댓글 알림
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  target_author UUID;
  target_entity_type TEXT;
  target_entity_id UUID;
  notif_type TEXT;
BEGIN
  -- 대댓글인 경우
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO target_author FROM comments WHERE id = NEW.parent_id;
    notif_type := 'reply';
    target_entity_type := 'comment';
    target_entity_id   := NEW.parent_id;
  ELSIF NEW.project_id IS NOT NULL THEN
    SELECT author_id INTO target_author FROM projects WHERE id = NEW.project_id;
    notif_type := 'comment';
    target_entity_type := 'project';
    target_entity_id   := NEW.project_id;
  ELSIF NEW.post_id IS NOT NULL THEN
    SELECT author_id INTO target_author FROM posts WHERE id = NEW.post_id;
    notif_type := 'comment';
    target_entity_type := 'post';
    target_entity_id   := NEW.post_id;
  ELSE
    RETURN NULL;
  END IF;

  IF target_author IS NOT NULL AND target_author != NEW.author_id THEN
    INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id)
    VALUES (target_author, NEW.author_id, notif_type, target_entity_type, target_entity_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 팔로우 알림
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', NULL, NULL);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Q&A 답변 알림
CREATE OR REPLACE FUNCTION notify_on_qna_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_author UUID;
BEGIN
  SELECT author_id INTO question_author FROM qna_questions WHERE id = NEW.question_id;
  IF question_author IS NOT NULL AND question_author != NEW.author_id THEN
    INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id)
    VALUES (question_author, NEW.author_id, 'answer', 'qna', NEW.question_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_qna_answer
  AFTER INSERT ON qna_answers
  FOR EACH ROW EXECUTE FUNCTION notify_on_qna_answer();

-- Q&A 답변 채택 알림
CREATE OR REPLACE FUNCTION notify_on_best_answer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_best = TRUE AND OLD.is_best = FALSE THEN
    INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id)
    VALUES (
      NEW.author_id,
      (SELECT author_id FROM qna_questions WHERE id = NEW.question_id),
      'answer_accepted',
      'qna',
      NEW.question_id
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_best_answer
  AFTER UPDATE ON qna_answers
  FOR EACH ROW EXECUTE FUNCTION notify_on_best_answer();

-- 신규 유저 → notification_settings 자동 생성
CREATE OR REPLACE FUNCTION create_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_notification_settings
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_notification_settings();
