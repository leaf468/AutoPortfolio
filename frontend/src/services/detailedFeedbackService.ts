import OpenAI from 'openai';
import { CoverLetterQuestion } from '../components/CoverLetterQuestionInput';
import { getComprehensiveStats } from './comprehensiveAnalysisService';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export interface DetailedQuestionFeedback {
  questionNumber: number;
  question: string;
  answer: string;
  userAnswer: string; // 사용자 원본 답변

  // 종합 평가
  overallScore: number; // 0-100
  overallSummary: string;

  // 상세 분석 (점수 세분화)
  structureAnalysis: {
    totalScore: number; // 총점
    logic: { score: number; feedback: string }; // 논리성
    consistency: { score: number; feedback: string }; // 일관성
    completeness: { score: number; feedback: string }; // 완결성
    suggestions: string[];
  };

  contentAnalysis: {
    totalScore: number; // 총점
    specificity: { score: number; feedback: string }; // 구체성
    relevance: { score: number; feedback: string }; // 직무연관성
    differentiation: { score: number; feedback: string }; // 차별성
    strengths: string[];
    weaknesses: string[];
  };

  expressionAnalysis: {
    totalScore: number; // 총점
    writing: { score: number; feedback: string }; // 문장력
    vocabulary: { score: number; feedback: string }; // 어휘력
    readability: { score: number; feedback: string }; // 가독성
    improvements: string[];
  };

  jobFitAnalysis: {
    totalScore: number; // 총점
    expertise: { score: number; feedback: string }; // 전문성
    passion: { score: number; feedback: string }; // 열정
    growth: { score: number; feedback: string }; // 성장가능성
  };

  // 합격자 비교 (익명화된 통계 데이터)
  competitorComparison: {
    specComparison: {
      gpa: string; // 예: "합격자 평균 3.8 대비 귀하 3.5"
      toeic: string;
      certificates: string;
    };
    activityComparison: {
      quantity: string; // 활동 개수 비교
      quality: string; // 활동 깊이 비교
      relevance: string; // 직무 연관성 비교
    };
    summary: string;
    missingElements: string[];
    recommendations: string[];
  };

  // 수정 제안
  revisedVersion: string;
  keyImprovements: string[];
}

export interface CompleteFeedbackReport {
  position: string;
  totalQuestions: number;
  averageScore: number;
  questionFeedbacks: DetailedQuestionFeedback[];
  overallRecommendations: string[];
  createdAt: string;
}

/**
 * 각 질문에 대한 상세 첨삭 생성
 */
