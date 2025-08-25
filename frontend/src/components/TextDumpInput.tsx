import React, { useState } from 'react';
import { 
  PaperAirplaneIcon,
  LightBulbIcon,
  ClipboardDocumentIcon 
} from '@heroicons/react/24/outline';

interface TextDumpInputProps {
  template: string;
  onSubmit: (rawText: string) => void;
}

const TextDumpInput: React.FC<TextDumpInputProps> = ({ template, onSubmit }) => {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rawText.trim()) return;
    
    setIsLoading(true);
    // 간단한 지연 후 다음 단계로
    setTimeout(() => {
      onSubmit(rawText);
      setIsLoading(false);
    }, 1000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawText(text);
    } catch (err) {
      console.error('클립보드 읽기 실패:', err);
    }
  };

  const exampleTexts = [
    "김철수입니다. 3년차 프론트엔드 개발자고요. React, TypeScript 주로 사용합니다. 삼성에서 2년, 카카오에서 1년 일했어요. 주요 프로젝트는 쇼핑몰 웹사이트 개발했고 사용자가 월 100만명 정도 됩니다. GitHub에 여러 개인 프로젝트 올려뒀고, 부트캠프에서 강의도 하고 있어요.",
    
    "UX/UI 디자이너 박영희입니다. 5년 경력이고 스타트업 3곳에서 일했습니다. Figma, Sketch, Adobe 툴들 다 사용해요. 모바일 앱 디자인 전문이고 지금까지 15개 앱 런칭했습니다. 사용자 리서치부터 프로토타이핑까지 전 과정 담당해봤고요. 최근에는 디자인 시스템 구축 프로젝트 리드했어요.",
    
    "백엔드 개발자 이민수. Python, Django 메인으로 하고 AWS 인프라 구축도 해요. 네이버에서 3년, 쿠팡에서 2년 근무했습니다. 대용량 트래픽 처리 경험 많고, 마이크로서비스 아키텍처 설계해본 적 있어요. 오픈소스 기여도 활발히 하고 있고 기술 블로그 운영 중입니다."
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          자유롭게 정보를 입력해주세요
        </h2>
        <p className="text-gray-600">
          경력, 프로젝트, 기술스택 등 포트폴리오에 들어갈 모든 정보를 자유로운 형식으로 입력하세요. 
          AI가 분석하여 적절한 위치에 배치해드립니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* Example Texts */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2" />
            <span className="font-medium text-blue-900">입력 예시</span>
          </div>
          <div className="space-y-2">
            {exampleTexts.map((example, index) => (
              <div
                key={index}
                className="bg-white rounded p-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setRawText(example)}
              >
                "{example}"
              </div>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="예: 안녕하세요, 김철수입니다. 3년차 프론트엔드 개발자고요. React와 TypeScript를 주로 사용합니다. 삼성에서 2년, 카카오에서 1년 일했어요..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
          />
          
          {/* Paste Button */}
          <button
            onClick={handlePaste}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="클립보드에서 붙여넣기"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Character Count */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{rawText.length} 글자</span>
          <span>최소 50글자 이상 입력해주세요</span>
        </div>

        {/* Template Variables Preview */}
        {template && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              템플릿에서 찾을 정보들:
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(template.matchAll(/\{\{(\w+)\}\}/g)).map(([, variable], index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                >
                  {variable}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={rawText.trim().length < 50 || isLoading}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                분석 중...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                AI 분석 시작하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextDumpInput;