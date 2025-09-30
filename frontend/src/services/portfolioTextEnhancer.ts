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
    location?: string;
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

            let content = response.choices[0].message?.content || "{}";

            // JSON 응답이 마크다운 코드 블록으로 감싸진 경우 제거
            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const result = JSON.parse(content);

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

            let content = response.choices[0].message?.content || "{}";

            // JSON 응답이 마크다운 코드 블록으로 감싸진 경우 제거
            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const result = JSON.parse(content);

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
            console.log('=== 포트폴리오 데이터 개선 시작 ===');
            console.log('입력 데이터:', data);
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

            let content = response.choices[0].message?.content || "{}";

            // JSON 응답이 마크다운 코드 블록으로 감싸진 경우 제거
            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const result = JSON.parse(content);
            console.log('=== 포트폴리오 데이터 개선 결과 ===');
            console.log(result);

            return result as PortfolioData;

        } catch (error) {
            console.error("포트폴리오 데이터 개선 실패:", error);
            return data as PortfolioData;
        }
    }

    // 빈 학력 섹션에 대한 더미 데이터 생성
    async generateDummyEducation(): Promise<{ data: any[], isGenerated: boolean }> {
        try {
            const prompt = `
한국 개발자의 일반적인 학력 정보를 2개 생성해주세요.

요구사항:
1. 실제 대학교 이름 사용 (예: 서울대학교, 연세대학교, 고려대학교, KAIST, POSTECH 등)
2. 컴퓨터공학과, 소프트웨어학과, 전자공학과 등 관련 전공
3. 최근 졸업년도 (2018-2024 사이)
4. 학사, 석사 학위 포함

JSON 배열 형식으로 응답해주세요:
[
  {
    "degree": "학위명",
    "school": "학교명",
    "year": "졸업년도"
  }
]
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional Korean portfolio writing assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            let content = response.choices[0].message?.content || "[]";

            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const educationData = JSON.parse(content);
            return { data: educationData, isGenerated: true };

        } catch (error) {
            console.error("더미 학력 데이터 생성 실패:", error);
            return {
                data: [
                    { degree: "컴퓨터공학과 학사", school: "서울대학교", year: "2020" },
                    { degree: "소프트웨어학과 석사", school: "KAIST", year: "2022" }
                ],
                isGenerated: true
            };
        }
    }

    // 빈 수상 섹션에 대한 더미 데이터 생성
    async generateDummyAwards(): Promise<{ data: any[], isGenerated: boolean }> {
        try {
            const prompt = `
한국 개발자가 받을 만한 일반적인 수상 경력을 3개 생성해주세요.

요구사항:
1. 실제 존재할 법한 상 이름 (예: 해커톤 대상, 앱 개발 공모전 등)
2. 실제 기관/회사 이름 사용
3. 최근 수상년도 (2020-2024 사이)
4. 간단한 설명 포함

JSON 배열 형식으로 응답해주세요:
[
  {
    "title": "상 이름",
    "organization": "주관기관",
    "year": "수상년도",
    "description": "간단한 설명"
  }
]
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional Korean portfolio writing assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            let content = response.choices[0].message?.content || "[]";

            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const awardsData = JSON.parse(content);
            return { data: awardsData, isGenerated: true };

        } catch (error) {
            console.error("더미 수상 데이터 생성 실패:", error);
            return {
                data: [
                    { title: "해커톤 대상", organization: "NAVER", year: "2023", description: "AI 기반 서비스 개발" },
                    { title: "앱 개발 공모전 우수상", organization: "삼성전자", year: "2022", description: "모바일 앱 혁신 아이디어" },
                    { title: "오픈소스 기여상", organization: "한국정보화진흥원", year: "2024", description: "오픈소스 프로젝트 기여" }
                ],
                isGenerated: true
            };
        }
    }
}

const portfolioTextEnhancer = new PortfolioTextEnhancer();
export default portfolioTextEnhancer;