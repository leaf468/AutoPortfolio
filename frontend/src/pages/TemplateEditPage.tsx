import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PortfolioDocument } from '../services/autoFillService';
import { GenerationResult } from '../services/oneClickGenerator';
import MinimalEditor from '../components/editors/MinimalEditor';
import CleanEditor from '../components/editors/CleanEditor';
import ColorfulEditor from '../components/editors/ColorfulEditor';
import ElegantEditor from '../components/editors/ElegantEditor';

type TemplateType = 'minimal' | 'clean' | 'colorful' | 'elegant';

export default function TemplateEditPage() {
  const navigate = useNavigate();
  const { template } = useParams<{ template: TemplateType }>();
  const { state, setFinalResult, setCurrentStep, setTemplate } = usePortfolio();
  const [isValidated, setIsValidated] = useState(false);
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initializationRef.current) return;
    initializationRef.current = true;

    console.log('🔍 TemplateEditPage Initialization Debug:');
    console.log('  - URL template param:', template);
    console.log('  - Context selectedTemplate:', state.selectedTemplate);
    console.log('  - Current step:', state.currentStep);

    // Validate template parameter first
    const validTemplates = ['minimal', 'clean', 'colorful', 'elegant'];
    if (!template || !validTemplates.includes(template)) {
      console.log('❌ Invalid template, redirecting to /template');
      navigate('/template', { replace: true });
      return;
    }

    // Check required data
    if (!state.initialResult) {
      console.log('❌ No initialResult, checking other conditions...');
      if (!state.selectedTemplate) {
        console.log('❌ No selectedTemplate, redirecting to /template');
        navigate('/template', { replace: true });
      } else if (!state.organizedContent) {
        console.log('❌ No organizedContent, redirecting to /organize');
        navigate('/organize', { replace: true });
      } else {
        console.log('❌ Missing data, redirecting to /autofill');
        navigate('/autofill', { replace: true });
      }
      return;
    }

    // Set current step and sync template only once
    setCurrentStep('enhanced-edit');
    if (template !== state.selectedTemplate) {
      console.log(`🔄 Template mismatch: URL(${template}) !== Context(${state.selectedTemplate}), updating context`);
      setTemplate(template);
    } else {
      console.log(`✅ Template match: URL(${template}) === Context(${state.selectedTemplate})`);
    }

    setIsValidated(true);
    console.log('✅ TemplateEditPage initialized successfully');
  }, []); // Empty dependency array to run only once

  // Separate effect to handle template changes from URL
  useEffect(() => {
    if (isValidated && template && template !== state.selectedTemplate) {
      console.log(`🔄 URL Template Change: ${template} !== ${state.selectedTemplate}, updating context`);
      setTemplate(template);
    }
  }, [template, isValidated, state.selectedTemplate, setTemplate]);

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
        template: template || 'minimal'
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

  const handleTemplateChange = (newTemplate: TemplateType) => {
    // 새 템플릿으로 라우팅
    navigate(`/edit/${newTemplate}`);
  };

  // Show loading only when not validated yet
  if (!isValidated || !template || !state.initialResult) {
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
          <p className="text-gray-600">페이지를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  let parsedDocument;
  try {
    parsedDocument = JSON.parse(state.initialResult.content);
  } catch (error) {
    console.error('Failed to parse initialResult.content:', error);
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

  // 템플릿별 편집기 컴포넌트 선택
  const getEditorComponent = () => {
    const commonProps = {
      document: parsedDocument,
      selectedTemplate: template,
      onSave: handleSave,
      onBack: handleBack,
      onTemplateChange: handleTemplateChange
    };

    console.log('🎯 Getting Editor Component:');
    console.log('  - template param:', template);
    console.log('  - selectedTemplate prop:', commonProps.selectedTemplate);
    console.log('  - parsedDocument present:', !!parsedDocument);

    switch (template) {
      case 'minimal':
        console.log('📝 Rendering MinimalEditor');
        return <MinimalEditor {...commonProps} />;
      case 'clean':
        console.log('📝 Rendering CleanEditor');
        return <CleanEditor {...commonProps} />;
      case 'colorful':
        console.log('📝 Rendering ColorfulEditor');
        return <ColorfulEditor {...commonProps} />;
      case 'elegant':
        console.log('📝 Rendering ElegantEditor');
        return <ElegantEditor {...commonProps} />;
      default:
        console.log('📝 Rendering default MinimalEditor (fallback)');
        return <MinimalEditor {...commonProps} />;
    }
  };

  return (
    <MainLayout>
      {getEditorComponent()}
    </MainLayout>
  );
}