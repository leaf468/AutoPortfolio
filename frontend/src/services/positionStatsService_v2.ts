import { supabase } from '../lib/supabaseClient';
import { calculatePositionSimilarity } from './flexibleAnalysisService';
import { SyntheticApplicant } from './syntheticDataAdapter';

export interface PositionStats {
  position: string;
  totalApplicants: number;

  // 학점 통계
  avgGpa: number;
  gpaDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  // TOEIC 통계
  avgToeic: number;
  toeicDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  // 상위 활동
  topActivities: {
    activity: string;
    count: number;
    percentage: number;
  }[];

  // 상위 자격증
  topCertificates: {
    certificate: string;
    count: number;
    percentage: number;
  }[];

  // 전공 분포
  majorDistribution: {
    major: string;
    count: number;
    percentage: number;
  }[];

  // 학년 분포
  yearDistribution: {
    year: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * 직무별 통계 분석 (Synthetic Data 사용)
 */
export async function getPositionStats(position: string): Promise<PositionStats | null> {
  if (!position.trim()) return null;

  try {
    // ✅ synthetic_applicants 테이블에서 전체 데이터 가져오기
    const { data: applicants, error: clError } = await supabase
      .from('synthetic_applicants')
      .select('*')
      .limit(1000);

    if (clError || !applicants) {
      console.error('[getPositionStats] Error:', clError);
      return null;
    }

    const syntheticApplicants = applicants as SyntheticApplicant[];

    // 직무 유사도 기반 필터링 (유사도 50% 이상)
    const relevantApplicants = syntheticApplicants.filter((app) => {
      if (!app.position) return false;
      const similarity = calculatePositionSimilarity(app.position, position);
      return similarity >= 50;
    });

    if (relevantApplicants.length === 0) {
      return null;
    }

    const actualTotalApplicants = relevantApplicants.length;

    // 학점 통계
    const gpas: number[] = [];
    relevantApplicants.forEach((app) => {
      const [gpa, maxGpa] = app.specs.gpa.split('/').map(parseFloat);
      const normalized = (gpa / maxGpa) * 4.5;
      if (!isNaN(normalized)) {
        gpas.push(normalized);
      }
    });

    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

    const gpaDistribution = [
      { range: '4.0 이상', count: gpas.filter(g => g >= 4.0).length, percentage: 0 },
      { range: '3.5-3.9', count: gpas.filter(g => g >= 3.5 && g < 4.0).length, percentage: 0 },
      { range: '3.0-3.4', count: gpas.filter(g => g >= 3.0 && g < 3.5).length, percentage: 0 },
      { range: '3.0 미만', count: gpas.filter(g => g < 3.0).length, percentage: 0 },
    ].map(item => ({
      ...item,
      percentage: gpas.length > 0 ? (item.count / gpas.length) * 100 : 0,
    }));

    // TOEIC 통계
    const toeics: number[] = relevantApplicants
      .map(app => app.specs.toeic)
      .filter(t => t > 0);

    const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;

    const toeicDistribution = [
      { range: '900 이상', count: toeics.filter(t => t >= 900).length, percentage: 0 },
      { range: '800-899', count: toeics.filter(t => t >= 800 && t < 900).length, percentage: 0 },
      { range: '700-799', count: toeics.filter(t => t >= 700 && t < 800).length, percentage: 0 },
      { range: '700 미만', count: toeics.filter(t => t < 700).length, percentage: 0 },
    ].map(item => ({
      ...item,
      percentage: toeics.length > 0 ? (item.count / toeics.length) * 100 : 0,
    }));

    // 활동 통계
    const activityCounts: { [key: string]: number } = {};
    let totalActivities = 0;

    relevantApplicants.forEach(app => {
      (app.activities || []).forEach(act => {
        const actType = act.type;
        activityCounts[actType] = (activityCounts[actType] || 0) + 1;
        totalActivities++;
      });
    });

    const topActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([activity, count]) => ({
        activity,
        count,
        percentage: totalActivities > 0 ? (count / totalActivities) * 100 : 0,
      }));

    // 자격증 통계
    const certCounts: { [key: string]: number } = {};
    relevantApplicants.forEach(app => {
      (app.certifications || []).forEach(cert => {
        certCounts[cert] = (certCounts[cert] || 0) + 1;
      });
    });

    const topCertificates = Object.entries(certCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([certificate, count]) => ({
        certificate,
        count,
        percentage: (count / actualTotalApplicants) * 100,
      }));

    // 전공 분포
    const majorCounts: { [key: string]: number } = {};
    relevantApplicants.forEach(app => {
      const major = app.specs.major;
      if (major) {
        majorCounts[major] = (majorCounts[major] || 0) + 1;
      }
    });

    const majorDistribution = Object.entries(majorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([major, count]) => ({
        major,
        count,
        percentage: (count / actualTotalApplicants) * 100,
      }));

    // 학년 분포
    const yearCounts: { [key: string]: number } = {};
    relevantApplicants.forEach(app => {
      if (app.year) {
        yearCounts[app.year] = (yearCounts[app.year] || 0) + 1;
      }
    });

    const yearDistribution = Object.entries(yearCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([year, count]) => ({
        year,
        count,
        percentage: (count / actualTotalApplicants) * 100,
      }));

    return {
      position,
      totalApplicants: actualTotalApplicants,
      avgGpa,
      gpaDistribution,
      avgToeic,
      toeicDistribution,
      topActivities,
      topCertificates,
      majorDistribution,
      yearDistribution,
    };
  } catch (error) {
    console.error('[getPositionStats] Error:', error);
    return null;
  }
}
