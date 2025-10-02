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

            const systemPrompt = "당신은 글로벌 테크 기업(Google, Apple, Amazon, Netflix)의 HR 전문가 10년 경력을 가진 포트폴리오 아키텍트입니다.\n" +
                "채용 성공률 95%를 자랑하는 실전 포트폴리오 제작 전문가로, 실제 면접관의 시선과 사고방식을 완벽히 이해합니다.\n\n" +
                "**IMPORTANT**: You must respond in JSON format only. Your response must be a valid JSON object.\n\n" +
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

            // UserMessage 구성
            const userMessage = "=== 사용자 원본 입력 (기반 데이터) ===\n" +
                "원본 텍스트: " + (originalInput?.rawText || '정보 없음') + "\n" +
                "입력 형식: " + (originalInput?.inputType || '정보 없음') + "\n" +
                "채용공고: " + (originalInput?.jobPosting || '정보 없음') + "\n\n" +
                "=== AI 분석된 정리 결과 (참고용) ===\n" +
                "핵심 피치: " + (organizedContent?.oneLinerPitch || '') + "\n" +
                "요약: " + (organizedContent?.summary || '') + "\n" +
                "경력사항: " + JSON.stringify(organizedContent?.experiences || []) + "\n" +
                "프로젝트: " + JSON.stringify(organizedContent?.projects || []) + "\n" +
                "기술스택: " + JSON.stringify(organizedContent?.skills || []) + "\n" +
                "성과: " + JSON.stringify(organizedContent?.achievements || []) + "\n" +
                "키워드: " + JSON.stringify(organizedContent?.keywords || {}) + "\n\n" +
                "=== 추가 입력 데이터 ===\n" +
                "지원분야: " + JSON.stringify(request.target_job_keywords || []) + "\n" +
                "교육사항: " + (request.inputs.education || '정보 없음') + "\n\n" +
                "=== 변환 미션 ===\n" +
                "🎯 **중요**: 사용자 원본 입력을 기반으로 포트폴리오를 생성하되, AI 정리 결과를 참고하여 더욱 풍부하게 만들어주세요.\n\n" +
                "🚀 **스토리 재구성**: 원본의 각 경험을 Problem-Solution-Impact로 재해석\n" +
                "📊 **수치/성과 강화**: AI 분석 결과의 성과를 참고하여 구체적 임팩트 수치 생성\n" +
                "💼 **비즈니스 관점**: 기술적 성취를 비즈니스 가치로 번역\n" +
                "🎯 **차별점 부각**: 원본에서 언급된 고유한 강점을 AI 분석 결과로 보완\n" +
                "🏆 **전문성 강화**: AI가 추출한 키워드와 기술을 활용하여 전문성 강조\n" +
                "🔍 **누락 정보 보완**: AI 분석에서 부족한 부분은 원본에서 추가 발굴\n\n" +
                "반드시 완전한 HTML 포트폴리오 생성 (최소 2500단어 수준의 풍부한 내용).\n" +
                "원본의 진정성 + AI 분석의 체계성을 결합하여 채용담당자가 '이 사람은 꼭 면접 봐야겠다'고 생각할 포트폴리오 완성!";

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

            let extractedData = null;
            if (organizedContent) {
                // AI가 분석한 한 줄 소개 생성
                const generateOneLiner = () => {
                    // 기술스택 기반 직책 추론
                    const skills = organizedContent.skills?.flatMap((skill: any) => skill.skills || []) || [];
                    const experiences = organizedContent.experiences || [];

                    // 프론트엔드 관련 기술이 많으면
                    const frontendKeywords = ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Frontend'];
                    const backendKeywords = ['Node.js', 'Python', 'Java', 'Spring', 'Django', 'Backend', 'API'];
                    const fullstackKeywords = ['풀스택', 'Fullstack', 'Full Stack'];

                    const hasFrontend = skills.some(skill => frontendKeywords.some(keyword =>
                        skill.toLowerCase().includes(keyword.toLowerCase())
                    ));
                    const hasBackend = skills.some(skill => backendKeywords.some(keyword =>
                        skill.toLowerCase().includes(keyword.toLowerCase())
                    ));

                    let jobTitle = '소프트웨어 개발자';

                    // 경험에서 직책 추출 시도
                    if (experiences.length > 0) {
                        const latestRole = experiences[0]?.position;
                        if (latestRole && !latestRole.includes('정보 없음')) {
                            jobTitle = latestRole;
                        }
                    } else {
                        // 기술 스택 기반 추론
                        if (hasFrontend && hasBackend) {
                            jobTitle = '풀스택 개발자';
                        } else if (hasFrontend) {
                            jobTitle = '프론트엔드 개발자';
                        } else if (hasBackend) {
                            jobTitle = '백엔드 개발자';
                        }

                        // oneLinerPitch에서 직책 키워드 추출
                        if (organizedContent.oneLinerPitch) {
                            const pitch = organizedContent.oneLinerPitch;
                            if (pitch.includes('프론트엔드') || pitch.includes('Frontend')) jobTitle = '프론트엔드 개발자';
                            if (pitch.includes('백엔드') || pitch.includes('Backend')) jobTitle = '백엔드 개발자';
                            if (pitch.includes('풀스택') || pitch.includes('Full Stack')) jobTitle = '풀스택 개발자';
                            if (pitch.includes('데이터')) jobTitle = '데이터 분석가';
                            if (pitch.includes('기획')) jobTitle = '서비스 기획자';
                            if (pitch.includes('디자인')) jobTitle = 'UI/UX 디자이너';
                        }
                    }

                    // 핵심 기술 3개 추출
                    const topSkills = skills.slice(0, 3);

                    // 경험 연수 추론
                    const totalExp = experiences.reduce((total, exp) => {
                        const duration = exp.duration || '';
                        const yearMatch = duration.match(/(\d+)년/);
                        return total + (yearMatch ? parseInt(yearMatch[1]) : 1);
                    }, 0);

                    const expYears = totalExp > 0 ? `${totalExp}년차` : '주니어';

                    // 한 줄 소개 생성
                    if (topSkills.length > 0) {
                        return `${topSkills.join(', ')} 전문 ${jobTitle} (${expYears})`;
                    } else if (organizedContent.oneLinerPitch) {
                        return organizedContent.oneLinerPitch;
                    } else {
                        return `${expYears} ${jobTitle}`;
                    }
                };

                const generatedOneLiner = generateOneLiner();
                console.log('=== AI가 생성한 한 줄 소개 ===');
                console.log('생성된 한 줄 소개:', generatedOneLiner);
                console.log('분석 기반 데이터:');
                console.log('- 기술스택:', organizedContent.skills?.flatMap((skill: any) => skill.skills || []));
                console.log('- 최신 경험:', organizedContent.experiences?.[0]?.position);
                console.log('- 핵심 피치:', organizedContent.oneLinerPitch);

                extractedData = {
                    name: '홍길동', // 고정값
                    title: generatedOneLiner, // AI가 분석한 한 줄 소개
                    email: 'youremail@gmail.com', // 고정값
                    phone: '010-0000-0000', // 고정값
                    github: '', // 빈값 유지
                    location: 'Seoul, Korea', // 기본 위치
                    about: organizedContent.summary || '',
                    skills: organizedContent.skills?.flatMap((skill: any) => skill.skills || []) || [],
                    skillCategories: organizedContent.skills || [], // 기업형 템플릿을 위한 카테고리별 스킬
                    projects: organizedContent.projects?.map((proj: any) => ({
                        name: proj.name,
                        description: proj.summary,
                        role: proj.myRole,
                        period: proj.duration || '',
                        company: proj.company || '',
                        tech: proj.technologies || [],
                        achievements: proj.achievements || []
                    })) || [],
                    experience: organizedContent.experiences?.map((exp: any) => ({
                        position: exp.position,
                        company: exp.company,
                        duration: exp.duration,
                        description: exp.impact,
                        achievements: exp.achievements || [],
                        technologies: exp.technologies || []
                    })) || [],
                    education: []
                };
                console.log('변환된 extractedData:', extractedData);
            }

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
        docId: string, 
        sectionId: string, 
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