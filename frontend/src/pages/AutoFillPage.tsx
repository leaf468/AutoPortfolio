import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AutoFillPortfolioEditor from '../components/AutoFillPortfolioEditor';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PortfolioDocument } from '../services/autoFillService';
import { GenerationResult } from '../services/oneClickGenerator';

export default function AutoFillPage() {
  const navigate = useNavigate();
  const { state, setInitialResult, setCurrentStep } = usePortfolio();

  useEffect(() => {
    setCurrentStep('autofill');

    // 필수 데이터가 없으면 이전 단계로 이동
    if (!state.selectedTemplate || !state.organizedContent) {
      if (!state.selectedTemplate) {
        navigate('/template');
      } else if (!state.organizedContent) {
        navigate('/organize');
      }
      return;
    }
  }, []);

  const handleAutoFillSave = (document: PortfolioDocument) => {
    // Convert document to GenerationResult format for compatibility
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
      qualityScore: 85,
      suggestions: []
    };
    setInitialResult(result);
    setCurrentStep('enhanced-edit');
    navigate('/edit');
  };

  const handleEnhancedEdit = (doc: PortfolioDocument) => {
    // Convert to GenerationResult and go to enhanced edit
    const result: GenerationResult = {
      id: doc.doc_id,
      content: JSON.stringify(doc),
      format: 'json',
      metadata: {
        wordCount: doc.sections.reduce((acc, s) =>
          acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
        ),
        estimatedReadTime: Math.ceil(
          doc.sections.reduce((acc, s) =>
            acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
          ) / 200
        ),
        generatedAt: new Date(),
        template: state.selectedTemplate || 'james'
      },
      qualityScore: 85,
      suggestions: []
    };
    setInitialResult(result);
    setCurrentStep('enhanced-edit');
    navigate('/edit');
  };

  if (!state.selectedTemplate || !state.organizedContent) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <MainLayout>
      <div className="max-w-full">
        <AutoFillPortfolioEditor
          userId={state.userId}
          selectedTemplate={state.selectedTemplate}
          initialInputs={{
            profile: state.organizedContent.summary || '',
            projects: state.organizedContent.projects.map(p => ({
              title: p.name,
              description: p.summary,
              role: p.myRole,
              duration: ''
            })),
            skills: state.organizedContent.skills.flatMap(s => s.skills),
            education: '',
            experience: state.organizedContent.experiences.map(e =>
              `${e.position} at ${e.company} (${e.duration})`
            ).join('\n')
          }}
          targetJobKeywords={[
            ...state.organizedContent.keywords.technical,
            ...state.organizedContent.keywords.industry
          ]}
          onSave={handleAutoFillSave}
          onEnhancedEdit={handleEnhancedEdit}
        />
      </div>
    </MainLayout>
  );
}