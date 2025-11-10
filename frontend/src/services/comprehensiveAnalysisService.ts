import { supabase } from '../lib/supabaseClient';
import { calculatePositionSimilarity } from './flexibleAnalysisService';
import { IntegratedCoverLetter, parseGpa, parseToeic, getAllActivities } from './integratedCoverLetterTypes';

// Activity 타입 정의 (integrated_cover_letters용)
interface Activity {
  id: number;
  cover_letter_id: number;
  activity_type: string;
  content: string;
  created_at: string;
}

export interface ComprehensiveStats {
  position: string;
  totalApplicants: number;

  // 학력 통계
  avgGpa: number;
  gpaDistribution: { range: string; percentage: number }[];
  topUniversities: { name: string; count: number }[];
  topMajors: { name: string; count: number }[];

  // 어학 통계
  avgToeic: number;
  toeicDistribution: { range: string; percentage: number }[];

  // 활동 패턴
  commonActivities: ActivityPattern[];

  // 자격증
  topCertificates: { name: string; percentage: number }[];

  // 유의미한 인사이트
  insights: string[];
}

export interface ActivityPattern {
  activityType: string;
  percentage: number;
  averageCount: number;
  commonKeywords: string[];
  examples: string[];
  insight: string;
}

/**
 * 전체 데이터에서 특정 직무의 종합 통계 분석
 */
export async function getComprehensiveStats(position: string): Promise<ComprehensiveStats> {
  try {
    // integrated_cover_letters에서 전체 데이터 가져오기
    const { data: allCoverLetters, error } = await supabase
      .from('integrated_cover_letters')
      .select('*')
      .limit(1000);

    // DB에 있는 모든 직무 목록 확인
    const allPositions = Array.from(new Set(allCoverLetters?.map(cl => (cl as any).job_position).filter(Boolean))).slice(0, 20);

    console.log('🔍 DB 조회 결과:', {
      error,
      dataCount: allCoverLetters?.length,
      firstItem: allCoverLetters?.[0],
      DB내_모든_직무_샘플: allPositions
    });

    if (error || !allCoverLetters) {
      console.error('데이터 조회 실패:', error);
      return getEmptyStats(position);
    }

    // 유사 직무 필터링 (유사도 50% 이상)
    const relevantCoverLetters = (allCoverLetters as IntegratedCoverLetter[]).filter((cl) => {
      if (!cl.job_position) return false;
      const similarity = calculatePositionSimilarity(cl.job_position, position);
      return similarity >= 50; // 50% 이상 유사도 (마케터-마케팅, 개발자-개발 등 포함)
    });

    // 매칭된 직무 목록 추출 (디버깅용)
    const matchedPositions = Array.from(
      new Set(relevantCoverLetters.map(cl => cl.job_position))
    ).slice(0, 10);

    console.log('🔍 필터링 후:', {
      검색한_직무: position,
      전체_데이터: allCoverLetters.length,
      매칭된_데이터: relevantCoverLetters.length,
      매칭된_직무들: matchedPositions,
      유사도_샘플: relevantCoverLetters.slice(0, 5).map(cl => ({
        직무: cl.job_position,
        유사도: calculatePositionSimilarity(cl.job_position, position)
      }))
    });

    if (relevantCoverLetters.length === 0) {
      return getEmptyStats(position);
    }

    // activities는 이제 각 자소서 내부에 JSON으로 있음
    const allActivities = relevantCoverLetters.flatMap(cl =>
      getAllActivities(cl.activities).map(content => ({
        id: cl.id,
        cover_letter_id: cl.id,
        activity_type: 'integrated',
        content,
        created_at: ''
      }))
    );

    console.log('📊 통계 계산:', {
      매칭된_지원자수: relevantCoverLetters.length,
      추출된_활동수: allActivities.length,
      활동_샘플: allActivities.slice(0, 3).map(a => a.content.slice(0, 50))
    });

    const stats: ComprehensiveStats = {
      position,
      totalApplicants: relevantCoverLetters.length,
      avgGpa: calculateAvgGpa(relevantCoverLetters),
      gpaDistribution: calculateGpaDistribution(relevantCoverLetters),
      topUniversities: extractTopUniversities(relevantCoverLetters),
      topMajors: extractTopMajors(relevantCoverLetters),
      avgToeic: calculateAvgToeic(relevantCoverLetters),
      toeicDistribution: calculateToeicDistribution(relevantCoverLetters),
      commonActivities: analyzeActivityPatterns(allActivities, relevantCoverLetters.length),
      topCertificates: extractTopCertificates(relevantCoverLetters),
      insights: generateInsights(relevantCoverLetters, allActivities),
    };

    return stats;
  } catch (error) {
    console.error('종합 통계 분석 실패:', error);
    return getEmptyStats(position);
  }
}

