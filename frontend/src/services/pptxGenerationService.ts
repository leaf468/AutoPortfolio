import PizZip from 'pizzip';
import { PortfolioData } from '../types/portfolio';
import { PPTTemplateId } from '../types/pptTemplate';

interface PPTData {
  cover: {
    name: string;
    position: string;
  };
  introduction: {
    one_liner: string;
    introduction: string;
    strength_1: string;
    strength_2: string;
    strength_3: string;
  };
  projects: Array<{
    project_name: string;
    period: string;
    role: string;
    summary: string;
    achievement_1: string;
    achievement_2: string;
    achievement_3: string;
  }>;
  timeline: Array<{
    organization: string;
    position: string;
    period: string;
    achievement: string;
  }>;
  contact: {
    name: string;
    email: string;
    phone: string;
    portfolio_link: string;
  };
}

// Colorful Clean 템플릿용 데이터 구조
interface ColorfulCleanPPTData {
  cover: {
    name: string;
    position: string;
    one_liner: string;
    company: string;
    phone: string;
    email: string;
  };
  about: {
    summary: string;
    strength_1: string;
    strength_2: string;
    strength_3: string;
    years: string;
    location: string;
    work_type: string;
  };
  skills: {
    tools: string[];
    competency_1: string;
    competency_2: string;
    competency_3: string;
    competency_4: string;
  };
  project_1: {
    name: string;
    period: string;
    background: string;
    role_1: string;
    role_2: string;
    role_3: string;
    achievement_1: string;
    achievement_2: string;
    tech_tags: string[];
  };
  project_2: {
    name: string;
    period: string;
    background: string;
    role_1: string;
    role_2: string;
    role_3: string;
    achievement_1: string;
    achievement_2: string;
    tech_tags: string[];
  };
  experience: Array<{
    company: string;
    position: string;
    period: string;
    achievement: string;
  }>;
  education: {
    school: string;
    major: string;
    period: string;
    achievement: string;
  };
  certifications: string[];
  contact: {
    email: string;
    phone: string;
    portfolio_link: string;
    name: string;
    position: string;
    closing_message: string;
  };
}

// Impact Focused 템플릿용 데이터 구조
interface ImpactFocusedPPTData {
  cover: {
    name: string;
    position: string;
    one_liner: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  profile: {
    introduction: string;
    strengths: string[];
    domains: string[];
    competencies: Array<{
      name: string;
      evidence: string;
    }>;
  };
  timeline: Array<{
    period: string;
    company: string;
    position: string;
    impact: string;
  }>;
  summary_metrics: Array<{
    metric_name: string;
    value: string;
    comparison: string;
  }>;
  impact_cases: string[];
  domains: string[];
  project_1: {
    name: string;
    period: string;
    role: string;
    team_size: string;
    problem: string;
    goal: string;
    actions: string[];
    kpis: Array<{
      name: string;
      value: string;
      comparison: string;
    }>;
    tech_stack: string[];
  };
  project_2: {
    name: string;
    period: string;
    role: string;
    team_size: string;
    problem: string;
    goal: string;
    actions: string[];
    kpis: Array<{
      name: string;
      value: string;
      comparison: string;
    }>;
    tech_stack: string[];
  };
  kpi_metrics: Array<{
    metric_name: string;
    value: string;
    comparison: string;
  }>;
  impact_summaries: string[];
  certifications: string[];
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  certifications_detail: Array<{
    name: string;
    org: string;
    year: string;
    description: string;
  }>;
  contact: {
    email: string;
    phone: string;
    portfolio_link: string;
    work_type: string;
    location: string;
    available_date: string;
    value_statement: string;
  };
}

interface MarketingPlanningPPTData {
  cover: {
    name: string;
    position: string;
    email: string;
    phone: string;
    portfolio_link: string;
  };
  self_intro: {
    one_liner: string;
    name: string;
    title: string;
    org: string;
    work_type: string;
    email: string;
    phone: string;
    linkedin: string;
    value_proposition: string;
    career_summary: string;
    core_capabilities: string[];
    key_achievements: Array<{
      label: string;
      value: string;
    }>;
    skill_stack: string[];
  };
  core_competencies: Array<{
    name: string;
    description: string;
    proficiency: number; // 1-5
  }>;
  project_overview: Array<{
    name: string;
    role: string;
    period: string;
    goal_kpi: string;
    tactics: string;
    result: string;
    tags: string[];
  }>;
  project_detail_strategy: {
    background: string;
    constraints: string;
    goals: Array<{
      label: string;
      value: string;
    }>;
    measurement_tool: string;
    persona: string;
    journey_bottleneck: string;
    retention_point: string;
    positioning: string;
    roadmap: Array<{
      sprint: string;
      period: string;
      tasks: string[];
    }>;
  };
  project_detail_execution: {
    channel_mix: {
      paid: string[];
      owned: string[];
      earned: string[];
    };
    message: string;
    budget_allocation: string;
    experiment: {
      hypothesis: string;
      variants: string[];
      duration: string;
    };
    results: Array<{
      metric: string;
      before: string;
      after: string;
    }>;
    learnings: string[];
  };
  data_analysis: {
    funnel_insight: string;
    top_channel: string;
    retention_suggestion: string;
  };
  impact_highlights: Array<{
    label: string;
    value: string;
    context: string;
  }>;
  learning_cycle: {
    success_criteria: string;
    sprint_cycle: string;
  };
  reproducibility: {
    target: string;
    prerequisites: string;
    risk_mitigation: string;
  };
  testimonial: {
    content: string;
    author: string;
  };
  contact: {
    name: string;
    title: string;
    org: string;
    email: string;
    phone: string;
    linkedin: string;
    work_type: string;
    available_date: string;
    closing_message: string;
  };
}

interface PMPPTData {
  cover: {
    name: string;
    position: string;
    email: string;
    phone: string;
    portfolio_link: string;
  };
  self_intro: {
    subtitle: string;
    timeline: Array<{
      period: string;
      company: string;
      role: string;
    }>;
    skills: string[];
    highlights: Array<{
      metric: string;
      value: string;
    }>;
    values: string[];
  };
  project_1: {
    name: string;
    period: string;
    role: string;
    discovery: string;
    delivery: string;
    launch: string;
    background: string;
    hypothesis: string;
    collaboration: string;
    kpis: Array<{
      metric: string;
      value: string;
      description: string;
    }>;
    quantitative_result: string;
    qualitative_result: string;
  };
  project_2: {
    name: string;
    period: string;
    role: string;
    discovery: string;
    delivery: string;
    launch: string;
    background: string;
    hypothesis: string;
    collaboration: string;
    kpis: Array<{
      metric: string;
      value: string;
      description: string;
    }>;
    quantitative_result: string;
    qualitative_result: string;
    insights: string;
    next_actions: string;
    risks: string;
    mitigation: string;
  };
  project_3: {
    name: string;
    period: string;
    role: string;
    discovery: string;
    delivery: string;
    launch: string;
    background: string;
    hypothesis: string;
    collaboration: string;
    kpis: Array<{
      metric: string;
      value: string;
      description: string;
    }>;
    quantitative_result: string;
    qualitative_result: string;
    insights: string;
  };
  competencies: {
    summary: string;
    core_skills: Array<{
      category: string;
      description: string;
    }>;
    tools: {
      product: string[];
      design: string[];
      analytics: string[];
      collaboration: string[];
    };
    certifications: string[];
    additional: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    portfolio: string;
    linkedin: string;
    github: string;
    languages: string[];
    work_type: string;
    location: string;
    notes: string;
  };
}

class PPTXGenerationService {

  /**
   * 텍스트 길이를 제한하고 말줄임표 추가
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 여러 줄 텍스트를 최대 줄 수로 제한
   */
  private limitLines(text: string, maxLines: number, maxCharsPerLine: number = 50): string {
    if (!text) return '';
    const lines = text.split('\n').slice(0, maxLines);
    return lines.map(line => this.truncateText(line.trim(), maxCharsPerLine)).join('\n');
  }

  /**
   * 배열의 문자열들을 각각 길이 제한
   */
  private truncateArray(arr: string[], maxLength: number): string[] {
    return arr.map(item => this.truncateText(item, maxLength));
  }

  /**
   * LLM을 사용하여 포트폴리오 데이터를 PPT 형식으로 변환
   */
  async optimizeForPPT(data: PortfolioData, userProfile?: any): Promise<PPTData> {

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    // 프로필에서 이름, 이메일, 전화번호 가져오기 (우선순위: 프로필 > 포트폴리오 데이터)
    const userName = userProfile?.name || data.userInfo.name || '이름 없음';
    const userEmail = userProfile?.email || data.userInfo.email || '';
    const userPhone = userProfile?.phone || data.userInfo.phone || '';
    const userPosition = userProfile?.position || data.userInfo.title || '직무 없음';

    const prompt = `
당신은 포트폴리오 데이터를 PPT에 최적화된 형식으로 변환하는 전문가입니다.

=== 입력 데이터 ===
이름: ${userName}
직무: ${userPosition}
자기소개: ${data.userInfo.summary || '자기소개 없음'}
이메일: ${userEmail}
전화번호: ${userPhone}
웹사이트: ${data.userInfo.website || data.userInfo.github || userProfile?.github_url || ''}

스킬: ${data.skills.length > 0 ? data.skills.map(s => s.category + ': ' + s.items.join(', ')).join(' | ') : '스킬 정보 없음'}

프로젝트:
${data.projects.length > 0 ? data.projects.slice(0, 3).map((p, i) => `${i + 1}. ${p.name || '프로젝트명 없음'}
   - 설명: ${p.description || '설명 없음'}
   - 주요 성과: ${p.highlights && p.highlights.length > 0 ? p.highlights.join(', ') : '성과 정보 없음'}
   - 기술: ${p.technologies && p.technologies.length > 0 ? p.technologies.join(', ') : '기술 정보 없음'}`).join('\n') : '프로젝트 정보 없음'}

경력:
${data.experiences.length > 0 ? data.experiences.map((e, i) => `${i + 1}. ${e.company || '회사명 없음'} - ${e.position || '직무 없음'}
   - 기간: ${e.startDate || '시작일 미정'} ~ ${e.endDate || '현재'}
   - 주요 성과: ${e.achievements && e.achievements.length > 0 ? e.achievements.join(', ') : '성과 정보 없음'}`).join('\n') : '경력 정보 없음'}

교육:
${data.education.length > 0 ? data.education.map((e, i) => `${i + 1}. ${e.institution || e.school || '학교명 없음'} - ${e.degree || '학위 없음'}`).join('\n') : '교육 정보 없음'}

=== 요구사항 ===
위 데이터를 아래 JSON 형식으로 변환하세요:

{
  "cover": {
    "name": "이름 (프로필에서 가져온 실제 이름 사용)",
    "position": "직무/포지션"
  },
  "introduction": {
    "one_liner": "한줄 소개 (사용자가 입력한 자기소개 그대로 사용, 수정하지 말 것)",
    "introduction": "개인 소개 (4-6문장, 주요 경력/강점/관심 분야를 자세히 설명. 각 문장마다 줄바꿈 넣어서 \\n으로 구분)",
    "strength_1": "핵심 강점 1",
    "strength_2": "핵심 강점 2",
    "strength_3": "핵심 강점 3"
  },
  "projects": [
    {
      "project_name": "프로젝트명",
      "period": "YYYY.MM - YYYY.MM 형식",
      "role": "역할",
      "summary": "프로젝트의 목적/가치 한줄 요약",
      "achievement_1": "핵심 성과 1",
      "achievement_2": "핵심 성과 2",
      "achievement_3": "핵심 성과 3"
    }
  ] (최대 3개),
  "timeline": [
    {
      "organization": "기관/회사명",
      "position": "직무/전공",
      "period": "YYYY.MM - YYYY.MM 형식",
      "achievement": "핵심 성과/활동 한줄"
    }
  ] (경력 + 교육 합쳐서 최대 4개),
  "contact": {
    "name": "이름 (프로필에서 가져온 실제 이름)",
    "email": "이메일 (프로필에서 가져온 실제 이메일)",
    "phone": "전화번호 (프로필에서 가져온 실제 전화번호)",
    "portfolio_link": "포트폴리오/웹 링크"
  }
}

**중요**:
- one_liner는 사용자가 입력한 자기소개를 그대로 사용하세요 (수정하지 마세요)
- introduction은 4-6문장으로 자세하게 작성하고, 각 문장 끝에 \\n을 넣어주세요
- 이름, 이메일, 전화번호는 프로필 데이터를 우선 사용
- 날짜는 YYYY.MM 형식으로 통일
- 성과는 구체적인 수치나 결과 포함
`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a PPT portfolio optimizer. Respond only with valid JSON. 한국어로 작성하세요." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2500,
      });

