import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import EnhancedPortfolioEditor from '../components/EnhancedPortfolioEditor';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PortfolioDocument } from '../services/autoFillService';
import { GenerationResult } from '../services/oneClickGenerator';

export default function EnhancedEditPage() {
  const navigate = useNavigate();
  const { state, setFinalResult, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('enhanced-edit');

    // 필수 데이터가 없으면 이전 단계로 이동
    if (!state.selectedTemplate || !state.initialResult) {
      if (!state.selectedTemplate) {
        navigate('/template');
      } else if (!state.organizedContent) {
        navigate('/organize');
      } else if (!state.initialResult) {
        navigate('/autofill');
      }
      return;
    }
  }, []);

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
        template: state.selectedTemplate || 'james'
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

  if (!state.initialResult) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
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

  return (
    <MainLayout>
      <EnhancedPortfolioEditor
        document={parsedDocument}
        selectedTemplate={state.selectedTemplate || 'james'}
        onSave={handleSave}
        onBack={handleBack}
        onSkipToNaturalEdit={handleSkipToNaturalEdit}
      />
    </MainLayout>
  );
}