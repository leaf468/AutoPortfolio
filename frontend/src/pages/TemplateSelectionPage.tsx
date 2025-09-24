import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import TemplateSelector from '../components/TemplateSelector';
import { usePortfolio } from '../contexts/PortfolioContext';

type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

export default function TemplateSelectionPage() {
  const navigate = useNavigate();
  const { state, setTemplate, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('template');
  }, []);

  const handleTemplateSelect = (templateType: TemplateType) => {
    setTemplate(templateType);
    setCurrentStep('organize');
    navigate('/organize');
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6">
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={state.selectedTemplate || undefined}
        />
      </div>
    </MainLayout>
  );
}