// 필드 기반 자소서 작성 타입 정의

/**
 * 지원 동기 필드
 */
export interface MotivationFields {
  companyName: string;           // 회사명 (예: 네이버, 카카오)
  position: string;              // 직무명 (예: 백엔드 개발자)
  whenKnew: string;              // 언제 알게 되었는지 (예: 대학교 2학년 때)
  whatAttracted: string;         // 무엇이 매력적이었는지 (예: 기술 스택, 기업 문화, 제품)
  whyThis: string;               // 왜 이 회사/직무인지 (예: 나의 강점과 회사의 방향성이 일치)
  personalGoal: string;          // 개인 목표 (예: AI 전문가로 성장)
  howAlign: string;              // 회사와 목표의 연결점 (예: 회사의 AI 연구 부서에서 경험을 쌓고 싶음)
}

/**
 * 경험/프로젝트 필드
 */
export interface ExperienceFields {
  projectName: string;           // 프로젝트명 (예: 실시간 채팅 서비스 구축)
  period: string;                // 기간 (예: 2023.03 - 2023.06, 3개월)
  teamSize: string;              // 팀 규모 (예: 4명)
  myRole: string;                // 본인 역할 (예: 백엔드 개발 및 DB 설계)
  technologies: string[];        // 사용 기술 (예: [Node.js, Socket.io, Redis, MongoDB])
  problem: string;               // 해결하려던 문제 (예: 기존 시스템의 느린 응답 속도)
  solution: string;              // 해결 방법 (예: WebSocket 도입 및 Redis 캐싱)
  achievementMetric: string;     // 성과 수치 (예: 응답 속도 70% 개선, 동시 접속자 500명 처리)
  difficulty: string;            // 어려웠던 점 (예: 동시성 제어 및 메모리 최적화)
  howOvercome: string;           // 극복 방법 (예: 이벤트 루프 학습 및 성능 테스트)
  lesson: string;                // 배운 점 (예: 비동기 프로그래밍의 중요성)
  additionalExperience?: string; // 추가 경험 및 스토리 연결 (선택)
}

/**
 * 강점 필드
 */
export interface StrengthFields {
  mainStrength: string;          // 핵심 강점 (예: 빠른 문제 해결 능력)
  whyStrength: string;           // 왜 강점인지 (예: 복잡한 버그를 분석하고 근본 원인을 찾는 데 능숙)
  when: string;                  // 언제 발휘했는지 (예: 프로젝트 마감 1주일 전)
  situation: string;             // 상황 설명 (예: 서버 다운 이슈 발생)
  action: string;                // 행동 (예: 로그 분석 및 메모리 누수 원인 파악)
  result: string;                // 결과 (예: 2시간 만에 해결, 서비스 정상화)
  feedback: string;              // 피드백/인정 (예: 팀장에게 문제 해결 능력을 인정받음)
  relevance: string;             // 직무 연관성 (예: 백엔드 개발자로서 안정성 확보에 기여 가능)
  additionalStrengths?: string;  // 추가 강점 및 스토리 연결 (선택)
}

/**
 * 포부 필드
 */
export interface VisionFields {
  shortTermGoal: string;         // 단기 목표 (예: 입사 후 6개월 내 주요 서비스 코드베이스 이해)
  shortTermAction: string;       // 단기 실행 계획 (예: 코드 리뷰 적극 참여 및 선배 개발자 멘토링)
  mediumTermGoal: string;        // 중기 목표 (예: 1-2년 내 신규 기능 개발 리드)
  mediumTermAction: string;      // 중기 실행 계획 (예: 프로젝트 매니지먼트 역량 강화)
  longTermVision: string;        // 장기 비전 (예: 3-5년 내 기술 리더로 성장)
  longTermAction: string;        // 장기 실행 계획 (예: 아키텍처 설계 및 팀 성장 기여)
  companyContribution: string;   // 회사 기여 방안 (예: 백엔드 성능 최적화로 사용자 경험 개선)
  specificValue: string;         // 구체적 가치 (예: 트래픽 처리량 2배 증대)
}

