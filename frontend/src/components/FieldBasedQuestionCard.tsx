import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FieldBasedQuestion } from '../types/fieldBasedCoverLetter';
import { MotivationFieldInput } from './FieldInputs/MotivationFieldInput';
import { ExperienceFieldInput } from './FieldInputs/ExperienceFieldInput';
import { StrengthFieldInput } from './FieldInputs/StrengthFieldInput';
import { VisionFieldInput } from './FieldInputs/VisionFieldInput';
import { GrowthFieldInput } from './FieldInputs/GrowthFieldInput';
import { FailureFieldInput } from './FieldInputs/FailureFieldInput';
import { TeamworkFieldInput } from './FieldInputs/TeamworkFieldInput';
import { ConflictFieldInput } from './FieldInputs/ConflictFieldInput';
import { CustomFieldInput } from './FieldInputs/CustomFieldInput';
import { generateAnswerFromFields } from '../services/fieldBasedAnswerGenerator';
import { generateAnswerFromCustomFields } from '../services/customQuestionAnalyzer';
import { generateTypedAnswerWithLLM } from '../services/llmAnswerGenerator';

interface FieldBasedQuestionCardProps {
  question: FieldBasedQuestion;
  questionIndex: number;
  onUpdate: (question: FieldBasedQuestion) => void;
  onRemove?: () => void;
}

export const FieldBasedQuestionCard: React.FC<FieldBasedQuestionCardProps> = ({
  question,
  questionIndex,
  onUpdate,
  onRemove,
}) => {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [tempQuestion, setTempQuestion] = useState(question.question);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [showFields, setShowFields] = useState(false); // 기본값을 false로 변경 (접혀있음)
  const [isGenerating, setIsGenerating] = useState(false);

  // 수동으로 답변 생성 (버튼 클릭 시)
  const handleGenerateAnswer = async () => {
    // 필드 입력은 선택사항이므로 체크하지 않음
    setIsGenerating(true);

    try {
      let generatedAnswer = '';

      if (question.fieldType === 'custom') {
        // 커스텀 질문은 간단히 연결
        generatedAnswer = generateAnswerFromCustomFields(question.fields as Record<string, string>);
      } else {
        // LLM을 사용하여 전문적인 답변 생성
        generatedAnswer = await generateTypedAnswerWithLLM(
          question.fieldType,
          question.fields as any,
          question.question,
          question.maxLength || 1000
        );
      }

      onUpdate({
        ...question,
        generatedAnswer,
      });
    } catch (error) {
      console.error('Answer generation failed:', error);
      // 폴백: 기존 방식 사용
      let fallbackAnswer = '';
      if (question.fieldType === 'custom') {
        fallbackAnswer = generateAnswerFromCustomFields(question.fields as Record<string, string>);
      } else {
        fallbackAnswer = generateAnswerFromFields(
          question.fieldType,
          question.fields as any
        );
      }
      onUpdate({ ...question, generatedAnswer: fallbackAnswer });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFieldsChange = (newFields: any) => {
    onUpdate({
      ...question,
      fields: newFields,
    });
  };

  const handleQuestionSave = () => {
    onUpdate({
      ...question,
      question: tempQuestion,
    });
    setIsEditingQuestion(false);
  };

  const handleAnswerEdit = () => {
    setIsEditingAnswer(true);
  };

  const handleAnswerSave = (newAnswer: string) => {
    onUpdate({
      ...question,
      editedAnswer: newAnswer,
    });
    setIsEditingAnswer(false);
  };

  const renderFieldInput = () => {
    switch (question.fieldType) {
      case 'motivation':
        return <MotivationFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'experience':
        return <ExperienceFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'strength':
        return <StrengthFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'vision':
        return <VisionFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'growth':
        return <GrowthFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'failure':
        return <FailureFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'teamwork':
        return <TeamworkFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'conflict':
        return <ConflictFieldInput fields={question.fields as any} onChange={handleFieldsChange} />;
      case 'custom':
        if (!question.customFieldDefinitions) return null;
        return (
          <CustomFieldInput
            fields={question.fields as Record<string, string>}
            fieldDefinitions={question.customFieldDefinitions}
            onChange={handleFieldsChange}
          />
        );
      default:
        return null;
    }
  };

  const finalAnswer = question.editedAnswer || question.generatedAnswer;
  const answerLength = finalAnswer.length;
  const maxLength = question.maxLength || 1000;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 질문 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {isEditingQuestion ? (
            <div className="space-y-2">
              <input
                type="text"
                value={tempQuestion}
                onChange={(e) => setTempQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleQuestionSave}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setTempQuestion(question.question);
                    setIsEditingQuestion(false);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {questionIndex + 1}. {question.question}
              </h3>
              <button
                onClick={() => setIsEditingQuestion(true)}
                className="text-gray-400 hover:text-blue-600 p-1"
                title="질문 수정"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 ml-4 p-1"
            title="질문 삭제"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 커스텀 질문 설명 */}
      {question.fieldType === 'custom' && question.customExplanation && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>작성 가이드:</strong> {question.customExplanation}
          </p>
        </div>
      )}

      {/* AI 답변 생성 토글 */}
      <div className="mb-6">
        <button
          onClick={() => setShowFields(!showFields)}
          className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 rounded-lg transition"
        >
          <span className="font-medium text-gray-900">
            {showFields ? '▼' : '▶'} {showFields ? 'AI 답변 생성 접기' : '✨ 간단 입력으로 AI 답변 생성하기'}
          </span>
          <span className="text-sm text-gray-600">
            {showFields ? '핵심 내용만 입력하면 완성된 답변을 만들어드려요' : '몇 가지만 입력하면 AI가 완성해드려요'}
          </span>
        </button>

        {showFields && (
          <>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
              {renderFieldInput()}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateAnswer}
                disabled={isGenerating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    답변 생성 중...
                  </>
                ) : (
                  'AI 답변 생성'
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 생성된 답변 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            {question.editedAnswer ? '수정된 답변' : 'AI 생성 답변'}
          </h4>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${answerLength > maxLength ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {answerLength} / {maxLength}자
            </span>
            {finalAnswer && (
              <button
                onClick={handleAnswerEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                {question.editedAnswer ? '답변 다시 수정' : '답변 수정하기'}
              </button>
            )}
          </div>
        </div>

        {isEditingAnswer ? (
          <div className="space-y-2">
            <textarea
              defaultValue={finalAnswer}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              autoFocus
              onBlur={(e) => handleAnswerSave(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              답변란을 벗어나면 자동 저장됩니다.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {finalAnswer ? (
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {finalAnswer}
              </p>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">
                  💡 <strong>위 버튼을 클릭</strong>하여 AI 답변 생성 기능을 활용해보세요
                </p>
                <p className="text-sm text-gray-500">
                  몇 가지 핵심 내용만 입력하면, AI가 완성도 높은 자소서 답변을 자동으로 작성해드립니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
