import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { aiOrganizer, OrganizedContent } from '../services/aiOrganizer';
import { trackButtonClick } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CustomAlert } from './CustomAlert';
import { useAlert } from '../hooks/useAlert';

interface AIOrganizerProps {
  onComplete: (organizedContent: OrganizedContent) => void;
}

const AIOrganizer: React.FC<AIOrganizerProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { alertState, hideAlert, success, error: showError, warning } = useAlert();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'freetext' | 'resume' | 'markdown'>('freetext');
  const [jobPosting, setJobPosting] = useState('');
  const [jobPosition, setJobPosition] = useState(''); // 직무 필드 추가
  const [isProcessing, setIsProcessing] = useState(false);
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [loadingCoverLetters, setLoadingCoverLetters] = useState(false);

  // 로그인 사용자의 직무 정보 불러오기
  useEffect(() => {
    if (user) {
      loadUserJobPosition();
    }
  }, [user]);

  const loadUserJobPosition = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('position')
        .eq('user_id', user.user_id)
        .maybeSingle();

      if (data && data.position) {
        setJobPosition(data.position);
      }
    } catch (error) {
    }
  };

  // 자소서 목록 불러오기
  const loadCoverLetters = async () => {
    if (!user) {
      warning('로그인이 필요합니다.');
      return;
    }

    setLoadingCoverLetters(true);
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverLetters(data || []);
      setShowCoverLetterModal(true);
    } catch (error) {
      showError('자소서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingCoverLetters(false);
    }
  };

  // 자소서 선택 및 내용 적용
  const handleSelectCoverLetter = (doc: any) => {
    try {
      const content = JSON.parse(doc.content || '{}');
      const questions = content.questions || [];

      // 질문에 대한 답변들을 하나의 텍스트로 합치기
      const combinedText = questions
        .map((q: any) => {
          if (q.answer && q.answer.trim()) {
            return `[${q.question}]\n${q.answer}\n`;
          }
          return '';
        })
        .filter((text: string) => text.length > 0)
        .join('\n');

      if (combinedText.trim()) {
        setInput(combinedText);

        // 기본 정보도 함께 불러오기 (회사명, 직무)
        if (doc.company_name) {
          setJobPosting(`회사: ${doc.company_name}${doc.position ? `\n직무: ${doc.position}` : ''}`);
          setShowJobPosting(true);
        }

        setShowCoverLetterModal(false);
        success('자소서 내용과 기본 정보를 불러왔습니다!');
      } else {
        warning('자소서에 작성된 답변이 없습니다.');
      }
    } catch (error) {
      showError('자소서 내용을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleOrganize = () => {
    if (!input.trim()) return;

    // 입력 길이 검증 (최소 50자 이상)
    const trimmedInput = input.trim();
    if (trimmedInput.length < 50) {
      setShowValidationModal(true);
      return;
    }

    // GA 이벤트 추적
    trackButtonClick('AI 분석 시작', 'OrganizeContentPage');


    // AI 처리 없이 바로 원본 데이터만 전달 (필수 필드들을 빈 값으로 채움)
    const rawData = {
      originalInput: {
        rawText: input,
        inputType: inputType,
        jobPosting: jobPosting.trim() || undefined,
        jobPosition: jobPosition.trim() || undefined
      },
      // 필수 필드들을 임시로 빈 값으로 채움
      oneLinerPitch: '',
      summary: '',
      experiences: [],
      projects: [],
      skills: [],
      education: [],
      achievements: [],
      keywords: {
        technical: [],
        soft: [],
        industry: [],
        ats: []
      },
      missingFields: [],
      improvementSuggestions: []
    };

    // 즉시 다음 페이지로 이동 (다음 페이지에서 AI 처리 진행)
    onComplete(rawData);
  };


  const inputTypes = [
    { value: 'freetext', label: '자유 텍스트', icon: DocumentTextIcon },
    { value: 'resume', label: '이력서', icon: ClipboardDocumentListIcon },
    { value: 'markdown', label: '마크다운', icon: DocumentTextIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto px-16 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex justify-center items-center mb-2">
          <SparklesIcon className="w-7 h-7 text-purple-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">정보 입력</h2>
        </div>
        <p className="text-sm text-gray-600">
          채용 관점에서 정보를 정리하고 핵심 성과를 추출합니다
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* 직무 입력 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            직무 (선택사항)
          </label>
          <input
            type="text"
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
            placeholder="예: 개발자, 기획자, 마케터, 은행원 등"
          />
          <p className="text-xs text-gray-500 mt-1">
            {user ? '로그인하신 경우 마이페이지의 직무 정보가 자동으로 반영됩니다.' : '직무를 입력하시면 맞춤형 포트폴리오를 생성해드립니다.'}
          </p>
        </div>

        {/* 입력 타입 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              입력 형식 선택
            </label>
            <div className="grid grid-cols-3 gap-3">
              {inputTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInputType(type.value as any)}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-1.5 transition-colors ${
                    inputType === type.value
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 메인 입력 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {inputType === 'freetext' && '자유롭게 경력, 프로젝트, 기술 등을 작성해주세요'}
              {inputType === 'resume' && '기존 이력서 내용을 붙여넣어주세요'}
              {inputType === 'markdown' && '마크다운 형식의 포트폴리오를 입력해주세요'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-80 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm"
              placeholder="예: 3년차 풀스택 개발자입니다. React와 Node.js로 쇼핑몰 플랫폼을 개발했고, 사용자 50% 증가와 매출 200% 상승에 기여했습니다..."
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1.5 gap-2">
              <div className="text-xs text-gray-500">
                {input.length} / 5000 글자
              </div>
              {user && (
                <button
                  onClick={loadCoverLetters}
                  disabled={loadingCoverLetters}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-purple-600 bg-white border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="sm:hidden">{loadingCoverLetters ? '불러오는 중...' : '자소서 불러오기'}</span>
                  <span className="hidden sm:inline">{loadingCoverLetters ? '불러오는 중...' : '작성한 자소서에서 불러오기'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 채용공고 추가 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                채용공고 (선택사항)
              </label>
              <button
                onClick={() => setShowJobPosting(!showJobPosting)}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                {showJobPosting ? '숨기기' : '추가하기'}
              </button>
            </div>

            {showJobPosting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <textarea
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                  className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm"
                  placeholder="지원하려는 채용공고 내용을 입력하면 맞춤형 최적화를 해드립니다..."
                />
              </motion.div>
            )}
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={handleOrganize}
            disabled={!input.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                AI 정리 및 포트폴리오 생성 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                포트폴리오 생성하기
              </>
            )}
          </button>
        </div>

        {/* 입력 검증 모달 */}
        {showValidationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  입력이 너무 적습니다
                </h3>
                <p className="text-gray-600 mb-2">
                  조금 더 구체적으로 작성해주세요.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  최소 50자 이상 입력해주시면<br />
                  더 나은 포트폴리오를 생성해드릴 수 있습니다.
                </p>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 자소서 선택 모달 */}
        <AnimatePresence>
          {showCoverLetterModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCoverLetterModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">작성한 자소서 선택</h3>
                  <button
                    onClick={() => setShowCoverLetterModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                  {coverLetters.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>작성한 자소서가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coverLetters.map((doc) => (
                        <button
                          key={doc.document_id}
                          onClick={() => handleSelectCoverLetter(doc)}
                          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                                {doc.title}
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>회사: {doc.company_name || '-'}</p>
                                <p>직무: {doc.position || '-'}</p>
                                <p className="text-xs text-gray-500">
                                  작성일: {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                            </div>
                            <DocumentArrowDownIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors ml-3 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Alert */}
        <CustomAlert
          isOpen={alertState.isOpen}
          onClose={hideAlert}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          confirmText={alertState.confirmText}
        />
    </div>
  );
};

export default AIOrganizer;