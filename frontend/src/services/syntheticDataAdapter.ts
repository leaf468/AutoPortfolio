/**
 * Synthetic Applicants 데이터를 기존 인터페이스로 변환하는 어댑터
 * 기존 cover_letters, activities 테이블 구조와 호환되도록 변환
 */

export interface SyntheticApplicant {
  id: number;
  company_category: string;
  company_name: string;
  position: string;
  year: string;
  specs: {
    gpa: string;
    toeic: number;
    major: string;
    school: string;
  };
  certifications: string[];
  activities: Array<{
    type: string;
    content: string;
  }>;
  cover_letter: Array<{
    question: string;
    answer: string;
  }>;
  is_synthetic: boolean;
  created_at: string;
}

/**
 * cover_letters 테이블 호환 인터페이스
 */
export interface CoverLetter {
  id: number;
  year: string;
  company_name: string;
  job_position: string;
  category: string;
  specific_info: string;
  full_text: string;
  created_at: string;
}

/**
 * activities 테이블 호환 인터페이스
 */
export interface Activity {
  id: number;
  cover_letter_id: number;
  activity_type: string;
  content: string;
  created_at: string;
}

/**
 * integrated_cover_letters 테이블 호환 인터페이스
 */
export interface IntegratedCoverLetter {
  id: number;
  year: string;
  company_name: string;
  job_position: string;
  user_spec: {
    gpa: string;
    toeic: string;
    major: string;
    school: string;
    certifications: string;
  };
  activities: any; // JSON
  created_at: string;
}

/**
 * SyntheticApplicant → CoverLetter 변환
 */
export function toCoverLetter(applicant: SyntheticApplicant): CoverLetter {
  return {
    id: applicant.id,
    year: applicant.year,
    company_name: applicant.company_name,
    job_position: applicant.position,
    category: applicant.company_category,
    specific_info: `${applicant.specs.school} ${applicant.specs.major} / 학점 ${applicant.specs.gpa} / 토익 ${applicant.specs.toeic}`,
    full_text: applicant.cover_letter.map(q => q.answer).join('\n\n'),
    created_at: applicant.created_at,
  };
}

/**
 * SyntheticApplicant → Activity[] 변환
 */
export function toActivities(applicant: SyntheticApplicant): Activity[] {
  return (applicant.activities || []).map((act, idx) => ({
    id: applicant.id * 1000 + idx, // 고유 ID 생성
    cover_letter_id: applicant.id,
    activity_type: act.type,
    content: act.content,
    created_at: applicant.created_at,
  }));
}

/**
 * SyntheticApplicant → IntegratedCoverLetter 변환
 */
export function toIntegratedCoverLetter(applicant: SyntheticApplicant): IntegratedCoverLetter {
  return {
    id: applicant.id,
    year: applicant.year,
    company_name: applicant.company_name,
    job_position: applicant.position,
    user_spec: {
      gpa: applicant.specs.gpa,
      toeic: applicant.specs.toeic.toString(),
      major: applicant.specs.major,
      school: applicant.specs.school,
      certifications: applicant.certifications.join(', '),
    },
    activities: applicant.activities,
    created_at: applicant.created_at,
  };
}

/**
 * 배치 변환: SyntheticApplicant[] → CoverLetter[]
 */
export function toCoverLetters(applicants: SyntheticApplicant[]): CoverLetter[] {
  return applicants.map(toCoverLetter);
}

/**
 * 배치 변환: SyntheticApplicant[] → Activity[]
 */
export function toActivitiesBatch(applicants: SyntheticApplicant[]): Activity[] {
  return applicants.flatMap(toActivities);
}

/**
 * 배치 변환: SyntheticApplicant[] → IntegratedCoverLetter[]
 */
export function toIntegratedCoverLetters(applicants: SyntheticApplicant[]): IntegratedCoverLetter[] {
  return applicants.map(toIntegratedCoverLetter);
}
