import React, { useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = '확인',
}) => {
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

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="w-12 h-12 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-12 h-12 text-blue-500" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success':
        return '성공';
      case 'error':
        return '오류';
      case 'warning':
        return '경고';
      default:
        return '알림';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4">{getIcon()}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h3>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 text-center whitespace-pre-wrap leading-relaxed">
            {message}
          </p>
        </div>

        {/* 버튼 */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
              type === 'success'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : type === 'error'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : type === 'warning'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 전역 스타일 (애니메이션)
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
`;

if (typeof document !== 'undefined' && !document.querySelector('#custom-alert-styles')) {
  style.id = 'custom-alert-styles';
  document.head.appendChild(style);
}
