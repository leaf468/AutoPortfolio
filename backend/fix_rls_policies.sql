-- RLS 정책 문제 해결을 위한 SQL
-- 기존 정책 삭제 후 재생성

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS select_own_feedback ON cover_letter_feedback;
DROP POLICY IF EXISTS insert_own_feedback ON cover_letter_feedback;
DROP POLICY IF EXISTS update_own_feedback ON cover_letter_feedback;

-- 2. RLS 비활성화 (임시 - 테스트용)
ALTER TABLE cover_letter_feedback DISABLE ROW LEVEL SECURITY;

-- 3. 또는 모든 사용자에게 권한 허용 (개발용)
-- ALTER TABLE cover_letter_feedback ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY allow_all_feedback ON cover_letter_feedback FOR ALL USING (true) WITH CHECK (true);

-- 4. 제대로 작동하는 RLS 정책 (Supabase Auth 사용 시)
-- ALTER TABLE cover_letter_feedback ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY select_own_feedback ON cover_letter_feedback
--     FOR SELECT
--     USING (user_id::text = auth.jwt() ->> 'sub');
--
-- CREATE POLICY insert_own_feedback ON cover_letter_feedback
--     FOR INSERT
--     WITH CHECK (user_id::text = auth.jwt() ->> 'sub');
--
-- CREATE POLICY update_own_feedback ON cover_letter_feedback
--     FOR UPDATE
--     USING (user_id::text = auth.jwt() ->> 'sub');

-- ============================================
-- 확인 쿼리
-- ============================================

-- RLS 상태 확인
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'cover_letter_feedback';

-- 현재 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'cover_letter_feedback';