function getEmptyStats(position: string): ComprehensiveStats {
  return {
    position,
    totalApplicants: 0,
    avgGpa: 0,
    gpaDistribution: [],
    topUniversities: [],
    topMajors: [],
    avgToeic: 0,
    toeicDistribution: [],
    commonActivities: [],
    topCertificates: [],
    insights: [],
  };
}

function calculateAvgGpa(coverLetters: IntegratedCoverLetter[]): number {
  const gpas: number[] = [];
  coverLetters.forEach((cl, index) => {
    const gpaString = cl.user_spec?.gpa;
    const normalizedGpa = parseGpa(gpaString);

    if (index < 5) {
      console.log(`📊 GPA 샘플 ${index + 1}:`, {
        원본: gpaString,
        파싱결과: normalizedGpa,
        user_spec: cl.user_spec
      });
    }

    if (normalizedGpa !== null) {
      gpas.push(normalizedGpa);
    }
  });

  console.log(`✅ GPA 통계:`, {
    전체인원: coverLetters.length,
    유효데이터: gpas.length,
    평균: gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0,
    샘플: gpas.slice(0, 5)
  });

  return gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
}

function calculateGpaDistribution(coverLetters: IntegratedCoverLetter[]): { range: string; percentage: number }[] {
  const ranges = [
    { range: '4.0 이상', min: 4.0, max: 5.0 },
    { range: '3.5 ~ 3.99', min: 3.5, max: 3.99 },
    { range: '3.0 ~ 3.49', min: 3.0, max: 3.49 },
    { range: '3.0 미만', min: 0, max: 2.99 },
  ];

  const gpas: number[] = [];
  coverLetters.forEach((cl) => {
    const normalizedGpa = parseGpa(cl.user_spec?.gpa);
    if (normalizedGpa !== null) {
      gpas.push(normalizedGpa);
    }
  });

  if (gpas.length === 0) return [];

  return ranges.map((range) => {
    const count = gpas.filter((gpa) => gpa >= range.min && gpa <= range.max).length;
    return {
      range: range.range,
      percentage: Math.min((count / gpas.length) * 100, 100),
    };
  });
}

