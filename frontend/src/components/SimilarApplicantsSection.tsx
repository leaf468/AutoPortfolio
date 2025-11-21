import React from 'react';
import { SimilarApplicant } from '../services/coverLetterAnalysisService';

interface SimilarApplicantsSectionProps {
  applicants: SimilarApplicant[];
  isLoading: boolean;
}

export const SimilarApplicantsSection: React.FC<SimilarApplicantsSectionProps> = ({
  applicants,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">비슷한 스펙 분석</h3>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">분석 중...</p>
        </div>
      </div>
    );
  }

  if (applicants.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">비슷한 스펙 분석</h3>
        <div className="text-center py-8 text-gray-500">
          분석 결과가 없습니다. 정보를 입력하고 분석하기를 클릭하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">비슷한 스펙 분석</h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {applicants.length}명 발견
        </span>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {applicants.map((applicant, index) => (
          <div
            key={applicant.coverLetter.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {applicant.coverLetter.company_name}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-700">{applicant.coverLetter.job_position}</span>
                </div>
                <div className="text-sm text-gray-600">{applicant.coverLetter.specific_info}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  유사도 {applicant.similarity.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">{applicant.coverLetter.year}</div>
              </div>
            </div>

            {applicant.activities.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-2">주요 활동</div>
                <div className="flex flex-wrap gap-2">
                  {applicant.activities.slice(0, 5).map((activity) => (
                    <span
                      key={activity.id}
                      className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs"
                    >
                      {activity.activity_type}
                    </span>
                  ))}
                  {applicant.activities.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                      +{applicant.activities.length - 5}개
                    </span>
                  )}
                </div>
              </div>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                자소서 전문 보기
              </summary>
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {applicant.coverLetter.full_text}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarApplicantsSection;
