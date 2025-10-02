import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SparklesIcon,
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface NaturalLanguageSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyChange?: (instruction: string) => void;
}

const NaturalLanguageSidebar: React.FC<NaturalLanguageSidebarProps> = ({
    isOpen,
    onClose,
    onApplyChange
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            type: 'assistant',
            content: '안녕하세요! 포트폴리오를 자연어로 개선해드리겠습니다.\n\n예시:\n• "자기소개를 더 임팩트 있게"\n• "경력에 성과 강조"\n• "프로젝트 설명을 구체적으로"',
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

        // AI 응답 시뮬레이션
        setTimeout(() => {
            const responses = [
                "해당 부분을 더 임팩트 있게 수정했습니다. 왼쪽 미리보기를 확인해보세요!",
                "성과 중심으로 내용을 개선했습니다. 구체적인 수치와 결과를 강조했어요.",
                "프로젝트 설명을 더 상세하고 전문적으로 작성했습니다.",
                "자기소개를 더 매력적이고 차별화되도록 다시 작성했습니다.",
                "경력 부분에 리더십과 협업 경험을 추가로 강조했습니다."
            ];

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsProcessing(false);

            // 변경사항 적용
            if (onApplyChange) {
                onApplyChange(instruction);
            }
        }, 1500);
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
                    {/* 배경 오버레이 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black bg-opacity-30 z-40"
                    />

                    {/* 사이드바 */}
                    <motion.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600 mr-2" />
                                <h3 className="text-lg font-bold text-gray-900">AI 자연어 편집</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* 채팅 메시지 영역 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-lg ${
                                            message.type === 'user'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                                            {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isProcessing && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <SparklesIcon className="w-4 h-4 mr-2 animate-spin text-purple-600" />
                                            <span className="text-sm">AI가 작업 중...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 입력 영역 */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="개선하고 싶은 내용을 자연어로 입력하세요..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    rows={3}
                                    disabled={isProcessing}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isProcessing}
                                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Enter로 전송, Shift+Enter로 줄바꿈
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NaturalLanguageSidebar;
