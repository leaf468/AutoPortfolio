import JSZip from 'jszip';
import { extractPPTXDataFromHTML, PPTXMappedData } from './aiPptxMappingService';

/**
 * 포트폴리오 PPTX 생성 서비스
 *
 * PPTX 템플릿 파일의 XML을 수정하여 사용자 데이터를 자동으로 채워넣습니다.
 */

export interface PortfolioData {
  name?: string;
  title?: string;
  contact?: {
    email?: string;
    phone?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  about?: string;
  skills?: string[];
  skillCategories?: Array<{
    category: string;
    skills: string[];
  }>;
  projects?: Array<{
    title?: string;
    description?: string;
    period?: string;
    role?: string;
    achievements?: string;
    technologies?: string[];
    // 추가 상세 정보
    contributions?: string[];
    kpiMetrics?: Array<{ name: string; value: string }>;
    solution?: string;
    teamSize?: string;
    contribution?: string;
  }>;
  experience?: Array<{
    company?: string;
    position?: string;
    period?: string;
    description?: string;
    roles?: string[];
    achievements?: string;
    technologies?: string[];
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    period?: string;
  }>;
  awards?: Array<{
    title?: string;
    organization?: string;
    year?: string;
  }>;
}

/**
 * XML에서 특수문자 이스케이프
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * XML 텍스트 노드에서 플레이스홀더를 실제 데이터로 완전히 대치
 *
 * 중요: <a:t> 태그 내의 플레이스홀더 전체를 새로운 값으로 완전히 교체
 * 첫 번째 발견된 플레이스홀더만 교체 (순차적 교체를 위해)
 */
function replaceTextInXml(xml: string, placeholder: string, value: string): string {
  if (!placeholder || value === undefined) return xml;

  const escapedValue = escapeXml(value);

  // <a:t>태그 내에 플레이스홀더가 있으면 해당 태그의 내용 전체를 교체
  // 예: <a:t>[이름]</a:t> → <a:t>홍길동</a:t>
  // 예: <a:t>[이메일] | [전화번호]</a:t>는 두 번 호출로 각각 교체
  // g 플래그 제거하여 첫 번째 발견만 교체
  const regex = new RegExp(
    `(<a:t>)([^<]*${placeholder.replace(/[[\]()]/g, '\\$&')}[^<]*)(</a:t>)`
  );

  return xml.replace(regex, (match, openTag, content, closeTag) => {
    // 플레이스홀더만 교체하고 주변 텍스트는 유지
    // "[이메일] | [전화번호]" 형식도 지원
    const newContent = content.replace(placeholder, escapedValue);
    return openTag + newContent + closeTag;
  });
}

/**
 * 모든 플레이스홀더를 한번에 찾아서 매핑
 */
function findAllPlaceholders(xml: string): string[] {
  const placeholders: string[] = [];
  const regex = /<a:t>([^<]*\[[^\]]+\][^<]*)<\/a:t>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const content = match[1];
    // [xxx] 형식의 플레이스홀더 추출
    const placeholderMatches = content.match(/\[[^\]]+\]/g);
    if (placeholderMatches) {
      placeholders.push(...placeholderMatches);
    }
  }

  // 중복 제거
  return placeholders.filter((item, index) => placeholders.indexOf(item) === index);
}

/**
 * Slide 1 (표지) 데이터 채우기
 */
function fillSlide1(xml: string, data: PortfolioData): string {
  let result = xml;

  console.log('📄 Slide 1 데이터:', {
    name: data.name,
    title: data.title,
    email: data.contact?.email,
    phone: data.contact?.phone
  });

  // 각 플레이스홀더를 순차적으로 교체
  result = replaceTextInXml(result, '[이름]', data.name || '');
  result = replaceTextInXml(result, '[지원 직무]', data.title || '');
  result = replaceTextInXml(result, '[이메일]', data.contact?.email || '');
  result = replaceTextInXml(result, '[전화번호]', data.contact?.phone || '');
  result = replaceTextInXml(result, '[회사명/팀명]', '');
  result = replaceTextInXml(result, '[YYYY.MM]', '');

  return result;
}

