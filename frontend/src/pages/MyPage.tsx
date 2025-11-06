import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  UserCircleIcon
} from '@heroicons/react/24/outline';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setEditMode } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'documents' | 'portfolios' | 'profile'>('documents');

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
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (user) {
      loadProfile();
      loadDocuments();
      loadPortfolios();
    }
  }, [user, loading, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.user_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Load profile error:', error);
      return;
    }

    if (data) {
      setProfileData({
        name: user.name,
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
        name: user.name,
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
      console.error('Load documents error:', error);
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
      console.error('Load portfolios error:', error);
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
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

      alert('프로필이 저장되었습니다.');
      setIsEditing(false);
      loadProfile(); // 프로필 다시 로드
    } catch (error) {
      console.error('Profile save error:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
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

      alert('회원 탈퇴가 완료되었습니다.');
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Account deletion error:', error);
      alert('회원 탈퇴 중 오류가 발생했습니다.');
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 로고 */}
              <Link to="/" className="flex items-center space-x-2">
                <img src="/Careeroad_logo.png" alt="Careeroad" className="h-16" />
              </Link>

              <div className="h-8 w-px bg-gray-300 mx-4"></div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{user.name}</h1>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span className="font-medium">내 자소서</span>
            </button>
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition ${
                activeTab === 'portfolios'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FolderOpenIcon className="w-5 h-5" />
              <span className="font-medium">내 포트폴리오</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="font-medium">프로필 설정</span>
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
                            navigate('/cover-letter', { state: { editMode: true, documentId: doc.document_id, savedData: content } });
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
                onClick={() => navigate('/')}
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
                            // 포트폴리오 편집 - 컨텍스트에 데이터 설정 후 편집 페이지로 이동
                            setEditMode(
                              portfolio.portfolio_id,
                              portfolio.template_type,
                              portfolio.sections
                            );
                            navigate('/edit');
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

            {/* 참고 카테고리 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">참고 카테고리 (선택)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { value: '은행원', icon: '🏦', label: '은행원' },
                  { value: '중견/금융', icon: '💰', label: '중견/금융' },
                  { value: '대기업', icon: '🏢', label: '대기업' },
                  { value: 'IT 대기업', icon: '💻', label: 'IT 대기업' },
                  { value: '공기업', icon: '🏛️', label: '공기업' },
                  { value: '외국계', icon: '🌍', label: '외국계' },
                ].map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      if (!isEditing) return;
                      setSelectedCategories(prev =>
                        prev.includes(category.value)
                          ? prev.filter(c => c !== category.value)
                          : [...prev, category.value]
                      );
                    }}
                    disabled={!isEditing}
                    className={`p-4 border-2 rounded-lg transition ${
                      selectedCategories.includes(category.value)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    } ${isEditing ? 'hover:border-blue-400 cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{category.label}</div>
                  </button>
                ))}
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

      <Footer />
    </div>
  );
};

export default MyPage;
