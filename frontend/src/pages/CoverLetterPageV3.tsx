import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserSpec } from '../services/coverLetterAnalysisService';
import { ComprehensiveStats, getComprehensiveStats } from '../services/comprehensiveAnalysisService';
import { CompanyCategoryOnlySelector } from '../components/CompanyCategoryOnlySelector';
import { CompanyCategory } from '../services/companyCategories';
import { CoverLetterQuestion, CoverLetterQuestionInput } from '../components/CoverLetterQuestionInput';
import { QuestionAIRecommendationCard } from '../components/QuestionAIRecommendationCard';
import { ComprehensiveStatsDashboard } from '../components/ComprehensiveStatsDashboard';
import { analyzeCoverLetterComplete } from '../services/aiRecommendationService';
import { generateCompleteFeedbackReport } from '../services/detailedFeedbackService';
import { generateFeedbackPDF } from '../services/pdfGenerationService';
import { CoverLetterChatbot } from '../components/CoverLetterChatbot';
import {
  RecommendedCompany,
  getRecommendedCompaniesByCategory
} from '../services/categoryBasedRecommendationService';
import { analyzeAllQuestions, QuestionAnalysis } from '../services/questionAnalysisService';
import { QuestionAnalysisPanel } from '../components/QuestionAnalysisPanel';
import { PositionStats, getPositionStats } from '../services/positionStatsService';
import { PositionStatsPanel } from '../components/PositionStatsPanel';
import { useAuth } from '../contexts/AuthContext';
import { markFreePdfUsed } from '../services/authService';
import { CustomTooltip } from '../components/CustomTooltip';
import { supabase } from '../lib/supabaseClient';
import Footer from '../components/Footer';
import LandingFooter from '../components/LandingFooter';
import { CustomAlert } from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';
import SubscribeModal from '../components/SubscribeModal';

const DEFAULT_QUESTIONS: Omit<CoverLetterQuestion, 'answer'>[] = [
  {
    id: 'q1',
    question: '지원 동기를 작성해주세요.',
    placeholder: '해당 회사/직무에 지원하게 된 이유와 본인의 목표를 구체적으로 작성해주세요...',
    maxLength: 1000,
  },
  {
    id: 'q2',
    question: '관련 경험이나 프로젝트를 설명해주세요.',
    placeholder: '지원하는 직무와 관련된 경험, 프로젝트, 활동 등을 구체적으로 작성해주세요...',
    maxLength: 1500,
  },
  {
    id: 'q3',
    question: '본인의 강점과 역량을 작성해주세요.',
    placeholder: '본인이 가진 강점과 역량을 구체적인 사례와 함께 작성해주세요...',
    maxLength: 1000,
  },
  {
    id: 'q4',
    question: '입사 후 포부와 목표를 작성해주세요.',
    placeholder: '입사 후 이루고 싶은 목표와 기여할 수 있는 부분을 작성해주세요...',
    maxLength: 800,
  },
];

