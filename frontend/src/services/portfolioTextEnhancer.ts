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
당신은 Fortune 500 기업 인사팀과 협력한 경험이 있는 전문 포트폴리오 작성 컨설턴트입니다.
1,000명 이상의 후보자가 이 자기소개로 면접 합격률 80% 이상을 달성했습니다.

원본 텍스트: "${originalText}"

=== 개선 원칙 ===
1. **스토리텔링 구조**: 배경 → 전환점 → 현재 전문성 → 미래 비전 (4단계 서사)
2. **구체성 극대화**: 추상적 표현 금지, 구체적 사례와 수치로 증명
3. **차별화 포인트**: 다른 후보자와 다른 독특한 강점 부각
4. **전문성 + 인간미**: 기술적 전문성과 개인의 가치관/동기 균형
5. **임팩트 중심**: 무엇을 할 수 있는지보다, 어떤 가치를 만들 수 있는지 강조

=== 필수 구성 요소 ===
**300-400자 분량으로 다음을 모두 포함:**

1. **배경 스토리 (100자)**
   - 이 분야에 관심을 갖게 된 계기
   - 초기 경험이나 인상적인 에피소드
   - 예: "대학 시절 첫 웹사이트를 만들면서 코드가 실제 서비스로 작동하는 순간의 감동..."

2. **전환점/성장 (100자)**
   - 중요한 프로젝트나 경험
   - 큰 도전과 극복 과정
   - 핵심 역량을 키운 계기
   - 예: "스타트업에서 3개월 만에 월 10만 사용자 서비스를 런칭하면서..."

3. **현재 전문성 (100자)**
   - 핵심 기술 스택 (3-5개)
   - 특기와 강점
   - 구체적인 경험치 (년수, 프로젝트 수 등)
   - 예: "현재 React, TypeScript, Node.js를 활용한 풀스택 개발에 3년 이상의 경험을 보유..."

4. **미래 비전 (100자)**
   - 커리어 목표
   - 기여하고 싶은 가치
   - 학습 계획이나 성장 방향
   - 예: "앞으로는 AI 기술을 접목한 사용자 경험 혁신에 집중하여..."

=== 문체 가이드 ===
- 1인칭 시점 사용
- 능동적이고 자신감 있는 표현
- "~했습니다" 보다 "~하여 ~을 달성했습니다" (결과 중심)
- 구체적 수치와 사례 포함 (프로젝트 수, 사용자 수, 성과 등)

응답 형식:
{
  "enhanced": "300-400자 분량의 풍부하고 스토리가 있는 자기소개 (4개 문단으로 구성)",
  "generated_parts": ["배경 스토리", "전환점", "현재 전문성", "미래 비전"] // 새로 생성하거나 크게 확장한 부분
}
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional portfolio writing consultant specializing in compelling personal narratives and career storytelling." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.6, // 더 풍부한 스토리텔링을 위해 조정
                max_tokens: 1200, // 300-400단어 목표를 위해 증가
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
당신은 실리콘밸리 스타트업과 대기업 모두에서 인정받은 프로젝트 포트폴리오 작성 전문가입니다.
성공적인 프로젝트 설명으로 500명 이상의 개발자가 원하는 회사에 입사했습니다.

=== 현재 프로젝트 정보 ===
- 이름: ${project.name || "[미입력]"}
- 설명: ${project.description || "[미입력]"}
- 기간: ${project.period || "[미입력]"}
- 역할: ${project.role || "[미입력]"}
- 회사/단체: ${project.company || "[미입력]"}
- 기술 스택: ${project.tech?.join(", ") || "[미입력]"}

=== 프로젝트 설명 개선 원칙 ===
**STAR 기법 + 비즈니스 임팩트 중심**

1. **Situation (상황/배경) - 50자**
   - 어떤 문제나 니즈가 있었나?
   - 프로젝트가 필요했던 비즈니스 맥락
   - 예: "월 5만 사용자의 전자상거래 플랫폼이 레거시 시스템으로 인해 페이지 로딩에 평균 5초가 걸리며 이탈률이 45%에 달하는 문제가 있었습니다."

2. **Task (과제) - 30자**
   - 해결해야 할 구체적 과제
   - 목표와 제약조건
   - 예: "3개월 내에 성능을 개선하면서도 기존 기능을 모두 유지해야 했습니다."

3. **Action (실행/해결방법) - 100자**
   - 사용한 기술 스택과 아키텍처
   - 구현 방법과 기술적 의사결정
   - 팀 협업 방식 (인원, 역할분담)
   - 극복한 기술적 챌린지
   - 예: "React 18과 Next.js를 활용한 SSR/ISR 아키텍처로 전면 리팩토링했습니다.
     5명의 프론트엔드 개발자와 애자일 방식으로 협업하며, 저는 아키텍처 설계와 성능 최적화를 담당했습니다.
     Redis 캐싱 전략과 Webpack 번들 최적화로 초기 로딩 시간을 대폭 개선했습니다."

4. **Result (결과/성과) - 50자**
   - 정량적 성과 (수치로 증명)
   - 비즈니스 임팩트
   - 기술적 개선 사항
   - 예: "페이지 로딩 시간을 5초→1.2초로 76% 개선, 이탈률 45%→18%로 감소, 월 매출 1,500만원 증가에 기여했습니다."

5. **Learning (배운 점) - 30자**
   - 기술적 학습
   - 프로세스 개선
   - 차기 프로젝트에 적용할 인사이트
   - 예: "대규모 리팩토링 시 점진적 마이그레이션 전략의 중요성을 깨달았습니다."

