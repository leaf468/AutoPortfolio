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
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { GenerationResult } from '../services/oneClickGenerator';
import { BoostResult } from '../services/interactiveBooster';
import { FeedbackResult } from '../services/userFeedbackService';
import { portfolioTemplates } from '../templates/portfolioTemplates';

type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

interface FinalResultPanelProps {
  finalResult: GenerationResult;
  boostResult?: BoostResult;
  feedbackResult?: FeedbackResult;
  selectedTemplate?: TemplateType;
  onReset: () => void;
}

const FinalResultPanel: React.FC<FinalResultPanelProps> = ({
  finalResult,
  boostResult,
  feedbackResult,
  selectedTemplate = 'james',
  onReset
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // 기존 평가 불러오기
  useEffect(() => {
    try {
      const savedRating = localStorage.getItem(`portfolio_rating_${finalResult.id}`);
      if (savedRating) {
        const ratingData = JSON.parse(savedRating);
        setUserRating(ratingData.rating);
        setRatingSubmitted(true);
      }
    } catch (error) {
      console.error('기존 평가 불러오기 실패:', error);
    }
  }, [finalResult.id]);

  // 선택한 템플릿을 사용해서 실제 HTML 생성
  const generateTemplatedHTML = () => {
    try {
      const template = portfolioTemplates[selectedTemplate];
      if (template?.generateHTML) {
        // finalResult.content가 PortfolioDocument JSON이라면 파싱해서 사용
        let portfolioData;
        try {
          portfolioData = JSON.parse(finalResult.content);
          console.log('파싱된 포트폴리오 데이터:', portfolioData);

          // 1순위: 사용자가 편집한 extractedData 사용
          let extractedData = null;

          // metadata에서 extractedData 확인
          if (portfolioData.metadata?.extractedData) {
            extractedData = portfolioData.metadata.extractedData;
            console.log('메타데이터에서 추출된 데이터 사용:', extractedData);
          }

          // 블록에서 extractedData 확인
          if (!extractedData && portfolioData.sections?.[0]?.blocks?.[0]?.extractedData) {
            extractedData = portfolioData.sections[0].blocks[0].extractedData;
            console.log('블록에서 추출된 데이터 사용:', extractedData);
          }

          let templateData;

          if (extractedData) {
            // 사용자 편집 데이터를 최우선으로 사용, 템플릿 데이터는 마지막 대안으로만 사용
            templateData = {
              name: extractedData.name || '포트폴리오',
              title: extractedData.title || '개발자',
              contact: {
                email: extractedData.email || 'contact@example.com',
                phone: extractedData.phone || '',
                github: extractedData.github || '',
                blog: extractedData.blog || '',
                linkedin: extractedData.linkedin || ''
              },
              about: extractedData.about || '자기소개를 입력해주세요',
              skills: extractedData.skills?.length > 0 ? extractedData.skills : ['기술 스택을 입력해주세요'],
              projects: extractedData.projects?.length > 0 ? extractedData.projects : [{
                name: '프로젝트명을 입력해주세요',
                description: '프로젝트 설명을 입력해주세요',
                tech: ['사용 기술'],
                role: '역할',
                results: [],
                duration: '기간',
                link: ''
              }],
              experience: extractedData.experience?.length > 0 ? extractedData.experience : [{
                position: '직책을 입력해주세요',
                company: '회사명을 입력해주세요',
                duration: '기간을 입력해주세요',
                description: '경력 설명을 입력해주세요'
              }],
              education: extractedData.education?.length > 0 ? extractedData.education : [{
                school: '학교명을 입력해주세요',
                degree: '학위를 입력해주세요',
                period: '기간을 입력해주세요'
              }]
            };
          } else {
            // 기존 방식으로 섹션별 데이터 추출
            const headerSection = portfolioData.sections?.find((s: any) => s.type === 'header');
            const aboutSection = portfolioData.sections?.find((s: any) => s.type === 'about');
            const skillsSection = portfolioData.sections?.find((s: any) => s.type === 'skills');
            const experienceSection = portfolioData.sections?.find((s: any) => s.type === 'experience');
            const projectsSection = portfolioData.sections?.find((s: any) => s.type === 'projects');
            const educationSection = portfolioData.sections?.find((s: any) => s.type === 'education');

            templateData = {
              name: headerSection?.blocks?.[0]?.text || '포트폴리오',
              title: headerSection?.blocks?.[1]?.text || '개발자',
              contact: {
                email: 'contact@example.com',
                github: '',
                phone: '',
                blog: '',
                linkedin: ''
              },
              about: aboutSection?.blocks?.[0]?.text || '자기소개를 입력해주세요',
              skills: skillsSection?.blocks?.map((b: any) => b.text) || ['기술 스택을 입력해주세요'],
              skillCategories: [
                {
                  category: '프론트엔드',
                  skills: skillsSection?.blocks?.slice(0, 3)?.map((b: any) => b.text) || ['기술을 입력해주세요']
                },
                {
                  category: '백엔드',
                  skills: skillsSection?.blocks?.slice(3, 6)?.map((b: any) => b.text) || ['기술을 입력해주세요']
                }
              ],
              experience: experienceSection?.blocks?.map((b: any) => {
                const lines = b.text.split('\n');
                return {
                  position: lines[0] || '직책을 입력해주세요',
                  company: lines[1] || '회사명을 입력해주세요',
                  duration: lines[2] || '기간을 입력해주세요',
                  description: lines.slice(3).join('\n') || b.text || '경력 설명을 입력해주세요'
                };
              }) || [{
                position: '직책을 입력해주세요',
                company: '회사명을 입력해주세요',
                duration: '기간을 입력해주세요',
                description: '경력 설명을 입력해주세요'
              }],
              projects: projectsSection?.blocks?.map((b: any) => {
                const lines = b.text.split('\n');
                return {
                  name: lines[0] || '프로젝트명을 입력해주세요',
                  description: lines.slice(1).join('\n') || b.text || '프로젝트 설명을 입력해주세요',
                  tech: ['사용 기술'],
                  role: '역할',
                  results: [],
                  duration: '기간',
                  link: ''
                };
              }) || [{
                name: '프로젝트명을 입력해주세요',
                description: '프로젝트 설명을 입력해주세요',
                tech: ['사용 기술'],
                role: '역할',
                results: [],
                duration: '기간',
                link: ''
              }],
              education: educationSection?.blocks?.map((b: any) => {
                const lines = b.text.split('\n');
                return {
                  school: lines[0] || '학교명을 입력해주세요',
                  degree: lines[1] || '학위를 입력해주세요',
                  period: lines[2] || '기간을 입력해주세요'
                };
              }) || [{
                school: '학교명을 입력해주세요',
                degree: '학위를 입력해주세요',
                period: '기간을 입력해주세요'
              }]
            };
          }

          console.log('Using template:', selectedTemplate, 'with data:', templateData);
          return template.generateHTML(templateData);
          
        } catch (parseError) {
          console.error('JSON 파싱 실패:', parseError);
          // JSON 파싱에 실패하면 원본 HTML 내용을 그대로 반환
          return finalResult.content;
        }
      }
      return finalResult.content;
    } catch (error) {
      console.error('템플릿 HTML 생성 실패:', error);
      return finalResult.content;
    }
  };

  const handleDownload = (format?: string) => {
    if (finalResult) {
      const content = generateTemplatedHTML();
      const blob = new Blob([content], { 
        type: format === 'html' ? 'text/html' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-${finalResult.id}.${format || 'html'}`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = async () => {
    try {
      const textContent = generateTemplatedHTML().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  // 별점 평가 핸들러
  const handleRating = (rating: number) => {
    setUserRating(rating);
    setRatingSubmitted(true);

    // 평가 데이터 저장 (로컬 스토리지 또는 서버)
    const ratingData = {
      portfolioId: finalResult.id,
      rating: rating,
      timestamp: new Date().toISOString(),
      template: selectedTemplate
    };

    try {
      localStorage.setItem(`portfolio_rating_${finalResult.id}`, JSON.stringify(ratingData));
      console.log('사용자 평가 저장됨:', ratingData);
    } catch (error) {
      console.error('평가 저장 실패:', error);
    }
  };

  const handleRatingHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
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

  const getTotalImprovement = () => {
    let total = 0;
    if (boostResult) total += boostResult.improvementScore;
    if (feedbackResult) total += feedbackResult.improvementScore;
    return total;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">포트폴리오 완성!</h2>
          </div>
          <p className="text-lg text-gray-600">
            AI가 생성한 포트폴리오가 완성되었습니다. 미리보기를 확인하고 다운로드하세요.
          </p>
        </motion.div>

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 왼쪽: 통계 카드 */}
          <motion.div 
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* 품질 점수 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mr-3">
                    <StarIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">품질 점수</h3>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {finalResult.qualityScore}
                </div>
                <div className="text-sm text-gray-600">/ 100점</div>
                <div className="text-sm mt-2 text-green-600">
                  {finalResult.qualityScore >= 90 ? '최고급' : finalResult.qualityScore >= 80 ? '우수' : '양호'}
                </div>
              </div>

              {getTotalImprovement() > 0 && (
                <div className="mt-4 text-sm text-green-600 font-medium text-center">
                  총 개선: +{getTotalImprovement()}점
                </div>
              )}
            </div>

            {/* 통계 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
                포트폴리오 정보
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">단어 수:</span>
                  <strong className="text-gray-900">{finalResult.metadata.wordCount.toLocaleString()}개</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 읽기시간:</span>
                  <strong className="text-gray-900">{finalResult.metadata.estimatedReadTime}분</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">사용된 템플릿:</span>
                  <strong className="text-gray-900 capitalize">{selectedTemplate}</strong>
                </div>
              </div>
            </div>

            {/* 사용자 만족도 평가 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <StarIcon className="w-5 h-5 mr-2 text-yellow-600" />
                만족도 평가
              </h3>

              {!ratingSubmitted ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    생성된 포트폴리오에 대한 만족도를 평가해주세요
                  </p>

                  <div className="flex justify-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        onMouseEnter={() => handleRatingHover(star)}
                        onMouseLeave={handleRatingLeave}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        {star <= (hoverRating || userRating) ? (
                          <StarIconSolid className="w-8 h-8 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">
                    {hoverRating === 1 && "매우 불만족"}
                    {hoverRating === 2 && "불만족"}
                    {hoverRating === 3 && "보통"}
                    {hoverRating === 4 && "만족"}
                    {hoverRating === 5 && "매우 만족"}
                    {hoverRating === 0 && "별점을 클릭해주세요"}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className={`w-6 h-6 ${
                          star <= userRating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    평가해주셔서 감사합니다!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {userRating === 1 && "소중한 의견 감사합니다"}
                    {userRating === 2 && "더 나은 서비스를 위해 노력하겠습니다"}
                    {userRating === 3 && "의견을 반영하여 개선하겠습니다"}
                    {userRating === 4 && "만족스러운 결과를 제공할 수 있어 기쁩니다"}
                    {userRating === 5 && "최고의 평가 감사합니다!"}
                  </p>
                </div>
              )}
            </div>

            {/* AI 개선 효과 */}
            {(boostResult || feedbackResult) && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  AI 개선 효과
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
              </div>
            )}
          </motion.div>

          {/* 오른쪽: 메인 액션 */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                포트폴리오 다운로드 & 공유
              </h2>

              {/* 메인 액션 버튼들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setShowPreview(true)}
                  className="group flex items-center justify-center p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  <EyeIcon className="w-6 h-6 mr-2" />
                  미리보기
                </button>
                
                <button
                  onClick={() => handleDownload('html')}
                  className="group flex items-center justify-center p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  <DocumentArrowDownIcon className="w-6 h-6 mr-2" />
                  다운로드
                </button>
              </div>

              {/* 추가 옵션 */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-gray-700">추가 옵션</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center justify-center p-4 rounded-lg border transition-all ${
                      copied 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                    {copied ? '복사됨!' : '텍스트 복사'}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    <ShareIcon className="w-5 h-5 mr-2" />
                    공유하기
                  </button>

                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(generateTemplatedHTML());
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }
                    }}
                    className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    📄 PDF 출력
                  </button>
                </div>
              </div>

              {/* 하단 액션 */}
              <div className="flex justify-center pt-6 border-t border-gray-200">
                <button
                  onClick={onReset}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  새 포트폴리오 만들기
                </button>
              </div>
            </div>

            {/* 개선 제안 */}
            {finalResult.suggestions.length > 0 && (
              <div className="mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-bold text-yellow-900 mb-4">💡 전문가 제안</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-yellow-800">✅ 강점 포인트</h4>
                    <ul className="space-y-1">
                      <li className="text-sm text-yellow-700">• 데이터 기반 성과 지표 활용</li>
                      <li className="text-sm text-yellow-700">• 프로젝트별 명확한 스토리텔링</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-800">🚀 개선 제안</h4>
                    <ul className="space-y-1">
                      {finalResult.suggestions.slice(0, 2).map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-orange-700">
                          • {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
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
                className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">포트폴리오 미리보기</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-8 bg-white overflow-auto max-h-[calc(90vh-140px)]">
                  <div 
                    dangerouslySetInnerHTML={{ __html: generateTemplatedHTML() }}
                    className="portfolio-preview mx-auto"
                    style={{ maxWidth: '900px' }}
                  />
                </div>
                
                <div className="bg-gray-50 p-4 border-t flex justify-center space-x-3">
                  <button
                    onClick={() => handleDownload('html')}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold"
                  >
                    다운로드
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                  >
                    닫기
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