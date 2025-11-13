import { supabase } from '../lib/supabaseClient';
import { isSameIndustry } from './companyCategories';
import { CoverLetter, Activity } from './coverLetterAnalysisService';
import { normalizeUserPosition } from './positionNormalizationService';

export enum MatchLevel {
  완전일치 = '완전일치',
  같은회사_유사직무 = '같은 회사 + 유사 직무',
  유사산업_같은직무 = '유사 산업 + 같은 직무',
  유사산업_유사직무 = '유사 산업 + 유사 직무',
}

export interface AnalysisResult {
  coverLetters: CoverLetter[];
  activities: Activity[];
  matchLevel: MatchLevel;
  matchedCompanies: string[];
  totalCount: number;
}

/**
 * 직무 유사도 계산 (개선됨 - 표준 직무 기반)
 */
export function calculatePositionSimilarity(pos1: string, pos2: string): number {
  if (!pos1 || !pos2) return 0;
  const p1 = pos1.toLowerCase().trim();
  const p2 = pos2.toLowerCase().trim();

  // 완전 일치
  if (p1 === p2) return 100;

  // 표준 직무명으로 정규화
  const normalized1 = normalizeUserPosition(pos1);
  const normalized2 = normalizeUserPosition(pos2);

  // 정규화된 직무가 겹치면 80점
  const overlap = normalized1.filter(n => normalized2.includes(n));
  if (overlap.length > 0) return 80;

  // 부분 일치
  if (p1.includes(p2) || p2.includes(p1)) return 50;

  return 0;
}

/**
 * 우선순위 기반 유연한 분석 데이터 조회
 * 충분한 데이터(minCount)가 확보될 때까지 범위를 확대
 */
export async function getFlexibleAnalysisData(
  targetCompany: string,
  referenceCompany: string | undefined,
  position: string,
  minCount: number = 10
): Promise<AnalysisResult> {
  const searchCompany = referenceCompany || targetCompany;

  // 1단계: 완전 일치 (같은 회사 + 같은 직무)
  let result = await tryExactMatch(searchCompany, position);
  if (result.totalCount >= minCount) {
    return result;
  }

  // 2단계: 같은 회사 + 유사 직무
  result = await trySameCompanySimilarPosition(searchCompany, position);
  if (result.totalCount >= minCount) {
    return result;
  }

  // 3단계: 유사 산업 + 같은 직무
  result = await trySimilarIndustrySamePosition(searchCompany, position);
  if (result.totalCount >= minCount) {
    return result;
  }

  // 4단계: 유사 산업 + 유사 직무
  result = await trySimilarIndustrySimilarPosition(searchCompany, position);
  return result;
}

/**
 * 1단계: 완전 일치
 */
async function tryExactMatch(company: string, position: string): Promise<AnalysisResult> {
  const { data: coverLetters, error } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('company_name', company)
    .ilike('job_position', `%${position}%`)
    .limit(100);

  if (error || !coverLetters) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.완전일치,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  const activities = await getActivities(coverLetters.map((cl) => cl.id));

  return {
    coverLetters,
    activities,
    matchLevel: MatchLevel.완전일치,
    matchedCompanies: [company],
    totalCount: coverLetters.length,
  };
}

/**
 * 2단계: 같은 회사 + 유사 직무
 */
async function trySameCompanySimilarPosition(
  company: string,
  targetPosition: string
): Promise<AnalysisResult> {
  const { data: allPositions, error: posError } = await supabase
    .from('cover_letters')
    .select('job_position')
    .eq('company_name', company);

  if (posError || !allPositions) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.같은회사_유사직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  // 유사한 직무 찾기
  const similarPositions = Array.from(new Set(allPositions.map((p) => p.job_position)))
    .filter((pos) => calculatePositionSimilarity(pos, targetPosition) >= 50)
    .slice(0, 5);

  if (similarPositions.length === 0) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.같은회사_유사직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  const { data: coverLetters, error } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('company_name', company)
    .in('job_position', similarPositions)
    .limit(100);

  if (error || !coverLetters) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.같은회사_유사직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  const activities = await getActivities(coverLetters.map((cl) => cl.id));

  return {
    coverLetters,
    activities,
    matchLevel: MatchLevel.같은회사_유사직무,
    matchedCompanies: [company],
    totalCount: coverLetters.length,
  };
}

/**
 * 3단계: 유사 산업 + 같은 직무
 */
async function trySimilarIndustrySamePosition(
  targetCompany: string,
  position: string
): Promise<AnalysisResult> {
  const { data: allCompanies, error } = await supabase
    .from('cover_letters')
    .select('company_name')
    .ilike('job_position', `%${position}%`);

  if (error || !allCompanies) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.유사산업_같은직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  // 같은 산업의 회사들 찾기
  const similarCompanies = Array.from(new Set(allCompanies.map((c) => c.company_name)))
    .filter((company) => isSameIndustry(company, targetCompany))
    .slice(0, 10);

  if (similarCompanies.length === 0) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.유사산업_같은직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  const { data: coverLetters, error: clError } = await supabase
    .from('cover_letters')
    .select('*')
    .in('company_name', similarCompanies)
    .ilike('job_position', `%${position}%`)
    .limit(100);

  if (clError || !coverLetters) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.유사산업_같은직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  const activities = await getActivities(coverLetters.map((cl) => cl.id));

  return {
    coverLetters,
    activities,
    matchLevel: MatchLevel.유사산업_같은직무,
    matchedCompanies: similarCompanies,
    totalCount: coverLetters.length,
  };
}

/**
 * 4단계: 유사 산업 + 유사 직무
 */
async function trySimilarIndustrySimilarPosition(
  targetCompany: string,
  targetPosition: string
): Promise<AnalysisResult> {
  const { data: allData, error } = await supabase
    .from('cover_letters')
    .select('*')
    .limit(500);

  if (error || !allData) {
    return {
      coverLetters: [],
      activities: [],
      matchLevel: MatchLevel.유사산업_유사직무,
      matchedCompanies: [],
      totalCount: 0,
    };
  }

  // 유사 산업 + 유사 직무 필터링
  const filtered = allData.filter((cl) => {
    const isSimilarIndustry = isSameIndustry(cl.company_name, targetCompany);
    const isSimilarPosition = calculatePositionSimilarity(cl.job_position, targetPosition) >= 50;
    return isSimilarIndustry && isSimilarPosition;
  });

  const coverLetters = filtered.slice(0, 100);
  const matchedCompanies = Array.from(new Set(filtered.map((cl) => cl.company_name))).slice(0, 10);
  const activities = await getActivities(coverLetters.map((cl) => cl.id));

  return {
    coverLetters,
    activities,
    matchLevel: MatchLevel.유사산업_유사직무,
    matchedCompanies,
    totalCount: coverLetters.length,
  };
}

/**
 * 활동 데이터 조회
 */
async function getActivities(coverLetterIds: number[]): Promise<Activity[]> {
  if (coverLetterIds.length === 0) return [];

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .in('cover_letter_id', coverLetterIds);

  if (error || !data) return [];
  return data;
}
