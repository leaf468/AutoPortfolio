-- password_hash 필드를 NULL 허용으로 변경
-- Supabase Auth를 사용하므로 password_hash는 선택사항입니다
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
