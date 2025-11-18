import React from 'react';
import { StrengthFields } from '../../types/fieldBasedCoverLetter';

interface StrengthFieldInputProps {
  fields: StrengthFields;
  onChange: (fields: StrengthFields) => void;
}

export const StrengthFieldInput: React.FC<StrengthFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof StrengthFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">강점/역량 필드 입력</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          핵심 강점 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.mainStrength}
          onChange={(e) => handleFieldChange('mainStrength', e.target.value)}
          placeholder="예: 빠른 문제 해결 능력"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          왜 이것이 강점인가요? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.whyStrength}
          onChange={(e) => handleFieldChange('whyStrength', e.target.value)}
          placeholder="예: 복잡한 버그를 분석하고 근본 원인을 빠르게 찾는 데 능숙합니다"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          언제 발휘했나요? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.when}
          onChange={(e) => handleFieldChange('when', e.target.value)}
          placeholder="예: 프로젝트 마감 1주일 전"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          상황 설명 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.situation}
          onChange={(e) => handleFieldChange('situation', e.target.value)}
          placeholder="예: 서버 다운 이슈가 발생하여 서비스 중단 위기"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          어떤 행동을 했나요? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.action}
          onChange={(e) => handleFieldChange('action', e.target.value)}
          placeholder="예: 로그 분석 및 메모리 누수 원인 파악, 코드 수정"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          결과 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.result}
          onChange={(e) => handleFieldChange('result', e.target.value)}
          placeholder="예: 2시간 만에 해결, 서비스 정상화"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          피드백/인정
        </label>
        <input
          type="text"
          value={fields.feedback}
          onChange={(e) => handleFieldChange('feedback', e.target.value)}
          placeholder="예: 팀장에게 문제 해결 능력을 인정받음"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          직무와의 연관성 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.relevance}
          onChange={(e) => handleFieldChange('relevance', e.target.value)}
          placeholder="예: 백엔드 개발자로서 서비스 안정성 확보에 기여 가능"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div className="border-t border-gray-300 pt-4 mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          추가 강점 및 스토리 연결 (선택)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          여러 강점을 함께 서술하거나, 다른 사례를 추가하고 싶다면 작성하세요.
        </p>
        <textarea
          value={fields.additionalStrengths || ''}
          onChange={(e) => handleFieldChange('additionalStrengths', e.target.value)}
          placeholder="예: 또한 저는 빠른 학습 능력도 갖추고 있습니다. 신기술 도입이 필요한 OO 프로젝트에서..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
        <p className="text-xs text-gray-500 mt-2">
          💡 여러 강점의 연관성을 보여주면 더 입체적인 인상을 줄 수 있습니다.
        </p>
      </div>
    </div>
  );
};
