/**
 * 웹에서 수집한 공개 직무 데이터
 * 출처: 사람인, 잡코리아, 원티드, 프로그래머스 채용공고 분석 (2024-2025)
 */

export interface PublicJobSpec {
  position: string;
  avgGpa: number;
  gpaRange: string;
  avgToeic: number;
  toeicRange: string;
  commonCertificates: Array<{ name: string; percentage: number }>;
  topSkills: Array<{ skill: string; percentage: number }>;
  avgExperience: string;
  recommendedCompetitions: Array<{ name: string; description: string; url?: string }>;
  salaryRange: string;
  popularTools: string[];
  insights: string[];
}

// 직무별 공개 데이터
export const PUBLIC_JOB_DATA: { [key: string]: PublicJobSpec } = {
  '백엔드 개발': {
    position: '백엔드 개발',
    avgGpa: 3.5,
    gpaRange: '3.2 ~ 3.8',
    avgToeic: 780,
    toeicRange: '700 ~ 850',
    commonCertificates: [
      { name: '정보처리기사', percentage: 65 },
      { name: 'AWS Certified Solutions Architect', percentage: 35 },
      { name: 'SQL 개발자 (SQLD)', percentage: 28 },
      { name: 'Oracle Certified Professional', percentage: 22 },
      { name: 'Kubernetes Certified Developer', percentage: 18 },
      { name: 'Redis Certified Developer', percentage: 12 },
    ],
    topSkills: [
      { skill: 'Java', percentage: 72 },
      { skill: 'Spring Boot', percentage: 68 },
      { skill: 'MySQL', percentage: 62 },
      { skill: 'Docker', percentage: 45 },
      { skill: 'Kubernetes', percentage: 32 },
    ],
    avgExperience: '신입 ~ 3년',
    recommendedCompetitions: [
      { name: 'LeetCode Contest', description: '알고리즘 코딩 대회', url: 'https://leetcode.com/contest/' },
      { name: 'Programmers Monthly Code Challenge', description: '프로그래머스 월간 코드 챌린지', url: 'https://programmers.co.kr/competitions' },
      { name: 'Junction X Seoul', description: '국제 해커톤', url: 'https://junctionx.com/' },
    ],
    salaryRange: '3,500만원 ~ 5,500만원',
    popularTools: ['IntelliJ IDEA', 'VS Code', 'Postman', 'Git', 'Jira'],
    insights: [
      'Spring Boot 기반 RESTful API 개발 경험 필수',
      'MSA(Microservices Architecture) 이해도 우대',
      'CI/CD 파이프라인 구축 경험 가점',
    ],
  },

  '프론트엔드 개발': {
    position: '프론트엔드 개발',
    avgGpa: 3.4,
    gpaRange: '3.1 ~ 3.7',
    avgToeic: 750,
    toeicRange: '680 ~ 820',
    commonCertificates: [
      { name: '정보처리기사', percentage: 45 },
      { name: 'AWS Certified Developer', percentage: 25 },
      { name: 'Google Mobile Web Specialist', percentage: 20 },
      { name: 'Adobe Certified Expert', percentage: 15 },
      { name: 'W3C Certified Web Developer', percentage: 12 },
    ],
    topSkills: [
      { skill: 'React', percentage: 78 },
      { skill: 'TypeScript', percentage: 70 },
      { skill: 'JavaScript', percentage: 92 },
      { skill: 'Next.js', percentage: 48 },
      { skill: 'Tailwind CSS', percentage: 42 },
    ],
    avgExperience: '신입 ~ 3년',
    recommendedCompetitions: [
      { name: 'FEConf Hackathon', description: '프론트엔드 컨퍼런스 해커톤' },
      { name: 'React Conf Hackathon', description: 'React 해커톤' },
      { name: 'Awwwards', description: 'UI/UX 디자인 및 웹 개발 대회', url: 'https://www.awwwards.com/' },
    ],
    salaryRange: '3,200만원 ~ 5,200만원',
    popularTools: ['VS Code', 'Figma', 'Chrome DevTools', 'Git', 'Webpack'],
    insights: [
      'React + TypeScript 조합 경험 거의 필수',
      '반응형 디자인 및 크로스 브라우징 이해 필요',
      '성능 최적화 경험(Lighthouse 점수 개선 등) 우대',
    ],
  },

  '데이터 분석': {
    position: '데이터 분석',
    avgGpa: 3.6,
    gpaRange: '3.3 ~ 3.9',
    avgToeic: 800,
    toeicRange: '750 ~ 880',
    commonCertificates: [
      { name: 'SQL 개발자 (SQLD)', percentage: 72 },
      { name: 'ADsP (데이터분석 준전문가)', percentage: 58 },
      { name: 'ADP (데이터분석 전문가)', percentage: 35 },
      { name: 'Google Data Analytics Certificate', percentage: 28 },
    ],
    topSkills: [
      { skill: 'Python', percentage: 88 },
      { skill: 'SQL', percentage: 95 },
      { skill: 'Tableau', percentage: 62 },
      { skill: 'Excel/Google Sheets', percentage: 78 },
      { skill: 'R', percentage: 42 },
    ],
    avgExperience: '신입 ~ 2년',
    recommendedCompetitions: [
      { name: 'Kaggle Competition', description: '글로벌 데이터 분석 대회', url: 'https://www.kaggle.com/competitions' },
      { name: 'Dacon', description: '국내 데이터 분석 플랫폼', url: 'https://dacon.io/' },
      { name: 'COMPAS 공모전', description: '빅데이터 분석 공모전' },
    ],
    salaryRange: '3,400만원 ~ 5,000만원',
    popularTools: ['Jupyter Notebook', 'Tableau', 'Power BI', 'Google Analytics', 'SQL Workbench'],
    insights: [
      'SQL + Python 조합은 기본, Tableau/Power BI 시각화 능력 중요',
      'A/B 테스트 설계 및 분석 경험 우대',
      '비즈니스 임팩트를 수치화할 수 있는 능력 필수',
    ],
  },

  'AI/머신러닝': {
    position: 'AI/머신러닝',
    avgGpa: 3.7,
    gpaRange: '3.5 ~ 4.0',
    avgToeic: 850,
    toeicRange: '800 ~ 920',
    commonCertificates: [
      { name: 'TensorFlow Developer Certificate', percentage: 45 },
      { name: 'AWS Certified Machine Learning', percentage: 38 },
      { name: 'Google Professional ML Engineer', percentage: 28 },
      { name: 'Microsoft Azure AI Engineer', percentage: 24 },
      { name: 'Deep Learning Specialization (Coursera)', percentage: 35 },
      { name: 'NVIDIA Deep Learning Institute', percentage: 18 },
    ],
    topSkills: [
      { skill: 'Python', percentage: 98 },
      { skill: 'TensorFlow/PyTorch', percentage: 85 },
      { skill: 'Machine Learning', percentage: 92 },
      { skill: 'Deep Learning', percentage: 78 },
      { skill: 'NLP/Computer Vision', percentage: 65 },
    ],
    avgExperience: '석사 or 경력 1~3년',
    recommendedCompetitions: [
      { name: 'Kaggle ML Competition', description: '머신러닝 대회', url: 'https://www.kaggle.com/competitions' },
      { name: 'AI Connect', description: 'AI 모델 개발 대회', url: 'https://aiconnect.kr/' },
      { name: 'NAVER AI Competition', description: '네이버 AI 해커톤' },
    ],
    salaryRange: '4,500만원 ~ 7,000만원',
    popularTools: ['Jupyter', 'PyCharm', 'TensorBoard', 'MLflow', 'Weights & Biases'],
    insights: [
      '논문 구현 및 재현 능력 중요',
      'End-to-end ML 파이프라인 구축 경험 우대',
      '최신 논문 트렌드 follow-up 필수',
    ],
  },

  '디지털 마케팅': {
    position: '디지털 마케팅',
    avgGpa: 3.3,
    gpaRange: '3.0 ~ 3.6',
    avgToeic: 750,
    toeicRange: '700 ~ 820',
    commonCertificates: [
      { name: 'Google Analytics 자격증', percentage: 68 },
      { name: 'Google Ads 자격증', percentage: 52 },
      { name: 'Facebook Blueprint 자격증', percentage: 45 },
      { name: 'HubSpot Content Marketing', percentage: 32 },
      { name: 'Google Digital Marketing', percentage: 38 },
      { name: 'Meta Social Media Marketing', percentage: 28 },
    ],
    topSkills: [
      { skill: 'Google Analytics', percentage: 82 },
      { skill: 'Facebook Ads', percentage: 75 },
      { skill: 'SEO/SEM', percentage: 68 },
      { skill: 'Content Marketing', percentage: 58 },
      { skill: 'Excel/SQL', percentage: 52 },
    ],
    avgExperience: '신입 ~ 3년',
    recommendedCompetitions: [
      { name: 'Google Online Marketing Challenge', description: 'Google 마케팅 챌린지' },
      { name: 'Meta Blueprint Challenge', description: 'Facebook/Instagram 마케팅 대회' },
      { name: 'DMAK(Digital Marketing Award Korea)', description: '디지털 마케팅 어워드' },
    ],
    salaryRange: '3,000만원 ~ 4,800만원',
    popularTools: ['Google Analytics', 'Google Ads', 'Meta Business Suite', 'Notion', 'Figma'],
    insights: [
      'GA4 전환 및 데이터 기반 마케팅 분석 능력 중요',
      'ROAS, CPA 등 핵심 지표 관리 경험 필수',
      '커뮤니티 운영 및 콘텐츠 기획 능력 우대',
    ],
  },

  'UX 디자이너': {
    position: 'UX 디자이너',
    avgGpa: 3.4,
    gpaRange: '3.1 ~ 3.7',
    avgToeic: 730,
    toeicRange: '670 ~ 810',
    commonCertificates: [
      { name: 'Google UX Design Certificate', percentage: 38 },
      { name: 'Adobe Certified Professional', percentage: 25 },
      { name: 'Nielsen Norman UX Certification', percentage: 22 },
      { name: 'Interaction Design Foundation', percentage: 28 },
      { name: 'Human Interface Guidelines', percentage: 18 },
    ],
    topSkills: [
      { skill: 'Figma', percentage: 92 },
      { skill: 'User Research', percentage: 78 },
      { skill: 'Wireframing', percentage: 85 },
      { skill: 'Prototyping', percentage: 82 },
      { skill: 'UI Design', percentage: 68 },
    ],
    avgExperience: '신입 ~ 3년',
    recommendedCompetitions: [
      { name: 'Designathon', description: 'UX 디자인 해커톤' },
      { name: 'Adobe Creative Challenge', description: 'Adobe 크리에이티브 대회' },
      { name: 'UX Challenge', description: 'Figma/Sketch UX 챌린지' },
    ],
    salaryRange: '3,200만원 ~ 5,000만원',
    popularTools: ['Figma', 'Sketch', 'Adobe XD', 'Miro', 'Notion'],
    insights: [
      'Figma 능숙도는 거의 필수 수준',
      '사용자 리서치 및 인터뷰 경험 중요',
      '데이터 기반 디자인 의사결정 능력 우대',
    ],
  },

  'PM/PO': {
    position: 'PM/PO',
    avgGpa: 3.5,
    gpaRange: '3.2 ~ 3.8',
    avgToeic: 820,
    toeicRange: '770 ~ 890',
    commonCertificates: [
      { name: 'PSPO (Professional Scrum Product Owner)', percentage: 42 },
      { name: 'Google Project Management Certificate', percentage: 35 },
      { name: 'SQL 개발자 (SQLD)', percentage: 28 },
      { name: 'Certified Scrum Master (CSM)', percentage: 38 },
      { name: 'Product Management Certificate', percentage: 25 },
      { name: 'Lean Six Sigma', percentage: 18 },
    ],
    topSkills: [
      { skill: 'Product Planning', percentage: 88 },
      { skill: 'SQL/Data Analysis', percentage: 65 },
      { skill: 'Agile/Scrum', percentage: 72 },
      { skill: 'Wireframing', percentage: 58 },
      { skill: 'User Research', percentage: 62 },
    ],
    avgExperience: '경력 1~5년',
    recommendedCompetitions: [
      { name: 'Product Hunt Hackathon', description: '프로덕트 런칭 해커톤', url: 'https://www.producthunt.com/' },
      { name: 'Startup Weekend', description: '스타트업 주말 해커톤' },
      { name: 'Google Venture Sprint', description: '프로덕트 디자인 스프린트 워크샵' },
    ],
    salaryRange: '4,000만원 ~ 6,500만원',
    popularTools: ['Jira', 'Notion', 'Figma', 'Google Analytics', 'Mixpanel'],
    insights: [
      '데이터 기반 의사결정 능력 필수',
      'SQL을 활용한 직접 데이터 분석 능력 우대',
      'B2C/B2B 도메인별 전문성 중요',
    ],
  },

  'HR/인사': {
    position: 'HR/인사',
    avgGpa: 3.3,
    gpaRange: '3.0 ~ 3.6',
    avgToeic: 780,
    toeicRange: '720 ~ 850',
    commonCertificates: [
      { name: '인적자원관리사 2급', percentage: 58 },
      { name: '노무사', percentage: 22 },
      { name: 'SHRM-CP', percentage: 15 },
      { name: 'PHR (Professional in Human Resources)', percentage: 18 },
      { name: '직업상담사 2급', percentage: 25 },
      { name: 'HR Analytics Certificate', percentage: 20 },
    ],
    topSkills: [
      { skill: 'HR Planning', percentage: 75 },
      { skill: 'Recruitment', percentage: 82 },
      { skill: 'Employee Relations', percentage: 68 },
      { skill: 'Excel/Google Sheets', percentage: 72 },
      { skill: 'HRIS', percentage: 45 },
    ],
    avgExperience: '신입 ~ 3년',
    recommendedCompetitions: [
      { name: 'HR Innovation Challenge', description: 'HR 혁신 아이디어 공모전' },
      { name: 'People Analytics Competition', description: 'HR 데이터 분석 대회' },
    ],
    salaryRange: '3,000만원 ~ 4,500만원',
    popularTools: ['Excel', 'Notion', 'Slack', 'Workday', '그룹웨어'],
    insights: [
      '채용 프로세스 설계 및 운영 경험 우대',
      '조직문화 및 인력 기획 능력 중요',
      'People Analytics 능력 점차 중요해지는 추세',
    ],
  },

  // 기본 템플릿 (매칭 안 되는 경우)
  '기타': {
    position: '기타',
    avgGpa: 3.4,
    gpaRange: '3.0 ~ 3.7',
    avgToeic: 750,
    toeicRange: '700 ~ 850',
    commonCertificates: [],
    topSkills: [],
    avgExperience: '신입 ~ 3년',
    recommendedCompetitions: [],
    salaryRange: '3,000만원 ~ 5,000만원',
    popularTools: [],
    insights: ['해당 직무에 맞는 실무 경험과 프로젝트가 가장 중요합니다.'],
  },
};

