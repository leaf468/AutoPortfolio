import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RocketLaunchIcon,
  CpuChipIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { trackMainPageVisit, trackButtonClick } from '../utils/analytics';
import LandingFooter from '../components/LandingFooter';
import { useAuth } from '../contexts/AuthContext';
import SubscribeModal from '../components/SubscribeModal';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const slides = [
    {
      img: '/page5.png',
      title: '지원 정보를 입력하면 AI가 실시간 분석합니다',
      subtitle: 'AI가 직무와 활동을 분석해 개인화된 통계를 제공합니다',
      badge: '자소서 1단계'
    },
    {
      img: '/page7.png',
      title: '질문에 답하며 자소서를 체계적으로 작성하세요',
      subtitle: '8가지 핵심 질문으로 완성도 높은 자소서 완성',
      badge: '자소서 2단계'
    },
    {
      img: '/page6.png',
      title: '작성 중 AI가 개선점을 실시간으로 제안합니다',
      subtitle: '문장력, 구조, 키워드 등 종합적인 피드백',
      badge: '자소서 3단계'
    },
    {
      img: '/page1.png',
      title: '원하는 템플릿을 선택하세요',
      subtitle: '직무에 맞는 다양한 디자인 제공',
      badge: '포트폴리오 1단계'
    },
    {
      img: '/page2.png',
      title: '프로젝트와 경력을 입력하세요',
      subtitle: '자소서 내용을 바로 불러올 수 있습니다',
      badge: '포트폴리오 2단계'
    },
    {
      img: '/page3.png',
      title: 'AI가 자동으로 포트폴리오 생성',
      subtitle: '채용 담당자가 선호하는 구조로 최적화',
      badge: '포트폴리오 3단계'
    },
    {
      img: '/page4.png',
      title: '편집 후 바로 다운로드',
      subtitle: 'PDF, HTML 등 다양한 형식 지원',
      badge: '포트폴리오 4단계'
    },
  ];

  useEffect(() => {
    trackMainPageVisit();
  }, []);

  // 로그인된 유저는 마이페이지로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/mypage');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoPlay, slides.length]);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
    // 5초 후 자동 재생 재개
    setTimeout(() => setAutoPlay(true), 5000);
  };

  const handleGetStarted = () => {
    trackButtonClick('포트폴리오 만들기 시작', 'HomePage');
    // 로그인 상태면 템플릿 선택으로, 아니면 로그인 페이지로 이동
    if (user) {
      navigate('/template-selection');
    } else {
      navigate('/login');
    }
  };

  const handleProPlanClick = () => {
    trackButtonClick('프로 플랜 시작하기', 'HomePage');
    if (!user) {
      // 비로그인 사용자는 회원가입 안내 모달 표시
      setShowSignupModal(true);
    } else {
      // 로그인된 사용자는 구독 모달 표시
      setShowSubscribeModal(true);
    }
  };

  const handleLogin = () => {
    trackButtonClick('로그인', 'HomePage');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/Careeroad_logo.png"
              alt="CareeRoad Logo"
              className="h-14 object-contain"
            />
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <a href="#features" className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors">기능</a>
            <a href="#pricing" className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors">가격</a>
            <button
              onClick={handleLogin}
              className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              로그인
            </button>
            <button
              onClick={handleGetStarted}
              className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
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
              <span className="text-indigo-600 font-semibold text-sm">✨ AI 자소서 첨삭 + 포트폴리오 생성</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.5' }}>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                자소서 작성,<br />어디서부터 시작할지 막막하신가요?
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              8가지 질문에 답하면 AI가 전문 자소서로 완성해드립니다.<br />
              자소서 내용으로 포트폴리오까지 자동 생성됩니다.
            </p>
            <div className="flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const pricingSection = document.getElementById('pricing');
                  if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
              >
                첫 한 달 무료로 사용하기
              </motion.button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✓ 첫 한 달 무료 ✓ 모든 프로 기능 이용 ✓ 신용카드 불필요
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
                      onClick={() => handleSlideChange(index)}
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
                  onClick={() => handleSlideChange((currentSlide - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
                >
                  ‹
                </button>
                <button
                  onClick={() => handleSlideChange((currentSlide + 1) % slides.length)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Slide Info */}
            <div className="text-center mt-12 max-w-4xl mx-auto px-4">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {slides[currentSlide].title}
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                {slides[currentSlide].subtitle}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600">10,000+</div>
              <div className="text-gray-600 mt-2 text-sm sm:text-base">포트폴리오 생성</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600">95%</div>
              <div className="text-gray-600 mt-2 text-sm sm:text-base">사용자 만족도</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600">5분</div>
              <div className="text-gray-600 mt-2 text-sm sm:text-base">평균 완성 시간</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              왜 CareeRoad를 선택해야 하나요?
            </h2>
            <p className="text-xl text-gray-600">
              8가지 질문에 답하면 AI가 자소서를 완성하고, 포트폴리오까지 자동으로 만들어줍니다
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
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">8가지 질문으로 쉽게 시작</h3>
              <p className="text-gray-600 leading-relaxed">
                빈 화면이 아닌 지원동기, 경험, 강점 등 핵심 질문에 답하면 AI가 자동으로 완성합니다.
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
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI가 100점 만점으로 첨삭</h3>
              <p className="text-gray-600 leading-relaxed">
                구조, 내용, 표현력, 직무 적합성을 평가하고 개선점을 구체적으로 알려줍니다.
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
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">핵심만 입력하면 AI가 작성</h3>
              <p className="text-gray-600 leading-relaxed">
                키워드만 입력하면 AI가 STAR 기법을 적용한 완성도 높은 답변을 작성합니다.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">자소서→포트폴리오 자동 연결</h3>
              <p className="text-gray-600 leading-relaxed">
                작성한 자소서 내용이 포트폴리오에 자동으로 연결되어 한 번에 모든 서류를 완성합니다.
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
                <RocketLaunchIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">직무별 맞춤 통계 제공</h3>
              <p className="text-gray-600 leading-relaxed">
                지원 직무를 입력하면 평균 스펙, 추천 활동, 필요한 자격증을 바로 확인할 수 있습니다.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">출시 기념 첫 달 0원</h3>
              <p className="text-gray-600 leading-relaxed">
                무제한 AI 첨삭, 포트폴리오 생성, 프리미엄 템플릿을 모두 이용할 수 있습니다. 첫 달 무료 후 월 3,900원
              </p>
            </motion.div>
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
                  8가지 질문 기반 자소서 작성
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  AI 답변 생성
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  자소서 1회 무료 첨삭
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
                🎉 출시 특가
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">프로</h3>
              <div className="mb-6">
                <div className="text-lg text-indigo-200 line-through mb-1">
                  ₩14,900
                </div>
                <div className="text-4xl font-bold text-white">
                  ₩0<span className="text-lg text-indigo-200">/첫 달</span>
                </div>
                <div className="text-sm text-white/90 mt-2">
                  이후 ₩3,900/월
                </div>
                <div className="text-sm text-yellow-300 font-semibold mt-1">
                  출시 기념 특가! 지금 시작하면 첫 달 무료
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-300 mr-3" />
                  무제한 자소서 AI 첨삭
                </li>
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
                  무제한 AI 생성 및 편집
                </li>
                <li className="flex items-center text-white">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-300 mr-3" />
                  우선 고객지원
                </li>
              </ul>
              <button
                onClick={handleProPlanClick}
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
            지금 바로 무료로 시작해보세요
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            회원가입만 하면 8가지 질문 기반 작성 + AI 답변 생성 + 1회 무료 첨삭이 무료입니다.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const pricingSection = document.getElementById('pricing');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
          >
            첫 한 달 무료로 사용하기
          </motion.button>
        </div>
      </section>

      <LandingFooter />

      {/* 로그인 안내 모달 */}
      {showSignupModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSignupModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                로그인이 필요합니다
              </h3>
              <p className="text-gray-600 mb-6">
                프로 플랜을 이용하려면 먼저 로그인이 필요합니다.<br />
                Google로 간편하게 로그인하고 프리미엄 기능을 이용해보세요!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSignupModal(false);
                    navigate('/login', { state: { openSubscribe: true } });
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02]"
                >
                  간편 로그인하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구독 모달 */}
      {showSubscribeModal && (
        <SubscribeModal
          isOpen={showSubscribeModal}
          onClose={() => setShowSubscribeModal(false)}
        />
      )}
    </div>
  );
}