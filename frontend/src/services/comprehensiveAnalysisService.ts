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

function analyzeActivityPatterns(activities: Activity[], totalApplicants: number): ActivityPattern[] {
  // 필터링할 무의미한 활동 타입
  const invalidTypes = ['활동', '느낀점', '배운점', '기타', '내용', '설명', '경험', '역할'];

  const activityMap = new Map<string, {
    count: number;
    personCount: Set<number>; // 중복 제거를 위한 지원자 ID 추적
    examples: string[];
    keywords: Map<string, number>;
  }>();

  activities.forEach((act) => {
    // 무의미한 타입 필터링
    if (invalidTypes.includes(act.activity_type) || !act.activity_type || act.activity_type.length < 2) {
      return;
    }

    const existing = activityMap.get(act.activity_type) || {
      count: 0,
      personCount: new Set<number>(),
      examples: [],
      keywords: new Map(),
    };

    existing.count++;
    existing.personCount.add(act.cover_letter_id); // 지원자 추적

    if (existing.examples.length < 5 && act.content && act.content.length > 10) {
      existing.examples.push(act.content);
    }

    // 키워드 추출
    const keywords = extractKeywords(act.content);
    keywords.forEach((keyword) => {
      existing.keywords.set(keyword, (existing.keywords.get(keyword) || 0) + 1);
    });

    activityMap.set(act.activity_type, existing);
  });

  return Array.from(activityMap.entries())
    .filter(([type, data]) => data.personCount.size >= 1) // 최소 1명 이상으로 완화
    .map(([type, data]) => {
      // 실제 해당 활동을 한 사람 수 기준으로 백분율 계산
      const percentage = Math.min((data.personCount.size / totalApplicants) * 100, 100);
      const avgCount = data.count / data.personCount.size; // 1인당 평균 언급 횟수
      const topKeywords = Array.from(data.keywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword]) => keyword);

      return {
        activityType: type,
        percentage,
        averageCount: avgCount,
        commonKeywords: topKeywords,
        examples: data.examples.slice(0, 3), // 상위 3개만
        insight: generateActivityInsight(type, percentage, topKeywords),
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 15);
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
