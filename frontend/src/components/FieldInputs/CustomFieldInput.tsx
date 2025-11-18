import React from 'react';
import { CustomFieldDefinition } from '../../services/customQuestionAnalyzer';

interface CustomFieldInputProps {
  fields: Record<string, string>;
  fieldDefinitions: CustomFieldDefinition[];
  onChange: (fields: Record<string, string>) => void;
}

export const CustomFieldInput: React.FC<CustomFieldInputProps> = ({
  fields,
  fieldDefinitions,
  onChange,
}) => {
  const handleFieldChange = (key: string, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">필드 입력</h3>

      {fieldDefinitions.map((fieldDef) => (
        <div key={fieldDef.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldDef.label} {fieldDef.required && <span className="text-red-500">*</span>}
          </label>
          {fieldDef.type === 'textarea' ? (
            <textarea
              value={fields[fieldDef.key] || ''}
              onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
              placeholder={fieldDef.placeholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <input
              type="text"
              value={fields[fieldDef.key] || ''}
              onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
              placeholder={fieldDef.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>
      ))}
    </div>
  );
};
