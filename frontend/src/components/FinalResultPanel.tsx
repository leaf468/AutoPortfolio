import React, { useState } from 'react';
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
  PrinterIcon
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
      // HTML 태그 제거하여 텍스트만 추출
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
      // Web Share API 미지원 시 클립보드에 복사
      handleCopy();
      alert('포트폴리오 링크가 클립보드에 복사되었습니다!');
    }
  };

  const exportOptions: ExportOption[] = [
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
        // PDF 변환은 브라우저의 인쇄 기능 사용
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
    <div className="max-w-6xl mx-auto p-6">
      {/* 성공 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center items-center mb-4">
          <div className="relative">
            <CheckCircleIcon className="w-20 h-20 text-green-600" />
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
              <StarIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎉 포트폴리오 완성!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI 기술을 활용해 전문적이고 매력적인 포트폴리오가 완성되었습니다
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 결과 통계 */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* 품질 점수 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold">최종 품질 점수</h3>
                </div>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 px-4 py-2 rounded-full ${getQualityColor(finalResult.qualityScore)}`}>
                  {finalResult.qualityScore}/100
                </div>
                {getTotalImprovement() > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    총 개선: +{getTotalImprovement()}점
                  </div>
                )}
              </div>

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
                        <strong>{finalResult.metadata.wordCount}</strong>
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
                        <span>형식:</span>
                        <strong>{finalResult.format.toUpperCase()}</strong>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 개선 효과 */}
            {(boostResult || feedbackResult) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
              >
                <h3 className="font-semibold text-blue-900 mb-4">
                  🚀 AI 개선 효과
                </h3>
                
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
              </motion.div>
            )}
          </div>
        </div>

        {/* 오른쪽: 액션 패널 */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-xl p-8"
          >
            <h2 className="text-2xl font-semibold mb-6">내보내기 & 활용하기</h2>
            
            {/* 빠른 액션 버튼들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                <EyeIcon className="w-5 h-5 mr-2" />
                포트폴리오 미리보기
              </button>
              
              <button
                onClick={() => handleDownload()}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                즉시 다운로드
              </button>
            </div>

            {/* 상세 내보내기 옵션 */}
            <div className="space-y-3 mb-8">
              <h3 className="font-medium text-gray-800">더 많은 내보내기 옵션</h3>
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="p-2 bg-gray-50 rounded-lg mr-3">
                    <option.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* 공유 & 추가 액션 */}
            <div className="flex flex-wrap gap-3 justify-center pt-6 border-t border-gray-200">
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ShareIcon className="w-4 h-4 mr-2" />
                공유하기
              </button>
              
              <button
                onClick={handleCopy}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                {copied ? '복사됨!' : '텍스트 복사'}
              </button>
              
              <button
                onClick={onReset}
                className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                새 포트폴리오 만들기
              </button>
            </div>
          </motion.div>

          {/* 개선 제안이 있는 경우 */}
          {finalResult.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-yellow-900 mb-3">💡 추가 개선 제안</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                {finalResult.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* 미리보기 모달 */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-5xl max-h-[90vh] overflow-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                <h3 className="text-lg font-semibold">포트폴리오 미리보기</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div 
                  dangerouslySetInnerHTML={{ __html: finalResult.content }}
                  className="portfolio-preview"
                  style={{ maxWidth: '100%', overflow: 'auto' }}
                />
              </div>
              
              <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 flex justify-center space-x-3 rounded-b-xl">
                <button
                  onClick={() => handleDownload()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  다운로드
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinalResultPanel;