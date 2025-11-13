/**
 * 직무 정규화 서비스
 * CSV 데이터의 job_position, activities, user_spec을 종합하여 표준 직무명으로 변환
 */

export interface StandardPositionMap {
  [key: string]: string[];
}

/**
 * 표준 직무 카테고리 정의
 * 각 직무는 배타적이며 명확한 키워드를 가짐
 */
export const STANDARD_POSITIONS: StandardPositionMap = {
  // 개발 직군
  '백엔드개발': [
    'backend', 'back-end', '백엔드', '서버개발', 'server', 'api개발', 'api',
    'spring', 'django', 'flask', 'node.js', 'express', 'fastapi', 'nest.js'
  ],
  '프론트엔드개발': [
    'frontend', 'front-end', '프론트엔드', '프론트', 'react', 'vue', 'angular',
    'ui개발', 'next.js', 'svelte', '웹프론트'
  ],
  '풀스택개발': ['풀스택', 'fullstack', 'full-stack', '웹개발'],
  '앱개발': [
    '앱개발', '모바일개발', 'android', 'ios', '안드로이드', 'swift', 'kotlin',
    'react native', 'flutter', '앱'
  ],
  '게임개발': [
    '게임개발', '게임프로그래머', 'unity', 'unreal', '게임클라이언트', '게임서버',
    'cpp게임', 'c++', '게임엔진'
  ],

  // AI/데이터 직군
  'AI/머신러닝': [
    'ai', '인공지능', '머신러닝', '딥러닝', 'ml', 'dl', 'nlp', 'cv',
    '자연어처리', '컴퓨터비전', 'pytorch', 'tensorflow', '모델개발'
  ],
  '데이터분석': [
    '데이터분석', 'da', '데이터애널리스트', '데이터사이언티스트', 'ds',
    '비즈니스분석', 'sql분석', 'tableau', 'power bi', '데이터시각화'
  ],
  '데이터엔지니어링': [
    '데이터엔지니어', '빅데이터', 'etl', 'spark', '데이터파이프라인',
    'airflow', 'kafka', '데이터플랫폼', 'de'
  ],

  // 인프라/DevOps/보안
  'DevOps': [
    'devops', 'sre', 'ci/cd', 'kubernetes', 'docker', '클라우드엔지니어',
    'aws', 'gcp', 'azure', '배포자동화', 'jenkins'
  ],
  '인프라': [
    '인프라', '시스템엔지니어', '네트워크', '서버관리', '네트워크엔지니어',
    '시스템관리', '서버운영'
  ],
  '보안': [
    '보안', '정보보안', 'security', '보안엔지니어', '보안관제',
    '침해대응', '모의해킹', 'ctf'
  ],

  // 기획
  '서비스기획': [
    '서비스기획', 'pm', 'po', '프로덕트매니저', '프로덕트오너',
    '프로덕트기획', 'product manager', 'product owner'
  ],
  '사업기획': ['사업기획', '전략기획', '비즈니스기획', '경영기획'],

  // 디자인
  'UX디자인': [
    'ux', 'uxui', 'uiux', 'ux디자이너', '프로덕트디자인', '서비스디자인',
    'ux리서치', '사용자경험'
  ],
  'UI디자인': ['ui디자이너', 'gui', 'ui디자인', '인터페이스디자인'],
  '그래픽디자인': [
    '그래픽', '그래픽디자인', '비주얼디자인', '브랜드디자인',
    '시각디자인', '편집디자인'
  ],

  // 마케팅
  '마케팅': [
    '마케팅', '디지털마케팅', '퍼포먼스마케팅', '그로스마케팅',
    '브랜드마케팅', '콘텐츠마케팅', '캠페인기획', '온라인마케팅',
    'performance', 'growth', '광고운영', '마케터', 'cmo'
  ],

  // 영업
  '영업': [
    '영업', '세일즈', 'sales', 'bd', '비즈니스개발', '해외영업',
    '국내영업', '영업관리', 'account', '어카운트'
  ],

  // 경영지원
  'HR': [
    'hr', '인사', '채용', '인사담당', '인사기획', '조직문화',
    'hrbp', '리크루터', 'recruiter', '인적자원', '교육담당'
  ],
  '재무회계': [
    '재무', '회계', '경리', '재무관리', '회계사', 'accounting',
    '재경', '세무', '결산', '원가관리', '투자', 'finance'
  ],

  // 운영/CS
  '운영': ['운영', 'operation', '오퍼레이션', '운영관리', 'ops', '서비스운영'],
  'CS': ['cs', '고객지원', '고객서비스', '상담', 'customer service', 'support'],

  // 생산/제조
  '생산관리': ['생산관리', '생산기술', '공정관리', '제조'],
  '품질관리': ['품질관리', 'qa', 'qc', '품질보증', 'quality', '품질보증'],
  '설비기술': ['설비', '설비기술', '공정개발', '설비보전'],

  // 연구개발
  '연구개발': ['연구개발', 'r&d', 'rd', '연구', 'research', '연구원', 'researcher'],

  // 기타
  'MD': ['md', '상품기획', '바이어', '머천다이저'],
  '구매': ['구매', '구매담당', '자재', '조달'],
  '법무': ['법무', 'legal', '법률', '준법', 'compliance'],
  '물류': ['물류', 'scm', '공급망', '유통', '배송'],
};

