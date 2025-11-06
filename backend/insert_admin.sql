-- Admin 계정 추가
-- 이메일: admin@gmail.com
-- 비밀번호: admin1234 (bcrypt 해시)

-- bcrypt 해시 생성 (rounds=10):
-- 비밀번호 'admin1234'의 bcrypt 해시
-- $2b$10$rG5J5kZQZ9X8qHYvK6vF1eMJzJwXQxZ5XKxVvGx1FzYxZKxVvGx1F (예시)

-- 실제 bcrypt 해시는 Node.js에서 생성해야 합니다:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('admin1234', 10);

-- PostgreSQL용 INSERT 문
INSERT INTO users (email, password_hash, name, email_verified, is_active)
VALUES (
    'admin@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye', -- 이 부분은 실제 bcrypt 해시로 교체 필요
    'Admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- 프로필도 같이 생성
INSERT INTO user_profiles (user_id, bio)
SELECT user_id, 'System Administrator'
FROM users
WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;
