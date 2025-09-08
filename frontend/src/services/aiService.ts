import OpenAI from 'openai';
import Mustache from 'mustache';

// 주의: 프로덕션에서는 API 키를 프론트엔드에 직접 노출하면 안 됩니다!
// 이는 개발/테스트 용도로만 사용하세요.
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // 브라우저에서 실행 허용 (보안 주의!)
});

export interface ParsedInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  github?: string;
  githubUrl?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  location?: string;
  experiences?: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
    technologies?: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    highlights?: string[];
    url?: string;
    githubUrl?: string;
  }>;
  skills?: Array<{
    category: string;
    items: string[];
    proficiency?: number;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  certifications?: string[];
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  behance?: string;
  role?: string;
  tools?: string;
}

export interface Question {
  field: string;
  question: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
}

class AIPortfolioAssistant {
  async extractTemplateVariables(template: string): Promise<string[]> {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  async parseRawText(rawText: string, templateVariables: string[]): Promise<ParsedInfo> {
    const systemPrompt = `
당신은 포트폴리오 작성을 도와주는 AI 어시스턴트입니다.
사용자가 제공한 자유형식의 텍스트에서 다음 정보들을 추출해주세요:

필요한 정보: ${templateVariables.join(', ')}

추출된 정보를 JSON 형태로 반환해주세요. 
경력사항, 프로젝트, 스킬 등은 배열 형태로 구조화해주세요.

예시 형식:
{
    "name": "이름",
    "title": "직책",
    "email": "이메일",
    "summary": "자기소개",
    "experiences": [
        {
            "company": "회사명",
            "position": "직책",
            "startDate": "시작일",
            "endDate": "종료일",
            "description": "업무 설명",
            "achievements": ["성과1", "성과2"],
            "technologies": ["기술1", "기술2"]
        }
    ],
    "projects": [
        {
            "name": "프로젝트명",
            "description": "설명",
            "technologies": ["기술1", "기술2"],
            "highlights": ["주요성과1", "주요성과2"],
            "url": "라이브 URL",
            "githubUrl": "GitHub URL"
        }
    ],
    "skills": [
        {
            "category": "카테고리",
            "items": ["기술1", "기술2"],
            "proficiency": 5
        }
    ]
}

정보가 명확하지 않거나 없으면 null 또는 빈 배열로 설정해주세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `다음 텍스트에서 정보를 추출해주세요:\n\n${rawText}` }
        ],
        temperature: 0.3
      });

      const extractedJson = response.choices[0].message.content || '{}';
      
      // JSON 추출 (코드 블록 제거)
      let cleanedJson = extractedJson;
      if (extractedJson.includes('```json')) {
        const match = extractedJson.match(/```json\n([\s\S]*?)\n```/);
        cleanedJson = match ? match[1] : extractedJson;
      } else if (extractedJson.includes('```')) {
        const match = extractedJson.match(/```\n([\s\S]*?)\n```/);
        cleanedJson = match ? match[1] : extractedJson;
      }
      
      return JSON.parse(cleanedJson) as ParsedInfo;
    } catch (error) {
      console.error('텍스트 파싱 오류:', error);
      return {};
    }
  }

  async identifyMissingInfo(parsedInfo: ParsedInfo, templateVariables: string[]): Promise<string[]> {
    const missing: string[] = [];
    
    for (const variable of templateVariables) {
      const value = (parsedInfo as any)[variable];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missing.push(variable);
      }
    }
    
    return missing;
  }

  async generateQuestions(missingInfo: string[], context: ParsedInfo): Promise<Question[]> {
    if (missingInfo.length === 0) {
      return [];
    }

    const systemPrompt = `
당신은 전문적인 포트폴리오 작성을 도와주는 친근한 AI 커리어 어드바이저입니다.
사용자가 가장 매력적이고 경쟁력 있는 포트폴리오를 완성할 수 있도록 도와주는 것이 목표입니다.

당신의 역할:
1. 부족한 정보를 파악하고 전략적으로 중요한 순서대로 질문
2. 사용자의 강점을 부각시킬 수 있는 정보를 우선적으로 수집
3. 구체적이고 측정 가능한 성과 데이터 확보
4. 경력/프로젝트의 임팩트와 기술적 깊이 파악
5. 채용담당자가 주목할 만한 차별화 포인트 발굴

질문 원칙:
- 한 번에 하나씩, 구체적으로 질문
- 왜 이 정보가 중요한지 간단히 설명 포함
- 답변하기 쉽도록 구체적인 예시나 가이드 제공
- 성과는 수치화할 수 있도록 유도

질문 형식 (JSON 배열):
[
    {
        "field": "필드명",
        "question": "질문 내용 (중요성 설명 + 구체적 질문 + 예시)",
        "type": "text|select|number",
        "options": ["선택지1", "선택지2"] // select 타입인 경우만
    }
]

톤앤매너: 전문적이면서도 친근하고 격려하는 톤
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `다음 정보가 부족합니다. 적절한 질문을 생성해주세요:\n${missingInfo.join(', ')}\n\n현재 수집된 정보:\n${JSON.stringify(context, null, 2)}` }
        ],
        temperature: 0.7
      });

      const questionsJson = response.choices[0].message.content || '[]';
      
      let cleanedJson = questionsJson;
      if (questionsJson.includes('```json')) {
        const match = questionsJson.match(/```json\n([\s\S]*?)\n```/);
        cleanedJson = match ? match[1] : questionsJson;
      } else if (questionsJson.includes('```')) {
        const match = questionsJson.match(/```\n([\s\S]*?)\n```/);
        cleanedJson = match ? match[1] : questionsJson;
      }
      
      return JSON.parse(cleanedJson) as Question[];
    } catch (error) {
      console.error('질문 생성 오류:', error);
      return [];
    }
  }

  async processUserAnswer(question: Question, answer: string, currentData: ParsedInfo): Promise<ParsedInfo> {
    const systemPrompt = `
당신은 포트폴리오 정보를 정리하는 AI입니다.
사용자의 답변을 받아서 기존 데이터에 적절히 통합해주세요.

질문: ${question.question}
필드: ${question.field}
사용자 답변: ${answer}

현재 데이터를 업데이트한 전체 JSON을 반환해주세요.
반드시 JSON 형태로만 응답하고, 다른 설명은 포함하지 마세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `현재 데이터:\n${JSON.stringify(currentData, null, 2)}\n\n답변: ${answer}` }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const updatedJson = response.choices[0].message.content || '{}';
      
      let cleanedJson = updatedJson;
      if (updatedJson.includes('```json')) {
        const match = updatedJson.match(/```json\n([\s\S]*?)\n```/);
        cleanedJson = match ? match[1] : updatedJson;
      } else if (updatedJson.includes('```')) {
        const match = updatedJson.match(/```\n([\s\S]*?)\n```/);
        cleanedJson = match ? match[1] : updatedJson;
      }
      
      return JSON.parse(cleanedJson) as ParsedInfo;
    } catch (error) {
      console.error('답변 처리 오류:', error);
      
      // 간단한 필드 업데이트 fallback
      const updatedData = { ...currentData };
      (updatedData as any)[question.field] = answer;
      return updatedData;
    }
  }

  async generatePortfolio(template: string, data: ParsedInfo): Promise<string> {
    try {
      // Mustache를 사용하여 템플릿 렌더링
      const cleanData = this.cleanDataForTemplate(data);
      const rendered = Mustache.render(template, cleanData);
      return rendered;
    } catch (error) {
      console.error('포트폴리오 생성 오류:', error);
      return template;
    }
  }

  async enhancePortfolio(portfolioContent: string): Promise<string> {
    const systemPrompt = `
당신은 실리콘밸리 테크 기업과 국내 대기업의 채용 프로세스를 잘 아는 전문 포트폴리오 컨설턴트입니다.
채용담당자가 15초 안에 후보자의 가치를 파악할 수 있도록 포트폴리오를 최적화하는 것이 목표입니다.

개선 전략:
1. **임팩트 중심 서술**: 모든 경험을 비즈니스 임팩트와 연결
2. **수치화된 성과**: 구체적인 숫자, 증가율, 규모 등으로 성과 강조
3. **키워드 최적화**: 해당 직무의 핵심 키워드를 자연스럽게 배치
4. **차별화 포인트**: 경쟁자 대비 독특한 강점 부각
5. **기술적 깊이**: 단순 나열이 아닌 기술 활용의 맥락과 깊이 표현
6. **스토리텔링**: 성장 과정과 문제 해결 과정을 논리적으로 연결

표현 개선 원칙:
- 수동적 표현 → 능동적 리더십 표현
- 일반적 표현 → 구체적이고 전문적인 표현  
- 작업 나열 → 문제 정의 → 솔루션 → 결과 순서로 구조화
- 기술 스택 → 기술을 통해 해결한 문제와 달성한 성과

마크다운 최적화:
- 스캔하기 쉬운 구조와 시각적 계층
- 핵심 정보가 눈에 띄는 배치
- 적절한 강조와 구분

원본의 사실과 구조는 절대 변경하지 말고, 표현과 구성만 최적화해주세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `다음 포트폴리오를 개선해주세요:\n\n${portfolioContent}` }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content || portfolioContent;
    } catch (error) {
      console.error('포트폴리오 개선 오류:', error);
      return portfolioContent;
    }
  }

  private cleanDataForTemplate(obj: any): any {
    if (obj === null || obj === undefined) {
      return '';
    }
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const cleaned: any = {};
      for (const key in obj) {
        cleaned[key] = this.cleanDataForTemplate(obj[key]);
      }
      return cleaned;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanDataForTemplate(item));
    }
    return obj;
  }
}

export const aiAssistant = new AIPortfolioAssistant();