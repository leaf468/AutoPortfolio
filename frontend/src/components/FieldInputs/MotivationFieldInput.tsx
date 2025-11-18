import React from 'react';
import { MotivationFields } from '../../types/fieldBasedCoverLetter';

interface MotivationFieldInputProps {
  fields: MotivationFields;
  onChange: (fields: MotivationFields) => void;
}

export const MotivationFieldInput: React.FC<MotivationFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof MotivationFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">지원 동기 필드 입력</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회사명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            placeholder="예: 네이버"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            직무명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.position}
            onChange={(e) => handleFieldChange('position', e.target.value)}
            placeholder="예: 백엔드 개발자"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          언제 알게 되었나요? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.whenKnew}
          onChange={(e) => handleFieldChange('whenKnew', e.target.value)}
          placeholder="예: 대학교 2학년 때 기술 블로그를 통해"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          무엇이 매력적이었나요? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.whatAttracted}
          onChange={(e) => handleFieldChange('whatAttracted', e.target.value)}
          placeholder="예: 최신 기술 스택을 적극 도입하고, 개발자 친화적 문화를 가진 점"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          왜 이 회사/직무인가요? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.whyThis}
          onChange={(e) => handleFieldChange('whyThis', e.target.value)}
          placeholder="예: 저의 백엔드 개발 강점과 회사의 기술 지향적 방향성이 일치하기 때문"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          개인 목표는 무엇인가요? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.personalGoal}
          onChange={(e) => handleFieldChange('personalGoal', e.target.value)}
          placeholder="예: 대규모 트래픽을 처리하는 백엔드 전문가로 성장"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          회사와 목표의 연결점은? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.howAlign}
          onChange={(e) => handleFieldChange('howAlign', e.target.value)}
          placeholder="예: 회사의 대규모 서비스를 운영하며 실전 경험을 쌓고 싶음"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>
    </div>
  );
};
