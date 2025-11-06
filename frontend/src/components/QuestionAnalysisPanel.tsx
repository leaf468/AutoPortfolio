import React from 'react';
import { QuestionAnalysis } from '../services/questionAnalysisService';
import { LightBulbIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';

interface QuestionAnalysisPanelProps {
  analyses: QuestionAnalysis[];
  isLoading: boolean;
}

export const QuestionAnalysisPanel: React.FC<QuestionAnalysisPanelProps> = ({
  analyses,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">질문을 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ChartBarIcon className="w-6 h-6 text-purple-600" />
        질문별 데이터 분석
      </h2>

      <div className="space-y-6">
        {analyses.map((analysis, index) => (
          <div key={analysis.questionId} className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-start gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex-shrink-0">
                {index + 1}
              </span>
              {analysis.question}
            </h3>

            {/* 관련 키워드 */}
            {analysis.relevantKeywords.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <TagIcon className="w-4 h-4" />
                  <span className="font-medium">감지된 주제:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.relevantKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm border border-purple-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 일반 조언 */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-start gap-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{analysis.generalAdvice}</p>
              </div>
            </div>

            {/* 관련 통계 */}
            {analysis.relatedStats.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📊 관련 데이터</h4>
                <div className="space-y-2">
                  {analysis.relatedStats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{stat.activityType}</span>
                        <span className="text-sm font-semibold text-purple-600">
                          {stat.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{stat.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 제안 주제 */}
            {analysis.suggestedTopics.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 답변에 포함할 내용</h4>
                <ul className="space-y-1">
                  {analysis.suggestedTopics.map((topic, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-600 flex-shrink-0">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>참고:</strong> 이 분석은 실제 합격자 데이터를 기반으로 생성되었습니다.
          제안된 내용을 참고하되, 본인의 실제 경험을 진실되게 작성하는 것이 가장 중요합니다.
        </p>
      </div>
    </div>
  );
};
