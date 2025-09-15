import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    SparklesIcon,
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { GenerationResult } from '../services/oneClickGenerator';

interface SimpleNaturalLanguageEditorProps {
    initialResult: GenerationResult;
    selectedTemplate: string;
    onComplete: (result: GenerationResult) => void;
    onBack: () => void;
}

interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SimpleNaturalLanguageEditor: React.FC<SimpleNaturalLanguageEditorProps> = ({
    initialResult,
    selectedTemplate,
    onComplete,
    onBack
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            type: 'assistant',
            content: '안녕하세요! 포트폴리오를 자연어로 개선해드리겠습니다. 어떤 부분을 수정하거나 개선하고 싶으신가요?\n\n예시:\n- "자기소개를 더 임팩트 있게 써줘"\n- "경력 부분에 성과를 더 강조해줘"\n- "프로젝트 설명을 더 구체적으로 써줘"',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentResult, setCurrentResult] = useState(initialResult);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isProcessing) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputText.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsProcessing(true);

        // 시뮬레이션된 AI 응답 (실제로는 API 호출)
        setTimeout(() => {
            const responses = [
                "좋은 아이디어네요! 해당 부분을 더 임팩트 있게 수정해드렸습니다. 미리보기를 확인해보세요.",
                "말씀하신 대로 성과 중심으로 내용을 개선했습니다. 구체적인 수치와 결과를 강조했어요.",
                "프로젝트 설명을 더 상세하고 전문적으로 작성했습니다. 기술적 도전과 해결 과정을 포함했어요.",
                "자기소개 부분을 더 매력적이고 차별화되도록 다시 작성했습니다.",
                "경력 부분에 리더십과 협업 경험을 추가로 강조해드렸습니다."
            ];

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
            
            // 결과 업데이트 시뮬레이션
            const updatedResult = {
                ...currentResult,
                qualityScore: Math.min(95, currentResult.qualityScore + Math.floor(Math.random() * 5) + 1),
                suggestions: [
                    ...currentResult.suggestions,
                    `개선 요청: "${userMessage.content}"`
                ]
            };
            
            setCurrentResult(updatedResult);
            setIsProcessing(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleComplete = () => {
        onComplete(currentResult);
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 왼쪽: 채팅 인터페이스 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">AI와 대화하며 개선하기</h2>
                        </div>
                        <button
                            onClick={onBack}
                            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-1" />
                            돌아가기
                        </button>
                    </div>

                    {/* 채팅 메시지 영역 */}
                    <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-4">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                            >
                                <div
                                    className={`inline-block max-w-[80%] p-3 rounded-lg ${
                                        message.type === 'user'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white text-gray-900 border border-gray-200'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <div className="text-xs mt-1 opacity-70">
                                        {message.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {isProcessing && (
                            <div className="text-left mb-4">
                                <div className="inline-block bg-white text-gray-900 border border-gray-200 p-3 rounded-lg">
                                    <div className="flex items-center">
                                        <SparklesIcon className="w-4 h-4 mr-2 animate-spin" />
                                        AI가 포트폴리오를 개선하고 있습니다...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 입력 영역 */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="어떤 부분을 개선하고 싶으신가요?"
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputText.trim() || isProcessing}
                            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 빠른 제안 버튼들 */}
                    <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">빠른 제안:</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "자기소개를 더 임팩트 있게 써줘",
                                "경력에 성과를 더 강조해줘",
                                "프로젝트 설명을 구체적으로 써줘",
                                "스킬 부분을 더 전문적으로 써줘"
                            ].map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInputText(suggestion)}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                                    disabled={isProcessing}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 미리보기 & 완료 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">개선된 포트폴리오</h3>
                        <div className="text-sm text-gray-500">
                            품질 점수: <span className="font-semibold text-green-600">{currentResult.qualityScore}점</span>
                        </div>
                    </div>

                    {/* 개선 사항 요약 */}
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-green-800 mb-2">✨ 개선된 점들</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• AI와의 대화를 통한 맞춤형 개선</li>
                            <li>• 더욱 임팩트 있는 표현으로 업그레이드</li>
                            <li>• 채용담당자 관점에서의 최적화</li>
                            {currentResult.suggestions.slice(-2).map((suggestion, idx) => (
                                <li key={idx}>• {suggestion}</li>
                            ))}
                        </ul>
                    </div>

                    {/* 미리보기 (간단한 표시) */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                        <div className="text-sm text-gray-600">
                            <p className="font-semibold mb-2">개선된 포트폴리오 미리보기</p>
                            <p>선택하신 <span className="font-medium">{selectedTemplate}</span> 템플릿으로 생성되었습니다.</p>
                            <p className="mt-2">AI와의 대화를 통해 {messages.filter(m => m.type === 'user').length}개의 개선사항이 적용되었습니다.</p>
                        </div>
                    </div>

                    {/* 완료 버튼 */}
                    <button
                        onClick={handleComplete}
                        className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        개선 완료 - 최종 결과 보기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleNaturalLanguageEditor;