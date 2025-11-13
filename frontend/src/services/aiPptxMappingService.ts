/**
 * OpenAI API를 사용하여 HTML 포트폴리오를 PPTX 구조에 맞게 매핑
 */

export interface PPTXMappedData {
  // Slide 1
  name: string;
  title: string;
  email: string;
  phone: string;
  submissionTarget: string;
  submissionDate: string;

  // Slide 2
  aboutSummary: string; // 경력 연차/전문 분야
  skills: string[]; // 최대 5개
  values: string[]; // 가치관 3개
  achievement: string; // 주요 성과
  keypoints: string[]; // 차별점 2개
  websiteUrl: string;
  linkedinUrl: string;
  githubUrl: string;

  // Slide 3
  experiences: Array<{
    company: string;
    position: string;
    period: string;
    briefDesc: string;
    role1: string;
    role2: string;
    achievement: string;
    technologies: string;
  }>;
  totalYears: string;
  domain: string;
  highlights: string;

  // Slide 4-6 (프로젝트 최대 3개)
  projects: Array<{
    title: string;
    period: string;
    role: string;
    problem: string;
    solution: string;
    impact: string;
    technologies: string[];
    teamSize: string;
    contribution: string;
    // 추가 상세 정보
    contributions: string[]; // 핵심 기여 3개
    kpiMetrics: Array<{ // KPI 지표 3개
      name: string;
      value: string;
    }>;
  }>;
}

/**
 * OpenAI API를 사용하여 HTML에서 PPTX 데이터 추출
 * @param htmlContent - 생성된 HTML 포트폴리오 전체
 * @param existingData - 기존 추출된 데이터 (있으면 참고)
 */