      let content = response.choices[0].message?.content || "{}";

      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const result = JSON.parse(content);
      return result;
    } catch (error) {

      // 기본값 반환
      const fallbackData: PPTData = {
        cover: {
          name: userName,
          position: userPosition
        },
        introduction: {
          one_liner: data.userInfo.summary || '포트폴리오',
          introduction: data.userInfo.summary || '자기소개를 입력해주세요.',
          strength_1: data.skills[0]?.category || data.skills[0]?.items[0] || '강점 1',
          strength_2: data.skills[1]?.category || data.skills[1]?.items[0] || '강점 2',
          strength_3: data.skills[2]?.category || data.skills[2]?.items[0] || '강점 3'
        },
        projects: data.projects.slice(0, 3).map((p, i) => ({
          project_name: p.name || `프로젝트 ${i + 1}`,
          period: p.date || '2024.01 - 2024.12',
          role: '개발자',
          summary: p.description || '프로젝트 설명',
          achievement_1: p.highlights?.[0] || '주요 성과 1',
          achievement_2: p.highlights?.[1] || '주요 성과 2',
          achievement_3: p.highlights?.[2] || '주요 성과 3'
        })),
        timeline: [
          ...data.experiences.slice(0, 3).map(e => ({
            organization: e.company || '회사명',
            position: e.position || '직무',
            period: `${e.startDate || '2023.01'} - ${e.endDate || '현재'}`,
            achievement: e.achievements?.[0] || '주요 업무'
          })),
          ...data.education.slice(0, 1).map(e => ({
            organization: e.institution || e.school || '학교명',
            position: e.degree || '학위',
            period: `${e.startDate || '2020.03'} - ${e.endDate || '2024.02'}`,
            achievement: '학업 이수'
          }))
        ].slice(0, 4),
        contact: {
          name: userName,
          email: userEmail || 'email@example.com',
          phone: userPhone || '010-0000-0000',
          portfolio_link: data.userInfo.website || data.userInfo.github || userProfile?.github_url || 'https://github.com'
        }
      };

      // projects가 3개 미만이면 빈 프로젝트 추가
      while (fallbackData.projects.length < 3) {
        fallbackData.projects.push({
          project_name: `프로젝트 ${fallbackData.projects.length + 1}`,
          period: '2024.01 - 2024.12',
          role: '개발자',
          summary: '프로젝트 설명을 입력해주세요',
          achievement_1: '성과 1',
          achievement_2: '성과 2',
          achievement_3: '성과 3'
        });
      }

      // timeline이 4개 미만이면 빈 항목 추가
      while (fallbackData.timeline.length < 4) {
        fallbackData.timeline.push({
          organization: '기관명',
          position: '직무/전공',
          period: '2023.01 - 2024.12',
          achievement: '주요 활동'
        });
      }

      return fallbackData;
    }
  }

  /**
   * XML 특수문자 이스케이프
   */
  private escapeXML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * XML에서 특정 텍스트를 정확히 찾아서 교체 (디자인과 서식 유지)
   * Python 코드의 replace_text_in_shape 로직을 JavaScript로 구현
   */
  private replaceTextInXML(xml: string, oldText: string, newText: string): string {
    if (!oldText || !newText) return xml;

    const escapedNew = this.escapeXML(newText);
    const trimmedOld = oldText.trim();

    // <a:t> 태그 내의 텍스트를 정확히 매칭해서 교체
    const regex = /<a:t>([^<]*?)<\/a:t>/g;

    return xml.replace(regex, (match, content) => {
      if (content.trim() === trimmedOld) {
        return `<a:t>${escapedNew}</a:t>`;
      }
      return match;
    });
  }

  /**
   * Colorful Clean 템플릿용 LLM 최적화
   */
  async optimizeForColorfulCleanPPT(data: PortfolioData, userProfile?: any): Promise<ColorfulCleanPPTData> {

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    const userName = userProfile?.name || data.userInfo.name || '이름 없음';
    const userEmail = userProfile?.email || data.userInfo.email || '';
    const userPhone = userProfile?.phone || data.userInfo.phone || '';
    const userPosition = userProfile?.position || data.userInfo.title || '직무 없음';

    const prompt = `
당신은 포트폴리오 데이터를 PPT에 최적화된 형식으로 변환하는 전문가입니다.

=== 입력 데이터 ===
이름: ${userName}
직무: ${userPosition}
자기소개: ${data.userInfo.summary || '자기소개 없음'}
이메일: ${userEmail}
전화번호: ${userPhone}
웹사이트: ${data.userInfo.website || data.userInfo.github || userProfile?.github_url || ''}

스킬: ${data.skills.length > 0 ? data.skills.map(s => s.category + ': ' + s.items.join(', ')).join(' | ') : '스킬 정보 없음'}

프로젝트:
${data.projects.length > 0 ? data.projects.slice(0, 2).map((p, i) => `${i + 1}. ${p.name || '프로젝트명 없음'}
   - 설명: ${p.description || '설명 없음'}
   - 주요 성과: ${p.highlights && p.highlights.length > 0 ? p.highlights.join(', ') : '성과 정보 없음'}
   - 기술: ${p.technologies && p.technologies.length > 0 ? p.technologies.join(', ') : '기술 정보 없음'}`).join('\n') : '프로젝트 정보 없음'}

경력:
${data.experiences.length > 0 ? data.experiences.map((e, i) => `${i + 1}. ${e.company || '회사명 없음'} - ${e.position || '직무 없음'}
   - 기간: ${e.startDate || '시작일 미정'} ~ ${e.endDate || '현재'}
   - 주요 성과: ${e.achievements && e.achievements.length > 0 ? e.achievements.join(', ') : '성과 정보 없음'}`).join('\n') : '경력 정보 없음'}

교육:
${data.education.length > 0 ? data.education.map((e, i) => `${i + 1}. ${e.institution || e.school || '학교명 없음'} - ${e.degree || '학위 없음'}`).join('\n') : '교육 정보 없음'}

=== 요구사항 ===
위 데이터를 아래 JSON 형식으로 변환하세요:

{
  "cover": {
    "name": "이름",
    "position": "지원 직무",
    "one_liner": "핵심 가치/전문성 7~10단어 한줄 소개",
    "company": "지원 회사 (없으면 빈 문자열)",
    "phone": "전화번호",
    "email": "이메일"
  },
  "about": {
    "summary": "전문 분야/관심 분야/일하는 방식 2~3문장 요약",
    "strength_1": "강점 1 (예: 문제 해결 중심)",
    "strength_2": "강점 2 (예: 커뮤니케이션/리더십)",
    "strength_3": "강점 3 (예: 실행력/데이터 기반)",
    "years": "경력 연차 (예: 5년)",
    "location": "지역 (예: 서울)",
    "work_type": "희망 근무형태 (예: 하이브리드)"
  },
  "skills": {
    "tools": ["Figma", "Python", "SQL", "Notion", "추가도구"],
    "competency_1": "문제 정의·우선순위 설정 한 줄",
    "competency_2": "데이터 기반 의사결정 한 줄",
    "competency_3": "협업·커뮤니케이션 한 줄",
    "competency_4": "실행력·품질 관리 한 줄"
  },
  "project_1": {
    "name": "프로젝트명",
    "period": "YYYY.MM–YYYY.MM",
    "background": "해결하려는 문제와 목표 1~2문장",
    "role_1": "키워드 1 (예: PM)",
    "role_2": "키워드 2 (예: 리서치)",
    "role_3": "키워드 3 (예: 설계)",
    "achievement_1": "주요 성과 1 (예: 전환율 +18%)",
    "achievement_2": "주요 성과 2 (예: 이탈 -12%)",
    "tech_tags": ["React", "Figma", "GA"]
  },
  "project_2": {
    "name": "프로젝트명",
    "period": "YYYY.MM–YYYY.MM",
    "background": "문제 정의와 목표 1~2문장",
    "role_1": "키워드 1",
    "role_2": "키워드 2",
    "role_3": "키워드 3",
    "achievement_1": "성과 1",
    "achievement_2": "성과 2",
    "tech_tags": ["Python", "Airflow", "BigQuery"]
  },
  "experience": [
    {
      "company": "회사명",
      "position": "직책",
      "period": "YYYY.MM - YYYY.MM",
      "achievement": "핵심 성과 1줄"
    }
  ],
  "education": {
    "school": "학교명",
    "major": "전공/학위",
    "period": "YYYY.MM - YYYY.MM",
    "achievement": "주요 활동/성과"
  },
  "certifications": ["자격/수상명 — 기관/연도"],
  "contact": {
    "email": "이메일",
    "phone": "전화번호",
    "portfolio_link": "포트폴리오/깃허브 URL",
    "name": "이름",
    "position": "직무",
    "closing_message": "한 줄 인사말/핵심 가치 6~10단어"
  }
}

**중요**:
- 날짜는 YYYY.MM 형식으로 통일
- 성과는 구체적인 수치나 결과 포함
- tools는 최대 5개
- tech_tags는 최대 3개
`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a PPT portfolio optimizer. Respond only with valid JSON. 한국어로 작성하세요." },
          { role: "user", content: prompt }
        ],
        max_tokens: 3000,
      });

      let content = response.choices[0].message?.content || "{}";

      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const result = JSON.parse(content);

      // AI가 예시 값을 그대로 사용하는 경우를 방지하기 위해 실제 사용자 정보로 덮어쓰기
      if (result.cover) {
        result.cover.name = userName;
        result.cover.position = userPosition || result.cover.position;
      }
      if (result.contact) {
        result.contact.email = userEmail;
        result.contact.phone = userPhone;
        result.contact.portfolio_link = data.userInfo.website || userProfile?.github_url || result.contact.portfolio_link;
      }

      return result;
    } catch (error) {
      // Fallback 데이터 반환
      return this.getColorfulCleanFallbackData(data, userProfile, userName, userEmail, userPhone, userPosition);
    }
  }

  private getColorfulCleanFallbackData(data: PortfolioData, userProfile: any, userName: string, userEmail: string, userPhone: string, userPosition: string): ColorfulCleanPPTData {
    return {
      cover: {
        name: userName,
        position: userPosition,
        one_liner: data.userInfo.summary?.substring(0, 50) || '열정적인 전문가',
        company: userProfile?.company || '',
        phone: userPhone,
        email: userEmail,
      },
      about: {
        summary: data.userInfo.summary || '자기소개를 입력해주세요.',
        strength_1: '문제 해결',
        strength_2: '커뮤니케이션',
        strength_3: '실행력',
        years: '경력 N년',
        location: '서울',
        work_type: '하이브리드',
      },
      skills: {
        tools: data.skills.slice(0, 5).map(s => s.items[0] || s.category).slice(0, 5),
        competency_1: '문제 정의 및 우선순위 설정',
        competency_2: '데이터 기반 의사결정',
        competency_3: '효과적인 협업과 커뮤니케이션',
        competency_4: '높은 실행력과 품질 관리',
      },
      project_1: {
        name: data.projects[0]?.name || '프로젝트 1',
        period: data.projects[0]?.date || '2024.01–2024.12',
        background: data.projects[0]?.description || '프로젝트 설명',
        role_1: 'PM',
        role_2: '개발',
        role_3: '설계',
        achievement_1: data.projects[0]?.highlights?.[0] || '성과 1',
        achievement_2: data.projects[0]?.highlights?.[1] || '성과 2',
        tech_tags: data.projects[0]?.technologies?.slice(0, 3) || ['기술1', '기술2', '기술3'],
      },
      project_2: {
        name: data.projects[1]?.name || '프로젝트 2',
        period: data.projects[1]?.date || '2024.01–2024.12',
        background: data.projects[1]?.description || '프로젝트 설명',
        role_1: '백엔드',
        role_2: 'ETL',
        role_3: '모니터링',
        achievement_1: data.projects[1]?.highlights?.[0] || '성과 1',
        achievement_2: data.projects[1]?.highlights?.[1] || '성과 2',
        tech_tags: data.projects[1]?.technologies?.slice(0, 3) || ['기술1', '기술2', '기술3'],
      },
      experience: data.experiences.slice(0, 2).map(e => ({
        company: e.company || '회사명',
        position: e.position || '직무',
        period: `${e.startDate || '2023.01'} - ${e.endDate || '현재'}`,
        achievement: e.achievements?.[0] || '주요 성과',
      })),
      education: {
        school: data.education[0]?.institution || data.education[0]?.school || '학교명',
        major: data.education[0]?.degree || '전공',
        period: `${data.education[0]?.startDate || '2020.03'} - ${data.education[0]?.endDate || '2024.02'}`,
        achievement: '학업 우수',
      },
      certifications: ['자격증 — 기관/연도'],
      contact: {
        email: userEmail,
        phone: userPhone,
        portfolio_link: data.userInfo.website || userProfile?.github_url || 'https://github.com',
        name: userName,
        position: userPosition,
        closing_message: '함께 성장하고 싶습니다',
      },
    };
  }

  /**
   * Colorful Clean 템플릿 PPT 생성
   */
  async generateColorfulCleanPPT(data: PortfolioData, templatePath: string, userProfile?: any): Promise<Blob> {

    const response = await fetch(templatePath);
    const templateBuffer = await response.arrayBuffer();
    const zip = new PizZip(templateBuffer);

    const pptData = await this.optimizeForColorfulCleanPPT(data, userProfile);

    // Slide 1: 표지
    let slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';
    slide1 = this.replaceTextInXML(slide1, '[이름]', this.truncateText(pptData.cover.name, 20));
    slide1 = this.replaceTextInXML(slide1, '[지원 직무]', this.truncateText(pptData.cover.position, 25));
    slide1 = this.replaceTextInXML(slide1, '[한 줄 소개 — 핵심 가치·전문성 7~10단어]', this.truncateText(pptData.cover.one_liner, 50));
    slide1 = this.replaceTextInXML(slide1, '[지원 회사]', this.truncateText(pptData.cover.company, 30));
    slide1 = this.replaceTextInXML(slide1, '[010-0000-0000]', this.truncateText(pptData.cover.phone, 15));
    slide1 = this.replaceTextInXML(slide1, '[email@domain.com]', this.truncateText(pptData.cover.email, 35));
    zip.file('ppt/slides/slide1.xml', slide1);

    // Slide 2: 자기소개
    let slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
    slide2 = this.replaceTextInXML(slide2, '[전문 분야/관심 분야/일하는 방식 2~3문장 요약]', this.truncateText(pptData.about.summary, 120));
    slide2 = this.replaceTextInXML(slide2, '강점 1 [예: 문제 해결 중심]', this.truncateText(pptData.about.strength_1, 25));
    slide2 = this.replaceTextInXML(slide2, '강점 2 [예: 커뮤니케이션/리더십]', this.truncateText(pptData.about.strength_2, 25));
    slide2 = this.replaceTextInXML(slide2, '강점 3 [예: 실행력/데이터 기반]', this.truncateText(pptData.about.strength_3, 25));
    slide2 = this.replaceTextInXML(slide2, '예: 경력연차 5년', this.truncateText(pptData.about.years, 15));
    slide2 = this.replaceTextInXML(slide2, '예: 서울', this.truncateText(pptData.about.location, 10));
    slide2 = this.replaceTextInXML(slide2, '예: 하이브리드', this.truncateText(pptData.about.work_type, 15));
    zip.file('ppt/slides/slide2.xml', slide2);

    // Slide 3: 핵심 역량
    let slide3 = zip.file('ppt/slides/slide3.xml')?.asText() || '';
    const tools = pptData.skills.tools;
    if (tools[0]) slide3 = this.replaceTextInXML(slide3, '[Figma]', this.truncateText(tools[0], 15));
    if (tools[1]) slide3 = this.replaceTextInXML(slide3, '[Python]', this.truncateText(tools[1], 15));
    if (tools[2]) slide3 = this.replaceTextInXML(slide3, '[SQL]', this.truncateText(tools[2], 15));
    if (tools[3]) slide3 = this.replaceTextInXML(slide3, '[Notion]', this.truncateText(tools[3], 15));
    if (tools[4]) slide3 = this.replaceTextInXML(slide3, '[선택 도구]', this.truncateText(tools[4], 15));
    slide3 = this.replaceTextInXML(slide3, '[문제 정의·우선순위 설정 한 줄]', this.truncateText(pptData.skills.competency_1, 40));
    slide3 = this.replaceTextInXML(slide3, '[데이터 기반 의사결정 한 줄]', this.truncateText(pptData.skills.competency_2, 40));
    slide3 = this.replaceTextInXML(slide3, '[협업·커뮤니케이션 한 줄]', this.truncateText(pptData.skills.competency_3, 40));
    slide3 = this.replaceTextInXML(slide3, '[실행력·품질 관리 한 줄]', this.truncateText(pptData.skills.competency_4, 40));
    zip.file('ppt/slides/slide3.xml', slide3);

    // Slide 4: 프로젝트 1
    let slide4 = zip.file('ppt/slides/slide4.xml')?.asText() || '';
    slide4 = this.replaceTextInXML(slide4, '[프로젝트명]', this.truncateText(pptData.project_1.name, 35));
    slide4 = this.replaceTextInXML(slide4, '기간 [YYYY.MM–YYYY.MM]', this.truncateText(pptData.project_1.period, 25));
    slide4 = this.replaceTextInXML(slide4, '[해결하려는 문제와 목표를 1~2문장으로 요약]', this.truncateText(pptData.project_1.background, 80));
    slide4 = this.replaceTextInXML(slide4, '[키워드 1 — 예: PM]', this.truncateText(pptData.project_1.role_1, 15));
    slide4 = this.replaceTextInXML(slide4, '[키워드 2 — 예: 리서치]', this.truncateText(pptData.project_1.role_2, 15));
    slide4 = this.replaceTextInXML(slide4, '[키워드 3 — 예: 설계]', this.truncateText(pptData.project_1.role_3, 15));
    slide4 = this.replaceTextInXML(slide4, '[주요 성과 1 — 예: 전환율 +18%]', this.truncateText(pptData.project_1.achievement_1, 25));
    slide4 = this.replaceTextInXML(slide4, '[주요 성과 2 — 예: 이탈 -12%]', this.truncateText(pptData.project_1.achievement_2, 25));
    const tech1 = pptData.project_1.tech_tags;
    if (tech1[0]) slide4 = this.replaceTextInXML(slide4, '[예: React]', this.truncateText(tech1[0], 15));
    if (tech1[1]) slide4 = this.replaceTextInXML(slide4, '[예: Figma]', this.truncateText(tech1[1], 15));
    if (tech1[2]) slide4 = this.replaceTextInXML(slide4, '[예: GA]', this.truncateText(tech1[2], 15));
    zip.file('ppt/slides/slide4.xml', slide4);

    // Slide 5: 프로젝트 2
    let slide5 = zip.file('ppt/slides/slide5.xml')?.asText() || '';
    slide5 = this.replaceTextInXML(slide5, '[프로젝트명] / [기간 — 예: 2023.07–2023.12]', this.truncateText(`${pptData.project_2.name} / ${pptData.project_2.period}`, 50));
    slide5 = this.replaceTextInXML(slide5, '[문제 정의와 목표를 1~2문장으로 요약 — 예: 데이터 파이프라인 병목을 해소하여 처리 안정성과 속도 개선]', this.truncateText(pptData.project_2.background, 80));
    slide5 = this.replaceTextInXML(slide5, '[키워드 1 — 예: 백엔드]', this.truncateText(pptData.project_2.role_1, 15));
    slide5 = this.replaceTextInXML(slide5, '[키워드 2 — 예: ETL]', this.truncateText(pptData.project_2.role_2, 15));
    slide5 = this.replaceTextInXML(slide5, '[키워드 3 — 예: 모니터링]', this.truncateText(pptData.project_2.role_3, 15));
    slide5 = this.replaceTextInXML(slide5, '[예: 처리시간 -35%]', this.truncateText(pptData.project_2.achievement_1, 20));
    slide5 = this.replaceTextInXML(slide5, '[예: 오류율 -90%]', this.truncateText(pptData.project_2.achievement_2, 20));
    const tech2 = pptData.project_2.tech_tags;
    if (tech2[0]) slide5 = this.replaceTextInXML(slide5, '[예: Python]', this.truncateText(tech2[0], 15));
    if (tech2[1]) slide5 = this.replaceTextInXML(slide5, '[예: Airflow]', this.truncateText(tech2[1], 15));
    if (tech2[2]) slide5 = this.replaceTextInXML(slide5, '[예: BigQuery]', this.truncateText(tech2[2], 15));
    zip.file('ppt/slides/slide5.xml', slide5);

    // Slide 6: 경력·학력
    let slide6 = zip.file('ppt/slides/slide6.xml')?.asText() || '';
    // 경력 교체
    for (let i = 0; i < Math.min(2, pptData.experience.length); i++) {
      const exp = pptData.experience[i];
      slide6 = slide6.replace(
        '<a:t>[회사명] · [직책]</a:t>',
        `<a:t>${this.escapeXML(exp.company)} · ${this.escapeXML(exp.position)}</a:t>`
      );
      slide6 = slide6.replace(
        '<a:t>[기간]</a:t>',
        `<a:t>${this.escapeXML(exp.period)}</a:t>`
      );
      slide6 = slide6.replace(
        '<a:t>[핵심 성과 1줄 — 예: 매출 +15% 달성]</a:t>',
        `<a:t>${this.escapeXML(exp.achievement)}</a:t>`
      );
      slide6 = slide6.replace(
        '<a:t>[핵심 성과 1줄 — 예: 프로세스 리드타임 -30%]</a:t>',
        `<a:t>${this.escapeXML(exp.achievement)}</a:t>`
      );
    }
    // 학력 교체
    slide6 = this.replaceTextInXML(slide6, '[학교] · [전공] / [학위]', `${pptData.education.school} · ${pptData.education.major}`);
    slide6 = this.replaceTextInXML(slide6, '[주요 성과/활동 1줄 — 예: 캡스톤 우수]', pptData.education.achievement);
    // 자격증
    if (pptData.certifications[0]) {
      slide6 = this.replaceTextInXML(slide6, '[자격/수상명] — [기관/연도]', pptData.certifications[0]);
    }
    if (pptData.certifications[1]) {
      slide6 = this.replaceTextInXML(slide6, '예: 정보처리기사 — 한국산업인력공단/2023', pptData.certifications[1]);
    }
    zip.file('ppt/slides/slide6.xml', slide6);

    // Slide 7: 연락처
    let slide7 = zip.file('ppt/slides/slide7.xml')?.asText() || '';
    slide7 = this.replaceTextInXML(slide7, '[email@domain.com]', pptData.contact.email);
    slide7 = this.replaceTextInXML(slide7, '[010-0000-0000]', pptData.contact.phone);
    slide7 = this.replaceTextInXML(slide7, '[포트폴리오/깃허브/링크드인 URL]', pptData.contact.portfolio_link);
    slide7 = this.replaceTextInXML(slide7, '[이름] · [직무]', `${pptData.contact.name} · ${pptData.contact.position}`);
    slide7 = this.replaceTextInXML(slide7, '[한 줄 인사말/핵심 가치 6~10단어]', pptData.contact.closing_message);
    zip.file('ppt/slides/slide7.xml', slide7);

    const blob = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    return blob;
  }

  /**
   * Impact Focused 템플릿용 LLM 최적화
   */
  async optimizeForImpactFocusedPPT(data: PortfolioData, userProfile?: any): Promise<ImpactFocusedPPTData> {

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    const userName = userProfile?.name || data.userInfo.name || '이름 없음';
    const userEmail = userProfile?.email || data.userInfo.email || '';
    const userPhone = userProfile?.phone || data.userInfo.phone || '';
    const userPosition = userProfile?.position || data.userInfo.title || '직무 없음';

    const prompt = `
당신은 포트폴리오 데이터를 KPI 중심의 임팩트 있는 PPT 형식으로 변환하는 전문가입니다.

=== 입력 데이터 ===
이름: ${userName}
직무: ${userPosition}
자기소개: ${data.userInfo.summary || '자기소개 없음'}
이메일: ${userEmail}
전화번호: ${userPhone}
웹사이트: ${data.userInfo.website || data.userInfo.github || userProfile?.github_url || ''}

스킬: ${data.skills.length > 0 ? data.skills.map(s => s.category + ': ' + s.items.join(', ')).join(' | ') : '스킬 정보 없음'}

프로젝트:
${data.projects.length > 0 ? data.projects.slice(0, 2).map((p, i) => `${i + 1}. ${p.name || '프로젝트명 없음'}
   - 설명: ${p.description || '설명 없음'}
   - 주요 성과: ${p.highlights && p.highlights.length > 0 ? p.highlights.join(', ') : '성과 정보 없음'}
   - 기술: ${p.technologies && p.technologies.length > 0 ? p.technologies.join(', ') : '기술 정보 없음'}`).join('\n') : '프로젝트 정보 없음'}

경력:
${data.experiences.length > 0 ? data.experiences.map((e, i) => `${i + 1}. ${e.company || '회사명 없음'} - ${e.position || '직무 없음'}
   - 기간: ${e.startDate || '시작일 미정'} ~ ${e.endDate || '현재'}
   - 주요 성과: ${e.achievements && e.achievements.length > 0 ? e.achievements.join(', ') : '성과 정보 없음'}`).join('\n') : '경력 정보 없음'}

교육:
${data.education.length > 0 ? data.education.map((e, i) => `${i + 1}. ${e.institution || e.school || '학교명 없음'} - ${e.degree || '학위 없음'}`).join('\n') : '교육 정보 없음'}

=== 요구사항 ===
위 데이터를 아래 JSON 형식으로 변환하세요. **KPI와 수치를 최대한 구체적으로 추출/생성**하세요:

{
  "cover": {
    "name": "이름",
    "position": "직무 포지션",
    "one_liner": "핵심 가치/전문성 한 문장",
    "email": "이메일",
    "phone": "전화번호",
    "linkedin": "링크드인/포트폴리오 URL"
  },
  "profile": {
    "introduction": "성과 중심 자기소개 2-3문장",
    "strengths": ["강점1", "강점2", "강점3"],
    "domains": ["도메인1", "도메인2", "도메인3"],
    "competencies": [
      {"name": "역량명1", "evidence": "근거/사례: 예) 속도 30% 향상"},
      {"name": "역량명2", "evidence": "근거/사례: 예) KPI 달성"},
      {"name": "역량명3", "evidence": "근거/사례: 예) 크로스팀 협업"},
      {"name": "역량명4", "evidence": "근거/사례: 예) 자동화/효율화"},
      {"name": "역량명5", "evidence": "근거/사례"}
    ]
  },
  "timeline": [
    {"period": "YYYY.MM–현재", "company": "회사명", "position": "직무", "impact": "주요 임팩트: 예) 전환율 +18%"}
  ],
  "summary_metrics": [
    {"metric_name": "지표명", "value": "값", "comparison": "기간/비교"}
  ],
  "impact_cases": ["사례 요약 1", "사례 요약 2"],
  "domains": ["도메인1", "도메인2", "도메인3"],
  "project_1": {
    "name": "프로젝트명",
    "period": "YYYY.MM–YYYY.MM",
    "role": "PM/개발/디자인",
    "team_size": "N명",
    "problem": "현재 문제 요약",
    "goal": "정량 목표: 예) 전환율 +15%",
    "actions": ["핵심 액션 1", "핵심 액션 2", "핵심 액션 3"],
    "kpis": [
      {"name": "전환율", "value": "+XX%", "comparison": "전/후 비교"},
      {"name": "리드타임", "value": "-YY%", "comparison": "전/후 비교"},
      {"name": "매출", "value": "+ZZ%", "comparison": "기간"}
    ],
    "tech_stack": ["언어/프레임워크", "플랫폼/툴", "데이터/인프라"]
  },
  "project_2": {
    "name": "프로젝트명",
    "period": "YYYY.MM–YYYY.MM",
    "role": "역할",
    "team_size": "N명",
    "problem": "핵심 문제 요약",
    "goal": "목표",
    "actions": ["핵심 액션 1", "핵심 액션 2", "핵심 액션 3"],
    "kpis": [
      {"name": "전환율", "value": "+%", "comparison": "전/후"},
      {"name": "이탈률", "value": "-%", "comparison": "전/후"},
      {"name": "리드타임", "value": "-%", "comparison": "기간"}
    ],
    "tech_stack": ["스택1", "스택2", "스택3", "스택4"]
  },
  "kpi_metrics": [
    {"metric_name": "지표명", "value": "값", "comparison": "기간/비교"}
  ],
  "impact_summaries": ["임팩트 사례 1", "임팩트 사례 2"],
  "certifications": ["수상/인증, 연도"],
  "skills": {
    "languages": ["언어1", "언어2", "언어3"],
    "frameworks": ["프레임워크1", "프레임워크2", "라이브러리1"],
    "tools": ["도구1", "도구2", "플랫폼1"]
  },
  "certifications_detail": [
    {"name": "자격증명", "org": "기관", "year": "연도", "description": "역량 연계"}
  ],
  "contact": {
    "email": "이메일",
    "phone": "전화번호",
    "portfolio_link": "포트폴리오 URL",
    "work_type": "정규직/하이브리드",
    "location": "서울/원격",
    "available_date": "YYYY.MM.DD",
    "value_statement": "협업 가치관 한 줄"
  }
}

**중요**: 모든 성과는 구체적인 수치(%, 시간, 비용 등)를 포함하세요. 수치가 없으면 합리적으로 추정하세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a PPT portfolio optimizer focusing on KPIs and metrics. Respond only with valid JSON. 한국어로 작성하세요." },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
      });

      let content = response.choices[0].message?.content || "{}";

      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const result = JSON.parse(content);

      // AI가 예시 값을 그대로 사용하는 경우를 방지하기 위해 실제 사용자 정보로 덮어쓰기
      if (result.cover) {
        result.cover.name = userName;
        result.cover.email = userEmail;
        result.cover.phone = userPhone;
        result.cover.position = userPosition || result.cover.position;
        result.cover.linkedin = data.userInfo.website || data.userInfo.github || userProfile?.github_url || result.cover.linkedin;
      }
      if (result.contact) {
        result.contact.email = userEmail;
        result.contact.phone = userPhone;
        result.contact.portfolio_link = data.userInfo.website || userProfile?.github_url || result.contact.portfolio_link;
      }

      return result;
    } catch (error) {
      return this.getImpactFocusedFallbackData(data, userProfile, userName, userEmail, userPhone, userPosition);
    }
  }

  private getImpactFocusedFallbackData(data: PortfolioData, userProfile: any, userName: string, userEmail: string, userPhone: string, userPosition: string): ImpactFocusedPPTData {
    return {
      cover: {
        name: userName,
        position: userPosition,
        one_liner: data.userInfo.summary?.substring(0, 50) || '성과 중심의 전문가',
        email: userEmail,
        phone: userPhone,
        linkedin: data.userInfo.website || userProfile?.github_url || 'https://linkedin.com',
      },
      profile: {
        introduction: data.userInfo.summary || '성과 중심 자기소개를 입력해주세요.',
        strengths: ['문제 해결', '데이터 분석', '팀 협업'],
        domains: ['IT', '서비스', '스타트업'],
        competencies: [
          { name: '문제 해결', evidence: '프로젝트 성공률 향상' },
          { name: '데이터 분석', evidence: 'KPI 기반 의사결정' },
          { name: '팀 협업', evidence: '크로스팀 프로젝트 리드' },
          { name: '자동화', evidence: '업무 효율화 달성' },
          { name: '품질 관리', evidence: '오류율 감소' },
        ],
      },
      timeline: data.experiences.slice(0, 4).map(e => ({
        period: `${e.startDate || '2023.01'}–${e.endDate || '현재'}`,
        company: e.company || '회사명',
        position: e.position || '직무',
        impact: e.achievements?.[0] || '주요 성과',
      })),
      summary_metrics: [
        { metric_name: '프로젝트', value: `${data.projects.length}건`, comparison: '총 수행' },
        { metric_name: '경력', value: `${data.experiences.length}개사`, comparison: '근무 이력' },
        { metric_name: '기술스택', value: `${data.skills.reduce((acc, s) => acc + s.items.length, 0)}개`, comparison: '보유 스킬' },
      ],
      impact_cases: ['주요 프로젝트 성공적 완료', '팀 생산성 향상 기여'],
      domains: ['IT', '서비스', '스타트업'],
      project_1: {
        name: data.projects[0]?.name || '프로젝트 1',
        period: data.projects[0]?.date || '2024.01–2024.12',
        role: 'PM/개발',
        team_size: '5명',
        problem: '기존 프로세스의 비효율성',
        goal: '효율성 향상 및 품질 개선',
        actions: ['문제 분석', '솔루션 설계', '구현 및 테스트'],
        kpis: [
          { name: '효율성', value: '+20%', comparison: '전/후' },
          { name: '품질', value: '+15%', comparison: '전/후' },
          { name: '만족도', value: '+10%', comparison: '전/후' },
        ],
        tech_stack: data.projects[0]?.technologies?.slice(0, 3) || ['기술1', '기술2', '기술3'],
      },
      project_2: {
        name: data.projects[1]?.name || '프로젝트 2',
        period: data.projects[1]?.date || '2024.01–2024.12',
        role: '개발자',
        team_size: '3명',
        problem: '시스템 성능 이슈',
        goal: '성능 최적화',
        actions: ['분석', '최적화', '모니터링'],
        kpis: [
          { name: '성능', value: '+30%', comparison: '전/후' },
          { name: '안정성', value: '+25%', comparison: '전/후' },
          { name: '비용', value: '-20%', comparison: '전/후' },
        ],
        tech_stack: data.projects[1]?.technologies?.slice(0, 4) || ['스택1', '스택2', '스택3', '스택4'],
      },
      kpi_metrics: [
        { metric_name: '생산성', value: '+25%', comparison: '연간' },
        { metric_name: '품질', value: '+20%', comparison: '연간' },
        { metric_name: '효율성', value: '+30%', comparison: '연간' },
        { metric_name: '만족도', value: '+15%', comparison: '연간' },
      ],
      impact_summaries: ['핵심 기능 개선으로 사용자 경험 향상', '프로세스 자동화로 업무 효율화'],
      certifications: ['관련 자격증, 2024'],
      skills: {
        languages: data.skills[0]?.items.slice(0, 3) || ['JavaScript', 'Python', 'TypeScript'],
        frameworks: data.skills[1]?.items.slice(0, 3) || ['React', 'Node.js', 'Django'],
        tools: data.skills[2]?.items.slice(0, 3) || ['Git', 'Docker', 'AWS'],
      },
      certifications_detail: [
        { name: '자격증', org: '기관', year: '2024', description: '역량 증명' },
      ],
      contact: {
        email: userEmail,
        phone: userPhone,
        portfolio_link: data.userInfo.website || userProfile?.github_url || 'https://portfolio.com',
        work_type: '정규직',
        location: '서울',
        available_date: '즉시 가능',
        value_statement: '데이터로 합의하고, 빠르게 실행하며, 끝까지 책임집니다.',
      },
    };
  }

  /**
   * Impact Focused 템플릿 PPT 생성 (새 템플릿 구조)
   */
  async generateImpactFocusedPPT(data: PortfolioData, templatePath: string, userProfile?: any): Promise<Blob> {

    const response = await fetch(templatePath);
    const templateBuffer = await response.arrayBuffer();
    const zip = new PizZip(templateBuffer);

    const pptData = await this.optimizeForImpactFocusedPPT(data, userProfile);

    // Slide 1: 표지
    let slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';
    slide1 = this.replaceTextInXML(slide1, '[이름]', this.truncateText(pptData.cover.name, 20));
    slide1 = this.replaceTextInXML(slide1, '[지원 직무/포지션]', this.truncateText(pptData.cover.position, 25));
    slide1 = this.replaceTextInXML(slide1, '[한 줄 소개: 나를 가장 잘 드러내는 문장]', this.truncateText(pptData.cover.one_liner, 60));
    slide1 = this.replaceTextInXML(slide1, '[이메일]', this.truncateText(pptData.cover.email, 35));
    slide1 = this.replaceTextInXML(slide1, '[전화번호]', this.truncateText(pptData.cover.phone, 15));
    slide1 = this.replaceTextInXML(slide1, '[GitHub / Blog / LinkedIn]', this.truncateText(pptData.cover.linkedin, 40));
    zip.file('ppt/slides/slide1.xml', slide1);

    // Slide 2: 자기소개
    let slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
    slide2 = this.replaceTextInXML(slide2, '[한 줄 소개: 나를 가장 잘 드러내는 문장]', this.truncateText(pptData.profile.introduction, 100));
    for (let i = 0; i < 3; i++) {
      if (pptData.profile.strengths[i]) {
        slide2 = this.replaceTextInXML(slide2, '[강점 키워드]', this.truncateText(pptData.profile.strengths[i], 20));
        slide2 = this.replaceTextInXML(slide2, '[간단 근거 1줄]', this.truncateText(pptData.profile.competencies[i]?.evidence || '', 40));
      }
      if (pptData.profile.domains[i]) {
        slide2 = this.replaceTextInXML(slide2, `[키워드 ${i + 1}]`, this.truncateText(pptData.profile.domains[i], 15));
      }
    }
    zip.file('ppt/slides/slide2.xml', slide2);

    // Slide 3: 기술 스택
    let slide3 = zip.file('ppt/slides/slide3.xml')?.asText() || '';
    slide3 = this.replaceTextInXML(slide3, '[중요 기술 위주로 간결하게 입력하고, 필요 없는 항목은 삭제하세요]', '');
    for (let i = 0; i < 3; i++) {
      if (pptData.skills.languages[i]) {
        slide3 = this.replaceTextInXML(slide3, `[언어 ${i + 1}]`, pptData.skills.languages[i]);
      }
    }
    for (let i = 0; i < 2; i++) {
      if (pptData.skills.frameworks[i]) {
        slide3 = this.replaceTextInXML(slide3, `[프레임워크 ${i + 1}]`, pptData.skills.frameworks[i]);
      }
    }
    if (pptData.skills.frameworks[2]) {
      slide3 = this.replaceTextInXML(slide3, '[라이브러리 1]', pptData.skills.frameworks[2]);
    }
    for (let i = 0; i < 5; i++) {
      const techIndex = i + 1;
      if (pptData.skills.tools[i]) {
        slide3 = this.replaceTextInXML(slide3, `[기술 ${techIndex}]`, pptData.skills.tools[i]);
      }
    }
    for (let i = 0; i < 2; i++) {
      if (pptData.skills.tools[i]) {
        slide3 = this.replaceTextInXML(slide3, `[툴 ${i + 1}]`, pptData.skills.tools[i]);
      }
    }
    if (pptData.skills.tools[2]) {
      slide3 = this.replaceTextInXML(slide3, '[플랫폼 1]', pptData.skills.tools[2]);
    }
    zip.file('ppt/slides/slide3.xml', slide3);

    // Slide 4-6: 프로젝트 1, 2, 3
    const projects = [pptData.project_1, pptData.project_2];
    for (let projIdx = 0; projIdx < 3; projIdx++) {
      const slideNum = projIdx + 4;
      let slideContent = zip.file(`ppt/slides/slide${slideNum}.xml`)?.asText() || '';
      const project = projects[projIdx] || projects[0]; // fallback to first project

      slideContent = this.replaceTextInXML(slideContent, '[프로젝트명]', this.truncateText(project.name, 35));
      slideContent = this.replaceTextInXML(slideContent, '[한 줄 요약]', this.truncateText(project.problem, 60));
      slideContent = this.replaceTextInXML(slideContent, '[기간: YYYY.MM ~ YYYY.MM]', this.truncateText(project.period, 25));
      slideContent = this.replaceTextInXML(slideContent, '[담당 역할]', this.truncateText(project.role, 20));

      // 성과
      for (let i = 0; i < 3; i++) {
        if (project.actions[i]) {
          slideContent = this.replaceTextInXML(slideContent, `[성과 ${i + 1}: 수치/결과 중심]`, this.truncateText(project.actions[i], 50));
        }
      }

      // 기술
      for (let i = 0; i < 3; i++) {
        if (project.tech_stack[i]) {
          slideContent = this.replaceTextInXML(slideContent, `[Tech ${i + 1}]`, this.truncateText(project.tech_stack[i], 15));
        }
      }

      // 링크
      slideContent = this.replaceTextInXML(slideContent, '[배포 링크]', pptData.contact.portfolio_link);
      slideContent = this.replaceTextInXML(slideContent, '[코드 저장소]', pptData.cover.linkedin);

      zip.file(`ppt/slides/slide${slideNum}.xml`, slideContent);
    }

    // Slide 7: 경력/수상/자격증
    let slide7 = zip.file('ppt/slides/slide7.xml')?.asText() || '';
    if (pptData.timeline[0]) {
      const exp = pptData.timeline[0];
      slide7 = this.replaceTextInXML(slide7, '[기간: YYYY.MM ~ YYYY.MM] [회사/기관] | ', `${exp.period} ${exp.company} | `);
      slide7 = this.replaceTextInXML(slide7, '[직무] [담당 업무: 핵심 업무 1~2가지] ', `${exp.position} ${exp.impact}`);
      slide7 = this.replaceTextInXML(slide7, '[주요 성과: 수치/결과 중심]', exp.impact);
    }
    if (pptData.certifications[0]) {
      slide7 = this.replaceTextInXML(slide7, '[상 이름] — [기관] · [연도] · [성과/역할]', pptData.certifications[0]);
    }
    if (pptData.certifications_detail[0]) {
      const cert = pptData.certifications_detail[0];
      slide7 = this.replaceTextInXML(slide7, '[자격증 명] — [발급기관] · [취득일]', `${cert.name} — ${cert.org} · ${cert.year}`);
    }
    slide7 = this.replaceTextInXML(slide7, '[추천 코멘트/피드백를 한 문장으로 입력]', pptData.contact.value_statement);
    slide7 = this.replaceTextInXML(slide7, '[추천인/직함]', '동료/상사');
    zip.file('ppt/slides/slide7.xml', slide7);

    // Slide 8: 연락처
    let slide8 = zip.file('ppt/slides/slide8.xml')?.asText() || '';
    slide8 = this.replaceTextInXML(slide8, '[이름]', pptData.cover.name);
    slide8 = this.replaceTextInXML(slide8, '[이메일]', pptData.contact.email);
    slide8 = this.replaceTextInXML(slide8, '[전화]', pptData.contact.phone);
    slide8 = this.replaceTextInXML(slide8, '[GitHub 링크]', pptData.cover.linkedin);
    slide8 = this.replaceTextInXML(slide8, '[LinkedIn 링크]', pptData.cover.linkedin);
    slide8 = this.replaceTextInXML(slide8, '[Blog 링크]', pptData.contact.portfolio_link);
    slide8 = this.replaceTextInXML(slide8, '[감사의 말(한 문장)]', '읽어주셔서 감사합니다.');
    zip.file('ppt/slides/slide8.xml', slide8);

    const blob = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    return blob;
  }

  /**
   * PPT 파일 생성 (템플릿 ID 기반)
   */
  async generatePPT(data: PortfolioData, templatePath: string, userProfile?: any, templateId?: PPTTemplateId): Promise<Blob> {
    // 템플릿 ID로 분기
    if (templateId === 'colorful-clean' || templatePath.includes('20251116184229')) {
      return this.generateColorfulCleanPPT(data, templatePath, userProfile);
    }

    if (templateId === 'impact-focused' || templatePath.includes('20251117084121')) {
      return this.generateImpactFocusedPPT(data, templatePath, userProfile);
    }

    if (templateId === 'pm' || templatePath.includes('20251116201457')) {
      return this.generatePMPPT(data, templatePath, userProfile);
    }

    // 기존 Corporate 템플릿 로직
    try {

      // 1. 템플릿 파일 로드
      const response = await fetch(templatePath);
      const templateBuffer = await response.arrayBuffer();
      const zip = new PizZip(templateBuffer);

      // 2. LLM으로 데이터 최적화
      const pptData = await this.optimizeForPPT(data, userProfile);

      // 3. Slide 1: 표지 + 연락처
      let slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';
      slide1 = this.replaceTextInXML(slide1, '[이름]', this.truncateText(pptData.cover.name, 20));
      slide1 = this.replaceTextInXML(slide1, '[직무/포지션]', this.truncateText(pptData.cover.position, 30));
      slide1 = this.replaceTextInXML(slide1, '[이메일]', this.truncateText(pptData.contact.email, 40));
      slide1 = this.replaceTextInXML(slide1, '[전화번호]', this.truncateText(pptData.contact.phone, 20));
      slide1 = this.replaceTextInXML(slide1, '[포트폴리오/웹 링크]', this.truncateText(pptData.contact.portfolio_link, 50));
      zip.file('ppt/slides/slide1.xml', slide1);

      // 4. Slide 2: 자기소개
      let slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
      slide2 = this.replaceTextInXML(slide2, '[한줄 소개]', this.truncateText(pptData.introduction.one_liner, 60));
      slide2 = this.replaceTextInXML(slide2, '[개인 소개: 주요 경력/강점/관심 분야를 3~4문장으로 작성]', this.truncateText(pptData.introduction.introduction, 200));
      slide2 = this.replaceTextInXML(slide2, '[핵심 강점 1]', this.truncateText(pptData.introduction.strength_1, 40));
      slide2 = this.replaceTextInXML(slide2, '[핵심 강점 2]', this.truncateText(pptData.introduction.strength_2, 40));
      slide2 = this.replaceTextInXML(slide2, '[핵심 강점 3]', this.truncateText(pptData.introduction.strength_3, 40));
      zip.file('ppt/slides/slide2.xml', slide2);

      // 5. Slide 3~5: 프로젝트 3개
      for (let i = 0; i < 3 && i < pptData.projects.length; i++) {
        const project = pptData.projects[i];
        const slideNum = i + 3;
        let slideXml = zip.file(`ppt/slides/slide${slideNum}.xml`)?.asText() || '';

        slideXml = this.replaceTextInXML(slideXml, '[프로젝트명]', this.truncateText(project.project_name, 40));
        slideXml = this.replaceTextInXML(slideXml, '[YYYY.MM - YYYY.MM]', this.truncateText(project.period, 25));
        slideXml = this.replaceTextInXML(slideXml, '[기간]', this.truncateText(project.period, 25));
        slideXml = this.replaceTextInXML(slideXml, '[역할]', this.truncateText(project.role, 30));
        slideXml = this.replaceTextInXML(slideXml, '[프로젝트의 목적/가치에 대한 한줄 요약]', this.truncateText(project.summary, 80));
        slideXml = this.replaceTextInXML(slideXml, '[한줄 요약]', this.truncateText(project.summary, 80));
        slideXml = this.replaceTextInXML(slideXml, '[핵심 성과 1]', this.truncateText(project.achievement_1, 60));
        slideXml = this.replaceTextInXML(slideXml, '[핵심 성과 2]', this.truncateText(project.achievement_2, 60));
        slideXml = this.replaceTextInXML(slideXml, '[핵심 성과 3]', this.truncateText(project.achievement_3, 60));

        zip.file(`ppt/slides/slide${slideNum}.xml`, slideXml);
      }

      // 6. Slide 6: 타임라인
      let slide6 = zip.file('ppt/slides/slide6.xml')?.asText() || '';
      for (let i = 0; i < 4 && i < pptData.timeline.length; i++) {
        const item = pptData.timeline[i];
        const orgText = this.truncateText(`${item.organization} · ${item.position}`, 50);

        // 순차적으로 플레이스홀더 교체
        slide6 = slide6.replace(
          '<a:t>[기관/회사] · [직무/전공]</a:t>',
          `<a:t>${this.escapeXML(orgText)}</a:t>`
        );
        slide6 = slide6.replace(
          '<a:t>[기간]</a:t>',
          `<a:t>${this.escapeXML(this.truncateText(item.period, 20))}</a:t>`
        );
        slide6 = slide6.replace(
          '<a:t>[핵심 성과/활동 1]</a:t>',
          `<a:t>${this.escapeXML(this.truncateText(item.achievement, 60))}</a:t>`
        );
      }
      zip.file('ppt/slides/slide6.xml', slide6);

      // 7. Slide 7: 연락처
      let slide7 = zip.file('ppt/slides/slide7.xml')?.asText() || '';
      slide7 = this.replaceTextInXML(slide7, '[이름]', pptData.contact.name);
      slide7 = this.replaceTextInXML(slide7, '[이메일]', pptData.contact.email);
      slide7 = this.replaceTextInXML(slide7, '[전화번호]', pptData.contact.phone);
      slide7 = this.replaceTextInXML(slide7, '[포트폴리오/웹 링크]', pptData.contact.portfolio_link);
      zip.file('ppt/slides/slide7.xml', slide7);

      // 8. ZIP을 Blob으로 변환
      const blob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      return blob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 마케팅/기획 PPT 템플릿용 데이터 최적화
   */
  async optimizeForMarketingPlanningPPT(data: PortfolioData, userProfile?: any): Promise<MarketingPlanningPPTData> {

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    const userName = userProfile?.name || data.userInfo.name || '이름 없음';
    const userEmail = userProfile?.email || data.userInfo.email || '';
    const userPhone = userProfile?.phone || data.userInfo.phone || '';
    const userPosition = userProfile?.position || data.userInfo.title || '마케터';

    const prompt = `
당신은 마케팅/기획 포트폴리오를 PPT에 최적화하는 전문가입니다.

=== 입력 데이터 ===
이름: ${userName}
직무: ${userPosition}
자기소개: ${data.userInfo.summary || ''}
이메일: ${userEmail}
전화번호: ${userPhone}
웹사이트: ${data.userInfo.website || data.userInfo.github || userProfile?.github_url || ''}

스킬: ${data.skills.length > 0 ? data.skills.map(s => s.category + ': ' + s.items.join(', ')).join(' | ') : ''}

프로젝트:
${data.projects.slice(0, 3).map((p, i) => `${i + 1}. ${p.name || ''}
   - 설명: ${p.description || ''}
   - 성과: ${p.highlights?.join(', ') || ''}`).join('\n')}

=== 출력 요구사항 ===
마케팅/기획 전문 포트폴리오에 맞게 데이터를 변환하세요.
반드시 다음 JSON 구조로 응답하세요:

{
  "cover": {
    "name": "이름",
    "position": "직무/포지션",
    "email": "이메일",
    "phone": "전화번호",
    "portfolio_link": "포트폴리오/웹 링크"
  },
  "self_intro": {
    "one_liner": "X년차 Y산업 기반 Z 마케터",
    "name": "이름",
    "title": "직함",
    "org": "조직/브랜드",
    "work_type": "근무 형태/가능 지역",
    "email": "이메일",
    "phone": "전화번호",
    "linkedin": "LinkedIn/포트폴리오 URL",
    "value_proposition": "한 문장 가치제안",
    "career_summary": "X년 · 핵심 산업/도메인 · 주요 역할",
    "core_capabilities": ["시장/고객 이해", "GTM/캠페인 기획", "퍼포먼스 최적화", "데이터 분석/대시보드"],
    "key_achievements": [
      {"label": "전환율 개선", "value": "+38%"},
      {"label": "CAC 절감", "value": "-27%"},
      {"label": "ROAS 달성", "value": "3.1x"}
    ],
    "skill_stack": ["GA4", "GTM", "SQL", "Tableau", "Figma", "Meta/Google Ads"]
  },
  "core_competencies": [
    {"name": "시장/경쟁 분석", "description": "3C·5 Forces 기반 문제 정의", "proficiency": 4},
    {"name": "고객 인사이트", "description": "페르소나·여정·리텐션 포인트", "proficiency": 5},
    {"name": "GTM/캠페인 기획", "description": "채널 믹스·메시지 전략", "proficiency": 4},
    {"name": "퍼포먼스 최적화", "description": "ROAS·CAC 중심 실험", "proficiency": 5},
    {"name": "데이터 분석/대시보드", "description": "GA4·CRM·BI 리포트", "proficiency": 4},
    {"name": "이해관계자 커뮤니케이션", "description": "정렬·협업·의사결정 지원", "proficiency": 4}
  ],
  "project_overview": [
    {
      "name": "프로젝트 A",
      "role": "역할",
      "period": "기간",
      "goal_kpi": "핵심 목표 달성\\nKPI: 지표1, 지표2",
      "tactics": "채널 믹스: Paid/Owned/Earned\\n메시지/오퍼: 핵심 키워드",
      "result": "+xx% 전환율/ROAS/CAC 개선",
      "tags": ["B2C", "App", "Paid"]
    }
  ],
  "project_detail_strategy": {
    "background": "산업/제품: 제품명 · 시장상황: 성장/정체\\n핵심 문제: 전환 저하 / CAC 상승",
    "constraints": "예산/리소스/기간",
    "goals": [
      {"label": "전환율(목표)", "value": "3.5%"},
      {"label": "CAC(목표)", "value": "30k"},
      {"label": "ROAS(목표)", "value": "3.0x"}
    ],
    "measurement_tool": "GA4/광고 플랫폼/CRM",
    "persona": "핵심 페르소나 · 주요 니즈",
    "journey_bottleneck": "도달 → 유입 → 전환 단계의 이탈 포인트",
    "retention_point": "재방문/재구매를 유도하는 가치 순간",
    "positioning": "한 문장 포지셔닝",
    "roadmap": [
      {"sprint": "Sprint 1", "period": "2주", "tasks": ["진단/데이터 점검", "KPI 확정"]},
      {"sprint": "Sprint 2", "period": "2주", "tasks": ["STP/메시지 확정", "채널 플랜"]},
      {"sprint": "Sprint 3", "period": "2주", "tasks": ["캠페인 실행", "실험 설계(A/B)"]},
      {"sprint": "Sprint 4", "period": "2주", "tasks": ["성과 평가", "리포트/확장안"]}
    ]
  },
  "project_detail_execution": {
    "channel_mix": {
      "paid": ["Meta Ads", "Google Ads", "Display"],
      "owned": ["Email/CRM", "App Push", "On-site"],
      "earned": ["PR", "Influencer", "UGC"]
    },
    "message": "USP 강조 · 사회적 증거 · 명확한 CTA",
    "budget_allocation": "Paid 60%, Owned 25%, Earned 15%",
    "experiment": {
      "hypothesis": "가치 제안 강조 시 전환율이 상승한다",
      "variants": ["랜딩 A vs B", "크리에이티브 셋", "오디언스 세그먼트"],
      "duration": "2주 · n ≥ 1000"
    },
    "results": [
      {"metric": "전환율", "before": "2.3%", "after": "3.1%"},
      {"metric": "CAC", "before": "45k", "after": "35k"},
      {"metric": "ROAS", "before": "1.9x", "after": "2.8x"}
    ],
    "learnings": ["고효율 채널과 크리에이티브 패턴 식별", "페르소나별 메시지 정교화", "온보딩 퍼널 마찰 제거"]
  },
  "data_analysis": {
    "funnel_insight": "핵심 병목: 전환 단계에서 이탈이 큼",
    "top_channel": "ROAS 상위 채널: Meta Ads",
    "retention_suggestion": "리텐션 개선: Week 2 온보딩 보강"
  },
  "impact_highlights": [
    {"label": "전환율 개선", "value": "+38%", "context": "기간: 2024.Q1-Q2"},
    {"label": "CAC 절감", "value": "-27%", "context": "채널: Paid/Owned"},
    {"label": "ROAS 달성", "value": "3.1x", "context": "캠페인: 리브랜딩"},
    {"label": "LTV 증가", "value": "+25%", "context": "코호트: Q1"}
  ],
  "learning_cycle": {
    "success_criteria": "전환/ROAS/CAC 임계값",
    "sprint_cycle": "스프린트: 1-2주, 회고: 주간"
  },
  "reproducibility": {
    "target": "제품/세그먼트/지역에 우선 적용",
    "prerequisites": "데이터 파이프라인/채널 세팅/리소스 확보",
    "risk_mitigation": "리스크: 피로도 → 완화: 빈도 제한"
  },
  "testimonial": {
    "content": "임팩트, 협업, 실행력에 대한 구체적 사례를 작성하세요",
    "author": "이름 · 직함/회사 · 기간/관계"
  },
  "contact": {
    "name": "이름",
    "title": "직함",
    "org": "조직/브랜드",
    "email": "이메일",
    "phone": "전화번호",
    "linkedin": "LinkedIn/포트폴리오 URL",
    "work_type": "정규직 · 서울/하이브리드",
    "available_date": "2025-01-15 이후",
    "closing_message": "함께 만들 성장을 제안드립니다"
  }
}

중요:
1. 모든 필드를 반드시 채워주세요
2. 마케팅/기획 관점에서 성과와 전략을 강조하세요
3. 숫자와 KPI는 구체적으로 작성하세요
4. JSON 형식만 응답하세요
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다');
      }

      const optimizedData = JSON.parse(jsonMatch[0]) as MarketingPlanningPPTData;
      return optimizedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 마케팅/기획 PPT 생성
   */
  async generateMarketingPlanningPPT(data: PortfolioData, templatePath: string, userProfile?: any): Promise<Blob> {
    try {

      // 1. LLM을 통한 데이터 최적화
      const optimizedData = await this.optimizeForMarketingPlanningPPT(data, userProfile);

      // 2. 템플릿 파일 로드
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`템플릿 파일 로드 실패: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);

      // 3. 각 슬라이드 처리
      // Slide 1: 커버
      let slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';
      slide1 = slide1.replace('[이름]', optimizedData.cover.name);
      slide1 = slide1.replace('[직무/포지션]', optimizedData.cover.position);
      slide1 = slide1.replace('[이메일]', optimizedData.cover.email);
      slide1 = slide1.replace('[전화번호]', optimizedData.cover.phone);
      slide1 = slide1.replace('[포트폴리오/웹 링크]', optimizedData.cover.portfolio_link);
      zip.file('ppt/slides/slide1.xml', slide1);

      // Slide 2: 자기소개
      let slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
      slide2 = slide2.replace('[경력연차/산업]', optimizedData.self_intro.one_liner.split(' ')[0] || '');
      slide2 = slide2.replace('[전문역량]', optimizedData.self_intro.one_liner.split(' ').slice(1).join(' ') || '');
      slide2 = slide2.replace(/\[이름\]/g, optimizedData.self_intro.name);
      slide2 = slide2.replace('[직함]', optimizedData.self_intro.title);
      slide2 = slide2.replace('[조직/브랜드]', optimizedData.self_intro.org);
      slide2 = slide2.replace('[근무 형태/가능 지역]', optimizedData.self_intro.work_type);
      slide2 = slide2.replace(/\[이메일\]/g, optimizedData.self_intro.email);
      slide2 = slide2.replace(/\[전화\]/g, optimizedData.self_intro.phone);
      slide2 = slide2.replace('[LinkedIn/포트폴리오]', optimizedData.self_intro.linkedin);
      slide2 = slide2.replace('[총 연차]', optimizedData.self_intro.career_summary.split('년')[0] || '');
      slide2 = slide2.replace('[핵심 산업/도메인]', optimizedData.self_intro.career_summary.split('·')[1]?.trim() || '');
      slide2 = slide2.replace('[주요 역할]', optimizedData.self_intro.career_summary.split('·')[2]?.trim() || '');

      // 핵심 성과 대체
      if (optimizedData.self_intro.key_achievements.length >= 3) {
        slide2 = slide2.replace('+38%', optimizedData.self_intro.key_achievements[0].value);
        slide2 = slide2.replace('-27%', optimizedData.self_intro.key_achievements[1].value);
        slide2 = slide2.replace('3.1x', optimizedData.self_intro.key_achievements[2].value);
      }
      zip.file('ppt/slides/slide2.xml', slide2);

      // Slide 3: 핵심 역량
      let slide3 = zip.file('ppt/slides/slide3.xml')?.asText() || '';
      optimizedData.core_competencies.slice(0, 6).forEach((comp, i) => {
        const searchPattern = new RegExp(`\\[\\{1-5\\}로 조정\\]`, 'g');
        slide3 = slide3.replace(searchPattern, '●'.repeat(comp.proficiency) + '○'.repeat(5 - comp.proficiency));
      });
      zip.file('ppt/slides/slide3.xml', slide3);

      // Slide 4: 프로젝트 개요
      let slide4 = zip.file('ppt/slides/slide4.xml')?.asText() || '';
      optimizedData.project_overview.slice(0, 3).forEach((proj, i) => {
        const letter = String.fromCharCode(65 + i); // A, B, C
        slide4 = slide4.replace(`[프로젝트 ${letter}]`, proj.name);
        slide4 = slide4.replace(`[역할]`, proj.role);
        slide4 = slide4.replace(`[기간]`, proj.period);
      });
      zip.file('ppt/slides/slide4.xml', slide4);

      // Slide 5: 프로젝트 상세 1 (전략 수립)
      let slide5 = zip.file('ppt/slides/slide5.xml')?.asText() || '';
      slide5 = slide5.replace('{제품/서비스명}', optimizedData.project_detail_strategy.background.split('·')[0] || '');
      slide5 = slide5.replace('{성장/정체}', '성장');
      slide5 = slide5.replace('{전환 저하 / CAC 상승 / 리텐션 저하}', '전환 최적화');
      slide5 = slide5.replace('{예산/리소스/기간}', optimizedData.project_detail_strategy.constraints);
      slide5 = slide5.replace('{GA4/광고 플랫폼/CRM}', optimizedData.project_detail_strategy.measurement_tool);
      slide5 = slide5.replace('{핵심 페르소나 · 주요 니즈}', optimizedData.project_detail_strategy.persona);
      slide5 = slide5.replace('{도달 → 유입 → 전환 단계의 이탈 포인트}', optimizedData.project_detail_strategy.journey_bottleneck);
      slide5 = slide5.replace('{재방문/재구매를 유도하는 가치 순간}', optimizedData.project_detail_strategy.retention_point);
      slide5 = slide5.replace('{한 문장 포지셔닝}', optimizedData.project_detail_strategy.positioning);
      zip.file('ppt/slides/slide5.xml', slide5);

      // Slide 6: 프로젝트 상세 2 (실행 & 결과)
      let slide6 = zip.file('ppt/slides/slide6.xml')?.asText() || '';
      slide6 = slide6.replace('{핵심 메시지 예시를 입력하세요}', optimizedData.project_detail_execution.message);
      slide6 = slide6.replace('{가설을 입력하세요: 예) 가치 제안 강조 시 전환율이 상승한다}', optimizedData.project_detail_execution.experiment.hypothesis);
      slide6 = slide6.replace('{샘플}', '1000');

      // 결과 대체
      if (optimizedData.project_detail_execution.results.length >= 3) {
        slide6 = slide6.replace('전 2.3%', `전 ${optimizedData.project_detail_execution.results[0].before}`);
        slide6 = slide6.replace('후 3.1%', `후 ${optimizedData.project_detail_execution.results[0].after}`);
        slide6 = slide6.replace('전 45k', `전 ${optimizedData.project_detail_execution.results[1].before}`);
        slide6 = slide6.replace('후 35k', `후 ${optimizedData.project_detail_execution.results[1].after}`);
        slide6 = slide6.replace('전 1.9x', `전 ${optimizedData.project_detail_execution.results[2].before}`);
        slide6 = slide6.replace('후 2.8x', `후 ${optimizedData.project_detail_execution.results[2].after}`);
      }
      zip.file('ppt/slides/slide6.xml', slide6);

      // Slide 7: 데이터 분석
      let slide7 = zip.file('ppt/slides/slide7.xml')?.asText() || '';
      slide7 = slide7.replace('{핵심 병목: [단계]에서 이탈이 큼}', optimizedData.data_analysis.funnel_insight);
      slide7 = slide7.replace('{ROAS 상위 채널: [채널]}', optimizedData.data_analysis.top_channel);
      slide7 = slide7.replace('{리텐션 개선: [코호트/주차] 온보딩 보강}', optimizedData.data_analysis.retention_suggestion);
      zip.file('ppt/slides/slide7.xml', slide7);

      // Slide 8: 성과 하이라이트
      let slide8 = zip.file('ppt/slides/slide8.xml')?.asText() || '';
      if (optimizedData.impact_highlights.length >= 4) {
        slide8 = slide8.replace('+[x]%', optimizedData.impact_highlights[0].value);
        slide8 = slide8.replace('[YYYY.Q–Q]', optimizedData.impact_highlights[0].context);
        slide8 = slide8.replace('-[y]%', optimizedData.impact_highlights[1].value);
        slide8 = slide8.replace('[Paid/Owned]', optimizedData.impact_highlights[1].context);
        slide8 = slide8.replace('[z]x', optimizedData.impact_highlights[2].value);
        slide8 = slide8.replace('[이름]', optimizedData.impact_highlights[2].context);
        slide8 = slide8.replace('+[w]%', optimizedData.impact_highlights[3].value);
        slide8 = slide8.replace('[월/분기]', optimizedData.impact_highlights[3].context);
      }
      slide8 = slide8.replace('[전환/ROAS/CAC]', optimizedData.learning_cycle.success_criteria);
      slide8 = slide8.replace('[1–2주]', optimizedData.learning_cycle.sprint_cycle.split(',')[0] || '');
      slide8 = slide8.replace('[주간]', optimizedData.learning_cycle.sprint_cycle.split(',')[1] || '');
      slide8 = slide8.replace('[제품/세그먼트/지역]', optimizedData.reproducibility.target);
      slide8 = slide8.replace('[데이터 파이프라인/채널 세팅/리소스]', optimizedData.reproducibility.prerequisites);
      slide8 = slide8.replace('[예: 피로도]', optimizedData.reproducibility.risk_mitigation.split('→')[0] || '');
      slide8 = slide8.replace('[예: 빈도 제한]', optimizedData.reproducibility.risk_mitigation.split('→')[1] || '');
      slide8 = slide8.replace('[추천사 내용을 입력하세요: 임팩트, 협업, 실행력에 대한 구체적 사례]', optimizedData.testimonial.content);
      slide8 = slide8.replace('[직함/회사]', optimizedData.testimonial.author.split('·')[1] || '');
      slide8 = slide8.replace('[기간/관계]', optimizedData.testimonial.author.split('·')[2] || '');
      zip.file('ppt/slides/slide8.xml', slide8);

      // Slide 9: 연락처
      let slide9 = zip.file('ppt/slides/slide9.xml')?.asText() || '';
      slide9 = slide9.replace(/\[이름\]/g, optimizedData.contact.name);
      slide9 = slide9.replace(/\[직함\]/g, optimizedData.contact.title);
      slide9 = slide9.replace(/\[조직\/브랜드\]/g, optimizedData.contact.org);
      slide9 = slide9.replace(/\[이메일\]/g, optimizedData.contact.email);
      slide9 = slide9.replace(/\[전화\]/g, optimizedData.contact.phone);
      slide9 = slide9.replace('[LinkedIn/포트폴리오 URL]', optimizedData.contact.linkedin);
      slide9 = slide9.replace('[예: 정규직 · 서울/하이브리드]', optimizedData.contact.work_type);
      slide9 = slide9.replace('[예: 2025-01-15 이후]', optimizedData.contact.available_date);
      slide9 = slide9.replace('{여기에 한 줄 메시지를 입력하세요}', optimizedData.contact.closing_message);
      zip.file('ppt/slides/slide9.xml', slide9);

      // 4. ZIP을 Blob으로 변환
      const blob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      return blob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PM PPT 템플릿용 데이터 최적화
   */
  async optimizeForPMPPT(data: PortfolioData, userProfile?: any): Promise<PMPPTData> {

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    const userName = userProfile?.name || data.userInfo.name || '이름 없음';
    const userEmail = userProfile?.email || data.userInfo.email || '';
    const userPhone = userProfile?.phone || data.userInfo.phone || '';
    const userPosition = userProfile?.position || data.userInfo.title || 'Product Manager';

    const prompt = `
당신은 PM/PO 포트폴리오를 PPT에 최적화하는 전문가입니다.

=== 입력 데이터 ===
이름: ${userName}
직무: ${userPosition}
자기소개: ${data.userInfo.summary || ''}
이메일: ${userEmail}
전화번호: ${userPhone}
웹사이트: ${data.userInfo.website || data.userInfo.github || userProfile?.github_url || ''}

스킬: ${data.skills.length > 0 ? data.skills.map(s => s.category + ': ' + s.items.join(', ')).join(' | ') : ''}

프로젝트:
${data.projects.slice(0, 3).map((p, i) => `${i + 1}. ${p.name || ''}
   - 설명: ${p.description || ''}
   - 성과: ${p.highlights?.join(', ') || ''}`).join('\n')}

=== 출력 요구사항 ===
PM/PO 전문 포트폴리오에 맞게 데이터를 변환하세요. Discovery-Delivery-Launch 프레임워크를 사용하세요.
반드시 다음 JSON 구조로 응답하세요:

{
  "cover": {
    "name": "이름",
    "position": "직무/포지션",
    "email": "이메일",
    "phone": "전화번호",
    "portfolio_link": "포트폴리오/웹 링크"
  },
  "self_intro": {
    "subtitle": "한 줄 소개 (예: 데이터 기반 제품 성장을 이끄는 PM)",
    "timeline": [
      {"period": "2022-현재", "company": "회사명", "role": "Senior PM — 핵심 역할"},
      {"period": "2020-2022", "company": "회사명", "role": "PM — 핵심 역할"},
      {"period": "2018-2020", "company": "회사명", "role": "APM — 핵심 역할"}
    ],
    "skills": ["전략/로드맵", "Discovery/리서치", "데이터/실험"],
    "highlights": [
      {"metric": "MAU 성장", "value": "+150%"},
      {"metric": "전환율 개선", "value": "+40%"}
    ],
    "values": ["사용자 중심", "데이터 드리븐", "빠른 실행"]
  },
  "project_1": {
    "name": "프로젝트명",
    "period": "기간",
    "role": "역할/책임",
    "discovery": "사용자 리서치, 문제 정의",
    "delivery": "우선순위 설정, 스프린트 실행",
    "launch": "출시, A/B 테스트, 학습",
    "background": "비즈니스/사용자 문제 요약",
    "hypothesis": "핵심 가설",
    "collaboration": "참여 팀/이해관계자",
    "kpis": [
      {"metric": "DAU", "value": "+25%", "description": "3개월"},
      {"metric": "Retention", "value": "+15%", "description": "D7"},
      {"metric": "NPS", "value": "+20pt", "description": "출시 후"}
    ],
    "quantitative_result": "정량적 결과 수치",
    "qualitative_result": "사용자/스테이크홀더 피드백"
  },
  "project_2": {
    "name": "프로젝트명",
    "period": "기간",
    "role": "역할/책임",
    "discovery": "리서치/문제정의",
    "delivery": "우선순위/실행",
    "launch": "출시/학습",
    "background": "문제 요약",
    "hypothesis": "핵심 가설",
    "collaboration": "참여 팀",
    "kpis": [
      {"metric": "지표1", "value": "값", "description": "설명"},
      {"metric": "지표2", "value": "값", "description": "설명"},
      {"metric": "지표3", "value": "값", "description": "설명"}
    ],
    "quantitative_result": "정량 결과",
    "qualitative_result": "정성 피드백",
    "insights": "핵심 인사이트",
    "next_actions": "다음 액션/개선점",
    "risks": "주요 리스크/의존성",
    "mitigation": "완화 전략"
  },
  "project_3": {
    "name": "프로젝트명",
    "period": "기간",
    "role": "역할/책임",
    "discovery": "리서치/문제정의",
    "delivery": "우선순위/실행",
    "launch": "출시/학습",
    "background": "문제 요약",
    "hypothesis": "핵심 가설",
    "collaboration": "참여 팀",
    "kpis": [
      {"metric": "지표1", "value": "값", "description": "설명"},
      {"metric": "지표2", "value": "값", "description": "설명"},
      {"metric": "지표3", "value": "값", "description": "설명"}
    ],
    "quantitative_result": "정량 결과",
    "qualitative_result": "정성 피드백",
    "insights": "핵심 인사이트/다음 액션"
  },
  "competencies": {
    "summary": "핵심 소개 문구",
    "core_skills": [
      {"category": "전략/로드맵", "description": "비전 정의 · 우선순위 · 로드맵"},
      {"category": "Discovery/리서치", "description": "문제 정의 · 사용자 리서치"},
      {"category": "Delivery/실행", "description": "백로그 · 스프린트 · 릴리즈"},
      {"category": "데이터/실험", "description": "분석 · 실험 설계 · 인사이트"},
      {"category": "커뮤니케이션/리더십", "description": "정렬 · 의사결정 · 스테이크홀더"}
    ],
    "tools": {
      "product": ["Jira", "Linear", "Asana"],
      "design": ["Figma", "Sketch"],
      "analytics": ["Amplitude", "GA", "SQL"],
      "collaboration": ["Notion", "Slack"]
    },
    "certifications": ["CSPO — Scrum Alliance, 2023", "SQL Advanced — DataCamp, 2022"],
    "additional": "기타 참고 사항"
  },
  "contact": {
    "name": "이름",
    "email": "이메일",
    "phone": "전화번호",
    "portfolio": "포트폴리오 URL",
    "linkedin": "LinkedIn URL",
    "github": "GitHub/Blog URL",
    "languages": ["한국어", "영어"],
    "work_type": "원격/상주",
    "location": "서울",
    "notes": "추가 사항"
  }
}

중요:
1. 모든 필드를 반드시 채워주세요
2. PM/PO 관점에서 Discovery-Delivery-Launch 프레임워크를 강조하세요
3. 숫자와 KPI는 구체적으로 작성하세요
4. JSON 형식만 응답하세요
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다');
      }

      const optimizedData = JSON.parse(jsonMatch[0]) as PMPPTData;
      return optimizedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PM PPT 생성
   */
  async generatePMPPT(data: PortfolioData, templatePath: string, userProfile?: any): Promise<Blob> {
    try {

      // 1. LLM을 통한 데이터 최적화
      const optimizedData = await this.optimizeForPMPPT(data, userProfile);

      // 2. 템플릿 파일 로드
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`템플릿 파일 로드 실패: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);

      // 3. 각 슬라이드 처리
      // Slide 1: 커버
      let slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';
      slide1 = slide1.replace('[이름]', this.truncateText(optimizedData.cover.name, 20));
      slide1 = slide1.replace('[직무/포지션]', this.truncateText(optimizedData.cover.position, 25));
      slide1 = slide1.replace('[이메일]', this.truncateText(optimizedData.cover.email, 35));
      slide1 = slide1.replace('[전화번호]', this.truncateText(optimizedData.cover.phone, 15));
      slide1 = slide1.replace('[포트폴리오/웹 링크]', this.truncateText(optimizedData.cover.portfolio_link, 40));
      zip.file('ppt/slides/slide1.xml', slide1);

      // Slide 2: 자기소개
      let slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
      slide2 = slide2.replace('[부제/한 줄 소개]', this.truncateText(optimizedData.self_intro.subtitle, 50));

      // 타임라인 대체
      optimizedData.self_intro.timeline.slice(0, 3).forEach((item, i) => {
        slide2 = slide2.replace('[YYYY–YYYY]', this.truncateText(item.period, 15));
        slide2 = slide2.replace('[회사/조직]', this.truncateText(item.company, 20));
        slide2 = slide2.replace('[직무/직책] — [핵심 역할]', this.truncateText(item.role, 35));
      });

      // 스킬 대체
      if (optimizedData.self_intro.skills.length >= 3) {
        slide2 = slide2.replace('[전략/로드맵]', this.truncateText(optimizedData.self_intro.skills[0], 20));
        slide2 = slide2.replace('[Discovery/리서치]', this.truncateText(optimizedData.self_intro.skills[1], 20));
        slide2 = slide2.replace('[데이터/실험]', this.truncateText(optimizedData.self_intro.skills[2], 20));
      }

      // 성과 하이라이트
      if (optimizedData.self_intro.highlights.length >= 2) {
        slide2 = slide2.replace(/\[지표명\]/g, (match, offset, string) => {
          const count = (string.substring(0, offset).match(/\[지표명\]/g) || []).length;
          return this.truncateText(optimizedData.self_intro.highlights[count]?.metric || match, 15);
        });
        slide2 = slide2.replace(/\[값\/변화\]/g, (match, offset, string) => {
          const count = (string.substring(0, offset).match(/\[값\/변화\]/g) || []).length;
          return this.truncateText(optimizedData.self_intro.highlights[count]?.value || match, 10);
        });
      }

      // 가치관
      if (optimizedData.self_intro.values.length >= 3) {
        slide2 = slide2.replace('[가치관/방식: 키워드 1]', this.truncateText(optimizedData.self_intro.values[0], 20));
        slide2 = slide2.replace('[가치관/방식: 키워드 2]', this.truncateText(optimizedData.self_intro.values[1], 20));
        slide2 = slide2.replace('[가치관/방식: 키워드 3]', this.truncateText(optimizedData.self_intro.values[2], 20));
      }
      zip.file('ppt/slides/slide2.xml', slide2);

      // Slide 3: 프로젝트 1
      let slide3 = zip.file('ppt/slides/slide3.xml')?.asText() || '';
      slide3 = slide3.replace('[프로젝트명]', this.truncateText(optimizedData.project_1.name, 35));
      slide3 = slide3.replace('[기간]', this.truncateText(optimizedData.project_1.period, 25));
      slide3 = slide3.replace('[역할/책임]', this.truncateText(optimizedData.project_1.role, 25));
      slide3 = slide3.replace('[리서치/문제정의]', this.truncateText(optimizedData.project_1.discovery, 30));
      slide3 = slide3.replace('[우선순위/실행]', this.truncateText(optimizedData.project_1.delivery, 30));
      slide3 = slide3.replace('[출시/학습]', this.truncateText(optimizedData.project_1.launch, 30));
      slide3 = slide3.replace('[비즈니스/사용자 문제 요약]', this.truncateText(optimizedData.project_1.background, 60));
      slide3 = slide3.replace('[목표/핵심 가설]', this.truncateText(optimizedData.project_1.hypothesis, 50));
      slide3 = slide3.replace('[참여 팀/이해관계자]', this.truncateText(optimizedData.project_1.collaboration, 40));
      slide3 = slide3.replace('[결과 수치]', this.truncateText(optimizedData.project_1.quantitative_result, 40));
      slide3 = slide3.replace('[사용자/스테이크홀더 피드백]', this.truncateText(optimizedData.project_1.qualitative_result, 50));

      // KPI 대체
      optimizedData.project_1.kpis.slice(0, 3).forEach((kpi, i) => {
        slide3 = slide3.replace('[지표명]', this.truncateText(kpi.metric, 15));
        slide3 = slide3.replace('[값/변화]', this.truncateText(kpi.value, 10));
        slide3 = slide3.replace('[설명/기간]', this.truncateText(kpi.description, 20));
      });
      zip.file('ppt/slides/slide3.xml', slide3);

      // Slide 4: 프로젝트 2
      let slide4 = zip.file('ppt/slides/slide4.xml')?.asText() || '';
      slide4 = slide4.replace('[프로젝트명]', this.truncateText(optimizedData.project_2.name, 35));
      slide4 = slide4.replace('[기간]', this.truncateText(optimizedData.project_2.period, 25));
      slide4 = slide4.replace('[역할/책임]', this.truncateText(optimizedData.project_2.role, 25));
      slide4 = slide4.replace('[리서치/문제정의]', this.truncateText(optimizedData.project_2.discovery, 30));
      slide4 = slide4.replace('[우선순위/실행]', this.truncateText(optimizedData.project_2.delivery, 30));
      slide4 = slide4.replace('[출시/학습]', this.truncateText(optimizedData.project_2.launch, 30));
      slide4 = slide4.replace('[비즈니스/사용자 문제 요약]', this.truncateText(optimizedData.project_2.background, 60));
      slide4 = slide4.replace('[목표/핵심 가설]', this.truncateText(optimizedData.project_2.hypothesis, 50));
      slide4 = slide4.replace('[참여 팀/이해관계자]', this.truncateText(optimizedData.project_2.collaboration, 40));
      slide4 = slide4.replace('[결과 수치]', this.truncateText(optimizedData.project_2.quantitative_result, 40));
      slide4 = slide4.replace('[사용자/스테이크홀더 피드백]', this.truncateText(optimizedData.project_2.qualitative_result, 50));
      slide4 = slide4.replace('[핵심 인사이트]', this.truncateText(optimizedData.project_2.insights, 50));
      slide4 = slide4.replace('[다음 액션/개선점]', this.truncateText(optimizedData.project_2.next_actions, 50));
      slide4 = slide4.replace('[주요 리스크/의존성]', this.truncateText(optimizedData.project_2.risks, 40));
      slide4 = slide4.replace('[완화 전략]', this.truncateText(optimizedData.project_2.mitigation, 40));

      optimizedData.project_2.kpis.slice(0, 3).forEach((kpi, i) => {
        slide4 = slide4.replace('[지표명]', this.truncateText(kpi.metric, 15));
        slide4 = slide4.replace('[값/변화]', this.truncateText(kpi.value, 10));
        slide4 = slide4.replace('[설명/기간]', this.truncateText(kpi.description, 20));
      });
      zip.file('ppt/slides/slide4.xml', slide4);

      // Slide 5: 프로젝트 3
      let slide5 = zip.file('ppt/slides/slide5.xml')?.asText() || '';
      slide5 = slide5.replace('[프로젝트명]', this.truncateText(optimizedData.project_3.name, 35));
      slide5 = slide5.replace('[기간]', this.truncateText(optimizedData.project_3.period, 25));
      slide5 = slide5.replace('[역할/책임]', this.truncateText(optimizedData.project_3.role, 25));
      slide5 = slide5.replace('[리서치/문제정의]', this.truncateText(optimizedData.project_3.discovery, 30));
      slide5 = slide5.replace('[우선순위/실행]', this.truncateText(optimizedData.project_3.delivery, 30));
      slide5 = slide5.replace('[출시/학습]', this.truncateText(optimizedData.project_3.launch, 30));
      slide5 = slide5.replace('[비즈니스/사용자 문제 요약]', this.truncateText(optimizedData.project_3.background, 60));
      slide5 = slide5.replace('[목표/핵심 가설]', this.truncateText(optimizedData.project_3.hypothesis, 50));
      slide5 = slide5.replace('[참여 팀/이해관계자]', this.truncateText(optimizedData.project_3.collaboration, 40));
      slide5 = slide5.replace('[결과 수치]', this.truncateText(optimizedData.project_3.quantitative_result, 40));
      slide5 = slide5.replace('[사용자/스테이크홀더 피드백]', this.truncateText(optimizedData.project_3.qualitative_result, 50));
      slide5 = slide5.replace('[핵심 인사이트/다음 액션]', this.truncateText(optimizedData.project_3.insights, 60));

      optimizedData.project_3.kpis.slice(0, 3).forEach((kpi, i) => {
        slide5 = slide5.replace('[지표명]', this.truncateText(kpi.metric, 15));
        slide5 = slide5.replace('[값/변화]', this.truncateText(kpi.value, 10));
        slide5 = slide5.replace('[설명/기간]', this.truncateText(kpi.description, 20));
      });
      zip.file('ppt/slides/slide5.xml', slide5);

      // Slide 6: 핵심 역량 및 도구
      let slide6 = zip.file('ppt/slides/slide6.xml')?.asText() || '';
      slide6 = slide6.replace('[핵심 소개 문구/한 줄 요약]', this.truncateText(optimizedData.competencies.summary, 60));

      // 핵심 역량 대체
      optimizedData.competencies.core_skills.slice(0, 5).forEach((skill) => {
        slide6 = slide6.replace(`[${skill.category}]`, this.truncateText(skill.category, 20));
        slide6 = slide6.replace('[비전 정의 · 우선순위 · 로드맵]', this.truncateText(skill.description, 35));
        slide6 = slide6.replace('[문제 정의 · 사용자 리서치]', this.truncateText(skill.description, 35));
        slide6 = slide6.replace('[백로그 · 스프린트 · 릴리즈]', this.truncateText(skill.description, 35));
        slide6 = slide6.replace('[분석 · 실험 설계 · 인사이트]', this.truncateText(skill.description, 35));
        slide6 = slide6.replace('[정렬 · 의사결정 · 스테이크홀더]', this.truncateText(skill.description, 35));
      });

      // 도구 대체
      slide6 = slide6.replace('[Jira · Linear · Asana]', this.truncateText(optimizedData.competencies.tools.product.join(' · '), 30));
      slide6 = slide6.replace('[Figma · Sketch]', this.truncateText(optimizedData.competencies.tools.design.join(' · '), 25));
      slide6 = slide6.replace('[Amplitude · GA · SQL]', this.truncateText(optimizedData.competencies.tools.analytics.join(' · '), 30));
      slide6 = slide6.replace('[Notion · Slack]', this.truncateText(optimizedData.competencies.tools.collaboration.join(' · '), 25));

      // 인증
      if (optimizedData.competencies.certifications.length >= 2) {
        slide6 = slide6.replace(/\[자격\/교육명\] — \[기관\/연도\]/g, (match, offset, string) => {
          const count = (string.substring(0, offset).match(/\[자격\/교육명\] — \[기관\/연도\]/g) || []).length;
          return this.truncateText(optimizedData.competencies.certifications[count] || match, 40);
        });
      }

      slide6 = slide6.replace('[기타 참고 사항을 여기에 기입]', this.truncateText(optimizedData.competencies.additional, 50));
      zip.file('ppt/slides/slide6.xml', slide6);

      // Slide 7: 연락처
      let slide7 = zip.file('ppt/slides/slide7.xml')?.asText() || '';
      slide7 = slide7.replace(/\[이름\]/g, this.truncateText(optimizedData.contact.name, 20));
      slide7 = slide7.replace(/\[이메일\]/g, this.truncateText(optimizedData.contact.email, 35));
      slide7 = slide7.replace(/\[전화번호\]/g, this.truncateText(optimizedData.contact.phone, 15));
      slide7 = slide7.replace('[포트폴리오]', this.truncateText(optimizedData.contact.portfolio, 35));
      slide7 = slide7.replace('[LinkedIn]', this.truncateText(optimizedData.contact.linkedin, 35));
      slide7 = slide7.replace('[GitHub/Blog]', this.truncateText(optimizedData.contact.github, 35));
      slide7 = slide7.replace('[언어 1]', this.truncateText(optimizedData.contact.languages[0] || '', 10));
      slide7 = slide7.replace('[언어 2]', this.truncateText(optimizedData.contact.languages[1] || '', 10));
      slide7 = slide7.replace('[언어 3]', this.truncateText(optimizedData.contact.languages[2] || '', 10));
      slide7 = slide7.replace('[원격/상주]', this.truncateText(optimizedData.contact.work_type, 15));
      slide7 = slide7.replace('[도시/지역]', this.truncateText(optimizedData.contact.location, 15));
      slide7 = slide7.replace('[개인정보 처리 동의 문구 등]', this.truncateText(optimizedData.contact.notes, 50));
      zip.file('ppt/slides/slide7.xml', slide7);

      // 4. ZIP을 Blob으로 변환
      const blob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      return blob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PPT 파일 다운로드
   */
  downloadPPT(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new PPTXGenerationService();
