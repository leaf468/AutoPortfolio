import { supabase } from '../lib/supabaseClient';
import OpenAI from 'openai';
import { SyntheticApplicant, toCoverLetters, toActivitiesBatch } from './syntheticDataAdapter';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';

export interface PortfolioRecommendation {
  skillsSuggestions: string[];
  projectIdeas: string[];
  experienceGaps: string[];
  improvementAreas: string[];
  dataBasedInsights: string[];
}

/**
 * 사용자 포트폴리오 분석 및 AI 기반 추천 생성
 */
export async function generatePortfolioRecommendations(
  userPortfolio: any,
  targetCompanies?: string[]
): Promise<PortfolioRecommendation> {
  try {
    // ✅ synthetic_applicants 테이블에서 데이터 가져오기
    let query = supabase.from('synthetic_applicants').select('*').limit(100);

    if (targetCompanies && targetCompanies.length > 0) {
      query = query.in('company_name', targetCompanies);
    }

    const { data: applicants, error } = await query;

    if (error) throw error;

    const syntheticApplicants = (applicants || []) as SyntheticApplicant[];
    const coverLetters = toCoverLetters(syntheticApplicants);
    const activities = toActivitiesBatch(syntheticApplicants);

    // 데이터 분석
    const analysisResult = analyzeApplicantData(syntheticApplicants, activities);

    // AI를 통한 추천 생성
    const recommendations = await generateAIRecommendations(
      userPortfolio,
      analysisResult,
      targetCompanies
    );

    return recommendations;
  } catch (error) {
    console.error('[generatePortfolioRecommendations] Error:', error);
    return {
      skillsSuggestions: [],
      projectIdeas: [],
      experienceGaps: [],
      improvementAreas: [],
      dataBasedInsights: [],
    };
  }
}

/**
 * 지원자 데이터 분석
 */
function analyzeApplicantData(applicants: SyntheticApplicant[], activities: any[]) {
  // 회사별 통계
  const companiesStats = new Map<string, number>();
  applicants.forEach((app) => {
    companiesStats.set(app.company_name, (companiesStats.get(app.company_name) || 0) + 1);
  });

  // 활동 타입별 통계
  const activityStats = new Map<string, number>();
  activities.forEach((act) => {
    activityStats.set(act.activity_type, (activityStats.get(act.activity_type) || 0) + 1);
  });

  // 스킬/기술 키워드 추출
  const skillKeywords = extractSkillKeywords(applicants);

  // GPA 평균
  const gpas = applicants
    .map(app => {
      const [gpa, maxGpa] = app.specs.gpa.split('/').map(parseFloat);
      return (gpa / maxGpa) * 4.5;
    })
    .filter(gpa => !isNaN(gpa));

  const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

  // 토익 평균
  const toeics = applicants.map(app => app.specs.toeic).filter(t => t > 0);
  const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;

  return {
    totalApplicants: applicants.length,
    topCompanies: Array.from(companiesStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name),
    topActivities: Array.from(activityStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / applicants.length) * 100,
      })),
    topSkills: skillKeywords,
    avgGpa,
    avgToeic,
  };
}

/**
 * 스킬 키워드 추출
 */
function extractSkillKeywords(applicants: SyntheticApplicant[]): string[] {
  const keywords = [
    'Python',
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Java',
    'Spring',
    'AWS',
    'Docker',
    'Kubernetes',
    'SQL',
    'MongoDB',
    'Git',
    'CI/CD',
    'Machine Learning',
    'Deep Learning',
    'Data Analysis',
    'API',
    '데이터 분석',
    '프로젝트 관리',
    '팀 리더십',
    '영어',
    '중국어',
  ];

  const skillCounts = new Map<string, number>();

  applicants.forEach((app) => {
    const fullText = app.cover_letter.map(q => q.answer).join(' ').toLowerCase();
    const activitiesText = app.activities.map(a => a.content).join(' ').toLowerCase();
    const combinedText = fullText + ' ' + activitiesText;

    keywords.forEach((keyword) => {
      if (combinedText.includes(keyword.toLowerCase())) {
        skillCounts.set(keyword, (skillCounts.get(keyword) || 0) + 1);
      }
    });
  });

  return Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill]) => skill);
}

