import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckCircleIcon,
  CheckIcon,
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
  oneClickGenerator, 
  GenerationOptions, 
  GenerationResult
} from '../services/oneClickGenerator';
import { OrganizedContent } from '../services/aiOrganizer';
import { BoostResult } from '../services/interactiveBooster';

interface OneClickGeneratorProps {
  enhancedContent: OrganizedContent;
  boostResult?: BoostResult;
  template?: string;
  onComplete: (result: GenerationResult) => void;
}

const OneClickGenerator: React.FC<OneClickGeneratorProps> = ({ 
  enhancedContent, 
  boostResult,
  template,
  onComplete 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern-dev');
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    templateId: 'modern-dev',
    format: 'html',
    sections: ['all'],
    length: 'standard',
    tone: 'professional'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [customStyles, setCustomStyles] = useState({
    primaryColor: '#0168FF',
    secondaryColor: '#00D9FF',
    font: 'Segoe UI'
  });

  const templates = oneClickGenerator.getTemplates();

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setGenerationOptions(prev => ({ ...prev, templateId }));
    
    // 미리보기 생성
    if (enhancedContent) {
      const preview = await oneClickGenerator.generatePreview(enhancedContent, templateId);
      setPreviewContent(preview);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const options: GenerationOptions = {
        ...generationOptions,
        customStyles
      };

      console.log('Generating portfolio with options:', options);
      console.log('Enhanced content:', enhancedContent);
      
      const generationResult = await oneClickGenerator.generatePortfolio(enhancedContent, options, template);
      console.log('Generation result:', generationResult);
      
      setResult(generationResult);
      onComplete(generationResult);
    } catch (error) {
      console.error('포트폴리오 생성 오류:', error);
      alert(`포트폴리오 생성 중 오류가 발생했습니다: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (!previewContent) {
      const preview = await oneClickGenerator.generatePreview(enhancedContent, selectedTemplate);
      setPreviewContent(preview);
    }
    setShowPreview(!showPreview);
  };

  const handleDownload = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = `portfolio-${result.id}.${result.format}`;
      link.click();
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">포트폴리오 생성 완료!</h2>
          </div>
        </motion.div>

        {/* 품질 점수 및 통계 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
              <span className="text-lg font-semibold">품질 점수</span>
            </div>
            <div className={`px-4 py-2 rounded-full text-lg font-bold ${getQualityColor(result.qualityScore)}`}>
              {result.qualityScore}/100
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{result.metadata.wordCount}</div>
              <div className="text-sm text-gray-600">단어 수</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.metadata.estimatedReadTime}</div>
              <div className="text-sm text-gray-600">예상 읽기시간 (분)</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.metadata.template}</div>
              <div className="text-sm text-gray-600">템플릿</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{result.format.toUpperCase()}</div>
              <div className="text-sm text-gray-600">형식</div>
            </div>
          </div>
        </div>

        {/* 개선 제안 */}
        {result.suggestions.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-purple-900 mb-3">💡 추가 개선 제안</h3>
            <ul className="list-disc list-inside space-y-1 text-purple-800">
              {result.suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 부스트 결과 표시 */}
        {boostResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">🚀 대화형 보강 효과</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+{boostResult.improvementScore}</div>
                <div className="text-sm text-green-700">개선 점수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{boostResult.qualityMetrics.completeness}</div>
                <div className="text-sm text-green-700">완성도</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{boostResult.qualityMetrics.specificity}</div>
                <div className="text-sm text-green-700">구체성</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{boostResult.qualityMetrics.atsScore}</div>
                <div className="text-sm text-green-700">ATS 점수</div>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex space-x-4">
          <button
            onClick={handlePreview}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <EyeIcon className="w-5 h-5 mr-2" />
            미리보기
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            다운로드
          </button>
        </div>

        {/* 미리보기 모달 */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">포트폴리오 미리보기</h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div 
                    dangerouslySetInnerHTML={{ __html: result.content }}
                    className="portfolio-preview"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center items-center mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600 mr-2" />
          <h2 className="text-3xl font-bold text-gray-900">원클릭 완성</h2>
        </div>
        <p className="text-lg text-gray-600">
          AI가 최적화된 포트폴리오를 다양한 형식으로 생성합니다
        </p>
      </motion.div>

      {/* 템플릿 선택 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">템플릿 선택</h3>
        
        {/* 업로드된 커스텀 템플릿 표시 */}
        {template && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">사용자 정의 템플릿이 업로드되었습니다</span>
            </div>
            <div className="text-sm text-green-700 bg-white p-3 rounded border max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{template.substring(0, 200)}...</pre>
            </div>
            <p className="text-xs text-green-600 mt-2">
              이 템플릿이 최종 포트폴리오 생성에 사용됩니다.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleTemplateSelect(tmpl.id)}
              className={`p-6 border-2 rounded-lg text-left transition-colors ${
                selectedTemplate === tmpl.id
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-600" />
                <h4 className="font-semibold">{tmpl.name}</h4>
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {tmpl.targetAudience}
                </span>
              </div>
              <p className="text-sm text-gray-600">{tmpl.description}</p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className="mr-3">형식: {tmpl.format.toUpperCase()}</span>
                <span>카테고리: {tmpl.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 생성 옵션 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">생성 옵션</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 형식 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              출력 형식
            </label>
            <select
              value={generationOptions.format}
              onChange={(e) => setGenerationOptions(prev => ({ 
                ...prev, 
                format: e.target.value as any 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="html">HTML (웹페이지)</option>
              <option value="markdown">Markdown</option>
              <option value="notion-json">Notion JSON</option>
            </select>
          </div>

          {/* 길이 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 정도
            </label>
            <select
              value={generationOptions.length}
              onChange={(e) => setGenerationOptions(prev => ({ 
                ...prev, 
                length: e.target.value as any 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="concise">간결형</option>
              <option value="standard">표준형</option>
              <option value="detailed">상세형</option>
            </select>
          </div>

          {/* 톤 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              작성 톤
            </label>
            <select
              value={generationOptions.tone}
              onChange={(e) => setGenerationOptions(prev => ({ 
                ...prev, 
                tone: e.target.value as any 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="professional">전문적</option>
              <option value="creative">창의적</option>
              <option value="technical">기술적</option>
              <option value="friendly">친근한</option>
            </select>
          </div>

          {/* 색상 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 색상
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={customStyles.primaryColor}
                onChange={(e) => setCustomStyles(prev => ({ 
                  ...prev, 
                  primaryColor: e.target.value 
                }))}
                className="w-12 h-12 border border-gray-300 rounded"
              />
              <input
                type="color"
                value={customStyles.secondaryColor}
                onChange={(e) => setCustomStyles(prev => ({ 
                  ...prev, 
                  secondaryColor: e.target.value 
                }))}
                className="w-12 h-12 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex space-x-4">
        <button
          onClick={handlePreview}
          disabled={isGenerating}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <EyeIcon className="w-5 h-5 mr-2" />
          미리보기
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              생성 중...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              포트폴리오 생성
            </>
          )}
        </button>
      </div>

      {/* 미리보기 모달 */}
      <AnimatePresence>
        {showPreview && previewContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">포트폴리오 미리보기</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                  className="portfolio-preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 정보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        💡 팁: 대화형 보강을 통해 더 많은 정보를 제공할수록 더 완성도 높은 포트폴리오가 생성됩니다
      </div>
    </div>
  );
};

export default OneClickGenerator;