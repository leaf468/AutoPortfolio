import React from 'react';
import { GrowthFields } from '../../types/fieldBasedCoverLetter';

interface GrowthFieldInputProps {
  fields: GrowthFields;
  onChange: (fields: GrowthFields) => void;
}

export const GrowthFieldInput: React.FC<GrowthFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof GrowthFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🌱 성장 과정 필드 입력</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          성장 배경 요약 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.backgroundSummary}
          onChange={(e) => handleFieldChange('backgroundSummary', e.target.value)}
          placeholder="예: 평범한 가정에서 자랐으나, 부모님의 교육열과 자립심을 강조하는 분위기 속에서 성장"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-semibold text-blue-700 mb-3">핵심 사건</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              핵심 사건 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fields.keyEvent}
              onChange={(e) => handleFieldChange('keyEvent', e.target.value)}
              placeholder="예: 고등학교 때 봉사 활동 참여"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              언제 발생했나요? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fields.whenOccurred}
              onChange={(e) => handleFieldChange('whenOccurred', e.target.value)}
              placeholder="예: 고등학교 2학년 여름방학"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              무슨 일이 있었나요? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.whatHappened}
              onChange={(e) => handleFieldChange('whatHappened', e.target.value)}
              placeholder="예: 지역 복지관에서 소외 계층 어르신들을 대상으로 IT 교육 봉사 진행"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              어떤 영향을 받았나요? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.howInfluenced}
              onChange={(e) => handleFieldChange('howInfluenced', e.target.value)}
              placeholder="예: 기술이 사람들의 삶을 개선할 수 있다는 것을 깨달음"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          현재에 미친 영향 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.currentImpact}
          onChange={(e) => handleFieldChange('currentImpact', e.target.value)}
          placeholder="예: 사회적 가치를 창출하는 기술 개발에 관심을 갖게 됨"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          형성된 가치관 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.relatedValue}
          onChange={(e) => handleFieldChange('relatedValue', e.target.value)}
          placeholder="예: 기술은 모두를 위한 것이어야 하며, 소외된 이들을 돕는 수단이 되어야 한다"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>
    </div>
  );
};
