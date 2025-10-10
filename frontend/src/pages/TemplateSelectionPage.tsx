import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import TemplateSelector from '../components/TemplateSelector';
import { usePortfolio } from '../contexts/PortfolioContext';
import { trackTemplateSelection, trackButtonClick } from '../utils/analytics';

type TemplateType = 'minimal' | 'clean' | 'colorful' | 'elegant';

export default function TemplateSelectionPage() {
  const navigate = useNavigate();
  const { state, setTemplate, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('template');
  }, []);

  const handleTemplateSelect = (templateType: TemplateType) => {
    // GA 이벤트 추적
    trackTemplateSelection(templateType);
    trackButtonClick(`템플릿 선택: ${templateType}`, 'TemplateSelectionPage');

    setTemplate(templateType);
    setCurrentStep('organize');
    navigate('/organize');
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-16">
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={state.selectedTemplate || undefined}
        />
      </div>
    </MainLayout>
  );
}