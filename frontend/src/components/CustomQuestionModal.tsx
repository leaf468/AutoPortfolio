import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { analyzeCustomQuestion, CustomFieldDefinition } from '../services/customQuestionAnalyzer';

interface CustomQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionText: string, fields: CustomFieldDefinition[], explanation: string) => void;
}

export const CustomQuestionModal: React.FC<CustomQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!questionText.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysis = await analyzeCustomQuestion(questionText);
      onSubmit(questionText, analysis.suggestedFields, analysis.explanation);
      setQuestionText('');
      onClose();
    } catch (error) {
      alert('질문 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">직접 질문 입력하기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자소서 질문 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="예: 팀 프로젝트에서 갈등을 해결한 경험을 기술해주세요."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 안내</h3>
            <p className="text-sm text-blue-800">
              질문을 입력하면 AI가 자동으로 분석하여 답변 작성에 필요한 핵심 필드들을 생성합니다.
              생성된 필드에 내용을 입력하면 자동으로 답변이 완성됩니다.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            취소
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !questionText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                분석 중...
              </>
            ) : (
              '질문 추가하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
