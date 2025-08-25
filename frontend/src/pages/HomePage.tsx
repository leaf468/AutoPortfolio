import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  LightBulbIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <SparklesIcon className="h-6 w-6" />,
      title: "AI 자동 생성",
      description: "간단한 정보 입력만으로 전문적인 포트폴리오를 자동 생성합니다"
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: "5분 완성",
      description: "복잡한 디자인 작업 없이 빠르게 포트폴리오를 완성할 수 있습니다"
    },
    {
      icon: <LightBulbIcon className="h-6 w-6" />,
      title: "스마트 추천",
      description: "부족한 내용을 자동으로 파악하고 개선 방향을 제시합니다"
    },
    {
      icon: <GlobeAltIcon className="h-6 w-6" />,
      title: "다양한 형식",
      description: "마크다운, HTML, PDF 등 원하는 형식으로 즉시 변환 가능합니다"
    }
  ];

  const steps = [
    { number: "1", title: "정보 입력", description: "경력, 프로젝트, 스킬 등 기본 정보를 입력하세요" },
    { number: "2", title: "AI 분석", description: "AI가 입력된 정보를 분석하고 보완합니다" },
    { number: "3", title: "템플릿 선택", description: "다양한 디자인 템플릿 중 선택하세요" },
    { number: "4", title: "완성 & 다운로드", description: "원하는 형식으로 다운로드하세요" }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 opacity-10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI로 만드는 완벽한 포트폴리오
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Careeroad Portfolio Assistant가 당신의 경력과 프로젝트를 분석하여
            전문적이고 매력적인 포트폴리오를 자동으로 생성해드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              무료로 시작하기
            </Link>
            <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 bg-white border-2 border-purple-600 rounded-full hover:bg-purple-50 transform hover:scale-105 transition-all duration-200">
              샘플 보기
            </button>
          </div>
        </motion.div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 Careeroad를 선택해야 할까요?</h2>
            <p className="text-lg text-gray-600">전문가 수준의 포트폴리오를 누구나 쉽게 만들 수 있습니다</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">간단한 4단계로 완성</h2>
            <p className="text-lg text-gray-600">복잡한 과정 없이 누구나 쉽게 포트폴리오를 만들 수 있습니다</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-xl mb-8 opacity-90">
            5분 안에 전문적인 포트폴리오를 완성하고 꿈의 직장을 향해 한 걸음 더 나아가세요
          </p>
          <Link
            to="/create"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 bg-white rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            포트폴리오 만들기
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;