import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PencilIcon,
    SparklesIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    DocumentDuplicateIcon,
    EyeIcon,
    EyeSlashIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import autoFillService, { 
    PortfolioDocument, 
    TextBlock, 
    GenerateRequest 
} from '../services/autoFillService';
type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

interface AutoFillPortfolioEditorProps {
    userId: string;
    initialInputs?: GenerateRequest['inputs'];
    targetJobKeywords?: string[];
    selectedTemplate?: TemplateType;
    onSave?: (document: PortfolioDocument) => void;
    onEnhancedEdit?: (document: PortfolioDocument) => void;
}

const AutoFillPortfolioEditor: React.FC<AutoFillPortfolioEditorProps> = ({
    userId,
    initialInputs,
    targetJobKeywords,
    selectedTemplate,
    onSave,
    onEnhancedEdit
}) => {
    const [document, setDocument] = useState<PortfolioDocument | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingBlock, setEditingBlock] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showAIIndicators, setShowAIIndicators] = useState(true);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    const generatePortfolio = async () => {
        setLoading(true);
        try {
            const request: GenerateRequest = {
                user_id: userId,
                inputs: initialInputs || {},
                target_job_keywords: targetJobKeywords,
                locale: 'ko-KR'
            };

            const generatedDoc = await autoFillService.generatePortfolio(request);
            setDocument(generatedDoc);
            autoFillService.saveDocument(generatedDoc);
            
            if (onSave) {
                onSave(generatedDoc);
            }
        } catch (error) {
            console.error('Failed to generate portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate initial portfolio on mount - run only once
    useEffect(() => {
        if (initialInputs && !document) {
            generatePortfolio();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getOriginColor = (origin: TextBlock['origin']) => {
        switch (origin) {
            case 'ai_generated':
                return showAIIndicators ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200';
            case 'user_edited':
                return 'bg-blue-50 border-blue-300';
            case 'user_provided':
                return 'bg-white border-gray-200';
            default:
                return 'bg-white border-gray-200';
        }
    };

    const getOriginLabel = (origin: TextBlock['origin']) => {
        switch (origin) {
            case 'ai_generated':
                return { text: 'AI 생성', icon: SparklesIcon, color: 'text-yellow-600' };
            case 'user_edited':
                return { text: '수정됨', icon: PencilIcon, color: 'text-blue-600' };
            case 'user_provided':
                return { text: '원본', icon: CheckCircleIcon, color: 'text-green-600' };
            default:
                return { text: '', icon: null, color: '' };
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.5) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const startEditing = (block: TextBlock) => {
        setEditingBlock(block.block_id);
        setEditText(block.text);
        setTimeout(() => {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }, 100);
    };

    const saveEdit = async (blockId: string) => {
        if (!document) return;

        setSavingStatus('saving');
        
        // Update the block locally
        const updatedDoc = { ...document };
        for (const section of updatedDoc.sections) {
            const blockIndex = section.blocks.findIndex(b => b.block_id === blockId);
            if (blockIndex !== -1) {
                const block = section.blocks[blockIndex];
                block.text = editText;
                block.origin = 'user_edited';
                block.confidence = 1.0;
                
                if (!block.edit_history) {
                    block.edit_history = [];
                }
                block.edit_history.push({
                    text: editText,
                    edited_at: new Date().toISOString(),
                    edited_by: userId
                });
                break;
            }
        }

        setDocument(updatedDoc);
        autoFillService.saveDocument(updatedDoc);
        setEditingBlock(null);
        
        setTimeout(() => {
            setSavingStatus('saved');
            setTimeout(() => setSavingStatus('idle'), 2000);
        }, 500);

        if (onSave) {
            onSave(updatedDoc);
        }
    };

    const cancelEdit = () => {
        setEditingBlock(null);
        setEditText('');
    };

    const refineSection = async (sectionId: string) => {
        if (!document) return;
        
        setLoading(true);
        try {
            const section = document.sections.find(s => s.section_id === sectionId);
            if (!section) return;

            const refinedBlocks = await autoFillService.refineSection(
                document.doc_id,
                sectionId,
                section.blocks,
                '톤과 문체를 일관되게 맞춰주세요'
            );

            const updatedDoc = { ...document };
            const sectionIndex = updatedDoc.sections.findIndex(s => s.section_id === sectionId);
            if (sectionIndex !== -1) {
                updatedDoc.sections[sectionIndex].blocks = refinedBlocks;
                updatedDoc.updated_at = new Date().toISOString();
            }

            setDocument(updatedDoc);
            autoFillService.saveDocument(updatedDoc);
            
            if (onSave) {
                onSave(updatedDoc);
            }
        } catch (error) {
            console.error('Failed to refine section:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlockSelection = (blockId: string) => {
        const newSelected = new Set(selectedBlocks);
        if (newSelected.has(blockId)) {
            newSelected.delete(blockId);
        } else {
            newSelected.add(blockId);
        }
        setSelectedBlocks(newSelected);
    };

    if (loading && !document) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <SparklesIcon className="w-12 h-12 text-purple-600" />
                </motion.div>
                <span className="ml-3 text-lg text-gray-700">AI가 포트폴리오를 생성하고 있습니다...</span>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <button
                    onClick={generatePortfolio}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    포트폴리오 생성하기
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header Controls */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">포트폴리오 에디터</h1>
                            <div className="flex items-center space-x-2">
                                <AnimatePresence>
                                    {savingStatus === 'saving' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center text-gray-600"
                                        >
                                            <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                                            저장 중...
                                        </motion.div>
                                    )}
                                    {savingStatus === 'saved' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center text-green-600"
                                        >
                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                            저장됨
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowAIIndicators(!showAIIndicators)}
                                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                                    showAIIndicators 
                                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}
                            >
                                {showAIIndicators ? (
                                    <>
                                        <EyeIcon className="w-4 h-4 mr-2" />
                                        AI 표시 켜짐
                                    </>
                                ) : (
                                    <>
                                        <EyeSlashIcon className="w-4 h-4 mr-2" />
                                        AI 표시 꺼짐
                                    </>
                                )}
                            </button>

                            {document && onEnhancedEdit && (
                                <button
                                    onClick={() => onEnhancedEdit(document)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    상세 편집
                                </button>
                            )}
                            
                            <button
                                onClick={() => generatePortfolio()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                            >
                                <ArrowPathIcon className="w-4 h-4 mr-2" />
                                재생성
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    {showAIIndicators && (
                        <div className="mt-3 flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded mr-2"></div>
                                <span className="text-gray-600">AI 생성</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-2"></div>
                                <span className="text-gray-600">사용자 수정</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
                                <span className="text-gray-600">원본 입력</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {document.sections.map((section, sectionIndex) => (
                    <motion.div
                        key={section.section_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.1 }}
                        className="mb-8"
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {section.section_title}
                            </h2>
                            <button
                                onClick={() => refineSection(section.section_id)}
                                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center"
                                disabled={loading}
                            >
                                <SparklesIcon className="w-4 h-4 mr-1" />
                                섹션 정제
                            </button>
                        </div>

                        {/* Blocks */}
                        <div className="space-y-3">
                            {section.blocks.map((block, blockIndex) => {
                                const originLabel = getOriginLabel(block.origin);
                                const isEditing = editingBlock === block.block_id;

                                return (
                                    <motion.div
                                        key={block.block_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: blockIndex * 0.05 }}
                                        className={`relative group rounded-lg border-2 transition-all ${
                                            getOriginColor(block.origin)
                                        } ${selectedBlocks.has(block.block_id) ? 'ring-2 ring-purple-500' : ''}`}
                                    >
                                        {/* Block Content */}
                                        <div className="p-4">
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        ref={editInputRef}
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                                        rows={3}
                                                    />
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => saveEdit(block.block_id)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                                        >
                                                            저장
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="px-3 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditing(block)}
                                                    className="cursor-text hover:bg-opacity-50 transition-colors rounded p-1"
                                                >
                                                    <p className="text-gray-800 leading-relaxed">
                                                        {block.text}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Metadata */}
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {/* Origin Label */}
                                                    {showAIIndicators && originLabel.icon && (
                                                        <div className={`flex items-center text-xs ${originLabel.color}`}>
                                                            <originLabel.icon className="w-3 h-3 mr-1" />
                                                            {originLabel.text}
                                                        </div>
                                                    )}

                                                    {/* Confidence Score */}
                                                    {showAIIndicators && block.origin === 'ai_generated' && (
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <div className="flex items-center">
                                                                <span className="mr-1">신뢰도:</span>
                                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${getConfidenceColor(block.confidence)}`}
                                                                        style={{ width: `${block.confidence * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="ml-1">{Math.round(block.confidence * 100)}%</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditing(block);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-gray-700"
                                                        title="편집"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleBlockSelection(block.block_id);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-gray-700"
                                                        title="선택"
                                                    >
                                                        <DocumentDuplicateIcon className="w-4 h-4" />
                                                    </button>

                                                    {block.edit_history && block.edit_history.length > 0 && (
                                                        <button
                                                            className="p-1 text-gray-500 hover:text-gray-700"
                                                            title={`${block.edit_history.length}번 수정됨`}
                                                        >
                                                            <ClockIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Auto-fill Reason Tooltip */}
                                            {showAIIndicators && block.auto_fill_reason && (
                                                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-xs text-yellow-800">
                                                    <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                                                    {block.auto_fill_reason}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Floating Action Button */}
            {selectedBlocks.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
                >
                    <p className="text-sm text-gray-600 mb-2">
                        {selectedBlocks.size}개 블록 선택됨
                    </p>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                // Batch refine selected blocks
                                console.log('Refining selected blocks:', Array.from(selectedBlocks));
                            }}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                            선택 항목 정제
                        </button>
                        <button
                            onClick={() => setSelectedBlocks(new Set())}
                            className="px-3 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
                        >
                            선택 취소
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AutoFillPortfolioEditor;