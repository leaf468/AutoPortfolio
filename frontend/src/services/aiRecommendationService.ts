import { supabase } from '../lib/supabaseClient';
import { ComprehensiveStats, getComprehensiveStats } from './comprehensiveAnalysisService';

export interface AIRecommendation {
  type: 'pattern' | 'example' | 'keyword' | 'insight';
  title: string;
  content: string;
  relevance: number; // 0-100
}

/**
 * 사용자가 입력한 텍스트를 분석하여 실시간 AI 추천 생성
 */
export async function generateRealtimeRecommendations(
  userInput: string,
  position: string
): Promise<AIRecommendation[]> {
  if (!userInput.trim() || userInput.length < 10) {
    return [];
  }

  const recommendations: AIRecommendation[] = [];

  // 1. 종합 통계 가져오기
  const stats = await getComprehensiveStats(position);

  // 2. 사용자 입력에서 키워드 추출
  const userKeywords = extractUserKeywords(userInput);

  // 3. 활동 패턴 기반 추천
  const activityRecommendations = generateActivityRecommendations(userInput, userKeywords, stats);
  recommendations.push(...activityRecommendations);

  // 4. 키워드 기반 추천
  const keywordRecommendations = generateKeywordRecommendations(userKeywords, stats);
  recommendations.push(...keywordRecommendations);

  // 5. 예시 기반 추천
  const exampleRecommendations = await generateExampleRecommendations(userKeywords, position);
  recommendations.push(...exampleRecommendations);

  // 관련도 순으로 정렬하고 상위 5개만 반환
  return recommendations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

/**
 * 사용자 입력에서 의미있는 키워드 추출
 */
function extractUserKeywords(text: string): string[] {
  const keywords = [
    '리더', '팀장', '팀원', '협업', '소통', '조율',
    '프로젝트', '개발', '설계', '구현', '테스트', '배포',
    '데이터', '분석', '최적화', '개선', '성과', '효율',
    '수상', '대회', '공모전', '대상', '우수상', '입상',
    '봉사', '멘토링', '교육', '발표', '세미나', '강연',
    '문제', '해결', '극복', '도전', '목표', '달성',
    '기획', '전략', '마케팅', '영업', '고객', '서비스',
    '인턴', '경험', '실무', '역량', '스킬', '전문성',
  ];

  return keywords.filter((keyword) => text.includes(keyword));
}

/**
 * 활동 패턴 기반 추천 생성
 */
function generateActivityRecommendations(
  userInput: string,
  userKeywords: string[],
  stats: ComprehensiveStats
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // 사용자가 언급한 활동 타입 찾기
  const mentionedActivityTypes = stats.commonActivities.filter((activity) =>
    userInput.includes(activity.activityType) ||
    activity.commonKeywords.some((keyword) => userKeywords.includes(keyword))
  );

  mentionedActivityTypes.forEach((activity) => {
    if (activity.percentage > 50) {
      recommendations.push({
        type: 'pattern',
        title: `${activity.activityType} - 핵심 경험`,
        content: `합격자의 ${activity.percentage.toFixed(0)}%가 ${activity.activityType} 경험을 언급했습니다. ${activity.insight}`,
        relevance: activity.percentage,
      });
    }

    // 부족한 키워드 제안
    const missingKeywords = activity.commonKeywords.filter(
      (keyword) => !userKeywords.includes(keyword)
    );
    if (missingKeywords.length > 0 && activity.percentage > 40) {
      recommendations.push({
        type: 'keyword',
        title: '추천 키워드',
        content: `이 경험을 설명할 때 "${missingKeywords.slice(0, 3).join('", "')}" 등의 키워드를 추가하면 더 효과적입니다.`,
        relevance: activity.percentage * 0.8,
      });
    }
  });

  return recommendations;
}

/**
 * 키워드 기반 추천 생성
 */
function generateKeywordRecommendations(
  userKeywords: string[],
  stats: ComprehensiveStats
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // 리더십 키워드가 있는 경우
  const hasLeadership = userKeywords.some((k) => ['리더', '팀장', '주도'].includes(k));
  const leadershipActivity = stats.commonActivities.find((a) =>
    a.commonKeywords.some((k) => ['리더', '팀장', '주도'].includes(k))
  );

  if (hasLeadership && leadershipActivity) {
    recommendations.push({
      type: 'insight',
      title: '리더십 경험',
      content: `좋습니다! 합격자의 ${leadershipActivity.percentage.toFixed(0)}%가 리더십 경험을 강조합니다. 구체적인 성과와 팀 규모를 언급하면 더욱 효과적입니다.`,
      relevance: 85,
    });
  }

  // 협업 키워드가 있는 경우
  const hasTeamwork = userKeywords.some((k) => ['협업', '팀원', '소통'].includes(k));
  const teamworkActivity = stats.commonActivities.find((a) =>
    a.commonKeywords.some((k) => ['협업', '팀', '프로젝트'].includes(k))
  );

  if (hasTeamwork && teamworkActivity) {
    recommendations.push({
      type: 'insight',
      title: '협업 경험',
      content: `팀 협업은 중요한 역량입니다. 합격자의 ${teamworkActivity.percentage.toFixed(0)}%가 팀 프로젝트를 언급합니다. 본인의 구체적인 역할과 기여도를 명시하세요.`,
      relevance: 80,
    });
  }

  // 성과 키워드가 부족한 경우
  const hasAchievement = userKeywords.some((k) =>
    ['성과', '개선', '달성', '수상', '최적화'].includes(k)
  );

  if (!hasAchievement && userKeywords.length > 3) {
    recommendations.push({
      type: 'keyword',
      title: '성과 지표 추가 권장',
      content: '구체적인 성과나 개선 결과를 수치로 표현하면 더욱 설득력이 높아집니다. (예: "20% 효율 향상", "사용자 만족도 30% 증가")',
      relevance: 75,
    });
  }

  return recommendations;
}

/**
 * 실제 예시 기반 추천 생성
 */
async function generateExampleRecommendations(
  userKeywords: string[],
  position: string
): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  if (userKeywords.length === 0) {
    return recommendations;
  }

  try {
    // DB에서 유사한 활동 예시 찾기
    const { data: activities } = await supabase
      .from('activities')
      .select('content, activity_type')
      .limit(100);

    if (!activities) return recommendations;

    // 사용자 키워드와 매칭되는 예시 찾기
    const matchingExamples = activities
      .filter((activity) =>
        userKeywords.some((keyword) => activity.content.includes(keyword))
      )
      .slice(0, 3);

    matchingExamples.forEach((example) => {
      const matchingKeywords = userKeywords.filter((k) => example.content.includes(k));
      recommendations.push({
        type: 'example',
        title: `${example.activity_type} 예시`,
        content: example.content.slice(0, 150) + (example.content.length > 150 ? '...' : ''),
        relevance: matchingKeywords.length * 20,
      });
    });
  } catch (error) {
    console.error('예시 추천 생성 실패:', error);
  }

  return recommendations;
}

