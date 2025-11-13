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
  allQuestions: CoverLetterQuestion[],
  userGpa?: string,
  userCertificates?: string[],
  userToeic?: number
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

# 지원자 스펙 (비교용)
${userGpa ? `- 학점: ${userGpa}/4.5` : '- 학점: 미입력'}
${userToeic ? `- 토익: ${userToeic}점` : '- 토익: 미입력'}
${userCertificates && userCertificates.length > 0 ? `- 자격증: ${userCertificates.join(', ')} (${userCertificates.length}개)` : '- 자격증: 없음'}

# 엄격한 평가 기준 (100점 만점, 45-85점 폭넓은 분포)

## 1. 구조 (33점) - 평균 18-21점, 최저 10점, 최고 30점
- **논리성** (11점): Situation→Task→Action→Result 흐름, 인과관계 명확성
  - 9-11점: STAR 완벽 + 모든 인과관계 자명 (상위 5%)
  - 6-8점: STAR 기본형 있으나 일부 비약 (중상위 25%)
  - 4-5점: 시간순 나열, 인과관계 불명확 (중하위 40%)
  - 2-3점: 논리 비약 심각 (하위 25%)
  - 0-1점: 논리 구조 완전 부재 (하위 5%)
- **일관성** (11점): 주제 통일성, 문단 간 매끄러운 전환
  - 9-11점: 전환 문장 자연스럽고 주제 일관 (상위 8%)
  - 6-8점: 주제 일관되나 전환 다소 어색 (중상위 30%)
  - 4-5점: 주제 일관되나 전환 부자연스럽 (중하위 35%)
  - 2-3점: 주제 이탈 발생 (하위 20%)
  - 0-1점: 주제 단절 심각 (하위 7%)
- **완결성** (11점): 도입-전개-결론 구조, 메시지 명확성
  - 9-11점: 3단 구조 명확 + 핵심 메시지 강렬 (상위 10%)
  - 6-8점: 구조 있으나 결론 약하거나 메시지 불명 (중상위 30%)
  - 3-5점: 구조 애매, 결론 부재 (중하위 35%)
  - 1-2점: 구조 거의 없음 (하위 20%)
  - 0점: 구조 완전 부재 (하위 5%)

## 2. 내용 (34점) - 평균 18-22점, 최저 10점, 최고 31점
- **구체성** (12점): 수치(%, 건수, 금액), 고유명사, 측정 가능한 성과
  - 10-12점: 3개 이상 구체 수치 + 검증 가능 (상위 8%)
  - 7-9점: 1-2개 수치 또는 일부 고유명사 (중상위 25%)
  - 4-6점: 추상적 서술 위주, 수치 거의 없음 (중하위 40%)
  - 2-3점: 구체성 매우 부족 (하위 20%)
  - 0-1점: 일반론만, 구체성 전무 (하위 7%)
- **직무연관성** (12점): ${position} 핵심 역량 직접 연결
  - 10-12점: 직무 필수 역량 3개 이상 + 깊이 있는 설명 (상위 10%)
  - 7-9점: 직무 관련 경험 명확히 언급 (중상위 28%)
  - 4-6점: 간접 연관 경험, 일반 역량 위주 (중하위 38%)
  - 2-3점: 직무 연관성 희박 (하위 18%)
  - 0-1점: 직무 무관한 내용 (하위 6%)
- **차별성** (10점): 타 지원자 대비 독특한 경험/관점
  - 8-10점: 희소 경험 또는 독창적 해법 (상위 8%)
  - 5-7점: 일반 경험이나 관점에 차별성 (중상위 32%)
  - 3-4점: 흔한 경험/표현 (중하위 40%)
  - 1-2점: 매우 일반적, 진부한 표현 (하위 15%)
  - 0점: 차별성 전무 (하위 5%)

## 3. 표현 (17점) - 평균 10-12점, 최저 5점, 최고 16점
- **문장력** (6점): 간결성 (1문장 30-40자 이내), 능동태
  - 5-6점: 30자 내외 + 능동태 일관 (상위 20%)
  - 3-4점: 평균 40-50자, 일부 피동태 (중위 45%)
  - 1-2점: 50자 이상 장문, 피동태 과다 (하위 30%)
  - 0점: 문장력 심각한 문제 (하위 5%)
