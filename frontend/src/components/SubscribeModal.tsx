import React, { useState } from 'react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XMarkIcon className="w-6 h-6 text-gray-500" />
        </button>

        <div className="p-8">
          {/* 타이틀 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full mb-4 shadow-lg">
              <SparklesIcon className="w-5 h-5" />
              <span className="font-bold">프로 플랜</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              무제한으로 사용하세요
            </h2>
            <p className="text-gray-600">
              모든 AI 기능과 프리미엄 템플릿을 제한 없이 이용할 수 있습니다
            </p>
          </div>

          {/* 가격 */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1">
              ₩9,900
            </div>
            <div className="text-gray-600">/ 월</div>
          </div>

          {/* 혜택 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* 결제 정보 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              결제 안내
            </h3>

            {/* 계좌 정보 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">입금 계좌</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-semibold text-gray-900">
                  {accountInfo}
                </div>
                <button
                  onClick={() => handleCopy(accountInfo)}
                  className="ml-2 px-3 py-1 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-xs font-medium text-purple-600"
                >
                  {copiedText === accountInfo ? '복사됨!' : '복사'}
                </button>
              </div>
            </div>

            {/* 결제 버튼 */}
            <div className="space-y-2 mb-4">
              <button
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                카드 결제 (준비 중)
              </button>
              <button
                className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                카카오페이 (준비 중)
              </button>
            </div>

            {/* 문의 안내 */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <EnvelopeIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-gray-900 text-sm">입금 확인 및 문의</h4>
              </div>
              <p className="text-gray-700 text-sm mb-2">
                결제 시 아래 메일로 문의 주시면 구매 조치 해드리도록 하겠습니다.
              </p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-semibold text-purple-600 hover:text-purple-800 underline text-sm"
                >
                  {contactEmail}
                </a>
                <button
                  onClick={() => handleCopy(contactEmail)}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-medium"
                >
                  {copiedText === contactEmail ? '✓' : '복사'}
                </button>
              </div>
            </div>
          </div>

          {/* 추가 안내 */}
          <div className="text-center text-gray-500 text-xs mt-4">
            <p>구독은 매월 자동 갱신되며, 언제든지 취소할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
