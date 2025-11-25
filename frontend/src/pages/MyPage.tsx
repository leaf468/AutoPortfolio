import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { logout } from '../services/authService';
import { supabase } from '../lib/supabaseClient';
import Footer from '../components/Footer';
import {
  DocumentTextIcon,
  FolderOpenIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  UserCircleIcon,
  ClipboardDocumentCheckIcon,
  BriefcaseIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { CustomAlert } from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';
import { FeedbackDetailModal } from '../components/FeedbackDetailModal';
import { generateFeedbackPDF } from '../services/pdfGenerationService';
import SubscribeModal from '../components/SubscribeModal';
import { trackButtonClick } from '../utils/analytics';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, setUser, subscriptionInfo, refreshUser } = useAuth();
  const { setEditMode } = usePortfolio();
  const { alertState, hideAlert, success, error: showError, warning } = useAlert();
  const [activeTab, setActiveTab] = useState<'documents' | 'portfolios' | 'feedbacks' | 'jobs' | 'profile'>('documents');

  // 프로필 상태
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    birth_date: '',
    company: '',
    position: '',
    major: '',
    grade: '',
    gpa: '',
    toeic: '',
    github_url: '',
    blog_url: '',
    instagram_url: '',
  });
  const [certificates, setCertificates] = useState<string[]>(['']);
  const [others, setOthers] = useState<string[]>(['']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 자소서와 포트폴리오 데이터
  const [documents, setDocuments] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (user) {
      loadProfile();
      loadDocuments();
      loadPortfolios();
      loadFeedbacks();
      loadRecommendedJobs();
    }
  }, [user, loading, navigate]);

  // location.state가 변경될 때 포트폴리오 다시 불러오기 (저장 후 돌아왔을 때)
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.refresh && user) {
      loadPortfolios();
    }
  }, [location.state, user]);

  // 프로 플랜 버튼을 통해 로그인/회원가입한 경우 자동으로 구독 모달 열기
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.openSubscribe && user) {
      setShowSubscribeModal(true);
      // state를 초기화하여 새로고침 시 재실행 방지
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  const loadProfile = async () => {
    if (!user) return;

    // users 테이블에서 name 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', user.user_id)
      .single();

    if (userError) {
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.user_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return;
    }

    const userName = userData?.name || user.name;

    if (data) {
      setProfileData({
        name: userName,
        phone: data.phone || '',
        birth_date: data.birth_date || '',
        company: data.company || '',
        position: data.position || '',
        major: data.major || '',
        grade: data.grade || '',
        gpa: data.gpa || '',
        toeic: data.toeic || '',
        github_url: data.github_url || '',
        blog_url: data.blog_url || '',
        instagram_url: data.instagram_url || '',
      });
      setCertificates(data.certificates && data.certificates.length > 0 ? data.certificates : ['']);
      setOthers(data.others && data.others.length > 0 ? data.others : ['']);
      setSelectedCategories(data.categories || []);
    } else {
      // 프로필이 없으면 기본값으로 초기화
      setProfileData({
        name: userName,
        phone: '',
        birth_date: '',
        company: '',
        position: '',
        major: '',
        grade: '',
        gpa: '',
        toeic: '',
        github_url: '',
        blog_url: '',
        instagram_url: '',
      });
    }

    // AuthContext의 user 객체도 업데이트
    if (userData?.name && userData.name !== user.name) {
      setUser({ ...user, name: userData.name });
    }
  };

  const loadDocuments = async () => {
    if (!user) return;

    setIsLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadPortfolios = async () => {
    if (!user) return;

    setIsLoadingPortfolios(true);
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolios(data || []);
    } catch (error) {
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  const loadFeedbacks = async () => {
    if (!user) return;

    setIsLoadingFeedbacks(true);
    try {
      const { data, error } = await supabase
        .from('cover_letter_feedback')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const loadRecommendedJobs = async () => {
    if (!user) return;

    setIsLoadingJobs(true);
    try {
      // 사용자 프로필에서 직무와 카테고리 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('position, categories')
        .eq('user_id', user.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData?.position && (!profileData?.categories || profileData.categories.length === 0)) {
        setRecommendedJobs([]);
        return;
      }

      // 자소서 DB에서 추천 회사 가져오기 (categoryBasedRecommendationService와 동일한 로직)
      const { getRecommendedCompaniesByCategory } = await import('../services/categoryBasedRecommendationService');

      // 카테고리가 있으면 해당 카테고리의 회사들 추천
      if (profileData.categories && profileData.categories.length > 0) {
        const allRecommendations = [];
        for (const category of profileData.categories) {
          const recommendations = await getRecommendedCompaniesByCategory(
            category,
            profileData.position || '',
            5
          );
          allRecommendations.push(...recommendations);
        }

        // 매치 스코어 순으로 정렬하고 중복 제거
        const uniqueRecommendations = allRecommendations
          .filter((rec, index, self) =>
            index === self.findIndex((r) => r.companyName === rec.companyName)
          )
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        setRecommendedJobs(uniqueRecommendations);
      } else {
        setRecommendedJobs([]);
      }
    } catch (error) {
      setRecommendedJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    trackButtonClick('프로필 저장', 'MyPage');
    if (!user) return;

    setIsSaving(true);
    try {
      const { name, ...profileFields } = profileData;

      // users 테이블의 name과 email 업데이트
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: profileData.name,
        })
        .eq('user_id', user.user_id);

      if (userError) throw userError;

      // user_profiles 업데이트 또는 생성
      const profileUpdateData = {
        phone: profileFields.phone || null,
        birth_date: profileFields.birth_date || null,
        company: profileFields.company || null,
        position: profileFields.position || null,
        major: profileFields.major || null,
        grade: profileFields.grade || null,
        gpa: profileFields.gpa || null,
        toeic: profileFields.toeic || null,
        github_url: profileFields.github_url || null,
        blog_url: profileFields.blog_url || null,
        instagram_url: profileFields.instagram_url || null,
        certificates: certificates.filter(c => c.trim() !== ''),
        others: others.filter(o => o.trim() !== ''),
        categories: selectedCategories,
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.user_id,
          ...profileUpdateData,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      success('프로필이 저장되었습니다.');
      setIsEditing(false);
      loadProfile(); // 프로필 다시 로드
    } catch (err) {
      showError('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    trackButtonClick('로그아웃', 'MyPage');
    await logout();
    setUser(null); // AuthContext의 user 상태를 null로 설정
    navigate('/');
  };

  const handleCancelSubscription = async () => {
    trackButtonClick('구독 취소', 'MyPage');
    if (!user) return;

    setIsCancellingSubscription(true);
    try {
      // DB에서 subscription_cancelled를 true로 업데이트 (pay는 유지)
      const { error } = await supabase
        .from('users')
        .update({ subscription_cancelled: true })
        .eq('user_id', user.user_id);

      if (error) {
        // subscription_cancelled 컬럼이 없는 경우 (42703 에러)
        if ((error as any).code === '42703') {
          // 로컬 상태만 업데이트 (DB 컬럼이 추가될 때까지 임시 처리)
          // refreshUser를 호출하면 DB에서 다시 조회하므로 취소 상태가 사라짐
          const updatedUser = { ...user, subscription_cancelled: true };
          setUser(updatedUser);
          setShowCancelConfirmModal(false);
          success('구독이 취소되었습니다. 현재 구독 기간이 만료될 때까지 프리미엄 기능을 사용하실 수 있습니다.');
          return;
        }
        throw error;
      }

      // AuthContext의 user 상태 업데이트
      setUser({ ...user, subscription_cancelled: true });

      // refreshUser를 호출하여 구독 정보 갱신
      await refreshUser();

      setShowCancelConfirmModal(false);
      success('구독이 취소되었습니다. 현재 구독 기간이 만료될 때까지 프리미엄 기능을 사용하실 수 있습니다.');
    } catch (error) {
      showError('구독 취소 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    trackButtonClick('계정 삭제', 'MyPage');
    if (!user) return;

    const confirmed = window.confirm(
      '정말로 회원 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.'
    );

    if (!confirmed) return;

    try {
      // Supabase Auth 사용자 삭제
      const { error: authError } = await supabase.auth.admin.deleteUser(user.user_id);

      // users 테이블에서도 삭제 (CASCADE로 관련 데이터 자동 삭제)
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);

      if (authError || dbError) {
        throw authError || dbError;
      }

      success('회원 탈퇴가 완료되었습니다.');
      await logout();
      setUser(null); // AuthContext의 user 상태를 null로 설정
      navigate('/');
    } catch (error) {
      showError('회원 탈퇴 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadPDF = async () => {
    trackButtonClick('첨삭 PDF 다운로드', 'MyPage');
    if (!selectedFeedback) return;

    try {

      // DB에서 불러온 데이터를 PDF 생성 형식에 맞게 변환
      const report = {
        position: selectedFeedback.job_position,
        averageScore: selectedFeedback.overall_score,
        totalQuestions: selectedFeedback.questions.length,
        createdAt: selectedFeedback.created_at,
        questionFeedbacks: selectedFeedback.questions.map((q: any, index: number) => {
          // 기본 구조 생성 (모든 필드 포함)
          const analysis = q.analysis || {};

          return {
            questionNumber: index + 1,
            question: q.question,
            answer: q.answer,
            userAnswer: q.answer,
            overallScore: analysis.overallScore || 0,
            overallSummary: analysis.overallSummary || '',

            // 구조 분석
            structureAnalysis: {
              totalScore: analysis.structureAnalysis?.totalScore || 0,
              logic: analysis.structureAnalysis?.logic || { score: 0, feedback: '' },
              consistency: analysis.structureAnalysis?.consistency || { score: 0, feedback: '' },
              completeness: analysis.structureAnalysis?.completeness || { score: 0, feedback: '' },
              suggestions: analysis.structureAnalysis?.suggestions || []
            },

            // 내용 분석
            contentAnalysis: {
              totalScore: analysis.contentAnalysis?.totalScore || 0,
              specificity: analysis.contentAnalysis?.specificity || { score: 0, feedback: '' },
              relevance: analysis.contentAnalysis?.relevance || { score: 0, feedback: '' },
              differentiation: analysis.contentAnalysis?.differentiation || { score: 0, feedback: '' },
              strengths: analysis.contentAnalysis?.strengths || [],
              weaknesses: analysis.contentAnalysis?.weaknesses || []
            },

            // 표현력 분석
            expressionAnalysis: {
              totalScore: analysis.expressionAnalysis?.totalScore || 0,
              writing: analysis.expressionAnalysis?.writing || { score: 0, feedback: '' },
              vocabulary: analysis.expressionAnalysis?.vocabulary || { score: 0, feedback: '' },
              readability: analysis.expressionAnalysis?.readability || { score: 0, feedback: '' },
              improvements: analysis.expressionAnalysis?.improvements || []
            },

            // 직무 적합성 분석
            jobFitAnalysis: {
              totalScore: analysis.jobFitAnalysis?.totalScore || 0,
              expertise: analysis.jobFitAnalysis?.expertise || { score: 0, feedback: '' },
              passion: analysis.jobFitAnalysis?.passion || { score: 0, feedback: '' },
              growth: analysis.jobFitAnalysis?.growth || { score: 0, feedback: '' }
            },

            // 경쟁자 비교
            competitorComparison: {
              specComparison: analysis.competitorComparison?.specComparison || selectedFeedback.comparison_stats?.specComparison || {
                gpa: '',
                toeic: '',
                certificates: ''
              },
              activityComparison: analysis.competitorComparison?.activityComparison || selectedFeedback.comparison_stats?.activityComparison || {
                quantity: '',
                quality: '',
                relevance: ''
              },
              summary: analysis.competitorComparison?.summary || selectedFeedback.comparison_stats?.summary || '',
              missingElements: analysis.competitorComparison?.missingElements || [],
              recommendations: analysis.competitorComparison?.recommendations || []
            },

            // 수정 제안
            revisedVersion: analysis.revisedVersion || '',
            keyImprovements: analysis.keyImprovements || []
          };
        }),
        overallRecommendations: selectedFeedback.suggestions || [],
      };


      // Generate and download PDF
      // generateFeedbackPDF(report, userName?, targetCompany?)
      await generateFeedbackPDF(report, user?.name, selectedFeedback.company_name);
      success('PDF가 다운로드되었습니다.');
    } catch (error) {
      showError('PDF 다운로드에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-4 sm:space-x-8 w-full sm:w-auto">
              {/* 로고 - 로그인 상태에서는 마이페이지로 이동 */}
              <Link to="/mypage" className="flex items-center space-x-2">
                <img src="/Careeroad_logo.png" alt="Careeroad" className="h-10 sm:h-12 md:h-14" />
              </Link>

              {/* 네비게이션 버튼들 - 모바일에서 숨김 */}
              <nav className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => navigate('/cover-letter')}
                  className="px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                >
                  자기소개서 작성하기
                </button>
                <button
                  onClick={() => navigate('/template-selection')}
                  className="px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                >
                  포트폴리오 만들기
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">로그아웃</span>
              </button>
            </div>
          </div>

          {/* 모바일 네비게이션 - md 이하에서만 표시 */}
          <nav className="flex md:hidden items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => navigate('/cover-letter')}
              className="flex-1 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-center"
            >
              자기소개서 작성
            </button>
            <button
              onClick={() => navigate('/template-selection')}
              className="flex-1 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-center"
            >
              포트폴리오 만들기
            </button>
          </nav>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 border-b-2 transition whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">내 자소서</span>
            </button>
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 border-b-2 transition whitespace-nowrap ${
                activeTab === 'portfolios'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FolderOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">내 포트폴리오</span>
            </button>
            <button
              onClick={() => setActiveTab('feedbacks')}
              className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 border-b-2 transition whitespace-nowrap ${
                activeTab === 'feedbacks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">첨삭 결과</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 border-b-2 transition whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">프로필 설정</span>
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">내 자소서</h2>
              <button
                onClick={() => navigate('/cover-letter')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 자소서 작성하기
              </button>
            </div>
            {isLoadingDocuments ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                로딩 중...
              </div>
            ) : documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                작성한 자소서가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <DocumentTextIcon className="w-8 h-8 text-blue-600 flex-shrink-0" />
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          자소서
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{doc.title}</h3>
                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium mr-1">회사:</span> {doc.company_name || '-'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium mr-1">직무:</span> {doc.position || '-'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <div className="flex gap-2 pt-3 border-t border-blue-100">
                        <button
                          onClick={() => {
                            // 자소서 편집 - 저장된 데이터를 복원하여 작성 페이지로 이동
                            const content = JSON.parse(doc.content || '{}');
                            navigate('/cover-letter-basic', { state: { editMode: true, documentId: doc.document_id, savedData: content } });
                          }}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          편집
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                              const { error } = await supabase
                                .from('user_documents')
                                .delete()
                                .eq('document_id', doc.document_id);
                              if (!error) {
                                loadDocuments();
                              }
                            }
                          }}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium text-sm flex items-center justify-center"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolios' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">내 포트폴리오</h2>
              <button
                onClick={() => navigate('/template-selection')}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 포트폴리오 만들기
              </button>
            </div>
            {isLoadingPortfolios ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                로딩 중...
              </div>
            ) : portfolios.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                저장된 포트폴리오가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.portfolio_id}
                    className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <FolderOpenIcon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                          포트폴리오
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{portfolio.title}</h3>
                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium mr-1">템플릿:</span>
                          <span className="capitalize">{portfolio.template_type || '없음'}</span>
                        </p>
                        {portfolio.published !== undefined && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="font-medium mr-1">상태:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${portfolio.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {portfolio.published ? '공개' : '비공개'}
                            </span>
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <div className="flex gap-2 pt-3 border-t border-purple-100">
                        <button
                          onClick={() => {
                            // 포트폴리오 편집 - DB 데이터를 직접 로드하여 편집 페이지로 이동
                            // autofill 단계를 우회하고 바로 편집 페이지로
                            if (portfolio.template_type) {
                              navigate(`/edit/${portfolio.template_type}`, {
                                state: {
                                  portfolioData: portfolio,
                                  editMode: true
                                }
                              });
                            } else {
                              showError('템플릿 정보를 찾을 수 없습니다.');
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          편집
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                              const { error } = await supabase
                                .from('portfolios')
                                .delete()
                                .eq('portfolio_id', portfolio.portfolio_id);
                              if (!error) {
                                loadPortfolios();
                              }
                            }
                          }}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium text-sm flex items-center justify-center"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedbacks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">자소서 첨삭 결과</h2>
            </div>
            {isLoadingFeedbacks ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                로딩 중...
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <ClipboardDocumentCheckIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-700 mb-2">첨삭 결과가 없습니다</p>
                <p className="text-sm text-gray-500">자소서를 작성하고 AI 첨삭을 받아보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.feedback_id}
                    className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div className="flex items-center space-x-2">
                          {feedback.overall_score && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                              {feedback.overall_score}점
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {feedback.company_name} - {feedback.job_position}
                      </h3>
                      <div className="space-y-1 mb-4">
                        {feedback.category && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="font-medium mr-1">카테고리:</span> {feedback.category}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(feedback.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <div className="flex gap-2 pt-3 border-t border-green-100">
                        <button
                          onClick={() => setSelectedFeedback(feedback)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          상세보기
                        </button>
                        <button
                          onClick={async () => {
                            // PDF 다운로드
                            try {

                              // DB에서 불러온 데이터를 PDF 생성 형식에 맞게 변환
                              const report = {
                                position: feedback.job_position,
                                averageScore: feedback.overall_score,
                                totalQuestions: feedback.questions.length,
                                createdAt: feedback.created_at,
                                questionFeedbacks: feedback.questions.map((q: any, index: number) => {
                                  const analysis = q.analysis || {};

                                  return {
                                    questionNumber: index + 1,
                                    question: q.question,
                                    answer: q.answer,
                                    userAnswer: q.answer,
                                    overallScore: analysis.overallScore || 0,
                                    overallSummary: analysis.overallSummary || '',

                                    structureAnalysis: {
                                      totalScore: analysis.structureAnalysis?.totalScore || 0,
                                      logic: analysis.structureAnalysis?.logic || { score: 0, feedback: '' },
                                      consistency: analysis.structureAnalysis?.consistency || { score: 0, feedback: '' },
                                      completeness: analysis.structureAnalysis?.completeness || { score: 0, feedback: '' },
                                      suggestions: analysis.structureAnalysis?.suggestions || []
                                    },

                                    contentAnalysis: {
                                      totalScore: analysis.contentAnalysis?.totalScore || 0,
                                      specificity: analysis.contentAnalysis?.specificity || { score: 0, feedback: '' },
                                      relevance: analysis.contentAnalysis?.relevance || { score: 0, feedback: '' },
                                      differentiation: analysis.contentAnalysis?.differentiation || { score: 0, feedback: '' },
                                      strengths: analysis.contentAnalysis?.strengths || [],
                                      weaknesses: analysis.contentAnalysis?.weaknesses || []
                                    },

                                    expressionAnalysis: {
                                      totalScore: analysis.expressionAnalysis?.totalScore || 0,
                                      writing: analysis.expressionAnalysis?.writing || { score: 0, feedback: '' },
                                      vocabulary: analysis.expressionAnalysis?.vocabulary || { score: 0, feedback: '' },
                                      readability: analysis.expressionAnalysis?.readability || { score: 0, feedback: '' },
                                      improvements: analysis.expressionAnalysis?.improvements || []
                                    },

                                    jobFitAnalysis: {
                                      totalScore: analysis.jobFitAnalysis?.totalScore || 0,
                                      expertise: analysis.jobFitAnalysis?.expertise || { score: 0, feedback: '' },
                                      passion: analysis.jobFitAnalysis?.passion || { score: 0, feedback: '' },
                                      growth: analysis.jobFitAnalysis?.growth || { score: 0, feedback: '' }
                                    },

                                    competitorComparison: {
                                      specComparison: analysis.competitorComparison?.specComparison || feedback.comparison_stats?.specComparison || {
                                        gpa: '',
                                        toeic: '',
                                        certificates: ''
                                      },
                                      activityComparison: analysis.competitorComparison?.activityComparison || feedback.comparison_stats?.activityComparison || {
                                        quantity: '',
                                        quality: '',
                                        relevance: ''
                                      },
                                      summary: analysis.competitorComparison?.summary || feedback.comparison_stats?.summary || '',
                                      missingElements: analysis.competitorComparison?.missingElements || [],
                                      recommendations: analysis.competitorComparison?.recommendations || []
                                    },

                                    revisedVersion: analysis.revisedVersion || '',
                                    keyImprovements: analysis.keyImprovements || []
                                  };
                                }),
                                overallRecommendations: feedback.suggestions || [],
                              };

                              await generateFeedbackPDF(report, user?.name, feedback.company_name);
                              success('PDF가 다운로드되었습니다.');
                            } catch (error) {
                              showError('PDF 다운로드에 실패했습니다.');
                            }
                          }}
                          className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium text-sm flex items-center justify-center"
                          title="PDF 다운로드"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('이 첨삭 결과를 삭제하시겠습니까?')) {
                              const { error } = await supabase
                                .from('cover_letter_feedback')
                                .delete()
                                .eq('feedback_id', feedback.feedback_id);

                              if (!error) {
                                success('첨삭 결과가 삭제되었습니다.');
                                loadFeedbacks();
                              } else {
                                showError('삭제에 실패했습니다.');
                              }
                            }
                          }}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium text-sm flex items-center justify-center"
                          title="삭제"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">프로필 설정</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  편집하기
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </div>

            {/* 구독 상태 카드 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-6 border-2 border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    {subscriptionInfo.isCancelled ? (
                      <>
                        <span className="mr-2">⏸️</span>
                        구독 취소됨 (기한 내 사용 가능)
                      </>
                    ) : subscriptionInfo.isPro ? (
                      <>
                        <span className="mr-2">👑</span>
                        프로 플랜 구독 중
                      </>
                    ) : subscriptionInfo.status === 'expired' ? (
                      <>
                        <span className="mr-2">⏰</span>
                        구독 만료됨
                      </>
                    ) : (
                      '무료 플랜'
                    )}
                  </h3>
                  {subscriptionInfo.isCancelled ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        ✅ 모든 프리미엄 기능 이용 가능 (취소 예약됨)
                      </p>
                      {user?.last_pay_date && (
                        <p className="text-sm text-gray-600">
                          결제일: {new Date(user.last_pay_date).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      {subscriptionInfo.expiresAt && (
                        <p className="text-sm text-orange-600 font-medium">
                          만료일: {new Date(subscriptionInfo.expiresAt).toLocaleDateString('ko-KR')}
                          {subscriptionInfo.daysRemaining !== null && (
                            <span className="ml-2">
                              (D-{subscriptionInfo.daysRemaining})
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        만료일까지 모든 프리미엄 기능을 계속 사용하실 수 있습니다.
                      </p>
                    </div>
                  ) : subscriptionInfo.isPro ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        ✅ 모든 프리미엄 기능 이용 가능
                      </p>
                      {user?.last_pay_date && (
                        <p className="text-sm text-gray-600">
                          결제일: {new Date(user.last_pay_date).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      {subscriptionInfo.expiresAt && (
                        <p className="text-sm text-gray-600">
                          만료일: {new Date(subscriptionInfo.expiresAt).toLocaleDateString('ko-KR')}
                          {subscriptionInfo.daysRemaining !== null && (
                            <span className="ml-2 text-purple-600 font-medium">
                              (D-{subscriptionInfo.daysRemaining})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  ) : subscriptionInfo.status === 'expired' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        구독이 만료되었습니다.
                      </p>
                      <p className="text-sm text-orange-600 font-medium">
                        다시 구독하시면 프리미엄 기능을 이용하실 수 있습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        자소서 AI 작성, 기본 템플릿, PDF 다운로드
                      </p>
                      {!subscriptionInfo.canUsePdfCorrection && (
                        <p className="text-sm text-orange-600 font-medium">
                          ⚠️ 무료 첨삭 사용 완료
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {subscriptionInfo.isCancelled ? (
                    <button
                      onClick={() => setShowSubscribeModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      다시 구독하기
                    </button>
                  ) : subscriptionInfo.isPro ? (
                    <button
                      onClick={() => setShowCancelConfirmModal(true)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
                    >
                      구독 취소
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubscribeModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      프로 플랜 구독하기
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="홍길동"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">이메일은 수정할 수 없습니다</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    생년월일
                  </label>
                  <input
                    type="date"
                    value={profileData.birth_date}
                    onChange={(e) => handleProfileChange('birth_date', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* 지원 정보 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">지원 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지원 회사
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => handleProfileChange('company', e.target.value)}
                    disabled={!isEditing}
                    placeholder="예: 네이버, 카카오"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지원 직무
                  </label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => handleProfileChange('position', e.target.value)}
                    disabled={!isEditing}
                    placeholder="예: 백엔드 개발"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* 학력 정보 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">학력 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학과
                  </label>
                  <input
                    type="text"
                    value={profileData.major}
                    onChange={(e) => handleProfileChange('major', e.target.value)}
                    disabled={!isEditing}
                    placeholder="컴퓨터공학"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학년
                  </label>
                  <select
                    value={profileData.grade}
                    onChange={(e) => handleProfileChange('grade', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학점
                  </label>
                  <input
                    type="text"
                    value={profileData.gpa}
                    onChange={(e) => handleProfileChange('gpa', e.target.value)}
                    disabled={!isEditing}
                    placeholder="4.2/4.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TOEIC
                  </label>
                  <input
                    type="text"
                    value={profileData.toeic}
                    onChange={(e) => handleProfileChange('toeic', e.target.value)}
                    disabled={!isEditing}
                    placeholder="850"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* SNS 링크 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SNS 링크</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={profileData.github_url}
                    onChange={(e) => handleProfileChange('github_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    블로그
                  </label>
                  <input
                    type="url"
                    value={profileData.blog_url}
                    onChange={(e) => handleProfileChange('blog_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://blog.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={profileData.instagram_url}
                    onChange={(e) => handleProfileChange('instagram_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://instagram.com/username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* 자격증 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">자격증</h3>
              <div className="space-y-3">
                {certificates.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const newCerts = [...certificates];
                        newCerts[index] = e.target.value;
                        setCertificates(newCerts);
                      }}
                      disabled={!isEditing}
                      placeholder="자격증 이름"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                    />
                    {isEditing && (
                      <button
                        onClick={() => setCertificates(certificates.filter((_, i) => i !== index))}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => setCertificates([...certificates, ''])}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 w-full"
                  >
                    + 추가
                  </button>
                )}
              </div>
            </div>

            {/* 기타 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기타</h3>
              <div className="space-y-3">
                {others.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newOthers = [...others];
                        newOthers[index] = e.target.value;
                        setOthers(newOthers);
                      }}
                      disabled={!isEditing}
                      placeholder="기타 항목"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                    />
                    {isEditing && (
                      <button
                        onClick={() => setOthers(others.filter((_, i) => i !== index))}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => setOthers([...others, ''])}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 w-full"
                  >
                    + 추가
                  </button>
                )}
              </div>
            </div>

            {/* 주의 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ 주의</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">회원 탈퇴</p>
                  <p className="text-sm text-red-700">
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>회원 탈퇴</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">회원 탈퇴</h3>
            <p className="text-gray-700 mb-6">
              정말로 회원 탈퇴하시겠습니까?<br/>
              <span className="text-red-600 font-semibold">모든 데이터가 삭제되며 복구할 수 없습니다.</span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
      />

      {/* Feedback Detail Modal */}
      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Subscribe Modal */}
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
      />

      {/* 구독 취소 확인 모달 */}
      {showCancelConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowCancelConfirmModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="relative p-6 pb-4">
              <button
                onClick={() => setShowCancelConfirmModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  구독 취소
                </h3>
              </div>
            </div>

            {/* 내용 */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  구독을 취소하시겠습니까?
                </p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  취소하시더라도 현재 구독 기간이 만료될 때까지 모든 프리미엄 기능을 계속 사용하실 수 있습니다.
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-gray-700 text-sm">
                  구독 취소 관련 문의:
                </p>
                <a
                  href="mailto:careeroad2025@gmail.com"
                  className="text-purple-600 font-semibold text-sm hover:text-purple-800 transition-colors"
                >
                  careeroad2025@gmail.com
                </a>
              </div>
            </div>

            {/* 버튼 */}
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirmModal(false)}
                  disabled={isCancellingSubscription}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  닫기
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancellingSubscription}
                  className="flex-1 py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancellingSubscription ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      취소 중...
                    </span>
                  ) : (
                    '구독 취소하기'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyPage;
