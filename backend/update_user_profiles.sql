-- user_profiles 테이블에 필요한 컬럼 추가

-- 기존 컬럼 유지하면서 새 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS company VARCHAR(200),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS major VARCHAR(100),
ADD COLUMN IF NOT EXISTS grade VARCHAR(20),
ADD COLUMN IF NOT EXISTS gpa VARCHAR(20),
ADD COLUMN IF NOT EXISTS toeic VARCHAR(20),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS others JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;

-- 중복된 user_id 제거 (가장 최근 것만 남김)
DELETE FROM user_profiles a USING user_profiles b
WHERE a.profile_id < b.profile_id
AND a.user_id = b.user_id;

-- user_id에 UNIQUE 제약조건 추가 (upsert를 위해 필요)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_user_profile'
    ) THEN
        ALTER TABLE user_profiles
        ADD CONSTRAINT unique_user_profile UNIQUE (user_id);
    END IF;
END $$;
