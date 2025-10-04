import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true,
});

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export interface OrganizedContent {
    oneLinerPitch: string; // 1문장 핵심 요약
    summary: string; // 전체 요약
    experiences: OrganizedExperience[];
    projects: OrganizedProject[];
    skills: OrganizedSkill[];
    education: OrganizedEducation[]; // 학력 정보
    achievements: string[]; // 주요 성과 리스트
    keywords: {
        technical: string[]; // 기술 키워드
        soft: string[]; // 소프트 스킬
        industry: string[]; // 산업/도메인 키워드
        ats: string[]; // ATS 최적화 키워드
    };
    missingFields: string[]; // 누락된 중요 필드들
    improvementSuggestions: string[]; // 개선 제안
    // 원본 데이터 추가
    originalInput: {
        rawText: string; // 사용자가 입력한 원본 텍스트
        inputType: 'freetext' | 'resume' | 'markdown';
        jobPosting?: string; // 채용공고 (있는 경우)
    };
}

export interface OrganizedExperience {
    company: string;
    position: string;
    duration: string;
    responsibilities: string[]; // 담당 업무 (불릿 포인트)
    achievements: string[]; // 성과 (수치 포함)
    technologies: string[];
    impact: string; // 비즈니스 임팩트
}

export interface OrganizedProject {
    name: string;
    summary: string; // 1-2문장 요약
    myRole: string; // 나의 역할
    responsibilities: string[];
    achievements: string[];
    technologies: string[];
    impact: string;
    metrics?: string; // 성과 수치
    url?: string;
    githubUrl?: string;
}

export interface OrganizedSkill {
    category: string;
    skills: string[];
    proficiency: "beginner" | "intermediate" | "advanced" | "expert";
    experience: string; // 경험 기간/프로젝트
}

export interface OrganizedEducation {
    school: string; // 학교명
    degree: string; // 학위/전공
    period: string; // 기간
    description?: string; // 세부사항 (GPA, 주요 과목 등)
}

