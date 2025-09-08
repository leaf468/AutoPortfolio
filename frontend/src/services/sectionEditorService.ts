import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

// 섹션 타입 정의
export interface Section {
  section_id: string;
  doc_id: string;
  title: string;
  current_text: string;
  original_text: string;
  history: SectionHistory[];
  required: boolean;
  type: 'experience' | 'project' | 'skill' | 'achievement' | 'summary';
}

export interface SectionHistory {
  timestamp: string;
  user_id?: string;
  action: 'suggest_apply' | 'manual_edit' | 'revert';
  text: string;
  source?: string; // 'user' | 'ai_suggestion'
}

// 추천 문구 타입
export interface Suggestion {
  suggestion_id: string;
  section_id: string;
  text: string;
  tone: 'formal' | 'concise' | 'impact' | 'STAR' | 'ATS' | 'technical' | 'structured' | 'professional';
  reason: string;
  confidence: number;
  hasPlaceholder?: boolean; // 숫자 입력 필요 여부
}

// 추천 요청 파라미터
export interface SuggestionRequest {
  section_id: string;
  current_text: string;
  section_type?: string;
  content?: string;
  role?: string;
  target_job?: string;
  locale?: 'ko-KR' | 'en-US';
  tone_preferences?: string[];
}

// 추천 응답
export interface SuggestionResponse {
  suggestions: Suggestion[];
  metadata?: {
    processing_time?: number;
    model_used?: string;
  };
}

class SectionEditorService {
  private sections: Map<string, Section> = new Map();
  private cachedSuggestions: Map<string, SuggestionResponse> = new Map();

  // 포트폴리오를 섹션별로 분할 (마크다운 및 HTML 지원)
  parsePortfolioIntoSections(content: string, docId: string): Section[] {
    console.log('Parsing portfolio content:', content);
    const sections: Section[] = [];
    
    // 먼저 마크다운 형태인지 확인
    if (content.includes('#') || content.includes('##') || content.includes('###')) {
      // 마크다운 파싱
      console.log('Detected markdown format, using markdown parsing');
      return this.parseMarkdownContent(content, docId);
    }
    
    // HTML 태그를 기준으로 섹션 분할
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // HTML 파싱 로직 (기존 코드)
    // 1. 요약 섹션 파싱
    const heroElem = doc.querySelector('.hero p');
    if (heroElem && heroElem.textContent?.trim()) {
      const section: Section = {
        section_id: 'summary_main',
        doc_id: docId,
        title: '전문 요약',
        current_text: heroElem.textContent.trim(),
        original_text: heroElem.textContent.trim(),
        history: [],
        required: true,
        type: 'summary'
      };
      sections.push(section);
      this.sections.set('summary_main', section);
    }
    
    // About 섹션 찾기
    const aboutSection = doc.querySelector('h2');
    if (aboutSection?.textContent?.includes('About')) {
      const aboutContent = aboutSection.nextElementSibling;
      if (aboutContent && aboutContent.textContent?.trim()) {
        const section: Section = {
          section_id: 'about_main',
          doc_id: docId,
          title: '소개',
          current_text: aboutContent.textContent.trim(),
          original_text: aboutContent.textContent.trim(),
          history: [],
          required: true,
          type: 'summary'
        };
        sections.push(section);
        this.sections.set('about_main', section);
      }
    }

    // 2. 경험 섹션 파싱
    const experienceElements = doc.querySelectorAll('.experience-item');
    console.log('Found experience elements:', experienceElements.length);
    
    experienceElements.forEach((elem, idx) => {
      const companyElem = elem.querySelector('.company');
      const positionElem = elem.querySelector('.position');
      const impactElem = elem.querySelector('.impact');
      const achievementsList = elem.querySelector('.achievements');
      
      if (companyElem || positionElem) {
        const company = companyElem?.textContent?.trim() || `회사 ${idx + 1}`;
        const position = positionElem?.textContent?.trim() || '직책';
        const impact = impactElem?.textContent?.trim() || '';
        const achievements = achievementsList?.textContent?.trim() || '';
        
        const combinedText = [impact, achievements].filter(t => t).join('\n');
        
        const sectionId = `exp_${idx}`;
        const section: Section = {
          section_id: sectionId,
          doc_id: docId,
          title: `${company} - ${position}`,
          current_text: combinedText,
          original_text: combinedText,
          history: [],
          required: true,
          type: 'experience'
        };
        sections.push(section);
        this.sections.set(sectionId, section);
      }
    });

    // 3. 프로젝트 섹션 파싱
    const projectElements = doc.querySelectorAll('.project-item, .card');
    console.log('Found project elements:', projectElements.length);
    
    projectElements.forEach((elem, idx) => {
      const nameElem = elem.querySelector('h3');
      const summaryElems = elem.querySelectorAll('p');
      const achievementsList = elem.querySelector('.achievements');
      
      if (nameElem) {
        const name = nameElem.textContent?.trim() || `프로젝트 ${idx + 1}`;
        const summaries = Array.from(summaryElems)
          .map(p => p.textContent?.trim())
          .filter(t => t && !t.includes('Role:'));
        const achievements = achievementsList?.textContent?.trim() || '';
        
        const combinedText = [...summaries, achievements].filter(t => t).join('\n');
        
        if (combinedText) {
          const sectionId = `proj_${idx}`;
          const section: Section = {
            section_id: sectionId,
            doc_id: docId,
            title: name,
            current_text: combinedText,
            original_text: combinedText,
            history: [],
            required: true,
            type: 'project'
          };
          sections.push(section);
          this.sections.set(sectionId, section);
        }
      }
    });
    
    // 4. 전체 텍스트에서 섹션 추출 (백업)
    if (sections.length === 0) {
      console.log('No sections found with CSS selectors, trying text-based parsing');
      return this.parseTextContent(content, docId);
    }

    console.log('Parsed sections:', sections.length, sections);
    return sections;
  }
  