/**
 * Slide 2 (자기소개) 데이터 채우기
 */
function fillSlide2(xml: string, data: PortfolioData): string {
  let result = xml;

  // 자기소개 - about 텍스트를 적절히 요약 (없으면 빈 값)
  const aboutText = data.about || '';
  const aboutFirstLine = aboutText ? aboutText.split(/[.\n]/).filter(Boolean)[0] || aboutText : '';
  result = replaceTextInXml(result, '[경력 연차/전문 분야/관심 도메인]', aboutFirstLine.slice(0, 80));

  // 핵심 역량 (최대 5개) - skills 배열에서 추출
  const allSkills = data.skills || [];

  // skillCategories가 있으면 거기서도 추출
  if (data.skillCategories && data.skillCategories.length > 0 && allSkills.length === 0) {
    data.skillCategories.forEach(cat => {
      if (cat.skills) {
        allSkills.push(...cat.skills);
      }
    });
  }

  // 스킬 채우기 (없으면 빈 값)
  for (let i = 1; i <= 5; i++) {
    const skill = allSkills[i - 1] || '';
    result = replaceTextInXml(result, `[역량${i}]`, skill);
  }

  // 가치관/업무 스타일 - about 텍스트를 문장 단위로 나누기 (없으면 빈 값)
  const sentences = aboutText ? aboutText.split(/[.!\n]/).filter(s => s.trim().length > 10) : [];

  // 3개의 서로 다른 문장 또는 키워드 생성 (없으면 빈 문자열)
  const value1 = sentences[0]?.trim().slice(0, 35) || '';
  const value2 = sentences[1]?.trim().slice(0, 35) || '';
  const value3 = sentences[2]?.trim().slice(0, 35) || (sentences.length > 3 ? sentences[3]?.trim().slice(0, 35) : '');

  // 각 [설명 또는 키워드]를 순차적으로 교체 - 첫 번째 발견된 것부터 순서대로
  result = replaceTextInXml(result, '[설명 또는 키워드]', value1);
  result = replaceTextInXml(result, '[설명 또는 키워드]', value2);
  result = replaceTextInXml(result, '[설명 또는 키워드]', value3);

  // 주요 성과 - 프로젝트나 경력에서 성과 추출 (없으면 빈 값)
  let achievement = '';

  // 프로젝트에서 먼저 찾기
  if (data.projects && data.projects.length > 0) {
    const firstProject = data.projects[0];
    if (firstProject.achievements) {
      achievement = firstProject.achievements.split(/[.\n]/)[0]?.slice(0, 50) || '';
    }
  }

  // 경력에서 찾기
  if (!achievement && data.experience && data.experience.length > 0) {
    const firstExp = data.experience[0];
    if (typeof firstExp.achievements === 'string' && firstExp.achievements) {
      achievement = firstExp.achievements.split(/[.\n]/)[0]?.slice(0, 50) || '';
    } else if (Array.isArray(firstExp.achievements) && firstExp.achievements.length > 0) {
      achievement = firstExp.achievements[0]?.slice(0, 50) || '';
    }
  }

  result = replaceTextInXml(result, '[수치/임팩트]', achievement);

  // 링크 - URL에서 도메인만 추출
  const websiteDisplay = data.contact?.website
    ? data.contact.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
    : '';

  const linkedinDisplay = data.contact?.linkedin
    ? data.contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/, '').split('/')[0]
    : '';

  const githubDisplay = data.contact?.github
    ? data.contact.github.replace(/^https?:\/\/(www\.)?github\.com\//, '').split('/')[0]
    : '';

  result = replaceTextInXml(result, '[개인 사이트]', websiteDisplay);
  result = replaceTextInXml(result, '[LinkedIn]', linkedinDisplay);
  result = replaceTextInXml(result, '[GitHub]', githubDisplay);

  // 추가 참고 사항
  result = replaceTextInXml(result, '[추가 참고 사항]', '상세 내용은 포트폴리오 웹사이트 참조');

  // 짧은 설명 2개 (핵심 키포인트, 차별점) - 완전히 다른 내용
  const keypoint1 = allSkills.length >= 2 ? (allSkills.slice(0, 2).join(', ') + ' 전문가').slice(0, 28) : '다양한 기술 스택 보유';
  const expYears = data.experience?.length || 0;
  const keypoint2 = expYears > 0 ? `${expYears}개 회사 경력`.slice(0, 28) : '풍부한 프로젝트 경험';

  result = replaceTextInXml(result, '[짧은 설명]', keypoint1);
  result = replaceTextInXml(result, '[짧은 설명]', keypoint2);

  // 시각 요소 설명
  result = replaceTextInXml(result, '[예시 다이어그램/사진]', '대표 프로젝트 스크린샷 및 성과 차트');

  return result;
}

