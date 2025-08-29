import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ForwardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  interactiveBooster, 
  BoosterSession, 
  BoosterQuestion, 
  BoostResult 
} from '../services/interactiveBooster';
import { OrganizedContent } from '../services/aiOrganizer';

interface InteractiveBoosterChatProps {
  organizedContent: OrganizedContent;
  onComplete: (result: BoostResult) => void;
}

const InteractiveBoosterChat: React.FC<InteractiveBoosterChatProps> = ({ 
  organizedContent, 
  onComplete 
}) => {
  const [session, setSession] = useState<BoosterSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<BoosterQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    setIsInitializing(true);
    try {
      const newSession = await interactiveBooster.createBoosterSession(organizedContent);
      setSession(newSession);
      const firstQuestion = await interactiveBooster.getNextQuestion(newSession);
      setCurrentQuestion(firstQuestion);
    } catch (error) {
      console.error('세션 초기화 오류:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAnswer = async () => {
    if (!session || !currentQuestion || !answer.trim()) return;

    setIsProcessing(true);
    try {
      const updatedSession = await interactiveBooster.processAnswer(
        session, 
        currentQuestion.id, 
        answer.trim()
      );
      setSession(updatedSession);
      
      const nextQuestion = await interactiveBooster.getNextQuestion(updatedSession);
      setCurrentQuestion(nextQuestion);
      setAnswer('');

      // 모든 질문이 완료되었으면 결과 생성
      if (!nextQuestion) {
        await generateResult(updatedSession);
      }
    } catch (error) {
      console.error('답변 처리 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (!session) return;

    setIsProcessing(true);
    try {
      const updatedSession = await interactiveBooster.skipQuestion(session);
      setSession(updatedSession);
      
      const nextQuestion = await interactiveBooster.getNextQuestion(updatedSession);
      setCurrentQuestion(nextQuestion);
      setAnswer('');

      if (!nextQuestion) {
        await generateResult(updatedSession);
      }
    } catch (error) {
      console.error('질문 건너뛰기 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateResult = async (finalSession: BoosterSession) => {
    setIsProcessing(true);
    try {
      const result = await interactiveBooster.generateBoostResult(organizedContent, finalSession);
      onComplete(result);
    } catch (error) {
      console.error('결과 생성 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStats = () => {
    if (!session) return null;
    return interactiveBooster.getSessionStats(session);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '중요';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '일반';
    }
  };

  if (isInitializing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">보강 질문을 준비하는 중...</h3>
          <p className="text-gray-600 mt-2">포트폴리오를 분석하여 맞춤형 질문을 생성하고 있습니다</p>
        </motion.div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">보강 완료!</h3>
          <p className="text-gray-600">결과를 생성하고 있습니다...</p>
        </motion.div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center items-center mb-4">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mr-2" />
          <h2 className="text-3xl font-bold text-gray-900">대화형 보강</h2>
        </div>
        <p className="text-lg text-gray-600">
          AI가 부족한 정보를 우선순위별로 질문합니다
        </p>
      </motion.div>

      {/* 진행률 및 통계 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              진행률: <span className="font-semibold text-purple-600">{session.progress}%</span>
            </div>
            <div className="text-sm text-gray-600">
              ({Object.keys(session.answers).length}/{session.questions.length})
            </div>
            {stats && (
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center text-sm text-purple-600 hover:text-purple-800"
              >
                <ChartBarIcon className="w-4 h-4 mr-1" />
                상세 통계
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            예상 남은 시간: {stats ? `${stats.estimatedTimeRemaining}분` : '--'}
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${session.progress}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
          />
        </div>

        {/* 상세 통계 */}
        <AnimatePresence>
          {showStats && stats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 mb-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.highPriorityCompleted}/{stats.highPriorityTotal}
                  </div>
                  <div className="text-sm text-gray-600">중요 질문</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.answeredQuestions}</div>
                  <div className="text-sm text-gray-600">답변 완료</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completedCategories.length}
                  </div>
                  <div className="text-sm text-gray-600">완성 영역</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalQuestions - stats.answeredQuestions}
                  </div>
                  <div className="text-sm text-gray-600">남은 질문</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 질문 카드 */}
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(currentQuestion.priority)}`}>
                {getPriorityLabel(currentQuestion.priority)}
              </span>
              <span className="ml-2 text-xs text-gray-500 capitalize">
                {currentQuestion.category}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentQuestion.question}
            </h3>
            <p className="text-sm text-gray-600">
              {currentQuestion.context}
            </p>
          </div>
        </div>

        {/* 답변 입력 */}
        <div className="space-y-4">
          {currentQuestion.suggestions && currentQuestion.suggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">💡 답변 예시:</p>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswer(suggestion)}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            {currentQuestion.expectedAnswer === 'long_text' ? (
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                placeholder="자세히 설명해주세요..."
              />
            ) : currentQuestion.expectedAnswer === 'number' ? (
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="숫자를 입력하세요..."
              />
            ) : currentQuestion.expectedAnswer === 'date' ? (
              <input
                type="date"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            ) : (
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="답변을 입력하세요..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnswer();
                  }
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* 액션 버튼들 */}
      <div className="flex space-x-4">
        <button
          onClick={handleSkip}
          disabled={isProcessing}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ForwardIcon className="w-5 h-5 mr-2" />
          건너뛰기
        </button>
        <button
          onClick={handleAnswer}
          disabled={!answer.trim() || isProcessing}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              처리 중...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              답변하기
            </>
          )}
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        💡 팁: 구체적인 수치와 결과를 포함하면 더 임팩트 있는 포트폴리오가 됩니다
      </div>
    </div>
  );
};

export default InteractiveBoosterChat;