/**
 * 통합 데이터에서 직무를 추론
 */
export function inferPositionFromIntegratedData(
  jobPosition: string | null | undefined,
  activities: any,
  userSpec: any,
  companyName: string
): string {
  // 텍스트 풀 수집
  const textPool: string[] = [];

  // job_position 추가
  if (jobPosition) {
    textPool.push(jobPosition.toLowerCase());
  }

  // company_name 추가
  if (companyName) {
    textPool.push(companyName.toLowerCase());
  }

  // activities 파싱
  if (activities) {
    try {
      const actObj = typeof activities === 'string' ? JSON.parse(activities) : activities;
      ['활동', '기타', '느낀점', '배운점'].forEach((key) => {
        if (actObj[key] && Array.isArray(actObj[key])) {
          actObj[key].forEach((item: any) => {
            if (item) textPool.push(String(item).toLowerCase());
          });
        }
      });
    } catch (e) {
      // JSON 파싱 실패 시 무시
    }
  }

  // user_spec 파싱
  if (userSpec) {
    try {
      const specObj = typeof userSpec === 'string' ? JSON.parse(userSpec) : userSpec;
      if (specObj.major) textPool.push(specObj.major.toLowerCase());
      if (specObj.intern_experience) textPool.push(specObj.intern_experience.toLowerCase());
      if (specObj.certifications) textPool.push(specObj.certifications.toLowerCase());
    } catch (e) {
      // JSON 파싱 실패 시 무시
    }
  }

  // 전체 텍스트 병합
  const fullText = textPool.join(' ');

  // 각 표준 직무별 매칭 점수 계산
  const scores: { [key: string]: number } = {};
  for (const [standardPos, keywords] of Object.entries(STANDARD_POSITIONS)) {
    let score = 0;
    for (const keyword of keywords) {
      // 정규표현식 특수문자 이스케이프 (+, *, ?, [, ], (, ), {, }, ^, $, |, \, ., / 등)
      const escapedKeyword = keyword.replace(/[+*?^${}()|[\]\\]/g, '\\$&');
      try {
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const matches = fullText.match(regex);
        if (matches) {
          score += matches.length;
        }
      } catch (e) {
        // 정규표현식 에러 시 단순 문자열 포함 검사
        if (fullText.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
    }
    scores[standardPos] = score;
  }

  // 최고 점수 직무 찾기
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    const inferredPosition = Object.keys(scores).find((key) => scores[key] === maxScore);
    return inferredPosition || '기타';
  }

  // 은행권/금융권 특수 처리
  if (
    companyName &&
    (companyName.includes('은행') ||
      companyName.includes('금융') ||
      companyName.includes('증권') ||
      companyName.includes('보험'))
  ) {
    return '금융일반';
  }

  return '기타';
}

/**
 * 사용자가 입력한 직무명을 표준 직무명으로 정규화
 */
export function normalizeUserPosition(userPosition: string): string[] {
  if (!userPosition) return [];

  const lower = userPosition.toLowerCase().trim();
  const matched: string[] = [];

  // 표준 직무명과 비교
  for (const [standardPos, keywords] of Object.entries(STANDARD_POSITIONS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        matched.push(standardPos);
        break;
      }
    }
  }

  // 중복 제거
  return Array.from(new Set(matched));
}
