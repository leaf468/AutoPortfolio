# AI Portfolio Assistant 🚀

OpenAI GPT-4 기반 자동 포트폴리오 생성 웹서비스

## 📋 주요 기능

- **AI 자동 생성**: 간단한 정보 입력만으로 전문적인 포트폴리오 자동 생성
- **스마트 추천**: 부족한 내용 자동 파악 및 개선 방향 제시
- **다양한 형식 지원**: 마크다운, HTML, PDF 형식으로 즉시 변환
- **실시간 AI 어시스턴트**: 채팅 기반 포트폴리오 작성 도우미
- **템플릿 시스템**: 다양한 디자인 템플릿 제공

## 🛠 기술 스택

- **React 18 + TypeScript** - 모던 프론트엔드 프레임워크
- **OpenAI GPT-4 API** - AI 텍스트 생성 및 분석
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **React Query** - 서버 상태 관리
- **Framer Motion** - 부드러운 애니메이션
- **Mustache** - 템플릿 렌더링

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- OpenAI API Key (필수)

### 설치 및 실행

1. **프로젝트 클론**
```bash
git clone https://github.com/leaf468/AutoPortfolio.git
cd AutoPortfolio
```

2. **환경 설정**
```bash
# 환경 변수 파일 생성
cp frontend/.env.example frontend/.env

# .env 파일에서 OpenAI API 키 설정
# REACT_APP_OPENAI_API_KEY=your-api-key-here
```

3. **개발 환경에서 실행**
```bash
# 프론트엔드 폴더로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 접속 URL
- **개발 서버**: http://localhost:3000

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
AutoPortfolio/
├── frontend/
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── InteractiveChatbot.tsx
│   │   │   ├── TemplateUpload.tsx
│   │   │   └── TextDumpInput.tsx
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # 서비스
│   │   │   ├── aiService.ts     # OpenAI 통합
│   │   │   └── api.ts           # API 래퍼
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── App.tsx         # 메인 앱 컴포넌트
│   └── package.json
├── vercel.json            # Vercel 배포 설정
└── README.md
```

## 🔧 주요 기능 설명

### AI 서비스 (프론트엔드 통합)
- **텍스트 파싱**: 자유형식 텍스트를 구조화된 데이터로 변환
- **질문 생성**: 부족한 정보에 대한 스마트한 질문 생성
- **답변 처리**: 사용자 답변을 포트폴리오 데이터에 통합
- **포트폴리오 생성**: Mustache 템플릿을 사용한 동적 렌더링
- **내용 개선**: GPT-4를 통한 전문적인 표현 최적화

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