/**
 * 전체 자소서 내용 종합 분석 및 피드백
 */
export async function analyzeCoverLetterComplete(
  answers: { question: string; answer: string }[],
  position: string
): Promise<{
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}> {
  const stats = await getComprehensiveStats(position);
  const allText = answers.map((a) => a.answer).join(' ');
  const allKeywords = extractUserKeywords(allText);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  // 강점 분석
  if (allKeywords.filter((k) => ['리더', '팀장', '주도'].includes(k)).length > 0) {
    strengths.push('리더십 경험이 잘 드러나 있습니다.');
  }
  if (allKeywords.filter((k) => ['협업', '팀원', '소통'].includes(k)).length > 0) {
    strengths.push('팀 협업 능력이 강조되어 있습니다.');
  }
  if (allKeywords.filter((k) => ['성과', '개선', '최적화'].includes(k)).length > 0) {
    strengths.push('구체적인 성과와 개선 사항이 포함되어 있습니다.');
  }

  // 개선점 분석
  const hasNumbers = /\d+%|\d+배|\d+개|\d+명|\d+원/.test(allText);
  if (!hasNumbers) {
    improvements.push('구체적인 수치나 지표를 추가하면 더욱 설득력이 높아집니다.');
  }

  const avgActivityCount = stats.commonActivities.reduce((sum, a) => sum + a.averageCount, 0);
  const userActivityMentions = allKeywords.length;
  if (userActivityMentions < avgActivityCount * 0.7) {
    improvements.push(`이 직무 합격자들은 평균 ${avgActivityCount.toFixed(1)}개의 활동을 언급합니다. 더 다양한 경험을 추가하세요.`);
  }

  // 추천사항
  const topActivities = stats.commonActivities.slice(0, 3);
  topActivities.forEach((activity) => {
    if (!allText.includes(activity.activityType)) {
      recommendations.push(`"${activity.activityType}" 경험 추가를 고려해보세요. (합격자의 ${activity.percentage.toFixed(0)}%가 보유)`);
    }
  });

  // 점수 계산 (100점 만점)
  let score = 50; // 기본 점수
  score += Math.min(strengths.length * 10, 30); // 강점당 +10점 (최대 30)
  score -= Math.min(improvements.length * 5, 20); // 개선점당 -5점 (최대 -20)
  score = Math.max(0, Math.min(100, score));

  return {
    overallScore: score,
    strengths,
    improvements,
    recommendations,
  };
}
