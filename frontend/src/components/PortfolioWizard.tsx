import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon,
  SparklesIcon,
  PencilSquareIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import AIOrganizer from './AIOrganizer';
import AutoFillPortfolioEditor from './AutoFillPortfolioEditor';
import TemplateUpload from './TemplateUpload';
import NaturalLanguagePortfolioEditor from './NaturalLanguagePortfolioEditor';
import EnhancedPortfolioEditor from './EnhancedPortfolioEditor';
import FinalResultPanel from './FinalResultPanel';
import { OrganizedContent } from '../services/aiOrganizer';
import { GenerationResult } from '../services/oneClickGenerator';
import { FeedbackResult } from '../services/userFeedbackService';
import { PortfolioDocument } from '../services/autoFillService';

type WizardStep = 'template' | 'organize' | 'autofill' | 'enhanced-edit' | 'feedback' | 'complete';

interface StepInfo {
  id: WizardStep;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PortfolioWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [template, setTemplate] = useState<string>('');
  const [organizedContent, setOrganizedContent] = useState<OrganizedContent | null>(null);
  const [initialResult, setInitialResult] = useState<GenerationResult | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const [finalResult, setFinalResult] = useState<GenerationResult | null>(null);
  const [userId] = useState(() => `user_${Date.now()}`);

  const steps: StepInfo[] = [
    {
      id: 'template',
      name: '템플릿 업로드',
      description: '원하는 포트폴리오 양식 업로드',
      icon: DocumentArrowUpIcon
    },
    {
      id: 'organize',
      name: 'AI 정리',
      description: '정보를 채용 관점으로 정리',
      icon: SparklesIcon
    },
    {
      id: 'autofill',
      name: 'AI 자동 생성 & 편집',
      description: 'AI가 자동으로 포트폴리오 생성 후 편집',
      icon: PencilSquareIcon
    },
    {
      id: 'enhanced-edit',
      name: '상세 편집',
      description: '포트폴리오 섹션별 편집',
      icon: PencilSquareIcon
    },
    {
      id: 'feedback',
      name: '자연어 편집',
      description: '대화형 수정',
      icon: PencilSquareIcon
    }
  ];

  const handleTemplateUpload = (uploadedTemplate: string) => {
    setTemplate(uploadedTemplate);
    setCurrentStep('organize');
  };

  const handleOrganizeComplete = (content: OrganizedContent) => {
    setOrganizedContent(content);
    setCurrentStep('autofill');
  };

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
        template: template
      },
      downloadUrl: '',
      qualityScore: 85,
      suggestions: []
    };
    setInitialResult(result);
    setCurrentStep('enhanced-edit');
  };

  const handleFeedbackComplete = (result: FeedbackResult) => {
    setFeedbackResult(result);
    // 개선된 콘텐츠로 최종 결과 생성
    const enhancedFinalResult: GenerationResult = {
      ...initialResult!,
      content: result.revisedContent,
      qualityScore: result.finalQualityScore,
      suggestions: [`개선 점수: +${result.improvementScore}`, ...result.changesApplied],
      downloadUrl: createDownloadUrl(result.revisedContent, initialResult!.format)
    };
    setFinalResult(enhancedFinalResult);
    setCurrentStep('complete');
  };

  const handleEnhancedEditComplete = (document: PortfolioDocument) => {
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
        template: template
      },
      downloadUrl: createDownloadUrl(document.sections[0]?.blocks[0]?.text || '', 'html'),
      qualityScore: 90,
      suggestions: ['상세 편집 완료']
    };
    setFinalResult(result);
    setCurrentStep('complete');
  };

  const handleSkipToFeedback = () => {
    setCurrentStep('feedback');
  };

  const handleSkipFeedback = () => {
    setFinalResult(initialResult);
    setCurrentStep('complete');
  };

  const createDownloadUrl = (content: string, format: string): string => {
    const blob = new Blob([content], { 
      type: format === 'html' ? 'text/html' : 'text/plain' 
    });
    return URL.createObjectURL(blob);
  };

  const resetWizard = () => {
    setCurrentStep('template');
    setTemplate('');
    setOrganizedContent(null);
    setInitialResult(null);
    setFeedbackResult(null);
    setFinalResult(null);
  };

  const getStepStatus = (stepId: WizardStep): 'complete' | 'current' | 'upcoming' => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-gradient-to-br from-green-400 to-green-600 text-white';
      case 'current': return 'bg-gradient-to-br from-purple-400 to-blue-600 text-white';
      default: return 'bg-white/10 text-gray-400';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return <TemplateUpload onUpload={handleTemplateUpload} />;
        
      case 'organize':
        return <AIOrganizer onComplete={handleOrganizeComplete} />;
      
      case 'autofill':
        return organizedContent ? (
          <div className="max-w-full">
            <AutoFillPortfolioEditor
              userId={userId}
              initialInputs={{
                profile: organizedContent.summary || '',
                projects: organizedContent.projects.map(p => ({
                  title: p.name,
                  description: p.summary,
                  role: p.myRole,
                  duration: ''
                })),
                skills: organizedContent.skills.flatMap(s => s.skills),
                education: '',
                experience: organizedContent.experiences.map(e => 
                  `${e.position} at ${e.company} (${e.duration})`
                ).join('\n')
              }}
              targetJobKeywords={[
                ...organizedContent.keywords.technical,
                ...organizedContent.keywords.industry
              ]}
              onSave={handleAutoFillSave}
              onEnhancedEdit={(doc) => {
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
                    template: template
                  },
                  downloadUrl: '',
                  qualityScore: 85,
                  suggestions: []
                };
                setInitialResult(result);
                setCurrentStep('enhanced-edit');
              }}
            />
          </div>
        ) : null;
      
      case 'enhanced-edit':
        return initialResult ? (
          <EnhancedPortfolioEditor
            document={JSON.parse(initialResult.content)}
            onSave={handleEnhancedEditComplete}
            onBack={() => setCurrentStep('autofill')}
            onSkipToNaturalEdit={() => setCurrentStep('feedback')}
          />
        ) : null;
      
      case 'feedback':
        return initialResult && organizedContent ? (
          <NaturalLanguagePortfolioEditor 
            initialContent={initialResult}
            organizedContent={organizedContent}
            onComplete={(finalContent) => {
              const result: FeedbackResult = {
                revisedContent: finalContent,
                changesApplied: ['자연어 편집 완료'],
                improvementScore: 20,
                finalQualityScore: 90
              };
              handleFeedbackComplete(result);
            }}
            onBack={handleSkipFeedback}
          />
        ) : null;
      
      case 'complete':
        return finalResult ? (
          <FinalResultPanel 
            finalResult={finalResult}
            boostResult={undefined}
            feedbackResult={feedbackResult || undefined}
            onReset={resetWizard}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI 포트폴리오 제작소
              </h1>
              <p className="text-gray-600">
                5단계로 완성하는 맞춤형 포트폴리오
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep !== 'complete' && (
                <>
                  {steps.findIndex(s => s.id === currentStep) + 1} / {steps.length}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      {currentStep !== 'complete' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const StepIcon = step.icon;
                
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(status)}`}>
                        {status === 'complete' ? (
                          <CheckIcon className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={`font-medium ${status === 'current' ? 'text-purple-600' : status === 'complete' ? 'text-green-600' : 'text-gray-500'}`}>
                          {step.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-4">
                        <div className={`h-1 rounded-full ${status === 'complete' ? 'bg-green-600' : 'bg-gray-200'}`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 푸터 */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>AI 기술로 만드는 차별화된 포트폴리오 | 채용 성공률 UP 🚀</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioWizard;