import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SparklesIcon,
    BoltIcon,
    ArrowPathIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import enhancedSuggestionService, {
    FastPreviewResponse,
    FullGenerationResponse,
    AutoCompleteSection
} from '../services/enhancedSuggestionService';
import { SmartTextWithFields } from './InlineFieldEditor';

interface FastPreviewLoaderProps {
    profile: string;
    projects: Array<{ title: string; notes: string }>;
    targetJobKeywords: string[];
    onComplete: (sections: AutoCompleteSection[]) => void;
}

const FastPreviewLoader: React.FC<FastPreviewLoaderProps> = ({
    profile,
    projects,
    targetJobKeywords,
    onComplete
}) => {
    const [stage, setStage] = useState<'idle' | 'fast' | 'full' | 'complete'>('idle');
    const [fastPreview, setFastPreview] = useState<FastPreviewResponse | null>(null);
    const [fullContent, setFullContent] = useState<FullGenerationResponse | null>(null);
    const [progress, setProgress] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(3000);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (stage === 'idle') {
            startGeneration();
        }
    }, []);

    const startGeneration = async () => {
        setStage('fast');
        setProgress(0);

        try {
            // 1. Fast Preview 생성 (1초 이내)
            const fastResult = await enhancedSuggestionService.generateFastPreview(
                profile,
                projects
            );
            
            setFastPreview(fastResult);
            setEstimatedTime(fastResult.estimated_full_time_ms);
            setProgress(20);
            
            // 2. Full Generation 시작
            setStage('full');
            startProgressAnimation(fastResult.estimated_full_time_ms);
            
            const fullResult = await enhancedSuggestionService.generateFullContent(
                fastResult.operation_id,
                profile,
                projects,
                targetJobKeywords
            );
            
            setFullContent(fullResult);
            setProgress(100);
            setStage('complete');
            
            // 작업 저장
            enhancedSuggestionService.saveOperation(fastResult.operation_id, {
                fast: fastResult,
                full: fullResult
            });
            
            // 2초 후 완료 콜백
            setTimeout(() => {
                onComplete(fullResult.sections);
            }, 2000);
            
        } catch (error) {
            console.error('Generation failed:', error);
            setStage('idle');
        }
    };

    const startProgressAnimation = (duration: number) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 80 + 20, 95); // 20%에서 시작, 95%까지
            setProgress(progress);
            
            if (elapsed >= duration) {
                clearInterval(interval);
            }
        }, 100);
    };

    const handleFieldUpdate = (field: string, value: string) => {
        setFieldValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <SparklesIcon className="w-8 h-8 mr-3" />
                            <div>
                                <h2 className="text-2xl font-bold">AI 포트폴리오 생성 중</h2>
                                <p className="text-purple-100">
                                    {stage === 'fast' && '빠른 미리보기 생성 중...'}
                                    {stage === 'full' && '상세 내용 생성 중...'}
                                    {stage === 'complete' && '생성 완료!'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-3xl font-bold">{Math.round(progress)}%</div>
                            {stage !== 'complete' && estimatedTime > 0 && (
                                <p className="text-xs text-purple-100">
                                    예상 시간: {Math.ceil(estimatedTime / 1000)}초
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* 프로그레스 바 */}
                    <div className="mt-4 bg-purple-800/30 rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-white/80 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* 콘텐츠 영역 */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* Fast Preview 표시 */}
                        {stage === 'fast' && fastPreview && (
                            <motion.div
                                key="fast"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center mb-4">
                                    <BoltIcon className="w-5 h-5 text-yellow-500 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900">빠른 미리보기</h3>
                                </div>
                                
                                {fastPreview.sections.map((section, index) => (
                                    <motion.div
                                        key={section.section_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <p className="text-sm text-gray-600 mb-1">{section.section_id}</p>
                                        <p className="text-gray-900 font-medium">{section.fast_preview}</p>
                                    </motion.div>
                                ))}
                                
                                <div className="flex items-center justify-center mt-6 text-gray-500">
                                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                                    <span className="text-sm">상세 내용 생성 중...</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Full Content 표시 (단계적 렌더링) */}
                        {stage === 'full' && fullContent && (
                            <motion.div
                                key="full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center mb-4">
                                    <SparklesIcon className="w-5 h-5 text-purple-500 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900">상세 콘텐츠</h3>
                                </div>
                                
                                {fullContent.sections.map((section, sectionIndex) => (
                                    <motion.div
                                        key={section.section_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: sectionIndex * 0.2 }}
                                        className="bg-white rounded-lg border-2 border-purple-100 overflow-hidden"
                                    >
                                        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
                                            <h4 className="font-semibold text-purple-900">
                                                {section.section_title}
                                            </h4>
                                        </div>
                                        
                                        <div className="p-4 space-y-3">
                                            {section.blocks.map((block, blockIndex) => (
                                                <motion.div
                                                    key={block.block_id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: sectionIndex * 0.2 + blockIndex * 0.1 }}
                                                    className={`p-3 rounded-lg ${
                                                        block.origin === 'ai_generated' 
                                                            ? 'bg-yellow-50 border border-yellow-200'
                                                            : 'bg-gray-50 border border-gray-200'
                                                    }`}
                                                >
                                                    {/* 플레이스홀더가 있는 텍스트 표시 */}
                                                    {block.placeholders && block.placeholders.length > 0 ? (
                                                        <SmartTextWithFields
                                                            text={block.text}
                                                            requiredFields={block.required_fields}
                                                            onFieldUpdate={handleFieldUpdate}
                                                            fieldValues={fieldValues}
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{block.text}</p>
                                                    )}
                                                    
                                                    {/* 메타데이터 */}
                                                    <div className="mt-2 flex items-center gap-3 text-xs">
                                                        {block.origin === 'ai_generated' && (
                                                            <span className="text-yellow-600">
                                                                AI 생성 • 신뢰도 {Math.round(block.confidence * 100)}%
                                                            </span>
                                                        )}
                                                        {block.required_fields.length > 0 && (
                                                            <span className="text-amber-600">
                                                                필수 입력: {block.required_fields.length}개
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* 완료 상태 */}
                        {stage === 'complete' && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    포트폴리오 생성 완료!
                                </h3>
                                <p className="text-gray-600">
                                    총 {fullContent?.sections.length}개 섹션이 생성되었습니다
                                </p>
                                
                                {fullContent && (
                                    <div className="mt-6 p-4 bg-green-50 rounded-lg inline-block">
                                        <p className="text-sm text-green-700">
                                            생성 시간: {fullContent.generation_time_ms}ms
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FastPreviewLoader;