class AIOrganizer {
    async organizeContent(
        rawInput: string,
        inputType: "freetext" | "resume" | "markdown" = "freetext"
    ): Promise<OrganizedContent> {
        const systemPrompt = `
당신은 채용 관점에서 포트폴리오를 최적화하는 전문가입니다.
15초 내에 후보자의 가치를 파악할 수 있도록 정보를 정리하고 구조화하세요.

핵심 원칙:
1. **임팩트 중심**: 모든 경험을 비즈니스 임팩트와 연결
2. **수치화**: 구체적인 숫자, 증가율, 규모로 성과 표현
3. **ATS 최적화**: 채용공고에서 자주 사용되는 키워드 추출
4. **차별화**: 경쟁자 대비 독특한 강점 부각
5. **스토리텔링**: 성장 과정과 문제해결 과정을 논리적으로 연결

**[매우 중요] 분류 규칙 (절대 준수)**

## Experiences (경력/커리어) - 조직에서의 활동
다음을 반드시 experiences로 분류:
- ✅ 회사 근무, 인턴십
- ✅ 교육 과정 (우아한테크코스, 코드스테이츠, 멋쟁이사자처럼 등)
- ✅ 동아리/커뮤니티 (GDSC, SOPT, DND, 테크 커뮤니티 등)
- ✅ 부트캠프, 온라인 강의 수료
핵심: **어디서 (조직) + 어떤 역할로 활동했는가?**

## Projects (프로젝트) - 개발 결과물
다음을 반드시 projects로 분류:
- ✅ 웹사이트, 웹 애플리케이션
- ✅ 모바일 앱
- ✅ 시스템, 서비스, API
- ✅ 챗봇, AI 모델, 데이터 파이프라인
핵심: **무엇을 (결과물) 만들었는가?**

**절대 금지**: 우아한테크코스, GDSC 같은 조직 활동을 projects로 분류하지 마세요!

출력 형식 (JSON):
{
  "oneLinerPitch": "30초 엘리베이터 피치 (핵심 가치 제안)",
  "summary": "3-4문장 전문적 요약",
  "experiences": [
    {
      "company": "회사명 또는 조직명 (예: 우아한테크코스, GDSC, 삼성전자)",
      "position": "직책 또는 역할 (예: 백엔드 과정 수료생, 코어 멤버, 인턴)",
      "duration": "2023.01 - 2024.01",
      "responsibilities": ["담당업무1", "담당업무2"],
      "achievements": ["구체적 성과 (수치 포함)", "비즈니스 임팩트"],
      "technologies": ["기술1", "기술2"],
      "impact": "이 경험으로 얻은 핵심 가치/능력"
    }
  ],
  "projects": [
    {
      "name": "프로젝트명 (실제 개발한 결과물 이름)",
      "summary": "프로젝트 핵심 설명 (1-2문장)",
      "myRole": "나의 구체적 역할",
      "responsibilities": ["담당업무1", "담당업무2"],
      "achievements": ["달성한 성과", "해결한 문제"],
      "technologies": ["사용기술1", "사용기술2"],
      "impact": "프로젝트의 비즈니스/기술적 임팩트",
      "metrics": "성과 지표 (옵션)",
      "url": "라이브 URL (옵션)",
      "githubUrl": "GitHub URL (옵션)"
    }
  ],
  "skills": [
    {
      "category": "Frontend",
      "skills": ["React", "TypeScript"],
      "proficiency": "advanced",
      "experience": "3년, 5개 프로젝트"
    }
  ],
  "education": [
    {
      "school": "학교명",
      "degree": "학과/전공 (또는 학위)",
      "period": "2018.03 - 2022.02",
      "description": "학점, 주요 활동 등 (선택사항)"
    }
  ],
  "achievements": ["주요 성과1", "주요 성과2"],
  "keywords": {
    "technical": ["React", "Node.js", "AWS"],
    "soft": ["리더십", "커뮤니케이션"],
    "industry": ["핀테크", "B2B", "SaaS"],
    "ats": ["풀스택", "프론트엔드", "백엔드"]
  },
  "missingFields": ["연락처", "프로젝트 성과 수치"],
  "improvementSuggestions": ["수치적 성과 추가 필요", "기술 스택 구체화"]
}

누락된 정보는 null로, 추정 가능한 정보는 합리적으로 추론하여 채우세요.
특히 성과는 수치화를 우선하고, 기술 스택은 최신 트렌드를 반영하세요.
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `다음 ${inputType} 정보를 채용 관점에서 정리해주세요:\n\n${rawInput}`,
                    },
                ],
                max_tokens: 3000,
            });

            const result = response.choices[0].message.content || "{}";
            let cleanedResult = result;

            // JSON 추출
            if (result.includes("```json")) {
                const match = result.match(/```json\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            } else if (result.includes("```")) {
                const match = result.match(/```\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            }

            const parsedContent = JSON.parse(cleanedResult) as Omit<OrganizedContent, 'originalInput'>;

            // 원본 입력 데이터 추가
            return {
                ...parsedContent,
                originalInput: {
                    rawText: rawInput,
                    inputType: inputType
                }
            } as OrganizedContent;
        } catch (error) {
            console.error("AI Organizer 오류:", error);
            // 기본 구조 반환
            return {
                oneLinerPitch: "정보 정리 중 오류가 발생했습니다.",
                summary: rawInput.slice(0, 200) + "...",
                experiences: [],
                projects: [],
                skills: [],
                education: [],
                achievements: [],
                keywords: {
                    technical: [],
                    soft: [],
                    industry: [],
                    ats: [],
                },
                missingFields: ["모든 필드"],
                improvementSuggestions: ["다시 시도해주세요."],
                originalInput: {
                    rawText: rawInput,
                    inputType: inputType
                }
            };
        }
    }

    async enhanceWithJobPosting(
        organizedContent: OrganizedContent,
        jobPosting: string
    ): Promise<OrganizedContent> {
        const systemPrompt = `
채용공고 내용을 분석하여 포트폴리오를 최적화하세요.

분석 포인트:
1. 공고의 필수/우대 스킬과 후보자 스킬 매칭
2. 공고 키워드를 포트폴리오에 자연스럽게 반영
3. 공고의 회사/포지션에 맞는 경험/프로젝트 우선순위 조정
4. ATS 키워드 최적화

기존 정보는 유지하되, 공고에 맞게 표현과 순서를 조정하세요.
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `채용공고:\n${jobPosting}\n\n현재 정리된 포트폴리오:\n${JSON.stringify(
                            organizedContent,
                            null,
                            2
                        )}`,
                    },
                ],
                max_tokens: 3000,
            });

            const result = response.choices[0].message.content || "{}";
            let cleanedResult = result;

            if (result.includes("```json")) {
                const match = result.match(/```json\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            }

            const parsedContent = JSON.parse(cleanedResult) as Omit<OrganizedContent, 'originalInput'>;

            // 원본 입력 데이터 유지하면서 채용공고 정보 추가
            return {
                ...parsedContent,
                originalInput: {
                    ...organizedContent.originalInput,
                    jobPosting: jobPosting
                }
            } as OrganizedContent;
        } catch (error) {
            console.error("Job posting enhancement 오류:", error);
            return organizedContent; // 원본 반환
        }
    }

    async generateKeywords(
        content: string,
        jobPosting?: string
    ): Promise<OrganizedContent["keywords"]> {
        const systemPrompt = `
채용 관점에서 중요한 키워드를 추출하고 분류하세요.

카테고리:
1. technical: 프로그래밍 언어, 프레임워크, 도구
2. soft: 소프트 스킬, 업무 능력
3. industry: 산업, 도메인, 비즈니스 영역
4. ats: ATS 시스템이 잡아낼 핵심 키워드

JSON 형식으로 반환:
{
  "technical": ["React", "Python", "AWS"],
  "soft": ["리더십", "커뮤니케이션", "문제해결"],
  "industry": ["핀테크", "B2B", "스타트업"],
  "ats": ["풀스택개발자", "프론트엔드", "백엔드"]
}
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `포트폴리오 내용:\n${content}\n\n${
                            jobPosting ? `채용공고:\n${jobPosting}` : ""
                        }`,
                    },
                ],
            });

            const result = response.choices[0].message.content || "{}";
            let cleanedResult = result;

            if (result.includes("```json")) {
                const match = result.match(/```json\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            }

            return JSON.parse(cleanedResult);
        } catch (error) {
            console.error("Keyword generation 오류:", error);
            return {
                technical: [],
                soft: [],
                industry: [],
                ats: [],
            };
        }
    }
}

export const aiOrganizer = new AIOrganizer();