/**
 * Slide 3 (경력사항) 데이터 채우기
 */
function fillSlide3(xml: string, data: PortfolioData): string {
  let result = xml;

  const experiences = data.experience || [];

  // 회사 A (첫 번째 경력) - 없으면 빈 값
  if (experiences[0]) {
    const exp = experiences[0];
    result = replaceTextInXml(result, '[회사 A]', exp.company || '');
    result = replaceTextInXml(result, '[직무]', exp.position || '');
    result = replaceTextInXml(result, '[YYYY.MM–YYYY.MM]', exp.period || '');

    // 역할 추출 - roles 배열에서만 가져오기 (없으면 빈 값)
    const roles = exp.roles || [];
    const role1 = roles[0]?.trim().slice(0, 18) || '';
    const role2 = roles[1]?.trim().slice(0, 18) || '';

    result = replaceTextInXml(result, '[핵심 역할 1]', role1);
    result = replaceTextInXml(result, '[핵심 역할 2]', role2);

    // 성과 추출 (30자 이내, 없으면 빈 값)
    let achievementText = '';
    if (typeof exp.achievements === 'string' && exp.achievements) {
      achievementText = exp.achievements.split(/[.\n]/)[0]?.trim().slice(0, 30) || '';
    } else if (Array.isArray(exp.achievements) && exp.achievements.length > 0) {
      achievementText = exp.achievements[0]?.trim().slice(0, 30) || '';
    }

    result = replaceTextInXml(result, '[지표/수치/전후 비교]', achievementText);

    // 기술 스택 (30자 이내, 없으면 빈 값)
    const techStack = exp.technologies?.join(', ') || '';
    result = replaceTextInXml(result, '[언어/프레임워크/인프라]', techStack.slice(0, 30));

    // 간단 설명 (없으면 빈 값)
    const briefDesc = exp.position || exp.company || '';
    result = replaceTextInXml(result, '[간단 설명 또는 담당 영역]', briefDesc.slice(0, 25));
  } else {
    // 경력이 없을 경우 빈 값
    result = replaceTextInXml(result, '[회사 A]', '');
    result = replaceTextInXml(result, '[직무]', '');
    result = replaceTextInXml(result, '[YYYY.MM–YYYY.MM]', '');
    result = replaceTextInXml(result, '[핵심 역할 1]', '');
    result = replaceTextInXml(result, '[핵심 역할 2]', '');
    result = replaceTextInXml(result, '[지표/수치/전후 비교]', '');
    result = replaceTextInXml(result, '[언어/프레임워크/인프라]', '');
    result = replaceTextInXml(result, '[간단 설명 또는 담당 영역]', '');
  }

  // 회사 B (두 번째 경력) - 없으면 빈 값
  if (experiences[1]) {
    const exp = experiences[1];
    result = replaceTextInXml(result, '[회사 B]', exp.company || '');
    result = replaceTextInXml(result, '[직무]', exp.position || '');
    result = replaceTextInXml(result, '[YYYY.MM–YYYY.MM]', exp.period || '');

    // 역할 추출 - roles 배열에서만 가져오기 (없으면 빈 값)
    const roles = exp.roles || [];
    const role1 = roles[0]?.trim().slice(0, 18) || '';
    const role2 = roles[1]?.trim().slice(0, 18) || '';

    result = replaceTextInXml(result, '[핵심 역할 1]', role1);
    result = replaceTextInXml(result, '[핵심 역할 2]', role2);

    // 성과 추출 (30자 이내, 없으면 빈 값)
    let achievementText = '';
    if (typeof exp.achievements === 'string' && exp.achievements) {
      achievementText = exp.achievements.split(/[.\n]/)[0]?.trim().slice(0, 30) || '';
    } else if (Array.isArray(exp.achievements) && exp.achievements.length > 0) {
      achievementText = exp.achievements[0]?.trim().slice(0, 30) || '';
    }

    result = replaceTextInXml(result, '[지표/수치/임팩트]', achievementText);

    // 기술 스택 (30자 이내, 없으면 빈 값)
    const techStack = exp.technologies?.join(', ') || '';
    result = replaceTextInXml(result, '[언어/프레임워크/인프라]', techStack.slice(0, 30));
  } else {
    result = replaceTextInXml(result, '[회사 B]', '');
    result = replaceTextInXml(result, '[직무]', '');
    result = replaceTextInXml(result, '[YYYY.MM–YYYY.MM]', '');
    result = replaceTextInXml(result, '[핵심 역할 1]', '');
    result = replaceTextInXml(result, '[핵심 역할 2]', '');
    result = replaceTextInXml(result, '[지표/수치/임팩트]', '');
    result = replaceTextInXml(result, '[언어/프레임워크/인프라]', '');
  }

  // 총 경력 계산 (없으면 빈 값)
  const totalYears = experiences.reduce((sum, exp) => {
    if (exp.period) {
      const match = exp.period.match(/(\d+)\s*년/);
      return sum + (match ? parseInt(match[1]) : 1);
    }
    return sum + 1;
  }, 0);
  result = replaceTextInXml(result, '[X년]', totalYears > 0 ? `${totalYears}년` : '');

  // 도메인/산업 (없으면 빈 값)
  const domain = experiences[0]?.company ? `${experiences[0].company}`.slice(0, 25) : '';
  result = replaceTextInXml(result, '[산업/업무 분야]', domain);

  // 기타 경력 (빈 값)
  result = replaceTextInXml(result, '[기타] 인턴/프리랜스/자문', '');
  result = replaceTextInXml(result, '[기간]', '');

  // 하이라이트
  const highlights = experiences.slice(0, 3).map(e => e.position).filter(p => p).join(', ') || '풀스택 개발, 팀 리더십, 성능 최적화';
  result = replaceTextInXml(result, '[핵심 역량/임팩트 키워드 2~3개]', highlights);

  // 노트
  result = replaceTextInXml(result, '[프로젝트 상세는 다음 페이지에서 확인]', '프로젝트 상세 내용은 다음 페이지 참조');

  // 시각 요소
  result = replaceTextInXml(result, '[타임라인/로고 배치 예시]', '경력 타임라인 및 주요 기술 스택');

  return result;
}

