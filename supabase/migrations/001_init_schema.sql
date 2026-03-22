-- ============================================================
-- 001_init_schema.sql
-- 코드없이 — 전체 테이블 생성
-- ============================================================

-- ─────────────────────────────────────────────
-- 핵심 엔티티
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  bio                 TEXT,
  avatar_url          TEXT,
  website_url         TEXT,
  github_handle       TEXT,
  interest_tools      TEXT[],
  interest_cats       TEXT[],
  is_premium          BOOLEAN DEFAULT FALSE,
  premium_until       TIMESTAMPTZ,
  username_changed_at TIMESTAMPTZ,
  follower_count      INT DEFAULT 0,
  following_count     INT DEFAULT 0,
  project_count       INT DEFAULT 0,
  expo_push_token     TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  delete_requested_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  icon_url   TEXT,
  website    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL CHECK (char_length(title) <= 60),
  description       TEXT NOT NULL,
  demo_url          TEXT NOT NULL CHECK (demo_url LIKE 'https://%'),
  github_url        TEXT CHECK (github_url IS NULL OR github_url LIKE 'https://%'),
  thumbnail_url     TEXT,
  category          TEXT,
  like_count        INT DEFAULT 0,
  comment_count     INT DEFAULT 0,
  bookmark_count    INT DEFAULT 0,
  view_count        INT DEFAULT 0,
  prompt_copy_count INT DEFAULT 0,
  is_featured       BOOLEAN DEFAULT FALSE,
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  has_prompt        BOOLEAN DEFAULT FALSE,
  version           TEXT DEFAULT 'v1.0',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('image', 'gif', 'video')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_tools (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tool_id    UUID REFERENCES tools(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tool_id)
);

CREATE TABLE project_drafts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_order    INT NOT NULL,
  tool_name     TEXT,
  content       TEXT NOT NULL,
  result_desc   TEXT,
  is_masked     BOOLEAN DEFAULT FALSE,
  is_public     BOOLEAN DEFAULT FALSE,
  copy_count    INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 1000),
  image_urls    TEXT[],
  tool_tags     TEXT[],
  type          TEXT DEFAULT 'general' CHECK (type IN ('general', 'prompt_share')),
  like_count    INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 소셜 그래프
-- ─────────────────────────────────────────────

CREATE TABLE follows (
  follower_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE TABLE blocks (
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT likes_one_target CHECK (
    (CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN post_id    IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  folder_name TEXT DEFAULT '기본',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 커뮤니티
-- ─────────────────────────────────────────────

CREATE TABLE qna_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  tool_tags    TEXT[],
  image_urls   TEXT[],
  is_resolved  BOOLEAN DEFAULT FALSE,
  answer_count INT DEFAULT 0,
  view_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qna_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qna_questions(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_best     BOOLEAN DEFAULT FALSE,
  vote_score  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qna_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id  UUID NOT NULL REFERENCES qna_answers(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  UNIQUE (answer_id, user_id)
);

CREATE TABLE build_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  did_today    TEXT,
  learned      TEXT,
  next_todo    TEXT,
  progress_pct INT CHECK (progress_pct BETWEEN 0 AND 100),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE build_log_subscriptions (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- ─────────────────────────────────────────────
-- 알림
-- ─────────────────────────────────────────────

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN (
    'like','comment','reply','mention','follow',
    'weekly_best','system','answer','answer_accepted'
  )),
  entity_type  TEXT CHECK (entity_type IN ('project','post','comment','qna','build_log')),
  entity_id    UUID,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_settings (
  user_id       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  like_inapp    BOOLEAN DEFAULT TRUE,
  like_push     BOOLEAN DEFAULT TRUE,
  comment_inapp BOOLEAN DEFAULT TRUE,
  comment_push  BOOLEAN DEFAULT TRUE,
  follow_inapp  BOOLEAN DEFAULT TRUE,
  follow_push   BOOLEAN DEFAULT TRUE,
  mention_inapp BOOLEAN DEFAULT TRUE,
  mention_push  BOOLEAN DEFAULT TRUE,
  system_inapp  BOOLEAN DEFAULT TRUE,
  system_email  BOOLEAN DEFAULT TRUE,
  weekly_email  BOOLEAN DEFAULT TRUE,
  dnd_start     TIME,
  dnd_end       TIME
);

CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios','android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, token)
);

-- ─────────────────────────────────────────────
-- DM (Post-MVP)
-- ─────────────────────────────────────────────

CREATE TABLE dm_rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message  TEXT,
  last_msg_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE dm_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES dm_rooms(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT,
  image_url  TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 매칭 (Post-MVP)
-- ─────────────────────────────────────────────

CREATE TABLE matching_profiles (
  user_id      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('vibe_coder','developer','both')),
  skills       TEXT[],
  interests    TEXT[],
  available    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matching_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  skills_needed TEXT[],
  budget_min   INT,
  budget_max   INT,
  duration_days INT,
  status       TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matching_applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES matching_requests(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message    TEXT,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, applicant_id)
);

-- ─────────────────────────────────────────────
-- 결제
-- ─────────────────────────────────────────────

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('monthly','annual')),
  status          TEXT NOT NULL CHECK (status IN ('trial','active','cancelled','expired')),
  provider        TEXT CHECK (provider IN ('toss','kakao')),
  provider_sub_id TEXT,
  started_at      TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sub_id         UUID REFERENCES subscriptions(id),
  amount         INT NOT NULL,
  currency       TEXT DEFAULT 'KRW',
  status         TEXT NOT NULL CHECK (status IN ('success','failed','refunded')),
  provider       TEXT,
  provider_tx_id TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 관리
-- ─────────────────────────────────────────────

CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project','post','comment','user')),
  entity_id   UUID NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN ('spam','inappropriate','copyright','other')),
  detail      TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_bests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  rank       INT NOT NULL,
  score      INT NOT NULL,
  UNIQUE (project_id, week_start)
);

CREATE TABLE tool_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tool_id, user_id)
);
