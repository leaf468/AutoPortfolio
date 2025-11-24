import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signup, loginWithGoogle } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import LandingFooter from '../components/LandingFooter';
import { trackButtonClick } from '../utils/analytics';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDuplicateEmailModal, setShowDuplicateEmailModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackButtonClick('회원가입 시도', 'SignupPage');
    setError('');

    // 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (result.success && result.user) {
        setUser(result.user);
        // location.state에서 openSubscribe를 가져와서 전달
        const openSubscribe = (location.state as any)?.openSubscribe;
        if (openSubscribe) {
          navigate('/mypage', { state: { openSubscribe: true } });
        } else {
          navigate('/mypage');
        }
      } else {
        // 이메일 중복 에러 감지
        const errorMsg = result.message || '회원가입에 실패했습니다.';
        if (
          errorMsg.toLowerCase().includes('already registered') ||
          errorMsg.toLowerCase().includes('already exists') ||
          errorMsg.toLowerCase().includes('duplicate') ||
          errorMsg.includes('이미 가입된') ||
          errorMsg.includes('중복') ||
          errorMsg.includes('User already registered')
        ) {
          setShowDuplicateEmailModal(true);
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    trackButtonClick('구글 회원가입', 'SignupPage');
    setError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      if (!result.success && result.message) {
        setError(result.message);
        setLoading(false);
      }
      // 성공 시 OAuth 리다이렉트가 자동으로 발생
    } catch (err) {
      setError('구글 회원가입 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(user ? '/mypage' : '/')}
          >
            <img
              src="/Careeroad_logo.png"
              alt="Careeroad"
              className="h-20 w-auto"
            />
            <div className="border-l-2 border-gray-300 pl-4 py-1">
              <p className="text-xl font-bold text-gray-900">
                당신만의 AI 커리어 비서
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                경험 관리부터 포트폴리오 생성까지
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">새로운 계정을 만들어보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">최소 6자 이상</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="mt-4 w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 회원가입
          </button>

          <p className="mt-3 text-xs text-center text-gray-500">
            Google 계정으로 안전하게 가입됩니다
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              로그인
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            메인으로 돌아가기
          </Link>
        </div>
        </div>
      </div>
      <LandingFooter />

      {/* 이메일 중복 모달 */}
      {showDuplicateEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">이미 가입된 이메일입니다</h3>
              <p className="text-gray-600">
                입력하신 이메일({formData.email})로 이미 가입된 계정이 있습니다.
              </p>
              <p className="text-gray-600 mt-2">
                로그인하시겠습니까?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateEmailModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                다른 이메일 사용
              </button>
              <button
                onClick={() => {
                  setShowDuplicateEmailModal(false);
                  navigate('/login', { state: { email: formData.email } });
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-lg"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