export async function extractPPTXDataFromHTML(htmlContent: string, existingData?: any): Promise<PPTXMappedData> {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not found, using basic extraction');
    return extractBasicData(htmlContent);
  }

  console.log('🔍 기존 추출 데이터:', existingData);

  // 기존 데이터를 JSON으로 변환
  const existingDataStr = existingData ? JSON.stringify(existingData, null, 2) : '없음';

  const prompt = `
당신은 개발자 포트폴리오를 **내용으로 꽉 채워서** 풍부하게 만드는 전문 컨설턴트입니다.

🚨 **중요: 아래 기존 데이터는 사용자가 직접 작성한 실제 데이터입니다. 절대 예시나 가상의 데이터로 대체하지 마세요!**

**기존 추출 데이터 (이 데이터를 반드시 그대로 사용):**
\`\`\`json
${existingDataStr}
\`\`\`

**HTML 포트폴리오 (전체 내용):**
\`\`\`html
${htmlContent.slice(0, 15000)}
\`\`\`

**핵심 작업 원칙 (우선순위 순서):**
1. ✅ **실제 데이터 최우선** - 위 JSON의 name, email, projects, experience, skills 등을 절대 변경하지 말고 그대로 사용
2. ✅ **실제 데이터 기반 확장만** - 존재하는 프로젝트명, 회사명, 기술스택을 기반으로만 내용 확장
3. ✅ **빈 부분만 채우기** - 없는 데이터(가치관, 차별점, 상세 설명)만 생성
4. ✅ **텍스트 길이 최대화** - 실제 데이터를 바탕으로 상세하게 확장
5. ✅ **구체적인 수치 포함** - 성과에 수치 추가 (단, 맥락에 맞게)

**절대 금지사항:**
❌ 존재하는 프로젝트명, 회사명, 이름, 이메일을 다른 것으로 변경
❌ 기존 데이터에 없는 프로젝트나 경력을 완전히 새로 창작
❌ "Your Name", "example.com" 같은 플레이스홀더 사용

**내용 확장 방법:**
- 자기소개: **기존 about 텍스트 전체 포함** + 추가 강점 서술 (70-80자)
- 프로젝트 설명: **기존 description 전체 포함** + 기술적 디테일 추가 (40-50자)
- 경력 설명: **기존 description 전체 포함** + 역할 상세화 (25자)
- 가치관: 기존 about에서 추론하여 3개 생성 (각 35자)
- 차별점: 기존 skills와 experience에서 추론 (각 28자)
- 성과: 기존 프로젝트/경력 내용 기반 수치화 (50자)

아래 JSON 형식으로 반환해주세요. **실제 사용자 데이터를 반드시 사용하세요:**

\`\`\`json
{
  "name": "위 JSON의 name 값 그대로 사용 (절대 변경 금지)",
  "title": "위 JSON의 title이나 about에서 추출한 직무",
  "email": "위 JSON의 contact.email 값 그대로 사용 (절대 변경 금지)",
  "phone": "위 JSON의 contact.phone 값 그대로 사용 (없으면 빈 문자열)",
  "submissionTarget": "회사명이 있으면 사용, 없으면 빈 문자열",
  "submissionDate": "2025.11",

  "aboutSummary": "🚨 위 JSON의 about 텍스트를 최대한 포함하여 70-80자로 확장. 절대 새로 만들지 말고 기존 텍스트 기반 확장",

  "skills": "🚨 위 JSON의 skills 배열을 그대로 사용. 5개가 안 되면 projects의 tech에서 추가",

  "values": [
    "위 about 내용 기반 가치관 35자 (예: '사용자 중심 개발로 실질적 가치 창출')",
    "위 about 내용 기반 가치관 35자 (다른 관점)",
    "위 about 내용 기반 가치관 35자 (또 다른 관점)"
  ],

  "achievement": "🚨 위 JSON의 projects 또는 experience에 있는 실제 성과를 바탕으로 50자. 수치 포함",

  "keypoints": [
    "위 skills 기반 차별점 28자",
    "위 experience 기반 차별점 28자"
  ],

  "websiteUrl": "개인 웹사이트 URL (있으면 추출, 없으면 빈 문자열)",
  "linkedinUrl": "LinkedIn URL (있으면 추출, 없으면 빈 문자열)",
  "githubUrl": "GitHub URL (있으면 추출, 없으면 빈 문자열)",

  "experiences": [
    {
      "company": "🚨 위 JSON experience[0].company 그대로 사용",
      "position": "🚨 위 JSON experience[0].position 그대로 사용",
      "period": "🚨 위 JSON experience[0].duration 그대로 사용",
      "briefDesc": "🚨 위 JSON experience[0].description을 25자 이내로 요약",
      "role1": "위 description 기반 역할1 (18자)",
      "role2": "위 description 기반 역할2 (18자)",
      "achievement": "위 description 기반 성과 (30자, 수치)",
      "technologies": "위 description에서 추출한 기술 (30자)"
    },
    {
      "company": "🚨 위 JSON에 experience[1]이 있으면 그대로, 없으면 첫 번째 경력 복사",
      "position": "🚨 위 JSON experience[1].position 그대로 사용",
      "period": "🚨 위 JSON experience[1].duration 그대로 사용",
      "briefDesc": "위 description 요약 (25자)",
      "role1": "역할1 (18자)",
      "role2": "역할2 (18자)",
      "achievement": "성과 (30자)",
      "technologies": "기술스택 (30자)"
    }
  ],

  "totalYears": "총 경력 연수 (예: 5년. HTML에서 계산하거나 경력 기반으로 추론)",
  "domain": "업무 도메인 (25자, 구체적. 예: '핀테크 결제 서비스', 'e커머스 플랫폼 개발')",
  "highlights": "핵심 역량 키워드 2-3개 (쉼표 구분. 예: '풀스택 개발, 팀 리더십, 성능 최적화')",

  "projects": [
    {
      "title": "🚨 위 JSON projects[0].name 그대로 사용",
      "period": "위 JSON에서 추출 또는 추론",
      "role": "🚨 위 JSON projects[0].role 그대로 사용 (20자)",
      "problem": "🚨 위 JSON projects[0].description 앞부분을 문제로 재구성 (40자)",
      "solution": "🚨 위 JSON projects[0].description 뒷부분을 솔루션으로 재구성 (50자)",
      "impact": "위 description 기반 성과 추출, 수치 추가 (40자)",
      "technologies": "🚨 위 JSON projects[0].tech 배열 그대로 사용",
      "teamSize": "위 description에서 추출 또는 '팀 프로젝트'",
      "contribution": "위 role 기반 추론 (예: '70%')",
      "contributions": [
        "위 description 기반 기여1 (25자)",
        "위 description 기반 기여2 (25자)",
        "위 tech 기반 기여3 (25자)"
      ],
      "kpiMetrics": [
        {"name": "지표1 (description 기반)", "value": "수치 (합리적)"},
        {"name": "지표2 (tech 기반)", "value": "수치"},
        {"name": "지표3", "value": "수치"}
      ]
    },
    {
      "title": "🚨 위 JSON projects[1].name 그대로 사용 (없으면 projects[0] 복사)",
      "period": "기간",
      "role": "🚨 위 JSON projects[1].role 그대로",
      "problem": "🚨 위 description 기반 (40자)",
      "solution": "🚨 위 description 기반 (50자)",
      "impact": "성과 (40자)",
      "technologies": "🚨 위 projects[1].tech 그대로",
      "teamSize": "팀 규모",
      "contribution": "기여도",
      "contributions": [
        "기여1 (25자)",
        "기여2 (25자)",
        "기여3 (25자)"
      ],
      "kpiMetrics": [
        {"name": "지표1", "value": "수치"},
        {"name": "지표2", "value": "수치"},
        {"name": "지표3", "value": "수치"}
      ]
    },
    {
      "title": "🚨 위 JSON projects[2].name 그대로 사용 (없으면 projects[0]이나 [1] 복사)",
      "period": "기간",
      "role": "역할",
      "problem": "문제 (40자)",
      "solution": "솔루션 (50자)",
      "impact": "성과 (40자)",
      "technologies": "🚨 위 projects[2].tech 그대로",
      "teamSize": "팀 규모",
      "contribution": "기여도",
      "contributions": [
        "기여1 (25자)",
        "기여2 (25자)",
        "기여3 (25자)"
      ],
      "kpiMetrics": [
        {"name": "지표1", "value": "수치"},
        {"name": "지표2", "value": "수치"},
        {"name": "지표3", "value": "수치"}
      ]
    }
  ]
}
\`\`\`

**최종 체크리스트:**
✅ 가치관 정확히 3개, 각 35자 이내
✅ 차별점 정확히 2개, 각 28자 이내
✅ 경력 정확히 2개 (없으면 생성)
✅ 프로젝트 정확히 3개 (없으면 생성)
✅ 모든 성과에 수치 포함
✅ 전문적이고 임팩트 있는 표현
✅ 텍스트 길이 제한 엄수
✅ 빈 문자열 최소화 (URL 제외)
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert portfolio consultant who creates professional, impactful PPTX content. Extract data from HTML and enrich it with professional language, quantifiable achievements, and complete all required fields. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsedData = JSON.parse(content);

    console.log('✅ OpenAI extracted data:', parsedData);
    return parsedData;

  } catch (error) {
    console.error('❌ OpenAI API 호출 실패, 기본 추출 방식 사용:', error);
    return extractBasicData(htmlContent);
  }
}

/**
 * 기본 데이터 추출 (OpenAI 없이)
 */
function extractBasicData(htmlContent: string): PPTXMappedData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  return {
    name: '',
    title: '',
    email: '',
    phone: '',
    submissionTarget: '',
    submissionDate: '',
    aboutSummary: '',
    skills: [],
    values: ['', '', ''],
    achievement: '',
    keypoints: ['', ''],
    websiteUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    experiences: [],
    totalYears: '',
    domain: '',
    highlights: '',
    projects: []
  };
}
