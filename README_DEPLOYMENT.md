# 배포 가이드

## 프론트엔드 (Vercel)

프론트엔드는 Vercel에 자동 배포됩니다.

### Vercel 환경변수 설정
Vercel 대시보드에서 다음 환경변수를 설정하세요:
- `REACT_APP_API_URL`: 백엔드 API URL (예: https://your-backend.herokuapp.com)

## 백엔드 배포 옵션

### 옵션 1: Heroku (추천)
1. Heroku 계정 생성
2. 새 앱 생성
3. 환경변수 설정:
   - `OPENAI_API_KEY`: OpenAI API 키 (필수)
4. Deploy 탭에서 GitHub 연결

### 옵션 2: Railway
1. Railway.app 계정 생성
2. GitHub 리포지토리 연결
3. 환경변수 설정
4. 자동 배포

### 옵션 3: Render
1. Render.com 계정 생성
2. Web Service 생성
3. 환경변수 설정
4. 배포

## 로컬 테스트용 (API 키 없이)

프론트엔드만 테스트하려면:
```bash
cd frontend
npm install
npm run dev
```

백엔드 API 키가 필요한 기능은 작동하지 않지만, UI는 확인할 수 있습니다.