- **어휘력** (6점): 업계 용어, 전문성 표현
  - 5-6점: 전문 용어 4개 이상 적절히 사용 (상위 25%)
  - 3-4점: 일반 용어 위주, 전문 용어 1-2개 (중위 45%)
  - 1-2점: 일상 표현만, 전문성 없음 (하위 25%)
  - 0점: 어휘 수준 매우 낮음 (하위 5%)
- **가독성** (5점): 문장 길이 균형, 명확한 구조
  - 4-5점: 문장 길이 균일, 단락 구분 명확 (상위 35%)
  - 2-3점: 길이 불균형 또는 단락 구분 애매 (중위 45%)
  - 0-1점: 가독성 심각한 문제 (하위 20%)

## 4. 직무적합성 (16점) - 평균 9-11점, 최저 4점, 최고 15점
- **전문성** (6점): ${position} 필수 지식/스킬 보유 증거
  - 5-6점: 필수 스킬 3개 이상 + 실전 사례 (상위 15%)
  - 3-4점: 필수 스킬 1-2개 언급 (중위 45%)
  - 1-2점: 필수 스킬 거의 없음 (하위 30%)
  - 0점: 필수 스킬 전무 (하위 10%)
- **열정** (5점): 자발적 학습, 프로젝트 주도 경험
  - 4-5점: 자발적 심화 학습 + 주도 경험 명확 (상위 25%)
  - 2-3점: 수동적 학습 또는 단순 참여 (중위 50%)
  - 0-1점: 학습/주도 증거 없음 (하위 25%)
- **성장성** (5점): 피드백 수용, 개선 사례
  - 4-5점: 구체적 피드백 수용 + 개선 결과 (상위 20%)
  - 2-3점: 일반적 성장 언급, 구체성 부족 (중위 55%)
  - 0-1점: 성장 증거 없음 (하위 25%)

**점수 분포 가이드라인** (답변 수준에 따라 다양하게 분포):
- **90-100점**: 거의 없음 (완벽한 답변, 연 1-2건)
- **80-89점**: 상위 5% (구조/내용/표현/직무 모두 우수)
- **70-79점**: 상위 15% (대부분 우수하나 일부 약점)
- **60-69점**: 중상위 25% (평균 이상, 개선 여지 있음)
- **50-59점**: 중하위 30% (평균 수준, 여러 개선점)
- **40-49점**: 하위 20% (전반적 보완 필요)
- **30-39점**: 하위 4% (심각한 문제 다수)
- **20-29점**: 하위 1% (기본 요건 미충족)

# 합격자 비교 (중복 제거, 핵심만)
- 답변 길이: 합격자 평균 vs 지원자 (간결함)
- 핵심 경험 개수: 합격자 평균 vs 지원자
- 성과 구체성: 합격자는 수치 명시율 X%, 지원자는 Y%
- 활동 개수: 합격자 평균 ${stats.commonActivities.length > 0 ? stats.commonActivities.length : '4-5'}개 vs 지원자

# 출력 형식 (JSON, 질문 유형별 차별화된 피드백)

