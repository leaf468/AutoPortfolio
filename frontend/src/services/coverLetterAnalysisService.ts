import { supabase } from '../lib/supabaseClient';

export interface CoverLetter {
  id: number;
  year: string;
  company_name: string;
  job_position: string;
  category: string;
  specific_info: string;
  full_text: string;
  created_at: string;
}

export interface Activity {
  id: number;
  cover_letter_id: number;
  activity_type: string;
  content: string;
  created_at: string;
}

export interface UserSpec {
  targetCompany: string; // 실제 지원 회사 (사용자 입력)
  referenceCategory?: string; // 참고할 회사 카테고리 (대기업, 스타트업 등)
  position: string;
  major?: string;
  year?: string;
  gpa?: string;
  toeic?: number;
  certificates?: string[];
  others?: string[];
}

export interface SimilarApplicant {
  coverLetter: CoverLetter;
  activities: Activity[];
  similarity: number;
}

export interface ActivityStatistics {
  activityType: string;
  count: number;
  percentage: number;
  examples: string[];
}

export interface CompanyStatistics {
  company: string;
  position: string;
  totalApplicants: number;
  avgGpa?: number;
  avgToeic?: number;
  topActivities: ActivityStatistics[];
  topCertificates: { name: string; percentage: number }[];
}

/**
 * 사용자 스펙과 비슷한 지원자 찾기
 */
