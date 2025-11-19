import React from 'react';
import { VisionFields } from '../../types/fieldBasedCoverLetter';

interface VisionFieldInputProps {
  fields: VisionFields;
  onChange: (fields: VisionFields) => void;
}

export const VisionFieldInput: React.FC<VisionFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof VisionFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">입사 후 포부 필드 입력</h3>

      <div className="border-l-4 border-green-500 pl-4 mb-4">
        <h4 className="font-semibold text-green-700 mb-2">단기 목표 (6개월 - 1년)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목표 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fields.shortTermGoal}
              onChange={(e) => handleFieldChange('shortTermGoal', e.target.value)}
              placeholder="예: 입사 후 6개월 내 주요 서비스 코드베이스 완전 이해"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              실행 계획 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.shortTermAction}
              onChange={(e) => handleFieldChange('shortTermAction', e.target.value)}
              placeholder="예: 코드 리뷰 적극 참여 및 선배 개발자 멘토링 요청"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="border-l-4 border-blue-500 pl-4 mb-4">
        <h4 className="font-semibold text-blue-700 mb-2">중기 목표 (1-2년)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목표 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fields.mediumTermGoal}
              onChange={(e) => handleFieldChange('mediumTermGoal', e.target.value)}
              placeholder="예: 신규 기능 개발 리드 및 주도적 역할 수행"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              실행 계획 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.mediumTermAction}
              onChange={(e) => handleFieldChange('mediumTermAction', e.target.value)}
              placeholder="예: 프로젝트 매니지먼트 역량 강화 및 기술 리더십 발휘"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
            />
          </div>
        </div>
      </div>

      <div className="border-l-4 border-purple-500 pl-4 mb-4">
        <h4 className="font-semibold text-purple-700 mb-2">장기 비전 (3-5년)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비전 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fields.longTermVision}
              onChange={(e) => handleFieldChange('longTermVision', e.target.value)}
              placeholder="예: 기술 리더로 성장하여 팀을 이끌고 아키텍처 설계"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              실행 계획 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.longTermAction}
              onChange={(e) => handleFieldChange('longTermAction', e.target.value)}
              placeholder="예: 아키텍처 설계 능력 향상 및 후배 개발자 멘토링"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="border-l-4 border-orange-500 pl-4">
        <h4 className="font-semibold text-orange-700 mb-2">회사 기여 방안</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기여 방안 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.companyContribution}
              onChange={(e) => handleFieldChange('companyContribution', e.target.value)}
              placeholder="예: 백엔드 성능 최적화로 사용자 경험 개선"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구체적 가치 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fields.specificValue}
              onChange={(e) => handleFieldChange('specificValue', e.target.value)}
              placeholder="예: 트래픽 처리량 2배 증대, 서버 비용 30% 절감"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
