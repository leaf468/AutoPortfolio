import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true,
});

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

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
당신은 글로벌 테크 기업 HR 전문가가 인정하는 포트폴리오 라이팅 전문가입니다.
사용자가 제공한 자기소개를 채용담당자가 '이 사람을 꼭 면접 보고싶다'고 생각하게 만드는 전문적인 About Me 섹션으로 재구성하세요.

원본 텍스트: "${originalText}"

=== HR 관점의 자기소개 작성 원칙 ===
1. **첫 문장이 결정적**: 핵심 가치 제안을 명확히 (전문성 + 차별점)
2. **STAR 스토리텔링**: 배경 → 전문성 구축 → 주요 성과 → 미래 비전
3. **정량적 임팩트**: 가능한 모든 성과를 수치로 표현
4. **비즈니스 언어**: 기술 나열이 아닌, 비즈니스 가치 중심 서술
5. **개성과 전문성 균형**: 독특한 강점을 전문적 톤으로 표현

=== 구조 가이드 (4-6문장) ===
• 문장 1: 핵심 정체성 + 전문 분야 + 경력/경험 수준
• 문장 2-3: 주요 기술 스택과 비즈니스 임팩트 (구체적 성과 포함)
• 문장 4: 협업/리더십 경험 또는 독특한 강점
• 문장 5-6: 전문성의 방향성과 미래 목표

=== 예시 (참고용) ===
"5년 경력의 풀스택 개발자로, React와 Node.js 기반 서비스로 누적 사용자 100만명 달성에 기여했습니다.
스타트업에서 서비스 기획부터 배포까지 전 과정을 경험하며, 비즈니스 임팩트를 최우선으로 하는 개발 철학을 확립했습니다.
특히 데이터 기반 의사결정으로 전환율을 40% 개선한 경험이 있으며, 팀 내 기술 리드로서 코드 리뷰와 멘토링을 주도했습니다.
현재는 AI 기술을 활용한 사용자 경험 혁신에 집중하고 있으며, 기술로 실질적인 비즈니스 문제를 해결하는 개발자로 성장하고 있습니다."

응답 형식 (JSON):
{
  "enhanced": "개선된 자기소개 (4-6문장, 정량적 성과 포함)",
  "generated_parts": ["새로 추가/생성한 부분만 나열"]
}
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional portfolio writing assistant specialized in HR-approved content." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 800,
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
당신은 실리콘밸리 테크 기업의 채용 전문가입니다.
프로젝트 정보를 STAR+I 프레임워크로 재구성하여, 면접관이 '이 사람의 문제해결 능력과 임팩트'를 명확히 이해하게 만드세요.

프로젝트 정보:
- 이름: ${project.name || "[미입력]"}
- 설명: ${project.description || "[미입력]"}
- 기간: ${project.period || "[미입력]"}
- 역할: ${project.role || "[미입력]"}
- 회사/단체: ${project.company || "[미입력]"}
- 기술 스택: ${project.tech?.join(", ") || "[미입력]"}

=== STAR+I 프로젝트 서술 프레임워크 ===
**S**ituation (상황): 어떤 비즈니스 문제/기회가 있었나? (1-2문장)
**T**ask (과제): 내가 맡은 구체적 역할과 목표는? (1문장)
**A**ction (행동): 어떤 기술/전략으로 접근했나? 핵심 의사결정은? (2-3문장)
**R**esult (결과): 정량적 성과 + 비즈니스 임팩트는? (1-2문장)
**I**nsight (통찰): 이 프로젝트에서 얻은 핵심 교훈은? (1문장)

=== 작성 원칙 ===
1. **비즈니스 맥락 우선**: 단순 기술 나열이 아닌, 왜 이 프로젝트가 중요했는지
2. **정량화**: 사용자 수, 성능 개선%, 매출 증가, 개발 시간 단축 등 구체적 수치
3. **기술 선택의 근거**: 왜 이 기술 스택을 선택했는지 전략적 사고 표현
4. **협업 강조**: 팀 규모, 역할 분담, 커뮤니케이션 방식
5. **학습과 성장**: 이 경험이 나를 어떻게 성장시켰는지

=== 예시 참고 ===
"사용자 이탈률이 높은 기존 결제 시스템을 개선하는 프로젝트를 리드했습니다. (Situation)
프론트엔드 개발 리드로서 UI/UX 재설계부터 성능 최적화까지 전 과정을 담당했습니다. (Task)
React와 TypeScript로 컴포넌트를 모듈화하고, Lazy Loading으로 초기 로딩 시간을 60% 단축했으며, A/B 테스트를 통해 사용자 경험을 검증했습니다. (Action)
그 결과 결제 전환율이 35% 증가했고, 월 거래액이 2억원 상승하는 비즈니스 임팩트를 달성했습니다. (Result)
데이터 기반 의사결정과 점진적 개선의 중요성을 체득한 프로젝트였습니다. (Insight)"

응답 형식 (JSON):
{
  "name": "프로젝트명 (임팩트 강조 형태로 가능하면 개선)",
  "description": "STAR+I 구조로 재작성된 설명 (6-8문장)",
  "period": "기간 (없으면 합리적으로 추정)",
  "role": "구체적 역할 (책임 범위 포함)",
  "company": "회사/단체 (없으면 합리적으로 추정)",
  "generated_fields": ["새로 생성/추정한 필드명들"]
}
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a Silicon Valley tech recruiter specialized in STAR framework." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1000,
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