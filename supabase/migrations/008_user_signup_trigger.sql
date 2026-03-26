-- 008_user_signup_trigger.sql
-- OAuth 신규 가입 시 profiles 행 자동 생성

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username  text;
  _display   text;
  _avatar    text;
BEGIN
  -- OAuth 메타데이터에서 기본값 추출
  _display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- username: 이메일 앞부분 정제 (영문·숫자·밑줄만)
  _username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'));
  -- 중복 시 뒤에 숫자 붙이기
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
    _username := _username || floor(random() * 9000 + 1000)::text;
  END LOOP;

  _avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    onboarding_completed,
    created_at
  ) VALUES (
    NEW.id,
    _username,
    _display,
    _avatar,
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users INSERT 시 트리거 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
