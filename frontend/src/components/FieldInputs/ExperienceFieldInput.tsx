import React from 'react';
import { ExperienceFields } from '../../types/fieldBasedCoverLetter';

interface ExperienceFieldInputProps {
  fields: ExperienceFields;
  onChange: (fields: ExperienceFields) => void;
}

export const ExperienceFieldInput: React.FC<ExperienceFieldInputProps> = ({ fields, onChange }) => {
  const handleFieldChange = (key: keyof ExperienceFields, value: any) => {
    onChange({ ...fields, [key]: value });
  };

  const handleTechAdd = (tech: string) => {
    if (tech.trim()) {
      onChange({ ...fields, technologies: [...fields.technologies, tech.trim()] });
    }
  };

  const handleTechRemove = (index: number) => {
    onChange({
      ...fields,
      technologies: fields.technologies.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">경험/프로젝트 필드 입력</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            프로젝트명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.projectName}
            onChange={(e) => handleFieldChange('projectName', e.target.value)}
            placeholder="예: 실시간 채팅 서비스 구축"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            기간 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.period}
            onChange={(e) => handleFieldChange('period', e.target.value)}
            placeholder="예: 2023.03 - 2023.06 (3개월)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            팀 규모
          </label>
          <input
            type="text"
            value={fields.teamSize}
            onChange={(e) => handleFieldChange('teamSize', e.target.value)}
            placeholder="예: 4명"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            본인 역할 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.myRole}
            onChange={(e) => handleFieldChange('myRole', e.target.value)}
            placeholder="예: 백엔드 개발 및 DB 설계"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          사용 기술/도구 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {fields.technologies.map((tech, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
            >
              {tech}
              <button
                onClick={() => handleTechRemove(index)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="기술 입력 후 Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleTechAdd(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          해결하려던 문제 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.problem}
          onChange={(e) => handleFieldChange('problem', e.target.value)}
          placeholder="예: 기존 시스템의 느린 응답 속도와 확장성 문제"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          해결 방법 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.solution}
          onChange={(e) => handleFieldChange('solution', e.target.value)}
          placeholder="예: WebSocket 도입 및 Redis 캐싱을 통한 성능 최적화"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          성과 (수치 포함) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.achievementMetric}
          onChange={(e) => handleFieldChange('achievementMetric', e.target.value)}
          placeholder="예: 응답 속도 70% 개선, 동시 접속자 500명 처리"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          어려웠던 점
        </label>
        <textarea
          value={fields.difficulty}
          onChange={(e) => handleFieldChange('difficulty', e.target.value)}
          placeholder="예: 동시성 제어 및 메모리 최적화"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          극복 방법
        </label>
        <textarea
          value={fields.howOvercome}
          onChange={(e) => handleFieldChange('howOvercome', e.target.value)}
          placeholder="예: 이벤트 루프 원리 학습 및 성능 테스트 반복"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          배운 점 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={fields.lesson}
          onChange={(e) => handleFieldChange('lesson', e.target.value)}
          placeholder="예: 비동기 프로그래밍의 중요성과 성능 최적화 방법론"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
      </div>

      <div className="border-t border-gray-300 pt-4 mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          추가 경험 및 스토리 연결 (선택)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          여러 프로젝트/활동을 함께 서술하고 싶다면, 추가 경험과 연결 스토리를 작성하세요.
        </p>
        <textarea
          value={fields.additionalExperience || ''}
          onChange={(e) => handleFieldChange('additionalExperience', e.target.value)}
          placeholder="예: 이후 OO 프로젝트에서는 위 경험을 바탕으로 마이크로서비스 아키텍처를 설계했고, 이를 통해..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-350"
        />
        <p className="text-xs text-gray-500 mt-2">
          💡 여러 경험의 연관성과 성장 과정을 보여주면 더 설득력 있는 답변이 됩니다.
        </p>
      </div>
    </div>
  );
};
