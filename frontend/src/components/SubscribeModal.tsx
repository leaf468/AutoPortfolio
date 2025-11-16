import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  SparklesIcon,
  EnvelopeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, onClose }) => {
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const contactEmail = 'careeroad2025@gmail.com';
  const accountInfo = '카카오뱅크 1234-56-789012 (주)오토포트폴리오';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* 타이틀 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              프로 플랜 구독
            </h2>
            <p className="text-gray-600 text-sm">
              모든 AI 기능과 프리미엄 템플릿을 제한 없이 이용하세요
            </p>
          </div>

          {/* 가격 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1">
              ₩9,900
            </div>
            <div className="text-gray-600 text-sm">/ 월</div>
          </div>

          {/* 혜택 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* 결제 정보 */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 text-center">
              결제 안내
            </h3>

            {/* 계좌 정보 */}
            <div className="bg-white border-2 border-purple-100 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">입금 계좌</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-semibold text-gray-900">
                  {accountInfo}
                </div>
                <button
                  onClick={() => handleCopy(accountInfo)}
                  className="ml-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all duration-200 text-xs font-semibold text-purple-600"
                >
                  {copiedText === accountInfo ? '✓ 복사됨' : '복사'}
                </button>
              </div>
            </div>

            {/* 결제 버튼 */}
            <div className="space-y-3 mb-4">
              <button
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled
              >
                카드 결제 (준비 중)
              </button>
              <button
                className="w-full py-3.5 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                카카오페이 (준비 중)
              </button>
            </div>

            {/* 문의 안내 */}
            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">입금 확인 및 문의</h4>
              </div>
              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                결제 후 아래 메일로 문의 주시면<br />빠르게 구독 처리해드립니다.
              </p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-semibold text-purple-600 hover:text-purple-800 transition-colors text-sm"
                >
                  {contactEmail}
                </a>
                <button
                  onClick={() => handleCopy(contactEmail)}
                  className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all duration-200 text-xs font-semibold"
                >
                  {copiedText === contactEmail ? '✓' : '복사'}
                </button>
              </div>
            </div>
          </div>

          {/* 추가 안내 */}
          <div className="text-center text-gray-400 text-xs mt-4">
            <p>구독은 매월 자동 갱신되며, 언제든지 취소할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
