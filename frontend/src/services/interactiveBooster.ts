import OpenAI from "openai";
import { OrganizedContent } from "./aiOrganizer";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true,
});

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export interface BoosterQuestion {
    id: string;
    category:
        | "experience"
        | "project"
        | "skill"
        | "achievement"
        | "metric"
        | "general";
    priority: "high" | "medium" | "low";
    question: string;
    context: string; // 왜 이 질문이 중요한지
    expectedAnswer:
        | "short_text"
        | "long_text"
        | "number"
        | "date"
        | "url"
        | "file";
    suggestions?: string[]; // 답변 예시/제안
    targetField: string; // 어떤 필드를 보강하는지
    relatedItem?: any; // 관련된 경험/프로젝트 객체
}

export interface BoosterSession {
    sessionId: string;
    questions: BoosterQuestion[];
    currentQuestionIndex: number;
    answers: { [questionId: string]: any };
    progress: number; // 0-100%
    completedFields: string[];
    remainingFields: string[];
    lastUpdated: Date;
}

export interface BoostResult {
    enhancedContent: OrganizedContent;
    improvementScore: number; // 0-100 개선점수
    beforeAfterComparison: {
        before: { field: string; value: any }[];
        after: { field: string; value: any }[];
    };
    qualityMetrics: {
        completeness: number; // 완성도
        specificity: number; // 구체성
        impact: number; // 임팩트
        atsScore: number; // ATS 점수
    };
}

class InteractiveBooster {
    async generateQuestions(
        organizedContent: OrganizedContent
    ): Promise<BoosterQuestion[]> {
        const systemPrompt = `
채용담당자 관점에서 포트폴리오의 부족한 부분을 파악하고, 효과적인 질문을 생성하세요.

질문 우선순위:
1. HIGH: 성과 수치, 프로젝트 임팩트, 핵심 기술 경험
2. MEDIUM: 협업 경험, 문제해결 사례, 학습 과정
3. LOW: 개인적 동기, 커리어 목표, 부가적 정보

질문 유형:
- experience: 경력 관련 (담당업무, 성과, 기간)
- project: 프로젝트 관련 (역할, 기술, 결과)
- skill: 기술 관련 (숙련도, 경험, 활용)
- achievement: 성과 관련 (수치, 임팩트)  
- metric: 구체적 수치 관련
- general: 일반적 보완사항

중요: expectedAnswer가 "number"인 경우, suggestions는 반드시 순수 숫자만 포함해야 합니다 (예: "1000", "30", "50")
텍스트나 단위는 포함하지 마세요.

JSON 배열 형식으로 반환:
[
  {
    "id": "q1",
    "category": "metric",
    "priority": "high", 
    "question": "마케팅 캠페인으로 유치한 사용자 수는 몇 명인가요?",
    "context": "구체적 성과 수치는 채용담당자가 임팩트를 평가하는 핵심 지표입니다",
    "expectedAnswer": "number",
    "suggestions": ["1000", "5000", "10000"],
    "targetField": "projects[0].achievements",
    "relatedItem": { "name": "마케팅 플랫폼", "index": 0 }
  }
]

최대 7-10개의 질문을 우선순위 순으로 생성하세요.
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `다음 정리된 포트폴리오를 분석하여 보강 질문을 생성해주세요:\n\n${JSON.stringify(
                            organizedContent,
                            null,
                            2
                        )}`,
                    },
                ],
                max_tokens: 2000,
            });

            const result = response.choices[0].message.content || "[]";
            let cleanedResult = result;

            if (result.includes("```json")) {
                const match = result.match(/```json\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            }

            const questions = JSON.parse(cleanedResult) as BoosterQuestion[];

            // number 타입 질문의 suggestions 정제
            return questions.map((q) => {
                if (q.expectedAnswer === "number" && q.suggestions) {
                    q.suggestions = q.suggestions.map((s) => {
                        // 숫자만 추출
                        const numericValue = s
                            .toString()
                            .replace(/[^0-9.-]/g, "");
                        return numericValue || "0";
                    });
                }
                return q;
            });
        } catch (error) {
            return [];
        }
    }

    async createBoosterSession(
        organizedContent: OrganizedContent
    ): Promise<BoosterSession> {
        const questions = await this.generateQuestions(organizedContent);

        // 우선순위로 정렬
        const sortedQuestions = questions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        return {
            sessionId: `session_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            questions: sortedQuestions,
            currentQuestionIndex: 0,
            answers: {},
            progress: 0,
            completedFields: [],
            remainingFields: sortedQuestions.map((q) => q.targetField),
            lastUpdated: new Date(),
        };
    }

