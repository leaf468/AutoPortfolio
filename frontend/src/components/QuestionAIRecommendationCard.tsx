import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CoverLetterQuestion } from './CoverLetterQuestionInput';
import { QuestionAnalysis } from '../services/questionAnalysisService';
import { generateRealtimeRecommendations, AIRecommendation } from '../services/aiRecommendationService';

interface QuestionAIRecommendationCardProps {
  question: CoverLetterQuestion;
  questionIndex: number;
  questionAnalysis?: QuestionAnalysis;
  position: string;
}

export const QuestionAIRecommendationCard: React.FC<QuestionAIRecommendationCardProps> = ({
  question,
  questionIndex,
  questionAnalysis,
  position,
}) => {
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 답변이 변경되면 AI 추천 갱신
  useEffect(() => {
    const loadRecommendations = async () => {
      if (question.answer.trim().length > 10 && position.trim()) {
        setIsLoading(true);
        try {
          const recommendations = await generateRealtimeRecommendations(
            question.answer,
            position,
            question.question
          );
          setAIRecommendations(recommendations);
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      } else {
        setAIRecommendations([]);
      }
    };

    const timer = setTimeout(loadRecommendations, 500);
    return () => clearTimeout(timer);
  }, [question.answer, position, question.question]);

  const hasContent = questionAnalysis || aiRecommendations.length > 0;

  if (!position.trim()) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <SparklesIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">지원 직무를 입력하세요</p>
        </div>
      </div>
    );
  }

  if (!hasContent && !isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <SparklesIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">답변을 입력하면<br />AI 추천이 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900">질문 {questionIndex + 1} AI 분석</h4>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {/* 질문 분석 */}
        {questionAnalysis && (
          <div className="p-4">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h5 className="text-sm font-semibold text-purple-900">📊 질문 분석</h5>
              {showAnalysis ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>

            {showAnalysis && (
              <div className="space-y-3">
                {/* 관련 키워드 */}
                {questionAnalysis.relevantKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">🔑 관련 키워드</p>
                    <div className="flex flex-wrap gap-1">
                      {questionAnalysis.relevantKeywords.map((keyword, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추천 주제 */}
                {questionAnalysis.suggestedTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">📝 추천 주제</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {questionAnalysis.suggestedTopics.slice(0, 3).map((topic, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-purple-600">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 관련 통계 */}
                {questionAnalysis.relatedStats.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">📈 합격자 통계</p>
                    <div className="space-y-2">
                      {questionAnalysis.relatedStats.slice(0, 2).map((stat, idx) => (
                        <div key={idx} className="bg-purple-50 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-900">{stat.activityType}</span>
                            <span className="text-xs font-bold text-blue-600">{stat.percentage.toFixed(0)}%</span>
                          </div>
                          <p className="text-xs text-gray-600">{stat.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI 추천 */}
        {(aiRecommendations.length > 0 || isLoading) && (
          <div className="p-4">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h5 className="text-sm font-semibold text-blue-900">💡 AI 추천</h5>
              {showRecommendations ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>

            {showRecommendations && (
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-500 mt-2">분석 중...</p>
                  </div>
                ) : (
                  aiRecommendations.map((rec, idx) => (
                    <div key={idx} className="bg-blue-50 rounded p-3">
                      <h6 className="text-xs font-semibold text-gray-900 mb-1">{rec.title}</h6>
                      <p className="text-xs text-gray-700">{rec.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
