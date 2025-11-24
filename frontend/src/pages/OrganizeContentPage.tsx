import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AIOrganizer from '../components/AIOrganizer';
import { usePortfolio } from '../contexts/PortfolioContext';
import { OrganizedContent } from '../services/aiOrganizer';
import { trackButtonClick } from '../utils/analytics';

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

  // AI 조직화 완료 후 AutoFill 페이지로 이동하는 함수
  const handleOrganizeComplete = useCallback(async (content: OrganizedContent) => {
    trackButtonClick('AI 조직화 완료', 'OrganizeContentPage');

    // 조직화된 내용 저장
    setOrganizedContent(content);

    // AutoFill 단계로 이동 (로딩 화면 표시를 위해)
    setCurrentStep('autofill');
    navigate('/autofill');
  }, [navigate, setOrganizedContent, setCurrentStep]);

  if (!state.selectedTemplate) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <MainLayout>
      <AIOrganizer onComplete={handleOrganizeComplete} />
    </MainLayout>
  );
}