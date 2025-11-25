import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginWithGoogle } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import LandingFooter from '../components/LandingFooter';
import { trackButtonClick } from '../utils/analytics';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('logout') === 'success') {
      setSuccessMessage('로그아웃 되었습니다');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    trackButtonClick('구글 로그인', 'LoginPage');
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
      setError('구글 로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
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
              className="h-16 sm:h-20 w-auto"
            />
            <div className="border-l-2 border-gray-300 pl-4 py-1">
              <p className="text-lg sm:text-xl font-bold text-gray-900">
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
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">포트폴리오 생성 플랫폼에 오신 것을 환영합니다</p>
          </div>

          <div className="space-y-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? '로그인 중...' : 'Google로 로그인'}
            </button>

            <p className="text-xs text-center text-gray-500">
              Google 계정으로 안전하게 로그인됩니다
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              처음 이용하시는 분도 Google로 로그인하시면<br />
              자동으로 계정이 생성됩니다.
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
    </div>
  );
};

export default LoginPage;
