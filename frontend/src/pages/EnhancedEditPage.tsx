import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import EnhancedPortfolioEditor from '../components/EnhancedPortfolioEditor';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PortfolioDocument } from '../services/autoFillService';
import { GenerationResult } from '../services/oneClickGenerator';

export default function EnhancedEditPage() {
  const navigate = useNavigate();
  const { state, setFinalResult, setCurrentStep, setTemplate } = usePortfolio();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    // This is a legacy route - immediately redirect to template-specific edit page
    if (state.selectedTemplate && state.initialResult) {
      hasRedirected.current = true;
      navigate(`/edit/${state.selectedTemplate}`, { replace: true });
      return;
    }

    // Check required data and redirect if missing
    if (!state.selectedTemplate) {
      hasRedirected.current = true;
      navigate('/template', { replace: true });
      return;
    }

    if (!state.organizedContent) {
      hasRedirected.current = true;
      navigate('/organize', { replace: true });
      return;
    }

    if (!state.initialResult) {
      hasRedirected.current = true;
      navigate('/autofill', { replace: true });
      return;
    }

    setCurrentStep('enhanced-edit');
  }, []); // Run only once on mount

  const handleSave = (document: PortfolioDocument) => {
    // Convert PortfolioDocument back to GenerationResult format
    const result: GenerationResult = {
      id: document.doc_id,
      content: JSON.stringify(document),
      format: 'json',
      metadata: {
        wordCount: document.sections.reduce((acc, s) =>
          acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
        ),
        estimatedReadTime: Math.ceil(
          document.sections.reduce((acc, s) =>
            acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
          ) / 200
        ),
        generatedAt: new Date(),
        template: state.selectedTemplate || 'minimal'
      },
      qualityScore: 90,
      suggestions: ['상세 편집 완료']
    };
    setFinalResult(result);
    setCurrentStep('complete');
    navigate('/complete');
  };

  const handleBack = () => {
    setCurrentStep('autofill');
    navigate('/autofill');
  };

  const handleSkipToNaturalEdit = () => {
    setCurrentStep('feedback');
    navigate('/feedback');
  };

  const handleTemplateChange = (template: 'minimal' | 'clean' | 'colorful' | 'elegant') => {
    // 새 템플릿 저장
    setTemplate(template);
    // autofill 단계로 이동하여 로딩 화면과 함께 데이터 재가공
    setCurrentStep('autofill');
    navigate('/autofill');
  };

  // Show loading during redirect (but only briefly)
  if (!state.initialResult || !state.selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <p className="text-gray-600">편집 페이지로 리디렉션 중...</p>
        </div>
      </div>
    );
  }

  let parsedDocument;
  try {
    parsedDocument = JSON.parse(state.initialResult.content);
  } catch (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">문서 파싱 오류가 발생했습니다. 이전 단계로 돌아가세요.</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              이전 단계로
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <EnhancedPortfolioEditor
        document={parsedDocument}
        selectedTemplate={state.selectedTemplate || 'minimal'}
        onSave={handleSave}
        onBack={handleBack}
        onSkipToNaturalEdit={handleSkipToNaturalEdit}
        onTemplateChange={handleTemplateChange}
      />
    </MainLayout>
  );
}