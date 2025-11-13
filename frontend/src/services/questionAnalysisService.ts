import { getComprehensiveStats, ComprehensiveStats } from './comprehensiveAnalysisService';

export interface QuestionAnalysis {
  questionId: string;
  question: string;
  relevantKeywords: string[];
  suggestedTopics: string[];
  relatedStats: {
    activityType: string;
    percentage: number;
    insight: string;
  }[];
  generalAdvice: string;
}

/**
 * 질문을 분석하여 관련된 데이터 기반 통계 제공
 */
export async function analyzeQuestion(
  question: string,
  questionId: string,
  position: string
): Promise<QuestionAnalysis> {
  // 1. 종합 통계 가져오기 (익명화 스킵 - 속도 향상)
  const stats = await getComprehensiveStats(position, true);

  // 2. 질문에서 키워드 추출
  const keywords = extractKeywordsFromQuestion(question);

  // 3. 관련 통계 찾기
  const relatedStats = findRelatedStats(keywords, stats);

  // 4. 제안 주제 생성
  const suggestedTopics = generateSuggestedTopics(keywords, stats);

  // 5. 일반 조언 생성
  const generalAdvice = generateGeneralAdvice(keywords, relatedStats, stats);

  return {
    questionId,
    question,
    relevantKeywords: keywords,
    suggestedTopics,
    relatedStats,
    generalAdvice,
  };
}

/**
 * 질문에서 키워드 추출
 */
function extractKeywordsFromQuestion(question: string): string[] {
  const keywords: string[] = [];
  const lowerQuestion = question.toLowerCase();

  // 질문 카테고리별 키워드 매핑
  const keywordMappings = {
    동기: ['동기', '지원', '선택', '이유', '목표'],
    경험: ['경험', '프로젝트', '활동', '대회', '수상', '인턴'],
    강점: ['강점', '역량', '능력', '스킬', '장점'],
    포부: ['포부', '목표', '계획', '기여', '입사 후'],
    협업: ['협업', '팀', '소통', '조율', '리더십'],
    문제해결: ['문제', '해결', '극복', '도전', '개선'],
    성과: ['성과', '결과', '달성', '향상', '효율'],
    열정: ['열정', '관심', '흥미', '학습'],
  };

  for (const [category, words] of Object.entries(keywordMappings)) {
    if (words.some((word) => lowerQuestion.includes(word))) {
      keywords.push(category);
    }
  }

  return keywords;
}

/**
 * 관련 통계 찾기
 */
function findRelatedStats(
  keywords: string[],
  stats: ComprehensiveStats
): { activityType: string; percentage: number; insight: string }[] {
  const relatedStats: { activityType: string; percentage: number; insight: string }[] = [];

  // 키워드에 따라 관련 활동 매핑
  const activityMappings: Record<string, string[]> = {
    경험: ['프로젝트', '인턴', '대외활동', '동아리'],
    협업: ['프로젝트', '팀 활동', '동아리'],
    문제해결: ['프로젝트', '대회', '해커톤'],
    성과: ['대회', '수상', '프로젝트'],
    동기: ['인턴', '대외활동', '봉사'],
    포부: ['교육', '세미나', '학습'],
  };

  keywords.forEach((keyword) => {
    const targetActivities = activityMappings[keyword] || [];

    stats.commonActivities.forEach((activity) => {
      if (
        targetActivities.some((target) => activity.activityType.includes(target)) ||
        activity.activityType.includes(keyword)
      ) {
        relatedStats.push({
          activityType: activity.activityType,
          percentage: activity.percentage,
          insight: activity.insight,
        });
      }
    });
  });

  // 중복 제거 및 상위 5개만 반환
  const uniqueStats = Array.from(
    new Map(relatedStats.map((item) => [item.activityType, item])).values()
  );

  return uniqueStats.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
}

/**
 * 제안 주제 생성
 */
function generateSuggestedTopics(keywords: string[], stats: ComprehensiveStats): string[] {
  const topics: string[] = [];

  // 키워드 기반 제안
  const topicMappings: Record<string, string[]> = {
    동기: [
      '회사/산업에 대한 관심을 갖게 된 계기',
      '해당 직무를 선택한 이유',
      '장기적인 커리어 목표',
    ],
    경험: [
      '프로젝트에서의 역할과 기여',
      '기술 스택 및 구현 방법',
      '팀원들과의 협업 과정',
      '직면한 어려움과 해결 방법',
    ],
    강점: [
      '기술적 강점 (프로그래밍, 분석 등)',
      '소프트 스킬 (소통, 리더십 등)',
      '문제 해결 능력',
      '학습 능력 및 적응력',
    ],
    포부: [
      '입사 후 첫 해 목표',
      '3-5년 후 커리어 비전',
      '회사에 기여할 수 있는 부분',
    ],
    협업: [
      '팀 프로젝트에서의 역할',
      '의견 충돌 해결 경험',
      '팀원들과의 소통 방식',
    ],
    문제해결: [
      '기술적 문제 해결 사례',
      '창의적 접근 방법',
      '실패에서 배운 점',
    ],
  };

  keywords.forEach((keyword) => {
    const keywordTopics = topicMappings[keyword] || [];
    topics.push(...keywordTopics);
  });

  // 데이터 기반 제안 추가
  if (stats.commonActivities.length > 0) {
    const topActivity = stats.commonActivities[0];
    topics.push(`${topActivity.activityType} 경험 (합격자의 ${topActivity.percentage.toFixed(0)}%가 언급)`);
  }

  // 중복 제거 및 상위 6개 반환
  return Array.from(new Set(topics)).slice(0, 6);
}

/**
 * 일반 조언 생성
 */
function generateGeneralAdvice(
  keywords: string[],
  relatedStats: { activityType: string; percentage: number; insight: string }[],
  stats: ComprehensiveStats
): string {
  const advices: string[] = [];

  // 키워드 기반 조언
  if (keywords.includes('경험')) {
    advices.push('구체적인 수치와 결과를 포함하여 작성하세요.');
  }

  if (keywords.includes('협업')) {
    advices.push('본인의 역할과 팀에 기여한 부분을 명확히 하세요.');
  }

  if (keywords.includes('문제해결')) {
    advices.push('문제의 배경, 해결 과정, 결과를 논리적으로 서술하세요.');
  }

  // 데이터 기반 조언
  if (relatedStats.length > 0) {
    const topStat = relatedStats[0];
    advices.push(
      `이 질문에는 "${topStat.activityType}" 관련 경험을 포함하는 것이 좋습니다. (합격자의 ${topStat.percentage.toFixed(0)}%가 언급)`
    );
  }

  // 기본 조언
  if (advices.length === 0) {
    advices.push(
      `${stats.position} 직무 합격자들은 평균적으로 구체적인 사례와 성과를 강조합니다.`
    );
  }

  return advices.join(' ');
}

/**
 * 여러 질문을 한번에 분석
 */
export async function analyzeAllQuestions(
  questions: { id: string; question: string }[],
  position: string
): Promise<QuestionAnalysis[]> {
  const analyses = await Promise.all(
    questions.map((q) => analyzeQuestion(q.question, q.id, position))
  );

  return analyses;
}
