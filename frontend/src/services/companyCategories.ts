export enum CompanyCategory {
  대기업 = '대기업',
  은행권 = '은행권',
  증권금융 = '증권/금융',
  공기업 = '공기업',
  중견기업 = '중견기업',
  스타트업 = '스타트업',
  외국계 = '외국계',
  IT대기업 = 'IT 대기업',
  기타 = '기타',
}

export interface CompanyCategoryInfo {
  category: CompanyCategory;
  keywords: string[];
  aliases?: string[];
}

// 회사명 기반 카테고리 자동 분류
export const COMPANY_CATEGORIES: CompanyCategoryInfo[] = [
  {
    category: CompanyCategory.은행권,
    keywords: ['은행', 'bank', 'KB', 'NH', '신한', '우리', '하나', 'IBK'],
  },
  {
    category: CompanyCategory.증권금융,
    keywords: ['증권', '자산운용', '캐피탈', '카드', '생명', '화재', '손해보험', '보험', 'securities'],
  },
  {
    category: CompanyCategory.대기업,
    keywords: [
      '삼성',
      'LG',
      'SK',
      '현대',
      '롯데',
      'CJ',
      '한화',
      'GS',
      'KT',
      '포스코',
      'POSCO',
      '두산',
      'LS',
      '효성',
    ],
  },
  {
    category: CompanyCategory.IT대기업,
    keywords: ['네이버', 'NAVER', '카카오', 'Kakao', '라인', 'LINE', '쿠팡', 'Coupang', '토스', 'Toss'],
  },
  {
    category: CompanyCategory.공기업,
    keywords: [
      '한국',
      '공사',
      '공단',
      '진흥원',
      '연구원',
      '센터',
      'KOTRA',
      'KIST',
      'ETRI',
      'LH',
      '도로공사',
      '수자원공사',
    ],
  },
  {
    category: CompanyCategory.외국계,
    keywords: [
      'Google',
      'Amazon',
      'Microsoft',
      'Apple',
      'Meta',
      'Facebook',
      'Tesla',
      'Netflix',
      'IBM',
      'Oracle',
      'SAP',
      'JP Morgan',
      'Goldman',
      'Morgan Stanley',
    ],
  },
];

/**
 * 회사명으로부터 카테고리 추론
 */
export function inferCompanyCategory(companyName: string | null | undefined): CompanyCategory {
  if (!companyName) return CompanyCategory.기타;
  const lowerName = companyName.toLowerCase();

  for (const categoryInfo of COMPANY_CATEGORIES) {
    for (const keyword of categoryInfo.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return categoryInfo.category;
      }
    }
  }

  // 기본값
  return CompanyCategory.기타;
}

/**
 * DB에서 가져온 회사 목록을 카테고리별로 그룹화
 */
export function groupCompaniesByCategory(companies: string[]): Map<CompanyCategory, string[]> {
  const grouped = new Map<CompanyCategory, string[]>();

  // 초기화
  Object.values(CompanyCategory).forEach((cat) => {
    grouped.set(cat as CompanyCategory, []);
  });

  companies.forEach((company) => {
    const category = inferCompanyCategory(company);
    const list = grouped.get(category) || [];
    list.push(company);
    grouped.set(category, list);
  });

  return grouped;
}

/**
 * 산업 카테고리 매칭 (유사 산업 찾기용)
 */
export enum IndustryCategory {
  금융 = '금융',
  IT서비스 = 'IT/서비스',
  제조 = '제조',
  유통 = '유통/물류',
  에너지 = '에너지',
  건설 = '건설/부동산',
  미디어 = '미디어/엔터',
  공공 = '공공/공기업',
  기타 = '기타',
}

export function getIndustryCategory(companyCategory: CompanyCategory): IndustryCategory {
  switch (companyCategory) {
    case CompanyCategory.은행권:
    case CompanyCategory.증권금융:
      return IndustryCategory.금융;

    case CompanyCategory.IT대기업:
      return IndustryCategory.IT서비스;

    case CompanyCategory.공기업:
      return IndustryCategory.공공;

    case CompanyCategory.대기업:
    case CompanyCategory.중견기업:
      return IndustryCategory.제조;

    case CompanyCategory.스타트업:
      return IndustryCategory.IT서비스;

    case CompanyCategory.외국계:
      return IndustryCategory.IT서비스;

    default:
      return IndustryCategory.기타;
  }
}

/**
 * 두 회사가 같은 산업군인지 확인
 */
export function isSameIndustry(company1: string, company2: string): boolean {
  const cat1 = inferCompanyCategory(company1);
  const cat2 = inferCompanyCategory(company2);
  const ind1 = getIndustryCategory(cat1);
  const ind2 = getIndustryCategory(cat2);

  return ind1 === ind2;
}
