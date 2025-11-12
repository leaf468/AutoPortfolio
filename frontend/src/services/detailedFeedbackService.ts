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

  // 종합 평가
  overallScore: number; // 0-100
  overallSummary: string;

  // 상세 분석
  structureAnalysis: {
    score: number;
    feedback: string;
    suggestions: string[];
  };

  contentAnalysis: {
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
  };

  expressionAnalysis: {
    score: number;
    feedback: string;
    improvements: string[];
  };

  // 합격자 비교
  competitorComparison: {
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

    const prompt = `당신은 대기업 인사담당자이자 자기소개서 전문 첨삭가입니다.

# 첨삭 대상
**직무**: ${position}
**질문 ${questionNumber}**: ${question.question}
**지원자 답변**:
${question.answer}

# 합격자 데이터 (${position} 직무)
- 총 합격자 수: ${stats.totalApplicants}명
- 평균 학점: ${stats.avgGpa.toFixed(2)}
- 평균 토익: ${Math.round(stats.avgToeic)}점
- 주요 활동 패턴:
${stats.commonActivities.slice(0, 5).map(a => `  • ${a.activityType} (${a.percentage.toFixed(0)}%): ${a.insight}`).join('\n')}

# 첨삭 기준
1. **구조 분석 (Structure)**: STAR 기법 활용, 논리적 흐름, 단락 구성
2. **내용 분석 (Content)**: 구체성, 차별성, 직무 연관성, 성과 중심
3. **표현 분석 (Expression)**: 문장력, 어휘 선택, 가독성
4. **합격자 비교**: 실제 합격자 데이터와 비교하여 부족한 요소 파악

# 출력 형식 (JSON)
다음 형식으로 **매우 상세하고 구체적인** 첨삭을 제공하세요. 각 항목은 최소 3-5문장 이상으로 작성하세요.

{
  "overallScore": 75,
  "overallSummary": "전반적인 평가 (5문장 이상, 구체적으로)",

  "structureAnalysis": {
    "score": 70,
    "feedback": "구조에 대한 상세한 분석 (5문장 이상)",
    "suggestions": [
      "구체적인 개선 제안 1 (상세하게)",
      "구체적인 개선 제안 2 (상세하게)",
      "구체적인 개선 제안 3 (상세하게)"
    ]
  },

  "contentAnalysis": {
    "score": 80,
    "feedback": "내용에 대한 상세한 분석 (5문장 이상)",
    "strengths": [
      "강점 1 (구체적으로)",
      "강점 2 (구체적으로)",
      "강점 3 (구체적으로)"
    ],
    "weaknesses": [
      "약점 1 (구체적으로)",
      "약점 2 (구체적으로)"
    ]
  },

  "expressionAnalysis": {
    "score": 75,
    "feedback": "표현에 대한 상세한 분석 (5문장 이상)",
    "improvements": [
      "표현 개선 제안 1 (before/after 예시 포함)",
      "표현 개선 제안 2 (before/after 예시 포함)",
      "표현 개선 제안 3 (before/after 예시 포함)"
    ]
  },

  "competitorComparison": {
    "summary": "합격자들과 비교한 종합 분석 (7문장 이상)",
    "missingElements": [
      "합격자들이 가진 요소 중 부족한 점 1",
      "합격자들이 가진 요소 중 부족한 점 2",
      "합격자들이 가진 요소 중 부족한 점 3"
    ],
    "recommendations": [
      "합격자 수준으로 개선하기 위한 제안 1 (매우 구체적으로)",
      "합격자 수준으로 개선하기 위한 제안 2 (매우 구체적으로)",
      "합격자 수준으로 개선하기 위한 제안 3 (매우 구체적으로)"
    ]
  },

  "revisedVersion": "수정된 답변 전문 (원본을 크게 개선한 버전, 최소 200자 이상)",
  "keyImprovements": [
    "주요 개선 사항 1 (어떤 부분을 어떻게 바꿨는지 상세히)",
    "주요 개선 사항 2 (어떤 부분을 어떻게 바꿨는지 상세히)",
    "주요 개선 사항 3 (어떤 부분을 어떻게 바꿨는지 상세히)"
  ]
}

**중요**:
- 모든 피드백은 구체적이고 실용적이어야 합니다
- 추상적인 조언 대신 구체적인 예시를 제시하세요
- 수정된 답변은 원본보다 월등히 우수해야 합니다
- 합격자 데이터를 적극 활용하세요`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: '당신은 대기업 인사담당자이자 자기소개서 전문 첨삭가입니다. 매우 상세하고 구체적인 첨삭을 제공하세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      questionNumber,
      question: question.question,
      answer: question.answer,
      overallScore: result.overallScore || 70,
      overallSummary: result.overallSummary || '',
      structureAnalysis: result.structureAnalysis || { score: 70, feedback: '', suggestions: [] },
      contentAnalysis: result.contentAnalysis || { score: 70, feedback: '', strengths: [], weaknesses: [] },
      expressionAnalysis: result.expressionAnalysis || { score: 70, feedback: '', improvements: [] },
      competitorComparison: result.competitorComparison || { summary: '', missingElements: [], recommendations: [] },
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