    async processAnswer(
        session: BoosterSession,
        questionId: string,
        answer: any
    ): Promise<BoosterSession> {
        const question = session.questions.find((q) => q.id === questionId);
        if (!question) return session;

        // 답변 저장
        session.answers[questionId] = {
            answer,
            timestamp: new Date(),
            question: question.question,
        };

        // 진행률 업데이트
        const answeredCount = Object.keys(session.answers).length;
        session.progress = Math.round(
            (answeredCount / session.questions.length) * 100
        );

        // 완성된 필드 업데이트
        if (!session.completedFields.includes(question.targetField)) {
            session.completedFields.push(question.targetField);
        }

        session.remainingFields = session.remainingFields.filter(
            (field) => !session.completedFields.includes(field)
        );

        session.lastUpdated = new Date();

        // 다음 질문으로 이동 (마지막 질문에서도 인덱스 증가)
        session.currentQuestionIndex++;

        return session;
    }

    async generateBoostResult(
        originalContent: OrganizedContent,
        session: BoosterSession
    ): Promise<BoostResult> {
        const systemPrompt = `
사용자의 답변을 바탕으로 포트폴리오를 개선하세요.

개선 원칙:
1. 답변 내용을 해당 필드에 자연스럽게 통합
2. 수치가 있으면 반드시 포함
3. 기존 내용과 중복되지 않도록 병합
4. 전체적인 일관성 유지
5. ATS 키워드 자동 추가

품질 평가 기준:
- completeness: 필수 정보 채움 정도
- specificity: 구체적 수치/사례 포함 정도  
- impact: 비즈니스 임팩트 표현 정도
- atsScore: ATS 최적화 점수

JSON 형식으로 반환:
{
  "enhancedContent": { ... 개선된 OrganizedContent },
  "improvementScore": 85,
  "beforeAfterComparison": {
    "before": [{"field": "projects[0].achievements", "value": ["기본 성과"]}],
    "after": [{"field": "projects[0].achievements", "value": ["사용자 30% 증가", "매출 200만원 기여"]}]
  },
  "qualityMetrics": {
    "completeness": 90,
    "specificity": 85, 
    "impact": 80,
    "atsScore": 75
  }
}
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `
원본 포트폴리오:
${JSON.stringify(originalContent, null, 2)}

질문과 답변:
${JSON.stringify(session.answers, null, 2)}

이를 바탕으로 포트폴리오를 개선해주세요.
`,
                    },
                ],
                max_tokens: 3000,
            });

            const result = response.choices[0].message.content || "{}";
            let cleanedResult = result;

            if (result.includes("```json")) {
                const match = result.match(/```json\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            } else if (result.includes("```")) {
                const match = result.match(/```\n([\s\S]*?)\n```/);
                cleanedResult = match ? match[1] : result;
            }

            // JSON이 아닌 텍스트가 포함된 경우 기본값 반환
            try {
                const parsed = JSON.parse(cleanedResult);
                return parsed as BoostResult;
            } catch (parseError) {
                    "JSON parsing failed, using fallback:",
                    parseError
                );

                // 기본값으로 반환 (사용자 답변은 유지)
                return {
                    enhancedContent: originalContent,
                    improvementScore: 15,
                    beforeAfterComparison: { before: [], after: [] },
                    qualityMetrics: {
                        completeness: 75,
                        specificity: 70,
                        impact: 65,
                        atsScore: 60,
                    },
                };
            }
        } catch (error) {
            return {
                enhancedContent: originalContent,
                improvementScore: 0,
                beforeAfterComparison: { before: [], after: [] },
                qualityMetrics: {
                    completeness: 50,
                    specificity: 50,
                    impact: 50,
                    atsScore: 50,
                },
            };
        }
    }

    async getNextQuestion(
        session: BoosterSession
    ): Promise<BoosterQuestion | null> {
        if (session.currentQuestionIndex >= session.questions.length) {
            return null; // 모든 질문 완료
        }

        return session.questions[session.currentQuestionIndex];
    }

    async skipQuestion(session: BoosterSession): Promise<BoosterSession> {
        session.currentQuestionIndex++;
        session.lastUpdated = new Date();
        return session;
    }

    getSessionStats(session: BoosterSession) {
        const totalQuestions = session.questions.length;
        const answeredQuestions = Object.keys(session.answers).length;
        const highPriorityAnswered = Object.keys(session.answers).filter(
            (id) => {
                const question = session.questions.find((q) => q.id === id);
                return question?.priority === "high";
            }
        ).length;
        const highPriorityTotal = session.questions.filter(
            (q) => q.priority === "high"
        ).length;

        return {
            totalQuestions,
            answeredQuestions,
            progress: session.progress,
            highPriorityCompleted: highPriorityAnswered,
            highPriorityTotal,
            estimatedTimeRemaining: Math.max(
                0,
                (totalQuestions - answeredQuestions) * 2
            ), // 2분 per question
            completedCategories: Array.from(
                new Set(
                    session.completedFields.map((field) => field.split("[")[0])
                )
            ),
        };
    }
}

export const interactiveBooster = new InteractiveBooster();
