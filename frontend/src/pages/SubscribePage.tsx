import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircleIcon,
  SparklesIcon,
  EnvelopeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const SubscribePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscriptionInfo } = useAuth();
  const [copiedText, setCopiedText] = useState('');

  // 로그인 체크: 비로그인 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/subscribe' }, replace: true });
    }
  }, [user, navigate]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const benefits = [
    '포트폴리오 AI 생성 (무제한)',
    '모든 프리미엄 템플릿 이용',
    'PPT 다운로드 기능',
    '자기소개서 AI 첨삭 (무제한)',
    '우선 고객 지원',
    '매월 새로운 템플릿 업데이트',
  ];

  // 결제 안내 정보 (실제 정보로 교체 필요)
  const contactEmail = 'support@autoportfolio.com';
  const accountInfo = '카카오뱅크 1234-56-789012 (주)오토포트폴리오';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 네비게이션 바 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* 왼쪽: 로고 + 타이틀 */}
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
                  프로 플랜 구독
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  무제한 AI 기능과 프리미엄 템플릿 이용
                </p>
              </div>
            </div>

            {/* 오른쪽: 네비게이션 메뉴 */}
            <div className="flex items-center gap-6">
              {user ? (
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
              ) : (
                <button
                  onClick={() => navigate('/cover-letter?mode=guest')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold whitespace-nowrap"
                >
                  데모 체험하기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 뒤로 가기 버튼 */}
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>뒤로 가기</span>
        </button>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 타이틀 섹션 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full mb-4 shadow-lg">
            <SparklesIcon className="w-6 h-6" />
            <span className="font-bold text-lg">프로 플랜</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            무제한으로 사용하세요
          </h1>
          <p className="text-xl text-gray-600">
            모든 AI 기능과 프리미엄 템플릿을 제한 없이 이용할 수 있습니다
          </p>
        </div>

        {/* 가격 카드 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border-2 border-purple-100">
          <div className="text-center mb-8">
            <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
              ₩9,900
            </div>
            <div className="text-gray-600 text-lg">/ 월</div>
            {subscriptionInfo.isPro && (
              <div className="mt-4 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                현재 구독 중입니다
              </div>
            )}
          </div>

          {/* 혜택 목록 */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-700 font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* 결제 정보 섹션 */}
          <div className="border-t-2 border-gray-100 pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              결제 안내
            </h3>

            {/* 계좌 정보 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <div className="text-sm text-gray-600 mb-2">입금 계좌</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-lg font-semibold text-gray-900">
                  {accountInfo}
                </div>
                <button
                  onClick={() => handleCopy(accountInfo)}
                  className="ml-4 px-4 py-2 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-purple-600"
                >
                  {copiedText === accountInfo ? '복사됨!' : '복사'}
                </button>
              </div>
            </div>

            {/* 결제 링크 공간 (향후 토스페이먼츠/카카오페이 등 연동 시 사용) */}
            <div className="space-y-3 mb-6">
              <button
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                카드 결제 (준비 중)
              </button>
              <button
                className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                카카오페이 (준비 중)
              </button>
            </div>

            {/* 문의 안내 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <EnvelopeIcon className="w-6 h-6 text-purple-600" />
                <h4 className="font-bold text-gray-900">입금 확인 및 문의</h4>
              </div>
              <p className="text-gray-700 mb-3">
                결제 시 아래 메일로 문의 주시면 구매 조치 해드리도록 하겠습니다.
              </p>
              <p className="text-gray-700 mb-4">
                문의 사항 있다면 동일한 메일로 보내주시면 감사드리겠습니다.
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-semibold text-purple-600 hover:text-purple-800 underline"
                >
                  {contactEmail}
                </a>
                <button
                  onClick={() => handleCopy(contactEmail)}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                >
                  {copiedText === contactEmail ? '✓' : '복사'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="text-center text-gray-600">
          <p className="mb-2">구독은 매월 자동 갱신되며, 언제든지 취소할 수 있습니다.</p>
          <p className="text-sm">결제 문의: 평일 09:00 - 18:00 (주말 및 공휴일 제외)</p>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
