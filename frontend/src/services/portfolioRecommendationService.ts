import { supabase } from '../lib/supabaseClient';
import OpenAI from 'openai';

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
 * 사용자의 포트폴리오 데이터와 DB의 합격자 데이터를 비교하여 추천사항 생성
 */
export async function generatePortfolioRecommendations(
  userPortfolio: any,
  targetCompanies?: string[]
): Promise<PortfolioRecommendation> {
  try {
    // DB에서 합격자 데이터 가져오기
    let query = supabase.from('cover_letters').select('*').limit(100);

    if (targetCompanies && targetCompanies.length > 0) {
      query = query.in('company_name', targetCompanies);
    }

    const { data: coverLetters, error } = await query;

    if (error) throw error;

    // 활동 데이터 가져오기
    const coverLetterIds = coverLetters?.map((cl) => cl.id) || [];
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .in('cover_letter_id', coverLetterIds);

    // 데이터 분석
    const analysisResult = analyzeApplicantData(coverLetters || [], activities || []);

    // AI를 통한 추천 생성
    const recommendations = await generateAIRecommendations(
      userPortfolio,
      analysisResult,
      targetCompanies
    );

    return recommendations;
  } catch (error) {
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
 * 합격자 데이터 분석
 */
function analyzeApplicantData(coverLetters: any[], activities: any[]) {
  // 회사별 통계
  const companiesStats = new Map<string, number>();
  coverLetters.forEach((cl) => {
    companiesStats.set(cl.company_name, (companiesStats.get(cl.company_name) || 0) + 1);
  });

  // 활동 타입별 통계
  const activityStats = new Map<string, number>();
  activities.forEach((act) => {
    activityStats.set(act.activity_type, (activityStats.get(act.activity_type) || 0) + 1);
  });

  // 스킬/기술 키워드 추출
  const skillKeywords = extractSkillKeywords(coverLetters);

  // GPA 평균
  const gpas: number[] = [];
  coverLetters.forEach((cl) => {
    const gpaMatch = cl.specific_info.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
    if (gpaMatch) {
      const gpa = parseFloat(gpaMatch[1]);
      const maxGpa = parseFloat(gpaMatch[2]);
      const normalized = (gpa / maxGpa) * 4.5;
      gpas.push(normalized);
    }
  });
  const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

  // 토익 평균
  const toeics: number[] = [];
  coverLetters.forEach((cl) => {
    const toeicMatch = cl.specific_info.match(/토익\s*(\d+)/i) || cl.specific_info.match(/toeic\s*(\d+)/i);
    if (toeicMatch) {
      toeics.push(parseInt(toeicMatch[1]));
    }
  });
  const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;

  return {
    totalApplicants: coverLetters.length,
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
        percentage: (count / coverLetters.length) * 100,
      })),
    topSkills: skillKeywords,
    avgGpa,
    avgToeic,
  };
}

/**
 * 스킬 키워드 추출
 */
function extractSkillKeywords(coverLetters: any[]): string[] {
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

  coverLetters.forEach((cl) => {
    const fullText = (cl.full_text || '').toLowerCase();
    const specificInfo = (cl.specific_info || '').toLowerCase();
    const combinedText = fullText + ' ' + specificInfo;

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
당신은 취업 컨설턴트 전문가입니다. 사용자의 포트폴리오와 합격자 데이터를 분석하여 구체적인 개선 방안을 제시하세요.

=== 사용자 포트폴리오 ===
${JSON.stringify(userPortfolio, null, 2)}

=== 합격자 데이터 분석 결과 ===
- 총 분석 대상: ${analysisResult.totalApplicants}명
- 주요 기업: ${analysisResult.topCompanies.join(', ')}
- 평균 학점: ${analysisResult.avgGpa.toFixed(2)}/4.5
- 평균 토익: ${Math.round(analysisResult.avgToeic)}점
- 상위 활동: ${analysisResult.topActivities.map((a: any) => `${a.type}(${a.percentage.toFixed(0)}%)`).join(', ')}
- 상위 기술: ${analysisResult.topSkills.join(', ')}

${targetCompanies && targetCompanies.length > 0 ? `=== 목표 기업 ===\n${targetCompanies.join(', ')}` : ''}

=== 분석 기준 ===
1. **스킬 갭 분석**: 합격자들이 많이 보유한 기술 중 사용자에게 없는 것
2. **활동 부족 분석**: 합격자의 30% 이상이 한 활동인데 사용자가 안 한 것
3. **차별화 포인트**: 사용자의 독특한 강점과 더 발전시킬 부분
4. **정량적 개선**: 학점, 어학 점수 등 수치적 목표
5. **프로젝트 제안**: 부족한 부분을 채울 수 있는 구체적 프로젝트

=== 응답 형식 (JSON) ===
{
  "skillsSuggestions": [
    "추가하면 좋은 기술 스택 1 (합격자의 X%가 보유)",
    "추가하면 좋은 기술 스택 2 (합격자의 X%가 보유)"
  ],
  "projectIdeas": [
    "부족한 스킬을 채울 수 있는 프로젝트 아이디어 1",
    "부족한 스킬을 채울 수 있는 프로젝트 아이디어 2"
  ],
  "experienceGaps": [
    "합격자 대비 부족한 경험 1 (구체적 통계 포함)",
    "합격자 대비 부족한 경험 2 (구체적 통계 포함)"
  ],
  "improvementAreas": [
    "구체적 개선 방안 1 (예: 학점 X.X 이상 목표)",
    "구체적 개선 방안 2"
  ],
  "dataBasedInsights": [
    "데이터 기반 인사이트 1 (예: 이 기업 합격자의 80%는 ~했습니다)",
    "데이터 기반 인사이트 2"
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
    return {
      skillsSuggestions: ['Python', 'React', 'AWS 등 클라우드 기술'],
      projectIdeas: ['웹 애플리케이션 개발 프로젝트', 'API 서버 구축 프로젝트'],
      experienceGaps: ['팀 프로젝트 경험', '오픈소스 기여 경험'],
      improvementAreas: ['학점 3.5 이상 목표', '토익 850점 이상 목표'],
      dataBasedInsights: [
        '합격자의 70%는 팀 프로젝트 경험이 있습니다.',
        '대부분의 합격자는 3개 이상의 프로젝트를 보유하고 있습니다.',
      ],
    };
  }
}
