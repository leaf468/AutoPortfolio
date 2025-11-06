import { supabase } from '../lib/supabaseClient';
import { calculatePositionSimilarity } from './flexibleAnalysisService';
import { CoverLetter, Activity } from './coverLetterAnalysisService';

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
    // 전체 데이터 가져오기
    const { data: allCoverLetters, error } = await supabase
      .from('cover_letters')
      .select('*')
      .limit(1000);

    if (error || !allCoverLetters) {
      return getEmptyStats(position);
    }

    // 유사 직무 필터링
    const relevantCoverLetters = allCoverLetters.filter((cl) => {
      const similarity = calculatePositionSimilarity(cl.job_position, position);
      return similarity >= 50; // 50% 이상 유사도
    });

    if (relevantCoverLetters.length === 0) {
      return getEmptyStats(position);
    }

    // 활동 데이터 가져오기
    const coverLetterIds = relevantCoverLetters.map((cl) => cl.id);
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .in('cover_letter_id', coverLetterIds);

    const stats: ComprehensiveStats = {
      position,
      totalApplicants: relevantCoverLetters.length,
      avgGpa: calculateAvgGpa(relevantCoverLetters),
      gpaDistribution: calculateGpaDistribution(relevantCoverLetters),
      topUniversities: extractTopUniversities(relevantCoverLetters),
      topMajors: extractTopMajors(relevantCoverLetters),
      avgToeic: calculateAvgToeic(relevantCoverLetters),
      toeicDistribution: calculateToeicDistribution(relevantCoverLetters),
      commonActivities: analyzeActivityPatterns(activities || [], relevantCoverLetters.length),
      topCertificates: extractTopCertificates(relevantCoverLetters),
      insights: generateInsights(relevantCoverLetters, activities || []),
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

function calculateAvgGpa(coverLetters: CoverLetter[]): number {
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
  return gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
}

function calculateGpaDistribution(coverLetters: CoverLetter[]): { range: string; percentage: number }[] {
  const ranges = [
    { range: '4.0 이상', min: 4.0, max: 5.0 },
    { range: '3.5 ~ 3.99', min: 3.5, max: 3.99 },
    { range: '3.0 ~ 3.49', min: 3.0, max: 3.49 },
    { range: '3.0 미만', min: 0, max: 2.99 },
  ];

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

  return ranges.map((range) => {
    const count = gpas.filter((gpa) => gpa >= range.min && gpa <= range.max).length;
    return {
      range: range.range,
      percentage: gpas.length > 0 ? (count / gpas.length) * 100 : 0,
    };
  });
}

function extractTopUniversities(coverLetters: CoverLetter[]): { name: string; count: number }[] {
  const univMap = new Map<string, number>();
  const univKeywords = [
    'SKY', '서울대', '연세대', '고려대',
    'KAIST', 'POSTECH', '포항공대',
    '성균관대', '한양대', '중앙대', '경희대', '이화여대',
    '서강대', '숙명여대', '동국대', '건국대', '홍익대',
  ];

  coverLetters.forEach((cl) => {
    const info = cl.specific_info;
    univKeywords.forEach((keyword) => {
      if (info.includes(keyword)) {
        univMap.set(keyword, (univMap.get(keyword) || 0) + 1);
      }
    });
  });

  return Array.from(univMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function extractTopMajors(coverLetters: CoverLetter[]): { name: string; count: number }[] {
  const majorMap = new Map<string, number>();
  const majorKeywords = [
    '컴퓨터공학', '소프트웨어', '전자공학', '정보통신',
    '경영학', '경제학', '행정학', '국제학',
    '기계공학', '화학공학', '산업공학',
    '수학', '통계학', '물리학',
  ];

  coverLetters.forEach((cl) => {
    const info = cl.specific_info;
    majorKeywords.forEach((keyword) => {
      if (info.includes(keyword)) {
        majorMap.set(keyword, (majorMap.get(keyword) || 0) + 1);
      }
    });
  });

  return Array.from(majorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateAvgToeic(coverLetters: CoverLetter[]): number {
  const toeics: number[] = [];
  coverLetters.forEach((cl) => {
    const toeicMatch =
      cl.specific_info.match(/토익\s*(\d+)/i) || cl.specific_info.match(/toeic\s*(\d+)/i);
    if (toeicMatch) {
      toeics.push(parseInt(toeicMatch[1]));
    }
  });
  return toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;
}

function calculateToeicDistribution(coverLetters: CoverLetter[]): { range: string; percentage: number }[] {
  const ranges = [
    { range: '900점 이상', min: 900, max: 1000 },
    { range: '800 ~ 899점', min: 800, max: 899 },
    { range: '700 ~ 799점', min: 700, max: 799 },
    { range: '700점 미만', min: 0, max: 699 },
  ];

  const toeics: number[] = [];
  coverLetters.forEach((cl) => {
    const toeicMatch =
      cl.specific_info.match(/토익\s*(\d+)/i) || cl.specific_info.match(/toeic\s*(\d+)/i);
    if (toeicMatch) {
      toeics.push(parseInt(toeicMatch[1]));
    }
  });

  return ranges.map((range) => {
    const count = toeics.filter((score) => score >= range.min && score <= range.max).length;
    return {
      range: range.range,
      percentage: toeics.length > 0 ? (count / toeics.length) * 100 : 0,
    };
  });
}

function normalizeActivityExample(content: string): string {
  // 문장을 명사형으로 변환
  let normalized = content.trim();

  // 불필요한 접속사, 어미 제거
  normalized = normalized
    .replace(/하며\s*/g, ', ')
    .replace(/하고\s*/g, ', ')
    .replace(/했습니다\.?$/g, '')
    .replace(/했음\.?$/g, '')
    .replace(/합니다\.?$/g, '')
    .replace(/함\.?$/g, '')
    .replace(/하는\s*역할을/g, '')
    .replace(/을\s*수행/g, '수행')
    .replace(/를\s*위한/g, '을 위한')
    .replace(/에\s*참여/g, ' 참여');

  // 너무 긴 문장은 첫 문장만 추출
  const sentences = normalized.split(/[.!?]\s+/);
  if (sentences.length > 0 && sentences[0].length > 15) {
    normalized = sentences[0];
  }

  // 마지막에 '함', '수행' 등으로 끝나지 않으면 추가
  if (!/[함행여성]$/.test(normalized) && normalized.length < 60) {
    if (normalized.includes('프로젝트') || normalized.includes('연구') || normalized.includes('개발')) {
      normalized += ' 수행';
    }
  }

  return normalized.slice(0, 70);
}

function generateAdditionalExamples(activityType: string, keywords: string[], count: number): string[] {
  const prefix = activityType.split(' ')[0] || '';
  const baseType = activityType.split(' ').pop() || activityType;

  const exampleTemplates: { [key: string]: string[] } = {
    '프로젝트': [
      `${prefix} 웹 애플리케이션 개발 및 배포`,
      `${prefix} 모바일 앱 UI/UX 설계 및 구현`,
      `${prefix} 시스템 성능 개선 (응답속도 30% 향상)`,
      `${prefix} RESTful API 서버 개발 및 테스트`,
      `${prefix} 데이터베이스 설계 및 최적화 작업`,
    ],
    '개발': [
      `${prefix} 프론트엔드 컴포넌트 라이브러리 구축`,
      `${prefix} CI/CD 파이프라인 구축 및 자동화`,
      `${prefix} 마이크로서비스 아키텍처 설계`,
      `${prefix} 실시간 데이터 처리 시스템 구현`,
      `${prefix} 레거시 코드 리팩토링 및 성능 개선`,
    ],
    '연구': [
      `${prefix} 분야 논문 작성 및 학술지 게재`,
      `${prefix} 실험 설계 및 통계 분석 수행`,
      `${prefix} 학회 발표 및 연구 결과 공유`,
      `${prefix} 신기술 검증 및 프로토타입 제작`,
      `${prefix} 특허 출원 및 지식재산권 확보`,
    ],
    '분석': [
      `사용자 행동 ${prefix} 분석 및 인사이트 도출`,
      `${prefix} 데이터 시각화 대시보드 구축`,
      `A/B 테스트 설계 및 ${prefix} 결과 분석`,
      `${prefix} 비즈니스 지표 모니터링 시스템 구축`,
      `머신러닝 모델 활용한 ${prefix} 예측 분석`,
    ],
    '인턴': [
      `${prefix} 기업 실무 프로젝트 참여 (6개월)`,
      `${prefix} 팀 협업 및 코드 리뷰 경험`,
      `${prefix} 회사 기술 스택 학습 및 적용`,
      `${prefix} 업무 자동화 스크립트 개발`,
      `${prefix} 기술 문서 작성 및 지식 공유`,
    ],
    '공모전': [
      `${prefix} 공모전 참가 및 우수상 수상`,
      `${prefix} 아이디어 기획 및 프로토타입 제작`,
      `${prefix} 팀 프로젝트 리딩 및 발표`,
      `${prefix} 비즈니스 모델 설계 및 검증`,
      `${prefix} 공모전 수상작 실제 서비스화`,
    ],
    '해커톤': [
      `${prefix} 해커톤 참가 (24시간 개발)`,
      `${prefix} 아이디어 구현 및 MVP 제작`,
      `${prefix} 팀원들과 협업하여 서비스 완성`,
      `${prefix} 해커톤 수상 및 멘토링 피드백`,
      `${prefix} 신기술 적용 및 빠른 프로토타이핑`,
    ],
    '동아리': [
      `${prefix} 동아리 활동 및 프로젝트 진행`,
      `${prefix} 스터디 그룹 운영 및 지식 공유`,
      `${prefix} 동아리 회장으로 팀 리딩`,
      `${prefix} 세미나 개최 및 외부 교류`,
      `${prefix} 동아리 연합 프로젝트 참여`,
    ],
  };

  let templates = exampleTemplates[baseType];

  if (!templates) {
    templates = [
      `${activityType} 수행 및 목표 달성`,
      `${activityType} 관련 역량 강화`,
      `${activityType}를 통한 실무 경험 축적`,
      `${activityType} 성과 창출 및 개선`,
    ];
  }

  // 키워드 기반 맞춤형 예시 생성
  const keywordBased: string[] = [];
  if (keywords.includes('협업') || keywords.includes('팀')) {
    keywordBased.push(`${activityType}에서 팀 협업 및 의사소통 경험`);
  }
  if (keywords.includes('리더') || keywords.includes('팀장')) {
    keywordBased.push(`${activityType} 팀 리더로서 프로젝트 주도`);
  }
  if (keywords.includes('성과') || keywords.includes('개선')) {
    keywordBased.push(`${activityType}를 통한 성과 지표 개선`);
  }

  const allTemplates = [...templates, ...keywordBased];
  return allTemplates.slice(0, count);
}

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

        // 조사나 불완전한 문장 조각 필터링
        if (
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

        // 중복 체크 및 명사화된 예시 추가
        if (existing.examples.length < 10 && act.content.length > 20) {
          const normalizedExample = normalizeActivityExample(act.content);
          if (!existing.examples.includes(normalizedExample) && normalizedExample.length > 10) {
            existing.examples.push(normalizedExample);
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
      const percentage = Math.min((data.personCount.size / totalApplicants) * 100, 100);
      const avgCount = data.count / data.personCount.size;
      const topKeywords = Array.from(data.relatedKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);

      // 예시가 부족하면 키워드 기반으로 추가 생성
      let examples = [...data.examples];
      if (examples.length < 4) {
        const additionalExamples = generateAdditionalExamples(keyword, topKeywords, 5 - examples.length);
        examples = [...examples, ...additionalExamples];
      }

      return {
        activityType: keyword,
        percentage,
        averageCount: avgCount,
        commonKeywords: topKeywords,
        examples: examples.slice(0, 5),
        insight: generateActivityInsight(keyword, percentage, topKeywords),
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

function generateActivityInsight(type: string, percentage: number, keywords: string[]): string {
  if (percentage > 70) {
    return `${type}은(는) 합격자의 ${percentage.toFixed(0)}%가 보유한 거의 필수적인 경험입니다.`;
  } else if (percentage > 50) {
    return `${type}은(는) 합격자의 과반수(${percentage.toFixed(0)}%)가 보유한 중요한 경험입니다.`;
  } else if (percentage > 30) {
    return `${type}은(는) 합격자의 ${percentage.toFixed(0)}%가 보유한 유의미한 경험입니다.`;
  } else {
    return `${type}은(는) 합격자의 ${percentage.toFixed(0)}%가 보유한 차별화 포인트입니다.`;
  }
}

function extractTopCertificates(coverLetters: CoverLetter[]): { name: string; percentage: number }[] {
  const certMap = new Map<string, number>();

  coverLetters.forEach((cl) => {
    const certKeywords = [
      '정보처리기사', '컴활', 'SQLD', 'SQLP',
      'AWS', '토익스피킹', 'OPIc', 'HSK',
      '한국사', '운전면허',
    ];

    certKeywords.forEach((cert) => {
      if (cl.specific_info.includes(cert) || cl.full_text.includes(cert)) {
        certMap.set(cert, (certMap.get(cert) || 0) + 1);
      }
    });
  });

  return Array.from(certMap.entries())
    .map(([name, count]) => ({
      name,
      percentage: (count / coverLetters.length) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);
}

function generateInsights(coverLetters: CoverLetter[], activities: Activity[]): string[] {
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

  // 활동 인사이트
  const activityCounts = new Map<number, number>();
  coverLetters.forEach((cl) => {
    const clActivities = activities.filter((a) => a.cover_letter_id === cl.id);
    const count = clActivities.length;
    activityCounts.set(count, (activityCounts.get(count) || 0) + 1);
  });

  const avgActivityCount = activities.length / total;
  if (avgActivityCount > 0) {
    insights.push(`합격자는 평균 ${avgActivityCount.toFixed(1)}개의 활동을 자소서에 언급합니다.`);
  }

  // 팀 프로젝트 인사이트
  const teamProjectCount = activities.filter((a) =>
    a.content.includes('팀') || a.content.includes('협업') || a.content.includes('프로젝트')
  ).length;
  if (teamProjectCount > total * 0.5) {
    insights.push(`합격자의 ${((teamProjectCount / total) * 100).toFixed(0)}%가 팀 프로젝트 경험을 강조합니다.`);
  }

  // 리더십 인사이트
  const leadershipCount = activities.filter((a) =>
    a.content.includes('리더') || a.content.includes('팀장') || a.content.includes('주도')
  ).length;
  if (leadershipCount > total * 0.3) {
    insights.push(`합격자의 ${((leadershipCount / total) * 100).toFixed(0)}%가 리더십 경험을 언급합니다.`);
  }

  // 수상 경험 인사이트
  const awardCount = activities.filter((a) =>
    a.content.includes('수상') || a.content.includes('대상') || a.content.includes('우수상')
  ).length;
  if (awardCount > total * 0.2) {
    insights.push(`합격자의 ${((awardCount / total) * 100).toFixed(0)}%가 수상 경력을 보유하고 있습니다.`);
  }

  return insights;
}