export async function findSimilarApplicants(
  userSpec: UserSpec,
  limit: number = 10
): Promise<SimilarApplicant[]> {
  try {
    // 참고할 회사 또는 실제 지원 회사 사용
    const searchCompany = userSpec.targetCompany;

    // 같은 회사, 같은 직무의 자소서 가져오기
    const { data: coverLetters, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('company_name', searchCompany)
      .ilike('job_position', `%${userSpec.position}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!coverLetters || coverLetters.length === 0) return [];

    // 각 자소서의 활동 가져오기
    const coverLetterIds = coverLetters.map((cl) => cl.id);
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('*')
      .in('cover_letter_id', coverLetterIds);

    if (actError) throw actError;

    // 유사도 계산 및 정렬
    const results: SimilarApplicant[] = coverLetters.map((cl) => {
      const clActivities = activities?.filter((a) => a.cover_letter_id === cl.id) || [];
      const similarity = calculateSimilarity(cl, userSpec);

      return {
        coverLetter: cl,
        activities: clActivities,
        similarity,
      };
    });

    // 유사도 높은 순으로 정렬
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  } catch (error) {
    console.error('Error finding similar applicants:', error);
    return [];
  }
}

/**
 * 유사도 계산 (간단한 휴리스틱)
 */
function calculateSimilarity(coverLetter: CoverLetter, userSpec: UserSpec): number {
  let score = 0;

  // specific_info에서 학과, 학점, 토익 점수 등 파싱
  const info = coverLetter.specific_info.toLowerCase();

  // 학과 유사도
  if (userSpec.major && info.includes(userSpec.major.toLowerCase())) {
    score += 30;
  }

  // GPA 비교
  if (userSpec.gpa) {
    const gpaMatch = info.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
    if (gpaMatch) {
      const clGpa = parseFloat(gpaMatch[1]);
      const clMaxGpa = parseFloat(gpaMatch[2]);
      const clNormalizedGpa = (clGpa / clMaxGpa) * 4.5;
      const userGpa = parseFloat(userSpec.gpa);
      const gpaDiff = Math.abs(clNormalizedGpa - userGpa);
      score += Math.max(0, 20 - gpaDiff * 10);
    }
  }

  // 토익 점수 비교
  if (userSpec.toeic) {
    const toeicMatch = info.match(/토익\s*(\d+)/i) || info.match(/toeic\s*(\d+)/i);
    if (toeicMatch) {
      const clToeic = parseInt(toeicMatch[1]);
      const toeicDiff = Math.abs(clToeic - userSpec.toeic);
      score += Math.max(0, 20 - toeicDiff / 10);
    }
  }

  // 카테고리 매칭
  if (coverLetter.category.includes('신입')) {
    score += 10;
  }

  return score;
}

/**
 * 특정 회사/직무의 합격자 통계 분석
 */
export async function getCompanyStatistics(
  company: string,
  position?: string
): Promise<CompanyStatistics | null> {
  try {
    // 해당 회사의 자소서 가져오기
    let query = supabase
      .from('cover_letters')
      .select('*')
      .eq('company_name', company);

    if (position) {
      query = query.ilike('job_position', `%${position}%`);
    }

    const { data: coverLetters, error } = await query;

    if (error) throw error;
    if (!coverLetters || coverLetters.length === 0) return null;

    const totalApplicants = coverLetters.length;

    // 활동 통계 분석
    const coverLetterIds = coverLetters.map((cl) => cl.id);
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('*')
      .in('cover_letter_id', coverLetterIds);

    if (actError) throw actError;

    // 활동 타입별 집계
    const activityMap = new Map<string, { count: number; examples: string[] }>();
    activities?.forEach((act) => {
      const existing = activityMap.get(act.activity_type) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(act.content);
      }
      activityMap.set(act.activity_type, existing);
    });

    // 활동 통계 생성
    const topActivities: ActivityStatistics[] = Array.from(activityMap.entries())
      .map(([type, data]) => ({
        activityType: type,
        count: data.count,
        percentage: (data.count / totalApplicants) * 100,
        examples: data.examples,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // GPA 통계
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
    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : undefined;

    // 토익 통계
    const toeics: number[] = [];
    coverLetters.forEach((cl) => {
      const toeicMatch = cl.specific_info.match(/토익\s*(\d+)/i) || cl.specific_info.match(/toeic\s*(\d+)/i);
      if (toeicMatch) {
        toeics.push(parseInt(toeicMatch[1]));
      }
    });
    const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : undefined;

    // 자격증 분석 (간단한 휴리스틱)
    const certMap = new Map<string, number>();
    coverLetters.forEach((cl) => {
      const certMatch = cl.specific_info.match(/자격증[:\s]*([^,\n]+)/i);
      if (certMatch) {
        const cert = certMatch[1].trim();
        certMap.set(cert, (certMap.get(cert) || 0) + 1);
      }
    });

    const topCertificates = Array.from(certMap.entries())
      .map(([name, count]) => ({
        name,
        percentage: (count / totalApplicants) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    return {
      company,
      position: position || '전체',
      totalApplicants,
      avgGpa,
      avgToeic,
      topActivities,
      topCertificates,
    };
  } catch (error) {
    console.error('Error getting company statistics:', error);
    return null;
  }
}

/**
 * 모든 회사 목록 가져오기
 */
export async function getCompanyList(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('cover_letters')
      .select('company_name')
      .order('company_name');

    if (error) throw error;

    const companies = Array.from(new Set(data?.map((d) => d.company_name) || []));
    return companies;
  } catch (error) {
    console.error('Error getting company list:', error);
    return [];
  }
}

/**
 * 특정 회사의 직무 목록 가져오기
 */
export async function getPositionsByCompany(company: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('cover_letters')
      .select('job_position')
      .eq('company_name', company)
      .order('job_position');

    if (error) throw error;

    const positions = Array.from(new Set(data?.map((d) => d.job_position) || []));
    return positions;
  } catch (error) {
    console.error('Error getting positions:', error);
    return [];
  }
}

/**
 * 자소서 비교 분석
 */
export interface ComparisonResult {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingActivities: ActivityStatistics[];
}

export async function compareCoverLetter(
  userText: string,
  userSpec: UserSpec
): Promise<ComparisonResult> {
  try {
    // 참고할 회사 또는 실제 지원 회사 사용
    const searchCompany = userSpec.targetCompany;

    // 비슷한 지원자 찾기
    const similarApplicants = await findSimilarApplicants(userSpec, 10);

    // 통계 가져오기
    const stats = await getCompanyStatistics(searchCompany, userSpec.position);

    if (!stats) {
      return {
        strengths: [],
        weaknesses: [],
        suggestions: [],
        missingActivities: [],
      };
    }

    // 사용자 자소서에서 언급된 활동 추출 (간단한 키워드 매칭)
    const userActivities = new Set<string>();
    stats.topActivities.forEach((act) => {
      if (userText.toLowerCase().includes(act.activityType.toLowerCase())) {
        userActivities.add(act.activityType);
      }
    });

    // 누락된 중요 활동 찾기
    const missingActivities = stats.topActivities
      .filter((act) => !userActivities.has(act.activityType) && act.percentage > 30)
      .slice(0, 5);

    // 강점 분석
    const strengths: string[] = [];
    if (userActivities.size > 0) {
      strengths.push(`${Array.from(userActivities).join(', ')} 등의 활동을 언급하여 좋습니다.`);
    }

    // 약점 분석
    const weaknesses: string[] = [];
    if (missingActivities.length > 0) {
      weaknesses.push(
        `합격자의 ${missingActivities[0].percentage.toFixed(0)}%가 ${missingActivities[0].activityType} 경험을 언급했으나, 귀하의 자소서에는 없습니다.`
      );
    }

    // 제안
    const suggestions: string[] = [];
    missingActivities.forEach((act) => {
      suggestions.push(
        `${act.activityType} 경험 추가 권장 (합격자의 ${act.percentage.toFixed(0)}%가 보유)`
      );
    });

    return {
      strengths,
      weaknesses,
      suggestions,
      missingActivities,
    };
  } catch (error) {
    console.error('Error comparing cover letter:', error);
    return {
      strengths: [],
      weaknesses: [],
      suggestions: [],
      missingActivities: [],
    };
  }
}
