/**
 * Synthetic 데이터 + 공개 직무 데이터 기반 종합 분석 서비스
 * 실제 유저 데이터 대신 synthetic_applicants와 공개 데이터 사용
 */

import { getSyntheticStats, SyntheticActivityPattern } from './syntheticStatsService';
import { getPublicJobSpec, PublicJobSpec } from '../data/publicJobData';

export interface ComprehensiveStats {
  position: string;
  totalApplicants: number;

  // 학력 통계 (공개 데이터)
  avgGpa: number;
  gpaRange: string;

  // 어학 통계 (공개 데이터)
  avgToeic: number;
  toeicRange: string;

  // 활동 패턴 (Synthetic 데이터)
  commonActivities: ActivityPattern[];

  // 자격증 (공개 데이터)
  topCertificates: Array<{ name: string; percentage: number }>;

  // 핵심 역량 키워드 (공개 데이터)
  topSkills: Array<{ skill: string; percentage: number }>;

  // 경력 (공개 데이터)
  avgExperience: string;

  // 연봉 범위 (공개 데이터)
  salaryRange: string;

  // 추천 공모전 (공개 데이터)
  recommendedCompetitions: Array<{ name: string; description: string; url?: string }>;

  // 인기 툴 (공개 데이터)
  popularTools: string[];

  // 유의미한 인사이트 (공개 데이터)
  insights: string[];
}

export interface ActivityPattern {
  activityType: string;
  percentage: number;
  count: number;
  examples: string[];
}

/**
 * Synthetic 데이터와 공개 데이터를 결합한 종합 통계 제공
 */
export async function getComprehensiveStats(
  position: string,
  skipAnonymization: boolean = false
): Promise<ComprehensiveStats> {
  try {
    // 1. Synthetic 데이터에서 활동 패턴 가져오기
    const syntheticStats = await getSyntheticStats(position);

    // 2. 공개 데이터에서 스펙 정보 가져오기
    const publicSpec = getPublicJobSpec(position);

    // 3. 활동 패턴 변환
    const activityPatterns: ActivityPattern[] = syntheticStats.commonActivities.map((activity) => ({
      activityType: activity.activityType,
      percentage: activity.percentage,
      count: activity.count,
      examples: activity.examples,
    }));

    // 4. 통합 통계 반환
    const stats: ComprehensiveStats = {
      position,
      totalApplicants: syntheticStats.totalApplicants,

      // 공개 데이터
      avgGpa: publicSpec.avgGpa,
      gpaRange: publicSpec.gpaRange,
      avgToeic: publicSpec.avgToeic,
      toeicRange: publicSpec.toeicRange,
      topCertificates: publicSpec.commonCertificates,
      topSkills: publicSpec.topSkills,
      avgExperience: publicSpec.avgExperience,
      salaryRange: publicSpec.salaryRange,
      recommendedCompetitions: publicSpec.recommendedCompetitions,
      popularTools: publicSpec.popularTools,
      insights: publicSpec.insights,

      // Synthetic 데이터
      commonActivities: activityPatterns,
    };

    return stats;
  } catch (error) {
    console.error('Failed to get comprehensive stats:', error);
    return getEmptyStats(position);
  }
}

function getEmptyStats(position: string): ComprehensiveStats {
  const publicSpec = getPublicJobSpec(position);

  return {
    position,
    totalApplicants: 0,
    avgGpa: publicSpec.avgGpa,
    gpaRange: publicSpec.gpaRange,
    avgToeic: publicSpec.avgToeic,
    toeicRange: publicSpec.toeicRange,
    commonActivities: [],
    topCertificates: publicSpec.commonCertificates,
    topSkills: publicSpec.topSkills,
    avgExperience: publicSpec.avgExperience,
    salaryRange: publicSpec.salaryRange,
    recommendedCompetitions: publicSpec.recommendedCompetitions,
    popularTools: publicSpec.popularTools,
    insights: publicSpec.insights,
  };
}
