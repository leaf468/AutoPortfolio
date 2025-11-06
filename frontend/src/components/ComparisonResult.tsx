import React from 'react';
import { ComparisonResult as ComparisonResultType } from '../services/coverLetterAnalysisService';

interface ComparisonResultProps {
  result: ComparisonResultType | null;
  isLoading: boolean;
}

export const ComparisonResult: React.FC<ComparisonResultProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">자소서 비교 분석</h3>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">비교 분석 중...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">자소서 비교 분석</h3>
        <div className="text-center py-8 text-gray-500">
          자소서를 입력하고 분석하기를 클릭하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">자소서 비교 분석</h3>

      {/* 강점 */}
      {result.strengths.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">강점</h4>
          </div>
          <div className="pl-10 space-y-2">
            {result.strengths.map((strength, index) => (
              <div
                key={index}
                className="p-3 bg-green-50 border-l-4 border-green-500 rounded text-gray-700"
              >
                {strength}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 약점 */}
      {result.weaknesses.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">!</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">개선 필요</h4>
          </div>
          <div className="pl-10 space-y-2">
            {result.weaknesses.map((weakness, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-gray-700"
              >
                {weakness}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 제안 */}
      {result.suggestions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">💡</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">추천 사항</h4>
          </div>
          <div className="pl-10 space-y-2">
            {result.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-gray-700"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 누락된 활동 */}
      {result.missingActivities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-lg">⚠</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">추가 고려 활동</h4>
          </div>
          <div className="pl-10 space-y-3">
            {result.missingActivities.map((activity, index) => (
              <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{activity.activityType}</span>
                  <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                    합격자의 {activity.percentage.toFixed(0)}%가 보유
                  </span>
                </div>
                {activity.examples.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 mt-2">
                      예시 보기
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600 pl-4">
                      {activity.examples.map((example, i) => (
                        <li key={i} className="list-disc">
                          {example.length > 100 ? `${example.substring(0, 100)}...` : example}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모든 항목이 비어있을 때 */}
      {result.strengths.length === 0 &&
        result.weaknesses.length === 0 &&
        result.suggestions.length === 0 &&
        result.missingActivities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>비교 분석 결과가 없습니다.</p>
            <p className="text-sm mt-2">데이터가 충분하지 않거나 자소서가 입력되지 않았습니다.</p>
          </div>
        )}
    </div>
  );
};

export default ComparisonResult;
