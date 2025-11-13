import { supabase } from '../lib/supabaseClient';
import { CoverLetter, Activity } from './coverLetterAnalysisService';
import { CompanyCategory, inferCompanyCategory } from './companyCategories';
import { calculatePositionSimilarity } from './flexibleAnalysisService';

export interface RecommendedCompany {
  companyName: string;
  matchScore: number; // 0-100
  totalApplicants: number;
  avgGpa: number;
  avgToeic: number;
  topActivities: string[];
  reason: string; // 추천 이유
}

/**
 * 카테고리 기반으로 추천 회사 목록 생성
 */
export async function getRecommendedCompaniesByCategory(
  category: CompanyCategory,
  position: string,
  limit: number = 5
): Promise<RecommendedCompany[]> {
  try {
    // 1. 해당 카테고리의 모든 자소서 가져오기
    const { data: allCoverLetters } = await supabase
      .from('cover_letters')
      .select('*')
      .limit(1000);

    if (!allCoverLetters) return [];

    // 2. 카테고리 필터링
    const categoryCoverLetters = allCoverLetters.filter(
      (cl) => inferCompanyCategory(cl.company_name) === category
    );

    // 3. 회사별로 그룹화하고 직무 유사도 계산
    const companyMap = new Map<string, {
      coverLetters: CoverLetter[];
      positionSimilaritySum: number;
      positionCount: number;
    }>();

    categoryCoverLetters.forEach((cl) => {
      const existing = companyMap.get(cl.company_name) || {
        coverLetters: [],
        positionSimilaritySum: 0,
        positionCount: 0,
      };

      const similarity = calculatePositionSimilarity(position, cl.job_position);
      existing.coverLetters.push(cl);
      existing.positionSimilaritySum += similarity;
      existing.positionCount += 1;

      companyMap.set(cl.company_name, existing);
    });

    // 4. 각 회사에 대한 통계 계산
    const recommendations: RecommendedCompany[] = [];

    for (const [companyName, data] of Array.from(companyMap.entries())) {
      const avgPositionSimilarity = data.positionSimilaritySum / data.positionCount;

      // 직무 유사도가 50 이상인 경우만 추천
      if (avgPositionSimilarity < 50) continue;

      // 활동 데이터 가져오기
      const coverLetterIds = data.coverLetters.map((cl) => cl.id);
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .in('cover_letter_id', coverLetterIds);

      // 통계 계산
      const stats = calculateCompanyStats(data.coverLetters, activities || []);

      // 매치 스코어 계산 (직무 유사도 + 데이터 풍부도)
      const dataRichnessScore = Math.min(data.coverLetters.length * 5, 30); // 최대 30점
      const matchScore = avgPositionSimilarity * 0.7 + dataRichnessScore * 0.3;

      recommendations.push({
        companyName,
        matchScore,
        totalApplicants: data.coverLetters.length,
        avgGpa: stats.avgGpa,
        avgToeic: stats.avgToeic,
        topActivities: stats.topActivities,
        reason: generateReason(avgPositionSimilarity, data.coverLetters.length),
      });
    }

    // 5. 매치 스코어 순으로 정렬하고 상위 N개 반환
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (error) {
    console.error('추천 회사 목록 생성 실패:', error);
    return [];
  }
}

/**
 * 회사 통계 계산
 */
function calculateCompanyStats(
  coverLetters: CoverLetter[],
  activities: Activity[]
): {
  avgGpa: number;
  avgToeic: number;
  topActivities: string[];
} {
  // GPA 계산
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

  // TOEIC 계산
  const toeics: number[] = [];
  coverLetters.forEach((cl) => {
    const toeicMatch = cl.specific_info.match(/토익\s*(\d+)/i) || cl.specific_info.match(/toeic\s*(\d+)/i);
    if (toeicMatch) {
      toeics.push(parseInt(toeicMatch[1]));
    }
  });
  const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;

  // 상위 활동 추출
  const activityMap = new Map<string, number>();
  activities.forEach((act) => {
    activityMap.set(act.activity_type, (activityMap.get(act.activity_type) || 0) + 1);
  });

  const topActivities = Array.from(activityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return { avgGpa, avgToeic, topActivities };
}

/**
 * 추천 이유 생성
 */
function generateReason(positionSimilarity: number, dataCount: number): string {
  const reasons: string[] = [];

  if (positionSimilarity >= 90) {
    reasons.push('직무가 정확히 일치합니다');
  } else if (positionSimilarity >= 70) {
    reasons.push('유사한 직무입니다');
  } else {
    reasons.push('관련 직무입니다');
  }

  if (dataCount >= 20) {
    reasons.push('풍부한 합격자 데이터 보유');
  } else if (dataCount >= 10) {
    reasons.push('충분한 합격자 데이터 보유');
  } else {
    reasons.push(`${dataCount}명의 합격자 데이터 보유`);
  }

  return reasons.join(' • ');
}

/**
 * 특정 회사의 상세 통계 가져오기
 */
export async function getCompanyDetailStats(
  companyName: string,
  position: string
): Promise<{
  company: string;
  position: string;
  totalApplicants: number;
  positionMatches: number;
  avgGpa: number;
  avgToeic: number;
  topActivities: { type: string; count: number; percentage: number }[];
  topCertificates: { name: string; count: number }[];
} | null> {
  try {
    const { data: coverLetters } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('company_name', companyName);

    if (!coverLetters || coverLetters.length === 0) return null;

    // 직무 유사도 필터링
    const relevantCoverLetters = coverLetters.filter(
      (cl) => calculatePositionSimilarity(position, cl.job_position) >= 50
    );

    if (relevantCoverLetters.length === 0) return null;

    // 활동 데이터
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .in('cover_letter_id', relevantCoverLetters.map((cl) => cl.id));

    const stats = calculateCompanyStats(relevantCoverLetters, activities || []);

    // 활동 통계
    const activityMap = new Map<string, number>();
    (activities || []).forEach((act) => {
      activityMap.set(act.activity_type, (activityMap.get(act.activity_type) || 0) + 1);
    });

    const topActivities = Array.from(activityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / relevantCoverLetters.length) * 100,
      }));

    // 자격증 통계 (간단 추출)
    const certificateMap = new Map<string, number>();
    relevantCoverLetters.forEach((cl) => {
      const certMatches = cl.specific_info.match(/자격증[:\s]*([^,\n]+)/gi);
      if (certMatches) {
        certMatches.forEach((match) => {
          const cert = match.replace(/자격증[:\s]*/i, '').trim();
          if (cert.length > 0 && cert.length < 50) {
            certificateMap.set(cert, (certificateMap.get(cert) || 0) + 1);
          }
        });
      }
    });

    const topCertificates = Array.from(certificateMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      company: companyName,
      position,
      totalApplicants: relevantCoverLetters.length,
      positionMatches: relevantCoverLetters.length,
      avgGpa: stats.avgGpa,
      avgToeic: stats.avgToeic,
      topActivities,
      topCertificates,
    };
  } catch (error) {
    console.error('회사 상세 통계 조회 실패:', error);
    return null;
  }
}
