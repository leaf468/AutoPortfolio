import React from 'react';
import { FailureFields } from '../../types/fieldBasedCoverLetter';

interface FailureFieldInputProps {
  fields: FailureFields;
  onChange: (fields: FailureFields) => void;
}

export const FailureFieldInput: React.FC<FailureFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof FailureFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">💪 실패/극복 경험 필드 입력</h3>

      <div className="border-l-4 border-orange-500 pl-4 mb-4">
        <h4 className="font-semibold text-orange-700 mb-3">실패 상황</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상황 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.situationDesc}
              onChange={(e) => handleFieldChange('situationDesc', e.target.value)}
              placeholder="예: 팀 프로젝트에서 리더를 맡아 새로운 서비스 개발을 진행"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              무엇이 실패했나요? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.whatFailed}
              onChange={(e) => handleFieldChange('whatFailed', e.target.value)}
              placeholder="예: 마감 기한을 맞추지 못하고 프로젝트가 연기됨"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              왜 실패했나요? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.whyFailed}
              onChange={(e) => handleFieldChange('whyFailed', e.target.value)}
              placeholder="예: 팀원 간 역할 분담이 명확하지 않았고, 소통이 부족했음"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              감정적 영향
            </label>
            <textarea
              value={fields.emotionalImpact}
              onChange={(e) => handleFieldChange('emotionalImpact', e.target.value)}
              placeholder="예: 좌절감과 함께 팀원들에게 미안한 마음이 컸음"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="border-l-4 border-green-500 pl-4 mb-4">
        <h4 className="font-semibold text-green-700 mb-3">극복 과정</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전환점 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.turningPoint}
              onChange={(e) => handleFieldChange('turningPoint', e.target.value)}
              placeholder="예: 팀원들과 솔직한 대화를 나누며 문제점을 공유"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              극복을 위한 행동 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.actionTaken}
              onChange={(e) => handleFieldChange('actionTaken', e.target.value)}
              placeholder="예: 역할을 재분배하고, 매일 스탠드업 미팅을 도입하여 진행 상황 공유"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              결과 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.result}
              onChange={(e) => handleFieldChange('result', e.target.value)}
              placeholder="예: 2주 만에 프로젝트를 완료하고, 평가에서 좋은 성과를 거둠"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          배운 점 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.lessonLearned}
          onChange={(e) => handleFieldChange('lessonLearned', e.target.value)}
          placeholder="예: 명확한 역할 분담과 투명한 소통의 중요성을 깨달음"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          현재/미래 적용 방안 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.howApply}
          onChange={(e) => handleFieldChange('howApply', e.target.value)}
          placeholder="예: 현재는 프로젝트 초반에 명확한 목표와 역할을 설정하는 것을 우선시함"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>
    </div>
  );
};
