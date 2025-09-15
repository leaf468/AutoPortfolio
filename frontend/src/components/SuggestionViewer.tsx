import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    EyeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    SparklesIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    LockClosedIcon,
    LockOpenIcon
} from '@heroicons/react/24/outline';
import { Suggestion } from '../services/enhancedSuggestionService';

interface SuggestionViewerProps {
    suggestions: Suggestion[];
    onApply: (suggestion: Suggestion) => void;
    onDismiss?: () => void;
}

const SuggestionViewer: React.FC<SuggestionViewerProps> = ({
    suggestions,
    onApply,
    onDismiss
}) => {
    const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
    const [viewedFullSuggestions, setViewedFullSuggestions] = useState<Set<string>>(new Set());

    const toggleExpand = (suggestionId: string) => {
        const newExpanded = new Set(expandedSuggestions);
        const newViewed = new Set(viewedFullSuggestions);
        
        if (newExpanded.has(suggestionId)) {
            newExpanded.delete(suggestionId);
        } else {
            newExpanded.add(suggestionId);
            newViewed.add(suggestionId); // 확장하면 자동으로 viewed 처리
        }
        
        setExpandedSuggestions(newExpanded);
        setViewedFullSuggestions(newViewed);
    };

    const canApply = (suggestion: Suggestion): boolean => {
        // must_view_full_before_accept가 true면 전체 텍스트를 봐야만 적용 가능
        if (suggestion.must_view_full_before_accept) {
            return viewedFullSuggestions.has(suggestion.id);
        }
        return true;
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-green-100 text-green-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'high': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-purple-600" />
                    AI 제안 ({suggestions.length}개)
                </h3>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        닫기
                    </button>
                )}
            </div>

            <AnimatePresence>
                {suggestions.map((suggestion, index) => {
                    const isExpanded = expandedSuggestions.has(suggestion.id);
                    const isViewed = viewedFullSuggestions.has(suggestion.id);
                    const canBeApplied = canApply(suggestion);

                    return (
                        <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white rounded-lg border-2 transition-all ${
                                suggestion.origin === 'ai_generated' 
                                    ? 'border-purple-200 bg-purple-50/30'
                                    : 'border-gray-200'
                            }`}
                        >
                            <div className="p-4">
                                {/* 헤더 */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        {/* 미리보기 텍스트 */}
                                        <p className="text-gray-900 font-medium">
                                            {suggestion.short_preview}
                                        </p>

                                        {/* 메타데이터 */}
                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                            <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                                신뢰도: {Math.round(suggestion.confidence * 100)}%
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full ${getRiskColor(suggestion.hallucination_risk)}`}>
                                                위험도: {suggestion.hallucination_risk}
                                            </span>
                                            {suggestion.origin === 'ai_generated' && (
                                                <span className="text-purple-600">
                                                    AI 생성
                                                </span>
                                            )}
                                        </div>

                                        {/* 필수 열람 알림 */}
                                        {suggestion.must_view_full_before_accept && !isViewed && (
                                            <div className="flex items-center mt-2 text-amber-600 text-sm">
                                                <LockClosedIcon className="w-4 h-4 mr-1" />
                                                전체 내용을 확인해야 적용할 수 있습니다
                                            </div>
                                        )}
                                    </div>

                                    {/* 확장/축소 버튼 */}
                                    {suggestion.full_text !== suggestion.short_preview && (
                                        <button
                                            onClick={() => toggleExpand(suggestion.id)}
                                            className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                                            ) : (
                                                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* 확장된 전체 텍스트 */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-3 border-t border-gray-200">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-start mb-2">
                                                        <EyeIcon className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-700 mb-1">
                                                                전체 내용
                                                            </p>
                                                            <p className="text-gray-900 whitespace-pre-wrap">
                                                                {suggestion.full_text}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* AI 생성 이유 */}
                                                    {suggestion.auto_fill_reason && (
                                                        <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-700">
                                                            <strong>AI 생성 이유:</strong> {suggestion.auto_fill_reason}
                                                        </div>
                                                    )}

                                                    {/* 필수 입력 필드 */}
                                                    {suggestion.required_fields.length > 0 && (
                                                        <div className="mt-3 p-2 bg-amber-100 rounded">
                                                            <p className="text-xs font-medium text-amber-700 mb-1">
                                                                필수 입력 필드:
                                                            </p>
                                                            <ul className="text-xs text-amber-600 list-disc list-inside">
                                                                {suggestion.required_fields.map((field, idx) => (
                                                                    <li key={idx}>{field}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 이제 열람했으므로 잠금 해제 표시 */}
                                                {suggestion.must_view_full_before_accept && isViewed && (
                                                    <div className="flex items-center mt-2 text-green-600 text-sm">
                                                        <LockOpenIcon className="w-4 h-4 mr-1" />
                                                        전체 내용 확인 완료 - 적용 가능
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 액션 버튼 */}
                                <div className="flex items-center justify-end mt-4 space-x-2">
                                    <button
                                        onClick={() => onApply(suggestion)}
                                        disabled={!canBeApplied}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            canBeApplied
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {canBeApplied ? (
                                            <>
                                                <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                                                적용
                                            </>
                                        ) : (
                                            <>
                                                <LockClosedIcon className="w-4 h-4 inline mr-1" />
                                                전체 내용 확인 필요
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {suggestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>제안이 없습니다</p>
                </div>
            )}
        </div>
    );
};

export default SuggestionViewer;