import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  SparklesIcon,
  EnvelopeIcon,
  XMarkIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

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

  // 토스 송금 링크 (토스 계정이 있는 경우 toss.me/계정ID 사용)
  // 또는 카카오뱅크 계좌로 송금하는 딥링크
  const tossPaymentLink = 'supertoss://send?amount=9900&bank=%EC%B9%B4%EC%B9%B4%EC%98%A4%EB%B1%85%ED%81%AC&accountNo=123456789012&message=%ED%94%84%EB%A1%9C%ED%94%8C%EB%9E%9C%EA%B5%AC%EB%8F%85';
  // 웹 링크 (모바일에서 토스 앱 설치 여부와 관계없이 동작)
  const tossMeLink = 'https://toss.me/careeroad'; // 토스 계정이 있다면 이 형식 사용

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
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              출시 특가
            </div>
            <div className="text-gray-400 text-lg line-through mb-1">
              ₩14,900
            </div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1">
              ₩3,900
            </div>
            <div className="text-gray-600 text-sm">/ 월</div>
            <div className="mt-2 text-xs text-red-500 font-medium">
              73% 할인 중!
            </div>
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

            {/* 토스 QR 코드 */}
            <div className="bg-white border-2 border-blue-100 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <QrCodeIcon className="w-5 h-5 text-blue-600" />
                <div className="text-sm font-bold text-gray-900">토스로 간편 송금</div>
              </div>
              <div className="flex justify-center mb-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                  <QRCodeSVG
                    value={tossPaymentLink}
                    size={120}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                QR 코드를 스캔하여 토스로 송금하세요
              </p>
            </div>

            {/* 계좌 정보 */}
            <div className="bg-white border-2 border-purple-100 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">직접 입금 계좌</div>
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