/**
 * AI 기반 추천 생성
 */
async function generateAIRecommendations(
  userPortfolio: any,
  analysisResult: any,
  targetCompanies?: string[]
): Promise<PortfolioRecommendation> {
  try {
    const prompt = `
당신은 취업 컨설턴트 전문가입니다. 사용자의 포트폴리오를 분석하여 구체적인 개선 방안을 제시하세요.

=== 사용자 포트폴리오 ===
${JSON.stringify(userPortfolio, null, 2)}

=== AI 분석 결과 ===
- 분석 데이터 수: ${analysisResult.totalApplicants}개
- 주요 기업: ${analysisResult.topCompanies.join(', ')}
- 평균 학점: ${analysisResult.avgGpa.toFixed(2)}/4.5
- 평균 토익: ${Math.round(analysisResult.avgToeic)}점
- 주요 활동: ${analysisResult.topActivities.map((a: any) => `${a.type}(${a.percentage.toFixed(0)}%)`).join(', ')}
- 주요 기술: ${analysisResult.topSkills.join(', ')}

${targetCompanies && targetCompanies.length > 0 ? `=== 목표 기업 ===\n${targetCompanies.join(', ')}` : ''}

=== 분석 기준 ===
1. **스킬 갭 분석**: AI가 분석한 주요 기술 중 사용자에게 부족한 것
2. **활동 분석**: 주요 활동 중 사용자가 경험하지 못한 것
3. **차별화 포인트**: 사용자의 독특한 강점과 발전 방향
4. **정량적 개선**: 학점, 어학 점수 등 수치적 목표
5. **프로젝트 제안**: 부족한 부분을 채울 수 있는 구체적 프로젝트

=== 응답 형식 (JSON) ===
{
  "skillsSuggestions": [
    "추가하면 좋은 기술 스택 1 (분석 결과 X%가 보유)",
    "추가하면 좋은 기술 스택 2"
  ],
  "projectIdeas": [
    "부족한 스킬을 채울 수 있는 프로젝트 아이디어 1",
    "부족한 스킬을 채울 수 있는 프로젝트 아이디어 2"
  ],
  "experienceGaps": [
    "AI 분석 결과 부족한 경험 1 (구체적 통계 포함)",
    "AI 분석 결과 부족한 경험 2"
  ],
  "improvementAreas": [
    "구체적 개선 방안 1 (예: 학점 X.X 이상 목표)",
    "구체적 개선 방안 2"
  ],
  "dataBasedInsights": [
    "AI 분석 기반 인사이트 1 (예: 이 직무는 ~한 특징이 있습니다)",
    "AI 분석 기반 인사이트 2"
  ]
}

각 배열은 최소 3개 이상의 항목을 포함하세요.
모든 내용은 한국어로 작성하세요.
`;

    const response = await openai.chat.completions.create({
      model: REACT_APP_OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional career consultant specializing in tech industry hiring. Respond in Korean only.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
    });

    let content = response.choices[0].message?.content || '{}';

    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
    }

    const result = JSON.parse(content);
    return result as PortfolioRecommendation;
  } catch (error) {
    console.error('[generateAIRecommendations] Error:', error);
    return {
      skillsSuggestions: ['Python', 'React', 'AWS 등 클라우드 기술'],
      projectIdeas: ['웹 애플리케이션 개발 프로젝트', 'API 서버 구축 프로젝트'],
      experienceGaps: ['팀 프로젝트 경험', '오픈소스 기여 경험'],
      improvementAreas: ['학점 3.5 이상 목표', '토익 850점 이상 목표'],
      dataBasedInsights: [
        'AI 분석 결과, 해당 직무는 팀 프로젝트 경험이 중요합니다.',
        'AI 분석 결과, 대부분 3개 이상의 프로젝트를 보유하고 있습니다.',
      ],
    };
  }
}