{
  "overallScore": 65,
  "overallSummary": "질문 성격에 맞춘 구체적 평가 (5-7문장, 합격 가능성 명시)",

  "structureAnalysis": {
    "totalScore": 21,
    "logic": {
      "score": 7,
      "feedback": "답변 첫 문장과 마지막 문장을 인용하여 논리 흐름 지적 (3-4문장, 구체적 예시)"
    },
    "consistency": {
      "score": 7,
      "feedback": "문단 전환 부분을 구체적으로 지적 (예: '2문단에서 갑자기 ~로 주제 전환')"
    },
    "completeness": {
      "score": 7,
      "feedback": "도입/전개/결론 중 부족한 부분 명시"
    },
    "suggestions": ["✓ 첫 문장에 핵심 메시지 추가", "✓ 2-3문단 연결어 '이를 위해' 추가", "✓ 마지막 문장을 '~하겠습니다'로 강화"]
  },

  "contentAnalysis": {
    "totalScore": 22,
    "specificity": {
      "score": 7,
      "feedback": "구체적 수치 부족 (예: '많이 개선' → '30% 개선으로 변경 필요')"
    },
    "relevance": {
      "score": 8,
      "feedback": "${position} 핵심 역량(예: 데이터 분석, 협업) 중 누락된 것 명시"
    },
    "differentiation": {
      "score": 6,
      "feedback": "타 지원자와 차별화 부족 (예: '프로젝트 참여' → '프로젝트 아키텍처 설계 주도'로 구체화)"
    },
    "strengths": ["✓ 실무 경험 언급", "✓ 기술 스택 구체적"],
    "weaknesses": ["✗ 성과 수치 부족", "✗ 직무 핵심 역량 일부 누락", "✗ 타 지원자 대비 차별성 약함"]
  },

  "expressionAnalysis": {
    "totalScore": 12,
    "writing": {
      "score": 4,
      "feedback": "문장 평균 길이 50자 이상 (예시 문장 인용 후 30자 이내로 분리 제안)"
    },
    "vocabulary": {
      "score": 4,
      "feedback": "업계 용어 부족 (예: '개선함' → '최적화함', '리팩토링' 등 사용 권장)"
    },
    "readability": {
      "score": 4,
      "feedback": "단락 구분 불명확, 띄어쓰기 오류 (구체적 위치 지적)"
    },
    "improvements": ["문장을 20-30자 단위로 분리", "전문 용어 5개 이상 추가"]
  },

  "jobFitAnalysis": {
    "totalScore": 10,
    "expertise": {
      "score": 3,
      "feedback": "${position} 필수 스킬 3가지 중 1개만 언급 (누락: ~, ~)"
    },
    "passion": {
      "score": 3,
      "feedback": "자발적 학습 증거 부족 (예: '배웠습니다' → '퇴근 후 3개월간 독학' 등)"
    },
    "growth": {
      "score": 3,
      "feedback": "피드백 수용/개선 사례 없음 (추가 필요)"
    }
  },

  "competitorComparison": {
    "specComparison": {
      "gpa": "${userGpa ? `합격자 평균 ${stats.avgGpa.toFixed(2)} vs 지원자 ${userGpa}` : '합격자 평균 ' + stats.avgGpa.toFixed(2) + ', 지원자 미입력'}",
      "toeic": "${userToeic ? `합격자 평균 ${Math.round(stats.avgToeic)}점 vs 지원자 ${userToeic}점` : '합격자 평균 ' + Math.round(stats.avgToeic) + '점, 지원자 미입력'}",
      "certificates": "${userCertificates && userCertificates.length > 0 ? `지원자 ${userCertificates.length}개 보유` : '지원자 자격증 없음'}"
    },
    "activityComparison": {
      "quantity": "답변에서 언급한 경험/활동 개수를 세고 합격자 평균과 비교 (예: '지원자 2개 vs 합격자 평균 4-5개')",
      "quality": "성과 수치 명시율 비교 (예: '수치 명시율 20% vs 합격자 평균 80%')",
      "relevance": "직무 연관성 평가 (예: '간접 연관 경험 위주 vs 합격자는 직무 직결 경험')"
    },
    "summary": "이 질문은 [지원동기/경험/강점/포부] 유형입니다. 합격자는 [구체적 패턴]을 보이나, 지원자는 [부족한 점]으로 보완 필요. (3-5문장)",
    "missingElements": ["✗ 구체적 성과 수치", "✗ ${position} 핵심 스킬 일부", "✗ 차별화된 경험"],
    "recommendations": ["→ 성과를 수치로 변환 (예: '개선' → '30% 단축')", "→ ${position} 필수 스킬 추가 언급", "→ 독특한 해결 방식 추가"]
  },

  "revisedVersion": "위의 모든 피드백을 완벽히 반영한 합격 수준 개선안${question.maxLength ? ` (정확히 ${question.maxLength}자 이내)` : ''}",
  "keyImprovements": [
    "1. [개선 항목]: [Before 원문 일부] → [After 수정 내용]",
    "2. [개선 항목]: [Before 원문 일부] → [After 수정 내용]",
    "3. [개선 항목]: [Before 원문 일부] → [After 수정 내용]"
  ]
}

