import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { aiOrganizer, OrganizedContent } from '../services/aiOrganizer';

interface AIOrganizerProps {
  onComplete: (organizedContent: OrganizedContent) => void;
}

const AIOrganizer: React.FC<AIOrganizerProps> = ({ onComplete }) => {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'freetext' | 'resume' | 'markdown'>('freetext');
  const [jobPosting, setJobPosting] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showJobPosting, setShowJobPosting] = useState(false);

  const handleOrganize = async () => {
    if (!input.trim()) return;

    console.log('=== AI 정리 시작 ===');
    console.log('사용자 입력 데이터:', input);
    console.log('입력 타입:', inputType);
    console.log('채용공고:', jobPosting);

    setIsProcessing(true);
    try {
      let organized = await aiOrganizer.organizeContent(input, inputType);
      console.log('AI 기본 정리 결과:', organized);

      // 채용공고가 있으면 추가 최적화
      if (jobPosting.trim()) {
        console.log('채용공고 최적화 실행 중...');
        organized = await aiOrganizer.enhanceWithJobPosting(organized, jobPosting);
        console.log('채용공고 최적화 결과:', organized);
      }

      console.log('=== 최종 AI 정리 결과 ===');
      console.log(organized);

      // 원본 입력 데이터를 결과에 추가
      organized.originalInput = {
        rawText: input,
        inputType: inputType,
        jobPosting: jobPosting.trim() || undefined
      };

      // 디버깅: 설정된 originalInput 확인
      console.log('=== AIOrganizer originalInput 설정 ===');
      console.log('사용자 입력 텍스트:', input);
      console.log('입력 타입:', inputType);
      console.log('채용공고:', jobPosting);
      console.log('설정된 originalInput:', organized.originalInput);
      console.log('최종 organized 결과:', organized);

      // 결과 표시 단계를 건너뛰고 바로 완료 처리
      onComplete(organized);
    } catch (error) {
      console.error('AI 정리 중 오류:', error);
      setIsProcessing(false);
    }
  };


  const inputTypes = [
    { value: 'freetext', label: '자유 텍스트', icon: DocumentTextIcon },
    { value: 'resume', label: '이력서', icon: ClipboardDocumentListIcon },
    { value: 'markdown', label: '마크다운', icon: DocumentTextIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto px-16 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex justify-center items-center mb-2">
          <SparklesIcon className="w-7 h-7 text-purple-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">정보 입력</h2>
        </div>
        <p className="text-sm text-gray-600">
          채용 관점에서 정보를 정리하고 핵심 성과를 추출합니다
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* 입력 타입 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              입력 형식 선택
            </label>
            <div className="grid grid-cols-3 gap-3">
              {inputTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInputType(type.value as any)}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-1.5 transition-colors ${
                    inputType === type.value
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 메인 입력 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {inputType === 'freetext' && '자유롭게 경력, 프로젝트, 기술 등을 작성해주세요'}
              {inputType === 'resume' && '기존 이력서 내용을 붙여넣어주세요'}
              {inputType === 'markdown' && '마크다운 형식의 포트폴리오를 입력해주세요'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-52 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm"
              placeholder="예: 3년차 풀스택 개발자입니다. React와 Node.js로 쇼핑몰 플랫폼을 개발했고, 사용자 50% 증가와 매출 200% 상승에 기여했습니다..."
            />
            <div className="text-xs text-gray-500 mt-1.5">
              {input.length} / 5000 글자
            </div>
          </div>

          {/* 채용공고 추가 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                채용공고 (선택사항)
              </label>
              <button
                onClick={() => setShowJobPosting(!showJobPosting)}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                {showJobPosting ? '숨기기' : '추가하기'}
              </button>
            </div>

            {showJobPosting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <textarea
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                  className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm"
                  placeholder="지원하려는 채용공고 내용을 입력하면 맞춤형 최적화를 해드립니다..."
                />
              </motion.div>
            )}
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={handleOrganize}
            disabled={!input.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                AI 정리 및 포트폴리오 생성 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                포트폴리오 생성하기
              </>
            )}
          </button>
        </div>
    </div>
  );
};

export default AIOrganizer;