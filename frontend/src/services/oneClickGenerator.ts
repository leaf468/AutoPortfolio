import OpenAI from 'openai';
import { OrganizedContent } from './aiOrganizer';
import Mustache from 'mustache';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface GenerationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'presentation' | 'document' | 'web' | 'notion';
  format: 'pptx' | 'html' | 'markdown' | 'json';
  template: string;
  styles?: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
    layout: string;
  };
  targetAudience: 'recruiter' | 'technical' | 'executive' | 'general';
}

export interface GenerationOptions {
  templateId: string;
  format: 'pptx' | 'html' | 'markdown' | 'notion-json';
  customStyles?: {
    primaryColor?: string;
    secondaryColor?: string;
    font?: string;
  };
  sections: string[]; // 포함할 섹션들
  length: 'concise' | 'standard' | 'detailed';
  tone: 'professional' | 'creative' | 'technical' | 'friendly';
}

export interface GenerationResult {
  id: string;
  format: string;
  content: string;
  previewUrl?: string;
  downloadUrl: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    estimatedReadTime: number;
    generatedAt: Date;
    template: string;
  };
  qualityScore: number; // 0-100
  suggestions: string[];
}

class OneClickGenerator {
  private templates: GenerationTemplate[] = [
    {
      id: 'modern-dev',
      name: '모던 개발자',
      description: '깔끔하고 기술 중심적인 개발자용 템플릿',
      category: 'presentation',
      format: 'html',
      targetAudience: 'technical',
      template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .hero { background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); color: white; padding: 80px 0; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.2rem; opacity: 0.9; }
        .section { padding: 60px 0; }
        .section:nth-child(even) { background: #f8f9fa; }
        .section h2 { font-size: 2rem; margin-bottom: 2rem; text-align: center; color: {{primaryColor}}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .experience-item, .project-item { margin-bottom: 2rem; }
        .experience-header { display: flex; justify-content: between; align-items: center; margin-bottom: 1rem; }
        .company { font-size: 1.3rem; font-weight: bold; color: {{primaryColor}}; }
        .position { font-size: 1.1rem; color: #666; }
        .duration { font-size: 0.9rem; color: #888; }
        .achievements li { margin: 0.5rem 0; }
        .keywords { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .keyword { background: {{primaryColor}}; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>{{name}}</h1>
            <p>{{oneLinerPitch}}</p>
        </div>
    </div>

    <div class="section">
        <div class="container">
            <h2>About</h2>
            <p style="text-align: center; font-size: 1.1rem; max-width: 800px; margin: 0 auto;">{{summary}}</p>
        </div>
    </div>

    {{#experiences.length}}
    <div class="section">
        <div class="container">
            <h2>Experience</h2>
            {{#experiences}}
            <div class="experience-item">
                <div class="experience-header">
                    <div>
                        <div class="company">{{company}}</div>
                        <div class="position">{{position}}</div>
                    </div>
                    <div class="duration">{{duration}}</div>
                </div>
                <div class="impact">{{impact}}</div>
                <ul class="achievements">
                    {{#achievements}}
                    <li>{{.}}</li>
                    {{/achievements}}
                </ul>
                <div class="keywords">
                    {{#technologies}}
                    <span class="keyword">{{.}}</span>
                    {{/technologies}}
                </div>
            </div>
            {{/experiences}}
        </div>
    </div>
    {{/experiences.length}}

    {{#projects.length}}
    <div class="section">
        <div class="container">
            <h2>Projects</h2>
            <div class="grid">
                {{#projects}}
                <div class="card project-item">
                    <h3>{{name}}</h3>
                    <p>{{summary}}</p>
                    <p><strong>Role:</strong> {{myRole}}</p>
                    <ul class="achievements">
                        {{#achievements}}
                        <li>{{.}}</li>
                        {{/achievements}}
                    </ul>
                    <div class="keywords">
                        {{#technologies}}
                        <span class="keyword">{{.}}</span>
                        {{/technologies}}
                    </div>
                </div>
                {{/projects}}
            </div>
        </div>
    </div>
    {{/projects.length}}

    {{#skills.length}}
    <div class="section">
        <div class="container">
            <h2>Skills</h2>
            <div class="grid">
                {{#skills}}
                <div class="card">
                    <h3>{{category}}</h3>
                    <div class="keywords">
                        {{#skills}}
                        <span class="keyword">{{value}}</span>
                        {{/skills}}
                    </div>
                    <p style="margin-top: 1rem; color: #666;">{{experience}}</p>
                </div>
                {{/skills}}
            </div>
        </div>
    </div>
    {{/skills.length}}
</body>
</html>`,
      styles: {
        primaryColor: '#0168FF',
        secondaryColor: '#00D9FF',
        font: 'Segoe UI',
        layout: 'grid'
      }
    },
    {
      id: 'executive-summary',
      name: '임원용 요약',
      description: '간결하고 임팩트 중심의 1페이지 요약',
      category: 'document',
      format: 'markdown',
      targetAudience: 'executive',
      template: `
# {{name}}
**{{oneLinerPitch}}**

## 핵심 성과
{{#achievements}}
- {{.}}
{{/achievements}}

## 주요 경험
{{#experiences}}
### {{company}} - {{position}}
*{{duration}}*

**Impact:** {{impact}}

**Key Achievements:**
{{#achievements}}
- {{.}}
{{/achievements}}
{{/experiences}}

## 대표 프로젝트
{{#projects}}
### {{name}}
{{summary}}

**Role:** {{myRole}}  
**Impact:** {{impact}}  
{{#metrics}}**Metrics:** {{metrics}}{{/metrics}}
{{/projects}}

## 기술 역량
{{#skills}}
**{{category}}:** {{#skills}}{{value}}{{^last}}, {{/last}}{{/skills}} ({{experience}})  
{{/skills}}

---
*Generated on {{timestamp}}*`,
      styles: {
        primaryColor: '#2C3E50',
        secondaryColor: '#3498DB',
        font: 'serif',
        layout: 'linear'
      }
    }
  ];

  async generatePortfolio(content: OrganizedContent, options: GenerationOptions, customTemplate?: string): Promise<GenerationResult> {
    try {
      console.log('Starting portfolio generation with options:', options);
      console.log('Custom template provided:', !!customTemplate);
      
      let templateToUse;
      let templateName = '';
      
      if (customTemplate) {
        // 사용자 커스텀 템플릿 사용
        templateToUse = {
          id: 'custom',
          name: '사용자 정의 템플릿',
          template: customTemplate,
          format: 'markdown',
          styles: {
            primaryColor: '#0168FF',
            secondaryColor: '#00D9FF'
          }
        };
        templateName = '사용자 정의 템플릿';
      } else {
        // 기본 템플릿 사용
        templateToUse = this.templates.find(t => t.id === options.templateId);
        if (!templateToUse) {
          throw new Error('템플릿을 찾을 수 없습니다.');
        }
        templateName = templateToUse.name;
      }

      // 스타일 적용
      const styles = {
        ...templateToUse.styles,
        ...options.customStyles
      };

      // 콘텐츠 준비
      const templateData = this.prepareTemplateData(content, options, styles);
      console.log('Template data prepared:', templateData);

      let generatedContent: string;

      if (customTemplate) {
        // 커스텀 템플릿은 AI로 처리
        generatedContent = await this.generateWithAI(customTemplate, templateData);
      } else if (templateToUse.format === 'html') {
        generatedContent = this.generateHTML(templateToUse.template, templateData);
      } else if (templateToUse.format === 'markdown') {
        generatedContent = this.generateMarkdown(templateToUse.template, templateData);
      } else if (options.format === 'notion-json') {
        generatedContent = await this.generateNotionJSON(content, templateData);
      } else {
        generatedContent = Mustache.render(templateToUse.template, templateData);
      }

      console.log('Content generated, length:', generatedContent.length);

      // 품질 점수 계산 (에러 시 기본값 사용)
      let qualityScore = 75;
      try {
        qualityScore = await this.calculateQualityScore(generatedContent, content);
      } catch (error) {
        console.error('Quality score calculation failed:', error);
      }
      
      // 개선 제안 생성 (에러 시 기본값 사용)
      let suggestions: string[] = [];
      try {
        suggestions = await this.generateSuggestions(generatedContent, content);
      } catch (error) {
        console.error('Suggestions generation failed:', error);
        suggestions = ['포트폴리오가 성공적으로 생성되었습니다.'];
      }

      const result: GenerationResult = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        format: options.format,
        content: generatedContent,
        downloadUrl: this.createDownloadUrl(generatedContent, options.format),
        metadata: {
          wordCount: this.countWords(generatedContent),
          estimatedReadTime: Math.ceil(this.countWords(generatedContent) / 200),
          generatedAt: new Date(),
          template: templateName
        },
        qualityScore,
        suggestions
      };

      console.log('Portfolio generation complete:', result);
      return result;
    } catch (error) {
      console.error('Portfolio generation error:', error);
      throw error;
    }
  }

  private prepareTemplateData(content: OrganizedContent, options: GenerationOptions, styles: any) {
    // 이름 추출 로직 - 첫 번째 경력에서 추출하거나 기본값 사용
    const name = content.experiences.length > 0 
      ? `${content.experiences[0].position} 개발자`
      : '포트폴리오';
    
    return {
      ...content,
      ...styles,
      name,
      timestamp: new Date().toLocaleDateString('ko-KR'),
      // 추가 헬퍼 함수들
      'experiences.length': content.experiences.length > 0,
      'projects.length': content.projects.length > 0,
      'skills.length': content.skills.length > 0,
      // 각 항목의 last 플래그 추가 (Mustache 템플릿용)
      experiences: content.experiences.map((exp, idx) => ({
        ...exp,
        last: idx === content.experiences.length - 1
      })),
      projects: content.projects.map((proj, idx) => ({
        ...proj,
        last: idx === content.projects.length - 1
      })),
      skills: content.skills.map((skill, idx) => ({
        ...skill,
        skills: skill.skills.map((s, i) => ({
          value: s,
          last: i === skill.skills.length - 1
        })),
        last: idx === content.skills.length - 1
      }))
    };
  }

  private generateHTML(template: string, data: any): string {
    return Mustache.render(template, data);
  }

  private generateMarkdown(template: string, data: any): string {
    return Mustache.render(template, data);
  }

  private async generateWithAI(userTemplate: string, data: any): Promise<string> {
    const systemPrompt = `
사용자가 제공한 포트폴리오 템플릿에 실제 데이터를 채워서 완성된 포트폴리오를 생성하세요.

규칙:
1. 사용자 템플릿의 구조와 스타일을 완전히 유지하세요
2. 템플릿의 플레이스홀더나 예시 텍스트를 실제 데이터로 교체하세요
3. 템플릿에 없는 새로운 섹션이나 스타일을 추가하지 마세요
4. 마크다운 형식을 유지하세요

사용자 템플릿:
${userTemplate}

위 템플릿에 다음 데이터를 채워 넣어주세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `포트폴리오 데이터:\n${JSON.stringify(data, null, 2)}` }
        ],
        temperature: 0.2,
        max_tokens: 3000
      });

      return response.choices[0].message.content || userTemplate;
    } catch (error) {
      console.error('AI template generation error:', error);
      // AI 실패 시 기본 Mustache 렌더링 시도
      try {
        return Mustache.render(userTemplate, data);
      } catch (mustacheError) {
        console.error('Mustache fallback error:', mustacheError);
        return userTemplate; // 최종 fallback
      }
    }
  }

  private async generateNotionJSON(content: OrganizedContent, data: any): Promise<string> {
    const systemPrompt = `
Notion 페이지용 JSON 블록 구조를 생성하세요.
Notion의 block 구조를 따라 heading, paragraph, bulleted_list_item 등을 사용하세요.

JSON 형식:
{
  "object": "block",
  "type": "paragraph", 
  "paragraph": {
    "rich_text": [{"type": "text", "text": {"content": "텍스트"}}]
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `다음 포트폴리오 데이터를 Notion JSON 블록으로 변환해주세요:\n${JSON.stringify(content, null, 2)}` }
        ],
        temperature: 0.2
      });

      return response.choices[0].message.content || '{}';
    } catch (error) {
      console.error('Notion JSON 생성 오류:', error);
      return JSON.stringify({ error: 'Notion JSON 생성에 실패했습니다.' });
    }
  }

  private async calculateQualityScore(generatedContent: string, originalContent: OrganizedContent): Promise<number> {
    const systemPrompt = `
포트폴리오 품질을 0-100점으로 평가하세요.

평가 기준:
1. 완성도 (25점): 필수 정보 포함 정도
2. 가독성 (25점): 구조와 레이아웃의 명확성  
3. 임팩트 (25점): 성과와 결과의 구체성
4. ATS 최적화 (25점): 키워드와 형식의 적절성

숫자만 반환하세요 (예: 85)
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `생성된 포트폴리오:\n${generatedContent}\n\n원본 데이터:\n${JSON.stringify(originalContent, null, 2)}` }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const score = parseInt(response.choices[0].message.content || '70');
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('품질 점수 계산 오류:', error);
      return 70; // 기본값
    }
  }

  private async generateSuggestions(generatedContent: string, originalContent: OrganizedContent): Promise<string[]> {
    const systemPrompt = `
포트폴리오 개선 제안을 3-5개 생성하세요.
실용적이고 구체적인 제안을 해주세요.

JSON 배열 형식으로 반환:
["제안1", "제안2", "제안3"]
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `포트폴리오:\n${generatedContent}` }
        ],
        temperature: 0.4
      });

      const result = response.choices[0].message.content || '[]';
      return JSON.parse(result) as string[];
    } catch (error) {
      console.error('제안 생성 오류:', error);
      return ['더 구체적인 성과 수치를 추가해보세요', '프로젝트 이미지를 포함하면 좋겠습니다'];
    }
  }

  private countWords(content: string): number {
    // HTML 태그 제거 후 단어 수 계산
    const textOnly = content.replace(/<[^>]*>/g, ' ');
    return textOnly.split(/\s+/).filter(word => word.length > 0).length;
  }

  private createDownloadUrl(content: string, format: string): string {
    const blob = new Blob([content], { 
      type: format === 'html' ? 'text/html' : 'text/plain' 
    });
    return URL.createObjectURL(blob);
  }

  getTemplates(): GenerationTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): GenerationTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  async generatePreview(content: OrganizedContent, templateId: string): Promise<string> {
    const template = this.getTemplateById(templateId);
    if (!template) return '';

    const templateData = this.prepareTemplateData(content, {
      templateId,
      format: 'html',
      sections: ['all'],
      length: 'concise',
      tone: 'professional'
    }, template.styles);

    if (template.format === 'html') {
      return this.generateHTML(template.template, templateData);
    } else {
      // 마크다운을 간단한 HTML로 변환
      const markdown = this.generateMarkdown(template.template, templateData);
      return `<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${markdown}</pre>`;
    }
  }
}

export const oneClickGenerator = new OneClickGenerator();