export async function generateDetailedFeedback(
  question: CoverLetterQuestion,
  questionNumber: number,
  position: string,
  allQuestions: CoverLetterQuestion[]
): Promise<DetailedQuestionFeedback> {
  try {
    // 합격자 통계 가져오기 (익명화 스킵 - 속도 향상)
    const stats = await getComprehensiveStats(position, true);

    const prompt = `당신은 글로벌 기업 ${position} 직무 채용 책임자로 15년 경력의 시니어 HR 매니저입니다.
매년 1,000명 이상 평가, 300명 이상의 합격자를 직접 선발한 채용 전문가로서 평가합니다.

# 평가자 프로필
- **경력**: ${position} 채용 15년, 산업 통찰 20년
- **전문성**: 실무팀 협업, 합격자 성과 추적 데이터 보유
- **철학**:
  1. 합격자 기준 벤치마크 (상대평가 100%)
  2. 구체적 증거 기반 평가 (주관 배제)
  3. 실무 기여도 예측 (입사 후 성과)
  4. 개선 가능성 고려 (현재 + 잠재력)

# 평가 대상
**직무**: ${position}
**질문**: ${question.question}
**답변**:
${question.answer}

# 합격자 벤치마크 (${stats.totalApplicants}명, 최근 3년)
- 평균: 학점 ${stats.avgGpa.toFixed(2)}/4.5, 토익 ${Math.round(stats.avgToeic)}점
- 핵심 패턴: ${stats.commonActivities.slice(0, 2).map(a => a.activityType).join(', ')}

# 엄격한 평가 기준 (100점 만점, 70점 이상 드물게 부여)

## 1. 구조 (33점)
- **논리성** (11점): Situation→Task→Action→Result 흐름, 인과관계 명확성
  - 9-11점: STAR 완벽, 모든 인과관계 명확
  - 6-8점: 기본 구조 있으나 일부 비약
  - 3-5점: 논리적 연결 부족
- **일관성** (11점): 주제 통일성, 문단 간 자연스러운 연결
- **완결성** (11점): 도입-전개-결론 구조, 메시지 명확성

## 2. 내용 (34점)
- **구체성** (12점): 수치(%, 건수, 금액), 고유명사, 측정 가능한 성과
  - 10-12점: 3개 이상 구체적 수치, 검증 가능한 사실
  - 6-9점: 일부 구체적 요소
  - 3-5점: 추상적 서술 위주
- **직무연관성** (12점): ${position} 핵심 역량 직접 연결
- **차별성** (10점): 타 지원자 대비 독특한 경험/관점

## 3. 표현 (17점)
- **문장력** (6점): 간결성 (1문장 30자 내), 능동태
- **어휘력** (6점): 업계 용어, 전문성 있는 표현
- **가독성** (5점): 문장 길이 균형, 명확한 띄어쓰기

## 4. 직무적합성 (16점)
- **전문성** (6점): ${position} 필수 지식/스킬 보유 증거
- **열정** (5점): 자발적 학습, 프로젝트 주도 경험
- **성장성** (5점): 피드백 수용, 개선 사례

# 합격자 비교 (중복 제거, 핵심만)
- 답변 길이: 합격자 평균 vs 지원자 (간결함)
- 핵심 경험 개수: 합격자 평균 vs 지원자
- 성과 구체성: 합격자는 수치 명시율 X%, 지원자는 Y%

# 출력 형식 (JSON, 엄격한 평가)

{
  "overallScore": 65,
  "overallSummary": "HR 매니저 관점의 종합 평가 (5-7문장, 합격 가능성 포함)",

  "structureAnalysis": {
    "totalScore": 70,
    "logic": {
      "score": 65,
      "feedback": "논리성에 대한 구체적 평가 (3-4문장)"
    },
    "consistency": {
      "score": 70,
      "feedback": "일관성에 대한 구체적 평가 (3-4문장)"
    },
    "completeness": {
      "score": 75,
      "feedback": "완결성에 대한 구체적 평가 (3-4문장)"
    },
    "suggestions": ["구조 개선 제안 1", "제안 2", "제안 3"]
  },

  "contentAnalysis": {
    "totalScore": 68,
    "specificity": {
      "score": 60,
      "feedback": "구체성 평가 (수치, 사례 등)"
    },
    "relevance": {
      "score": 70,
      "feedback": "직무연관성 평가"
    },
    "differentiation": {
      "score": 65,
      "feedback": "차별성 평가"
    },
    "strengths": ["강점 1", "강점 2"],
    "weaknesses": ["약점 1", "약점 2", "약점 3"]
  },

  "expressionAnalysis": {
    "totalScore": 72,
    "writing": {
      "score": 70,
      "feedback": "문장력 평가"
    },
    "vocabulary": {
      "score": 75,
      "feedback": "어휘력 평가"
    },
    "readability": {
      "score": 70,
      "feedback": "가독성 평가"
    },
    "improvements": ["개선 제안 1", "제안 2"]
  },

  "jobFitAnalysis": {
    "totalScore": 66,
    "expertise": {
      "score": 65,
      "feedback": "전문성 평가 (직무 관련 지식/경험)"
    },
    "passion": {
      "score": 70,
      "feedback": "열정 평가"
    },
    "growth": {
      "score": 65,
      "feedback": "성장가능성 평가"
    }
  },

  "competitorComparison": {
    "specComparison": {
      "gpa": "필요시만 작성 (없으면 빈 문자열)",
      "toeic": "필요시만 작성",
      "certificates": "필요시만 작성"
    },
    "activityComparison": {
      "quantity": "답변 내 경험 개수 비교 (간결하게)",
      "quality": "성과 구체성 비교 (수치 유무)",
      "relevance": "직무 연관성 비교"
    },
    "summary": "합격자 대비 핵심 차이 3-5문장",
    "missingElements": ["결정적 부족 요소 2-3개"],
    "recommendations": ["최우선 개선 방향 2-3개"]
  },

  "revisedVersion": "합격 수준으로 전면 개선한 답변 (300-400자, 구체적 수치 포함)",
  "keyImprovements": ["Before → After 비교 3개"]
}

**철칙**:
1. 점수 인플레 금지 (60점대 정상, 80점 이상 극소수)
2. 피드백마다 구체적 문장 예시 제시
3. "~하면 좋겠습니다" 금지 → "~으로 변경 필요" 사용
4. 학점/토익 반복 언급 금지 (한 번만)
5. 개선안은 실행 가능한 액션 아이템`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `당신은 15년 경력의 ${position} 채용 전문가입니다.
매년 1,000명 평가, 실무팀과 협업하여 합격자 선발 기준을 직접 수립합니다.

평가 원칙:
1. 합격자 기준으로 상대평가 (절대평가 금지)
2. 증거 기반 채점 (주관적 추측 배제)
3. 실무 기여도 예측 (이론보다 실전)
4. 개선점 우선 (칭찬은 필요 최소한)
5. 엄격한 점수 (60점대 정상, 70점 이상 드물게, 80점 이상 극소수)

구체적 피드백 예시:
- "논리적 흐름이 부족합니다" (X)
- "2문단에서 '결과적으로'로 시작했으나 앞 문단과 인과관계 불명확. '프로젝트 목표 달성을 위해'로 변경 필요" (O)`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 4500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      questionNumber,
      question: question.question,
      answer: question.answer,
      userAnswer: question.answer, // 사용자 원본 답변 저장
      overallScore: result.overallScore || 70,
      overallSummary: result.overallSummary || '',
      structureAnalysis: result.structureAnalysis || {
        totalScore: 70,
        logic: { score: 70, feedback: '' },
        consistency: { score: 70, feedback: '' },
        completeness: { score: 70, feedback: '' },
        suggestions: []
      },
      contentAnalysis: result.contentAnalysis || {
        totalScore: 70,
        specificity: { score: 70, feedback: '' },
        relevance: { score: 70, feedback: '' },
        differentiation: { score: 70, feedback: '' },
        strengths: [],
        weaknesses: []
      },
      expressionAnalysis: result.expressionAnalysis || {
        totalScore: 70,
        writing: { score: 70, feedback: '' },
        vocabulary: { score: 70, feedback: '' },
        readability: { score: 70, feedback: '' },
        improvements: []
      },
      jobFitAnalysis: result.jobFitAnalysis || {
        totalScore: 70,
        expertise: { score: 70, feedback: '' },
        passion: { score: 70, feedback: '' },
        growth: { score: 70, feedback: '' }
      },
      competitorComparison: result.competitorComparison || {
        specComparison: { gpa: '', toeic: '', certificates: '' },
        activityComparison: { quantity: '', quality: '', relevance: '' },
        summary: '',
        missingElements: [],
        recommendations: []
      },
      revisedVersion: result.revisedVersion || '',
      keyImprovements: result.keyImprovements || [],
    };
  } catch (error) {
    console.error('상세 첨삭 생성 실패:', error);
    throw error;
  }
}

