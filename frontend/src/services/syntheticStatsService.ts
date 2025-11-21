import { supabase } from '../lib/supabaseClient';

export interface SyntheticActivityPattern {
  activityType: string;
  percentage: number;
  count: number;
  examples: string[];
}

export interface SyntheticStats {
  position: string;
  totalApplicants: number;
  commonActivities: SyntheticActivityPattern[];
}

/**
 * synthetic_applicants 테이블에서 주요 활동 Top 10 추출
 */
export async function getSyntheticStats(position: string): Promise<SyntheticStats> {
  try {
    // synthetic_applicants에서 해당 직무 데이터 가져오기
    const { data: applicants, error } = await supabase
      .from('synthetic_applicants')
      .select('activities, position')
      .eq('position', position)
      .not('activities', 'is', null);

    if (error || !applicants || applicants.length === 0) {
      return {
        position,
        totalApplicants: 0,
        commonActivities: [],
      };
    }

    // activities 배열을 flatten
    const allActivities: Array<{ type: string; content: string }> = [];
    applicants.forEach((app) => {
      if (Array.isArray(app.activities)) {
        allActivities.push(...app.activities);
      }
    });

    // 활동 타입별로 그룹화하고 카운트
    const activityCounts = new Map<string, { count: number; examples: string[] }>();

    allActivities.forEach((activity) => {
      const type = activity.type || '기타';
      const existing = activityCounts.get(type) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 5) {
        // 최대 5개 예시만 저장
        existing.examples.push(activity.content);
      }
      activityCounts.set(type, existing);
    });

    // 상위 10개 추출
    const sortedActivities = Array.from(activityCounts.entries())
      .map(([type, data]) => ({
        activityType: type,
        count: data.count,
        percentage: (data.count / allActivities.length) * 100,
        examples: data.examples,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      position,
      totalApplicants: applicants.length,
      commonActivities: sortedActivities,
    };
  } catch (error) {
    console.error('Failed to fetch synthetic stats:', error);
    return {
      position,
      totalApplicants: 0,
      commonActivities: [],
    };
  }
}
