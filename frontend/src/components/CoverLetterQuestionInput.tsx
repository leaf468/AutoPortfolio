import React, { useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export interface CoverLetterQuestion {
  id: string;
  question: string;
  answer: string;
  placeholder: string;
  maxLength?: number;
}

interface CoverLetterQuestionInputProps {
  questions: CoverLetterQuestion[];
  onAnswerChange: (questionId: string, answer: string) => void;
  onQuestionChange?: (questionId: string, question: string) => void;
  onMaxLengthChange?: (questionId: string, maxLength: number | undefined) => void;
  onQuestionAdd?: () => void;
  onQuestionRemove?: (questionId: string) => void;
  onFocus?: (questionId: string) => void;
}

export const CoverLetterQuestionInput: React.FC<CoverLetterQuestionInputProps> = ({
  questions,
  onAnswerChange,
  onQuestionChange,
  onMaxLengthChange,
  onQuestionAdd,
  onQuestionRemove,
  onFocus,
}) => {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingMaxLength, setEditingMaxLength] = useState<string>('');

  const handleStartEdit = (questionId: string, currentQuestion: string, currentMaxLength?: number) => {
    setEditingQuestionId(questionId);
    setEditingText(currentQuestion);
    setEditingMaxLength(currentMaxLength ? currentMaxLength.toString() : '');
  };

  const handleSaveEdit = (questionId: string) => {
    if (editingText.trim() && onQuestionChange) {
      onQuestionChange(questionId, editingText.trim());
    }

    if (onMaxLengthChange) {
      const maxLen = editingMaxLength ? parseInt(editingMaxLength) : undefined;
      onMaxLengthChange(questionId, maxLen);
    }

    setEditingQuestionId(null);
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditingText('');
    setEditingMaxLength('');
  };

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start flex-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3 flex-shrink-0">
                {index + 1}
              </span>

              {editingQuestionId === question.id ? (
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">질문</label>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">최대 글자수 (선택)</label>
                    <input
                      type="number"
                      value={editingMaxLength}
                      onChange={(e) => setEditingMaxLength(e.target.value)}
                      placeholder="제한 없음"
                      className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(question.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 leading-8">
                    {question.question}
                  </h3>
                  {question.maxLength && (
                    <span className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                      <Cog6ToothIcon className="w-3 h-3" />
                      최대 {question.maxLength}자
                    </span>
                  )}
                </div>
              )}
            </div>

            {editingQuestionId !== question.id && (
              <div className="flex gap-2 ml-4">
                {onQuestionChange && (
                  <button
                    onClick={() => handleStartEdit(question.id, question.question, question.maxLength)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="질문/설정 수정"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
                {onQuestionRemove && questions.length > 1 && (
                  <button
                    onClick={() => onQuestionRemove(question.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="질문 삭제"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <textarea
            value={question.answer}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            onFocus={() => onFocus?.(question.id)}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
            className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />

          {question.maxLength && (
            <div className="mt-2 text-sm text-gray-500 text-right">
              {question.answer.length} / {question.maxLength}자
            </div>
          )}
        </div>
      ))}

      {/* 질문 추가 버튼 */}
      {onQuestionAdd && (
        <button
          onClick={onQuestionAdd}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          질문 추가하기
        </button>
      )}
    </div>
  );
};
