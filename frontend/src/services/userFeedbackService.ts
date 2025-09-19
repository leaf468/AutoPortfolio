import OpenAI from "openai";
import { OrganizedContent } from "./aiOrganizer";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true,
});

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4";

export interface FeedbackOption {
    id: string;
    category: "tone" | "style" | "content" | "structure" | "design";
    label: string;
    description: string;
    prompt: string; // AI에게 전달할 수정 지시사항
}

export interface UserFeedback {
    selectedOptions: string[]; // 선택된 옵션 ID들
    customRequests: string[]; // 사용자 직접 입력 요청사항
    timestamp: Date;
}

export interface FeedbackResult {
    revisedContent: string;
    changesApplied: string[];
    improvementScore?: number; // 기존 대비 개선 점수
    finalQualityScore?: number; // 최종 품질 점수
}

class UserFeedbackService {
    private feedbackOptions: FeedbackOption[] = [
        // 톤 관련
        {
            id: "tone-more-professional",
            category: "tone",
            label: "더 전문적인 톤으로",
            description: "비즈니스 환경에 적합한 더 격식 있는 표현으로 변경",
            prompt: "텍스트를 더 전문적이고 격식 있는 톤으로 수정해주세요. 비즈니스 환경에 적합하도록 표현을 바꾸세요.",
        },
        {
            id: "tone-more-friendly",
            category: "tone",
            label: "더 친근한 톤으로",
            description: "좀 더 접근하기 쉽고 인간적인 느낌으로 변경",
            prompt: "텍스트를 더 친근하고 접근하기 쉬운 톤으로 수정해주세요. 너무 격식적이지 않게 인간적인 느낌을 추가하세요.",
        },
        {
            id: "tone-more-confident",
            category: "tone",
            label: "더 자신감 있는 톤으로",
            description: "성과와 능력을 더 확실하게 어필하는 표현으로 변경",
            prompt: "성과와 능력을 더 자신감 있게 표현하도록 수정해주세요. 겸손한 표현을 줄이고 임팩트 있는 표현을 사용하세요.",
        },

        // 내용 관련
        {
            id: "content-add-metrics",
            category: "content",
            label: "수치적 성과 강화",
            description: "구체적인 숫자와 측정 가능한 결과 추가",
            prompt: "성과를 더 구체적인 수치로 표현하고, 측정 가능한 결과를 강조해주세요. 퍼센트, 개수, 기간 등을 활용하세요.",
        },
        {
            id: "content-emphasize-leadership",
            category: "content",
            label: "리더십 경험 부각",
            description: "팀 관리, 프로젝트 리딩 경험을 더 강조",
            prompt: "리더십과 팀 관리 경험을 더 부각시켜 주세요. 협업, 의사결정, 팀 이끌기 등의 경험을 강조하세요.",
        },
        {
            id: "content-technical-depth",
            category: "content",
            label: "기술적 깊이 추가",
            description: "사용한 기술의 구체적인 활용 방법과 전문성 강조",
            prompt: "기술적 전문성을 더 구체적으로 표현해주세요. 단순 나열이 아닌 어떻게 활용했는지, 왜 선택했는지를 포함하세요.",
        },

        // 구조 관련
        {
            id: "structure-chronological",
            category: "structure",
            label: "시간순 정렬",
            description: "최신 경험부터 역순으로 정렬",
            prompt: "경험과 프로젝트를 최신순으로 재정렬해주세요. 가장 최근 경험이 먼저 나오도록 구성하세요.",
        },
        {
            id: "structure-impact-focused",
            category: "structure",
            label: "임팩트 중심 정렬",
            description: "가장 임팩트 있는 성과부터 우선 배치",
            prompt: "가장 임팩트 있고 인상적인 성과를 앞쪽으로 배치해주세요. 채용담당자가 주목할 만한 내용을 우선시하세요.",
        },

        // 스타일 관련
        {
            id: "style-bullet-points",
            category: "style",
            label: "불릿 포인트 강화",
            description: "핵심 내용을 명확한 불릿 포인트로 구성",
            prompt: "내용을 읽기 쉬운 불릿 포인트 형식으로 재구성해주세요. 한 눈에 파악할 수 있도록 구조화하세요.",
        },
        {
            id: "style-action-verbs",
            category: "style",
            label: "액션 동사 강화",
            description: "임팩트 있는 동사로 문장 시작을 개선",
            prompt: '각 성과를 강력한 액션 동사로 시작하도록 수정해주세요. "담당했습니다" 대신 "개발했습니다", "달성했습니다" 등을 사용하세요.',
        },

        // 디자인 관련
        {
            id: "design-modern-look",
            category: "design",
            label: "모던한 디자인",
            description: "현대적이고 세련된 시각적 스타일 적용",
            prompt: "더 모던하고 세련된 디자인으로 수정해주세요. 깔끔한 레이아웃과 현대적인 스타일을 적용하세요.",
        },
        {
            id: "design-minimal-clean",
            category: "design",
            label: "미니멀 & 깔끔",
            description: "불필요한 요소를 제거하고 핵심에 집중",
            prompt: "미니멀하고 깔끔한 디자인으로 수정해주세요. 불필요한 요소를 제거하고 핵심 내용에 집중하세요.",
        },
    ];

    getFeedbackOptions(): FeedbackOption[] {
        return this.feedbackOptions;
    }

    getFeedbackOptionsByCategory(category: string): FeedbackOption[] {
        return this.feedbackOptions.filter(
            (option) => option.category === category
        );
    }

