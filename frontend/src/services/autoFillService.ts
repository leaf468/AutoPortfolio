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

class AutoFillService {
    private generateBlockId(): string {
        return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private generateDocId(): string {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

            const systemPrompt = "당신은 Fortune 500 기업의 채용담당자 10년 경력과 스타트업 CTO 경험을 보유한 포트폴리오 전문가입니다.\n" +
                "실제 채용 성공 사례 15,000건을 분석하여 '합격률 85%'를 달성한 포트폴리오 작성 노하우를 보유하고 있습니다.\n\n" +
                "=== MISSION: 채용담당자를 사로잡는 포트폴리오 생성 ===\n" +
                "목표: 사용자의 빈약한 입력을 → 채용담당자가 '15초 안에 면접 결정'하는 포트폴리오로 변환\n" +
                "특징: 진정성 유지 + 스토리텔링 강화 + 비즈니스 임팩트 극대화\n\n" +
                "=== 핵심 변환 원칙 (우선순위 순) ===\n" +
                "1. 🎯 **임팩트 퍼스트**: 모든 경험을 측정 가능한 비즈니스 성과로 표현\n" +
                "   - '개발했다' → '매출 X% 증가/비용 Y% 절감/사용자 Z명 증가'\n" +
                "   - 구체적 수치가 없으면 '상당한/유의미한/효과적인' 등으로 표현\n\n" +
                "2. 📊 **수치 기반 신뢰성**: 모든 성과에 정량적 지표 포함\n" +
                "   - 프로젝트 규모: 사용자 수, 트래픽, 데이터 양\n" +
                "   - 성과: 증가율, 개선율, 시간 절감\n" +
                "   - 기술: 처리 속도, 응답 시간, 최적화율\n\n" +
                "3. 📖 **STAR 스토리텔링**: 각 경험을 완전한 스토리로 구성\n" +
                "   - Situation: 어떤 문제/과제가 있었나?\n" +
                "   - Task: 무엇을 해야 했나?\n" +
                "   - Action: 어떻게 해결했나? (기술, 방법, 협업)\n" +
                "   - Result: 결과는? (수치, 임팩트, 학습)\n\n" +
                "4. 🔥 **차별화 포인트**: 경쟁자 대비 독특한 강점 부각\n" +
                "   - 기술적 독창성: 새로운 접근법, 혁신적 솔루션\n" +
                "   - 비즈니스 이해도: 기술과 비즈니스 가치 연결\n" +
                "   - 성장 마인드: 학습 과정, 개선 사례\n\n" +
                "5. 💡 **구체성 극대화**: 추상적 표현 절대 금지\n" +
                "   - '협업했다' → '3명의 디자이너, 5명의 개발자와 애자일 방식으로 협업'\n" +
                "   - '최적화했다' → 'Redis 캐싱으로 API 응답속도 2.3초→0.4초로 82% 개선'\n" +
                "   - '개발했다' → 'React + TypeScript로 SPA 구조의 대시보드 개발 (주 10,000명 사용)'\n\n" +
                getTemplateGuidance(request.template) +
                "=== 콘텐츠 풍부도 가이드 (반드시 준수) ===\n" +
                "**각 섹션별 필수 분량 및 구성:**\n\n" +
                "1. **About/Summary (300-400자)**\n" +
                "   - 배경 스토리 (100자): 어떻게 이 분야에 관심을 갖게 되었나?\n" +
                "   - 전환점/성장 (100자): 중요한 경험, 프로젝트, 깨달음\n" +
                "   - 현재 전문성 (100자): 핵심 강점, 기술 스택, 특기\n" +
                "   - 미래 비전 (100자): 커리어 목표, 기여하고 싶은 가치\n\n" +
                "2. **각 프로젝트 (200-300자)**\n" +
                "   - 문제점(50자): 배경, 과제\n" +
                "   - Solution (100자): 기술 스택, 아키텍처, 구현 방법, 팀 협업\n" +
                "   - Impact (50자): 정량적 성과, 비즈니스 가치\n" +
                "   - 배운 점(50자): 개선 사항\n\n" +
                "3. **각 경험 (150-200자) - 반드시 여러 문단으로 구성**\n" +
                "   - 역할 소개 (30자): 담당한 포지션과 책임 범위\n" +
                "   - 주요 업무 (70자): 구체적 업무 내용, 사용 기술, 협업 방식\n" +
                "   - 핵심 성과 (50자): 측정 가능한 결과, 비즈니스 임팩트, 수치화된 성과\n" +
                "   - 기술 성장 (30자): 새로 습득한 기술, 역량 향상, 배운 점\n" +
                "   - ⚠️ 각 경험을 2-3개의 <p> 태그로 나누어 풍부하게 작성\n\n" +
                "4. **기술 스택 섹션 (150-200 자)**\n" +
                "   - 각 기술별 경험 기간, 숙련도, 활용 프로젝트 명시\n" +
                "   - 카테고리별 분류 (Frontend/Backend/DevOps/Tools)\n" +
                "   - 최신 기술 트렌드 반영\n\n" +
                "**전체 포트폴리오 목표: 2,500-3,500 자**\n\n" +
                "**각 섹션별 내용을 구성할 때 그 내용 안에서 최대한 깔끔하고 구조화한 줄글로만 구성해야 한다.**\n\n" +
                "=== 실제 포트폴리오 구조 (HTML) ===\n" +
                "**반드시 완성된 HTML 포트폴리오 생성** (JSON 형식 아님)\n\n" +
                "**필수 섹션 구조:**\n" +
                "1. **Header/Hero (전면 인상 섹션)**\n" +
                "   - 강력한 헤드라인: 직무 + 핵심 가치 제안\n" +
                "   - 한 줄 소개: 전문성을 한 문장으로 압축\n" +
                "   - 핵심 역량 3개: 시각적으로 강조\n" +
                "   - 연락처: 이메일, GitHub, LinkedIn, 블로그\n\n" +
                "2. **About Me (전문성 스토리)**\n" +
                "   - 300-400자의 풍부한 자기소개\n" +
                "   - 4개 문단 구조: 배경 → 전환점 → 현재 → 미래\n" +
                "   - 개인의 독특한 관점과 가치관 포함\n\n" +
                "3. **Projects (프로젝트)**\n" +
                "   - 2-4개의 대표 프로젝트\n" +
                "   - 각 프로젝트당 200-300자\n" +
                "   - Problem-Solution-Impact 구조\n" +
                "   - GitHub/Demo 링크 (있는 경우)\n\n" +
                "4. **Experience (경험)**\n" +
                "   - 시간 역순 배치\n" +
                "   - 각 경력당 150-200자의 풍부한 설명 (여러 개의 <p> 태그로 구성)\n" +
                "   - 역할-경험-성과 구조\n" +
                "   - 주요 성과는 .achievement-item으로 bullet points 강조\n" +
                "   - 사용 기술은 .skill-tag로 표시\n\n" +
                "5. **Technical Skills (기술 역량)**\n" +
                "   - 카테고리별 분류\n" +
                "   - 숙련도 시각화 (프로그레스 바 or 별점)\n" +
                "   - 각 기술별 경험 년수 + 활용 프로젝트\n\n" +
                "6. **Education & Certifications (학력 및 자격증)**\n" +
                "   - 학력: 학교, 전공, 기간, 주요 활동\n" +
                "   - 자격증: 이름, 발급기관, 취득일\n\n" +
                "7. **Additional Highlights (추가 강점)**\n" +
                "   - 수상 경력, 오픈소스 기여, 기술 블로그, 발표 경험 등\n\n" +
                "=== 디자인 & 스타일링 기준 ===\n" +
                "**현대적이고 전문적인 웹 디자인 필수**\n\n" +
                "**컬러 시스템:**\n" +
                "- Primary: #2563eb (신뢰감 있는 블루)\n" +
                "- Secondary: #64748b (전문적인 그레이)\n" +
                "- Accent: #059669 (성과 강조용 그린)\n" +
                "- Background: #f8fafc (은은한 배경)\n\n" +
                "**타이포그래피:**\n" +
                "- Font Family: 'Inter', 'Pretendard', -apple-system, sans-serif\n" +
                "- H1: 3rem, font-weight: 800, line-height: 1.2\n" +
                "- H2: 2rem, font-weight: 700, line-height: 1.3\n" +
                "- H3: 1.5rem, font-weight: 600, line-height: 1.4\n" +
                "- Body: 1rem, font-weight: 400, line-height: 1.7\n\n" +
                "**레이아웃:**\n" +
                "- Container: max-width 900px, padding 2.5rem, margin auto\n" +
                "- Section spacing: margin 4rem 0\n" +
                "- Card padding: 2rem\n" +
                "- Border radius: 12px (modern look)\n\n" +
                "**필수 CSS 스타일:**\n" +
                "```css\n" +
                "* { box-sizing: border-box; margin: 0; padding: 0; }\n" +
                "body {\n" +
                "  font-family: 'Inter', 'Pretendard', -apple-system, sans-serif;\n" +
                "  color: #1e293b;\n" +
                "  background: #f8fafc;\n" +
                "  line-height: 1.7;\n" +
                "}\n" +
                ".container { max-width: 900px; margin: 0 auto; padding: 2.5rem; }\n" +
                ".header {\n" +
                "  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n" +
                "  color: white;\n" +
                "  padding: 5rem 0;\n" +
                "  text-align: center;\n" +
                "}\n" +
                ".section {\n" +
                "  background: white;\n" +
                "  margin: 3rem 0;\n" +
                "  padding: 3rem;\n" +
                "  border-radius: 12px;\n" +
                "  box-shadow: 0 4px 6px rgba(0,0,0,0.05);\n" +
                "}\n" +
                ".project-card {\n" +
                "  background: white;\n" +
                "  border: 2px solid #e2e8f0;\n" +
                "  border-radius: 12px;\n" +
                "  padding: 2rem;\n" +
                "  margin: 2rem 0;\n" +
                "  transition: all 0.3s ease;\n" +
                "}\n" +
                ".project-card:hover {\n" +
                "  border-color: #2563eb;\n" +
                "  box-shadow: 0 8px 16px rgba(37,99,235,0.1);\n" +
                "  transform: translateY(-2px);\n" +
                "}\n" +
                ".experience-card {\n" +
                "  background: white;\n" +
                "  border: 2px solid #e2e8f0;\n" +
                "  border-radius: 12px;\n" +
                "  padding: 2rem;\n" +
                "  margin: 2rem 0;\n" +
                "  transition: all 0.3s ease;\n" +
                "}\n" +
                ".experience-card:hover {\n" +
                "  border-color: #2563eb;\n" +
                "  box-shadow: 0 8px 16px rgba(37,99,235,0.1);\n" +
                "  transform: translateY(-2px);\n" +
                "}\n" +
                ".skill-tag {\n" +
                "  background: #e0f2fe;\n" +
                "  color: #0277bd;\n" +
                "  padding: 0.5rem 1rem;\n" +
                "  border-radius: 20px;\n" +
                "  font-size: 0.875rem;\n" +
                "  font-weight: 500;\n" +
                "  display: inline-block;\n" +
                "  margin: 0.25rem;\n" +
                "}\n" +
                ".achievement-item {\n" +
                "  padding-left: 1.5rem;\n" +
                "  position: relative;\n" +
                "  margin: 0.75rem 0;\n" +
                "}\n" +
                ".achievement-item::before {\n" +
                "  content: '✓';\n" +
                "  position: absolute;\n" +
                "  left: 0;\n" +
                "  color: #059669;\n" +
                "  font-weight: bold;\n" +
                "}\n" +
                "```\n\n" +
                "=== HTML 구조 예시 (반드시 준수) ===\n" +
                "**Experience 섹션 구조:**\n" +
                "```html\n" +
                "<section class='section'>\n" +
                "  <h2>Experience</h2>\n" +
                "  <div class='experience-card'>\n" +
                "    <h3 class='position'>Senior Frontend Developer</h3>\n" +
                "    <div class='company'>TechCorp Inc.</div>\n" +
                "    <div class='duration'>2021.03 - 현재</div>\n" +
                "    <p>React와 TypeScript를 활용하여 월 10만 사용자가 이용하는 전자상거래 플랫폼의 프론트엔드를 전면 리뉴얼했습니다.</p>\n" +
                "    <p>기존 jQuery 기반 멀티페이지에서 React SPA로 마이그레이션하여 페이지 로딩 속도를 3.2초에서 0.8초로 75% 개선했습니다. 이를 통해 사용자 이탈률이 32% 감소했고, 구매 전환율이 18% 증가하여 월 매출 1,200만원 증대에 기여했습니다.</p>\n" +
                "    <div class='achievements'>\n" +
                "      <div class='achievement-item'>페이지 로딩 속도 75% 개선 (3.2초 → 0.8초)</div>\n" +
                "      <div class='achievement-item'>구매 전환율 18% 증가, 월 매출 1,200만원 증대</div>\n" +
                "      <div class='achievement-item'>React Query 도입으로 서버 요청 40% 절감, 인프라 비용 월 80만원 절감</div>\n" +
                "    </div>\n" +
                "    <div class='technologies'>\n" +
                "      <span class='skill-tag'>React 18</span>\n" +
                "      <span class='skill-tag'>TypeScript</span>\n" +
                "      <span class='skill-tag'>React Query</span>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</section>\n" +
                "```\n\n" +
                "**Project 섹션 구조:**\n" +
                "```html\n" +
                "<section class='section'>\n" +
                "  <h2>Projects</h2>\n" +
                "  <div class='project-card'>\n" +
                "    <h3 class='project-title'>AI 기반 추천 시스템 구축</h3>\n" +
                "    <div class='period'>2023.01 - 2023.06</div>\n" +
                "    <div class='role'>Full-stack Developer</div>\n" +
                "    <p>문제: 사용자 이탈률이 높고 구매 전환율이 낮은 문제</p>\n" +
                "    <p>해결: TensorFlow와 Python으로 개인화 추천 알고리즘을 개발하고, Next.js로 실시간 추천 UI를 구현했습니다. Redis 캐싱으로 추천 응답 속도를 0.3초 이내로 최적화했습니다.</p>\n" +
                "    <p>성과: 클릭률 45% 증가, 구매 전환율 28% 상승, 월 매출 2,500만원 증대</p>\n" +
                "    <div class='achievements'>\n" +
                "      <div class='achievement-item'>개인화 추천으로 클릭률 45% 증가</div>\n" +
                "      <div class='achievement-item'>구매 전환율 28% 상승</div>\n" +
                "    </div>\n" +
                "    <div class='technologies'>\n" +
                "      <span class='skill-tag'>Next.js</span>\n" +
                "      <span class='skill-tag'>TensorFlow</span>\n" +
                "      <span class='skill-tag'>Redis</span>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</section>\n" +
                "```\n\n" +
                "**핵심 규칙:**\n" +
                "- Experience는 반드시 .experience-card 클래스 사용\n" +
                "- Project는 반드시 .project-card 클래스 사용\n" +
                "- 각 카드 내부에 여러 개의 <p> 태그로 풍부한 설명 작성 (150-300자)\n" +
                "- .achievement-item으로 구체적 성과 나열\n" +
                "- .skill-tag로 기술 스택 표시\n\n" +
                "=== 콘텐츠 생성 예시 ===\n" +
                "**나쁜 예:**\n" +
                "\"React를 사용하여 웹사이트를 개발했습니다. 사용자 경험을 개선했습니다.\"\n\n" +
                "**좋은 예:**\n" +
                "\"React 18과 TypeScript를 활용하여 월 10만 사용자가 이용하는 전자상거래 플랫폼의 프론트엔드를 전면 리뉴얼했습니다. \n" +
                "기존 jQuery 기반 멀티페이지에서 React SPA로 마이그레이션하여 페이지 로딩 속도를 3.2초에서 0.8초로 75% 개선했습니다. \n" +
                "이를 통해 사용자 이탈률이 32% 감소했고, 구매 전환율이 18% 증가하여 월 매출 1,200만원 증대에 기여했습니다. \n" +
                "또한 React Query를 도입한 데이터 캐싱 전략으로 서버 요청을 40% 절감하여 인프라 비용을 월 80만원 절감했습니다.\"\n\n" +
                "Response format: {\"html_content\": \"<완성된 포트폴리오 HTML>\"}";

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
                temperature: 0.4, // 약간 높여서 더 창의적이고 풍부한 콘텐츠 생성
                max_tokens: 6000, // 더 긴 콘텐츠 생성을 위해 증가
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            console.log('AI 응답 원본:', content);

            if (!content) throw new Error('No content received from AI');

            const aiResponse = JSON.parse(content);
            console.log('파싱된 AI 응답:', aiResponse);
            const now = new Date().toISOString();

            // ====================================================================
            // CRITICAL FIX: Extract rich data from AI-generated HTML
            // Previously was using simple organizedContent, now parsing rich HTML
            // ====================================================================
            let extractedData = null;

            // Parse the rich AI HTML to extract structured data
            const htmlContent = aiResponse.html_content || content;
            console.log('=== AI가 생성한 풍부한 HTML 파싱 시작 ===');
            console.log('HTML 길이:', htmlContent?.length || 0);

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Extract name (from h1 in header)
            const extractedName = 'Your name'; // Default placeholder name

            // Extract title/one-liner (from header p or subtitle)
            const titleElement = doc.querySelector('header p, .subtitle, .headline');
            const extractedTitle = titleElement?.textContent?.trim() || '';

            // Extract contact info
            let extractedEmail = 'youremail@gmail.com';
            let extractedPhone = '010-0000-0000';
            let extractedGithub = '';
            let extractedLocation = 'Seoul, Korea';

            const contactElements = doc.querySelectorAll('a, p, span, div');
            contactElements.forEach(el => {
                const text = el.textContent || '';

                // Email extraction
                if (text.includes('@')) {
                    const emailMatch = text.match(/\S+@\S+\.\S+/);
                    if (emailMatch) extractedEmail = emailMatch[0];
                }

                // Phone extraction
                if (text.includes('010') || text.includes('+82')) {
                    const phoneMatch = text.match(/[\d\-+\s()]+/);
                    if (phoneMatch) extractedPhone = phoneMatch[0].trim();
                }

                // GitHub extraction
                if (text.toLowerCase().includes('github')) {
                    const githubMatch = text.match(/github\.com\/[\w\-.]+/);
                    if (githubMatch) extractedGithub = githubMatch[0];
                }

                // Location extraction (Seoul, Korea, etc.)
                if (text.includes('Seoul') || text.includes('서울')) {
                    extractedLocation = text.trim();
                }
            });

            // Extract About section (FULL RICH CONTENT - 300-400 characters)
            const aboutSection = doc.querySelector('.about, section.about, .summary, section.summary');
            let extractedAbout = '';
            if (aboutSection) {
                const aboutParagraphs = aboutSection.querySelectorAll('p');
                extractedAbout = Array.from(aboutParagraphs)
                    .map(p => p.textContent?.trim())
                    .filter(text => text && text.length > 0)
                    .join('\n\n');
            }

            // If no about section found, try to find any long paragraph
            if (!extractedAbout || extractedAbout.length < 100) {
                const allParagraphs = Array.from(doc.querySelectorAll('p'));
                for (const p of allParagraphs) {
                    const text = p.textContent?.trim() || '';
                    if (text.length > 150 && !text.includes('프로젝트') && !text.includes('경력')) {
                        extractedAbout = text;
                        break;
                    }
                }
            }

            console.log('=== About 섹션 추출 결과 ===');
            console.log('추출된 About 길이:', extractedAbout.length);
            console.log('추출된 About 내용:', extractedAbout.substring(0, 200) + '...');

            // Extract skills (from skill tags, badges, or lists)
            const skillElements = doc.querySelectorAll('.skill-tag, .skill, .tech-stack span, .badge, .tag');
            const extractedSkills = Array.from(skillElements)
                .map(el => el.textContent?.trim())
                .filter((skill): skill is string => !!skill && skill.length > 0 && skill.length < 30);

            // Extract projects (FULL RICH CONTENT - 200-300 characters each)
            const projectCards = doc.querySelectorAll('.project-card, .project, article.project');
            const extractedProjects = Array.from(projectCards).map(card => {
                const nameEl = card.querySelector('h3, h2, .project-title');
                const name = nameEl?.textContent?.trim() || '프로젝트';

                // Get FULL description - not just first paragraph
                const descriptionEls = card.querySelectorAll('p');
                const description = Array.from(descriptionEls)
                    .map(p => p.textContent?.trim())
                    .filter(text => text && text.length > 20)
                    .join('\n\n') || '프로젝트 설명';

                // Extract period/duration
                const periodEl = card.querySelector('.period, .duration, time');
                const period = periodEl?.textContent?.trim() || '';

                // Extract role
                const roleEl = card.querySelector('.role, .position');
                const role = roleEl?.textContent?.trim() || '';

                // Extract company
                const companyEl = card.querySelector('.company');
                const company = companyEl?.textContent?.trim() || '';

                // Extract technologies
                const techEls = card.querySelectorAll('.skill-tag, .tech, .technology, .badge');
                const tech = Array.from(techEls)
                    .map(el => el.textContent?.trim())
                    .filter((t): t is string => !!t && t.length > 0);

                // Extract achievements (bullet points, highlights)
                const achievementEls = card.querySelectorAll('.achievement-item, li, .highlight');
                const achievements = Array.from(achievementEls)
                    .map(el => el.textContent?.trim())
                    .filter((a): a is string => !!a && a.length > 0);

                console.log(`=== 프로젝트 "${name}" 추출 결과 ===`);
                console.log('설명 길이:', description.length);
                console.log('설명 내용:', description.substring(0, 150) + '...');
                console.log('성과:', achievements);

                return {
                    name,
                    description, // FULL RICH DESCRIPTION
                    role,
                    period,
                    company,
                    tech,
                    achievements
                };
            });

            // Extract experience (FULL RICH CONTENT - 150-200 characters each)
            const experienceCards = doc.querySelectorAll('.experience-card, .experience, article.experience, .job');
            const extractedExperience = Array.from(experienceCards).map(card => {
                const positionEl = card.querySelector('h3, h2, .position');
                const position = positionEl?.textContent?.trim() || '직책';

                const companyEl = card.querySelector('.company, .employer');
                const company = companyEl?.textContent?.trim() || '회사';

                const durationEl = card.querySelector('.duration, .period, time');
                const duration = durationEl?.textContent?.trim() || '';

                // Get FULL description
                const descriptionEls = card.querySelectorAll('p');
                const description = Array.from(descriptionEls)
                    .map(p => p.textContent?.trim())
                    .filter(text => text && text.length > 20)
                    .join('\n\n') || '업무 설명';

                // Extract achievements
                const achievementEls = card.querySelectorAll('.achievement-item, li, .highlight');
                const achievements = Array.from(achievementEls)
                    .map(el => el.textContent?.trim())
                    .filter((a): a is string => !!a && a.length > 0);

                // Extract technologies
                const techEls = card.querySelectorAll('.skill-tag, .tech, .technology');
                const technologies = Array.from(techEls)
                    .map(el => el.textContent?.trim())
                    .filter((t): t is string => !!t && t.length > 0);

                console.log(`=== 경력 "${position}" 추출 결과 ===`);
                console.log('설명 길이:', description.length);
                console.log('설명 내용:', description.substring(0, 150) + '...');
                console.log('성과:', achievements);

                return {
                    position,
                    company,
                    duration,
                    description, // FULL RICH DESCRIPTION
                    achievements,
                    technologies
                };
            });

            // Build extractedData from RICH HTML (not from simple organizedContent)
            extractedData = {
                name: extractedName,
                title: extractedTitle || (organizedContent?.oneLinerPitch || '소프트웨어 개발자'),
                email: extractedEmail,
                phone: extractedPhone,
                github: extractedGithub,
                location: extractedLocation,
                about: extractedAbout || (organizedContent?.summary || ''), // RICH ABOUT
                skills: extractedSkills.length > 0 ? extractedSkills : (organizedContent?.skills?.flatMap((skill: any) => skill.skills || []) || []),
                skillCategories: organizedContent?.skills || [],
                projects: extractedProjects.length > 0 ? extractedProjects : (organizedContent?.projects?.map((proj: any) => ({
                    name: proj.name,
                    description: proj.summary,
                    role: proj.myRole,
                    period: proj.duration || '',
                    company: proj.company || '',
                    tech: proj.technologies || [],
                    achievements: proj.achievements || []
                })) || []),
                experience: extractedExperience.length > 0 ? extractedExperience : (organizedContent?.experiences?.map((exp: any) => ({
                    position: exp.position,
                    company: exp.company,
                    duration: exp.duration,
                    description: exp.impact,
                    achievements: exp.achievements || [],
                    technologies: exp.technologies || []
                })) || []),
                education: []
            };

            console.log('=== 최종 extractedData (RICH HTML 기반) ===');
            console.log('About 길이:', extractedData.about.length);
            console.log('프로젝트 수:', extractedData.projects.length);
            console.log('경력 수:', extractedData.experience.length);
            if (extractedData.projects.length > 0) {
                console.log('첫 번째 프로젝트 설명 길이:', extractedData.projects[0].description.length);
            }
            if (extractedData.experience.length > 0) {
                console.log('첫 번째 경력 설명 길이:', extractedData.experience[0].description.length);
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