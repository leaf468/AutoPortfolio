import { aiAssistant, ParsedInfo, Question } from './aiService';
import { 
  PortfolioRequest, 
  AssistantResponse, 
  GenerateResponse,
  PortfolioData 
} from '../types/portfolio';

// 백엔드 API 대신 프론트엔드에서 직접 처리
export const portfolioAPI = {
  analyze: async (data: Partial<PortfolioData>): Promise<AssistantResponse> => {
    // 프론트엔드에서 직접 분석
    const missingFields: string[] = [];
    const suggestions: string[] = [];
    
    if (!data.userInfo?.name) missingFields.push('이름');
    if (!data.userInfo?.email) missingFields.push('이메일');
    if (!data.userInfo?.title) missingFields.push('직책');
    
    if (!data.experiences || data.experiences.length === 0) {
      suggestions.push('경력사항을 추가하면 포트폴리오가 더욱 풍성해집니다.');
    }
    
    if (!data.projects || data.projects.length === 0) {
      suggestions.push('프로젝트를 추가하여 실무 능력을 보여주세요.');
    }
    
    return {
      missingFields,
      suggestions,
      isComplete: missingFields.length === 0
    };
  },

  generate: async (request: PortfolioRequest): Promise<GenerateResponse> => {
    // 기본 템플릿 생성
    const template = `# ${request.userInfo.name} - ${request.userInfo.title}

## 연락처
- Email: ${request.userInfo.email}
- Phone: ${request.userInfo.phone || 'N/A'}
- GitHub: ${request.userInfo.github || 'N/A'}
- LinkedIn: ${request.userInfo.linkedin || 'N/A'}

## 소개
${request.userInfo.summary}

## 경력사항
${request.experiences?.map(exp => `
### ${exp.company} - ${exp.position}
${exp.startDate} - ${exp.endDate || '현재'}
${exp.description}
${exp.achievements?.map(ach => `- ${ach}`).join('\n') || ''}
`).join('\n') || '경력사항이 없습니다.'}

## 프로젝트
${request.projects?.map(proj => `
### ${proj.name}
${proj.description}
기술스택: ${proj.technologies?.join(', ') || 'N/A'}
${proj.highlights?.map(h => `- ${h}`).join('\n') || ''}
`).join('\n') || '프로젝트가 없습니다.'}

## 기술스택
${request.skills?.map(skill => `
**${skill.category}**: ${skill.items.join(', ')}
`).join('\n') || '기술스택이 없습니다.'}

## 교육
${request.education?.map(edu => `
### ${edu.school || edu.institution || '학교명'}
${edu.degree} - ${edu.field || ''}
${edu.startDate || ''} - ${edu.endDate || '현재'}
`).join('\n') || '교육사항이 없습니다.'}`;

    const enhanced = await aiAssistant.enhancePortfolio(template);
    
    return {
      portfolioId: `portfolio_${Date.now()}`,
      formats: {
        markdown: enhanced,
        html: `<html><body>${enhanced.replace(/\n/g, '<br>')}</body></html>`,
        pdf: null
      }
    };
  },

  // 새로운 AI 기반 API들
  parseText: async (data: { template: string; rawText: string }) => {
    try {
      // 템플릿에서 변수 추출
      const templateVariables = await aiAssistant.extractTemplateVariables(data.template);
      
      // 텍스트 파싱
      const parsedData = await aiAssistant.parseRawText(data.rawText, templateVariables);
      
      // 부족한 필드 식별
      const missingFields = await aiAssistant.identifyMissingInfo(parsedData, templateVariables);
      
      return {
        success: true,
        parsed_data: parsedData,
        missing_fields: missingFields,
        template_variables: templateVariables
      };
    } catch (error) {
      console.error('Parse text error:', error);
      return {
        success: false,
        parsed_data: {},
        missing_fields: [],
        template_variables: []
      };
    }
  },

  generateQuestions: async (data: { missing_fields: string[]; context: any }) => {
    try {
      const questions = await aiAssistant.generateQuestions(data.missing_fields, data.context);
      
      return {
        questions: questions,
        is_complete: questions.length === 0
      };
    } catch (error) {
      console.error('Generate questions error:', error);
      return {
        questions: [],
        is_complete: true
      };
    }
  },

  processAnswer: async (data: { question: any; answer: string; current_data: any }) => {
    try {
      const updatedData = await aiAssistant.processUserAnswer(
        data.question,
        data.answer,
        data.current_data
      );
      
      return {
        success: true,
        updated_data: updatedData
      };
    } catch (error) {
      console.error('Process answer error:', error);
      return {
        success: false,
        updated_data: data.current_data
      };
    }
  },

  generateFromTemplate: async (data: { template: string; data: any }): Promise<GenerateResponse> => {
    try {
      const portfolio = await aiAssistant.generatePortfolio(data.template, data.data);
      const enhanced = await aiAssistant.enhancePortfolio(portfolio);
      
      return {
        portfolioId: `portfolio_${Date.now()}`,
        formats: {
          markdown: enhanced,
          html: `<html><body>${enhanced.replace(/\n/g, '<br>')}</body></html>`,
          pdf: null
        }
      };
    } catch (error) {
      console.error('Generate from template error:', error);
      return {
        portfolioId: '',
        formats: {
          markdown: '',
          html: '',
          pdf: null
        }
      };
    }
  },

  download: (portfolioId: string) => {
    // 로컬 스토리지에서 다운로드
    const data = localStorage.getItem(portfolioId);
    if (data) {
      const blob = new Blob([data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      return url;
    }
    return '';
  },

  preview: (portfolioId: string) => {
    // 로컬 스토리지에서 미리보기
    const data = localStorage.getItem(portfolioId);
    return data || '';
  },

  getTemplates: async () => {
    // 기본 템플릿 반환
    return [
      {
        id: 'default',
        name: '기본 템플릿',
        content: `# {{name}} - {{title}}

## 연락처
- Email: {{email}}
- Phone: {{phone}}
- GitHub: {{github}}
- LinkedIn: {{linkedin}}

## 소개
{{summary}}

## 경력사항
{{#experiences}}
### {{company}} - {{position}}
{{startDate}} - {{endDate}}
{{description}}
{{#achievements}}
- {{.}}
{{/achievements}}
{{/experiences}}

## 프로젝트
{{#projects}}
### {{name}}
{{description}}
기술스택: {{#technologies}}{{.}} {{/technologies}}
{{#highlights}}
- {{.}}
{{/highlights}}
{{/projects}}

## 기술스택
{{#skills}}
**{{category}}**: {{#items}}{{.}} {{/items}}
{{/skills}}

## 교육
{{#education}}
### {{school}}
{{degree}} - {{field}}
{{startDate}} - {{endDate}}
{{/education}}`
      }
    ];
  },

  chat: async (message: string, context?: any): Promise<AssistantResponse> => {
    // 간단한 챗봇 응답
    const suggestions = [
      '경력사항을 더 구체적으로 작성해보세요.',
      '프로젝트의 성과를 수치로 표현하면 좋습니다.',
      '사용한 기술스택을 상세히 설명해주세요.'
    ];
    
    return {
      missingFields: [],
      suggestions: [suggestions[Math.floor(Math.random() * suggestions.length)]],
      isComplete: false
    };
  },
};

export default portfolioAPI;