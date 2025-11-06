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

export function getAllActivities(activities: IntegratedActivities): string[] {
  const allActivities: string[] = [];
  Object.values(activities).forEach(activityList => {
    allActivities.push(...activityList);
  });
  return allActivities;
}
