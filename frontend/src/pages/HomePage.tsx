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
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI로 만드는 <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                완벽한 포트폴리오
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              채용 담당자의 마음을 사로잡는 포트폴리오를 5분 만에 완성하세요. <br />
              AI가 당신의 경험과 프로젝트를 분석하여 최적화된 포트폴리오를 생성합니다.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <SparklesIcon className="w-6 h-6 mr-2" />
              포트폴리오 만들기 시작
            </motion.button>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-32 grid md:grid-cols-3 gap-8"
          >
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI 기반 최적화</h3>
              <p className="text-gray-600 leading-relaxed">
                GPT-4 기술로 당신의 경험을 분석하고 채용 트렌드에 맞게 최적화된 내용을 생성합니다.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">전문적인 디자인</h3>
              <p className="text-gray-600 leading-relaxed">
                2024년 웹 디자인 트렌드를 반영한 깔끔하고 모던한 템플릿으로 완성도를 높입니다.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <RocketLaunchIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">빠른 생성</h3>
              <p className="text-gray-600 leading-relaxed">
                복잡한 작업 없이 5단계만 거치면 완성! PDF, HTML 등 다양한 형태로 다운로드 가능합니다.
              </p>
            </div>
          </motion.div>

          {/* Process Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-32 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-16">
              5단계로 완성하는 포트폴리오
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
              {[
                { step: 1, title: '템플릿 선택', desc: '원하는 디자인 선택' },
                { step: 2, title: '정보 입력', desc: '경력과 프로젝트 정보' },
                { step: 3, title: 'AI 자동 생성', desc: 'AI가 최적화하여 생성' },
                { step: 4, title: '상세 편집', desc: '섹션별 세부 조정' },
                { step: 5, title: '완성 & 다운로드', desc: 'PDF, HTML 다운로드' }
              ].map((item, index) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 text-center">{item.desc}</p>
                  </div>
                  {index < 4 && (
                    <div className="hidden md:block w-8 h-0.5 bg-gradient-to-r from-purple-300 to-blue-300"></div>
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