import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import AIOrganizer from './AIOrganizer';
import InteractiveBoosterChat from './InteractiveBoosterChat';
import OneClickGenerator from './OneClickGenerator';
import { OrganizedContent } from '../services/aiOrganizer';
import { BoostResult } from '../services/interactiveBooster';
import { GenerationResult } from '../services/oneClickGenerator';

type WizardStep = 'organize' | 'boost' | 'generate' | 'complete';

interface StepInfo {
  id: WizardStep;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PortfolioWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('organize');
  const [organizedContent, setOrganizedContent] = useState<OrganizedContent | null>(null);
  const [boostResult, setBoostResult] = useState<BoostResult | null>(null);
  const [finalResult, setFinalResult] = useState<GenerationResult | null>(null);

  const steps: StepInfo[] = [
    {
      id: 'organize',
      name: 'AI 정리',
      description: '정보를 채용 관점으로 정리',
      icon: SparklesIcon
    },
    {
      id: 'boost',
      name: '대화형 보강',
      description: '부족한 정보를 질문으로 보완',
      icon: ChatBubbleLeftRightIcon
    },
    {
      id: 'generate',
      name: '원클릭 완성',
      description: '완성된 포트폴리오 생성',
      icon: DocumentArrowDownIcon
    }
  ];

  const handleOrganizeComplete = (content: OrganizedContent) => {
    setOrganizedContent(content);
    setCurrentStep('boost');
  };

  const handleBoostComplete = (result: BoostResult) => {
    setBoostResult(result);
    setOrganizedContent(result.enhancedContent);
    setCurrentStep('generate');
  };

  const handleGenerateComplete = (result: GenerationResult) => {
    setFinalResult(result);
    setCurrentStep('complete');
  };

  const resetWizard = () => {
    setCurrentStep('organize');
    setOrganizedContent(null);
    setBoostResult(null);
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
      case 'complete': return 'bg-green-600 text-white';
      case 'current': return 'bg-purple-600 text-white';
      default: return 'bg-gray-200 text-gray-500';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'organize':
        return <AIOrganizer onComplete={handleOrganizeComplete} />;
      
      case 'boost':
        return organizedContent ? (
          <InteractiveBoosterChat 
            organizedContent={organizedContent}
            onComplete={handleBoostComplete}
          />
        ) : null;
      
      case 'generate':
        return organizedContent ? (
          <OneClickGenerator 
            enhancedContent={organizedContent}
            boostResult={boostResult || undefined}
            onComplete={handleGenerateComplete}
          />
        ) : null;
      
      case 'complete':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center items-center mb-4">
                <CheckIcon className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                포트폴리오 완성! 🎉
              </h2>
              <p className="text-lg text-gray-600">
                AI 기반 포트폴리오 제작이 성공적으로 완료되었습니다
              </p>
            </motion.div>

            {finalResult && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">최종 결과</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {finalResult.qualityScore}/100
                    </div>
                    <div className="text-sm text-purple-700">품질 점수</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {finalResult.metadata.wordCount}
                    </div>
                    <div className="text-sm text-blue-700">단어 수</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {finalResult.format.toUpperCase()}
                    </div>
                    <div className="text-sm text-green-700">형식</div>
                  </div>
                </div>

                {boostResult && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-900 mb-2">
                      🚀 대화형 보강 효과
                    </h4>
                    <div className="text-sm text-green-800">
                      개선 점수: <strong>+{boostResult.improvementScore}</strong> | 
                      완성도: <strong>{boostResult.qualityMetrics.completeness}%</strong> |
                      구체성: <strong>{boostResult.qualityMetrics.specificity}%</strong> |
                      ATS 점수: <strong>{boostResult.qualityMetrics.atsScore}</strong>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      if (finalResult) {
                        const link = document.createElement('a');
                        link.href = finalResult.downloadUrl;
                        link.download = `portfolio-${finalResult.id}.${finalResult.format}`;
                        link.click();
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                    다운로드
                  </button>
                  <button
                    onClick={resetWizard}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    새 포트폴리오 만들기
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
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
                3단계로 완성하는 채용 최적화 포트폴리오
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