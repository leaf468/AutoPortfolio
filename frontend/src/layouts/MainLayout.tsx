import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, SparklesIcon, PencilSquareIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useNavigate } from 'react-router-dom';
import NaturalLanguageSidebar from '../components/NaturalLanguageSidebar';

interface StepInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

const steps: StepInfo[] = [
  {
    id: 'template',
    name: '템플릿 선택',
    description: '원하는 포트폴리오 디자인 선택',
    icon: SparklesIcon,
    route: '/template'
  },
  {
    id: 'organize',
    name: '정보 입력',
    description: '경력, 프로젝트 등 기본 정보 입력',
    icon: SparklesIcon,
    route: '/organize'
  },
  {
    id: 'autofill',
    name: 'AI 자동 생성',
    description: 'AI가 자동으로 포트폴리오 생성',
    icon: PencilSquareIcon,
    route: '/autofill'
  },
  {
    id: 'enhanced-edit',
    name: '상세 편집',
    description: '포트폴리오 섹션별 상세 편집',
    icon: PencilSquareIcon,
    route: '/edit'
  },
  {
    id: 'feedback',
    name: '자연어 편집',
    description: '대화형으로 최종 수정',
    icon: PencilSquareIcon,
    route: '/feedback'
  }
];

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showProgress?: boolean;
}

export default function MainLayout({
  children,
  showHeader = true,
  showProgress = true
}: MainLayoutProps) {
  const { state, reset } = usePortfolio();
  const navigate = useNavigate();
  const [isNaturalEditOpen, setIsNaturalEditOpen] = useState(false);

  const handleLogoClick = () => {
    reset();
    navigate('/');
  };

  const getStepStatus = (stepId: string): 'complete' | 'current' | 'upcoming' => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === state.currentStep);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      {showHeader && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-2">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
                title="홈으로 돌아가기"
              >
                <img
                  src="/Careeroad_logo.png"
                  alt="Careeroad"
                  className="h-7 w-7 mr-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Careeroad
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* 자연어 편집 버튼 - 상세 편집 단계에서만 표시 */}
                {state.currentStep === 'enhanced-edit' && (
                  <button
                    onClick={() => setIsNaturalEditOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    AI 자연어 편집
                  </button>
                )}
                {showProgress && state.currentStep !== 'complete' && (
                  <div className="text-xs text-gray-500 font-medium">
                    {steps.findIndex(s => s.id === state.currentStep) + 1} / {steps.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 진행 단계 표시 */}
      {showProgress && state.currentStep !== 'complete' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getStepColor(status)} mb-1`}>
                        {status === 'complete' ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <p className={`text-xs font-medium whitespace-nowrap ${status === 'current' ? 'text-purple-600' : status === 'complete' ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.name}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-2 mt-[-18px]">
                        <div className={`h-0.5 rounded-full ${status === 'complete' ? 'bg-green-600' : 'bg-gray-200'}`} />
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
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>

      {/* 푸터 */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>AI 기술로 만드는 차별화된 포트폴리오 | 채용 성공률 UP 🚀</p>
          </div>
        </div>
      </div>

      {/* 자연어 편집 사이드바 */}
      <NaturalLanguageSidebar
        isOpen={isNaturalEditOpen}
        onClose={() => setIsNaturalEditOpen(false)}
      />
    </div>
  );
}