-- ============================================
-- Admin 계정 추가
-- ============================================
-- 로그인 정보:
-- 이메일: admin@gmail.com
-- 비밀번호: admin1234
-- ============================================

-- Admin 사용자 추가
INSERT INTO users (email, password_hash, name, email_verified, is_active)
VALUES (
    'admin@gmail.com',
    '$2b$10$lPODc.pEqPmFboAUQkRBO.LJ65jkoYIHSfRD6rdBP794iT9Yz41mC',
    'Admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Admin 프로필 추가
INSERT INTO user_profiles (user_id, bio, skills, interests)
SELECT
    user_id,
    'System Administrator',
    '["PostgreSQL", "React", "Node.js"]'::jsonb,
    '["시스템 관리", "웹 개발"]'::jsonb
FROM users
WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;

-- 확인 쿼리
SELECT
    u.user_id,
    u.email,
    u.name,
    u.email_verified,
    u.is_active,
    u.created_at
FROM users u
WHERE u.email = 'admin@gmail.com';
