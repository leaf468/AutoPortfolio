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
        projects?: Array<{
            title: string;
            description: string;
            role?: string;
            duration?: string;
        }>;
        skills?: string[];
        education?: string;
        experience?: string;
    };
    target_job_keywords?: string[];
    locale?: string;
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
            const systemPrompt = "당신은 실제 채용 성공 사례 10,000건을 분석한 포트폴리오 전문가입니다.\n" +
                "MISSION: 사용자의 빈약한 입력을 → 채용담당자가 '반드시 면접 보고싶다'고 생각할 포트폴리오로 변환\n\n" +
                "=== 핵심 변환 원칙 ===\n" +
                "🎯 **스토리텔링 강화**: 단순 나열 → 논리적 서사 구조\n" +
                "📈 **임팩트 극대화**: 모든 경험을 '비즈니스 임팩트'로 재해석\n" +
                "🔥 **차별점 부각**: 남들과 다른 '독특한 강점' 창조적 발굴\n" +
                "💡 **구체성 강화**: 추상적 표현 → 구체적 수치/사례로 변환\n\n" +
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

            const userMessage = "=== 원본 입력 데이터 ===\n" +
                "프로필: " + (request.inputs.profile || '정보 없음') + "\n" +
                "프로젝트: " + JSON.stringify(request.inputs.projects || []) + "\n" +
                "기술스택: " + JSON.stringify(request.inputs.skills || []) + "\n" +
                "지원분야: " + JSON.stringify(request.target_job_keywords || []) + "\n" +
                "경력사항: " + (request.inputs.experience || '정보 없음') + "\n" +
                "교육사항: " + (request.inputs.education || '정보 없음') + "\n\n" +
                "=== 변환 미션 ===\n" +
                "위 빈약한 데이터를 다음 원칙으로 변환:\n\n" +
                "🚀 **스토리 재구성**: 각 경험을 Problem-Solution-Impact로 재해석\n" +
                "📊 **수치/성과 추가**: 합리적 범위에서 구체적 임팩트 수치 생성\n" +
                "💼 **비즈니스 관점**: 기술적 성취를 비즈니스 가치로 번역\n" +
                "🎯 **차별점 부각**: 이 지원자만의 독특한 강점 발굴\n" +
                "🏆 **전문성 강화**: 해당 분야 전문가임을 보여주는 디테일 추가\n\n" +
                "반드시 완전한 HTML 포트폴리오 생성 (최소 2000단어 수준의 풍부한 내용).\n" +
                "채용담당자가 '이 사람은 꼭 면접 봐야겠다'고 생각할 수준의 임팩트 있는 포트폴리오 완성!";

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
            if (!content) throw new Error('No content received from AI');

            const aiResponse = JSON.parse(content);
            const now = new Date().toISOString();
            
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
                    edit_history: []
                }]
            };

            return {
                doc_id: this.generateDocId(),
                user_id: request.user_id,
                sections: [portfolioSection],
                created_at: now,
                updated_at: now
            };

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