=== 필수 요구사항 ===
✓ **총 200-300 자** (빈약한 설명 절대 금지)
✓ **구체적 수치 최소 3개** (사용자 수, 성능 개선율, 매출/비용 영향 등)
✓ **기술 스택 명시** (버전, 주요 라이브러리 포함)
✓ **팀 규모와 역할** (예: "5명 중 프론트엔드 리드", "단독 개발")
✓ **비즈니스 가치** (매출, 사용자, 효율성 등으로 표현)
✓ **부족한 정보는 합리적 추론**으로 채우되 [생성됨] 표시

응답 형식:
{
  "name": "프로젝트명",
  "description": "200-300자의 풍부한 STAR 구조 설명",
  "period": "구체적 기간 (예: 2023.03 - 2023.06, 3개월)",
  "role": "구체적 역할 (예: Frontend Lead / 5명 중 1명)",
  "company": "회사/단체명",
  "tech": ["React 18", "TypeScript 4.9", "Next.js 13", "Tailwind CSS"],
  "achievements": ["페이지 로딩 76% 개선", "이탈률 45%→18% 감소", "월 매출 1,500만원 증가"],
  "generated_fields": ["생성되거나 크게 확장된 필드명"]
}
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a professional portfolio writing assistant with expertise in STAR methodology and business impact storytelling." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.6, // 약간 높여서 더 풍부하고 창의적인 콘텐츠 생성
                max_tokens: 1500, // 더 긴 프로젝트 설명을 위해 증가 (200-300단어 목표)
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
                tech: result.tech || project.tech,
                enhanced: {
                    original: project.description,
                    enhanced: result.description,
                    isGenerated: result.generated_fields && result.generated_fields.length > 0,
                    suggestions: result.generated_fields || result.achievements
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

    // 경력 설명 개선 (Experience 섹션용)
    async enhanceExperience(experience: any): Promise<any & { enhanced: EnhancedText }> {
        try {
            const prompt = `
당신은 전문 포트폴리오 작성 도우미입니다. 경력 정보를 전문적인 포트폴리오 형식으로 개선해주세요.

경력 정보:
- 직책: ${experience.position || "[미입력]"}
- 회사: ${experience.company || "[미입력]"}
- 기간: ${experience.duration || "[미입력]"}
- 업무 설명: ${experience.description || "[미입력]"}
- 주요 성과: ${experience.achievements?.join(", ") || "[미입력]"}
- 기술 스택: ${experience.technologies?.join(", ") || "[미입력]"}

요구사항:
1. 담당 업무를 구체적이고 전문적으로 설명
2. 비즈니스 임팩트를 수치로 강조 (예: "매출 20% 증가", "처리 시간 50% 단축")
3. 리더십이나 협업 경험 부각
4. 기술적 성취와 비즈니스 가치를 연결
5. 최소 100자 이상의 풍부한 설명으로 구성
6. 주요 성과는 bullet point로 3-5개 생성

응답 형식:
{
  "position": "직책",
  "company": "회사명",
  "duration": "기간",
  "description": "개선된 업무 설명 (최소 100자)",
  "achievements": ["성과1", "성과2", "성과3"],
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
                max_tokens: 800,
            });

            let content = response.choices[0].message?.content || "{}";

            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const result = JSON.parse(content);

            return {
                ...experience,
                position: result.position || experience.position,
                company: result.company || experience.company,
                duration: result.duration || experience.duration,
                description: result.description || experience.description,
                achievements: result.achievements || experience.achievements,
                enhanced: {
                    original: experience.description,
                    enhanced: result.description,
                    isGenerated: result.generated_fields && result.generated_fields.length > 0,
                    suggestions: result.generated_fields
                }
            };
        } catch (error) {
            console.error("경력 개선 실패:", error);
            return {
                ...experience,
                enhanced: {
                    original: experience.description,
                    enhanced: experience.description,
                    isGenerated: false
                }
            };
        }
    }

    // 학력 설명 개선 (Education 섹션용)
    async enhanceEducation(education: any): Promise<any & { enhanced: EnhancedText }> {
        try {
            const prompt = `
당신은 전문 포트폴리오 작성 도우미입니다. 학력 정보를 전문적인 포트폴리오 형식으로 개선해주세요.

학력 정보:
- 학교: ${education.school || "[미입력]"}
- 전공/학위: ${education.degree || "[미입력]"}
- 기간: ${education.period || "[미입력]"}
- 설명: ${education.description || "[미입력]"}

요구사항:
1. 전공과 관련된 핵심 역량 강조
2. 학업 성과나 프로젝트 경험 포함
3. 관련 자격증이나 수상 경력 언급
4. 간결하면서도 전문성 있게 작성 (2-3문장)
5. 부족한 정보는 일반적이고 합리적인 내용으로 채우기

응답 형식:
{
  "school": "학교명",
  "degree": "전공/학위",
  "period": "기간",
  "description": "개선된 설명",
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

            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }

            const result = JSON.parse(content);

            return {
                ...education,
                school: result.school || education.school,
                degree: result.degree || education.degree,
                period: result.period || education.period,
                description: result.description || education.description,
                enhanced: {
                    original: education.description,
                    enhanced: result.description,
                    isGenerated: result.generated_fields && result.generated_fields.length > 0,
                    suggestions: result.generated_fields
                }
            };
        } catch (error) {
            console.error("학력 개선 실패:", error);
            return {
                ...education,
                enhanced: {
                    original: education.description,
                    enhanced: education.description,
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