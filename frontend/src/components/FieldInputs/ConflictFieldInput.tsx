import React from 'react';
import { ConflictFields } from '../../types/fieldBasedCoverLetter';

interface ConflictFieldInputProps {
  fields: ConflictFields;
  onChange: (fields: ConflictFields) => void;
}

export const ConflictFieldInput: React.FC<ConflictFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof ConflictFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">갈등 해결 필드 입력</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          갈등 상황 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.situation}
          onChange={(e) => handleFieldChange('situation', e.target.value)}
          placeholder="예: 팀 프로젝트에서 개발 방향성에 대한 의견 차이"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            갈등 당사자들 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.parties}
            onChange={(e) => handleFieldChange('parties', e.target.value)}
            placeholder="예: 나, 팀원 2명"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            갈등 원인 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.cause}
            onChange={(e) => handleFieldChange('cause', e.target.value)}
            placeholder="예: 기술 선택에 대한 우선순위 차이"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            나의 입장 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fields.myPosition}
            onChange={(e) => handleFieldChange('myPosition', e.target.value)}
            placeholder="예: 장기적 유지보수를 위해 검증된 기술 스택 사용"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상대방의 입장 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fields.otherPosition}
            onChange={(e) => handleFieldChange('otherPosition', e.target.value)}
            placeholder="예: 최신 기술 도입으로 개발 경험 향상"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          해결 접근 방법 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.approachTaken}
          onChange={(e) => handleFieldChange('approachTaken', e.target.value)}
          placeholder="예: 각 기술 스택의 장단점을 데이터로 정리하여 비교"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          소통 과정 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.communication}
          onChange={(e) => handleFieldChange('communication', e.target.value)}
          placeholder="예: 정기 미팅을 통해 서로의 우려사항 공유 및 논의"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          타협점/해결책 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.compromise}
          onChange={(e) => handleFieldChange('compromise', e.target.value)}
          placeholder="예: 핵심 기능은 검증된 기술, 부가 기능은 새로운 기술 사용"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          결과 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.outcome}
          onChange={(e) => handleFieldChange('outcome', e.target.value)}
          placeholder="예: 프로젝트 성공적으로 완료, 팀원 간 신뢰 강화"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          배운 점
        </label>
        <textarea
          value={fields.lessonsLearned}
          onChange={(e) => handleFieldChange('lessonsLearned', e.target.value)}
          placeholder="예: 데이터 기반 의사결정과 상호 존중의 중요성"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-350"
        />
      </div>
    </div>
  );
};
