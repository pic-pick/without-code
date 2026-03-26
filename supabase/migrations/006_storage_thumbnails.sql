-- ============================================================
-- 006_storage_thumbnails.sql
-- Supabase Storage — thumbnails 버킷 생성 + RLS 정책
-- ============================================================

-- 버킷 생성 (공개, 5MB 제한)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,                          -- 공개 버킷 (CDN을 통해 직접 접근 가능)
  5242880,                       -- 5MB (5 * 1024 * 1024)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ── RLS 정책 ──────────────────────────────────────────────

-- 공개 읽기: 누구나 파일 조회 가능
create policy "thumbnails: 공개 읽기"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

-- 인증된 유저만 업로드 가능
-- 경로 규칙: {userId}/{파일명} — 본인 폴더에만 쓰기 허용
create policy "thumbnails: 본인 폴더 업로드"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 수정 가능
create policy "thumbnails: 본인 파일 수정"
  on storage.objects for update
  using (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 삭제 가능
create policy "thumbnails: 본인 파일 삭제"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
