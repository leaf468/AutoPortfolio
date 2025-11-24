import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const navigate = useNavigate();

  const handleAuth = (authMode: 'login' | 'signup') => {
    onClose();
    // 구글 소셜 로그인만 사용하므로 항상 로그인 페이지로 이동
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <div className="p-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/Careeroad_logo.png"
                    alt="CareeRoad Logo"
                    className="h-12 object-contain"
                  />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  {mode === 'login' ? '로그인' : '회원가입'}
                </h2>
                <p className="text-center text-gray-600 mb-8">
                  {mode === 'login'
                    ? 'CareeRoad에 오신 것을 환영합니다'
                    : '무료로 시작하고 프로페셔널한 포트폴리오를 만들어보세요'}
                </p>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      mode === 'login'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      mode === 'signup'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    회원가입
                  </button>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleAuth(mode)}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  {mode === 'login' ? '로그인하기' : '회원가입하기'}
                </button>

                {/* Guest Experience Button */}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/cover-letter?mode=guest');
                  }}
                  className="w-full mt-3 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  비회원으로 체험하기
                </button>

                {/* Additional Info */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  {mode === 'login' ? (
                    <p>
                      계정이 없으신가요?{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        회원가입
                      </button>
                    </p>
                  ) : (
                    <p>
                      이미 계정이 있으신가요?{' '}
                      <button
                        onClick={() => setMode('login')}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        로그인
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
