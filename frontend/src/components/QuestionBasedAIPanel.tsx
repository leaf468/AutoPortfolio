import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CoverLetterQuestion } from './CoverLetterQuestionInput';
import { QuestionAnalysis } from '../services/questionAnalysisService';
import { generateRealtimeRecommendations, AIRecommendation } from '../services/aiRecommendationService';

interface QuestionBasedAIPanelProps {
  questions: CoverLetterQuestion[];
  questionAnalyses: QuestionAnalysis[];
  position: string;
}

export const QuestionBasedAIPanel: React.FC<QuestionBasedAIPanelProps> = ({
  questions,
  questionAnalyses,
  position,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<{ [questionId: string]: boolean }>({});
  const [aiRecommendations, setAIRecommendations] = useState<{ [questionId: string]: AIRecommendation[] }>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<{ [questionId: string]: boolean }>({});

  // 각 질문의 답변이 변경되면 AI 추천 갱신
  useEffect(() => {
    questions.forEach(async (question) => {
      if (question.answer.trim().length > 10 && position.trim()) {
        setLoadingRecommendations(prev => ({ ...prev, [question.id]: true }));
        try {
          const recommendations = await generateRealtimeRecommendations(
            question.answer,
            position,
            question.question
          );
          setAIRecommendations(prev => ({ ...prev, [question.id]: recommendations }));
        } catch (error) {
          console.error('AI 추천 생성 실패:', error);
        } finally {
          setLoadingRecommendations(prev => ({ ...prev, [question.id]: false }));
        }
      }
    });
  }, [questions, position]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (!position.trim()) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
        <div className="text-center text-gray-500">
          <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">지원 직무를 입력하면<br />AI 추천을 확인할 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          질문별 AI 분석 및 추천
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          각 질문을 펼쳐서 상세 분석을 확인하세요
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {questions.map((question, index) => {
          const questionAnalysis = questionAnalyses.find(qa => qa.questionId === question.id);
          const recommendations = aiRecommendations[question.id] || [];
          const isExpanded = expandedQuestions[question.id];
          const isLoading = loadingRecommendations[question.id];
          const hasContent = questionAnalysis || recommendations.length > 0;

          return (
            <div key={question.id} className="p-4">
              <button
                onClick={() => toggleQuestion(question.id)}
                className="w-full flex items-start justify-between text-left group"
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {question.question.length > 40 ? question.question.slice(0, 40) + '...' : question.question}
                    </h4>
                  </div>
                  {hasContent && (
                    <p className="text-xs text-gray-500 ml-8">
                      {questionAnalysis ? '질문 분석 완료' : ''}
                      {questionAnalysis && recommendations.length > 0 ? ' · ' : ''}
                      {recommendations.length > 0 ? `AI 추천 ${recommendations.length}개` : ''}
                    </p>
                  )}
                  {isLoading && (
                    <p className="text-xs text-blue-600 ml-8">분석 중...</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && hasContent && (
                <div className="mt-4 ml-8 space-y-4">
                  {/* 질문 분석 */}
                  {questionAnalysis && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h5 className="text-sm font-semibold text-purple-900 mb-3">📊 질문 분석</h5>

                      {/* 관련 키워드 */}
                      {questionAnalysis.relevantKeywords.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">🔑 관련 키워드</p>
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
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">📝 추천 주제</p>
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
                          <p className="text-xs font-medium text-gray-700 mb-2">📈 합격자 통계</p>
                          <div className="space-y-2">
                            {questionAnalysis.relatedStats.slice(0, 2).map((stat, idx) => (
                              <div key={idx} className="bg-white rounded p-2">
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

                  {/* AI 추천 */}
                  {recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h5 className="text-sm font-semibold text-blue-900 mb-3">💡 AI 추천</h5>
                      <div className="space-y-2">
                        {recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-white rounded p-3">
                            <h6 className="text-xs font-semibold text-gray-900 mb-1">{rec.title}</h6>
                            <p className="text-xs text-gray-700">{rec.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
