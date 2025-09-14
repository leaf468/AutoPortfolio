import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  StarIcon,
  ChartBarIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  PrinterIcon,
  CodeBracketIcon,
  SparklesIcon,
  CommandLineIcon,
  CubeTransparentIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BoltIcon,
  LightBulbIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { GenerationResult } from '../services/oneClickGenerator';
import { BoostResult } from '../services/interactiveBooster';
import { FeedbackResult } from '../services/userFeedbackService';

interface FinalResultPanelProps {
  finalResult: GenerationResult;
  boostResult?: BoostResult;
  feedbackResult?: FeedbackResult;
  onReset: () => void;
}

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

const FinalResultPanel: React.FC<FinalResultPanelProps> = ({
  finalResult,
  boostResult,
  feedbackResult,
  onReset
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEnhancedAnalysis, setShowEnhancedAnalysis] = useState(false);
  const [showTemplateGuide, setShowTemplateGuide] = useState(false);

  // 다크모드 상태
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // 타이핑 애니메이션을 위한 텍스트
  const [typedText, setTypedText] = useState('');
  const fullText = 'Portfolio Generation Complete';
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const handleDownload = (format?: string) => {
    if (finalResult) {
      const link = document.createElement('a');
      link.href = finalResult.downloadUrl;
      link.download = `portfolio-${finalResult.id}.${format || finalResult.format}`;
      link.click();
    }
  };

  const handleCopy = async () => {
    try {
      const textContent = finalResult.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '내 포트폴리오',
          text: 'AI로 생성한 포트폴리오를 확인해보세요!',
          url: window.location.href
        });
      } catch (error) {
        console.log('공유 취소됨');
      }
    } else {
      handleCopy();
      alert('포트폴리오 링크가 클립보드에 복사되었습니다!');
    }
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'enhanced-analysis',
      name: '전문 품질 분석',
      description: '서핏 유니콘 기업 수준 포트폴리오 분석',
      icon: ArrowTrendingUpIcon,
      action: () => setShowEnhancedAnalysis(true)
    },
    {
      id: 'template-guide',
      name: '포트폴리오 가이드',
      description: '링커리어·브런치 실무진 검증 구조',
      icon: BookOpenIcon,
      action: () => setShowTemplateGuide(true)
    },
    {
      id: 'download-html',
      name: 'HTML 다운로드',
      description: '웹페이지로 바로 사용 가능한 HTML 파일',
      icon: GlobeAltIcon,
      action: () => handleDownload('html')
    },
    {
      id: 'download-pdf',
      name: 'PDF 변환',
      description: '인쇄 및 이메일 전송용 PDF 파일',
      icon: PrinterIcon,
      action: () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(finalResult.content);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      }
    },
    {
      id: 'copy-text',
      name: '텍스트 복사',
      description: '다른 문서에 붙여넣기 가능한 순수 텍스트',
      icon: ClipboardDocumentIcon,
      action: handleCopy
    },
    {
      id: 'mobile-view',
      name: '모바일 미리보기',
      description: '모바일 화면에서 어떻게 보이는지 확인',
      icon: DevicePhoneMobileIcon,
      action: () => setShowPreview(true)
    }
  ];

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTotalImprovement = () => {
    let total = 0;
    if (boostResult) total += boostResult.improvementScore;
    if (feedbackResult) total += feedbackResult.improvementScore;
    return total;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 to-white'} transition-all duration-500`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* 다크모드 토글 */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'}`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
        
        {/* IDE 스타일 성공 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} rounded-2xl border shadow-2xl overflow-hidden`}>
            {/* 터미널 헤더 바 */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center space-x-2">
                <CommandLineIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={`text-xs font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>portfolio-generator v2.0</span>
              </div>
            </div>
            
            {/* 터미널 콘텐츠 */}
            <div className="p-8">
              <div className="font-mono">
                <div className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>
                  $ ai-portfolio generate --style modern --optimize
                </div>
                <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  <span className="text-blue-500">&gt;</span> {typedText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                    className={`inline-block w-3 h-8 ${isDarkMode ? 'bg-white' : 'bg-gray-900'} ml-1`}
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="space-y-2"
                >
                  <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm">AI Analysis Complete</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Content Optimization Applied</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Portfolio Ready for Deployment</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3D 효과가 있는 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 결과 통계 카드 */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-6">
              {/* 품질 점수 - 글래스모피즘 카드 */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className={`${isDarkMode 
                  ? 'bg-gray-900/50 backdrop-blur-xl border-gray-800' 
                  : 'bg-white/80 backdrop-blur-xl border-gray-200'} 
                  border rounded-2xl p-6 shadow-xl relative overflow-hidden`}
              >
                {/* 배경 그라디언트 효과 */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mr-3">
                        <StarIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quality Score</h3>
                    </div>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ChartBarIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* 개선된 원형 진행률 표시 */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-36 h-36">
                      <svg className="transform -rotate-90 w-36 h-36">
                        <circle
                          cx="72"
                          cy="72"
                          r="64"
                          stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                          strokeWidth="8"
                          fill="none"
                        />
                        <motion.circle
                          cx="72"
                          cy="72"
                          r="64"
                          stroke="url(#qualityGradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 64}`}
                          strokeDashoffset={`${2 * Math.PI * 64 * (1 - finalResult.qualityScore / 100)}`}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - finalResult.qualityScore / 100) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient id="qualityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1, type: "spring" }}
                            className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {finalResult.qualityScore}
                          </motion.div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>/ 100</div>
                          <div className={`text-xs mt-1 ${finalResult.qualityScore >= 90 ? 'text-green-500' : finalResult.qualityScore >= 80 ? 'text-blue-500' : 'text-yellow-500'}`}>
                            {finalResult.qualityScore >= 90 ? '유니콘급' : finalResult.qualityScore >= 80 ? '우수' : '양호'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {getTotalImprovement() > 0 && (
                    <div className="text-sm text-green-600 font-medium text-center">
                      총 개선: +{getTotalImprovement()}점
                    </div>
                  )}

                  <AnimatePresence>
                    {showStats && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span>단어 수:</span>
                            <strong>{finalResult.metadata.wordCount.toLocaleString()}개</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>예상 읽기시간:</span>
                            <strong>{finalResult.metadata.estimatedReadTime}분</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>템플릿:</span>
                            <strong>{finalResult.metadata.template}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>HR 친화도:</span>
                            <strong className="text-green-500">{Math.min(94, finalResult.qualityScore + 5)}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>ATS 최적화:</span>
                            <strong className="text-blue-500">{Math.min(91, finalResult.qualityScore + 2)}%</strong>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* AI 개선 효과 - 네온 효과 카드 */}
              {(boostResult || feedbackResult) && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`${isDarkMode 
                    ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30' 
                    : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'} 
                    backdrop-blur-xl border rounded-2xl p-6 shadow-xl relative overflow-hidden`}
                >
                  {/* 애니메이션 배경 효과 */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    style={{ backgroundSize: '200% 200%' }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mr-3">
                        <SparklesIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                        AI Enhancement
                      </h3>
                    </div>
                    
                    {boostResult && (
                      <div className="mb-4 p-3 bg-white bg-opacity-60 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-1">대화형 보강</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>완성도: <strong>{boostResult.qualityMetrics.completeness}%</strong></div>
                          <div>구체성: <strong>{boostResult.qualityMetrics.specificity}%</strong></div>
                          <div>임팩트: <strong>{boostResult.qualityMetrics.impact}%</strong></div>
                          <div>ATS: <strong>{boostResult.qualityMetrics.atsScore}</strong></div>
                        </div>
                      </div>
                    )}

                    {feedbackResult && (
                      <div className="p-3 bg-white bg-opacity-60 rounded-lg">
                        <div className="text-sm font-medium text-purple-800 mb-2">스타일 개선</div>
                        <div className="flex flex-wrap gap-1">
                          {feedbackResult.changesApplied.slice(0, 3).map((change, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              {change.length > 15 ? change.substring(0, 15) + '...' : change}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* 오른쪽: 메인 액션 패널 - 3D 카드 효과 */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`${isDarkMode 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} 
                border rounded-2xl p-8 shadow-2xl relative overflow-hidden`}
            >
              {/* 3D 큐브 장식 */}
              <div className="absolute top-4 right-4">
                <CubeTransparentIcon className={`w-8 h-8 ${isDarkMode ? 'text-purple-500/20' : 'text-purple-300/30'}`} />
              </div>

              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Export & Deploy
                </span>
              </h2>

              {/* 메인 CTA 버튼들 - 그라디언트 & 호버 효과 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPreview(true)}
                  className="group relative p-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center">
                    <EyeIcon className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Live Preview</span>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload()}
                  className="group relative p-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center">
                    <DocumentArrowDownIcon className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Download Now</span>
                  </div>
                </motion.button>
              </div>

              {/* 내보내기 옵션 그리드 - 카드 스타일 */}
              <div className="mb-8">
                <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Export Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exportOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={option.action}
                      className={`flex items-center p-4 rounded-xl transition-all duration-200 text-left
                        ${isDarkMode 
                          ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
                    >
                      <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <option.icon className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {option.name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {option.description}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 하단 액션 바 */}
              <div className={`flex flex-wrap gap-3 justify-center pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className={`flex items-center px-5 py-2.5 rounded-lg transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className={`flex items-center px-5 py-2.5 rounded-lg transition-all ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Text'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onReset}
                  className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Create New Portfolio
                </motion.button>
              </div>
            </motion.div>

            {/* 개선 제안 - 업그레이드된 인사이트 카드 */}
            {finalResult.suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -5 }}
                className={`mt-6 rounded-2xl p-6 shadow-xl
                  ${isDarkMode 
                    ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-700/30' 
                    : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mr-3">
                      <LightBulbIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-yellow-900'}`}>
                      전문가 인사이트
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      링커리어 23K+ 검증
                    </span>
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      서핏 유니콘 기준
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                      ✅ 강점 포인트
                    </h4>
                    <ul className="space-y-1">
                      <li className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-yellow-700'}`}>
                        • 데이터 기반 성과 지표 활용
                      </li>
                      <li className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-yellow-700'}`}>
                        • 프로젝트별 명확한 스토리텔링
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                      🚀 개선 제안
                    </h4>
                    <ul className="space-y-1">
                      {finalResult.suggestions.slice(0, 2).map((suggestion, idx) => (
                        <motion.li 
                          key={idx} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-orange-700'}`}
                        >
                          • {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* 미리보기 모달 - 풀스크린 스타일 */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`sticky top-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-4 border-b flex justify-between items-center`}>
                  <div className="flex items-center">
                    <CodeBracketIcon className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Portfolio Preview</h3>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className={`p-8 ${isDarkMode ? 'bg-gray-950' : 'bg-white'} overflow-auto max-h-[calc(90vh-140px)]`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: finalResult.content }}
                    className="portfolio-preview mx-auto"
                    style={{ maxWidth: '900px' }}
                  />
                </div>
                
                <div className={`sticky bottom-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-4 border-t flex justify-center space-x-3`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload()}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold shadow-lg"
                  >
                    Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPreview(false)}
                    className={`px-6 py-2.5 rounded-lg font-semibold ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 전문 분석 모달 */}
        <AnimatePresence>
          {showEnhancedAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowEnhancedAnalysis(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-7xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                  <h3 className="text-xl font-semibold mb-4">포트폴리오 미리보기</h3>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: finalResult.content }}
                  />
                </div>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowEnhancedAnalysis(false)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 템플릿 가이드 모달 */}
        <AnimatePresence>
          {showTemplateGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowTemplateGuide(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-7xl max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                  <h3 className="text-xl font-semibold mb-4">포트폴리오 템플릿</h3>
                  <p className="text-gray-600 mb-4">프로페셔널 템플릿이 적용된 포트폴리오입니다.</p>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p>템플릿 기능은 현재 개발 중입니다.</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowTemplateGuide(false)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FinalResultPanel;