/**
 * Slide 4-6 (프로젝트) 데이터 채우기
 */
function fillProjectSlide(xml: string, project?: PortfolioData['projects'][0], index: number = 1): string {
  let result = xml;

  if (!project) {
    // 프로젝트가 없으면 기본값
    result = replaceTextInXml(result, '[프로젝트명]', `프로젝트 ${index}`);
    result = replaceTextInXml(result, '[YYYY.MM–YYYY.MM]', '');
    result = replaceTextInXml(result, '[역할]', '');
    result = replaceTextInXml(result, '[해결하려는 문제와 맥락]', '');
    result = replaceTextInXml(result, '[해결하려는 문제 또는 고객 페인포인트]', '');
    result = replaceTextInXml(result, '[해결하려는 문제와 KPI]', '');

    // 기술 스택
    result = replaceTextInXml(result, '[언어]', '');
    result = replaceTextInXml(result, '[프레임워크]', '');
    result = replaceTextInXml(result, '[DB/데이터]', '');
    result = replaceTextInXml(result, '[인프라/클라우드]', '');
    result = replaceTextInXml(result, '[인프라]', '');
    result = replaceTextInXml(result, '[도구/협업]', '');
    result = replaceTextInXml(result, '[도구]', '');

    // 성과
    result = replaceTextInXml(result, '[핵심 기여 1]', '');
    result = replaceTextInXml(result, '[핵심 기여 2]', '');
    result = replaceTextInXml(result, '[핵심 기여 3]', '');
    result = replaceTextInXml(result, '[기여 1]', '');
    result = replaceTextInXml(result, '[기여 2]', '');
    result = replaceTextInXml(result, '[기여 3]', '');

    // KPI
    result = replaceTextInXml(result, '[핵심 KPI 또는 성공 기준]', '');
    result = replaceTextInXml(result, '[핵심 KPI]', '');
    result = replaceTextInXml(result, '[목표 KPI 및 성공 기준]', '');
    result = replaceTextInXml(result, '[지표명]', '');
    result = replaceTextInXml(result, '[정의/측정 방법]', '');
    result = replaceTextInXml(result, '[수치/전후 비교]', '');
    result = replaceTextInXml(result, '[숫자 또는 임팩트 요약]', '');
    result = replaceTextInXml(result, '[주요 지표/수치/전후 비교]', '');
    result = replaceTextInXml(result, '[성과 하이라이트]', '');
    result = replaceTextInXml(result, '[+00%]', '');
    result = replaceTextInXml(result, '[▼00%]', '');
    result = replaceTextInXml(result, '[T+00]', '');
    result = replaceTextInXml(result, '[리드타임]', '');
    result = replaceTextInXml(result, '[오류/이탈]', '');
    result = replaceTextInXml(result, '[+XX%]', '');
    result = replaceTextInXml(result, '[YY%]', '');
    result = replaceTextInXml(result, '[수치]', '');
    result = replaceTextInXml(result, '[달성률 % 입력]', '');

    // 링크/참조
    result = replaceTextInXml(result, '[데모]', '');
    result = replaceTextInXml(result, '[리포지토리]', '');
    result = replaceTextInXml(result, '[문서/보고서]', '');
    result = replaceTextInXml(result, '[문서]', '');
    result = replaceTextInXml(result, '[검증 방법/리스크/후속 과제]', '');
    result = replaceTextInXml(result, '[추가 참고 사항 또는 역할 범위]', '');
    result = replaceTextInXml(result, '[검증 방법/참고 링크]', '');

    // 시각 요소
    result = replaceTextInXml(result, '[스크린샷/아키텍처 다이어그램 자리]', '');
    result = replaceTextInXml(result, '[예시 흐름/전후 비교]', '');
    result = replaceTextInXml(result, '[예시 흐름도/아키텍처]', '');
    result = replaceTextInXml(result, '[이미지/흐름도 예시]', '');
    result = replaceTextInXml(result, '[이름]', '');

    return result;
  }

  // 프로젝트 기본 정보
  result = replaceTextInXml(result, '[프로젝트명]', (project.title || `프로젝트 ${index}`).slice(0, 30));
  result = replaceTextInXml(result, '[YYYY.MM–YYYY.MM]', project.period || '');
  result = replaceTextInXml(result, '[역할]', (project.role || '개발자').slice(0, 20));

  // 문제 정의 - 짧게 요약 (40자 이내)
  const description = project.description || '';
  let briefDescription = description.split(/[.\n]/)[0]?.trim() || description;

  // 너무 길면 더 짧게 자르기
  if (briefDescription.length > 40) {
    briefDescription = briefDescription.slice(0, 37) + '...';
  }

  result = replaceTextInXml(result, '[해결하려는 문제와 맥락]', briefDescription);
  result = replaceTextInXml(result, '[해결하려는 문제 또는 고객 페인포인트]', briefDescription);
  result = replaceTextInXml(result, '[해결하려는 문제와 KPI]', briefDescription);

  // 기술 스택
  const tech = project.technologies || [];
  const techStr = tech.join(', ');
  result = replaceTextInXml(result, '[언어]', tech[0] || 'JavaScript');
  result = replaceTextInXml(result, '[프레임워크]', tech[1] || 'React');
  result = replaceTextInXml(result, '[DB/데이터]', tech[2] || 'PostgreSQL');
  result = replaceTextInXml(result, '[인프라/클라우드]', tech[3] || 'AWS');
  result = replaceTextInXml(result, '[인프라]', tech[3] || 'AWS');
  result = replaceTextInXml(result, '[도구/협업]', 'Git, Jira');
  result = replaceTextInXml(result, '[도구]', 'Git');

  // 성과/기여 - contributions 배열 사용 또는 achievements에서 추출
  const contributions = project.contributions || [];
  const achievements = project.achievements || '';

  const contrib1 = contributions[0] || achievements.split(/[.\n]/)[0]?.trim().slice(0, 25) || '';
  const contrib2 = contributions[1] || achievements.split(/[.\n]/)[1]?.trim().slice(0, 25) || '';
  const contrib3 = contributions[2] || achievements.split(/[.\n]/)[2]?.trim().slice(0, 25) || '';

  result = replaceTextInXml(result, '[핵심 기여 1]', contrib1);
  result = replaceTextInXml(result, '[핵심 기여 2]', contrib2);
  result = replaceTextInXml(result, '[핵심 기여 3]', contrib3);
  result = replaceTextInXml(result, '[기여 1]', contrib1);
  result = replaceTextInXml(result, '[기여 2]', contrib2);
  result = replaceTextInXml(result, '[기여 3]', contrib3);

  // KPI 관련 - kpiMetrics 배열 사용 또는 achievements에서 추출
  const kpiMetrics = project.kpiMetrics || [];
  const kpiText = achievements.slice(0, 30);

  const kpi1Name = kpiMetrics[0]?.name || '성과 지표';
  const kpi1Value = kpiMetrics[0]?.value || kpiText;
  const kpi2Name = kpiMetrics[1]?.name || '추가 지표';
  const kpi2Value = kpiMetrics[1]?.value || '';
  const kpi3Name = kpiMetrics[2]?.name || '기타 지표';
  const kpi3Value = kpiMetrics[2]?.value || '';

  result = replaceTextInXml(result, '[핵심 KPI 또는 성공 기준]', achievements.slice(0, 40));
  result = replaceTextInXml(result, '[핵심 KPI]', achievements.slice(0, 30));
  result = replaceTextInXml(result, '[목표 KPI 및 성공 기준]', achievements.slice(0, 40));

  // 지표명과 수치를 순차적으로 교체
  result = replaceTextInXml(result, '[지표명]', kpi1Name);
  result = replaceTextInXml(result, '[정의/측정 방법]', `${kpi1Name} 측정`);
  result = replaceTextInXml(result, '[수치/전후 비교]', kpi1Value);
  result = replaceTextInXml(result, '[지표명]', kpi2Name);
  result = replaceTextInXml(result, '[정의/측정 방법]', `${kpi2Name} 분석`);
  result = replaceTextInXml(result, '[수치/전후 비교]', kpi2Value);
  result = replaceTextInXml(result, '[지표명]', kpi3Name);
  result = replaceTextInXml(result, '[정의/측정 방법]', `${kpi3Name} 비교`);
  result = replaceTextInXml(result, '[수치/전후 비교]', kpi3Value);

  result = replaceTextInXml(result, '[숫자 또는 임팩트 요약]', achievements.slice(0, 30));
  result = replaceTextInXml(result, '[주요 지표/수치/전후 비교]', achievements.slice(0, 40));
  result = replaceTextInXml(result, '[성과 하이라이트]', achievements.slice(0, 30));

  // 성과 수치 (예시)
  result = replaceTextInXml(result, '[+00%]', '+20%');
  result = replaceTextInXml(result, '[▼00%]', '▼30%');
  result = replaceTextInXml(result, '[T+00]', 'T+10');
  result = replaceTextInXml(result, '[리드타임]', '2주');
  result = replaceTextInXml(result, '[오류/이탈]', '5%');
  result = replaceTextInXml(result, '[+XX%]', '+25%');
  result = replaceTextInXml(result, '[YY%]', '95%');
  result = replaceTextInXml(result, '[수치]', achievements);
  result = replaceTextInXml(result, '[달성률 % 입력]', '100%');

  // 링크/참조
  result = replaceTextInXml(result, '[데모]', 'GitHub Repository');
  result = replaceTextInXml(result, '[리포지토리]', 'github.com/project');
  result = replaceTextInXml(result, '[문서/보고서]', '기술 문서');
  result = replaceTextInXml(result, '[문서]', '프로젝트 문서');
  result = replaceTextInXml(result, '[검증 방법/리스크/후속 과제]', 'A/B 테스트 및 성과 모니터링');
  result = replaceTextInXml(result, '[추가 참고 사항 또는 역할 범위]', project.role || '담당 역할: 전체 개발 주도');
  result = replaceTextInXml(result, '[검증 방법/참고 링크]', '실시간 모니터링 대시보드 운영');

  // 시각 요소
  result = replaceTextInXml(result, '[스크린샷/아키텍처 다이어그램 자리]', '프로젝트 스크린샷 및 시스템 아키텍처 다이어그램');
  result = replaceTextInXml(result, '[예시 흐름/전후 비교]', '개선 전후 성능 비교 차트');
  result = replaceTextInXml(result, '[예시 흐름도/아키텍처]', '시스템 플로우 다이어그램');
  result = replaceTextInXml(result, '[이미지/흐름도 예시]', '사용자 플로우 및 기술 스택 구조도');
  result = replaceTextInXml(result, '[이름]', project.title || '');

  return result;
}

