import { supabase } from '../lib/supabaseClient';
import { ComprehensiveStats, getComprehensiveStats } from './comprehensiveAnalysisService';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export interface AIRecommendation {
  type: 'pattern' | 'example' | 'keyword' | 'insight' | 'llm_suggestion';
  title: string;
  content: string;
  relevance: number; // 0-100
}

/**
 * 사용자가 입력한 텍스트를 분석하여 실시간 AI 추천 생성 (LLM 기반 고도화)
 */
export async function generateRealtimeRecommendations(
  userInput: string,
  position: string,
  questionText?: string
): Promise<AIRecommendation[]> {
  if (!userInput.trim() || userInput.length < 10) {
    return [];
  }

  const recommendations: AIRecommendation[] = [];

  // 1. 종합 통계 가져오기 (익명화 스킵 - 속도 향상)
  const stats = await getComprehensiveStats(position, true);

  // 2. 사용자 입력에서 키워드 추출
  const userKeywords = extractUserKeywords(userInput);

  // 3. LLM 기반 컨텍스트 분석 및 추천 (최우선)
  try {
    const llmRecommendations = await generateLLMRecommendations(
      userInput,
      position,
      questionText,
      stats,
      userKeywords
    );
    recommendations.push(...llmRecommendations);
  } catch (error) {
  }

  // 4. 활동 패턴 기반 추천
  const activityRecommendations = generateActivityRecommendations(userInput, userKeywords, stats);
  recommendations.push(...activityRecommendations);

  // 5. 키워드 기반 추천
  const keywordRecommendations = generateKeywordRecommendations(userKeywords, stats);
  recommendations.push(...keywordRecommendations);

  // 관련도 순으로 정렬하고 상위 6개만 반환
  return recommendations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 6);
}

/**
 * LLM 기반 컨텍스트 분석 및 추천 생성 (유사 활동 예시 포함)
 */