function extractTopUniversities(coverLetters: IntegratedCoverLetter[]): { name: string; count: number }[] {
  const univMap = new Map<string, number>();
  const univKeywords = [
    'SKY', '서울대', '연세대', '고려대',
    'KAIST', 'POSTECH', '포항공대',
    '성균관대', '한양대', '중앙대', '경희대', '이화여대',
    '서강대', '숙명여대', '동국대', '건국대', '홍익대',
  ];

  coverLetters.forEach((cl) => {
    const school = cl.user_spec?.school || '';
    univKeywords.forEach((keyword) => {
      if (school.includes(keyword)) {
        univMap.set(keyword, (univMap.get(keyword) || 0) + 1);
      }
    });
  });

  return Array.from(univMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function extractTopMajors(coverLetters: IntegratedCoverLetter[]): { name: string; count: number }[] {
  const majorMap = new Map<string, number>();
  const majorKeywords = [
    '컴퓨터공학', '소프트웨어', '전자공학', '정보통신',
    '경영학', '경영', '경제학', '행정학', '국제학',
    '기계공학', '화학공학', '산업공학',
    '수학', '통계학', '물리학',
  ];

  coverLetters.forEach((cl) => {
    const major = cl.user_spec?.major || '';
    majorKeywords.forEach((keyword) => {
      if (major.includes(keyword)) {
        majorMap.set(keyword, (majorMap.get(keyword) || 0) + 1);
      }
    });
  });

  return Array.from(majorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateAvgToeic(coverLetters: IntegratedCoverLetter[]): number {
  const toeics: number[] = [];
  coverLetters.forEach((cl, index) => {
    const toeicString = cl.user_spec?.toeic;
    const score = parseToeic(toeicString);

    if (index < 5) {
      console.log(`📊 TOEIC 샘플 ${index + 1}:`, {
        원본: toeicString,
        파싱결과: score,
        user_spec: cl.user_spec
      });
    }

    if (score !== null) {
      toeics.push(score);
    }
  });

  console.log(`✅ TOEIC 통계:`, {
    전체인원: coverLetters.length,
    유효데이터: toeics.length,
    평균: toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0,
    샘플: toeics.slice(0, 5)
  });

  return toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;
}

function calculateToeicDistribution(coverLetters: IntegratedCoverLetter[]): { range: string; percentage: number }[] {
  const ranges = [
    { range: '900점 이상', min: 900, max: 1000 },
    { range: '800 ~ 899점', min: 800, max: 899 },
    { range: '700 ~ 799점', min: 700, max: 799 },
    { range: '700점 미만', min: 300, max: 699 },
  ];

  const toeics: number[] = [];
  coverLetters.forEach((cl) => {
    const score = parseToeic(cl.user_spec?.toeic);
    if (score !== null && score <= 990) {
      toeics.push(score);
    }
  });

  if (toeics.length === 0) return [];

  return ranges.map((range) => {
    const count = toeics.filter((score) => score >= range.min && score <= range.max).length;
    return {
      range: range.range,
      percentage: Math.min((count / toeics.length) * 100, 100),
    };
  });
}

export function extractCoreActivity(content: string): string {
  let text = content.trim();

  // 1. 활동이 아닌 내용 강력 필터링
  const skipPatterns = [
    // 회사/게임 설명 및 개인 경험담
    /^.{0,40}(회사|기업|대기업|넥슨|현대|삼성|게임|서든|피파|배틀그라운드).*?(대표|유명|선두|동반자|즐기|사랑|동경)/,
    /학창\s*시절|어릴\s*적|어렸을\s*때|꾸준히.*?즐기|막연한\s*동경/,

    // 지원동기/희망/다짐/생각
    /입사\s*후|만들고\s*싶|하고\s*싶|기여.*?싶|열정|바람|희망|목표|다짐|동경|매력|느껴/,
    /사랑받을\s*수\s*있는|장기간\s*사랑/,
    /생각합니다|생각|생각하|필수적이라고|필요하다고|해낼\s*수\s*있다/,

    // 학습/능력 향상/깨달음
    /능력을\s*키|역량을|방법을\s*배|이해.*?키|경험.*?습득|발전시|향상시|키울\s*수\s*있/,
    /중요성|이해하|습득|발전|배웠|깨달|느끼|알게|익히/,
    /배운|배우고|학습|공부|수강|이수/,
    /을\s*가지고\s*있|능력이\s*있|할\s*수\s*있는\s*능력/,
    /극대화해야겠다|필요하다고|충분하다고/,

    // 역할/태도 설명 (활동 아님)
    /역할을\s*담당|가교\s*역할|커뮤니케이션.*?역할/,
    /조장을\s*맡아|팀장을\s*맡아|리더를\s*맡아/,
    /장점이\s*발휘|강점이\s*발휘/,

    // 추상적 설명
    /유저와\s*시장|동향|전략|시나리오|모델|캔버스|분석을\s*통한/,
    /업무를\s*원활히|업무\s*수행/,

    // 처리/제안/기획만 (구체적 내용 없음)
    /^.{0,30}건.*?처리$/,
    /^.{0,30}방식을\s*제안$/,

    // 1인칭 또는 주관적 표현
    /^.{0,10}(저는|나는|제가|저의|나의)/,
  ];

  if (skipPatterns.some(p => p.test(text))) {
    return '';
  }

  // 2. 문장 끝 패턴으로도 필터링 (활동이 아닌 내용)
  const endPatterns = [
    /였습니다?\.?$/,  // ~였습니다 (과거 상태)
    /였어\.?$/,
    /였$/,
    /품어왔$/,  // ~품어왔다
    /즐기며$/,  // ~즐기며
    /동경.*?왔$/,  // 동경을 품어왔다
  ];

  if (endPatterns.some(p => p.test(text))) {
    return '';
  }

  // 3. 핵심 활동만 추출 (불필요한 부분 제거)
  text = text
    // 불필요한 앞부분 제거
    .replace(/^.{0,30}(전|이전|첫)\s*(회사|직장)에서\s*/g, '')
    .replace(/^.{0,20}에서\s*/g, '')
    .replace(/^.{0,20}으로\s*/g, '')

    // 불필요한 뒷부분 제거 (활동 외 내용)
    .replace(/\s*요청을\s*받아.*$/g, '')
    .replace(/\s*프로젝트를\s*주도.*$/g, '')
    .replace(/\s*을\s*주도.*$/g, '')
    .replace(/\s*을\s*총괄.*$/g, '')
    .replace(/\s*에서\s*여러\s*번의\s*실패를\s*겪.*$/g, '')
    .replace(/\s*한\s*경험이\s*있습니다\.?$/g, '')
    .replace(/\s*경험이\s*있습니다\.?$/g, '')
    .replace(/\s*경험을\s*.*?습니다\.?$/g, '')
    .replace(/\s*하며.*$/g, '')
    .replace(/\s*하면서.*$/g, '')
    .replace(/\s*하고\s*있.*$/g, '')

    // 어미 정리
    .replace(/했습니다\.?$/g, '')
    .replace(/했음\.?$/g, '')
    .replace(/합니다\.?$/g, '')
    .replace(/습니다\.?$/g, '')
    .replace(/있습니다\.?$/g, '')
    .replace(/함\.?$/g, '')
    .replace(/\.{3,}$/g, '');  // ... 제거

  // 4. 첫 문장만 추출 (마침표 기준)
  text = text.split(/\.\s+/)[0];

  // 5. 너무 짧거나 의미없는 경우 필터링
  if (text.length < 15) {
    return '';
  }

  // 6. 쉼표로 분리 (나중에 개별 처리)
  text = text.replace(/\s*,\s*/g, ' | ');

  // 7. 최종 정리
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

function generateExamplesFromDB(
  activityType: string,
  keywords: string[],
  allActivities: Activity[],
  count: number
): string[] {
  const baseType = activityType.split(' ').pop() || activityType;
  const prefix = activityType.split(' ')[0] || '';

  // DB에서 관련 활동 찾기
  const relatedActivities: string[] = [];

  for (const act of allActivities) {
    if (relatedActivities.length >= count * 3) break; // 충분히 수집

    const content = act.content;

    // 현재 활동 타입과 관련된 내용인지 확인
    const isRelated =
      content.includes(baseType) ||
      keywords.some(kw => content.includes(kw)) ||
      (prefix && prefix.length > 1 && content.includes(prefix));

    if (!isRelated) continue;

    // 핵심 활동 추출
    const extracted = extractCoreActivity(content);
    if (!extracted || extracted.length < 15) continue;

    // | 로 분리된 활동들
    const activities = extracted.split(' | ').map(a => a.trim());

    activities.forEach(activity => {
      if (activity.length > 15 && !relatedActivities.includes(activity)) {
        // 너무 일반적인 표현 필터링
        if (!activity.includes('프로젝트 참여') &&
            !activity.includes('기반 개발') &&
            !activity.includes('시스템 개발 수행') &&
            !activity.includes('관련 개발 경험') &&
            !activity.includes('분야 개발 활동')) {
          relatedActivities.push(activity);
        }
      }
    });
  }

  // 충분한 예시가 있으면 반환
  if (relatedActivities.length >= count) {
    return relatedActivities.slice(0, count);
  }

  // 부족하면 구체적인 템플릿 추가
  return [...relatedActivities, ...generateConcreteExamples(activityType, keywords, count - relatedActivities.length)];
}

function generateConcreteExamples(activityType: string, keywords: string[], count: number): string[] {
  const prefix = activityType.split(' ')[0] || '';
  const baseType = activityType.split(' ').pop() || activityType;

  const exampleTemplates: { [key: string]: string[] } = {
    '프로젝트': [
      `React/Next.js 기반 웹 애플리케이션 개발`,
      `모바일 앱 UI/UX 설계 및 Flutter 구현`,
      `RESTful API 서버 개발 (Node.js/Express)`,
      `실시간 채팅 시스템 구축 (WebSocket)`,
      `관리자 대시보드 개발 (데이터 시각화)`,
    ],
    '개발': [
      `${prefix} 백엔드 API 설계 및 개발`,
      `${prefix} 프론트엔드 컴포넌트 시스템 구축`,
      `${prefix} CI/CD 파이프라인 구축`,
      `${prefix} 데이터베이스 스키마 설계 및 최적화`,
      `${prefix} 테스트 자동화 환경 구축`,
    ],
    '연구': [
      `${prefix} 분야 실험 설계 및 데이터 수집`,
      `${prefix} 관련 논문 작성 및 학술지 투고`,
      `${prefix} 신기술 검증 및 프로토타입 제작`,
      `${prefix} 학회 발표 및 포스터 세션 참여`,
      `${prefix} 특허 출원 및 기술 문서 작성`,
    ],
    '분석': [
      `사용자 행동 패턴 데이터 분석 (Python/SQL)`,
      `A/B 테스트 설계 및 통계 분석`,
      `비즈니스 지표 대시보드 구축 (Tableau)`,
      `머신러닝 모델 활용한 예측 분석`,
      `고객 세그먼테이션 및 인사이트 도출`,
    ],
    '인턴': [
      `${prefix} 기업 실무 프로젝트 참여 (3-6개월)`,
      `${prefix} 회사 기술 스택 학습 및 업무 적용`,
      `${prefix} 팀 협업 및 코드 리뷰 참여`,
      `${prefix} 업무 자동화 스크립트 개발`,
      `${prefix} 기술 문서 작성 및 위키 정리`,
    ],
    '공모전': [
      `${prefix} 공모전 팀 프로젝트 기획 및 개발`,
      `${prefix} 아이디어 구현 및 프로토타입 제작`,
      `${prefix} 프레젠테이션 자료 작성 및 발표`,
      `${prefix} 비즈니스 모델 설계 및 검증`,
      `${prefix} 공모전 입상 (우수상/장려상 등)`,
    ],
    '해커톤': [
      `${prefix} 해커톤 24시간 집중 개발`,
      `${prefix} 팀원과 협업하여 MVP 제작`,
      `${prefix} 신기술 빠른 학습 및 적용`,
      `${prefix} 멘토 피드백 기반 개선`,
      `${prefix} 데모 시연 및 결과 발표`,
    ],
    '동아리': [
      `${prefix} 동아리 정기 세미나 및 스터디 운영`,
      `${prefix} 동아리 프로젝트 팀 리딩`,
      `${prefix} 외부 기업/학교와 교류 활동`,
      `${prefix} 동아리 운영진 활동 (회장/총무 등)`,
      `${prefix} 신입 회원 멘토링 및 교육`,
    ],
    '스터디': [
      `${prefix} 스터디 그룹 운영 및 일정 관리`,
      `${prefix} 주제 발표 및 지식 공유`,
      `${prefix} 코딩 테스트 문제 풀이 스터디`,
      `${prefix} 기술 서적 독서 스터디 진행`,
      `${prefix} 프로젝트 기반 실습 스터디`,
    ],
    '수상': [
      `${prefix} 대회 수상 (금상/은상/동상 등)`,
      `${prefix} 공모전 입상 및 상금 수령`,
      `${prefix} 학술 논문 우수 논문상 수상`,
      `${prefix} 교내 경진대회 1등 수상`,
      `${prefix} 해커톤 최우수상 수상`,
    ],
  };

  let templates = exampleTemplates[baseType] || [];

  // 접두사가 있는 경우 맞춤형 생성
  if (prefix && prefix !== baseType) {
    templates = [
      `${prefix} ${baseType} 프로젝트 참여`,
      `${prefix} 기반 ${baseType} 구현`,
      `${prefix} 시스템 ${baseType} 수행`,
      `${prefix} 관련 ${baseType} 경험`,
      `${prefix} 분야 ${baseType} 활동`,
    ];
  }

  // 기본 템플릿이 없으면 일반 형식
  if (templates.length === 0) {
    templates = [
      `${activityType} 프로젝트 수행`,
      `${activityType} 실무 경험`,
      `${activityType} 팀 프로젝트 참여`,
      `${activityType} 개인 프로젝트 진행`,
      `${activityType} 역량 강화 활동`,
    ];
  }

  return templates.slice(0, count);
}

// 의미 없는 키워드 필터 (활동으로 카운트하지 않을 키워드)
const MEANINGLESS_KEYWORDS = [
  '활동', '경험', '느낀', '느낀점', '생각', '배운', '배운점', '깨달음', '느낌',
  '소감', '후기', '회고', '성장', '발전', '변화', '역량', '능력', '자질',
  '태도', '마음가짐', '자세', '의지', '열정', '목표', '다짐', '희망', '바람',
  '기여', '노력', '시간', '과정', '단계', '내용', '부분', '요소', '측면',
  '특징', '장점', '강점', '매력', '가치', '의미', '중요성', '필요성',
  '이해', '파악', '습득', '학습', '공부', '관심', '흥미', '동기', '계기',
  '기회', '경우', '상황', '환경', '조건', '여건', '문제', '과제', '방법',
  '전략', '계획', '목적', '이유', '원인', '결과', '영향', '효과', '성과',
];

function analyzeActivityPatterns(activities: Activity[], totalApplicants: number): ActivityPattern[] {
  // 구체적인 활동명 추출을 위한 패턴 (명사만 매칭)
  const activityPatterns = [
    { keyword: '프로젝트', pattern: /([\w가-힣]{2,10})\s*프로젝트/g },
    { keyword: '개발', pattern: /([\w가-힣]{2,10})\s*개발/g },
    { keyword: '분석', pattern: /([\w가-힣]{2,10})\s*분석/g },
    { keyword: '인턴', pattern: /([\w가-힣]{2,10})\s*인턴(십)?/g },
    { keyword: '공모전', pattern: /([\w가-힣]{2,10})\s*공모전/g },
    { keyword: '해커톤', pattern: /([\w가-힣]{2,10})\s*해커톤/g },
    { keyword: '대회', pattern: /([\w가-힣]{2,10})\s*(대회|경진대회)/g },
    { keyword: '연구', pattern: /([\w가-힣]{2,10})\s*연구/g },
    { keyword: '동아리', pattern: /([\w가-힣]{2,10})\s*동아리/g },
    { keyword: '스터디', pattern: /([\w가-힣]{2,10})\s*스터디/g },
    { keyword: '기획', pattern: /([\w가-힣]{2,10})\s*기획/g },
    { keyword: '운영', pattern: /([\w가-힣]{2,10})\s*운영/g },
    { keyword: '설계', pattern: /([\w가-힣]{2,10})\s*설계/g },
    { keyword: '봉사', pattern: /([\w가-힣]{2,10})\s*봉사/g },
    { keyword: '멘토링', pattern: /([\w가-힣]{2,10})\s*멘토링/g },
    { keyword: '교육', pattern: /([\w가-힣]{2,10})\s*교육/g },
    { keyword: '수상', pattern: /([\w가-힣]{2,10})\s*(수상|상)/g },
    { keyword: '논문', pattern: /([\w가-힣]{2,10})\s*논문/g },
    { keyword: '특허', pattern: /([\w가-힣]{2,10})\s*특허/g },
    { keyword: '창업', pattern: /([\w가-힣]{2,10})\s*창업/g },
  ];

  const activityMap = new Map<string, {
    count: number;
    personCount: Set<number>;
    examples: string[];
    relatedKeywords: Map<string, number>;
  }>();

  activities.forEach((act) => {
    if (!act.content || act.content.length < 10) {
      return;
    }

    activityPatterns.forEach(({ keyword, pattern }) => {
      const matches = Array.from(act.content.matchAll(pattern));

      matches.forEach(match => {
        const prefix = match[1].trim();

        // 문장 조각이나 불완전한 접두사 필터링
        const skipPrefixes = ['핵심', '주요', '중요', '다양한', '여러', '기타', '관련', '전반', '의', '을', '를', '이', '가'];
        const invalidChars = ['하는', '하고', '되는', '되고', '및', '등', '에서', '으로', '에게'];

        // 의미 없는 키워드 필터링 추가
        const isMeaningless = MEANINGLESS_KEYWORDS.some(meaningless =>
          prefix === meaningless || prefix.includes(meaningless)
        );

        // 조사나 불완전한 문장 조각 필터링
        if (
          isMeaningless ||
          skipPrefixes.some(skip => prefix.includes(skip)) ||
          invalidChars.some(invalid => prefix.includes(invalid)) ||
          prefix.length < 2 ||
          prefix.includes('  ') || // 이중 공백
          /^[의를이가을에]/.test(prefix) || // 조사로 시작
          /[의를이가을에]$/.test(prefix) // 조사로 끝남
        ) {
          return;
        }

        const activityName = `${prefix} ${keyword}`;

        const existing = activityMap.get(activityName) || {
          count: 0,
          personCount: new Set<number>(),
          examples: [],
          relatedKeywords: new Map(),
        };

        existing.count++;
        existing.personCount.add(act.cover_letter_id);

        // 핵심 활동 추출 및 저장
        if (existing.examples.length < 10 && act.content.length > 20) {
          const coreActivity = extractCoreActivity(act.content);

          if (coreActivity) {
            // | 로 분리된 여러 활동 처리
            const activities = coreActivity.split(' | ').map(a => a.trim()).filter(a => a.length > 10);

            activities.forEach(activity => {
              if (!existing.examples.includes(activity) && activity.length > 10) {
                existing.examples.push(activity);
              }
            });
          }
        }

        // 관련 키워드 추출
        const relatedWords = extractKeywords(act.content);
        relatedWords.forEach((word) => {
          existing.relatedKeywords.set(word, (existing.relatedKeywords.get(word) || 0) + 1);
        });

        activityMap.set(activityName, existing);
      });
    });
  });

  const results = Array.from(activityMap.entries())
    .filter(([keyword, data]) => data.personCount.size >= 1) // 최소 1명 이상으로 완화
    .map(([keyword, data]) => {
      // 퍼센티지 계산 시 반올림하여 정확도 개선
      const rawPercentage = (data.personCount.size / totalApplicants) * 100;
      const percentage = Math.min(Math.round(rawPercentage * 10) / 10, 100); // 소수점 첫째자리까지
      const avgCount = data.count / data.personCount.size;
      const topKeywords = Array.from(data.relatedKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);

      // 예시가 부족하면 DB에서 유사 활동 찾아서 생성
      let examples = [...data.examples];
      if (examples.length < 4) {
        const additionalExamples = generateExamplesFromDB(keyword, topKeywords, activities, 5 - examples.length);
        examples = [...examples, ...additionalExamples];
      }

      return {
        activityType: keyword,
        percentage,
        averageCount: avgCount,
        commonKeywords: topKeywords,
        examples: examples.slice(0, 5),
        insight: generateActivityInsight(keyword, percentage, topKeywords, totalApplicants),
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 30); // 상위 30개로 확대

  console.log('🔍 Activity Patterns Analysis:', {
    totalActivities: activities.length,
    totalApplicants,
    uniqueActivityKeywords: activityMap.size,
    finalResults: results.length,
    topResults: results.slice(0, 5).map(r => `${r.activityType} ${r.percentage.toFixed(0)}%`)
  });

  return results;
}

function extractKeywords(text: string): string[] {
  const keywords = [
    '리더', '팀장', '팀원', '협업', '소통',
    '프로젝트', '개발', '설계', '구현', '테스트',
    '데이터', '분석', '최적화', '개선', '성과',
    '수상', '대회', '공모전', '대상', '우수상',
    '봉사', '멘토링', '교육', '발표', '세미나',
  ];

  return keywords.filter((keyword) => text.includes(keyword));
}

function generateActivityInsight(type: string, percentage: number, keywords: string[], totalApplicants: number): string {
  // 샘플이 너무 적으면 "합격자" 대신 "합격자 중"으로 표현
  const samplePrefix = totalApplicants < 10
    ? `${type}은(는) 분석 대상 합격자 중`
    : `${type}은(는) 합격자의`;

  // 100%인 경우 특별 처리
  if (percentage >= 100) {
    if (totalApplicants < 5) {
      return `${samplePrefix} ${percentage.toFixed(0)}%가 보유하고 있습니다. (샘플 ${totalApplicants}명 기준)`;
    }
    return `${samplePrefix} 대부분(${percentage.toFixed(0)}%)이 보유한 매우 중요한 경험입니다.`;
  } else if (percentage >= 70) {
    return `${samplePrefix} ${percentage.toFixed(0)}%가 보유한 거의 필수적인 경험입니다.`;
  } else if (percentage >= 50) {
    return `${samplePrefix} 과반수(${percentage.toFixed(0)}%)가 보유한 중요한 경험입니다.`;
  } else if (percentage >= 30) {
    return `${samplePrefix} ${percentage.toFixed(0)}%가 보유한 유의미한 경험입니다.`;
  } else {
    return `${samplePrefix} ${percentage.toFixed(0)}%가 보유한 차별화 포인트입니다.`;
  }
}

function extractTopCertificates(coverLetters: IntegratedCoverLetter[]): { name: string; percentage: number }[] {
  const certMap = new Map<string, number>();
  let noCertCount = 0; // 자격증 없는 합격자 수

  coverLetters.forEach((cl) => {
    const certs = cl.user_spec?.certifications;

    // 자격증이 없거나 빈 문자열인 경우
    if (!certs || certs.trim() === '' || certs.toLowerCase() === 'null' || certs === '{}') {
      noCertCount++;
      return;
    }

    let certList: string[] = [];

    // JSON 형식인지 확인 ('{' 로 시작하는 경우)
    if (certs.trim().startsWith('{')) {
      try {
        // JSON 파싱 시도
        const parsedCerts = JSON.parse(certs);
        if (typeof parsedCerts === 'object' && parsedCerts !== null) {
          // JSON 객체의 키(자격증 이름)만 추출
          certList = Object.keys(parsedCerts).filter(key => {
            const value = parsedCerts[key];
            // null이 아니고 빈 문자열이 아닌 경우만 포함
            return value !== null && value !== '' && value !== 'null';
          });

          // 모든 값이 null이면 자격증 없음으로 처리
          if (certList.length === 0) {
            noCertCount++;
            return;
          }
        }
      } catch (e) {
        // JSON 파싱 실패 시 일반 문자열로 처리
        certList = certs.split(/[,、]/).map(c => c.trim());
      }
    } else {
      // 일반 문자열인 경우 쉼표나 가운뎃점으로 분리
      certList = certs.split(/[,、]/).map(c => c.trim());
    }

    // 자격증이 하나도 없으면 카운트
    if (certList.length === 0) {
      noCertCount++;
      return;
    }

    // 유효한 자격증만 필터링 및 카운트
    certList.forEach(cert => {
      // 불필요한 문자 제거
      cert = cert
        .replace(/["'{}[\]]/g, '') // JSON 특수문자 제거
        .replace(/:\s*null/g, '')   // :null 제거
        .replace(/null/gi, '')      // null 문자열 제거
        .trim();

      // 유효한 자격증만 추가 (길이 2~50, 특수문자만으로 구성되지 않음)
      if (cert &&
          cert.length >= 2 &&
          cert.length <= 50 &&
          !/^[^\w가-힣]+$/.test(cert) && // 특수문자만으로 구성되지 않음
          cert !== 'null' &&
          cert !== 'undefined') {
        certMap.set(cert, (certMap.get(cert) || 0) + 1);
      }
    });
  });

  // 자격증 데이터 수집
  const certResults = Array.from(certMap.entries())
    .map(([name, count]) => ({
      name,
      percentage: (count / coverLetters.length) * 100,
      count
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // "자격증 없음" 항목 추가 (10% 이상인 경우만)
  const noCertPercentage = (noCertCount / coverLetters.length) * 100;
  if (noCertCount > 0 && noCertPercentage >= 10) {
    certResults.push({
      name: '자격증 없음',
      percentage: noCertPercentage,
      count: noCertCount
    });
  }

  // 상위 10개만 반환
  return certResults
    .slice(0, 10)
    .map(({ name, percentage }) => ({
      name,
      percentage: Math.min(percentage, 100)
    }));
}

// 의미 있는 활동만 필터링하는 함수
function isValidActivity(content: string): boolean {
  if (!content || content.length < 15) return false;

  // 의미 없는 키워드가 주요 내용인 경우 제외
  const hasMeaninglessKeyword = MEANINGLESS_KEYWORDS.some(keyword => {
    const pattern = new RegExp(`^[^가-힣]{0,5}${keyword}[^가-힣]`, 'i');
    return pattern.test(content);
  });

  if (hasMeaninglessKeyword) return false;

  // extractCoreActivity로 검증
  const coreActivity = extractCoreActivity(content);
  return coreActivity.length > 0;
}

function generateInsights(coverLetters: IntegratedCoverLetter[], activities: {id: number, cover_letter_id: number, activity_type: string, content: string, created_at: string}[]): string[] {
  const insights: string[] = [];
  const total = coverLetters.length;

  // 학점 인사이트
  const avgGpa = calculateAvgGpa(coverLetters);
  if (avgGpa > 0) {
    insights.push(`합격자의 평균 학점은 ${avgGpa.toFixed(2)}/4.5로, ${avgGpa >= 4.0 ? '매우 높은' : avgGpa >= 3.5 ? '높은' : '보통'} 수준입니다.`);
  }

  // 토익 인사이트
  const avgToeic = calculateAvgToeic(coverLetters);
  if (avgToeic > 0) {
    insights.push(`합격자의 평균 토익 점수는 ${Math.round(avgToeic)}점입니다.`);
  }

  // 활동 인사이트 (의미 있는 활동만 필터링)
  const validActivities = activities.filter(a => isValidActivity(a.content));

  const activityCounts = new Map<number, number>();
  coverLetters.forEach((cl) => {
    const clActivities = validActivities.filter((a) => a.cover_letter_id === cl.id);
    const count = clActivities.length;
    activityCounts.set(count, (activityCounts.get(count) || 0) + 1);
  });

  const avgActivityCount = validActivities.length / total;
  if (avgActivityCount > 0) {
    insights.push(`합격자는 평균 ${avgActivityCount.toFixed(1)}개의 활동을 자소서에 언급합니다.`);
  }

  // 팀 프로젝트 인사이트 (유효한 활동만 사용)
  const teamProjectCount = validActivities.filter((a) =>
    a.content.includes('팀') || a.content.includes('협업') || a.content.includes('프로젝트')
  ).length;
  if (teamProjectCount > total * 0.5) {
    insights.push(`합격자의 ${((teamProjectCount / total) * 100).toFixed(0)}%가 팀 프로젝트 경험을 강조합니다.`);
  }

  // 리더십 인사이트 (유효한 활동만 사용)
  const leadershipCount = validActivities.filter((a) =>
    a.content.includes('리더') || a.content.includes('팀장') || a.content.includes('주도')
  ).length;
  if (leadershipCount > total * 0.3) {
    insights.push(`합격자의 ${((leadershipCount / total) * 100).toFixed(0)}%가 리더십 경험을 언급합니다.`);
  }

  // 수상 경험 인사이트 (유효한 활동만 사용)
  const awardCount = validActivities.filter((a) =>
    a.content.includes('수상') || a.content.includes('대상') || a.content.includes('우수상')
  ).length;
  if (awardCount > total * 0.2) {
    insights.push(`합격자의 ${((awardCount / total) * 100).toFixed(0)}%가 수상 경력을 보유하고 있습니다.`);
  }

  return insights;
}