/**
 * Slide 7 (기술 스택) 데이터 채우기
 */
function fillSlide7(xml: string, data: PortfolioData): string {
  let result = xml;

  const skills = data.skills || [];

  // 언어 (최대 3개)
  result = replaceTextInXml(result, '[언어1]', skills[0] || 'JavaScript');
  result = replaceTextInXml(result, '[언어2]', skills[1] || 'TypeScript');
  result = replaceTextInXml(result, '[언어3]', skills[2] || 'Python');

  // 스킬 (A, B, C)
  result = replaceTextInXml(result, '[스킬A]', skills[0] || 'React');
  result = replaceTextInXml(result, '[스킬B]', skills[1] || 'Node.js');
  result = replaceTextInXml(result, '[스킬C]', skills[2] || 'Git');

  // 도구
  result = replaceTextInXml(result, '[Git]', 'Git');
  result = replaceTextInXml(result, '[Jira]', 'Jira');
  result = replaceTextInXml(result, '[Figma]', 'Figma');

  // 레벨/우선순위
  result = replaceTextInXml(result, '[상]', '상');
  result = replaceTextInXml(result, '[중]', '중');
  result = replaceTextInXml(result, '[하]', '하');
  result = replaceTextInXml(result, '[연차/사용 빈도]', '');

  // 자격증/배지
  result = replaceTextInXml(result, '[자격증/배지 1]', '');
  result = replaceTextInXml(result, '[자격증/배지 2]', '');

  // 기타
  result = replaceTextInXml(result, '[항목]', '');
  result = replaceTextInXml(result, '[추가 기술 또는 우선순위 표기 규칙]', '');
  result = replaceTextInXml(result, '[아이콘/레벨 바를 활용한 가독성 향상]', '');

  return result;
}

