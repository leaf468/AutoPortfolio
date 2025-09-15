import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
    dangerouslyAllowBrowser: true
});

const MODEL = "gpt-4o-mini";

// 기능 1: 긴 추천문 미리보기 및 강제 열람
export interface Suggestion {
    id: string;
    short_preview: string;
    full_text: string;
    must_view_full_before_accept: boolean;
    origin: 'user_provided' | 'ai_generated' | 'user_edited';
    confidence: number;
    hallucination_risk: 'low' | 'medium' | 'high';
    auto_fill_reason?: string;
    required_fields: string[];
    viewed_full?: boolean; // UI에서 사용
}

export interface SuggestionResponse {
    section: string;
    suggestions: Suggestion[];
}

// 기능 2: 자동 보강 및 검증 필드
export interface AutoCompleteBlock {
    block_id: string;
    text: string;
    origin: 'user_provided' | 'ai_generated' | 'user_edited' | 'verified';
    confidence: number;
    hallucination_risk: 'low' | 'medium' | 'high';
    auto_fill_reason?: string;
    required_fields: string[];
    placeholders?: string[]; // {숫자 입력} 같은 플레이스홀더들
}

export interface AutoCompleteSection {
    section_id: string;
    section_title: string;
    blocks: AutoCompleteBlock[];
}

export interface AutoCompleteResponse {
    sections: AutoCompleteSection[];
}

// 기능 3: FAST Preview
export interface FastPreviewResponse {
    operation_id: string;
    estimated_full_time_ms: number;
    sections: Array<{
        section_id: string;
        fast_preview: string;
    }>;
}

export interface FullGenerationResponse extends AutoCompleteResponse {
    operation_id: string;
    generation_time_ms: number;
}

// 기능 4: Export Ready
export interface ExportSummary {
    export_ready: boolean;
    missing_verifications: string[];
    placeholders: string[];
    message: string;
}

export interface ExportCheckResponse {
    export_summary: ExportSummary;
    cleaned_content: any; // 실제 포트폴리오 내용 (AI 라벨 제거된)
}