    async applyUserFeedback(
        originalContent: string,
        feedback: UserFeedback,
        contentData: OrganizedContent
    ): Promise<FeedbackResult> {
        try {
            // 선택된 옵션들의 프롬프트 수집
            const selectedPrompts = feedback.selectedOptions
                .map((optionId) =>
                    this.feedbackOptions.find((opt) => opt.id === optionId)
                )
                .filter((opt) => opt !== undefined)
                .map((opt) => opt!.prompt);

            // 모든 수정 요청 합치기
            const allRequests = [
                ...selectedPrompts,
                ...feedback.customRequests,
            ];

            if (allRequests.length === 0) {
                return {
                    revisedContent: originalContent,
                    changesApplied: [],
                    improvementScore: 0,
                    finalQualityScore: 85, // 기본값
                };
            }

            const systemPrompt = `
당신은 포트폴리오 개선 전문가입니다. 
사용자의 피드백을 바탕으로 포트폴리오를 수정하세요.

개선 원칙:
1. 기존 내용의 핵심은 유지하되 표현과 구조를 개선
2. 사실과 데이터는 변경하지 말고 표현 방식만 개선
3. 일관된 톤과 스타일 유지
4. 채용담당자 관점에서 더 매력적으로 만들기

수정 요청사항:
${allRequests.map((req, idx) => `${idx + 1}. ${req}`).join("\n")}

원본 포트폴리오를 위 요청사항에 따라 수정하되, 과도한 변경은 피하고 자연스럽게 개선해주세요.
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `수정할 포트폴리오:\n\n${originalContent}`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 3000,
            });

            const revisedContent =
                response.choices[0].message.content || originalContent;

            // 적용된 변경사항 분석
            const changesApplied = await this.analyzeChanges(
                originalContent,
                revisedContent,
                feedback
            );

            // 개선 점수 계산
            const improvementScore = await this.calculateImprovementScore(
                originalContent,
                revisedContent
            );

            // 최종 품질 점수 계산
            const finalQualityScore = await this.calculateFinalQuality(
                revisedContent,
                contentData
            );

            return {
                revisedContent,
                changesApplied,
                improvementScore,
                finalQualityScore,
            };
        } catch (error) {
            console.error("User feedback application error:", error);
            return {
                revisedContent: originalContent,
                changesApplied: ["피드백 적용 중 오류가 발생했습니다."],
                improvementScore: 0,
                finalQualityScore: 75,
            };
        }
    }

    private async analyzeChanges(
        original: string,
        revised: string,
        feedback: UserFeedback
    ): Promise<string[]> {
        const selectedOptions = feedback.selectedOptions
            .map((id) => this.feedbackOptions.find((opt) => opt.id === id))
            .filter((opt) => opt !== undefined)
            .map((opt) => opt!.label);

        // 선택된 옵션들을 변경사항으로 반환
        const changes = [...selectedOptions];

        if (feedback.customRequests.length > 0) {
            changes.push("사용자 맞춤 요청 반영");
        }

        return changes;
    }

    private async calculateImprovementScore(
        original: string,
        revised: string
    ): Promise<number> {
        try {
            const systemPrompt = `
원본과 수정본을 비교하여 개선 정도를 0-100점으로 평가하세요.

평가 기준:
- 가독성 향상: 더 읽기 쉬워졌는가?
- 임팩트 강화: 더 인상적이고 설득력 있어졌는가?
- 전문성 향상: 더 전문적이고 신뢰할 만해졌는가?
- 구조 개선: 더 체계적이고 논리적이 되었는가?

숫자만 반환하세요 (예: 25)
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `원본:\n${original}\n\n수정본:\n${revised}`,
                    },
                ],
                temperature: 0.1,
                max_tokens: 10,
            });

            const score = parseInt(response.choices[0].message.content || "15");
            return Math.max(0, Math.min(100, score));
        } catch (error) {
            console.error("Improvement score calculation error:", error);
            return 15;
        }
    }

    private async calculateFinalQuality(
        content: string,
        contentData: OrganizedContent
    ): Promise<number> {
        try {
            const systemPrompt = `
최종 포트폴리오의 품질을 0-100점으로 평가하세요.

평가 기준:
1. 완성도 (25점): 모든 필수 정보가 포함되어 있는가?
2. 가독성 (25점): 구조가 명확하고 읽기 쉬운가?
3. 임팩트 (25점): 성과가 구체적이고 인상적인가?
4. 전문성 (25점): 신뢰할 만하고 전문적인가?

숫자만 반환하세요 (예: 88)
`;

            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `포트폴리오:\n${content}` },
                ],
                temperature: 0.1,
                max_tokens: 10,
            });

            const score = parseInt(response.choices[0].message.content || "80");
            return Math.max(0, Math.min(100, score));
        } catch (error) {
            console.error("Final quality calculation error:", error);
            return 80;
        }
    }

    // 피드백 옵션을 카테고리별로 그룹화
    getGroupedOptions(): Record<string, FeedbackOption[]> {
        return this.feedbackOptions.reduce((groups, option) => {
            if (!groups[option.category]) {
                groups[option.category] = [];
            }
            groups[option.category].push(option);
            return groups;
        }, {} as Record<string, FeedbackOption[]>);
    }

    // 카테고리별 한국어 이름
    getCategoryNames(): Record<string, string> {
        return {
            tone: "🗣️ 톤 & 어조",
            content: "📝 내용 & 구성",
            structure: "🏗️ 구조 & 순서",
            style: "✨ 스타일 & 표현",
            design: "🎨 디자인 & 레이아웃",
        };
    }
}

export const userFeedbackService = new UserFeedbackService();
