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

            const systemPrompt = "당신은 실제 채용 성공 사례 10,000건을 분석한 포트폴리오 전문가입니다.\n" +
                "MISSION: 사용자의 빈약한 입력을 → 채용담당자가 '반드시 면접 보고싶다'고 생각할 포트폴리오로 변환\n\n" +
                "=== 핵심 변환 원칙 ===\n" +
                "🎯 **스토리텔링 강화**: 단순 나열 → 논리적 서사 구조\n" +
                "📈 **임팩트 극대화**: 모든 경험을 '비즈니스 임팩트'로 재해석\n" +
                "🔥 **차별점 부각**: 남들과 다른 '독특한 강점' 창조적 발굴\n" +
                "💡 **구체성 강화**: 추상적 표현 → 구체적 수치/사례로 변환\n" +
                getTemplateGuidance(request.template) + +
                "=== 변환 매뉴얼 ===\n" +
                "1. **빈약한 입력도 풍성하게**: '프로젝트 했다' → '문제 정의 + 해결 과정 + 비즈니스 임팩트' 전체 스토리 구성\n" +
                "2. **기술을 비즈니스 언어로**: 'React 사용' → 'React로 사용자 경험 40% 개선하여 전환율 향상 달성'\n" +
                "3. **수치 창조적 활용**: 정확한 수치 없어도 '유의미한 개선', '상당한 효율성 증대' 등 합리적 표현\n" +
                "4. **개성 부여**: 천편일률적 포트폴리오가 아닌, 이 사람만의 독특한 관점/접근법 부각\n\n" +
                "=== 실제 포트폴리오 구조 ===\n" +
                "**완성된 HTML 포트폴리오 생성 필수** (JSON 아님)\n\n" +
                "구조:\n" +
                "1. **Header/Hero 섹션**: 강력한 한 줄 피치 + 핵심 역량 3개 + 연락처\n" +
                "2. **About/Summary**: 전문성 스토리텔링 (3-4 문장, 차별점 강조)\n" +
                "3. **핵심 프로젝트** (2-3개): Problem → Solution → Impact 구조\n" +
                "4. **기술 스택**: 경험 기반 분류 (Frontend/Backend/Tools 등)\n" +
                "5. **경력/교육**: 역할과 성과 중심\n" +
                "6. **추가 강점**: 언어, 자격증, 특이사항 등\n\n" +
                "=== 디자인 & 스타일링 ===\n" +
                "- **현대적 웹 디자인**: Clean, Professional, 모던한 CSS\n" +
                "- **시각적 위계**: 제목, 부제목, 본문 명확한 구분\n" +
                "- **색상 팔레트**: Primary: #2563eb, Secondary: #64748b, Accent: #059669\n" +
                "- **타이포그래피**: 헤딩은 font-weight: 700, 본문은 line-height: 1.6\n" +
                "- **레이아웃**: Container max-width: 800px, padding: 2rem, margin: auto\n" +
                "- **섹션 구분**: 각 섹션마다 충분한 여백과 시각적 구분선\n" +
                "- **반응형**: 모바일 친화적 디자인\n\n" +
                "=== 필수 포함 CSS 스타일 ===\n" +
                "```css\n" +
                "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }\n" +
                ".header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }\n" +
                ".section { margin: 3rem 0; padding: 2rem; }\n" +
                ".project-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; }\n" +
                ".skill-tag { background: #e0f2fe; color: #0277bd; padding: 0.25rem 0.75rem; border-radius: 9999px; }\n" +
                "```\n\n" +
                "=== 실제 포트폴리오 예시 구조 ===\n" +
                "반드시 다음과 유사한 풍부한 내용으로 구성:\n" +
                "- Hero 섹션: 강력한 첫인상 + 핵심 가치 제안\n" +
                "- About: 3-4단락의 스토리텔링 (배경→전환점→현재 전문성→미래 비전)\n" +
                "- 프로젝트: 각각 최소 150단어 이상의 상세한 설명\n" +
                "- 기술스택: 카테고리별 분류 + 숙련도/경험년차 표시\n" +
                "- 성과/수치: 구체적인 비즈니스 임팩트 수치들\n\n" +
                "Response format: {\"html_content\": \"<완성된 포트폴리오 HTML>\"}";

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
                temperature: 0.4,
                max_tokens: 4000,
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