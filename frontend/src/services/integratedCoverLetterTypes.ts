// integrated_cover_letters 테이블 타입 정의

export interface IntegratedUserSpec {
  gpa?: string;              // "3.74/4.5"
  major?: string;            // "경영"
  other?: string;            // "TOEFL 96"
  toeic?: string;            // "950"
  awards?: string;
  school?: string;           // "연세대학교"
  certifications?: string;   // "AWS Cloud Practitioner, Microsoft Azure AI, ADsP"
  club_experience?: string;
  intern_experience?: string | null;
}

export interface IntegratedActivities {
  [key: string]: string[];   // { "기타": [...], "활동": [...], "느낀점": [...] }
}

export interface IntegratedCoverLetter {
  id: number;
  year: string | null;
  company_name: string | null;
  job_position: string | null;
  full_text: string;
  categories: string[];      // ["인턴", "대기업"]
  user_spec: IntegratedUserSpec;
  activities: IntegratedActivities;
}

// 파싱 헬퍼 함수들
export function parseGpa(gpaString?: string): number | null {
  if (!gpaString || gpaString.trim() === '' || gpaString === '0') return null;

  // 분수 형식 매칭: "3.74/4.5"
  const fractionMatch = gpaString.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
  if (fractionMatch) {
    const gpa = parseFloat(fractionMatch[1]);
    const maxGpa = parseFloat(fractionMatch[2]);
    if (maxGpa === 0 || gpa === 0) return null;
    return (gpa / maxGpa) * 4.5; // 4.5 기준으로 정규화
  }

  // 단독 숫자 형식 매칭: "3.3", "4.41"
  const numberMatch = gpaString.match(/^(\d+\.?\d*)$/);
  if (numberMatch) {
    const gpa = parseFloat(numberMatch[1]);
    if (gpa === 0) return null;
    // 4.5 스케일로 가정 (대부분의 한국 대학)
    if (gpa <= 4.5) return gpa;
    // 4.3 스케일인 경우 4.5로 변환
    if (gpa <= 4.3) return (gpa / 4.3) * 4.5;
    // 4.0 스케일인 경우 4.5로 변환
    if (gpa <= 5.0) return (gpa / 5.0) * 4.5;
    return null; // 비정상적인 값
  }

  return null;
}

export function parseToeic(toeicString?: string): number | null {
  if (!toeicString || toeicString.trim() === '' || toeicString === '0') return null;
  const score = parseInt(toeicString);
  if (isNaN(score) || score === 0 || score < 300) return null; // 300점 미만은 유효하지 않은 점수로 간주
  return score;
}

// 의미 없는 활동 카테고리 키워드 (카운트에서 제외)
const MEANINGLESS_ACTIVITY_CATEGORIES = [
  '활동', '경험', '느낀', '느낀점', '느낀 점', '생각', '배운', '배운점', '배운 점',
  '깨달음', '느낌', '소감', '후기', '회고', '성장', '발전', '변화', '역량', '능력',
  '자질', '태도', '마음가짐', '자세', '의지', '열정', '목표', '다짐', '희망', '바람',
  '기여', '노력', '시간', '과정', '단계', '내용', '부분', '요소', '측면',
  '특징', '장점', '강점', '매력', '가치', '의미', '중요성', '필요성',
  '이해', '파악', '습득', '학습', '공부', '관심', '흥미', '동기', '계기',
  '기회', '경우', '상황', '환경', '조건', '여건', '문제', '과제', '방법',
  '전략', '계획', '목적', '이유', '원인', '결과', '영향', '효과', '성과',
  '기타', '그외', '그 외', '등등', '기타 등등', '등', '기타사항', '기타 사항',
];

export function getAllActivities(activities: IntegratedActivities): string[] {
  const allActivities: string[] = [];

  Object.entries(activities).forEach(([categoryKey, activityList]) => {
    // 카테고리 키가 의미 없는 키워드를 포함하는지 확인
    const isMeaninglessCategory = MEANINGLESS_ACTIVITY_CATEGORIES.some(meaningless =>
      categoryKey.toLowerCase().includes(meaningless.toLowerCase())
    );

    // 의미 있는 카테고리만 포함
    if (!isMeaninglessCategory) {
      allActivities.push(...activityList);
    }
  });

  return allActivities;
}
