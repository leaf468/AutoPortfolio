import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentArrowUpIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TemplateUploadProps {
  onUpload: (template: string) => void;
}

const TemplateUpload: React.FC<TemplateUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [template, setTemplate] = useState('');
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        handleFile(file);
      } else {
        alert('마크다운 파일(.md)만 업로드 가능합니다.');
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTemplate(content);
      setPreview(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      setTemplate(pastedText);
      setPreview(pastedText.substring(0, 500) + (pastedText.length > 500 ? '...' : ''));
      setFileName('붙여넣기로 추가됨');
    }
  };

  const handleContinue = () => {
    if (template) {
      onUpload(template);
    }
  };

  const clearTemplate = () => {
    setTemplate('');
    setPreview('');
    setFileName('');
  };

  const defaultTemplates = [
    {
      name: '개발자 포트폴리오',
      content: `# {{name}}
## {{title}}

### 연락처
- 이메일: {{email}}
- GitHub: {{github}}
- LinkedIn: {{linkedin}}

### 소개
{{summary}}

### 경력사항
{{#experiences}}
#### {{company}} - {{position}}
*{{startDate}} ~ {{endDate}}*

{{description}}

**주요 성과:**
{{#achievements}}
- {{.}}
{{/achievements}}

**기술 스택:** {{technologies}}
{{/experiences}}

### 프로젝트
{{#projects}}
#### {{name}}
{{description}}

- **기술 스택:** {{technologies}}
- **GitHub:** {{githubUrl}}
- **라이브 데모:** {{url}}

**주요 성과:**
{{#highlights}}
- {{.}}
{{/highlights}}
{{/projects}}

### 기술 스택
{{#skills}}
#### {{category}}
{{items}}
{{/skills}}`
    },
    {
      name: '디자이너 포트폴리오',
      content: `# {{name}}
## {{title}}

### About Me
{{summary}}

### Contact
- Email: {{email}}
- Portfolio: {{website}}
- Behance: {{behance}}

### Work Experience
{{#experiences}}
#### {{company}} - {{position}}
*{{startDate}} ~ {{endDate}}*

{{description}}
{{/experiences}}

### Projects
{{#projects}}
#### {{name}}
{{description}}

![{{name}}]({{imageUrl}})

- **Role:** {{role}}
- **Tools:** {{tools}}
- **Live:** {{url}}
{{/projects}}`
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          포트폴리오 템플릿 업로드
        </h2>
        <p className="text-gray-600">
          기존 포트폴리오 템플릿을 업로드하거나 새로 만들어주세요. 
          템플릿은 마크다운 형식이어야 하며, {'{{변수명}}'} 형태로 채워질 부분을 표시하세요.
        </p>
      </div>

      {!template ? (
        <div>
          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
          >
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              마크다운 파일을 드래그하거나 붙여넣으세요
            </p>
            <p className="text-sm text-gray-500 mb-4">
              또는 아래 버튼을 클릭해서 파일을 선택하세요
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              파일 선택
              <input
                type="file"
                className="hidden"
                accept=".md,.markdown"
                onChange={handleFileInput}
              />
            </label>
          </div>

          {/* Default Templates */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              기본 템플릿 사용하기
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultTemplates.map((tmpl, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-400 cursor-pointer transition-colors"
                  onClick={() => {
                    setTemplate(tmpl.content);
                    setPreview(tmpl.content.substring(0, 500) + '...');
                    setFileName(tmpl.name);
                  }}
                >
                  <h4 className="font-medium text-gray-900 mb-2">{tmpl.name}</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded overflow-hidden">
                    {tmpl.content.substring(0, 200)}...
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Template Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-gray-900">{fileName}</span>
              </div>
              <button
                onClick={clearTemplate}
                className="text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-white border rounded p-3 max-h-60 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {preview}
              </pre>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              다음 단계로 →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TemplateUpload;