/**
 * Slide 8 (연락처) 데이터 채우기
 */
function fillSlide8(xml: string, data: PortfolioData): string {
  let result = xml;

  result = replaceTextInXml(result, '[이메일]', data.contact?.email || 'example@email.com');
  result = replaceTextInXml(result, '[전화번호]', data.contact?.phone || '010-0000-0000');
  result = replaceTextInXml(result, '[웹사이트]', data.contact?.website || '');

  return result;
}

/**
 * PPTX 템플릿에 포트폴리오 데이터를 채워서 다운로드
 */
export async function exportPortfolioPptx(portfolioData: PortfolioData): Promise<void> {
  try {
    console.log('🎯 PPTX 생성 시작:', portfolioData);

    // 1. 템플릿 파일 로드
    const response = await fetch('/portfolio_templete_developer.pptx');
    if (!response.ok) {
      throw new Error('템플릿 파일을 불러올 수 없습니다.');
    }

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    console.log('✅ 템플릿 로드 완료');

    // 디버그: 각 슬라이드의 플레이스홀더 확인
    for (let i = 1; i <= 8; i++) {
      const slideFile = zip.file(`ppt/slides/slide${i}.xml`);
      if (slideFile) {
        const xml = await slideFile.async('string');
        const placeholders = findAllPlaceholders(xml);
        if (placeholders.length > 0) {
          console.log(`📋 Slide ${i} 플레이스홀더:`, placeholders);
        }
      }
    }

    // 2. 각 슬라이드 XML 수정
    const slides = [
      { name: 'slide1.xml', fillFn: (xml: string) => fillSlide1(xml, portfolioData) },
      { name: 'slide2.xml', fillFn: (xml: string) => fillSlide2(xml, portfolioData) },
      { name: 'slide3.xml', fillFn: (xml: string) => fillSlide3(xml, portfolioData) },
    ];

    for (const slide of slides) {
      const file = zip.file(`ppt/slides/${slide.name}`);
      if (file) {
        const xml = await file.async('string');
        const modifiedXml = slide.fillFn(xml);
        zip.file(`ppt/slides/${slide.name}`, modifiedXml);
        console.log(`✅ ${slide.name} 수정 완료`);
      }
    }

    // 프로젝트 슬라이드 (4-6)
    const projects = portfolioData.projects || [];
    for (let i = 0; i < 3; i++) {
      const slideName = `slide${i + 4}.xml`;
      const file = zip.file(`ppt/slides/${slideName}`);
      if (file) {
        const xml = await file.async('string');
        const modifiedXml = fillProjectSlide(xml, projects[i], i + 1);
        zip.file(`ppt/slides/${slideName}`, modifiedXml);
        console.log(`✅ ${slideName} 수정 완료`);
      }
    }

    // 기술 스택 슬라이드 (7)
    const slide7 = zip.file('ppt/slides/slide7.xml');
    if (slide7) {
      const xml = await slide7.async('string');
      const modifiedXml = fillSlide7(xml, portfolioData);
      zip.file('ppt/slides/slide7.xml', modifiedXml);
      console.log('✅ slide7.xml 수정 완료');
    }

    // 연락처 슬라이드 (8)
    const slide8 = zip.file('ppt/slides/slide8.xml');
    if (slide8) {
      const xml = await slide8.async('string');
      const modifiedXml = fillSlide8(xml, portfolioData);
      zip.file('ppt/slides/slide8.xml', modifiedXml);
      console.log('✅ slide8.xml 수정 완료');
    }

    // 3. 수정된 PPTX 생성 및 다운로드
    console.log('📦 PPTX 파일 생성 중...');
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${portfolioData.name || 'Portfolio'}_Portfolio.pptx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    console.log('✅ PPTX 다운로드 완료');
  } catch (error) {
    console.error('❌ PPTX 생성 실패:', error);
    throw error;
  }
}
