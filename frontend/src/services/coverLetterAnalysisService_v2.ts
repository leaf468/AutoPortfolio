import { supabase } from '../lib/supabaseClient';
import {
  SyntheticApplicant,
  CoverLetter,
  Activity,
  toCoverLetters,
  toActivitiesBatch
} from './syntheticDataAdapter';

export interface UserSpec {
  targetCompany: string;
  referenceCategory?: string;
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
 * 직무 기반 유사 지원자 찾기 (Synthetic Data 사용)
 */
export async function findSimilarApplicants(
  userSpec: UserSpec,
  limit: number = 10
): Promise<SimilarApplicant[]> {
  try {
    const searchCompany = userSpec.targetCompany;

    // ✅ synthetic_applicants 테이블에서 조회
    const { data: applicants, error } = await supabase
      .from('synthetic_applicants')
      .select('*')
      .eq('company_name', searchCompany)
      .ilike('position', `%${userSpec.position}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!applicants || applicants.length === 0) return [];

    // 어댑터로 변환
    const coverLetters = toCoverLetters(applicants as SyntheticApplicant[]);
    const allActivities = toActivitiesBatch(applicants as SyntheticApplicant[]);

    // 유사도 계산 및 정렬
    const results: SimilarApplicant[] = coverLetters.map((cl) => {
      const clActivities = allActivities.filter((a) => a.cover_letter_id === cl.id);
      const similarity = calculateSimilarity(cl, userSpec, applicants as SyntheticApplicant[]);

      return {
        coverLetter: cl,
        activities: clActivities,
        similarity,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  } catch (error) {
    console.error('[findSimilarApplicants] Error:', error);
    return [];
  }
}

/**
 * 유사도 계산
 */
function calculateSimilarity(
  coverLetter: CoverLetter,
  userSpec: UserSpec,
  applicants: SyntheticApplicant[]
): number {
  let score = 0;

  const applicant = applicants.find(a => a.id === coverLetter.id);
  if (!applicant) return 0;

  // 학과 유사도
  if (userSpec.major && applicant.specs.major.includes(userSpec.major)) {
    score += 30;
  }

  // GPA 비교
  if (userSpec.gpa) {
    const [userGpaNum] = userSpec.gpa.split('/').map(parseFloat);
    const [applicantGpaNum, applicantMaxGpa] = applicant.specs.gpa.split('/').map(parseFloat);
    const normalizedApplicantGpa = (applicantGpaNum / applicantMaxGpa) * 4.5;
    const gpaDiff = Math.abs(normalizedApplicantGpa - userGpaNum);
    score += Math.max(0, 20 - gpaDiff * 10);
  }

  // 토익 점수 비교
  if (userSpec.toeic) {
    const toeicDiff = Math.abs(applicant.specs.toeic - userSpec.toeic);
    score += Math.max(0, 20 - toeicDiff / 10);
  }

  // 카테고리 매칭
  if (coverLetter.category.includes('대기업')) {
    score += 10;
  }

  return score;
}

/**
 * 특정 회사/직무의 통계 분석
 */
export async function getCompanyStatistics(
  company: string,
  position?: string
): Promise<CompanyStatistics | null> {
  try {
    let query = supabase
      .from('synthetic_applicants')
      .select('*')
      .eq('company_name', company);

    if (position) {
      query = query.ilike('position', `%${position}%`);
    }

    const { data: applicants, error } = await query;

    if (error) throw error;
    if (!applicants || applicants.length === 0) return null;

    const totalApplicants = applicants.length;
    const syntheticApplicants = applicants as SyntheticApplicant[];

    // 활동 통계 분석
    const allActivities = toActivitiesBatch(syntheticApplicants);
    const activityMap = new Map<string, { count: number; examples: string[] }>();

    allActivities.forEach((act) => {
      const existing = activityMap.get(act.activity_type) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(act.content);
      }
      activityMap.set(act.activity_type, existing);
    });

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
    const gpas = syntheticApplicants
      .map(a => {
        const [gpa, maxGpa] = a.specs.gpa.split('/').map(parseFloat);
        return (gpa / maxGpa) * 4.5;
      })
      .filter(gpa => !isNaN(gpa));

    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : undefined;

    // TOEIC 통계
    const toeics = syntheticApplicants
      .map(a => a.specs.toeic)
      .filter(t => t > 0);

    const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : undefined;

    // 자격증 분석
    const certMap = new Map<string, number>();
    syntheticApplicants.forEach((applicant) => {
      applicant.certifications.forEach(cert => {
        certMap.set(cert, (certMap.get(cert) || 0) + 1);
      });
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
    console.error('[getCompanyStatistics] Error:', error);
    return null;
  }
}

/**
 * 모든 회사 목록 가져오기
 */
export async function getCompanyList(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('synthetic_applicants')
      .select('company_name')
      .order('company_name');

    if (error) throw error;

    const companies = Array.from(new Set(data?.map((d) => d.company_name) || []));
    return companies;
  } catch (error) {
    console.error('[getCompanyList] Error:', error);
    return [];
  }
}

/**
 * 특정 회사의 직무 목록 가져오기
 */
export async function getPositionsByCompany(company: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('synthetic_applicants')
      .select('position')
      .eq('company_name', company)
      .order('position');

    if (error) throw error;

    const positions = Array.from(new Set(data?.map((d) => d.position) || []));
    return positions;
  } catch (error) {
    console.error('[getPositionsByCompany] Error:', error);
    return [];
  }
}

export interface ComparisonResult {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingActivities: ActivityStatistics[];
}

/**
 * 자소서 비교 분석
 */
export async function compareCoverLetter(
  userText: string,
  userSpec: UserSpec
): Promise<ComparisonResult> {
  try {
    const searchCompany = userSpec.targetCompany;

    // 유사 지원자 찾기
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

    // 사용자 자소서에서 언급된 활동 추출
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
      strengths.push(`${Array.from(userActivities).join(', ')} 등의 활동이 포함되어 있습니다.`);
    }

    // 약점 분석
    const weaknesses: string[] = [];
    if (missingActivities.length > 0) {
      weaknesses.push(
        `이 직무에서 중요한 ${missingActivities[0].activityType} 경험이 부족합니다 (${missingActivities[0].percentage.toFixed(0)}%가 보유).`
      );
    }

    // 제안
    const suggestions: string[] = [];
    missingActivities.forEach((act) => {
      suggestions.push(
        `${act.activityType} 경험 추가를 권장합니다 (${act.percentage.toFixed(0)}%가 보유)`
      );
    });

    return {
      strengths,
      weaknesses,
      suggestions,
      missingActivities,
    };
  } catch (error) {
    console.error('[compareCoverLetter] Error:', error);
    return {
      strengths: [],
      weaknesses: [],
      suggestions: [],
      missingActivities: [],
    };
  }
}