/**
 * 전체 자소서에 대한 완전한 첨삭 리포트 생성
 */
export async function generateCompleteFeedbackReport(
  questions: CoverLetterQuestion[],
  position: string
): Promise<CompleteFeedbackReport> {
  const questionFeedbacks: DetailedQuestionFeedback[] = [];

  // 각 질문에 대한 상세 첨삭 생성
  for (let i = 0; i < questions.length; i++) {
    const feedback = await generateDetailedFeedback(questions[i], i + 1, position, questions);
    questionFeedbacks.push(feedback);
  }

  // 평균 점수 계산
  const averageScore = questionFeedbacks.reduce((sum, f) => sum + f.overallScore, 0) / questionFeedbacks.length;

  // 전체적인 추천사항 생성
  const overallRecommendations = [
    '모든 답변에서 STAR 기법(상황-과제-행동-결과)을 명확히 적용하세요.',
    '정량적 성과를 더 많이 포함하세요. 숫자와 데이터가 설득력을 높입니다.',
    '합격자들이 자주 언급하는 키워드와 경험을 참고하여 답변을 보완하세요.',
  ];

  return {
    position,
    totalQuestions: questions.length,
    averageScore: Math.round(averageScore),
    questionFeedbacks,
    overallRecommendations,
    createdAt: new Date().toISOString(),
  };
}
