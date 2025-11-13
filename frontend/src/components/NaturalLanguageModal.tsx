import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    CheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    applied?: boolean;
}

interface NaturalLanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyChange: (instruction: string) => Promise<void>;
    currentContent?: string;
}

const NaturalLanguageModal: React.FC<NaturalLanguageModalProps> = ({
    isOpen,
    onClose,
    onApplyChange,
    currentContent
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            type: 'assistant',
            content: '안녕하세요! 포트폴리오를 자연어로 개선해드리겠습니다.\n\n예시:\n• "자기소개를 더 임팩트 있게"\n• "경력에 성과 강조"\n• "프로젝트 설명을 구체적으로"\n\n어떤 부분을 수정하고 싶으신가요?',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isProcessing) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputText.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const instruction = inputText.trim();
        setInputText('');
        setIsProcessing(true);

        try {
            // Apply change and wait for result
            await onApplyChange(instruction);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: '✅ 수정이 완료되었습니다! 화면에서 변경사항을 확인해주세요.\n\n추가로 수정하실 내용이 있으신가요?',
                timestamp: new Date(),
                applied: true
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: '❌ 수정 중 오류가 발생했습니다. 다시 시도해주세요.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-4 right-4 w-[480px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">AI 자연어 편집</h3>
                                    <p className="text-xs text-gray-500">실시간으로 결과를 확인하세요</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {messages.map(message => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                                            message.type === 'user'
                                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                : message.applied
                                                    ? 'bg-green-50 text-gray-800 border border-green-200'
                                                    : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        {message.applied && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <CheckIcon className="w-4 h-4 text-green-600" />
                                                <span className="text-xs text-green-600 font-medium">적용 완료</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-gray-100 px-4 py-3 rounded-2xl flex items-center gap-2">
                                        <ArrowPathIcon className="w-4 h-4 text-gray-500 animate-spin" />
                                        <span className="text-sm text-gray-600">수정 중...</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-5 border-t border-gray-200">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="수정하고 싶은 내용을 자유롭게 설명해주세요..."
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        rows={2}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isProcessing}
                                    className={`px-4 py-3 rounded-xl transition-all ${
                                        inputText.trim() && !isProcessing
                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500">빠른 명령:</span>
                                {['더 간결하게', '더 자세하게', '성과 중심으로', '기술 스택 강조'].map(quick => (
                                    <button
                                        key={quick}
                                        onClick={() => setInputText(quick)}
                                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                        disabled={isProcessing}
                                    >
                                        {quick}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NaturalLanguageModal;