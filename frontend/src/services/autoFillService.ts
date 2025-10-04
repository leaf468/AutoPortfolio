import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true
});

const MODEL = "gpt-4o-mini";

export type BlockOrigin = 'user_provided' | 'ai_generated' | 'user_edited';

export interface TextBlock {
    block_id: string;
    section_id: string;
    text: string;
    origin: BlockOrigin;
    confidence: number;
    auto_fill_reason?: string;
    created_at: string;
    created_by: string;
    updated_at?: string;
    extractedData?: any; // 실제 포트폴리오 데이터 저장
    metadata?: {
        tone?: string;
        tags?: string[];
    };
    edit_history?: Array<{
        text: string;
        edited_at: string;
        edited_by: string;
    }>;
}

export interface Section {
    section_id: string;
    section_title: string;
    blocks: TextBlock[];
}

export interface PortfolioDocument {
    doc_id: string;
    user_id: string;
    sections: Section[];
    created_at: string;
    updated_at: string;
}

export interface GenerateRequest {
    user_id: string;
    inputs: {
        profile?: string;
        content?: string; // 추가: 원본 사용자 입력
        projects?: Array<{
            title: string;
            description: string;
            role?: string;
            duration?: string;
        }>;
        skills?: string[];
        education?: string;
        experience?: string;
        tone?: string;
        target_job?: string;
        target_job_keywords?: string[];
    };
    target_job_keywords?: string[];
    locale?: string;
    organized_content?: any; // AI가 이미 분석한 내용
    template?: 'minimal' | 'clean' | 'colorful' | 'elegant'; // 템플릿 정보 추가
}

// ====================================================================
// 카테고리별 Few-shot 예시 데이터
// ====================================================================
const CATEGORY_EXAMPLES = {
    "Self-introduction": [
        {
            input: "저는 프론트엔드 개발자입니다. 사용자 경험에 관심이 많습니다.",
            output: "저는 프론트엔드 개발자로서 다양한 웹 애플리케이션을 설계하고 개발한 경험이 있습니다. 사용자 경험(UX)에 깊은 관심을 가지고 있으며, <span style=\"color:orange\">React, Vue 등 주요 프론트엔드 프레임워크에 능숙</span>하고, <span style=\"color:orange\">스타트업 환경에서 협업 경험</span>을 통해 문제 해결 능력을 키워왔습니다."
        },
        {
            input: "데이터 분석가로 일해왔습니다.",
            output: "저는 데이터 분석가로 활동하며 비즈니스 의사결정을 위한 데이터 기반 인사이트를 도출해왔습니다. 특히 <span style=\"color:orange\">SQL, Python, R을 활용한 분석 역량</span>과 <span style=\"color:orange\">A/B 테스트 설계 및 KPI 관리 경험</span>을 통해 기업 성장을 지원했습니다."
        }
    ],
    "Achievements": [
        {
            input: "프로젝트에서 매출 향상에 기여했습니다.",
            output: "A 프로젝트를 통해 신규 기능을 제안하고 구현하여 매출 향상에 기여했습니다. 그 결과 <span style=\"color:orange\">월 매출이 15% 증가</span>하였으며, <span style=\"color:orange\">이 과정에서 기여도는 기획 30%, 개발 70%</span>를 차지했습니다."
        },
        {
            input: "고객 만족도 개선에 도움을 줬습니다.",
            output: "고객 인터뷰와 설문 분석을 기반으로 UX 개선을 주도하여 고객 만족도를 높였습니다. 특히 <span style=\"color:orange\">NPS(Net Promoter Score)가 20점 상승</span>했고, <span style=\"color:orange\">서비스 이탈률이 10% 감소</span>하는 성과를 달성했습니다."
        }
    ],
    "Projects": [
        {
            input: "챗봇 서비스를 만들었습니다.",
            output: "챗봇 서비스를 기획 및 개발하여 고객 상담 자동화를 구현했습니다. 이 프로젝트에서 <span style=\"color:orange\">팀 리더로서 프로젝트 관리와 백엔드 API 설계를 담당</span>했으며, <span style=\"color:orange\">사용자 응답 시간을 평균 40% 단축</span>시켰습니다."
        },
        {
            input: "웹사이트를 제작했습니다.",
            output: "기업 홍보용 웹사이트 제작 프로젝트에 참여했습니다. <span style=\"color:orange\">제 역할은 UI/UX 디자인과 프론트엔드 개발</span>이었으며, 이를 통해 <span style=\"color:orange\">사이트 방문자 수가 3개월 내 200% 증가</span>하는 성과를 거두었습니다."
        }
    ],
    "Career": [
        {
            input: "스타트업에서 일했습니다.",
            output: "2021년부터 2023년까지 스타트업에서 근무하며 <span style=\"color:orange\">프로덕트 매니저(직책)</span>로 활동했습니다. <span style=\"color:orange\">서비스 기획, 데이터 기반 개선, 투자 유치 지원</span> 등의 업무를 수행했습니다."
        },
        {
            input: "대기업에서 인턴 경험이 있습니다.",
            output: "2022년 6월부터 2022년 8월까지 <span style=\"color:orange\">삼성전자 DS부문에서 데이터 엔지니어 인턴</span>으로 근무했습니다. 이 기간 동안 <span style=\"color:orange\">데이터 파이프라인 최적화 및 자동화 업무</span>를 담당했습니다."
        }
    ]
};

