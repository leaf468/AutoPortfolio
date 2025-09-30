import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SimpleNaturalLanguageEditor from '../components/SimpleNaturalLanguageEditor';
import { usePortfolio } from '../contexts/PortfolioContext';
import { GenerationResult } from '../services/oneClickGenerator';
import { FeedbackResult } from '../services/userFeedbackService';

export default function FeedbackEditPage() {
  const navigate = useNavigate();
  const { state, setFeedbackResult, setFinalResult, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('feedback');

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

  const handleComplete = (result: GenerationResult) => {
    // 자연어 편집 결과를 FeedbackResult 형태로 변환
    const feedbackResult: FeedbackResult = {
      revisedContent: result.content,
      changesApplied: result.suggestions || []
    };
    setFeedbackResult(feedbackResult);
    setFinalResult(result);
    setCurrentStep('complete');
    navigate('/complete');
  };

  const handleBack = () => {
    setCurrentStep('enhanced-edit');
    navigate('/edit');
  };

  if (!state.initialResult) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <MainLayout>
      <SimpleNaturalLanguageEditor
        initialResult={state.initialResult}
        selectedTemplate={state.selectedTemplate || 'minimal'}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </MainLayout>
  );
}