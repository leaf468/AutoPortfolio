import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AIOrganizer from '../components/AIOrganizer';
import { usePortfolio } from '../contexts/PortfolioContext';
import { OrganizedContent } from '../services/aiOrganizer';

export default function OrganizeContentPage() {
  const navigate = useNavigate();
  const { state, setOrganizedContent, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('organize');

    // 템플릿이 선택되지 않았으면 템플릿 선택 페이지로 이동
    if (!state.selectedTemplate) {
      navigate('/template');
      return;
    }
  }, []);

  const handleOrganizeComplete = (content: OrganizedContent) => {
    setOrganizedContent(content);
    setCurrentStep('autofill');
    navigate('/autofill');
  };

  if (!state.selectedTemplate) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <MainLayout>
      <AIOrganizer onComplete={handleOrganizeComplete} />
    </MainLayout>
  );
}