class AutoFillService {
    private generateBlockId(): string {
        return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private generateDocId(): string {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 카테고리 감지 함수
     * 입력된 텍스트가 어떤 카테고리에 속하는지 키워드 기반으로 판단
     */
    private detectCategory(text: string): string {
        const lowerText = text.toLowerCase();

        // 자기소개 키워드
        const selfIntroKeywords = ['저는', '입니다', '관심', '전공', '좋아합니다', '개발자', '디자이너', '분석가'];
        // 성과 키워드
        const achievementKeywords = ['향상', '증가', '개선', '달성', '성과', '기여', '매출', '만족도', 'kpi', 'nps'];
        // 프로젝트 키워드
        const projectKeywords = ['프로젝트', '개발', '제작', '구축', '만들', '설계', '구현', '서비스', '앱', '웹사이트'];
        // 경력 키워드
        const careerKeywords = ['근무', '회사', '인턴', '경력', '팀', '부서', '담당', '직책', '년부터', '월부터'];

        const countMatches = (keywords: string[]) => {
            const matches = keywords.filter(keyword => lowerText.includes(keyword));
            return { count: matches.length, matched: matches };
        };

        const selfIntro = countMatches(selfIntroKeywords);
        const achievement = countMatches(achievementKeywords);
        const project = countMatches(projectKeywords);
        const career = countMatches(careerKeywords);

        const scores = {
            'Self-introduction': selfIntro.count,
            'Achievements': achievement.count,
            'Projects': project.count,
            'Career': career.count
        };

        // 가장 높은 점수의 카테고리 반환
        const category = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 [카테고리 감지] 분석 시작');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 입력 텍스트:', text);
        console.log('📏 텍스트 길이:', text.length, '자');
        console.log('');
        console.log('🔍 키워드 매칭 결과:');
        console.log('   자기소개:', selfIntro.count, '개 -', selfIntro.matched.join(', ') || '없음');
        console.log('   성과:', achievement.count, '개 -', achievement.matched.join(', ') || '없음');
        console.log('   프로젝트:', project.count, '개 -', project.matched.join(', ') || '없음');
        console.log('   경력:', career.count, '개 -', career.matched.join(', ') || '없음');
        console.log('');
        console.log('🎯 최종 분류:', category);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

        return category;
    }

    /**
     * 텍스트 자동 확장 함수
     * 사용자 입력을 받아 카테고리별 Few-shot 학습을 통해 자동으로 확장
     */
    async expandText(userInput: string): Promise<string> {
        try {
            console.log('');
            console.log('🚀 ========================================');
            console.log('🚀 [AUTO EXPAND] 자동 확장 시작');
            console.log('🚀 ========================================');

            // 카테고리 감지
            const detectedCategory = this.detectCategory(userInput);
            const examples = CATEGORY_EXAMPLES[detectedCategory as keyof typeof CATEGORY_EXAMPLES] || [];

            console.log('📚 Few-shot 학습 예시:', examples.length, '개');
            examples.forEach((ex, idx) => {
                console.log(`   예시 ${idx + 1}:`);
                console.log(`     입력: ${ex.input}`);
                console.log(`     출력: ${ex.output.substring(0, 80)}...`);
            });
            console.log('');

            // Few-shot 프롬프트 구성
            const examplesText = examples.map((ex, idx) =>
                `예시 ${idx + 1}:\n입력: "${ex.input}"\n출력: "${ex.output}"\n`
            ).join('\n');

            const systemPrompt = `당신은 포트폴리오 자동 생성 전문가입니다.
사용자가 입력한 텍스트를 기반으로, 자기소개(Self-introduction), 성과(Achievements), 프로젝트(Projects), 커리어(Career) 항목을 전문적인 포트폴리오 문장으로 확장합니다.

## 핵심 지시사항
1. **원문 보존**: 사용자가 입력한 텍스트는 반드시 포함시키되 문맥상 자연스럽게 녹여 쓰십시오.
2. **누락 정보 보완**: 기간, 직책, 기여도, 사용 기술, 성과 지표(%, 증가율, 감소율, 지표 변화 등)가 빠져 있다면 합리적으로 추정하여 채우십시오.
3. **순수 텍스트 출력**: HTML 태그, 마크다운, 특수 문자를 사용하지 말고 순수한 텍스트로만 출력하십시오.
4. **가독성 향상**:
   - 문장이 길어지면 적절한 위치에 줄바꿈(\\n)을 추가하십시오.
   - 하나의 문단이 3-4문장 이상이면 관련 주제별로 단락을 나누십시오.
   - 예: "첫 번째 문장. 두 번째 문장.\\n\\n세 번째 문장으로 새로운 주제 시작."
5. **자연스러운 표현**: 결과 문장은 포트폴리오/이력서에 어울리도록 매끄럽고 전문적으로 표현하십시오.
6. **정량화 우선**: 가능하다면 정량적 성과(수치, 지표, 기간 등)로 표현하십시오.
7. **출력 형식**:
   - 코드 블록, 마크다운, 설명 문구를 출력하지 말고 **최종 완성된 문장만** 출력하십시오.
   - 입력된 텍스트가 어떤 항목(Self-intro, Achievements, Projects, Career)에 해당하는지 파악하고 해당 형식으로 작성하십시오.

## 카테고리: ${detectedCategory}

참고 예시 (실제 출력에서는 <span> 태그 없이 순수 텍스트로만 출력, 필요시 \\n으로 줄바꿈):
${examplesText}

이제 다음 입력을 위 예시 스타일로 확장하되, HTML 태그 없이 순수 텍스트로만 출력하고 가독성을 위해 적절한 위치에 줄바꿈을 추가하십시오:`;

            const userMessage = `입력: "${userInput}"
출력:`;

            console.log('🤖 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🤖 [AI 요청] OpenAI API 호출 시작');
            console.log('🤖 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📤 모델:', MODEL);
            console.log('📤 Temperature:', 0.7);
            console.log('📤 Max Tokens:', 500);
            console.log('📤 프롬프트 길이:', systemPrompt.length + userMessage.length, '자');
            console.log('');
            console.log('📤 System Prompt (처음 200자):');
            console.log('   ', systemPrompt.substring(0, 200) + '...');
            console.log('');
            console.log('📤 User Message:');
            console.log('   ', userMessage);
            console.log('');

            const requestStartTime = Date.now();
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 500
            });
            const requestDuration = Date.now() - requestStartTime;

            const expandedText = response.choices[0].message.content?.trim() || userInput;

            console.log('📥 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📥 [AI 응답] OpenAI API 응답 수신');
            console.log('📥 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⏱️  응답 시간:', requestDuration, 'ms');
            console.log('📊 토큰 사용량:');
            console.log('   - Prompt:', response.usage?.prompt_tokens || 'N/A');
            console.log('   - Completion:', response.usage?.completion_tokens || 'N/A');
            console.log('   - Total:', response.usage?.total_tokens || 'N/A');
            console.log('');
            console.log('📝 원본 텍스트 (입력):');
            console.log('   ', userInput);
            console.log('   길이:', userInput.length, '자');
            console.log('');
            console.log('✨ 확장된 텍스트 (출력):');
            console.log('   ', expandedText);
            console.log('   길이:', expandedText.length, '자');
            console.log('   증가:', expandedText.length - userInput.length, '자');
            console.log('');

            // 변화 분석
            if (expandedText === userInput) {
                console.log('⚠️  변화 없음: AI가 원본을 그대로 반환했습니다.');
            } else {
                console.log('✅ 확장 성공: 텍스트가 성공적으로 확장되었습니다.');

                // 추가된 내용 하이라이트
                if (expandedText.includes(userInput)) {
                    console.log('');
                    console.log('🔍 추가된 내용:');
                    const addedText = expandedText.replace(userInput, '');
                    console.log('   ', addedText.trim());
                } else {
                    console.log('');
                    console.log('⚠️  원본이 포함되지 않음: AI가 완전히 새로운 텍스트를 생성했습니다.');
                }
            }

            console.log('');
            console.log('✅ ========================================');
            console.log('✅ [AUTO EXPAND] 자동 확장 완료');
            console.log('✅ ========================================');
            console.log('');

            return expandedText;

        } catch (error) {
            console.log('');
            console.log('❌ ========================================');
            console.log('❌ [AUTO EXPAND] 자동 확장 실패');
            console.log('❌ ========================================');
            console.error('❌ 에러 상세:', error);
            if (error instanceof Error) {
                console.error('❌ 에러 메시지:', error.message);
                console.error('❌ 에러 스택:', error.stack);
            }
            console.log('🔄 원본 텍스트를 그대로 반환합니다.');
            console.log('');
            // 오류 시 원본 텍스트 반환
            return userInput;
        }
    }

    async generatePortfolio(request: GenerateRequest): Promise<PortfolioDocument> {
        try {
            console.log('=== AutoFill 포트폴리오 생성 시작 ===');
            console.log('입력 요청 데이터:', request);

            // 템플릿별 특화 지침 생성
            const getTemplateGuidance = (template?: string) => {
                switch (template) {
                    case 'clean':
                        return "\n=== 깨끗한 레이아웃 템플릿 특화 지침 ===\n" +
                               "• **위치 정보 필수**: location 필드에 'Seoul, Korea' 등 구체적 위치 포함\n" +
                               "• **주요 성과 강조**: 각 경력에서 achievements 배열로 구체적 성과 나열\n" +
                               "• **전문성 중심**: 비즈니스 임팩트와 기술적 전문성을 균형있게 표현\n" +
                               "• **섹션 순서**: 개인소개 → 스킬셋 → 커리어/경력 → 프로젝트 → 수상/자격증\n\n";
                    case 'minimal':
                        return "\n=== 미니멀리스트 템플릿 특화 지침 ===\n" +
                               "• **교육 배경 포함**: education 섹션에 학력 정보 상세히 기술\n" +
                               "• **간결한 표현**: 핵심 내용을 간결하고 명확하게 전달\n" +
                               "• **프로젝트 중심**: 개인 프로젝트와 포트폴리오 작품을 상세히 기술\n" +
                               "• **섹션 순서**: 기본정보 → 자기소개 → 프로젝트 → 기술스택 → 경력 → 학력\n\n";
                    case 'colorful':
                    case 'elegant':
                        return "\n=== 창의형 템플릿 특화 지침 ===\n" +
                               "• **경험 중심**: Experience 섹션을 가장 중요하게 다루기\n" +
                               "• **창의적 표현**: 독특하고 인상적인 프로젝트 스토리텔링\n" +
                               "• **사용자 경험 강조**: UI/UX 관련 성과와 사용자 만족도 지표 포함\n" +
                               "• **섹션 순서**: 기본정보 → About Me → Experience → Projects → Skills\n\n";
                    default:
                        return "\n=== 일반 템플릿 지침 ===\n" +
                               "• 균형있는 섹션 구성으로 전문성과 개성을 모두 어필\n\n";
                }
            };

            const systemPrompt = "당신은 글로벌 테크 기업(Google, Apple, Amazon, Netflix)의 HR 전문가 10년 경력을 가진 포트폴리오 데이터 아키텍트입니다.\n" +
                "채용 성공률 95%를 자랑하는 실전 포트폴리오 제작 전문가로, 실제 면접관의 시선과 사고방식을 완벽히 이해합니다.\n\n" +
                "**CRITICAL**: 당신의 임무는 사용자가 입력한 원본 데이터를 분석하여, 각 정보가 포트폴리오의 어느 섹션에 속하는지 정확히 판단하고 구조화된 JSON 데이터를 생성하는 것입니다.\n\n" +
                "=== 데이터 분류 가이드 (MOST IMPORTANT) ===\n" +
                "사용자 입력을 분석하여 각 정보를 다음 섹션으로 분류하세요:\n\n" +
                "1. **기본 정보 (name, title, email, phone, github, location)**\n" +
                "   - 이름, 연락처, 소셜 미디어 링크 등 식별 정보\n" +
                "   - title: 한 줄로 자신을 소개하는 문구 (예: 'Senior Full-Stack Developer', 'AI Engineer')\n" +
                "   - location: 거주 지역 (Clean 템플릿에서 사용)\n\n" +
                "2. **자기소개 (about)**\n" +
                "   - 자신의 배경, 전문성, 가치관, 목표를 담은 300-500자의 풍부한 내러티브\n" +
                "   - STAR 구조: 배경 → 전환점/중요 경험 → 현재 전문성 → 미래 비전\n" +
                "   - 사용자 입력에 자기소개가 없으면 다른 정보를 종합하여 작성\n\n" +
                "3. **기술 스택 (skills)**\n" +
                "   - 프로그래밍 언어, 프레임워크, 도구, 소프트 스킬\n" +
                "   - 배열 형태: [\"React\", \"TypeScript\", \"Node.js\"] 또는\n" +
                "   - 카테고리 형태: [{\"category\": \"Frontend\", \"skills\": [\"React\", \"Vue\"], \"icon\": \"💻\"}]\n\n" +
                "4. **프로젝트 (projects)**\n" +
                "   - 개인/팀 프로젝트, 사이드 프로젝트, 포트폴리오 작품\n" +
                "   - 각 프로젝트마다 STAR 구조로 200-300자 설명\n" +
                "   - 필수 필드: name, description, role, period, tech, achievements\n\n" +
                "5. **경력/경험 (experience)**\n" +
                "   - 회사 경력, 인턴십, 자원봉사, 동아리 활동 등\n" +
                "   - 각 경력마다 150-200자 설명\n" +
                "   - 필수 필드: position, company, duration, description, achievements, technologies\n\n" +
                "6. **학력 (education)**\n" +
                "   - 대학, 부트캠프, 온라인 과정, 자격증\n" +
                "   - 필수 필드: school, degree, period, description\n\n" +
                "**분류 원칙:**\n" +
                "- 사용자 입력이 명확하지 않으면 문맥을 분석하여 가장 적절한 섹션에 배치\n" +
                "- 한 정보가 여러 섹션에 걸쳐있으면 주요 섹션에 배치하고 나머지는 참조\n" +
                "- 빈 섹션이 있어도 괜찮음 (억지로 채우지 말 것)\n" +
                "- STAR 프레임워크를 적용하여 풍부한 내용으로 확장\n\n" +
                "**IMPORTANT**: You must respond in JSON format only. Your response must be a valid JSON object with the following structure:\n" +
                "{\n" +
                "  \"portfolioData\": {\n" +
                "    \"name\": \"이름 (입력에서 추출, 없으면 'Your Name')\",\n" +
                "    \"title\": \"한 줄 소개 (예: Senior Full-Stack Developer)\",\n" +
                "    \"email\": \"이메일 (입력에서 추출, 없으면 'youremail@example.com')\",\n" +
                "    \"phone\": \"전화번호 (입력에서 추출, 없으면 '010-0000-0000')\",\n" +
                "    \"github\": \"깃허브 (입력에서 추출, 없으면 빈 문자열)\",\n" +
                "    \"location\": \"위치 (Clean 템플릿용, 입력에서 추출, 없으면 'Seoul, Korea')\",\n" +
                "    \"about\": \"자기소개 (300-500자의 풍부한 내용, STAR 구조)\",\n" +
                "    \"skills\": [\"기술1\", \"기술2\", ...] 또는 [{\"category\": \"Frontend\", \"skills\": [...], \"icon\": \"💻\"}],\n" +
                "    \"projects\": [\n" +
                "      {\n" +
                "        \"name\": \"프로젝트명\",\n" +
                "        \"description\": \"상세 설명 (200-300자, STAR 구조: 상황-과제-행동-결과-통찰)\",\n" +
                "        \"role\": \"역할 (예: Frontend Developer, Team Lead)\",\n" +
                "        \"period\": \"기간 (예: 2023.01 - 2023.06)\",\n" +
                "        \"company\": \"회사/조직 (선택사항)\",\n" +
                "        \"tech\": [\"기술1\", \"기술2\"],\n" +
                "        \"achievements\": [\"성과1 (정량적 지표 포함)\", \"성과2\"]\n" +
                "      }\n" +
                "    ],\n" +
                "    \"experience\": [\n" +
                "      {\n" +
                "        \"position\": \"직책\",\n" +
                "        \"company\": \"회사명\",\n" +
                "        \"duration\": \"기간\",\n" +
                "        \"description\": \"업무 설명 (150-200자, STAR 구조)\",\n" +
                "        \"achievements\": [\"성과1 (정량적 지표 포함)\", \"성과2\"],\n" +
                "        \"technologies\": [\"기술1\", \"기술2\"]\n" +
                "      }\n" +
                "    ],\n" +
                "    \"education\": [\n" +
                "      {\n" +
                "        \"school\": \"학교명\",\n" +
                "        \"degree\": \"학위/전공\",\n" +
                "        \"period\": \"기간\",\n" +
                "        \"description\": \"세부사항 (선택사항)\"\n" +
                "      }\n" +
                "    ]\n" +
                "  },\n" +
                "  \"html_content\": \"<완성된 HTML 포트폴리오>\"\n" +
                "}\n\n" +
                "=== 핵심 철학: STAR+I 프레임워크 ===\n" +
                "모든 경험은 반드시 다음 구조로 재구성:\n" +
                "• **S**ituation (상황): 비즈니스 맥락과 해결해야 할 문제의 본질\n" +
                "• **T**ask (과제): 구체적으로 맡은 역할과 책임 범위\n" +
                "• **A**ction (행동): 기술적 선택의 근거와 실행 과정의 전략\n" +
                "• **R**esult (결과): 정량적 성과 + 정성적 임팩트 (비즈니스/사용자 관점)\n" +
                "• **I**nsight (통찰): 이 경험에서 얻은 교훈과 성장 포인트\n\n" +
                "=== HR 전문가의 7가지 평가 기준 ===\n" +
                "1. **비즈니스 임팩트**: 기술 스킬보다 '회사/사용자에게 어떤 가치를 만들었는가'\n" +
                "2. **문제 해결 능력**: 주어진 과제를 어떻게 분해하고 우선순위를 정했는가\n" +
                "3. **데이터 기반 사고**: 수치와 지표로 의사결정하고 성과를 증명하는 능력\n" +
                "4. **협업 & 리더십**: 팀 내 역할, 커뮤니케이션, 갈등 해결 경험\n" +
                "5. **학습 민첩성**: 새로운 기술을 빠르게 습득하고 적용한 사례\n" +
                "6. **주도성**: 지시받은 일이 아닌, 스스로 발견하고 개선한 경험\n" +
                "7. **성장 가능성**: 현재 수준을 넘어 앞으로 어떻게 발전할 수 있는가\n\n" +
                getTemplateGuidance(request.template) +
                "=== 실전 변환 전략 ===\n" +
                "**Phase 1: 원본 분석 (Deep Dive)**\n" +
                "- 사용자 입력에서 숨겨진 스토리 발굴 (명시되지 않은 문제의식, 의사결정 배경)\n" +
                "- 기술 스택 → 비즈니스 문제 해결 도구로 재해석\n" +
                "- 단편적 경험 → 일관된 성장 서사로 연결\n\n" +
                "**Phase 2: 임팩트 증폭 (Quantify Everything)**\n" +
                "- 모든 성과를 수치화: 사용자 증가율, 성능 개선%, 비용 절감액, 개발 시간 단축\n" +
                "- 정량적 데이터가 없다면 정성적 임팩트를 구체적으로: '팀 생산성 향상', '사용자 만족도 개선'\n" +
                "- Before/After 비교로 변화의 크기를 명확히 제시\n\n" +
                "**Phase 3: 차별화 포인트 구축 (Unique Value Proposition)**\n" +
                "- 시장에서 흔한 경험 → 독특한 접근법/인사이트 부각\n" +
                "- 기술적 우수성 + 비즈니스 감각 + 협업 역량의 균형\n" +
                "- 이 사람만이 해결할 수 있는 문제 영역 정의\n\n" +
                "**Phase 4: 스토리텔링 완성 (Narrative Arc)**\n" +
                "- 시작: 어떤 문제/기회를 발견했는가\n" +
                "- 전개: 어떤 전략과 기술로 접근했는가\n" +
                "- 위기: 어떤 장애물을 만나고 어떻게 극복했는가\n" +
                "- 결말: 어떤 성과를 만들고 무엇을 배웠는가\n\n" +
                "=== 포트폴리오 구조 설계 ===\n" +
                "**완성된 HTML 포트폴리오 생성 (최소 3500 토큰 분량)**\n\n" +
                "**1. Hero Section (First Impression)**\n" +
                "- 강력한 Value Proposition: 한 줄로 핵심 가치 제시\n" +
                "- 직무 관련 핵심 역량 3가지 (숫자로 증명 가능한)\n" +
                "- CTA: 면접관이 즉시 연락하고 싶게 만드는 장치\n\n" +
                "**2. Professional Summary (Identity)**\n" +
                "- 4-5문장의 스토리텔링: 배경 → 전문성 → 차별점 → 비전\n" +
                "- 핵심 성과 요약 (3-5개 bullet points, 각각 정량적 지표 포함)\n" +
                "- 경력 하이라이트: 가장 자랑스러운 프로젝트 1줄 요약\n\n" +
                "**3. Key Projects (Evidence)**\n" +
                "각 프로젝트당 최소 200단어 구성:\n" +
                "- 프로젝트 배경: 비즈니스 문제/기회 (Why this project?)\n" +
                "- 나의 역할: 구체적 책임 범위와 의사결정 권한\n" +
                "- 기술적 도전: 어떤 기술을 왜 선택했는가, 대안은 무엇이었나\n" +
                "- 실행 과정: 핵심 개발 전략, 협업 방식, 문제 해결 사례\n" +
                "- 임팩트: 비즈니스 성과 (매출, 사용자, 효율성 등) + 기술적 성과\n" +
                "- 학습: 이 프로젝트를 통해 얻은 핵심 인사이트\n\n" +
                "**4. Technical Expertise (Skillset)**\n" +
                "- 카테고리별 분류: Frontend/Backend/DevOps/Tools/Soft Skills\n" +
                "- 각 기술의 숙련도: Expert(5년+)/Advanced(3-5년)/Intermediate(1-3년)\n" +
                "- 실전 사용 맥락: 어떤 프로젝트에서 어떻게 활용했는지\n" +
                "- 학습 중인 기술: 미래 성장 가능성 제시\n\n" +
                "**5. Professional Experience (Track Record)**\n" +
                "- 각 경력별로 3-5개의 주요 성과 (STAR 구조)\n" +
                "- 팀 규모, 프로젝트 규모, 사용 기술 명시\n" +
                "- 승진/표창/특별 임무 등 성장 지표\n\n" +
                "**6. Education & Certifications (Foundation)**\n" +
                "- 학위/부트캠프/온라인 과정\n" +
                "- 관련 자격증 (발급 기관, 취득 연도)\n" +
                "- 수상 경력, 논문, 오픈소스 기여 등\n\n" +
                "=== 디자인 시스템 (Fortune 500 Standard) ===\n" +
                "```css\n" +
                "/* Premium Color Palette */\n" +
                ":root {\n" +
                "  --primary: #2563eb; --primary-dark: #1e40af;\n" +
                "  --secondary: #64748b; --accent: #10b981;\n" +
                "  --text-primary: #0f172a; --text-secondary: #475569;\n" +
                "  --bg-primary: #ffffff; --bg-secondary: #f8fafc;\n" +
                "}\n\n" +
                "/* Typography Scale */\n" +
                ".hero-title { font-size: 3rem; font-weight: 800; line-height: 1.1; }\n" +
                ".section-title { font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; }\n" +
                ".body-text { font-size: 1.125rem; line-height: 1.75; color: var(--text-secondary); }\n\n" +
                "/* Layout System */\n" +
                ".container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }\n" +
                ".section { margin: 5rem 0; }\n" +
                ".card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }\n" +
                "```\n\n" +
                "=== 품질 체크리스트 ===\n" +
                "✅ 모든 프로젝트에 정량적 성과 지표 포함\n" +
                "✅ STAR+I 구조로 스토리텔링 완성\n" +
                "✅ 기술 스택을 비즈니스 임팩트와 연결\n" +
                "✅ 협업/리더십 경험 구체적 사례 제시\n" +
                "✅ 성장 가능성과 미래 비전 명확히\n" +
                "✅ 총 분량 3500+ 토큰 (읽는데 5-7분 소요)\n" +
                "✅ 모바일 반응형 디자인\n\n" +
                "Response format: {\"html_content\": \"<완성된 프리미엄 포트폴리오 HTML>\"}";

            // 원본 + 가공된 데이터 추출
            const profileData = request.inputs.profile ? JSON.parse(request.inputs.profile) : null;
            console.log('전달받은 프로필 데이터:', profileData);

            const organizedContent = profileData?.organizedContent;
            const originalInput = profileData?.originalInput || organizedContent?.originalInput;

            console.log('AI 가공 결과:', organizedContent);
            console.log('원본 사용자 입력:', originalInput);

            // UserMessage 구성 - 더 상세하고 구조화된 정보 제공
            const userMessage = "=== 📋 사용자 원본 입력 (가장 중요한 진정성의 근거) ===\n" +
                "**원본 텍스트:**\n" + (originalInput?.rawText || '정보 없음') + "\n\n" +
                "**입력 형식:** " + (originalInput?.inputType || '정보 없음') + "\n" +
                "**채용공고:** " + (originalInput?.jobPosting || '정보 없음') + "\n\n" +
                "=== 🤖 AI 분석 결과 (체계화된 데이터) ===\n" +
                "**핵심 메시지:**\n" +
                "- 한 줄 피치: " + (organizedContent?.oneLinerPitch || '') + "\n" +
                "- 전체 요약: " + (organizedContent?.summary || '') + "\n\n" +
                "**경력 사항 (" + (organizedContent?.experiences?.length || 0) + "개):**\n" +
                (organizedContent?.experiences?.map((exp: any, idx: number) =>
                    `${idx + 1}. ${exp.company} - ${exp.position} (${exp.duration})\n` +
                    `   - 임팩트: ${exp.impact}\n` +
                    `   - 성과: ${exp.achievements?.join(', ') || '없음'}\n` +
                    `   - 기술: ${exp.technologies?.join(', ') || '없음'}`
                ).join('\n') || '정보 없음') + "\n\n" +
                "**프로젝트 (" + (organizedContent?.projects?.length || 0) + "개):**\n" +
                (organizedContent?.projects?.map((proj: any, idx: number) =>
                    `${idx + 1}. ${proj.name}\n` +
                    `   - 역할: ${proj.myRole}\n` +
                    `   - 요약: ${proj.summary}\n` +
                    `   - 성과: ${proj.achievements?.join(', ') || '없음'}\n` +
                    `   - 기술: ${proj.technologies?.join(', ') || '없음'}\n` +
                    `   - 임팩트: ${proj.impact}`
                ).join('\n') || '정보 없음') + "\n\n" +
                "**기술 스택 (" + (organizedContent?.skills?.length || 0) + "개 카테고리):**\n" +
                (organizedContent?.skills?.map((skillCat: any, idx: number) =>
                    `${idx + 1}. ${skillCat.category} (${skillCat.proficiency}): ${skillCat.skills?.join(', ')}\n` +
                    `   - 경험: ${skillCat.experience}`
                ).join('\n') || '정보 없음') + "\n\n" +
                "**주요 성과 및 업적:**\n" +
                (organizedContent?.achievements?.map((ach: any, idx: number) => `${idx + 1}. ${ach}`).join('\n') || '정보 없음') + "\n\n" +
                "**추출된 키워드:**\n" +
                "- 기술 키워드: " + (organizedContent?.keywords?.technical?.join(', ') || '없음') + "\n" +
                "- 소프트 스킬: " + (organizedContent?.keywords?.soft?.join(', ') || '없음') + "\n" +
                "- 산업/도메인: " + (organizedContent?.keywords?.industry?.join(', ') || '없음') + "\n" +
                "- ATS 키워드: " + (organizedContent?.keywords?.ats?.join(', ') || '없음') + "\n\n" +
                "=== 🎓 추가 정보 ===\n" +
                "**지원 분야 키워드:** " + (request.target_job_keywords?.join(', ') || '없음') + "\n" +
                "**교육 사항:** " + (request.inputs.education || '정보 없음') + "\n" +
                "**선택된 템플릿:** " + (request.template || 'minimal') + "\n\n" +
                "=== 🎯 포트폴리오 생성 미션 ===\n" +
                "**최우선 목표:** 채용담당자가 15초 안에 '면접 확정' 결정을 내리는 포트폴리오 생성\n\n" +
                "**핵심 전략:**\n" +
                "1. 🚀 **STAR 스토리텔링 적용**\n" +
                "   - 각 프로젝트/경력을 Situation-Task-Action-Result 구조로 재구성\n" +
                "   - 원본의 단편적 정보를 완전한 서사로 확장\n\n" +
                "2. 📊 **수치로 증명하기**\n" +
                "   - AI 분석 결과의 성과를 구체적 수치로 변환\n" +
                "   - 예: '개선했다' → '응답속도 3.2초→0.8초로 75% 개선, 이탈률 32% 감소'\n" +
                "   - 비즈니스 임팩트 수치화: 매출 증가, 비용 절감, 사용자 증가 등\n\n" +
                "3. 💼 **비즈니스 가치 번역**\n" +
                "   - 기술적 성취 → 비즈니스 성과로 연결\n" +
                "   - 예: 'React 사용' → 'React로 SPA 구축하여 전환율 18% 증가'\n\n" +
                "4. 🎯 **차별화 요소 극대화**\n" +
                "   - 원본에서 언급된 독특한 경험/관점을 부각\n" +
                "   - 경쟁자와 다른 접근법, 혁신적 솔루션 강조\n\n" +
                "5. 🏆 **전문성 계층화**\n" +
                "   - 기술 스택을 숙련도별로 분류 (Expert/Advanced/Intermediate)\n" +
                "   - 각 기술별 실제 활용 사례와 성과 명시\n\n" +
                "6. 📝 **풍부한 콘텐츠 생성**\n" +
                "   - About: 300-400자 (배경→전환점→현재→미래)\n" +
                "   - 각 프로젝트: 200-300자 (문제점-Solution-Impact-배운점)\n" +
                "   - 각 경력: 150-200자 (역할-경험-성과-성장)\n" +
                "   - 전체 최소 2,500자 이상\n\n" +
                "**필수 구현 사항:**\n" +
                "✓ 완성된 HTML 포트폴리오 (JSON 아님)\n" +
                "✓ 모던하고 전문적인 디자인 (위 CSS 스타일 가이드 준수)\n" +
                "✓ 모든 섹션에 풍부한 내용 (빈약한 섹션 절대 금지)\n" +
                "✓ 구체적 수치와 성과 지표 다수 포함\n" +
                "✓ 비즈니스 임팩트 명확히 표현\n" +
                "✓ 원본의 진정성 유지하면서 전문성 극대화\n\n" +
                "**최종 체크리스트:**\n" +
                "□ 각 섹션의 내용이 풍부한 콘텐츠로 생성되었는가?\n" +
                "□ 각 프로젝트가 Problem-Solution-Impact 구조인가?\n" +
                "□ 구체적 수치가 최소 5개 이상 포함되었나?\n" +
                "□ 비즈니스 가치가 명확히 표현되었나?\n" +
                "□ 기술 스택이 숙련도와 함께 표시되었나?\n" +
                "□ HTML이 완성되고 스타일이 적용되었나?\n\n" +
                "지금 바로 채용담당자를 감동시킬 최고의 포트폴리오를 생성하세요! 🚀";

            console.log('=== AutoFillService AI 요청 데이터 ===');
            console.log('원본 사용자 입력:', originalInput);
            console.log('AI 가공 결과:', organizedContent);
            console.log('AI 요청 메시지:', userMessage);

            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.5,
                max_tokens: 6000,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            console.log('AI 응답 원본:', content);

            if (!content) throw new Error('No content received from AI');

            const aiResponse = JSON.parse(content);
            console.log('파싱된 AI 응답:', aiResponse);
            const now = new Date().toISOString();

            // ====================================================================
            // NEW APPROACH: Use AI-generated portfolioData directly
            // AI now returns structured JSON with proper section categorization
            // ====================================================================
            let extractedData = null;

            if (aiResponse.portfolioData) {
                console.log('=== AI가 구조화한 portfolioData 사용 (NEW) ===');
                const pd = aiResponse.portfolioData;

                // Normalize skills format
                let normalizedSkills = [];
                let skillCategories = [];

                if (Array.isArray(pd.skills)) {
                    if (pd.skills.length > 0 && typeof pd.skills[0] === 'object' && pd.skills[0].category) {
                        // Categorized skills format
                        skillCategories = pd.skills;
                        normalizedSkills = pd.skills.flatMap((cat: any) => cat.skills || []);
                    } else {
                        // Simple array format
                        normalizedSkills = pd.skills;
                    }
                }

                extractedData = {
                    name: pd.name || 'Your Name',
                    title: pd.title || '소프트웨어 개발자',
                    email: pd.email || 'youremail@example.com',
                    phone: pd.phone || '010-0000-0000',
                    github: pd.github || '',
                    location: pd.location || 'Seoul, Korea',
                    about: pd.about || '',
                    skills: normalizedSkills,
                    skillCategories: skillCategories,
                    projects: (pd.projects || []).map((proj: any) => ({
                        name: proj.name || '프로젝트',
                        description: proj.description || '',
                        role: proj.role || '',
                        period: proj.period || '',
                        company: proj.company || '',
                        tech: proj.tech || [],
                        achievements: proj.achievements || []
                    })),
                    experience: (pd.experience || []).map((exp: any) => ({
                        position: exp.position || '직책',
                        company: exp.company || '회사',
                        duration: exp.duration || '',
                        description: exp.description || '',
                        achievements: exp.achievements || [],
                        technologies: exp.technologies || []
                    })),
                    education: (pd.education || []).map((edu: any) => ({
                        school: edu.school || '학교',
                        degree: edu.degree || '학위',
                        period: edu.period || '',
                        description: edu.description || ''
                    }))
                };

                console.log('=== 최종 extractedData (AI portfolioData 기반) ===');
                console.log('이름:', extractedData.name);
                console.log('타이틀:', extractedData.title);
                console.log('About 길이:', extractedData.about.length);
                console.log('스킬 수:', extractedData.skills.length);
                console.log('프로젝트 수:', extractedData.projects.length);
                console.log('경력 수:', extractedData.experience.length);
                console.log('학력 수:', extractedData.education.length);
                if (extractedData.projects.length > 0) {
                    console.log('첫 번째 프로젝트:', extractedData.projects[0].name);
                    console.log('첫 번째 프로젝트 설명 길이:', extractedData.projects[0].description.length);
                }
                if (extractedData.experience.length > 0) {
                    console.log('첫 번째 경력:', extractedData.experience[0].position);
                    console.log('첫 번째 경력 설명 길이:', extractedData.experience[0].description.length);
                }
            } else {
                console.log('=== portfolioData 없음, 기본값 사용 ===');
                extractedData = {
                    name: 'Your Name',
                    title: organizedContent?.oneLinerPitch || '소프트웨어 개발자',
                    email: 'youremail@example.com',
                    phone: '010-0000-0000',
                    github: '',
                    location: 'Seoul, Korea',
                    about: organizedContent?.summary || '',
                    skills: organizedContent?.skills?.flatMap((skill: any) => skill.skills || []) || [],
                    skillCategories: organizedContent?.skills || [],
                    projects: organizedContent?.projects?.map((proj: any) => ({
                        name: proj.name,
                        description: proj.summary,
                        role: proj.myRole,
                        period: proj.duration || '',
                        company: proj.company || '',
                        tech: proj.technologies || [],
                        achievements: proj.achievements || []
                    })) || [],
                    experience: organizedContent?.experiences?.map((exp: any) => ({
                        position: exp.position,
                        company: exp.company,
                        duration: exp.duration,
                        description: exp.impact,
                        achievements: exp.achievements || [],
                        technologies: exp.technologies || []
                    })) || [],
                    education: []
                };
            }

            console.log('변환된 extractedData:', extractedData);

            const portfolioSection: Section = {
                section_id: 'portfolio_main',
                section_title: '포트폴리오',
                blocks: [{
                    block_id: this.generateBlockId(),
                    section_id: 'portfolio_main',
                    text: aiResponse.html_content || content,
                    origin: 'ai_generated' as BlockOrigin,
                    confidence: 0.9,
                    auto_fill_reason: 'AI 자동 생성된 포트폴리오 HTML',
                    created_at: now,
                    created_by: 'ai',
                    extractedData: extractedData, // 실제 사용자 데이터 추가
                    edit_history: []
                }]
            };

            const finalDocument = {
                doc_id: this.generateDocId(),
                user_id: request.user_id,
                sections: [portfolioSection],
                created_at: now,
                updated_at: now
            };

            console.log('=== 생성된 최종 포트폴리오 문서 ===');
            console.log(finalDocument);

            return finalDocument;

        } catch (error) {
            console.error('Error generating portfolio:', error);
            throw error;
        }
    }

    async saveEdit(docId: string, blockId: string, newText: string, userId: string): Promise<TextBlock> {
        const now = new Date().toISOString();
        
        return {
            block_id: blockId,
            section_id: '',
            text: newText,
            origin: 'user_edited',
            confidence: 1.0,
            created_at: '',
            created_by: userId,
            edit_history: [
                {
                    text: newText,
                    edited_at: now,
                    edited_by: userId
                }
            ]
        };
    }

    async refineSection(
        _docId: string,
        _sectionId: string,
        currentBlocks: TextBlock[],
        instructions?: string
    ): Promise<TextBlock[]> {
        try {
            const systemPrompt = "You are a Portfolio Refinement Assistant (Korean).\n" +
                "Task: Refine and improve the consistency of portfolio text while maintaining factual accuracy.\n" +
                "Rules:\n" +
                "- Maintain consistent tone and style across all blocks\n" +
                "- Preserve all user-provided facts exactly\n" +
                "- Improve readability and flow\n" +
                "- Keep the professional tone\n" +
                "- Return refined blocks with updated confidence scores";

            const userMessage = "Current section blocks:\n" +
                JSON.stringify(currentBlocks.map(b => ({ text: b.text, origin: b.origin }))) + "\n\n" +
                "Refinement instructions: " + (instructions || '톤과 문체를 일관되게 맞춰주세요') + "\n\n" +
                "Return the refined blocks in the same JSON format, maintaining origin tracking.";

            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3,
                max_tokens: 1500
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No refinement received');

            const refined = JSON.parse(content);
            return refined.blocks.map((block: any, index: number) => ({
                ...currentBlocks[index],
                text: block.text,
                confidence: block.confidence || currentBlocks[index].confidence,
                auto_fill_reason: block.auto_fill_reason || currentBlocks[index].auto_fill_reason
            }));

        } catch (error) {
            console.error('Error refining section:', error);
            throw error;
        }
    }

    saveDocument(doc: PortfolioDocument): void {
        const docs = this.getAllDocuments();
        docs[doc.doc_id] = doc;
        localStorage.setItem('portfolio_documents', JSON.stringify(docs));
    }

    getDocument(docId: string): PortfolioDocument | null {
        const docs = this.getAllDocuments();
        return docs[docId] || null;
    }

    getAllDocuments(): Record<string, PortfolioDocument> {
        const stored = localStorage.getItem('portfolio_documents');
        return stored ? JSON.parse(stored) : {};
    }

    updateBlock(docId: string, blockId: string, updates: Partial<TextBlock>): void {
        const doc = this.getDocument(docId);
        if (!doc) return;

        for (const section of doc.sections) {
            const blockIndex = section.blocks.findIndex(b => b.block_id === blockId);
            if (blockIndex !== -1) {
                section.blocks[blockIndex] = {
                    ...section.blocks[blockIndex],
                    ...updates,
                    updated_at: new Date().toISOString()
                };
                doc.updated_at = new Date().toISOString();
                this.saveDocument(doc);
                break;
            }
        }
    }
}

const autoFillService = new AutoFillService();
export default autoFillService;