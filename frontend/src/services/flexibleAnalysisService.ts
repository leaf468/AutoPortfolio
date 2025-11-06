import { supabase } from '../lib/supabaseClient';
import { inferCompanyCategory, isSameIndustry } from './companyCategories';
import { CoverLetter, Activity } from './coverLetterAnalysisService';

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
 * 직무 유사도 계산
 */
export function calculatePositionSimilarity(pos1: string, pos2: string): number {
  if (!pos1 || !pos2) return 0;
  const p1 = pos1.toLowerCase();
  const p2 = pos2.toLowerCase();

  // 완전 일치
  if (p1 === p2) return 100;

  // 키워드 기반 유사도 (더 많은 변형 포함)
  const keywords = [
    // 개발 관련
    ['개발', 'developer', 'dev', '엔지니어', 'engineer', '개발자', 'sw', '소프트웨어'],
    ['백엔드', 'backend', 'back-end', 'server', '서버', '백엔드개발', '서버개발'],
    ['프론트엔드', 'frontend', 'front-end', 'fe', '프론트', '프론트엔드개발', 'front'],
    ['풀스택', 'fullstack', 'full-stack', '풀스택개발'],
    ['웹', 'web', '웹개발', 'web developer', '웹엔지니어'],
    ['앱', 'app', '모바일', 'mobile', '안드로이드', 'android', 'ios', '앱개발'],

    // 데이터/AI 관련
    ['데이터', 'data', '분석', '데이터분석', '데이터사이언스', '데이터과학', '데이터분석가', 'analyst'],
    ['ai', 'ml', '머신러닝', '인공지능', 'ai/ml', '딥러닝', 'deep learning'],

    // 인프라/DevOps
    ['devops', '데브옵스', '인프라', 'infra', 'sre', '시스템', 'system'],

    // 기획 관련
    ['기획', 'pm', 'po', 'product', '프로덕트', '기획자', '상품기획', '서비스기획', '프로덕트매니저', 'product manager'],

    // 마케팅 관련 (확장)
    ['마케팅', 'marketing', '마케터', '퍼포먼스마케팅', '퍼포먼스', 'performance',
     '그로스', 'growth', '그로스마케팅', '그로스마케터', 'growth marketer',
     '브랜드마케팅', '브랜드', 'brand', '디지털마케팅', 'digital marketing',
     '콘텐츠마케팅', 'content marketing', 'cmo', '마케팅매니저',
     '온라인마케팅', '퍼포먼스마케터', 'performance marketer'],

    // 디자인 관련
    ['디자인', 'design', 'ux', 'ui', '디자이너', 'uxui', 'uiux', 'ux/ui', 'ui/ux',
     '프로덕트디자인', 'product design', '서비스디자인', 'graphic', '그래픽'],

    // 영업 관련
    ['영업', 'sales', '세일즈', '영업관리', 'account', '어카운트', 'bd', 'business development'],

    // 인사 관련
    ['인사', 'hr', '인적자원', '채용', '교육', '조직문화', 'hrbp', '인사담당', '리크루터', 'recruiter'],

    // 재무/회계
    ['재무', 'finance', '회계', '경리', '재무회계', '회계사', 'accounting'],

    // 법무
    ['법무', 'legal', '법률', '준법', 'compliance'],

    // 운영 관련
    ['운영', 'operation', '오퍼레이션', '운영관리', 'ops', '서비스운영'],

    // CS 관련
    ['cs', '고객지원', '고객서비스', '상담', 'customer service', 'support', '고객지원팀'],

    // 전략/컨설팅
    ['전략', 'strategy', '경영전략', '사업전략', '전략기획'],
    ['컨설팅', 'consulting', '컨설턴트', 'consultant'],

    // 연구개발
    ['연구', 'research', '연구개발', 'r&d', 'rd', '연구원', 'researcher'],

    // QA/테스트
    ['qa', 'qc', '품질', '품질관리', '테스트', 'tester', '품질보증', 'quality'],
  ];

  // 같은 키워드 그룹에 속하면 80점
  for (const group of keywords) {
    const p1Match = group.some((kw) => p1.includes(kw));
    const p2Match = group.some((kw) => p2.includes(kw));
    if (p1Match && p2Match) return 80;
  }

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