export const CoverLetterPageV3: React.FC = () => {
  const { user, subscriptionInfo, refreshUser } = useAuth();
  const { alertState, hideAlert, success, error: showError, warning, info, confirm } = useAlert();
  const location = useLocation();
  const navigate = useNavigate();
  const editState = location.state as { editMode?: boolean; documentId?: number; savedData?: any } | null;

  // 디버깅: 구독 정보 확인
  console.log('📋 CoverLetterPageV3 - 구독 정보:', subscriptionInfo);
  console.log('📋 isPro:', subscriptionInfo.isPro, 'canUsePdfCorrection:', subscriptionInfo.canUsePdfCorrection);

  // URL 파라미터에서 guest mode 확인
  const searchParams = new URLSearchParams(location.search);
  const isGuestMode = searchParams.get('mode') === 'guest';

  // 기본 정보
  const [userSpec, setUserSpec] = useState<UserSpec>({
    targetCompany: '',
    referenceCategory: undefined,
    position: '',
    major: '',
    year: '',
    gpa: '',
    toeic: undefined,
    certificates: [],
    others: [],
  });

  const [documentId, setDocumentId] = useState<number | undefined>(editState?.documentId);

  // 로그인한 사용자의 프로필 데이터 불러오기 + 편집 모드 데이터 복원
  useEffect(() => {
    const loadUserProfile = async () => {
      // 게스트 모드에서는 프로필 로드 건너뛰기
      if (isGuestMode) return;

      if (!user) return;

      try {
        // 편집 모드인 경우 저장된 데이터 복원
        if (editState?.editMode && editState?.savedData) {
          const { userSpec: savedUserSpec, questions: savedQuestions } = editState.savedData;
          if (savedUserSpec) {
            setUserSpec(savedUserSpec);
          }
          if (savedQuestions) {
            setQuestions(savedQuestions);
          }
          return;
        }

        // 신규 작성 모드인 경우 프로필 데이터 로드
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.user_id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('프로필 로드 실패:', error);
          return;
        }

        if (data) {
          setUserSpec((prev) => ({
            ...prev,
            targetCompany: data.company || prev.targetCompany,
            position: data.position || prev.position,
            major: data.major || prev.major,
            year: data.grade || prev.year,
            gpa: data.gpa || prev.gpa,
            toeic: data.toeic ? parseInt(data.toeic) : prev.toeic,
            certificates: data.certificates && data.certificates.length > 0 ? data.certificates : prev.certificates,
            others: data.others && data.others.length > 0 ? data.others : prev.others,
            referenceCategory: data.categories && data.categories.length > 0 ? data.categories[0] as CompanyCategory : prev.referenceCategory,
          }));
        }
      } catch (error) {
        console.error('프로필 로드 중 오류:', error);
      }
    };

    loadUserProfile();
  }, [user, editState, isGuestMode]);

  const [questions, setQuestions] = useState<CoverLetterQuestion[]>(
    DEFAULT_QUESTIONS.map((q) => ({ ...q, answer: '' }))
  );
  const [focusedQuestionId, setFocusedQuestionId] = useState<string>('');

  // 추천 회사
  const [recommendedCompanies, setRecommendedCompanies] = useState<RecommendedCompany[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // 직무 통계
  const [positionStats, setPositionStats] = useState<PositionStats | null>(null);
  const [isLoadingPositionStats, setIsLoadingPositionStats] = useState(false);

  // 분석 상태
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [questionAnalyses, setQuestionAnalyses] = useState<QuestionAnalysis[]>([]);
  const [isLoadingQuestionAnalysis, setIsLoadingQuestionAnalysis] = useState(false);
  const [analyzingQuestionId, setAnalyzingQuestionId] = useState<string | null>(null);
  const [overallAnalysis, setOverallAnalysis] = useState<{
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  } | null>(null);

  // 첨삭 PDF 생성 상태
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // 로그인 확인 모달
  const [showLoginModal, setShowLoginModal] = useState(false);
  // 구독 모달
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // 페이지 로드 시 완료된 첨삭이 있는지 확인
  useEffect(() => {
    const completedFeedback = localStorage.getItem('feedbackCompleted');
    if (completedFeedback) {
      const { averageScore, totalQuestions, timestamp } = JSON.parse(completedFeedback);
      // 5분 이내 완성된 첨삭만 알림 표시 (오래된 알림 방지)
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - timestamp < fiveMinutes) {
        success(`✅ 첨삭이 완성되었습니다!\n\n다운로드가 완료되었습니다.\n평균 점수: ${averageScore}점\n상세 분석이 포함되어 있습니다.\n\n다운로드 폴더에서 확인하실 수 있습니다.`);
      }
      // 알림 표시 후 삭제
      localStorage.removeItem('feedbackCompleted');
    }
  }, []);

  // 질문 분석 자동 갱신을 위한 디바운스 타이머
  const questionAnalysisTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    const timers = questionAnalysisTimerRef.current;
    return () => {
      Object.values(timers).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  // 카테고리 + 직무가 입력되면 추천 회사 로드
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!userSpec.referenceCategory || !userSpec.position.trim()) {
        setRecommendedCompanies([]);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        const recommendations = await getRecommendedCompaniesByCategory(
          userSpec.referenceCategory as CompanyCategory,
          userSpec.position,
          5
        );
        setRecommendedCompanies(recommendations);
      } catch (error) {
        console.error('추천 회사 로드 실패:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    const timeoutId = setTimeout(loadRecommendations, 500);
    return () => clearTimeout(timeoutId);
  }, [userSpec.referenceCategory, userSpec.position]);

  // 직무가 입력되면 자동으로 종합 통계 및 직무 통계 로드
  useEffect(() => {
    const loadStats = async () => {
      if (!userSpec.position.trim()) {
        setComprehensiveStats(null);
        setPositionStats(null);
        return;
      }

      setIsLoadingStats(true);
      setIsLoadingPositionStats(true);
      try {
        const [stats, posStats] = await Promise.all([
          getComprehensiveStats(userSpec.position, true), // 익명화 스킵 - 속도 향상
          getPositionStats(userSpec.position),
        ]);
        setComprehensiveStats(stats);
        setPositionStats(posStats);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingPositionStats(false);
      }
    };

    const timeoutId = setTimeout(loadStats, 500);
    return () => clearTimeout(timeoutId);
  }, [userSpec.position]);

  const handleSpecChange = (field: keyof UserSpec, value: any) => {
    setUserSpec((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answer } : q))
    );
  };

  const handleQuestionChange = async (questionId: string, question: string) => {
    console.log('🔄 질문 수정 감지:', { questionId, question, position: userSpec.position });

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, question } : q))
    );

    // 질문이 수정되면 해당 질문의 분석 결과 자동 갱신
    if (userSpec.position.trim() && question.trim().length > 5) {
      // 기존 분석 결과가 있는 경우에만 자동 갱신
      const hasExistingAnalysis = questionAnalyses.some(a => a.questionId === questionId);

      console.log('📊 분석 상태 확인:', {
        hasPosition: !!userSpec.position.trim(),
        questionLength: question.trim().length,
        hasExistingAnalysis,
        currentAnalyses: questionAnalyses.length
      });

      if (hasExistingAnalysis) {
        console.log('✅ 자동 갱신 시작 - 1초 후 분석 예정');

        // 이전 타이머가 있으면 취소
        if (questionAnalysisTimerRef.current[questionId]) {
          clearTimeout(questionAnalysisTimerRef.current[questionId]);
          console.log('⏱️ 이전 타이머 취소');
        }

        // 새 타이머 설정 (1초 디바운스)
        questionAnalysisTimerRef.current[questionId] = setTimeout(async () => {
          try {
            console.log('🚀 질문 분석 API 호출 시작');
            const { analyzeQuestion } = await import('../services/questionAnalysisService');
            const analysis = await analyzeQuestion(question, questionId, userSpec.position);

            console.log('✅ 질문 분석 완료:', analysis);

            setQuestionAnalyses(prev => {
              const filtered = prev.filter(a => a.questionId !== questionId);
              return [...filtered, analysis];
            });

            // 타이머 정리
            delete questionAnalysisTimerRef.current[questionId];
          } catch (error) {
            console.error('❌ 질문 분석 자동 갱신 실패:', error);
            delete questionAnalysisTimerRef.current[questionId];
          }
        }, 1000);
      } else {
        console.log('ℹ️ 기존 분석 결과 없음 - 자동 갱신 건너뜀');
      }
    } else {
      console.log('⚠️ 자동 갱신 조건 미충족');
    }
  };

  const handleMaxLengthChange = (questionId: string, maxLength: number | undefined) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, maxLength } : q))
    );
  };

  const handleQuestionAdd = () => {
    const newQuestion: CoverLetterQuestion = {
      id: `q${Date.now()}`,
      question: '새로운 질문을 입력하세요',
      answer: '',
      placeholder: '답변을 작성해주세요...',
      maxLength: 1000,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleQuestionRemove = (questionId: string) => {
    if (questions.length <= 1) {
      warning('최소 1개의 질문은 필요합니다.');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleQuestionFocus = (questionId: string) => {
    setFocusedQuestionId(questionId);
  };

  const handleCertificateAdd = () => {
    const cert = prompt('자격증 이름을 입력하세요:');
    if (cert) {
      setUserSpec((prev) => ({
        ...prev,
        certificates: [...(prev.certificates || []), cert],
      }));
    }
  };

  const handleCertificateRemove = (index: number) => {
    setUserSpec((prev) => ({
      ...prev,
      certificates: (prev.certificates || []).filter((_, i) => i !== index),
    }));
  };

  const handleOtherAdd = () => {
    const other = prompt('기타 항목을 입력하세요:');
    if (other) {
      setUserSpec((prev) => ({
        ...prev,
        others: [...(prev.others || []), other],
      }));
    }
  };

  const handleOtherRemove = (index: number) => {
    setUserSpec((prev) => ({
      ...prev,
      others: (prev.others || []).filter((_, i) => i !== index),
    }));
  };

  const handleAnalyzeSingleQuestion = async (questionId: string) => {
    if (!userSpec.position.trim()) {
      warning('직무를 입력해주세요.');
      return;
    }

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setAnalyzingQuestionId(questionId);
    try {
      const { analyzeQuestion } = await import('../services/questionAnalysisService');
      const analysis = await analyzeQuestion(question.question, questionId, userSpec.position);

      // 기존 분석 결과 업데이트 또는 추가
      setQuestionAnalyses(prev => {
        const filtered = prev.filter(a => a.questionId !== questionId);
        return [...filtered, analysis];
      });

      // 우측 패널로 스크롤
      setTimeout(() => {
        const element = document.getElementById(`analysis-${questionId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      console.error('질문 분석 실패:', err);
      showError('질문 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzingQuestionId(null);
    }
  };

  const handleAnalyzeComplete = async () => {
    if (!userSpec.position.trim()) {
      warning('직무를 입력해주세요.');
      return;
    }

    const answeredQuestions = questions.filter((q) => q.answer.trim().length > 0);
    if (answeredQuestions.length === 0) {
      warning('최소 하나 이상의 질문에 답변해주세요.');
      return;
    }

    try {
      const analysis = await analyzeCoverLetterComplete(
        answeredQuestions.map((q) => ({ question: q.question, answer: q.answer })),
        userSpec.position
      );
      setOverallAnalysis(analysis);

      setTimeout(() => {
        document.getElementById('overall-analysis')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('종합 분석 실패:', err);
      showError('분석 중 오류가 발생했습니다.');
    }
  };

  // 상세 첨삭 PDF 생성
  const handleGenerateDetailedFeedback = async () => {
    // 비로그인 사용자(게스트 모드)는 첨삭 기능 사용 불가
    if (!user || isGuestMode) {
      setShowLoginModal(true);
      return;
    }

    // 프로 플랜 구독 체크
    if (!subscriptionInfo.isPro) {
      // 무료 사용자: 첨삭 1회만 가능
      if (!subscriptionInfo.canUsePdfCorrection) {
        // 이미 무료 첨삭을 사용한 경우 → 구독 모달 표시
        setShowSubscribeModal(true);
        return;
      }
      // 무료 첨삭 사용 가능한 경우 → 사용 후 기록할 예정
    }

    const answeredQuestions = questions.filter((q) => q.answer.trim());
    if (answeredQuestions.length === 0) {
      warning('최소 하나 이상의 질문에 답변해주세요.');
      return;
    }

    if (!userSpec.position.trim()) {
      warning('지원 직무를 입력해주세요.');
      return;
    }

    // 백그라운드 처리 안내
    info('첨삭 생성을 시작합니다.\n\n평균 2-3분 정도 소요됩니다.\n다른 페이지로 이동하셔도 괜찮습니다.\n완료 시 자동 다운로드 및 알림드립니다.');

    setIsGeneratingFeedback(true);

    // 백그라운드에서 실행 (비동기)
    (async () => {
      try {
        // 첨삭 리포트 생성 (각 질문당 최소 1페이지)
        const report = await generateCompleteFeedbackReport(
          answeredQuestions,
          userSpec.position,
          userSpec.gpa,
          userSpec.certificates,
          userSpec.toeic
        );

        // PDF 생성 및 다운로드
        await generateFeedbackPDF(
          report,
          user?.name,
          userSpec.targetCompany
        );

        // DB에 첨삭 결과 저장 (로그인한 사용자만)
        if (user) {
          try {
            console.log('📝 첨삭 결과 DB 저장 시작...', {
              user_id: user.user_id,
              company: userSpec.targetCompany,
              position: userSpec.position,
              score: report.averageScore
            });

            const feedbackData = {
              user_id: user.user_id,
              document_id: documentId || null,
              company_name: userSpec.targetCompany || '미입력',
              job_position: userSpec.position,
              category: userSpec.referenceCategory || null,
              user_specs: {
                major: userSpec.major,
                gpa: userSpec.gpa,
                toeic: userSpec.toeic,
                certificates: userSpec.certificates,
                others: userSpec.others,
              },
              questions: answeredQuestions.map(q => ({
                question: q.question,
                answer: q.answer,
                analysis: report.questionFeedbacks.find(f => f.question === q.question)
              })),
              overall_score: report.averageScore,
              strengths: report.questionFeedbacks.flatMap(f => f.contentAnalysis.strengths || []),
              weaknesses: report.questionFeedbacks.flatMap(f => f.contentAnalysis.weaknesses || []),
              suggestions: report.overallRecommendations || [],
              comparison_stats: report.questionFeedbacks.length > 0 ? {
                specComparison: report.questionFeedbacks[0].competitorComparison.specComparison,
                activityComparison: report.questionFeedbacks[0].competitorComparison.activityComparison,
                summary: report.questionFeedbacks[0].competitorComparison.summary
              } : null,
              missing_activities: report.questionFeedbacks.flatMap(f => f.competitorComparison.missingElements || []),
              pdf_url: null, // PDF는 로컬 다운로드이므로 null
              pdf_generated_at: new Date().toISOString(),
              feedback_type: 'comprehensive',
              is_complete: true,
            };

            console.log('📊 저장할 데이터:', feedbackData);

            const { data, error: feedbackError } = await supabase
              .from('cover_letter_feedback')
              .insert(feedbackData)
              .select();

            if (feedbackError) {
              console.error('❌ 첨삭 결과 DB 저장 실패:', feedbackError);
              console.error('에러 상세:', {
                message: feedbackError.message,
                details: feedbackError.details,
                hint: feedbackError.hint,
                code: feedbackError.code
              });

              // 테이블이 존재하지 않는 경우
              if (feedbackError.code === '42P01') {
                console.error('⚠️ cover_letter_feedback 테이블이 존재하지 않습니다. Supabase에서 SQL을 실행해주세요.');
              }
            } else {
              console.log('✅ 첨삭 결과가 DB에 저장되었습니다:', data);
            }
          } catch (dbErr: any) {
            console.error('❌ DB 저장 중 예외 발생:', dbErr);
            console.error('예외 상세:', {
              message: dbErr?.message,
              stack: dbErr?.stack
            });
          }
        } else {
          console.log('⚠️ 로그인하지 않은 사용자 - DB 저장 건너뜀');
        }

        // 무료 사용자의 경우 free_pdf_used를 true로 마킹
        if (!subscriptionInfo.isPro && user?.user_id) {
          const marked = await markFreePdfUsed(user.user_id);
          if (marked) {
            console.log('✅ 무료 첨삭 사용 기록 완료');
            // 사용자 정보 새로고침 (free_pdf_used 업데이트 반영)
            await refreshUser();
          } else {
            console.error('❌ 무료 첨삭 사용 기록 실패');
          }
        }

        // 다운로드 완료 정보를 localStorage에 저장 (다른 페이지에서도 알림 표시)
        localStorage.setItem('feedbackCompleted', JSON.stringify({
          averageScore: report.averageScore,
          totalQuestions: report.totalQuestions,
          timestamp: Date.now()
        }));

        // 현재 페이지에서 바로 알림 표시
        const successMessage = subscriptionInfo.isPro
          ? `✅ 첨삭이 완료되었습니다!\n\nPDF 다운로드가 완료되었습니다.\n평균 점수: ${report.averageScore}점\n\n다운로드 폴더에서 확인하실 수 있습니다.`
          : `✅ 첨삭이 완료되었습니다!\n\nPDF 다운로드가 완료되었습니다.\n평균 점수: ${report.averageScore}점\n\n무료 첨삭을 사용하셨습니다. 추가 첨삭은 프로 플랜 구독 후 이용 가능합니다.`;
        success(successMessage);
      } catch (err) {
        console.error('첨삭 생성 실패:', err);
        showError('첨삭 생성 중 오류가 발생했습니다. OpenAI API 키를 확인하거나 잠시 후 다시 시도해주세요.');
      } finally {
        setIsGeneratingFeedback(false);
      }
    })();
  };

  const currentInput = focusedQuestionId
    ? questions.find((q) => q.id === focusedQuestionId)?.answer || ''
    : '';

  const currentQuestion = focusedQuestionId
    ? questions.find((q) => q.id === focusedQuestionId)?.question
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to={user ? "/mypage" : "/"}>
                <img
                  src="/Careeroad_logo.png"
                  alt="Careeroad"
                  className="h-20 w-auto cursor-pointer"
                />
              </Link>
              <div className="border-l-2 border-gray-300 pl-4 py-1">
                <h1 className="text-xl font-bold text-gray-900">
                  AI 기반 자소서 작성 도우미
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  실제 합격자 데이터를 기반으로 실시간 피드백을 받으며 자소서를 작성하세요
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {!isGuestMode && (
                <>
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
                </>
              )}
              {isGuestMode ? (
                <button
                  onClick={() => {
                    window.location.href = '/signup';
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold whitespace-nowrap"
                >
                  회원가입하고 더 많은 기능 탐색하기
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!user) {
                      warning('로그인이 필요합니다.');
                      return;
                    }
                    try {
                      if (documentId) {
                        // 편집 모드: 업데이트
                        const { error } = await supabase
                          .from('user_documents')
                          .update({
                            title: `${userSpec.targetCompany || '회사'} ${userSpec.position || '직무'} 자소서`,
                            company_name: userSpec.targetCompany,
                            position: userSpec.position,
                            content: JSON.stringify({ userSpec, questions }),
                            updated_at: new Date().toISOString()
                          })
                          .eq('document_id', documentId);
                        if (error) throw error;
                        success('자소서가 수정되었습니다!');
                        setTimeout(() => navigate('/mypage'), 1500);
                      } else {
                        // 신규 작성 모드: 삽입
                        const { data, error } = await supabase
                          .from('user_documents')
                          .insert({
                            user_id: user.user_id,
                            title: `${userSpec.targetCompany || '회사'} ${userSpec.position || '직무'} 자소서`,
                            company_name: userSpec.targetCompany,
                            position: userSpec.position,
                            content: JSON.stringify({ userSpec, questions }),
                            status: 'draft'
                          })
                          .select()
                          .single();
                        if (error) throw error;
                        setDocumentId(data.document_id);
                        success('자소서가 저장되었습니다!');
                        setTimeout(() => navigate('/mypage'), 1500);
                      }
                    } catch (err) {
                      console.error('저장 오류:', err);
                      showError('저장 중 오류가 발생했습니다.');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
                >
                  저장하기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 정보 입력 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 왼쪽: 기본 정보 입력 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">정보 입력</h2>

              <div className="space-y-5">
                {/* 첫 번째 행: 지원 회사, 지원 직무 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지원 회사 *</label>
                    <input
                      type="text"
                      value={userSpec.targetCompany}
                      onChange={(e) => handleSpecChange('targetCompany', e.target.value)}
                      placeholder="예: 네이버, 카카오"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지원 직무 *</label>
                    <input
                      type="text"
                      value={userSpec.position}
                      onChange={(e) => handleSpecChange('position', e.target.value)}
                      placeholder="예: 백엔드 개발"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 두 번째 행: 학과, 학년, 학점, TOEIC */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
                    <input
                      type="text"
                      value={userSpec.major || ''}
                      onChange={(e) => handleSpecChange('major', e.target.value)}
                      placeholder="컴퓨터공학"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                    <select
                      value={userSpec.year || ''}
                      onChange={(e) => handleSpecChange('year', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                      <option value="졸업">졸업</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학점</label>
                    <input
                      type="text"
                      value={userSpec.gpa || ''}
                      onChange={(e) => handleSpecChange('gpa', e.target.value)}
                      placeholder="4.2/4.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TOEIC</label>
                    <input
                      type="number"
                      value={userSpec.toeic || ''}
                      onChange={(e) =>
                        handleSpecChange('toeic', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      placeholder="850"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 세 번째 행: 자격증, 기타 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">자격증</label>
                    <div className="flex flex-wrap gap-2">
                      {(userSpec.certificates || []).map((cert, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                          {cert}
                          <button
                            onClick={() => handleCertificateRemove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={handleCertificateAdd}
                        className="px-3 py-1 border border-dashed border-gray-400 rounded-full text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        + 추가
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기타</label>
                    <div className="flex flex-wrap gap-2">
                      {(userSpec.others || []).map((other, index) => (
                        <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-2">
                          {other}
                          <button
                            onClick={() => handleOtherRemove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={handleOtherAdd}
                        className="px-3 py-1 border border-dashed border-gray-400 rounded-full text-sm text-gray-600 hover:border-green-500 hover:text-green-500"
                      >
                        + 추가
                      </button>
                    </div>
                  </div>
                </div>

                {/* 카테고리 선택 */}
                <div className="pt-4 border-t border-gray-200">
                  <CompanyCategoryOnlySelector
                    selectedCategory={userSpec.referenceCategory as CompanyCategory | undefined}
                    onSelect={(category) => handleSpecChange('referenceCategory', category)}
                    label="참고 카테고리 (선택)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 직무 통계 */}
          <div className="lg:col-span-1">
            <PositionStatsPanel
              stats={positionStats}
              isLoading={isLoadingPositionStats}
            />
          </div>
        </div>

        {/* 메인 콘텐츠: 질문 답변 + AI 추천 */}
        <div className="mb-8 space-y-6">
          {questions.map((question, index) => {
            const questionAnalysis = questionAnalyses.find(qa => qa.questionId === question.id);

            return (
              <div key={question.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 좌측: 질문 답변 (2/3) */}
                <div className="lg:col-span-2">
                  <CoverLetterQuestionInput
                    questions={[question]}
                    questionIndex={index}
                    onAnswerChange={handleAnswerChange}
                    onQuestionChange={handleQuestionChange}
                    onMaxLengthChange={handleMaxLengthChange}
                    onQuestionRemove={questions.length > 1 ? handleQuestionRemove : undefined}
                    onFocus={handleQuestionFocus}
                    onAnalyzeQuestion={handleAnalyzeSingleQuestion}
                    analyzingQuestionId={analyzingQuestionId}
                  />
                </div>

                {/* 우측: 해당 질문의 AI 추천 (1/3) - Sticky */}
                <div className="lg:col-span-1 self-start">
                  <div className="sticky top-24">
                    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
                      <QuestionAIRecommendationCard
                        question={question}
                        questionIndex={index}
                        questionAnalysis={questionAnalysis}
                        position={userSpec.position}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 질문 추가 버튼 */}
          {handleQuestionAdd && (
            <button
              onClick={handleQuestionAdd}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              질문 추가하기
            </button>
          )}

          {/* 답변 종합 분석 및 첨삭 버튼 */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleAnalyzeComplete}
              disabled={!userSpec.position.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              답변 종합 분석
            </button>
            <CustomTooltip
              content="무료 플랜은 1회 무료 첨삭을 제공합니다. 추가 이용 시 구독이 필요합니다."
              visible={!subscriptionInfo.isPro}
              position="top"
            >
              <button
                onClick={handleGenerateDetailedFeedback}
                disabled={!userSpec.position.trim() || isGeneratingFeedback}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingFeedback ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    첨삭 생성 중...
                  </>
                ) : (
                  <>
                    📄 자소서 첨삭 받기 (PDF)
                  </>
                )}
              </button>
            </CustomTooltip>
          </div>
        </div>

        {/* 종합 분석 결과 */}
        {overallAnalysis && (
          <div id="overall-analysis" className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">종합 분석 결과</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 강점 */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  ✅ 강점 ({overallAnalysis.strengths.length})
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-700">• {strength}</li>
                  ))}
                </ul>
              </div>

              {/* 개선점 */}
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                  ⚠️ 개선점 ({overallAnalysis.improvements.length})
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-orange-700">• {improvement}</li>
                  ))}
                </ul>
              </div>

              {/* 추천사항 */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                  💡 추천 ({overallAnalysis.recommendations.length})
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 자소서 도우미 챗봇 */}
        <CoverLetterChatbot
          position={userSpec.position}
          currentAnswers={questions.map(q => ({
            question: q.question,
            answer: q.answer
          }))}
        />
      </div>
      {isGuestMode ? <LandingFooter /> : <Footer />}

      {/* 커스텀 Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />

      {/* 로그인 확인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h3>
              <p className="text-gray-600">
                자소서 첨삭은 로그인한 사용자만 사용할 수 있는 기능입니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login', { state: { from: location.pathname } });
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium shadow-lg"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구독 모달 */}
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
      />
    </div>
  );
};

export default CoverLetterPageV3;
