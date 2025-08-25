# Careeroad Portfolio Assistant 🚀

AI 기반 자동 포트폴리오 생성 웹서비스

## 📋 주요 기능

- **AI 자동 생성**: 간단한 정보 입력만으로 전문적인 포트폴리오 자동 생성
- **스마트 추천**: 부족한 내용 자동 파악 및 개선 방향 제시
- **다양한 형식 지원**: 마크다운, HTML, PDF 형식으로 즉시 변환
- **실시간 AI 어시스턴트**: 채팅 기반 포트폴리오 작성 도우미
- **템플릿 시스템**: 다양한 디자인 템플릿 제공

## 🛠 기술 스택

### Backend
- FastAPI (Python)
- Pydantic
- WeasyPrint (PDF 생성)
- Markdown to HTML 변환
- Redis (캐싱)
- PostgreSQL (데이터베이스)

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Router
- React Query (TanStack Query)
- Framer Motion (애니메이션)
- Heroicons

### Infrastructure
- Docker & Docker Compose
- Nginx (리버스 프록시)

## 🚀 시작하기

### 사전 요구사항
- Docker & Docker Compose
- Node.js 18+ (개발 환경)
- Python 3.11+ (개발 환경)
- OpenAI API Key (AI 기능 사용 시)

### 설치 및 실행

1. **프로젝트 클론**
```bash
git clone <repository-url>
cd careeroad-portfolio
```

2. **환경 설정**
```bash
# 백엔드 환경 변수 설정
cp backend/.env.example backend/.env
# OpenAI API 키 설정 (backend/.env 파일에서)

# 프론트엔드 환경 변수 설정 (필요시)
cp frontend/.env.example frontend/.env
```

3. **개발 환경에서 실행**

**방법 1: 프론트엔드만 실행 (추천)**
```bash
cd frontend
npm install
npm run dev
```

**방법 2: 전체 서비스 실행**
```bash
# 의존성 설치
npm install -g concurrently
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# 전체 서비스 동시 실행
npm run dev
```

**방법 3: Docker Compose**
```bash
docker-compose up --build
```

### 접속 URL
- **Frontend**: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 사용법

1. **템플릿 업로드**: 마크다운 포트폴리오 템플릿 업로드 또는 기본 템플릿 선택
2. **정보 입력**: 자유로운 형식으로 경력, 프로젝트, 기술스택 등 입력
3. **AI 상담**: AI가 부족한 정보에 대해 질문하며 정보 수집
4. **포트폴리오 생성**: 완성된 정보로 전문적인 포트폴리오 자동 생성

## 🤖 AI 기능

- **OpenAI GPT-4** 기반 텍스트 파싱 및 정보 추출
- **지능형 질문 생성** - 부족한 정보 자동 식별 및 맞춤 질문
- **대화형 인터페이스** - 자연스러운 대화로 정보 수집
- **자동 내용 개선** - 전문적인 표현으로 포트폴리오 품질 향상

## 📁 프로젝트 구조

```
careeroad-portfolio/
├── backend/
│   ├── main.py              # FastAPI 메인 애플리케이션
│   ├── requirements.txt     # Python 의존성
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # API 서비스
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── App.tsx         # 메인 앱 컴포넌트
│   ├── package.json
│   └── Dockerfile
├── templates/              # 포트폴리오 템플릿
├── docker-compose.yml      # Docker Compose 설정
├── nginx.conf             # Nginx 설정
└── README.md
```

## 🔧 API 엔드포인트

### 포트폴리오 생성
- `POST /api/generate` - 포트폴리오 생성
- `POST /api/analyze` - 포트폴리오 데이터 분석
- `GET /api/download/{id}` - 포트폴리오 다운로드
- `GET /api/preview/{id}` - 포트폴리오 미리보기

### 템플릿
- `GET /api/templates` - 템플릿 목록 조회

### AI 어시스턴트
- `POST /api/chat` - AI 어시스턴트와 대화

## 💡 사용 방법

1. **기본 정보 입력**: 이름, 직무, 연락처 등 기본 정보 입력
2. **경력사항 추가**: 회사, 직책, 업무 내용 및 성과 입력
3. **프로젝트 등록**: 개인/팀 프로젝트 상세 정보 입력
4. **학력 정보**: 학교, 전공, 학위 정보 입력
5. **기술 스택**: 보유 기술 및 숙련도 입력
6. **생성 및 다운로드**: 원하는 형식으로 포트폴리오 생성 및 다운로드

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 📧 문의

프로젝트 관련 문의사항은 Issues 탭을 이용해주세요.