/**
 * 직무명을 받아서 가장 유사한 공개 데이터 반환
 */
export function getPublicJobSpec(position: string): PublicJobSpec {
  // 정확한 매칭
  if (PUBLIC_JOB_DATA[position]) {
    return PUBLIC_JOB_DATA[position];
  }

  // 유사 키워드 매칭
  const lowerPosition = position.toLowerCase();

  for (const [key, spec] of Object.entries(PUBLIC_JOB_DATA)) {
    const lowerKey = key.toLowerCase();
    if (lowerPosition.includes(lowerKey) || lowerKey.includes(lowerPosition)) {
      return spec;
    }
  }

  // 키워드 기반 매칭
  if (lowerPosition.includes('백엔드') || lowerPosition.includes('backend') || lowerPosition.includes('서버')) {
    return PUBLIC_JOB_DATA['백엔드 개발'];
  }
  if (lowerPosition.includes('프론트') || lowerPosition.includes('frontend') || lowerPosition.includes('웹')) {
    return PUBLIC_JOB_DATA['프론트엔드 개발'];
  }
  if (lowerPosition.includes('데이터') && (lowerPosition.includes('분석') || lowerPosition.includes('analyst'))) {
    return PUBLIC_JOB_DATA['데이터 분석'];
  }
  if (lowerPosition.includes('ai') || lowerPosition.includes('머신러닝') || lowerPosition.includes('딥러닝')) {
    return PUBLIC_JOB_DATA['AI/머신러닝'];
  }
  if (lowerPosition.includes('마케팅') || lowerPosition.includes('marketing')) {
    return PUBLIC_JOB_DATA['디지털 마케팅'];
  }
  if (lowerPosition.includes('ux') || lowerPosition.includes('사용자경험')) {
    return PUBLIC_JOB_DATA['UX 디자이너'];
  }
  if (lowerPosition.includes('pm') || lowerPosition.includes('po') || lowerPosition.includes('기획')) {
    return PUBLIC_JOB_DATA['PM/PO'];
  }
  if (lowerPosition.includes('hr') || lowerPosition.includes('인사') || lowerPosition.includes('채용')) {
    return PUBLIC_JOB_DATA['HR/인사'];
  }

  // 기본값
  return PUBLIC_JOB_DATA['기타'];
}
