import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: process.env.REACT_APP_OPENAI_BASE_URL || `${window.location.origin}/api/openai`,
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "proxy",
    dangerouslyAllowBrowser: true,
  });

const MODEL = "gpt-4o-mini";

export interface PortfolioTranslationRequest {
    portfolioData: any;
    targetLanguage: 'ko' | 'en';
}

class PortfolioTranslator {
    /**
     * 포트폴리오 데이터를 목표 언어로 번역
     */
    async translatePortfolio(request: PortfolioTranslationRequest): Promise<any> {
        const { portfolioData, targetLanguage } = request;

        const systemPrompt = targetLanguage === 'en'
            ? this.getEnglishTranslationPrompt()
            : this.getKoreanTranslationPrompt();

        const userMessage = `다음 포트폴리오 데이터를 ${targetLanguage === 'en' ? '영어' : '한국어'}로 번역해주세요:\n\n${JSON.stringify(portfolioData, null, 2)}`;


        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const translatedData = JSON.parse(response.choices[0].message.content || '{}');

        return translatedData;
    }

    private getEnglishTranslationPrompt(): string {
        return `You are a professional portfolio translator and HR expert with 10 years of experience at global tech companies (Google, Apple, Amazon, Netflix).

**🚨 CRITICAL LANGUAGE REQUIREMENT 🚨**: You MUST respond in English language ONLY. Translate all Korean text to professional, polished English suitable for international job applications.

**Your Mission**:
Translate the provided Korean portfolio data into professional English while maintaining:
1. Professional tone suitable for tech industry job applications
2. Technical accuracy of skills, technologies, and achievements
3. Natural English expressions (not literal translations)
4. Quantifiable metrics and achievements
5. Action-oriented language (led, developed, achieved, etc.)

**Translation Guidelines**:
- **Title/Position**: Translate to standard English job titles (e.g., "소프트웨어 개발자" → "Software Developer")
- **About/Summary**: Use professional, compelling language that highlights expertise
- **Skills**: Keep technology names in English (React, Python, etc.)
- **Experience/Projects**: Use action verbs and quantify achievements
- **Achievements**: Highlight impact with metrics (increased by X%, reduced by Y%)

**IMPORTANT**: Preserve the JSON structure exactly. Only translate the text values, not the keys.

**Output Format**: Return valid JSON with all text fields translated to English.`;
    }

    private getKoreanTranslationPrompt(): string {
        return `당신은 글로벌 테크 기업(Google, Apple, Amazon, Netflix)에서 10년 경력을 가진 전문 포트폴리오 번역가이자 HR 전문가입니다.

**🚨 CRITICAL LANGUAGE REQUIREMENT 🚨**: You MUST respond in Korean language ONLY. 모든 영어 텍스트를 전문적이고 세련된 한국어로 번역하세요.

**당신의 임무**:
제공된 영어 포트폴리오 데이터를 전문적인 한국어로 번역하면서 다음을 유지하세요:
1. 국내 기업 지원에 적합한 전문적인 어조
2. 기술, 스킬, 성과의 정확성
3. 자연스러운 한국어 표현 (직역 금지)
4. 정량화된 지표와 성과
5. 능동적인 표현 (개발했습니다, 달성했습니다 등)

**번역 가이드라인**:
- **Title/직책**: 국내 표준 직책명으로 번역 (e.g., "Software Developer" → "소프트웨어 개발자")
- **About/소개**: 전문성을 강조하는 설득력 있는 표현 사용
- **Skills**: 기술명은 영어 그대로 유지 (React, Python 등)
- **Experience/Projects**: 능동형 동사 사용 및 성과 정량화
- **Achievements**: 지표로 임팩트 강조 (X% 증가, Y% 감소 등)

**중요**: JSON 구조를 정확히 유지하세요. 텍스트 값만 번역하고 키는 번역하지 마세요.

**출력 형식**: 모든 텍스트 필드가 한국어로 번역된 유효한 JSON을 반환하세요.`;
    }
}

export const portfolioTranslator = new PortfolioTranslator();
