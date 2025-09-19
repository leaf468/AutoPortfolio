import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true,
});

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4";

export interface EnhancedText {
    original: string;
    enhanced: string;
    isGenerated: boolean; // AI가 생성한 부분인지 표시
    suggestions?: string[];
}

export interface ProjectData {
    name: string;
    description: string;
    period?: string;
    role?: string;
    company?: string;
    tech?: string[];
}

export interface PortfolioData {
    name: string;
    title: string;
    email: string;
    phone: string;
    github?: string;
    about: string;
    skills: string[];
    projects: ProjectData[];
    experience: any[];
    education: any[];
}

class PortfolioTextEnhancer {
    // 자기소개 텍스트 개선
    async enhanceAboutMe(originalText: string): Promise<EnhancedText> {
        try {
            const prompt = `
당신은 전문 포트폴리오 작성 도우미입니다. 사용자가 제공한 자기소개를 전문적이고 매력적인 포트폴리오 형식으로 개선해주세요.

원본 텍스트: "${originalText}"

요구사항:
1. 전문적이고 자신감 있는 톤으로 작성
2. 구체적인 기술과 경험을 강조
3. 간결하면서도 임팩트 있게 작성
4. 3-5문장으로 구성
5. 만약 원본이 너무 짧거나 정보가 부족하다면, [생성됨] 태그와 함께 추가 내용을 생성

응답 형식:
{
  "enhanced": "개선된 자기소개 텍스트",
  "generated_parts": ["생성된 부분1", "생성된 부분2"] // 새로 생성한 부분만
}
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional portfolio writing assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const result = JSON.parse(response.choices[0].message?.content || "{}");

            return {
                original: originalText,
                enhanced: result.enhanced || originalText,
                isGenerated: result.generated_parts && result.generated_parts.length > 0,
                suggestions: result.generated_parts
            };
        } catch (error) {
            console.error("자기소개 개선 실패:", error);
            return {
                original: originalText,
                enhanced: originalText,
                isGenerated: false
            };
        }
    }

    // 프로젝트 설명 개선
    async enhanceProject(project: ProjectData): Promise<ProjectData & { enhanced: EnhancedText }> {
        try {
            const prompt = `
당신은 전문 포트폴리오 작성 도우미입니다. 프로젝트 정보를 전문적인 포트폴리오 형식으로 개선해주세요.

프로젝트 정보:
- 이름: ${project.name || "[미입력]"}
- 설명: ${project.description || "[미입력]"}
- 기간: ${project.period || "[미입력]"}
- 역할: ${project.role || "[미입력]"}
- 회사/단체: ${project.company || "[미입력]"}
- 기술 스택: ${project.tech?.join(", ") || "[미입력]"}

요구사항:
1. 프로젝트의 목적과 성과를 명확히 설명
2. 기술적 도전과 해결 방법 포함
3. 구체적인 역할과 기여도 명시
4. 부족한 정보는 [임시] 태그로 표시하고 일반적인 내용으로 채우기
5. 3-5문장의 설명으로 구성

응답 형식:
{
  "name": "프로젝트명",
  "description": "개선된 설명",
  "period": "기간 (없으면 생성)",
  "role": "역할 (없으면 생성)",
  "company": "회사/단체 (없으면 생성)",
  "generated_fields": ["생성된 필드명들"]
}
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional portfolio writing assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const result = JSON.parse(response.choices[0].message?.content || "{}");

            return {
                ...project,
                name: result.name || project.name,
                description: result.description || project.description,
                period: result.period || project.period,
                role: result.role || project.role,
                company: result.company || project.company,
                enhanced: {
                    original: project.description,
                    enhanced: result.description,
                    isGenerated: result.generated_fields && result.generated_fields.length > 0,
                    suggestions: result.generated_fields
                }
            };
        } catch (error) {
            console.error("프로젝트 개선 실패:", error);
            return {
                ...project,
                enhanced: {
                    original: project.description,
                    enhanced: project.description,
                    isGenerated: false
                }
            };
        }
    }

    // 전체 포트폴리오 데이터 개선
    async enhancePortfolioData(data: Partial<PortfolioData>): Promise<PortfolioData> {
        try {
            const prompt = `
당신은 전문 포트폴리오 작성 도우미입니다. 제공된 정보를 바탕으로 완성도 높은 포트폴리오 데이터를 생성해주세요.

현재 데이터:
${JSON.stringify(data, null, 2)}

요구사항:
1. 비어있거나 부족한 필드를 적절히 채우기
2. 모든 텍스트를 전문적이고 매력적으로 개선
3. 일관된 톤과 스타일 유지
4. 새로 생성한 내용은 "generated": true로 표시
5. 한국어로 작성

응답은 완전한 PortfolioData JSON 형식으로 제공해주세요.
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional Korean portfolio writing assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });

            const result = JSON.parse(response.choices[0].message?.content || "{}");
            return result as PortfolioData;

        } catch (error) {
            console.error("포트폴리오 데이터 개선 실패:", error);
            return data as PortfolioData;
        }
    }
}

const portfolioTextEnhancer = new PortfolioTextEnhancer();
export default portfolioTextEnhancer;