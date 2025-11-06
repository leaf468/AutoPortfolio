# Supabase 로그인 설정 가이드

## 1️⃣ Supabase Dashboard에서 테이블 생성

Supabase Dashboard → SQL Editor에서 다음 SQL 실행:

```sql
-- auth_schema.sql 파일 전체 내용 실행
```

## 2️⃣ Supabase Auth에서 Admin 계정 생성

### 방법 1: Dashboard에서 직접 생성 (가장 쉬움)

1. Supabase Dashboard → Authentication → Users
2. "Add user" 버튼 클릭
3. 정보 입력:
   - Email: `admin@gmail.com`
   - Password: `admin1234`
   - Auto Confirm User: **체크** ✅
4. Create user 클릭

### 방법 2: SQL로 생성

```sql
-- Supabase Auth에 사용자 추가
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    aud,
    role
)
VALUES (
    gen_random_uuid(),
    'admin@gmail.com',
    crypt('admin1234', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    'authenticated',
    'authenticated'
);

-- users 테이블에도 추가
INSERT INTO public.users (email, name, email_verified, is_active)
SELECT
    'admin@gmail.com',
    'Admin',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@gmail.com');

-- user_profiles 테이블에도 추가
INSERT INTO public.user_profiles (user_id, bio)
SELECT
    user_id,
    'System Administrator'
FROM public.users
WHERE email = 'admin@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id IN (SELECT user_id FROM public.users WHERE email = 'admin@gmail.com'));
```

## 3️⃣ Supabase 설정 확인

Dashboard → Settings → API에서:
- Project URL: `https://hurxlrytzacwsyftewik.supabase.co` ✅
- anon/public key: 이미 .env에 설정됨 ✅

## 4️⃣ 이메일 확인 비활성화 (선택사항)

개발 중에는 이메일 확인을 비활성화하는 것이 편합니다:

1. Dashboard → Authentication → Settings
2. "Enable email confirmations" 옵션을 **OFF**로 설정
3. 저장

## ✅ 완료!

이제 로그인 페이지에서 다음으로 로그인 가능:
- Email: `admin@gmail.com`
- Password: `admin1234`
