-- 007_onboarding_fields.sql
-- profiles 테이블에 온보딩 완료 추적 컬럼 추가

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_agreed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_agreed      boolean NOT NULL DEFAULT false;

-- 기존 유저(소셜 로그인 완료 + username 설정된 경우) 온보딩 완료 처리
UPDATE profiles
SET onboarding_completed = true
WHERE username IS NOT NULL
  AND interest_tools IS NOT NULL
  AND array_length(interest_tools, 1) > 0;
