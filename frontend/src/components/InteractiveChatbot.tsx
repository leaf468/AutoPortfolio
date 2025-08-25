import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { portfolioAPI } from '../services/api';
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface InteractiveChatbotProps {
  template: string;
  rawText: string;
  onComplete: (finalData: any) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  question?: any;
}


interface Question {
  field: string;
  question: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({ 
  template, 
  rawText, 
  onComplete 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userInput, setUserInput] = useState('');
  const [extractedData, setExtractedData] = useState<any>({});
  const [isComplete, setIsComplete] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);
  const componentId = useRef(`comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 텍스트 파싱
  const parseTextMutation = useMutation({
    mutationFn: (data: any) => portfolioAPI.parseText(data),
    onSuccess: (data) => {
      setExtractedData(data.parsed_data);
      
      if (data.missing_fields && data.missing_fields.length > 0) {
        // 질문 생성 요청
        generateQuestions(data.missing_fields, data.parsed_data);
      } else {
        // 완료
        handleComplete(data.parsed_data);
      }
    },
  });

  // 질문 생성
  const generateQuestionsMutation = useMutation({
    mutationFn: (data: any) => portfolioAPI.generateQuestions(data),
    onSuccess: (data) => {
      if (data.is_complete) {
        handleComplete(extractedData);
      } else {
        setPendingQuestions(data.questions);
        if (data.questions.length > 0) {
          askNextQuestion(data.questions);
        }
      }
    },
  });

  // 답변 처리
  const processAnswerMutation = useMutation({
    mutationFn: (data: any) => portfolioAPI.processAnswer(data),
    onSuccess: (data) => {
      setExtractedData(data.updated_data);
      
      // 다음 질문으로 이동
      const remainingQuestions = pendingQuestions.slice(1);
      setPendingQuestions(remainingQuestions);
      
      if (remainingQuestions.length > 0) {
        setTimeout(() => {
          askNextQuestion(remainingQuestions);
        }, 1000);
      } else {
        handleComplete(data.updated_data);
      }
    },
  });

  const generateQuestions = (missingFields: string[], context: any) => {
    generateQuestionsMutation.mutate({
      missing_fields: missingFields,
      context: context
    });
  };

  const askNextQuestion = (questions: Question[]) => {
    const question = questions[0];
    setCurrentQuestion(question);
    
    addMessage({
      id: `question-${componentId.current}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'assistant',
      content: question.question,
      timestamp: new Date(),
      question: question
    });
  };

  const handleComplete = (finalData: any) => {
    setIsComplete(true);
    setCurrentQuestion(null);
    
    addMessage({
      id: `complete-${componentId.current}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'system',
      content: '🎉 모든 정보 수집이 완료되었습니다! 포트폴리오를 생성할 준비가 되었습니다.',
      timestamp: new Date()
    });

    setTimeout(() => {
      onComplete(finalData);
    }, 2000);
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleUserSubmit = () => {
    if (!userInput.trim() || !currentQuestion) return;

    // 사용자 메시지 추가
    addMessage({
      id: `user-${componentId.current}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: userInput,
      timestamp: new Date()
    });

    // 답변 처리
    processAnswerMutation.mutate({
      question: currentQuestion,
      answer: userInput,
      current_data: extractedData
    });

    setUserInput('');
    setCurrentQuestion(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmit();
    }
  };

  const selectOption = (option: string) => {
    setUserInput(option);
  };

  // 컴포넌트 마운트 시 초기 파싱 시작
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;
    
    // 환영 메시지
    addMessage({
      id: `welcome-${componentId.current}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'assistant',
      content: '안녕하세요! 입력해주신 정보를 분석하고 있습니다. 잠시만 기다려주세요... ✨',
      timestamp: new Date()
    });

    // 텍스트 파싱 시작
    setTimeout(() => {
      parseTextMutation.mutate({
        template,
        rawText
      });
    }, 1500);
  }, []);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserIcon className="w-5 h-5" />;
      case 'assistant':
        return <ComputerDesktopIcon className="w-5 h-5" />;
      case 'system':
        return <SparklesIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-purple-600 text-white';
      case 'assistant':
        return 'bg-gray-100 text-gray-800';
      case 'system':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-96 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ComputerDesktopIcon className="w-6 h-6" />
            <span className="font-semibold">AI 포트폴리오 어시스턴트</span>
          </div>
          <div className="flex items-center space-x-2">
            {isComplete ? (
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            ) : (
              <ClockIcon className="w-5 h-5 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%] flex items-start space-x-2">
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    {getMessageIcon(message.type)}
                  </div>
                )}
                
                <div className={`px-4 py-2 rounded-lg ${getMessageColor(message.type)}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    {getMessageIcon(message.type)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {(parseTextMutation.isPending || generateQuestionsMutation.isPending || processAnswerMutation.isPending) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[80%] flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <ComputerDesktopIcon className="w-5 h-5" />
              </div>
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isComplete && currentQuestion && (
        <div className="border-t bg-white p-4">
          {/* Quick Options for Select Type */}
          {currentQuestion.type === 'select' && currentQuestion.options && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectOption(option)}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              type={currentQuestion.type === 'number' ? 'number' : 'text'}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="답변을 입력하세요..."
              disabled={processAnswerMutation.isPending}
            />
            <button
              onClick={handleUserSubmit}
              disabled={!userInput.trim() || processAnswerMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-4 py-2 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="border-t bg-green-50 p-4 text-center">
          <div className="flex items-center justify-center text-green-700">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">정보 수집 완료!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChatbot;