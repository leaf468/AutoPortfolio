import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RocketLaunchIcon,
  CpuChipIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { trackMainPageVisit, trackButtonClick } from '../utils/analytics';
import AuthModal from '../components/AuthModal';
import LandingFooter from '../components/LandingFooter';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      img: '/page1.png',
      title: '마음에 드는 템플릿을 선택하세요',
      subtitle: '다양한 디자인 중 직무에 맞는 템플릿 선택',
      badge: '포트폴리오 1단계'
    },
    {
      img: '/page2.png',
      title: '경력과 프로젝트 정보를 입력하세요',
      subtitle: '간단한 정보만 입력하면 AI가 자동으로 정리',
      badge: '포트폴리오 2단계'
    },
    {
      img: '/page3.png',
      title: 'AI가 포트폴리오를 자동으로 생성합니다',
      subtitle: '채용 담당자가 원하는 형태로 최적화',
      badge: '포트폴리오 3단계'
    },
    {
      img: '/page4.png',
      title: '세부 내용을 편집하고 다운로드하세요',
      subtitle: 'PDF, HTML 등 다양한 형식으로 즉시 다운로드',
      badge: '포트폴리오 4단계'
    },
    {
      img: '/page5.png',
      title: '지원 정보를 입력하면 AI가 실시간 분석합니다',
      subtitle: '합격자 데이터 기반으로 스펙 비교 및 통계 제공',
      badge: '자소서 1단계'
    },
    {
      img: '/page6.png',
      title: '작성 중 AI가 개선점을 실시간으로 제안합니다',
      subtitle: '문장력, 구조, 키워드 등 종합적인 피드백',
      badge: '자소서 2단계'
    },
  ];

  useEffect(() => {
    trackMainPageVisit();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    trackButtonClick('포트폴리오 만들기 시작', 'HomePage');
    // 로그인 상태면 템플릿 선택으로, 아니면 회원가입 모달
    if (user) {
      navigate('/template-selection');
    } else {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
    }
  };

  const handleLogin = () => {
    trackButtonClick('로그인', 'HomePage');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/Careeroad_logo.png"
              alt="CareeRoad Logo"
              className="h-14 object-contain"
            />
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">기능</a>
            <a href="#process" className="text-gray-600 hover:text-gray-900 transition-colors">사용방법</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">가격</a>
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              로그인
            </button>
            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              시작하기
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-4 px-4 py-2 bg-indigo-50 rounded-full">
              <span className="text-indigo-600 font-semibold text-sm">AI 기반 포트폴리오 생성</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              5분 만에 완성하는<br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                나만의 포트폴리오
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              AI가 당신의 경험을 분석하고, 채용 담당자의 마음을 사로잡는<br />
              전문적인 포트폴리오를 자동으로 생성합니다.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
              >
                무료로 시작하기
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/cover-letter?mode=guest')}
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl text-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                데모 체험하기
              </motion.button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✓ 신용카드 불필요 ✓ 5분이면 완성 ✓ 무료 템플릿 제공
            </p>
          </motion.div>

          {/* Hero Image Slider */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-200 max-w-6xl mx-auto">
              <div className="aspect-[16/9] bg-white flex items-center justify-center relative overflow-hidden">
                {/* Slides */}
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={slide.img}
                      alt={slide.title}
                      className="w-full h-full object-contain"
                    />
                    {/* Badge */}
                    <div className="absolute top-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-sm text-white rounded-lg font-semibold">
                      {slide.badge}
                    </div>
                  </div>
                ))}

                {/* Navigation Dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-indigo-600 w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Arrow Navigation */}
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Slide Info */}
            <div className="text-center mt-12 max-w-4xl mx-auto px-4">
              <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                {slides[currentSlide].title}
              </h3>
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
                {slides[currentSlide].subtitle}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600">10,000+</div>
              <div className="text-gray-600 mt-2">포트폴리오 생성</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">95%</div>
              <div className="text-gray-600 mt-2">사용자 만족도</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">5분</div>
              <div className="text-gray-600 mt-2">평균 완성 시간</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              왜 CareeRoad를 선택해야 할까요?
            </h2>
            <p className="text-xl text-gray-600">
              AI 기술로 당신의 커리어를 더욱 빛나게 만들어드립니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI 자동 생성</h3>
              <p className="text-gray-600 leading-relaxed">
                당신의 경력과 프로젝트를 분석하여 채용 담당자가 원하는 형태로 자동 변환합니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">다양한 템플릿</h3>
              <p className="text-gray-600 leading-relaxed">
                개발자, 디자이너, 기획자 등 직군별로 최적화된 템플릿을 제공합니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <RocketLaunchIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">즉시 다운로드</h3>
              <p className="text-gray-600 leading-relaxed">
                PDF, HTML 등 다양한 형식으로 즉시 다운로드하여 바로 사용 가능합니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">맞춤형 제안</h3>
              <p className="text-gray-600 leading-relaxed">
                지원하려는 직무와 회사에 맞춰 포트폴리오 내용을 최적화합니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">실시간 피드백</h3>
              <p className="text-gray-600 leading-relaxed">
                작성 중인 포트폴리오에 대한 AI의 실시간 개선 제안을 받아보세요.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">간편한 수정</h3>
              <p className="text-gray-600 leading-relaxed">
                직관적인 편집기로 언제든 쉽게 내용을 수정하고 업데이트할 수 있습니다.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="process" className="py-24 px-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              간단한 4단계로 완성
            </h2>
            <p className="text-xl text-gray-600">
              복잡한 과정 없이 누구나 쉽게 만들 수 있습니다
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300"></div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {[
                {
                  step: 1,
                  title: '템플릿 선택',
                  desc: '마음에 드는 디자인을 선택하세요',
                  icon: DocumentTextIcon,
                  color: 'from-indigo-500 to-indigo-600'
                },
                {
                  step: 2,
                  title: '정보 입력',
                  desc: '간단한 정보만 입력하면 됩니다',
                  icon: UserGroupIcon,
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  step: 3,
                  title: 'AI 생성',
                  desc: 'AI가 자동으로 최적화합니다',
                  icon: CpuChipIcon,
                  color: 'from-pink-500 to-pink-600'
                },
                {
                  step: 4,
                  title: '다운로드',
                  desc: '완성된 포트폴리오를 받으세요',
                  icon: RocketLaunchIcon,
                  color: 'from-orange-500 to-orange-600'
                }
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.step * 0.1 }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow border border-gray-100">
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-indigo-600 mb-2">STEP {item.step}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              모두를 위한 가격
            </h2>
            <p className="text-xl text-gray-600">
              지금 시작하면 모든 기능을 무료로 사용할 수 있습니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 bg-white rounded-2xl shadow-md border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">무료</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                ₩0<span className="text-lg text-gray-500">/월</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  자소서 AI 작성
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  기본 템플릿
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  PDF 다운로드
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                시작하기
              </button>
            </div>

            <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl relative border-4 border-indigo-400">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-bold rounded-full">
                인기
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">프로</h3>
              <div className="text-4xl font-bold text-white mb-6">
                ₩9,900<span className="text-lg text-indigo-200">/월</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-300 mr-3" />
                  포트폴리오 AI 생성
                </li>
                <li className="flex items-center text-white">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-300 mr-3" />
                  모든 프리미엄 템플릿
                </li>
                <li className="flex items-center text-white">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-300 mr-3" />
                  무제한 AI 생성
                </li>
                <li className="flex items-center text-white">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-300 mr-3" />
                  우선 고객지원
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                시작하기
              </button>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-md border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">기업</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                문의<span className="text-lg text-gray-500"></span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  팀 협업 기능
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  커스텀 브랜딩
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  전담 매니저
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  API 연동
                </li>
              </ul>
              <button className="w-full py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                문의하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            5분이면 충분합니다. 당신의 커리어를 한 단계 업그레이드하세요.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
          >
            무료로 시작하기
          </motion.button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}