**주요 개선 사항(keyImprovements) 작성 철칙**:
1. **정확히 3개** 작성 (가장 중요한 개선 사항)
2. **Before → After 형식**: 원본 답변의 실제 문장을 인용하고 어떻게 수정했는지 명확히 제시
3. **구체적 예시**:
   - "수치 추가: '성과를 냈습니다' → '응답속도를 2초에서 300ms로 85% 개선하여 사용자 만족도 30% 향상'"
   - "직무 연관성: '개발 경험이 있습니다' → 'Java/Spring Boot 기반 MSA 설계 및 Kubernetes 배포 자동화 구축'"
   - "STAR 구조: '프로젝트에 참여했습니다' → 'Task: 레거시 시스템 성능 개선 목표 → Action: 캐싱 전략 도입 → Result: 처리 속도 3배 향상'"

**수정안(revisedVersion) 작성 철칙**:
1. **글자수 엄수**: ${question.maxLength ? `정확히 ${question.maxLength}자 이내로 작성` : '적절한 길이로 작성'} (공백 포함, 띄어쓰기 주의)
2. **피드백 완벽 반영**: 위에서 지적한 모든 약점을 개선하고 모든 개선 제안을 수용
   - 구조 분석의 suggestions 3가지 모두 반영
   - 내용 분석의 weaknesses 3가지 모두 개선
   - 표현력 분석의 improvements 모두 적용
   - 합격자 비교의 missingElements 모두 추가
3. **구체적 수치 필수**: 최소 3개 이상의 구체적 수치 포함 (%, 건수, 금액, 기간 등)
4. **STAR 구조 완벽 구현**: Situation → Task → Action → Result 흐름 명확
5. **직무 핵심 역량 3개 이상 명시**: ${position} 필수 스킬 구체적으로 언급
6. **차별화된 경험/관점 강조**: 타 지원자와 구별되는 독특한 요소 부각
7. **문장 간결성**: 평균 30-40자 이내 문장, 능동태 사용
8. **전문 용어 5개 이상**: 업계/직무 관련 전문 용어 적절히 배치

**일반 평가 철칙**:
1. **점수 다양화 필수**: 답변 수준에 따라 45-85점 범위로 폭넓게 분포
   - 우수한 답변: 70-85점
   - 평균 이상 답변: 60-69점
   - 평균 수준 답변: 50-59점
   - 미흡한 답변: 40-49점
   - 부족한 답변: 30-45점
2. 질문 유형 파악 (지원동기/경험/강점/포부) 후 맞춤 피드백
3. 답변 원문 인용 후 구체적 수정안 제시 (예: "~라고 작성 → ~으로 변경")
4. 학점/토익은 specComparison에만 1회 (activityComparison/summary 중복 금지)
5. 합격자 비교는 질문 성격에 맞게 (지원동기면 회사 이해도, 경험이면 프로젝트 깊이)
6. 세부 점수도 다양화 (논리성 4-9점, 구체성 4-10점, 문장력 2-5점, 전문성 2-5점)`;

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
4. 개선점 중심 (칭찬은 적절히)
5. **점수 다양화**: 답변 수준에 따라 45-85점 범위로 폭넓게 분포
   - 우수: 70-85점 / 평균 이상: 60-69점 / 평균: 50-59점 / 미흡: 40-49점 / 부족: 30-45점

구체적 피드백 예시:
- "논리적 흐름이 부족합니다" (X)
- "2문단에서 '결과적으로'로 시작했으나 앞 문단과 인과관계 불명확. '프로젝트 목표 달성을 위해'로 변경 필요" (O)
- 답변 원문의 문장을 인용하여 구체적으로 지적할 것`
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
  position: string,
  userGpa?: string,
  userCertificates?: string[],
  userToeic?: number
): Promise<CompleteFeedbackReport> {
  const questionFeedbacks: DetailedQuestionFeedback[] = [];

  // 각 질문에 대한 상세 첨삭 생성
  for (let i = 0; i < questions.length; i++) {
    const feedback = await generateDetailedFeedback(questions[i], i + 1, position, questions, userGpa, userCertificates, userToeic);
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