/**
 * 성장 과정 필드
 */
export interface GrowthFields {
  backgroundSummary: string;      // 성장 배경 요약
  keyEvent: string;               // 영향을 준 핵심 사건
  whenOccurred: string;           // 언제 발생했는지
  whatHappened: string;           // 무슨 일이 있었는지
  howInfluenced: string;          // 어떤 영향을 받았는지
  currentImpact: string;          // 현재에 미친 영향
  relatedValue: string;           // 형성된 가치관
}

/**
 * 실패/극복 경험 필드
 */
export interface FailureFields {
  situationDesc: string;          // 상황 설명
  whatFailed: string;             // 무엇이 실패했는지
  whyFailed: string;              // 왜 실패했는지
  emotionalImpact: string;        // 감정적 영향
  turningPoint: string;           // 전환점
  actionTaken: string;            // 극복을 위한 행동
  result: string;                 // 결과
  lessonLearned: string;          // 배운 점
  howApply: string;               // 현재/미래 적용 방안
}

/**
 * 협업/리더십 필드
 */
export interface TeamworkFields {
  projectContext: string;         // 프로젝트 배경
  teamSize: string;               // 팀 규모
  myRole: string;                 // 본인의 역할
  challenge: string;              // 어려움/갈등 상황
  whyDifficult: string;           // 왜 어려웠는지
  approach: string;               // 해결 접근법
  communicationMethod: string;    // 소통 방식
  result: string;                 // 결과
  teamFeedback: string;           // 팀원 피드백
  lessonsOnTeamwork: string;      // 협업에 대한 배움
}

/**
 * 갈등 해결 필드
 */
export interface ConflictFields {
  situation: string;              // 갈등 상황
  parties: string;                // 갈등 당사자들
  cause: string;                  // 갈등 원인
  myPosition: string;             // 나의 입장
  otherPosition: string;          // 상대방의 입장
  approachTaken: string;          // 해결 접근 방법
  communication: string;          // 소통 과정
  compromise: string;             // 타협점/해결책
  outcome: string;                // 결과
  lessonsLearned: string;         // 배운 점
}

/**
 * 필드 타입 (어떤 질문 유형인지)
 */
export type FieldType =
  | 'motivation'      // 지원 동기
  | 'experience'      // 경험/프로젝트
  | 'strength'        // 강점/역량
  | 'vision'          // 입사 후 포부
  | 'growth'          // 성장 과정
  | 'failure'         // 실패/극복
  | 'teamwork'        // 협업/리더십
  | 'conflict'        // 갈등 해결
  | 'custom';         // 사용자 정의

/**
 * 필드 기반 질문
 */
export interface FieldBasedQuestion {
  id: string;
  question: string;
  fieldType: FieldType;
  fields:
    | MotivationFields
    | ExperienceFields
    | StrengthFields
    | VisionFields
    | GrowthFields
    | FailureFields
    | TeamworkFields
    | ConflictFields
    | Record<string, any>;
  generatedAnswer: string;       // 필드로부터 생성된 답변
  editedAnswer?: string;         // 사용자가 직접 수정한 답변
  maxLength?: number;
  customFieldDefinitions?: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea';
    placeholder: string;
    required: boolean;
  }>;                            // 커스텀 필드 정의 (fieldType === 'custom'일 때)
  customExplanation?: string;    // 커스텀 질문 작성 가이드
}

/**
 * AI 피드백
 */
export interface AIFeedback {
  questionId: string;
  score: number;                 // 점수 (0-100)
  strengths: string[];           // 강점
  improvements: string[];        // 개선점
  suggestions: string[];         // 구체적 제안
  generatedAt: Date;
}

/**
 * 필드 기반 자소서 문서
 */
export interface FieldBasedCoverLetter {
  documentId?: number;
  userId?: string;
  companyName: string;
  position: string;
  questions: FieldBasedQuestion[];
  feedbacks: AIFeedback[];
  createdAt: Date;
  updatedAt: Date;
}