async function generateLLMRecommendations(
  userInput: string,
  position: string,
  questionText: string | undefined,
  stats: ComprehensiveStats,
  userKeywords: string[]
): Promise<AIRecommendation[]> {
  try {
    // API 키 확인
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey || apiKey.length < 20) {
      return [];
    }

    // 실제 데이터 통계를 LLM에게 제공
    const topActivities = stats.commonActivities.slice(0, 5).map(a => ({
      활동: a.activityType,
      비율: `${a.percentage.toFixed(0)}%`,
      인사이트: a.insight,
      관련키워드: a.commonKeywords.slice(0, 3)
    }));

    // DB에서 유사한 활동 예시 찾기 (synthetic_applicants.activities 사용)
    let similarActivitiesInfo = '';
    if (userKeywords.length > 0) {
      try {
        const { data: applicants } = await supabase
          .from('synthetic_applicants')
          .select('activities, position')
          .eq('position', position)
          .not('activities', 'is', null)
          .limit(30);

        if (applicants) {
          // activities 배열을 flatten하고 키워드 매칭
          const allActivities: Array<{type: string, content: string}> = [];
          applicants.forEach(app => {
            if (Array.isArray(app.activities)) {
              allActivities.push(...app.activities);
            }
          });

          // 사용자 키워드와 매칭되는 예시 찾기
          const matchingExamples = allActivities
            .filter((activity) =>
              userKeywords.some((keyword) =>
                activity.content?.toLowerCase().includes(keyword.toLowerCase())
              )
            )
            .slice(0, 3);

          if (matchingExamples.length > 0) {
            similarActivitiesInfo = `\n\n# 참고: 유사한 활동 예시 패턴 (${position} 직무 합격자)\n`;
            matchingExamples.forEach((example, idx) => {
              similarActivitiesInfo += `${idx + 1}. [${example.type}] ${example.content.slice(0, 100)}...\n`;
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch synthetic activities:', error);
      }
    }

    const prompt = `당신은 자기소개서 작성을 돕는 AI 어시스턴트입니다.

# 상황
- 지원 직무: ${position}
${questionText ? `- 질문: ${questionText}` : ''}
- 사용자가 작성 중인 답변: "${userInput}"

# 실제 합격자 데이터 (${position} 직무)
${JSON.stringify(topActivities, null, 2)}${similarActivitiesInfo}

# 당신의 역할
사용자가 작성 중인 답변을 분석하고, 다음 3-4가지 추천을 제공하세요:

1. **구체성 개선**: 현재 답변에서 더 구체적으로 표현할 수 있는 부분
2. **데이터 기반 제안**: 위 합격자 데이터를 참고하여, 답변에 추가하면 좋을 내용
3. **스토리텔링**: STAR 방법론(Situation-Task-Action-Result)을 활용한 개선 방향
4. **유사 활동 기반 제안**: (위 합격자 데이터가 있는 경우) 해당 예시의 패턴을 참고하여, 사용자가 작성할 수 있는 새로운 내용 제안 (실제 데이터를 그대로 복사하지 말고, 영감을 받아 패턴과 내용을 많이 참고해서 새롭게 작성)

각 추천은 짧고 실용적이어야 합니다 (1-2문장).

응답 형식 (JSON만 반환):
{
  "recommendations": [
    {
      "title": "추천 제목",
      "content": "구체적인 추천 내용 (1-2문장)",
      "relevance": 85
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{
        role: 'system',
        content: '당신은 자기소개서 작성 전문가입니다. JSON 형식으로만 응답하세요.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];


    // JSON 파싱
    const parsed = JSON.parse(content);

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      return [];
    }

    return parsed.recommendations.map((rec: any) => ({
      type: 'llm_suggestion' as const,
      title: rec.title || 'AI 추천',
      content: rec.content || '',
      relevance: rec.relevance || 90,
    }));
  } catch (error: any) {

    // API 키 오류인 경우 사용자에게 알림
    if (error?.status === 401) {
    }

    return [];
  }
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
        content: `${activity.activityType} 경험을 언급하셨군요. ${activity.insight}`,
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
      content: `좋습니다! 리더십 경험을 강조하셨군요. 구체적인 성과와 팀 규모를 언급하면 더욱 효과적입니다.`,
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
      content: `팀 협업은 중요한 역량입니다. 본인의 구체적인 역할과 기여도를 명시하세요.`,
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
 * 전체 자소서 내용 종합 분석 및 피드백
 */
export async function analyzeCoverLetterComplete(
  answers: { question: string; answer: string }[],
  position: string
): Promise<{
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}> {
  const stats = await getComprehensiveStats(position, true); // 익명화 스킵
  const allText = answers.map((a) => a.answer).join(' ');
  const allKeywords = extractUserKeywords(allText);

  const strengths: string[] = [];
  const improvementCandidates: { priority: number; text: string }[] = [];
  const recommendations: string[] = [];

  // 1. 강점 분석 (더 다양하고 구체적으로)
  const leadershipKeywords = allKeywords.filter((k) => ['리더', '팀장', '주도'].includes(k)).length;
  if (leadershipKeywords >= 2) {
    strengths.push('리더십 경험이 풍부하게 드러나 있습니다.');
  } else if (leadershipKeywords > 0) {
    strengths.push('리더십 경험이 잘 드러나 있습니다.');
  }

  const teamworkKeywords = allKeywords.filter((k) => ['협업', '팀원', '소통', '조율'].includes(k)).length;
  if (teamworkKeywords >= 3) {
    strengths.push('팀 협업 능력이 매우 강조되어 있습니다.');
  } else if (teamworkKeywords > 0) {
    strengths.push('팀 협업 능력이 강조되어 있습니다.');
  }

  const achievementKeywords = allKeywords.filter((k) => ['성과', '개선', '최적화', '달성', '수상'].includes(k)).length;
  if (achievementKeywords >= 3) {
    strengths.push('구체적인 성과와 개선 사항이 다수 포함되어 있습니다.');
  } else if (achievementKeywords > 0) {
    strengths.push('구체적인 성과와 개선 사항이 포함되어 있습니다.');
  }

  const problemSolvingKeywords = allKeywords.filter((k) => ['문제', '해결', '극복', '도전'].includes(k)).length;
  if (problemSolvingKeywords >= 3) {
    strengths.push('문제 해결 능력이 여러 사례를 통해 잘 드러나 있습니다.');
  } else if (problemSolvingKeywords >= 2) {
    strengths.push('문제 해결 능력이 드러나 있습니다.');
  }

  // 프로젝트 경험
  const projectKeywords = allKeywords.filter((k) => ['프로젝트', '개발', '설계', '구현'].includes(k)).length;
  if (projectKeywords >= 3) {
    strengths.push('다양한 프로젝트 경험이 구체적으로 서술되어 있습니다.');
  } else if (projectKeywords > 0) {
    strengths.push('프로젝트 경험이 포함되어 있습니다.');
  }

  // 데이터 기반 분석
  const dataKeywords = allKeywords.filter((k) => ['데이터', '분석'].includes(k)).length;
  if (dataKeywords >= 2) {
    strengths.push('데이터 기반 분석 능력이 드러나 있습니다.');
  }

  // 실무 경험
  const practicalKeywords = allKeywords.filter((k) => ['인턴', '경험', '실무', '역량'].includes(k)).length;
  if (practicalKeywords >= 2) {
    strengths.push('실무 경험이 풍부하게 드러나 있습니다.');
  }

  // 수치적 성과
  const numberMatches = allText.match(/\d+%|\d+배|\d+개|\d+명|\d+원|\d+건|\d+시간|\d+년|\d+개월/g);
  const numberCount = numberMatches ? numberMatches.length : 0;
  if (numberCount >= 5) {
    strengths.push('정량적 성과가 구체적으로 표현되어 있습니다.');
  } else if (numberCount >= 3) {
    strengths.push('정량적 성과가 포함되어 있습니다.');
  }

  // 전체 분량
  const totalLength = allText.length;
  if (totalLength >= 1500) {
    strengths.push('자기소개서 전체 분량이 충분하여 경험을 상세히 서술했습니다.');
  } else if (totalLength >= 1000) {
    strengths.push('자기소개서 분량이 적절합니다.');
  }

  // 전공/기술 역량
  const skillKeywords = allKeywords.filter((k) => ['역량', '스킬', '전문성'].includes(k)).length;
  if (skillKeywords >= 2) {
    strengths.push('전문 역량이 잘 드러나 있습니다.');
  }

  // 2. 개선점 분석 (우선순위 기반)

  // 2-1. 자소서 길이 체크 (우선순위: 높음)
  const avgAnswerLength = totalLength / answers.length;

  if (totalLength < 500) {
    improvementCandidates.push({
      priority: 90,
      text: '자소서 전체 분량이 다소 짧습니다. 구체적인 경험과 사례를 추가하여 내용을 보강하세요.'
    });
  } else if (avgAnswerLength < 150) {
    improvementCandidates.push({
      priority: 85,
      text: '각 질문에 대한 답변이 다소 짧습니다. 더 구체적인 설명과 상황을 추가해보세요.'
    });
  }

  // 2-2. 수치/성과 지표 체크 (우선순위: 높음)
  // numberCount는 위에서 이미 계산됨

  if (numberCount === 0) {
    improvementCandidates.push({
      priority: 95,
      text: '구체적인 수치나 지표를 추가하면 더욱 설득력이 높아집니다. (예: "20% 효율 향상", "50명 규모 프로젝트")'
    });
  } else if (numberCount < 3 && totalLength > 800) {
    improvementCandidates.push({
      priority: 70,
      text: '성과를 수치로 표현한 부분이 부족합니다. 더 많은 정량적 지표를 추가해보세요.'
    });
  }

  // 2-3. 활동 다양성 체크 (우선순위: 중간)
  // 합격자들의 주요 활동 (30% 이상) 중 사용자가 언급한 활동 개수 체크
  const significantActivities = stats.commonActivities.filter(a => a.percentage >= 30);

  // 유연한 활동 매칭 (마지막 단어로 매칭 - "백엔드 개발" → "개발"로 매칭)
  const userMentionedActivities = significantActivities.filter(activity => {
    // "백엔드 개발"에서 "개발"만 추출하여 매칭
    const lastWord = activity.activityType.split(' ').pop() || activity.activityType;
    return allText.includes(lastWord);
  });

  const mentionedCount = userMentionedActivities.length;
  const significantCount = significantActivities.length;

  if (significantCount > 0) {
    const coverageRatio = mentionedCount / significantCount;

    if (coverageRatio < 0.3) {
      // 주요 활동의 30% 미만만 언급
      const missingActivities = significantActivities
        .filter(a => !userMentionedActivities.includes(a))
        .slice(0, 3)
        .map(a => `"${a.activityType}"(${a.percentage.toFixed(0)}%)`);

      improvementCandidates.push({
        priority: 80,
        text: `이 직무 합격자들은 평균 ${significantCount}가지 주요 활동을 언급합니다. ${missingActivities.join(', ')} 등의 경험 추가를 고려해보세요.`
      });
    } else if (coverageRatio < 0.5) {
      improvementCandidates.push({
        priority: 65,
        text: `합격자들이 자주 언급하는 활동 중 일부가 누락되어 있습니다. 더 다양한 경험을 추가하세요.`
      });
    }
  }

  // 2-4. 구체성 체크 (우선순위: 중간)
  const vagueExpressions = [
    '노력했습니다', '열심히', '최선을', '다양한', '여러', '많은', '기여했습니다', '참여했습니다'
  ];
  const vagueCount = vagueExpressions.filter(expr => allText.includes(expr)).length;

  if (vagueCount >= 5) {
    improvementCandidates.push({
      priority: 75,
      text: '추상적이고 모호한 표현이 많습니다. "어떻게", "무엇을", "얼마나" 등을 구체적으로 서술하세요.'
    });
  } else if (vagueCount >= 3) {
    improvementCandidates.push({
      priority: 60,
      text: '일부 내용을 더 구체적으로 작성하면 좋습니다. 상황, 행동, 결과를 명확히 표현하세요.'
    });
  }

  // 2-5. STAR 구조 체크 (우선순위: 낮음)
  const hasContext = /상황|배경|계기|문제/.test(allText);
  const hasAction = /진행|수행|개발|설계|분석|기획|실행/.test(allText);
  const hasResult = /결과|성과|개선|향상|달성|완성/.test(allText);

  const starScore = [hasContext, hasAction, hasResult].filter(Boolean).length;

  if (starScore < 2) {
    improvementCandidates.push({
      priority: 55,
      text: 'STAR 기법(상황-과제-행동-결과)을 활용하여 경험을 더 체계적으로 서술해보세요.'
    });
  }

  // 2-6. 직무 관련 키워드 체크 (우선순위: 중간)
  const topKeywords = stats.commonActivities
    .slice(0, 10)
    .flatMap(a => a.commonKeywords)
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .slice(0, 10);

  const userHasKeywords = topKeywords.filter(k => allText.includes(k)).length;
  const keywordCoverage = topKeywords.length > 0 ? userHasKeywords / topKeywords.length : 1;

  if (keywordCoverage < 0.3) {
    improvementCandidates.push({
      priority: 70,
      text: `직무 관련 핵심 키워드가 부족합니다. "${topKeywords.slice(0, 5).join('", "')}" 등을 활용한 경험을 추가해보세요.`
    });
  }

  // 3. 개선점 최종 선택 (우선순위 높은 순으로 최소 1개, 최대 5개)
  const improvements = improvementCandidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(item => item.text);

  // 개선점이 없으면 기본 개선점 추가 (항상 개선 여지는 있음)
  if (improvements.length === 0) {
    improvements.push('전반적으로 잘 작성되었으나, 각 경험에 대한 정량적 성과를 더 추가하면 경쟁력이 높아집니다.');
  }

  // 4. 추천사항 (더 다양하고 실용적으로)

  // 4-1. 상위 활동 중 누락된 것
  const topActivities = stats.commonActivities.slice(0, 8);
  topActivities.forEach((activity) => {
    // 유연한 매칭: "백엔드 개발" → "개발"로 매칭
    const lastWord = activity.activityType.split(' ').pop() || activity.activityType;
    const isAlreadyMentioned = allText.includes(lastWord);

    if (!isAlreadyMentioned && activity.percentage >= 15) {
      recommendations.push(`"${activity.activityType}" 경험 추가를 고려해보세요`);
    }
  });

  // 4-2. 핵심 역량 키워드 추가 추천
  if (stats.topSkills && stats.topSkills.length > 0) {
    const topSkills = stats.topSkills.slice(0, 10);
    const missingSkills = topSkills.filter(skill =>
      !allText.toLowerCase().includes(skill.skill.toLowerCase()) &&
      skill.percentage >= 30
    );

    if (missingSkills.length > 0) {
      const topMissingSkills = missingSkills.slice(0, 3).map(s => s.skill).join(', ');
      recommendations.push(`합격자들이 자주 언급하는 기술/역량을 추가해보세요: ${topMissingSkills}`);
    }
  }

  // 4-3. 학점/토익 기준 추천
  if (stats.avgGpa >= 4.0 && !allText.includes('학점')) {
    recommendations.push(`이 직무 합격자 평균 학점이 ${stats.avgGpa.toFixed(2)}점입니다. 학점이 높다면 언급하는 것이 좋습니다`);
  }

  if (stats.avgToeic >= 850 && !allText.includes('토익') && !allText.includes('영어')) {
    recommendations.push(`합격자 평균 토익 점수가 ${Math.round(stats.avgToeic)}점입니다. 어학 능력을 어필해보세요`);
  }

  // 4-4. 활동 개수 추천
  if (stats.activityEngagement && stats.activityEngagement.avgActivityCount > 0) {
    const userActivityCount = answers.length; // 간단한 근사치
    const avgActivityCount = stats.activityEngagement.avgActivityCount;

    if (userActivityCount < avgActivityCount * 0.7) {
      recommendations.push(`합격자들은 평균 ${avgActivityCount.toFixed(0)}개의 활동을 작성합니다. 경험을 더 추가해보세요`);
    }
  }

  // 4-5. 자격증 추천
  if (stats.topCertificates && stats.topCertificates.length > 0 && !allText.includes('자격증')) {
    const topCert = stats.topCertificates[0];
    if (topCert.percentage >= 30) {
      recommendations.push(`"${topCert.name}" 자격증을 고려해보세요`);
    }
  }

  // 4-6. 직무별 맞춤 추천
  if (position.includes('개발') && !allText.includes('GitHub') && !allText.includes('깃허브')) {
    recommendations.push('개발 직무는 GitHub 프로젝트 링크나 기술 블로그를 함께 제시하면 좋습니다');
  }

  if (position.includes('데이터') && numberCount < 5) {
    recommendations.push('데이터 직무는 구체적인 수치와 통계를 많이 활용하는 것이 좋습니다');
  }

  if (position.includes('기획') && !allText.includes('사용자') && !allText.includes('고객')) {
    recommendations.push('기획 직무는 사용자/고객 관점의 경험을 강조하면 효과적입니다');
  }

  if (position.includes('마케팅') && !allText.includes('성과') && numberCount < 3) {
    recommendations.push('마케팅 직무는 캠페인 성과를 정량적 지표로 표현하는 것이 중요합니다');
  }

  // 추천사항 제한 (최소 3개, 최대 8개)
  let finalRecommendations = recommendations.slice(0, 8);

  // 추천이 너무 적으면 기본 추천 추가
  if (finalRecommendations.length < 3) {
    if (!allText.includes('성과') || numberCount < 3) {
      finalRecommendations.push('각 경험마다 구체적인 성과를 수치로 표현해보세요');
    }
    if (!allText.includes('배운') && !allText.includes('깨달')) {
      finalRecommendations.push('경험을 통해 배운 점이나 성장한 부분을 추가하면 좋습니다');
    }
    if (allText.length < 1000) {
      finalRecommendations.push('전체 자기소개서 분량을 더 늘려 경험을 상세히 서술해보세요');
    }
  }

  return {
    strengths,
    improvements,
    recommendations: finalRecommendations,
  };
}
