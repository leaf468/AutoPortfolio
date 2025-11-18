import React from 'react';
import { TeamworkFields } from '../../types/fieldBasedCoverLetter';

interface TeamworkFieldInputProps {
  fields: TeamworkFields;
  onChange: (fields: TeamworkFields) => void;
}

export const TeamworkFieldInput: React.FC<TeamworkFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof TeamworkFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🤝 협업/리더십 필드 입력</h3>

      <div className="border-l-4 border-purple-500 pl-4 mb-4">
        <h4 className="font-semibold text-purple-700 mb-3">프로젝트 배경</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트 배경 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.projectContext}
              onChange={(e) => handleFieldChange('projectContext', e.target.value)}
              placeholder="예: 학교 축제 웹사이트 개발 프로젝트"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                팀 규모 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fields.teamSize}
                onChange={(e) => handleFieldChange('teamSize', e.target.value)}
                placeholder="예: 5명"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                본인의 역할 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fields.myRole}
                onChange={(e) => handleFieldChange('myRole', e.target.value)}
                placeholder="예: 프론트엔드 개발 및 팀장"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-l-4 border-orange-500 pl-4 mb-4">
        <h4 className="font-semibold text-orange-700 mb-3">어려움/갈등</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              어려움/갈등 상황 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.challenge}
              onChange={(e) => handleFieldChange('challenge', e.target.value)}
              placeholder="예: 팀원 간 기술 스택 선택에 대한 의견 충돌"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              왜 어려웠나요? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.whyDifficult}
              onChange={(e) => handleFieldChange('whyDifficult', e.target.value)}
              placeholder="예: 각자 선호하는 기술이 달라 합의점을 찾기 어려웠음"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="border-l-4 border-green-500 pl-4 mb-4">
        <h4 className="font-semibold text-green-700 mb-3">해결 과정</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              해결 접근법 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.approach}
              onChange={(e) => handleFieldChange('approach', e.target.value)}
              placeholder="예: 각 기술의 장단점을 분석하고, 프로젝트 목표에 맞는 선택 기준 수립"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              소통 방식 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fields.communicationMethod}
              onChange={(e) => handleFieldChange('communicationMethod', e.target.value)}
              placeholder="예: 정기 회의를 통해 의견을 공유하고, 투표로 결정"
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
              placeholder="예: 팀원 모두가 납득할 수 있는 기술 스택을 선정하고, 성공적으로 프로젝트 완료"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          팀원 피드백
        </label>
        <textarea
          value={fields.teamFeedback}
          onChange={(e) => handleFieldChange('teamFeedback', e.target.value)}
          placeholder="예: 팀원들로부터 '공정한 리더십'과 '적극적인 소통'에 대한 긍정적 피드백"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          협업에 대한 배움 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.lessonsOnTeamwork}
          onChange={(e) => handleFieldChange('lessonsOnTeamwork', e.target.value)}
          placeholder="예: 다양한 의견을 존중하면서도 목표를 향해 나아가는 균형의 중요성"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>
    </div>
  );
};
