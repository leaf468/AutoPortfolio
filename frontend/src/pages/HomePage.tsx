import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon, RocketLaunchIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import MainLayout from '../layouts/MainLayout';

export default function HomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/template');
  };

  return (
    <MainLayout showProgress={false}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-12 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              AI로 만드는 <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                완벽한 포트폴리오
              </span>
            </h1>
            <p className="text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed">
              채용 담당자의 마음을 사로잡는 포트폴리오를 5분 만에 완성하세요. <br />
              AI가 당신의 경험과 프로젝트를 분석하여 최적화된 포트폴리오를 생성합니다.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="inline-flex items-center px-12 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <SparklesIcon className="w-7 h-7 mr-3" />
              포트폴리오 만들기 시작
            </motion.button>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-40 grid md:grid-cols-3 gap-12"
          >
            <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <CpuChipIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">AI 맞춤 분석</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                당신의 경력을 깊이 이해하고 직무에 최적화된 스토리텔링으로 재구성합니다.
              </p>
            </div>

            <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <SparklesIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">검증된 템플릿</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                실제 합격자들이 사용한 디자인으로 채용담당자의 시선을 사로잡습니다.
              </p>
            </div>

            <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <RocketLaunchIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">빠른 생성</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                복잡한 작업 없이 5단계만 거치면 완성!<br />
                PDF, HTML 등 다양한 형태로 다운로드 가능합니다.
              </p>
            </div>
          </motion.div>

          {/* Process Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-40 text-center"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-20">
              <span className="inline-block">5단계로 완성하는</span>{' '}
              <span className="inline-block">프로페셔널 포트폴리오</span>
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-8">
              {[
                { step: 1, title: '템플릿 선택', desc: '원하는 디자인 선택' },
                { step: 2, title: '정보 입력', desc: '경력과 프로젝트 정보' },
                { step: 3, title: 'AI 자동 생성', desc: 'AI가 최적화하여 생성' },
                { step: 4, title: '상세 편집', desc: '섹션별 세부 조정' },
                { step: 5, title: '완성 & 다운로드', desc: 'PDF, HTML 다운로드' }
              ].map((item, index) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-5">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg whitespace-nowrap">{item.title}</h3>
                    <p className="text-base text-gray-600 text-center whitespace-nowrap">{item.desc}</p>
                  </div>
                  {index < 4 && (
                    <div className="hidden md:block flex-shrink-0 w-8 h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 self-center mb-12"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}