-- ============================================================
-- 002_rls_policies.sql
-- 코드없이 — RLS 전체 정책
-- 원칙: 읽기 공개 / 쓰기 auth.uid() 검증 / 차단 필터는 앱 레이어
-- ============================================================

-- RLS 활성화
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_drafts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_prompts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows              ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_votes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_log_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_bests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools                ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"    ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────────────────────
-- tools (읽기 전용 공개)
-- ─────────────────────────────────────────────
CREATE POLICY "tools_select_public" ON tools FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
CREATE POLICY "projects_select_public" ON projects FOR SELECT
  USING (
    is_deleted = FALSE AND (
      auth.uid() IS NULL OR
      author_id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
      )
    )
  );
CREATE POLICY "projects_select_own_deleted" ON projects FOR SELECT
  USING (auth.uid() = author_id);
CREATE POLICY "projects_insert_own" ON projects FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "projects_update_own" ON projects FOR UPDATE
  USING (auth.uid() = author_id);

-- ─────────────────────────────────────────────
-- project_media
-- ─────────────────────────────────────────────
CREATE POLICY "project_media_select_public" ON project_media FOR SELECT USING (true);
CREATE POLICY "project_media_insert_own" ON project_media FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT author_id FROM projects WHERE id = project_id)
  );
CREATE POLICY "project_media_delete_own" ON project_media FOR DELETE
  USING (
    auth.uid() = (SELECT author_id FROM projects WHERE id = project_id)
  );

-- ─────────────────────────────────────────────
-- project_tools
-- ─────────────────────────────────────────────
CREATE POLICY "project_tools_select_public" ON project_tools FOR SELECT USING (true);
CREATE POLICY "project_tools_insert_own" ON project_tools FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT author_id FROM projects WHERE id = project_id)
  );
CREATE POLICY "project_tools_delete_own" ON project_tools FOR DELETE
  USING (
    auth.uid() = (SELECT author_id FROM projects WHERE id = project_id)
  );

-- ─────────────────────────────────────────────
-- project_drafts (본인만)
-- ─────────────────────────────────────────────
CREATE POLICY "project_drafts_own" ON project_drafts FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- ─────────────────────────────────────────────
-- project_prompts
-- ─────────────────────────────────────────────
CREATE POLICY "project_prompts_select_public" ON project_prompts FOR SELECT
  USING (is_public = TRUE OR auth.uid() = (SELECT author_id FROM projects WHERE id = project_id));
CREATE POLICY "project_prompts_insert_own" ON project_prompts FOR INSERT
  WITH CHECK (auth.uid() = (SELECT author_id FROM projects WHERE id = project_id));
CREATE POLICY "project_prompts_update_own" ON project_prompts FOR UPDATE
  USING (auth.uid() = (SELECT author_id FROM projects WHERE id = project_id));
CREATE POLICY "project_prompts_delete_own" ON project_prompts FOR DELETE
  USING (auth.uid() = (SELECT author_id FROM projects WHERE id = project_id));

-- ─────────────────────────────────────────────
-- posts
-- ─────────────────────────────────────────────
CREATE POLICY "posts_select_public" ON posts FOR SELECT
  USING (
    is_deleted = FALSE AND (
      auth.uid() IS NULL OR
      author_id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
      )
    )
  );
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- ─────────────────────────────────────────────
-- follows
-- ─────────────────────────────────────────────
CREATE POLICY "follows_select_public" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ─────────────────────────────────────────────
-- blocks
-- ─────────────────────────────────────────────
CREATE POLICY "blocks_select_own" ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ─────────────────────────────────────────────
-- likes
-- ─────────────────────────────────────────────
CREATE POLICY "likes_select_public" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- comments
-- ─────────────────────────────────────────────
CREATE POLICY "comments_select_public" ON comments FOR SELECT
  USING (is_deleted = FALSE);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  USING (auth.uid() = author_id);

-- ─────────────────────────────────────────────
-- bookmarks (본인만)
-- ─────────────────────────────────────────────
CREATE POLICY "bookmarks_own" ON bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- notifications (수신자만)
-- ─────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ─────────────────────────────────────────────
-- notification_settings (본인만)
-- ─────────────────────────────────────────────
CREATE POLICY "notification_settings_own" ON notification_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- push_tokens (본인만)
-- ─────────────────────────────────────────────
CREATE POLICY "push_tokens_own" ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- qna
-- ─────────────────────────────────────────────
CREATE POLICY "qna_questions_select_public" ON qna_questions FOR SELECT USING (true);
CREATE POLICY "qna_questions_insert_own" ON qna_questions FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "qna_questions_update_own" ON qna_questions FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "qna_answers_select_public" ON qna_answers FOR SELECT USING (true);
CREATE POLICY "qna_answers_insert_own" ON qna_answers FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "qna_answers_update_own" ON qna_answers FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "qna_votes_select_public" ON qna_votes FOR SELECT USING (true);
CREATE POLICY "qna_votes_insert_own" ON qna_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qna_votes_delete_own" ON qna_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- build_logs
-- ─────────────────────────────────────────────
CREATE POLICY "build_logs_select_public" ON build_logs FOR SELECT USING (true);
CREATE POLICY "build_logs_insert_own" ON build_logs FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "build_logs_update_own" ON build_logs FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "build_log_subscriptions_own" ON build_log_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- DM (본인 채팅방만)
-- ─────────────────────────────────────────────
CREATE POLICY "dm_rooms_own" ON dm_rooms FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "dm_rooms_insert_own" ON dm_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_a_id);

CREATE POLICY "dm_messages_select_own" ON dm_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_a_id FROM dm_rooms WHERE id = room_id
      UNION
      SELECT user_b_id FROM dm_rooms WHERE id = room_id
    )
  );
CREATE POLICY "dm_messages_insert_own" ON dm_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ─────────────────────────────────────────────
-- 신고 (본인 신고만 조회, 삽입 인증 필요)
-- ─────────────────────────────────────────────
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ─────────────────────────────────────────────
-- weekly_bests (공개 읽기)
-- ─────────────────────────────────────────────
CREATE POLICY "weekly_bests_select_public" ON weekly_bests FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- tool_reviews
-- ─────────────────────────────────────────────
CREATE POLICY "tool_reviews_select_public" ON tool_reviews FOR SELECT USING (true);
CREATE POLICY "tool_reviews_insert_own" ON tool_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tool_reviews_update_own" ON tool_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- subscriptions / payment_logs (본인만)
-- ─────────────────────────────────────────────
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "payment_logs_select_own" ON payment_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- matching
-- ─────────────────────────────────────────────
CREATE POLICY "matching_profiles_select_public" ON matching_profiles FOR SELECT USING (true);
CREATE POLICY "matching_profiles_own" ON matching_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "matching_profiles_update_own" ON matching_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "matching_requests_select_public" ON matching_requests FOR SELECT USING (true);
CREATE POLICY "matching_requests_insert_own" ON matching_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "matching_applications_select_own" ON matching_applications FOR SELECT
  USING (
    auth.uid() = applicant_id OR
    auth.uid() = (SELECT requester_id FROM matching_requests WHERE id = request_id)
  );
CREATE POLICY "matching_applications_insert_own" ON matching_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);
