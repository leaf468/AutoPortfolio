import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, SparklesIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // 로그인 상태면 마이페이지로, 아니면 홈으로
    if (user) {
      navigate('/mypage');
    } else {
      reset();
      navigate('/');
    }
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      {showHeader && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
                title="홈으로 돌아가기"
              >
                <img
                  src="/Careeroad_logo.png"
                  alt="Careeroad"
                  className="h-20 w-auto"
                />
                <div className="border-l-2 border-gray-300 pl-4 py-1">
                  <p className="text-xl font-bold text-gray-900">
                    당신만의 AI 커리어 비서
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    경험 관리부터 포트폴리오 생성까지
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <Link
                  to="/cover-letter"
                  className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
                >
                  자기소개서 작성하기
                </Link>
                <Link
                  to="/template-selection"
                  className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
                >
                  포트폴리오 제작하기
                </Link>
                <Link
                  to="/mypage"
                  className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
                >
                  마이페이지
                </Link>
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
      <div className="flex-1 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}