class EnhancedSuggestionService {
    // 기능 1: 긴 추천문 생성
    async generateSuggestions(
        section: string,
        currentText: string,
        targetJobKeywords: string[]
    ): Promise<SuggestionResponse> {
        const systemPrompt = `You are Portfolio Suggestion Assistant (Korean). Return JSON only.
Hard rules:
1) For each suggestion produce both "short_preview" (<=120 chars) and "full_text".
2) If full_text length > 120 chars set must_view_full_before_accept = true.
3) For every suggestion include origin, confidence (0.0-1.0), hallucination_risk (low/medium/high), auto_fill_reason (if ai_generated).
4) Do NOT fabricate verifiable facts; use placeholders "{숫자 입력}" for missing numbers and add them to required_fields.
5) Return only machine-readable JSON following the schema below.`;

        const userMessage = JSON.stringify({
            section,
            current_text: currentText,
            target_job_keywords: targetJobKeywords,
            locale: 'ko-KR'
        }) + '\nInstruction: Generate up to 3 alternative suggestions for this section. For each suggestion return: id, short_preview, full_text, origin, confidence, hallucination_risk, auto_fill_reason (if ai_generated), required_fields (array). If full_text length > 120 chars, set must_view_full_before_accept=true. Output JSON only.';

        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.15,
                max_tokens: 300,
                top_p: 0.9,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No content received');

            return JSON.parse(content) as SuggestionResponse;
        } catch (error) {
            console.error('Error generating suggestions:', error);
            throw error;
        }
    }

    // 기능 2: 자동 보강 (질문 단계 없이)
    async autoCompletePortfolio(
        profile: string,
        projects: Array<{ title: string; notes: string }>,
        targetJobKeywords: string[]
    ): Promise<AutoCompleteResponse> {
        const systemPrompt = `You are Portfolio Autocomplete Assistant (Korean). Return JSON only.
Hard rules:
1) Produce portfolio-ready text blocks derived from user inputs.
2) Identify missing critical facts and list them in required_fields. DO NOT ask user via separate Q&A step; instead return required_fields for UI to prompt user inline.
3) If filling beyond user facts, mark origin:"ai_generated", add auto_fill_reason and hallucination_risk, and do NOT fabricate numeric facts (use "{숫자 입력}").
4) Return JSON following schema below.`;

        const userMessage = JSON.stringify({
            profile,
            projects,
            target_job_keywords: targetJobKeywords
        }) + '\nInstruction: Create sections: hero (1), project_summary (1 per project), responsibilities (2-4 bullets). For each block include origin, confidence, auto_fill_reason if ai_generated, and required_fields list. Do not generate separate QA steps. Output JSON only.';

        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.15,
                max_tokens: 400,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No content received');

            const result = JSON.parse(content) as AutoCompleteResponse;
            
            // 플레이스홀더 추출
            result.sections.forEach(section => {
                section.blocks.forEach(block => {
                    const placeholders = block.text.match(/\{[^}]+\}/g) || [];
                    block.placeholders = placeholders;
                });
            });

            return result;
        } catch (error) {
            console.error('Error auto-completing portfolio:', error);
            throw error;
        }
    }

    // 기능 3: FAST Preview 생성
    async generateFastPreview(
        profile: string,
        projects: Array<{ title: string; notes: string }>
    ): Promise<FastPreviewResponse> {
        const systemPrompt = `You are Portfolio Fast Preview Assistant (Korean). Return JSON only.
Hard rules:
1) In FAST mode return quick one-line fast_preview per section within 1s.
2) Also provide operation_id and estimated_full_time_ms.
3) Full generation is separate call with same operation_id; FAST result must be visible until full result replaces it.
4) Return JSON schema below.`;

        const userMessage = JSON.stringify({
            mode: 'FAST',
            profile,
            projects
        }) + '\nInstruction: Return an operation_id, estimated_full_time_ms (approx), and for each section a fast_preview (<=80 chars).';

        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.0,
                max_tokens: 80
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No content received');

            const result = JSON.parse(content) as FastPreviewResponse;
            
            // operation_id가 없으면 생성
            if (!result.operation_id) {
                result.operation_id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // estimated_full_time_ms가 없으면 기본값
            if (!result.estimated_full_time_ms) {
                result.estimated_full_time_ms = 3000;
            }

            return result;
        } catch (error) {
            console.error('Error generating fast preview:', error);
            throw error;
        }
    }

    // 기능 3: Full Generation (FAST 이후)
    async generateFullContent(
        operationId: string,
        profile: string,
        projects: Array<{ title: string; notes: string }>,
        targetJobKeywords: string[]
    ): Promise<FullGenerationResponse> {
        const startTime = Date.now();
        
        const autoCompleteResult = await this.autoCompletePortfolio(
            profile,
            projects,
            targetJobKeywords
        );

        return {
            ...autoCompleteResult,
            operation_id: operationId,
            generation_time_ms: Date.now() - startTime
        };
    }

    // 기능 4: Export 준비 상태 체크
    async checkExportReady(
        docId: string,
        sections: AutoCompleteSection[]
    ): Promise<ExportCheckResponse> {
        const systemPrompt = `You are Portfolio Export Assistant (Korean). Return JSON only.
Hard rules:
1) Do not include any UI-label text like "AI로 개선됨" in the generated export content.
2) Provide per-block metadata: origin, verified(boolean). For export, only allow export_ready=true if no placeholders remain and all required_fields are either empty or verified=true.
3) Return export_summary with export_ready flag and reasons if not ready.`;

        const userMessage = JSON.stringify({
            doc_id: docId,
            sections
        }) + '\nInstruction: Analyze document and return export_summary: { export_ready:bool, missing_verifications:[], placeholders:[], message }. Also return cleaned_content ready for export (without AI-labels). Do NOT inject "AI" labels into content. If not ready, explain why (list missing fields/placeholders).';

        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.0,
                max_tokens: 300,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('No content received');

            const result = JSON.parse(content) as ExportCheckResponse;
            
            // 수동 체크 로직 (AI 응답 보완)
            const missingVerifications: string[] = [];
            const placeholders: string[] = [];
            
            sections.forEach(section => {
                section.blocks.forEach(block => {
                    // 플레이스홀더 체크
                    const foundPlaceholders = block.text.match(/\{[^}]+\}/g) || [];
                    if (foundPlaceholders.length > 0) {
                        placeholders.push(`${section.section_id}:${block.block_id} contains ${foundPlaceholders.join(', ')}`);
                    }
                    
                    // 검증되지 않은 필드 체크
                    if (block.required_fields.length > 0 && block.origin !== 'verified') {
                        missingVerifications.push(`${section.section_id}:${block.block_id} has unverified fields: ${block.required_fields.join(', ')}`);
                    }
                });
            });

            // AI 응답과 수동 체크 결과 병합
            if (!result.export_summary) {
                result.export_summary = {
                    export_ready: placeholders.length === 0 && missingVerifications.length === 0,
                    missing_verifications: missingVerifications,
                    placeholders: placeholders,
                    message: placeholders.length > 0 || missingVerifications.length > 0 
                        ? '일부 필드가 완성되지 않았습니다. 모든 플레이스홀더를 채우고 필수 필드를 검증해주세요.'
                        : '내보내기 준비가 완료되었습니다.'
                };
            }

            // cleaned_content 생성 (AI 라벨 제거)
            if (!result.cleaned_content) {
                result.cleaned_content = this.cleanContentForExport(sections);
            }

            return result;
        } catch (error) {
            console.error('Error checking export readiness:', error);
            throw error;
        }
    }

    // AI 라벨 제거한 깨끗한 콘텐츠 생성
    private cleanContentForExport(sections: AutoCompleteSection[]): any {
        return {
            sections: sections.map(section => ({
                title: section.section_title,
                content: section.blocks.map(block => ({
                    text: block.text.replace(/\{[^}]+\}/g, '___'), // 플레이스홀더를 빈칸으로
                    // origin과 같은 메타데이터는 제외
                }))
            }))
        };
    }

    // 로컬 스토리지에 작업 저장
    saveOperation(operationId: string, data: any): void {
        const operations = this.getAllOperations();
        operations[operationId] = {
            ...data,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('portfolio_operations', JSON.stringify(operations));
    }

    getOperation(operationId: string): any {
        const operations = this.getAllOperations();
        return operations[operationId];
    }

    getAllOperations(): Record<string, any> {
        const stored = localStorage.getItem('portfolio_operations');
        return stored ? JSON.parse(stored) : {};
    }
}

const enhancedSuggestionService = new EnhancedSuggestionService();
export default enhancedSuggestionService;