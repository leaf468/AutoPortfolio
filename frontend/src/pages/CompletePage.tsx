import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import FinalResultPanel from '../components/FinalResultPanel';
import { usePortfolio } from '../contexts/PortfolioContext';

export default function CompletePage() {
  const navigate = useNavigate();
  const { state, reset, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('complete');

    // 최종 결과가 없으면 처음부터 시작
    if (!state.finalResult) {
      navigate('/template');
      return;
    }
  }, []);

  const handleReset = () => {
    reset();
    navigate('/');
  };

  if (!state.finalResult) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <MainLayout showProgress={false}>
      <FinalResultPanel
        finalResult={state.finalResult}
        boostResult={undefined}
        feedbackResult={state.feedbackResult || undefined}
        selectedTemplate={state.selectedTemplate || 'james'}
        onReset={handleReset}
      />
    </MainLayout>
  );
}