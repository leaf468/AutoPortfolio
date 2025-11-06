import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import OpenAI from 'openai';
import { getComprehensiveStats } from '../services/comprehensiveAnalysisService';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CoverLetterChatbotProps {
  position: string;
  currentAnswers: { question: string; answer: string }[];
}

export const CoverLetterChatbot: React.FC<CoverLetterChatbotProps> = ({
  position,
  currentAnswers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 자기소개서 작성을 도와드리는 AI 도우미입니다. 궁금하신 점을 편하게 물어보세요. 😊',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // DB에서 통계 데이터 가져오기
      const stats = position.trim()
        ? await getComprehensiveStats(position)
        : null;

      // 현재 작성 중인 자소서 내용
      const currentContent = currentAnswers
        .filter(qa => qa.answer.trim())
        .map(qa => `질문: ${qa.question}\n답변: ${qa.answer}`)
        .join('\n\n');

      // 통계 데이터 요약
      const statsContext = stats ? {
        직무: position,
        분석_데이터_수: stats.totalApplicants,
        평균_학점: stats.avgGpa.toFixed(2),
        평균_토익: Math.round(stats.avgToeic),
        주요_활동: stats.commonActivities.slice(0, 5).map(a => ({
          활동: a.activityType,
          비율: `${a.percentage.toFixed(0)}%`,
          인사이트: a.insight
        }))
      } : null;

      const systemPrompt = `당신은 자기소개서 작성을 돕는 전문 AI 어시스턴트입니다.

# 당신의 역할
1. 사용자의 자기소개서 작성을 돕습니다
2. 실제 합격자 통계 데이터를 기반으로 조언합니다
3. 구체적이고 실용적인 답변을 제공합니다

# 중요한 규칙
⛔ 절대 금지 사항:
- DB에 있는 실제 자기소개서 전문을 그대로 제공하지 마세요
- 특정 합격자의 답변을 복사하지 마세요
- "이렇게 쓴 사람이 있습니다" 식으로 전문을 인용하지 마세요

✅ 허용 사항:
- 통계 데이터와 패턴을 설명하기 (예: "합격자의 70%가 프로젝트 경험을 언급합니다")
- 일반적인 조언과 팁 제공
- 사용자의 답변을 분석하고 개선 방향 제시
- 구조와 스토리텔링 방법 제안

# 현재 컨텍스트
${statsContext ? `
## 합격자 통계 (${position} 직무)
${JSON.stringify(statsContext, null, 2)}
` : ''}

${currentContent ? `
## 사용자가 작성 중인 자기소개서
${currentContent}
` : '사용자가 아직 자기소개서를 작성하지 않았습니다.'}

# 답변 스타일
- 친근하고 격려하는 톤
- 구체적이고 실용적인 조언
- 2-3문단으로 간결하게
- 이모지 적절히 사용`;

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-5).map(m => ({ // 최근 5개 메시지만 컨텍스트로
            role: m.role,
            content: m.content
          })),
          { role: 'user', content: userMessage.content }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('챗봇 응답 생성 실패:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 🙏',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center gap-2 group"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          자소서 도우미와 대화하기
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 ${
        isExpanded
          ? 'w-[800px] h-[80vh]'
          : 'w-96 h-[600px]'
      }`}
    >
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          <div>
            <h3 className="font-bold">자소서 도우미</h3>
            <p className="text-xs opacity-90">무엇이든 물어보세요!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            title={isExpanded ? "축소" : "확대"}
          >
            {isExpanded ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            title="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 rounded-2xl px-4 py-2 border border-gray-200">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 점을 입력하세요..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white rounded-lg px-4 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Shift + Enter로 줄바꿈, Enter로 전송
        </p>
      </div>
    </div>
  );
};
