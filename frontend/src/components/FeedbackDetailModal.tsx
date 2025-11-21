import React from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface FeedbackDetailModalProps {
  feedback: any;
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF: () => void;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedback,
  isOpen,
  onClose,
  onDownloadPDF
}) => {
  if (!isOpen || !feedback) return null;

  const questions = feedback.questions || [];

  // 중복 제거 함수
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?]/g, '')
      .trim();
  };

  const deduplicateBySimilarity = (items: string[]) => {
    const uniqueItems: string[] = [];
    const seenNormalized = new Set<string>();

    items.forEach(item => {
      const normalized = normalizeText(item);
      const isDuplicate = Array.from(seenNormalized).some(seen => {
        const similarity = calculateSimilarity(seen, normalized);
        return similarity > 0.7;
      });

      if (!isDuplicate) {
        uniqueItems.push(item);
        seenNormalized.add(normalized);
      }
    });

    return uniqueItems;
  };

  const calculateSimilarity = (str1: string, str2: string) => {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(w => words2.includes(w));
    return (commonWords.length * 2) / (words1.length + words2.length);
  };

  // 강점/약점 수집 및 중복 제거 (상위 5개만)
  let rawStrengths: string[] = [];
  let rawWeaknesses: string[] = [];

  if (feedback.strengths && feedback.strengths.length > 0) {
    rawStrengths = feedback.strengths;
  } else {
    questions.forEach((q: any) => {
      if (q.analysis?.contentAnalysis?.strengths) {
        rawStrengths.push(...q.analysis.contentAnalysis.strengths);
      }
    });
  }

  if (feedback.weaknesses && feedback.weaknesses.length > 0) {
    rawWeaknesses = feedback.weaknesses;
  } else {
    questions.forEach((q: any) => {
      if (q.analysis?.contentAnalysis?.weaknesses) {
        rawWeaknesses.push(...q.analysis.contentAnalysis.weaknesses);
      }
    });
  }

  const allStrengths = deduplicateBySimilarity(rawStrengths);
  const allWeaknesses = deduplicateBySimilarity(rawWeaknesses);
  const topStrengths = allStrengths.slice(0, 5);
  const topWeaknesses = allWeaknesses.slice(0, 5);

  // 액션 아이템 (상위 3개)
  const actionItems = (feedback.suggestions || []).slice(0, 3);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] flex flex-col">
          {/* 헤더 (고정) */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 rounded-t-2xl flex items-center justify-between">
            <div className="flex-1">
              <p className="text-indigo-200 text-sm mb-2 font-medium">자소서 첨삭 결과</p>
              <h2 className="text-3xl font-bold text-white">
                {feedback.company_name} <span className="text-indigo-200">·</span> {feedback.job_position}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* 종합 점수 */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <div className="text-3xl font-bold text-white">{feedback.overall_score}</div>
                <div className="text-xs text-indigo-100 mt-1">종합 점수</div>
              </div>
              <button
                onClick={onDownloadPDF}
                className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-semibold flex items-center space-x-2 shadow-md"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>PDF 다운로드</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* 바디 (스크롤 가능) */}
          <div className="overflow-y-auto p-8 flex-1">
            {/* 핵심 요약 */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">💡</span>
                가장 중요한 개선 포인트
              </h3>
              <div className="space-y-2">
                {topWeaknesses.slice(0, 3).map((weakness: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-indigo-200">
                    <div className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-800 flex-1 font-medium">{weakness}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 질문별 상세 분석 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📝</span>
                질문별 첨삭 결과
              </h3>
              <div className="space-y-6">
                {questions.map((q: any, index: number) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-shadow"
                  >
                    {/* 질문 헤더 */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                            질문 {index + 1}
                          </span>
                          {q.analysis?.overallScore && (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                              {q.analysis.overallScore}점
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-lg text-gray-900">{q.question}</h4>
                      </div>
                    </div>

                    {/* AI 수정 답변 (핵심!) */}
                    {q.analysis?.revisedVersion && (
                      <div className="mb-4">
                        <div className="flex items-center mb-3">
                          <span className="text-xl mr-2">✨</span>
                          <h5 className="font-bold text-gray-900">AI 수정 답변</h5>
                        </div>
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-indigo-200">
                          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{q.analysis.revisedVersion}</p>
                        </div>
                      </div>
                    )}

                    {/* 개선 포인트 */}
                    {q.analysis?.keyImprovements && q.analysis.keyImprovements.length > 0 && (
                      <div>
                        <div className="flex items-center mb-3">
                          <span className="text-xl mr-2">🎯</span>
                          <h5 className="font-bold text-gray-900">이 답변의 개선 포인트</h5>
                        </div>
                        <div className="space-y-2">
                          {q.analysis.keyImprovements.slice(0, 4).map((improvement: string, idx: number) => (
                            <div key={idx} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <span className="text-yellow-600 font-bold text-sm mt-0.5">▸</span>
                              <p className="text-gray-800 text-sm flex-1">{improvement}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 전체 피드백 */}
            <div className="space-y-6">
              {/* 전체 강점 */}
              {topStrengths.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">✅</span>
                    자소서 전체의 강점
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {topStrengths.map((strength: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-emerald-300"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-800 flex-1">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 개선 필요 사항 */}
              {topWeaknesses.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    개선이 필요한 부분
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {topWeaknesses.map((weakness: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-orange-300"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">!</span>
                        </div>
                        <p className="text-gray-800 flex-1">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 아이템 */}
              {actionItems.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎯</span>
                    지금 바로 할 일
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {actionItems.map((action: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-blue-300"
                      >
                        <div className="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-800 flex-1 font-medium">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 커리어 성장 추천 섹션 (실제 데이터 사용 시) */}
            {questions.length > 0 && questions[0].analysis?.careerRecommendations && (
              <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🚀</span>
                  커리어 성장 추천
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  귀하의 현재 스펙과 자소서 내용을 분석하여 맞춤형 커리어 성장 방안을 제시합니다.
                </p>

                <div className="space-y-6">
                  {/* 추천 자격증 */}
                  {questions[0].analysis.careerRecommendations.certificates && (
                    <div className="bg-white rounded-lg p-5 border border-purple-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="text-lg mr-2">📜</span>
                        추천 자격증
                      </h4>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {questions[0].analysis.careerRecommendations.certificates}
                      </p>
                    </div>
                  )}

                  {/* 추천 수상/대회 */}
                  {questions[0].analysis.careerRecommendations.awards && (
                    <div className="bg-white rounded-lg p-5 border border-purple-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="text-lg mr-2">🏆</span>
                        추천 수상 및 대회
                      </h4>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {questions[0].analysis.careerRecommendations.awards}
                      </p>
                    </div>
                  )}

                  {/* 추천 활동 */}
                  {questions[0].analysis.careerRecommendations.activities && (
                    <div className="bg-white rounded-lg p-5 border border-purple-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="text-lg mr-2">🎯</span>
                        추천 활동
                      </h4>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {questions[0].analysis.careerRecommendations.activities}
                      </p>
                    </div>
                  )}

                  {/* 개발해야 할 스킬 */}
                  {questions[0].analysis.careerRecommendations.skills && (
                    <div className="bg-white rounded-lg p-5 border border-purple-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="text-lg mr-2">💪</span>
                        개발해야 할 스킬
                      </h4>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {questions[0].analysis.careerRecommendations.skills}
                      </p>
                    </div>
                  )}

                  {/* 종합 커리어 로드맵 */}
                  {questions[0].analysis.careerRecommendations.summary && (
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-5 border-2 border-purple-300">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="text-lg mr-2">🗺️</span>
                        종합 커리어 로드맵
                      </h4>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                        {questions[0].analysis.careerRecommendations.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 작성 일시 */}
            <div className="mt-8 text-center text-sm text-gray-500">
              작성일: {new Date(feedback.created_at).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* 푸터 (고정) */}
          <div className="bg-gray-50 px-8 py-4 rounded-b-2xl border-t-2 border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              상세한 분석 내용은 PDF 다운로드를 통해 확인하세요
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                닫기
              </button>
              <button
                onClick={onDownloadPDF}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition font-semibold flex items-center space-x-2 shadow-md"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>PDF 다운로드</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