  // 마크다운 내용 파싱
  private parseMarkdownContent(content: string, docId: string): Section[] {
    const sections: Section[] = [];
    const lines = content.split('\n');
    let currentSection: { title: string; content: string[]; type: 'summary' | 'experience' | 'project' | 'skill' | 'achievement' } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        // 메인 제목 - 일반적으로 이름이나 전체 제목
        if (currentSection) {
          this.addSectionFromMarkdown(sections, currentSection, docId);
        }
        currentSection = {
          title: line.substring(2).trim() || '포트폴리오',
          content: [],
          type: 'summary'
        };
      } else if (line.startsWith('## ')) {
        // 섹션 제목
        if (currentSection) {
          this.addSectionFromMarkdown(sections, currentSection, docId);
        }
        const sectionTitle = line.substring(3).trim();
        let sectionType: 'summary' | 'experience' | 'project' | 'skill' | 'achievement' = 'summary';
        
        // 섹션 타입 추론
        if (sectionTitle.includes('경력') || sectionTitle.includes('경험') || sectionTitle.includes('Experience') || sectionTitle.includes('Work')) {
          sectionType = 'experience';
        } else if (sectionTitle.includes('프로젝트') || sectionTitle.includes('Project')) {
          sectionType = 'project';
        } else if (sectionTitle.includes('기술') || sectionTitle.includes('스킬') || sectionTitle.includes('Skills')) {
          sectionType = 'skill';
        } else if (sectionTitle.includes('성과') || sectionTitle.includes('Achievement')) {
          sectionType = 'achievement';
        }
        
        currentSection = {
          title: sectionTitle,
          content: [],
          type: sectionType
        };
      } else if (line.startsWith('### ')) {
        // 하위 제목 - 새로운 섹션으로 처리
        if (currentSection) {
          this.addSectionFromMarkdown(sections, currentSection, docId);
        }
        currentSection = {
          title: line.substring(4).trim(),
          content: [],
          type: 'project' // 보통 프로젝트나 경험의 세부사항
        };
      } else if (line && currentSection) {
        // 내용 추가
        currentSection.content.push(line);
      } else if (line && !currentSection) {
        // 제목 없이 시작하는 내용 - 요약으로 처리
        if (!currentSection) {
          currentSection = {
            title: '소개',
            content: [],
            type: 'summary'
          };
        }
        currentSection.content.push(line);
      }
    }
    
    // 마지막 섹션 추가
    if (currentSection) {
      this.addSectionFromMarkdown(sections, currentSection, docId);
    }
    
    console.log('Markdown parsing result:', sections.length, sections);
    return sections;
  }
  
  // 마크다운 섹션을 Section 객체로 변환
  private addSectionFromMarkdown(sections: Section[], mdSection: { title: string; content: string[]; type: 'summary' | 'experience' | 'project' | 'skill' | 'achievement' }, docId: string): void {
    if (mdSection.content.length === 0) return;
    
    const combinedText = mdSection.content.join('\n').trim();
    if (!combinedText) return;
    
    const sectionId = `${mdSection.type}_${sections.length}`;
    const section: Section = {
      section_id: sectionId,
      doc_id: docId,
      title: mdSection.title,
      current_text: combinedText,
      original_text: combinedText,
      history: [],
      required: true,
      type: mdSection.type
    };
    
    sections.push(section);
    this.sections.set(sectionId, section);
  }
  
  // 텍스트 내용 파싱 (백업용)
  private parseTextContent(content: string, docId: string): Section[] {
    const sections: Section[] = [];
    const fullText = content.replace(/<[^>]*>/g, ''); // HTML 태그 제거
    const paragraphs = fullText.split('\n').filter(p => p.trim().length > 20);
    
    paragraphs.forEach((paragraph, idx) => {
      if (paragraph.trim()) {
        const sectionId = `text_${idx}`;
        const section: Section = {
          section_id: sectionId,
          doc_id: docId,
          title: `내용 ${idx + 1}`,
          current_text: paragraph.trim(),
          original_text: paragraph.trim(),
          history: [],
          required: true,
          type: 'summary'
        };
        sections.push(section);
        this.sections.set(sectionId, section);
      }
    });
    
    return sections;
  }

  // LLM에게 추천 문구 요청
  async getSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    // 캐시 확인
    const cacheKey = `${request.section_id}_${request.current_text}`;
    if (this.cachedSuggestions.has(cacheKey)) {
      return this.cachedSuggestions.get(cacheKey)!;
    }

    const systemPrompt = `You are a Portfolio Writing Expert. Generate improved portfolio content.

CRITICAL JSON RULES:
1. Return ONLY valid JSON - no markdown, no backticks, no extra text
2. Use simple ASCII characters only - no special unicode
3. Keep text under 500 characters per suggestion
4. Use double quotes for all strings
5. Escape quotes inside strings as \\"

JSON Format (copy exactly):
{"suggestions":[{"id":"s1","text":"content here","tone":"impact","reason":"why improved","confidence":0.9}]}

Text Guidelines:
- Add specific numbers and percentages
- Include technical details
- Show measurable business impact
- Use Korean language
- Structure: Problem-Solution-Result

Example:
Before: "성능을 개선했습니다"
After: "Redis 캐시와 DB 최적화로 응답속도를 65% 향상시켜 고객 만족도 20% 증가"`;

    const userPrompt = `Section: ${this.sections.get(request.section_id)?.title || 'Portfolio'}
Role: ${request.role || 'Developer'}

Current text:
${request.current_text.substring(0, 300)}

Generate 3 improved versions with specific metrics and technical details.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      });

      const result = response.choices[0].message.content || '{}';
      console.log('Raw AI response:', result);
      let cleanedResult = result;
      
      // JSON 추출
      if (result.includes('```json')) {
        const match = result.match(/```json\n([\s\S]*?)\n```/);
        cleanedResult = match ? match[1] : result;
      } else if (result.includes('```')) {
        const match = result.match(/```\n([\s\S]*?)\n```/);
        cleanedResult = match ? match[1] : result;
      }

      // 더 강력한 JSON 정리
      const parsed = this.parseJSONSafely(cleanedResult, result, request.section_id);
      
      // suggestion_id 추가 및 placeholder 체크
      const suggestions = parsed.suggestions.map((s: any, idx: number) => ({
        ...s,
        suggestion_id: `${request.section_id}_sug_${idx}`,
        section_id: request.section_id,
        hasPlaceholder: s.text.includes('{') && s.text.includes('}')
      }));

      const suggestionResponse: SuggestionResponse = {
        suggestions,
        metadata: {
          processing_time: Date.now(),
          model_used: 'gpt-4'
        }
      };

      // 캐시 저장 (5분 TTL)
      this.cachedSuggestions.set(cacheKey, suggestionResponse);
      setTimeout(() => this.cachedSuggestions.delete(cacheKey), 5 * 60 * 1000);

      return suggestionResponse;
    } catch (error) {
      console.error('Suggestion generation error:', error);
      
      // 개선된 폴백 시스템 - 섹션 유형별 맞춤 제안
      const createSmartFallback = () => {
        const currentText = request.current_text || request.content || '';
        const sectionType = request.section_type || this.sections.get(request.section_id)?.type || '';
        const baseId = request.section_id;
        
        // 경력 섹션인 경우
        if (sectionType.includes('experience') || sectionType.includes('경력')) {
          return [
            {
              suggestion_id: `${baseId}_exp_impact`,
              section_id: baseId,
              text: `${currentText}\n\n**주요 성과:**\n• 성능 개선: [구체적 %] 향상\n• 비용 절감: 월 [금액]만원 절약\n• 사용자 영향: [수치]명 사용자 경험 개선\n\n**기술 스택:** React, Node.js, PostgreSQL, AWS`,
              tone: 'impact' as const,
              reason: '정량적 성과와 기술적 세부사항 추가',
              confidence: 0.85
            },
            {
              suggestion_id: `${baseId}_exp_star`,
              section_id: baseId,
              text: `**상황:** ${currentText.split('.')[0] || '회사 또는 프로젝트 배경'}\n**과제:** [해결해야 할 문제점 명시]\n**행동:** [구체적 수행 내용과 사용 기술]\n**결과:** 성능 20% 향상, 비용 30% 절감, DAU 15% 증가`,
              tone: 'structured' as const,
              reason: 'STAR 기법으로 체계적 재구성',
              confidence: 0.9
            }
          ];
        }
        
        // 프로젝트 섹션인 경우
        if (sectionType.includes('project') || sectionType.includes('프로젝트')) {
          return [
            {
              suggestion_id: `${baseId}_proj_detailed`,
              section_id: baseId,
              text: `#### ${currentText.split('\n')[0] || '프로젝트명'}\n\n**개발 기간:** 2023.03 ~ 2023.08 (6개월)\n**팀 구성:** 프론트엔드 2명, 백엔드 2명\n**내 역할:** 풀스택 개발자\n\n**주요 기능:**\n${currentText}\n\n**기술 스택:**\n• Frontend: React, TypeScript, Tailwind CSS\n• Backend: Node.js, Express, MongoDB\n• 배포: AWS EC2, S3, CloudFront\n\n**성과 지표:**\n• 로딩 속도 40% 개선\n• 사용자 만족도 4.2/5.0 달성\n• 월간 액티브 사용자 500명 돌파`,
              tone: 'technical' as const,
              reason: '기술적 세부사항과 측정 가능한 성과 추가',
              confidence: 0.88
            }
          ];
        }
        
        // 기본 제안 (어떤 섹션이든)
        return [
          {
            suggestion_id: `${baseId}_enhanced`,
            section_id: baseId,
            text: `${currentText}\n\n**추가된 구체적 정보:**\n• 정량적 성과: [수치]% 향상/감소\n• 기술적 도구: [사용한 기술/도구]\n• 비즈니스 영향: [사용자/매출/효율성 개선]\n• 협업 범위: [팀 규모]에서 [역할] 담당`,
            tone: 'impact' as const,
            reason: '구체성과 비즈니스 가치 강화',
            confidence: 0.8
          },
          {
            suggestion_id: `${baseId}_keywords`,
            section_id: baseId,
            text: `${currentText.trim()}\n\n하이라이트된 키워드: **데이터 분석**, **성능 최적화**, **사용자 경험**, **협업**, **문제 해결**`,
            tone: 'professional' as const,
            reason: '산업 키워드 및 ATS 최적화',
            confidence: 0.75
          }
        ];
      };
      
      return { suggestions: createSmartFallback() };
    }
  }

  // 추천 문구 적용
  applySuggestion(sectionId: string, suggestionText: string): void {
    const section = this.sections.get(sectionId);
    if (!section) return;

    // 히스토리 저장
    section.history.push({
      timestamp: new Date().toISOString(),
      action: 'suggest_apply',
      text: section.current_text,
      source: 'ai_suggestion'
    });

    // 텍스트 업데이트
    section.current_text = suggestionText;
    this.sections.set(sectionId, section);
  }

  // 수동 편집
  manualEdit(sectionId: string, newText: string): void {
    const section = this.sections.get(sectionId);
    if (!section) return;

    // 히스토리 저장
    section.history.push({
      timestamp: new Date().toISOString(),
      action: 'manual_edit',
      text: section.current_text,
      source: 'user'
    });

    // 텍스트 업데이트
    section.current_text = newText;
    this.sections.set(sectionId, section);
  }

  // 되돌리기
  revertSection(sectionId: string): void {
    const section = this.sections.get(sectionId);
    if (!section || section.history.length === 0) return;

    // 마지막 히스토리에서 이전 텍스트 복원
    const lastHistory = section.history.pop();
    if (lastHistory) {
      section.current_text = lastHistory.text;
      this.sections.set(sectionId, section);
    }
  }

  // 원본으로 되돌리기
  revertToOriginal(sectionId: string): void {
    const section = this.sections.get(sectionId);
    if (!section) return;

    section.history.push({
      timestamp: new Date().toISOString(),
      action: 'revert',
      text: section.current_text,
      source: 'user'
    });

    section.current_text = section.original_text;
    this.sections.set(sectionId, section);
  }

  // 전체 문서 조합 (개선된 디자인 템플릿 사용)
  buildFinalDocument(): string {
    const sections = Array.from(this.sections.values());
    
    // 섹션 타입별로 그룹화
    const experiences = sections.filter(s => s.type === 'experience');
    const projects = sections.filter(s => s.type === 'project');
    const skills = sections.filter(s => s.type === 'skill');
    // const achievements = sections.filter(s => s.type === 'achievement');
    const summaries = sections.filter(s => s.type === 'summary');
    
    // 기본 정보 추출
    const mainSummary = summaries[0];
    const profileName = this.extractNameFromSections(sections);
    const profileTitle = this.extractTitleFromSections(sections);
    
    // 개선된 HTML 템플릿 사용
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profileName} - ${profileTitle}</title>
    <style>
        /* 리셋 및 기본 설정 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
            line-height: 1.75;
            color: #2d3748;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            font-size: 16px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 920px;
            margin: 0 auto;
            padding: 0 32px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            min-height: 100vh;
        }
        
        /* 타이포그래피 */
        h1, h2, h3, h4 {
            font-weight: 700;
            color: #1a202c;
            letter-spacing: -0.025em;
        }
        
        h1 { 
            font-size: 3rem; 
            line-height: 1.2; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        h2 { 
            font-size: 1.875rem; 
            line-height: 1.3; 
            color: #2d3748;
            margin-bottom: 1.5rem;
        }
        h3 { 
            font-size: 1.375rem; 
            line-height: 1.4; 
            color: #4a5568;
            margin-bottom: 1rem;
        }
        h4 {
            font-size: 1.125rem;
            color: #2d3748;
            margin-bottom: 0.75rem;
        }
        
        p {
            margin-bottom: 1.25rem;
            color: #4a5568;
            line-height: 1.8;
        }
        
        /* 헤더 */
        .header {
            padding: 80px 0 70px;
            text-align: center;
            position: relative;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        
        .header h1 {
            margin-bottom: 1rem;
        }
        
        .subtitle {
            font-size: 1.25rem;
            color: #718096;
            margin-bottom: 2rem;
            font-weight: 500;
            letter-spacing: 0.025em;
        }
        
        /* 섹션 공통 */
        .section {
            padding: 60px 0;
            position: relative;
        }
        
        .section:not(:last-child)::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        }
        
        .section-title {
            font-size: 1.75rem;
            margin-bottom: 2.5rem;
            color: #1a202c;
            position: relative;
            display: flex;
            align-items: center;
            font-weight: 700;
        }
        
        .section-title::before {
            content: '';
            width: 6px;
            height: 6px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin-right: 16px;
            flex-shrink: 0;
        }
        
        .section-title::after {
            content: '';
            flex: 1;
            height: 2px;
            background: linear-gradient(90deg, rgba(102, 126, 234, 0.3), transparent);
            margin-left: 20px;
            border-radius: 1px;
        }
        
        /* About 섹션 */
        .about-content {
            font-size: 1.125rem;
            line-height: 1.9;
            max-width: 750px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
            padding: 2rem;
            border-radius: 12px;
            border-left: 4px solid;
            border-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }
        
        /* Experience 섹션 */
        .experience-item {
            margin-bottom: 3.5rem;
            background: white;
            border-radius: 16px;
            padding: 2.5rem;
            position: relative;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #f1f5f9;
            transition: all 0.3s ease;
        }
        
        .experience-item:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        
        .experience-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px 16px 0 0;
        }
        
        .experience-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .company-info h3 {
            margin-bottom: 0.5rem;
            color: #1a202c;
            font-size: 1.5rem;
        }
        
        .position {
            color: #667eea;
            font-size: 1.125rem;
            font-weight: 600;
        }
        
        .duration {
            color: #718096;
            font-size: 1rem;
            font-weight: 500;
            background: #f7fafc;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            white-space: nowrap;
        }
        
        .impact {
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1.5rem;
            font-size: 1.125rem;
            line-height: 1.6;
        }
        
        .achievements {
            list-style: none;
            margin-left: 0;
            space-y: 0.75rem;
        }
        
        .achievements li {
            position: relative;
            padding-left: 2rem;
            margin-bottom: 0.75rem;
            color: #4a5568;
            line-height: 1.7;
            font-size: 1rem;
        }
        
        .achievements li::before {
            content: '✦';
            position: absolute;
            left: 0;
            top: 0.25rem;
            color: #667eea;
            font-size: 0.875rem;
            font-weight: bold;
        }
        
        .tech-tags {
            margin-top: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        
        .tech-tag {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            color: #553c9a;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            border: 1px solid rgba(102, 126, 234, 0.2);
            transition: all 0.2s ease;
        }
        
        .tech-tag:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
            transform: translateY(-1px);
        }
        
        /* Projects 섹션 */
        .projects-grid {
            display: grid;
            gap: 2.5rem;
        }
        
        .project-item {
            background: white;
            border-radius: 16px;
            padding: 2.5rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #f1f5f9;
        }
        
        .project-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.01) 0%, rgba(118, 75, 162, 0.01) 100%);
            z-index: -1;
        }
        
        .project-item:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        
        .project-header {
            margin-bottom: 1.5rem;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 1rem;
        }
        
        .project-title {
            color: #1a202c;
            margin-bottom: 0.5rem;
            font-size: 1.375rem;
            font-weight: 700;
        }
        
        .project-role {
            color: #667eea;
            font-size: 1rem;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        .project-period {
            color: #718096;
            font-size: 0.875rem;
            background: #f7fafc;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            display: inline-block;
        }
        
        .project-description {
            margin-bottom: 2rem;
            color: #4a5568;
            line-height: 1.8;
            font-size: 1rem;
        }
        
        /* Skills 섹션 */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
        }
        
        .skill-category {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            position: relative;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #f1f5f9;
            transition: all 0.3s ease;
        }
        
        .skill-category::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px 16px 0 0;
        }
        
        .skill-category:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        
        .skill-category h3 {
            color: #1a202c;
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
        }
        
        .skill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        
        .skill-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.2s ease;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .skill-item:hover {
            transform: translateY(-1px) scale(1.05);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        
        .skill-description {
            color: #4a5568;
            font-size: 0.95rem;
            line-height: 1.7;
        }
        
        /* 편집됨 표시 */
        .edited {
            background: linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%);
            border-left: 4px solid;
            border-image: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%) 1;
            padding: 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 12px 12px 0;
            position: relative;
        }
        
        .edited::before {
            content: '✨';
            position: absolute;
            left: -2px;
            top: 1rem;
            font-size: 1.25rem;
            background: white;
            padding: 0.25rem;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .edited-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
            color: white;
            font-size: 0.75rem;
            padding: 0.5rem 0.875rem;
            border-radius: 16px;
            margin-left: 0.75rem;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .edited-badge::before {
            content: '✏️';
            margin-right: 0.25rem;
        }
        
        /* 프린트 스타일 */
        @media print {
            body {
                background: white;
                color: #000;
                font-size: 12pt;
                line-height: 1.4;
            }
            
            .container {
                box-shadow: none;
                border: none;
            }
            
            .section {
                page-break-inside: avoid;
                padding: 20pt 0;
            }
            
            .experience-item, .project-item, .skill-category {
                box-shadow: none;
                border: 1px solid #ddd;
                page-break-inside: avoid;
            }
            
            .edited-badge {
                display: none;
            }
            
            h1 {
                color: #000 !important;
                -webkit-text-fill-color: #000 !important;
            }
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
            .container {
                padding: 0 20px;
                margin: 0;
                border-radius: 0;
            }
            
            h1 {
                font-size: 2.25rem;
            }
            
            h2 {
                font-size: 1.5rem;
            }
            
            .header {
                padding: 60px 0 50px;
            }
            
            .section {
                padding: 50px 0;
            }
            
            .section-title {
                font-size: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .experience-item, .project-item, .skill-category {
                padding: 1.5rem;
            }
            
            .experience-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
            
            .duration, .project-period {
                margin-top: 0.5rem;
                align-self: flex-start;
            }
            
            .tech-tags {
                gap: 0.5rem;
            }
            
            .tech-tag {
                font-size: 0.8rem;
                padding: 0.375rem 0.75rem;
            }
            
            .skills-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 0 16px;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .header {
                padding: 40px 0 30px;
            }
            
            .section {
                padding: 40px 0;
            }
            
            .experience-item, .project-item, .skill-category {
                padding: 1.25rem;
            }
            
            .about-content {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <h1>${profileName}</h1>
            <div class="subtitle">${profileTitle}</div>
        </div>
    </header>
    
    ${mainSummary ? `
    <!-- About -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">About</h2>
            <div class="about-content ${mainSummary.current_text !== mainSummary.original_text ? 'edited' : ''}">
                <p>${this.formatText(mainSummary.current_text)}</p>
                ${mainSummary.current_text !== mainSummary.original_text ? '<span class="edited-badge">AI 개선됨</span>' : ''}
            </div>
        </div>
    </section>` : ''}
    
    ${experiences.length > 0 ? `
    <!-- Experience -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">Experience</h2>
            ${experiences.map((exp, idx) => `
            <div class="experience-item ${exp.current_text !== exp.original_text ? 'edited' : ''}">
                <div class="experience-header">
                    <div class="company-info">
                        <h3>${exp.title}${exp.current_text !== exp.original_text ? '<span class="edited-badge">AI 개선됨</span>' : ''}</h3>
                    </div>
                </div>
                <div class="impact">
                    ${this.formatText(exp.current_text)}
                </div>
            </div>`).join('')}
        </div>
    </section>` : ''}
    
    ${projects.length > 0 ? `
    <!-- Projects -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">Projects</h2>
            <div class="projects-grid">
                ${projects.map(proj => `
                <div class="project-item ${proj.current_text !== proj.original_text ? 'edited' : ''}">
                    <div class="project-header">
                        <h3 class="project-title">${proj.title}${proj.current_text !== proj.original_text ? '<span class="edited-badge">AI 개선됨</span>' : ''}</h3>
                    </div>
                    <p class="project-description">
                        ${this.formatText(proj.current_text)}
                    </p>
                </div>`).join('')}
            </div>
        </div>
    </section>` : ''}
    
    ${skills.length > 0 ? `
    <!-- Skills -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                ${skills.map(skill => `
                <div class="skill-category ${skill.current_text !== skill.original_text ? 'edited' : ''}">
                    <h3>${skill.title}${skill.current_text !== skill.original_text ? '<span class="edited-badge">AI 개선됨</span>' : ''}</h3>
                    <div class="skill-description">
                        ${this.formatText(skill.current_text)}
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>` : ''}

</body>
</html>`;
  }
  
  // 이름 추출 헬퍼
  private extractNameFromSections(sections: Section[]): string {
    const summaries = sections.filter(s => s.type === 'summary');
    if (summaries.length > 0) {
      const text = summaries[0].current_text;
      // 이름 패턴 찾기 (예: 김개발, Kim Developer 등)
      const nameMatch = text.match(/([가-힣]{2,4}|[A-Z][a-z]+\s[A-Z][a-z]+)/);
      if (nameMatch) {
        return nameMatch[1];
      }
    }
    return '포트폴리오 개발자';
  }
  
  // 직책 추출 헬퍼
  private extractTitleFromSections(sections: Section[]): string {
    const summaries = sections.filter(s => s.type === 'summary');
    const experiences = sections.filter(s => s.type === 'experience');
    
    // 경험에서 추출
    if (experiences.length > 0) {
      const expTitle = experiences[0].title;
      if (expTitle.includes('개발자') || expTitle.includes('Developer')) {
        return expTitle.split(' - ')[1] || '개발자';
      }
    }
    
    // 요약에서 추출
    if (summaries.length > 0) {
      const text = summaries[0].current_text;
      if (text.includes('백엔드') || text.includes('Backend')) {
        return 'Backend Developer';
      } else if (text.includes('프론트엔드') || text.includes('Frontend')) {
        return 'Frontend Developer';
      } else if (text.includes('풀스택') || text.includes('Full Stack')) {
        return 'Full Stack Developer';
      }
    }
    
    return '소프트웨어 개발자';
  }
  
  // 텍스트 포맷팅 헬퍼
  private formatText(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  // 변경 사항 요약
  getChangeSummary(): { totalChanges: number; sections: string[] } {
    let totalChanges = 0;
    const changedSections: string[] = [];

    this.sections.forEach((section, id) => {
      if (section.current_text !== section.original_text) {
        totalChanges++;
        changedSections.push(section.title);
      }
    });

    return { totalChanges, sections: changedSections };
  }

  // 섹션 가져오기
  getSection(sectionId: string): Section | undefined {
    return this.sections.get(sectionId);
  }

  // 모든 섹션 가져오기
  getAllSections(): Section[] {
    return Array.from(this.sections.values());
  }

  // 안전한 JSON 파싱
  private parseJSONSafely(cleanedResult: string, originalResult: string, sectionId: string): any {
    console.log('Attempting to parse JSON:', cleanedResult.substring(0, 200) + '...');
    
    // 1단계: 기본 파싱 시도
    try {
      return JSON.parse(cleanedResult);
    } catch (error) {
      console.error('First JSON parsing failed:', error);
    }

    // 2단계: 강력한 문자열 정리 및 파싱 시도  
    try {
      let fixed = this.fixJSONString(cleanedResult);
      return JSON.parse(fixed);
    } catch (error) {
      console.error('Second JSON parsing failed:', error);
    }

    // 3단계: 정규식으로 개별 필드 추출
    try {
      const suggestions = this.extractSuggestionsFromText(originalResult, sectionId);
      if (suggestions.length > 0) {
        return { suggestions };
      }
    } catch (error) {
      console.error('Field extraction failed:', error);
    }

    // 4단계: 최종 폴백 - 섹션별 기본 추천
    console.log('Using fallback suggestions for section:', sectionId);
    return {
      suggestions: this.getFallbackSuggestionsByType(sectionId)
    };
  }

  // 텍스트에서 추천 내용 추출
  private extractSuggestionsFromText(text: string, sectionId: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // text 필드 추출 시도
    const textMatches = text.match(/"text":\s*"([^"]*(?:\\"[^"]*)*)"/g);
    if (textMatches) {
      textMatches.forEach((match, idx) => {
        const textContent = match.replace(/"text":\s*"/, '').replace(/"$/, '').replace(/\\"/g, '"');
        if (textContent.length > 20) { // 의미있는 길이만
          suggestions.push({
            suggestion_id: `${sectionId}_extracted_${idx}`,
            section_id: sectionId,
            text: textContent,
            tone: 'impact' as const,
            reason: '텍스트에서 추출된 추천',
            confidence: 0.7
          });
        }
      });
    }
    
    return suggestions;
  }

  // JSON 문자열 수정
  private fixJSONString(jsonStr: string): string {
    console.log('Fixing JSON string:', jsonStr.substring(0, 200) + '...');
    
    let fixed = jsonStr
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 제어 문자 제거
      .trim();

    // 1. 잘못된 이스케이프 수정
    fixed = fixed
      .replace(/\\n/g, ' ') // 개행 문자를 공백으로
      .replace(/\\r/g, ' ') // 캐리지 리턴을 공백으로
      .replace(/\\t/g, ' ') // 탭을 공백으로
      .replace(/\n/g, ' ')  // 실제 개행도 공백으로
      .replace(/\r/g, ' ')  // 실제 캐리지 리턴도 공백으로
      .replace(/\t/g, ' ')  // 실제 탭도 공백으로
      .replace(/\s+/g, ' ') // 연속된 공백을 단일 공백으로
      .replace(/\\"/g, '""') // 이스케이프된 따옴표를 임시로 처리
      .replace(/"/g, '\\"')  // 모든 따옴표를 이스케이프
      .replace(/""/g, '\\"'); // 임시 처리한 것을 다시 이스케이프된 따옴표로

    // 2. JSON 속성 이름 앞뒤 따옴표 복원
    fixed = fixed
      .replace(/\\\"([a-zA-Z_][a-zA-Z0-9_]*)\\\"/g, '"$1"') // 속성 이름
      .replace(/:\s*\\\"([^\\\"]*)\\\"/g, ': "$1"'); // 속성 값

    // 3. 배열과 객체 구조 확인 및 수정
    if (!fixed.startsWith('{')) {
      fixed = '{' + fixed;
    }

    // 4. 잘린 문자열 복구
    if (!fixed.endsWith('}')) {
      // suggestions 배열이 열린 상태인지 확인
      const suggestionsStart = fixed.indexOf('"suggestions":[');
      if (suggestionsStart !== -1) {
        // 마지막 완성된 객체를 찾아서 그 뒤를 자름
        let lastValidEnd = fixed.lastIndexOf('"}');
        if (lastValidEnd === -1) {
          lastValidEnd = fixed.lastIndexOf('"');
          if (lastValidEnd > suggestionsStart) {
            fixed = fixed.substring(0, lastValidEnd + 1) + '"}]}';
          } else {
            fixed = fixed + ']}';
          }
        } else {
          fixed = fixed.substring(0, lastValidEnd + 2) + ']}';
        }
      } else {
        fixed = fixed + '}';
      }
    }

    // 5. 연속된 콤마나 잘못된 콤마 제거
    fixed = fixed
      .replace(/,\s*,/g, ',') // 연속된 콤마
      .replace(/,\s*}/g, '}') // 객체 끝의 콤마
      .replace(/,\s*]/g, ']') // 배열 끝의 콤마
      .replace(/{\s*,/g, '{') // 객체 시작의 콤마
      .replace(/\[\s*,/g, '['); // 배열 시작의 콤마

    console.log('Fixed JSON:', fixed.substring(0, 300) + '...');
    return fixed;
  }

  // 섹션 타입별 폴백 추천
  private getFallbackSuggestionsByType(sectionId: string): Suggestion[] {
    const baseId = sectionId.replace(/_\d+$/, '');
    
    if (baseId.includes('summary')) {
      return [{
        suggestion_id: `${sectionId}_fallback_1`,
        section_id: sectionId,
        text: '5년 이상의 개발 경험을 바탕으로 한 풀스택 개발자로, React와 Node.js를 활용한 확장 가능한 웹 애플리케이션 개발에 특화되어 있습니다. 팀 협업과 코드 품질 향상을 통해 프로젝트 성공률을 높이는 데 기여해왔습니다.',
        tone: 'professional' as const,
        reason: 'AI 응답 실패로 인한 기본 추천',
        confidence: 0.6
      }];
    }
    
    if (baseId.includes('project')) {
      return [{
        suggestion_id: `${sectionId}_fallback_1`,
        section_id: sectionId,
        text: '**프로젝트 개요:** React와 Node.js를 활용한 웹 애플리케이션 개발\n**주요 기술:** React, TypeScript, Node.js, MongoDB\n**성과:** 사용자 경험 향상을 통해 만족도 20% 증가\n**기간:** 6개월 (기획 1개월, 개발 4개월, 운영 1개월)',
        tone: 'structured' as const,
        reason: 'AI 응답 실패로 인한 기본 추천',
        confidence: 0.6
      }];
    }
    
    return [{
      suggestion_id: `${sectionId}_fallback_1`,
      section_id: sectionId,
      text: '관련 경험과 성과를 구체적인 수치와 함께 기술해보세요. 예: "성능 개선을 통해 응답속도 50% 향상 달성"',
      tone: 'concise' as const,
      reason: 'AI 응답 실패로 인한 기본 가이드',
      confidence: 0.5
    }];
  }
}

export const sectionEditorService = new SectionEditorService();