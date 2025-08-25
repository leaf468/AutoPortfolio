import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { portfolioAPI } from '../services/api';
import TemplateUpload from '../components/TemplateUpload';
import TextDumpInput from '../components/TextDumpInput';
import InteractiveChatbot from '../components/InteractiveChatbot';
import { DocumentArrowUpIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PortfolioState {
  template: string;
  rawText: string;
  extractedData: any;
  chatHistory: any[];
  isComplete: boolean;
}

const CreatePortfolio: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'template' | 'text' | 'chat' | 'generate'>('template');
  const [portfolioState, setPortfolioState] = useState<PortfolioState>({
    template: '',
    rawText: '',
    extractedData: {},
    chatHistory: [],
    isComplete: false,
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => portfolioAPI.generateFromTemplate(data),
    onSuccess: (data) => {
      navigate(`/preview/${data.portfolioId}`);
    },
  });

  const handleTemplateUpload = (template: string) => {
    setPortfolioState(prev => ({ ...prev, template }));
    setStep('text');
  };

  const handleTextSubmit = (rawText: string) => {
    setPortfolioState(prev => ({ ...prev, rawText }));
    setStep('chat');
  };

  const handleChatComplete = (finalData: any) => {
    setPortfolioState(prev => ({ ...prev, extractedData: finalData, isComplete: true }));
    setStep('generate');
  };

  const handleGenerate = () => {
    generateMutation.mutate({
      template: portfolioState.template,
      data: portfolioState.extractedData,
    });
  };

  const steps = [
    { id: 'template', title: '템플릿 업로드', icon: DocumentArrowUpIcon },
    { id: 'text', title: '정보 입력', icon: SparklesIcon },
    { id: 'chat', title: 'AI 상담', icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI 포트폴리오 어시스턴트
          </h1>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {steps.map((stepItem, index) => (
                <div key={stepItem.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                      steps.findIndex(s => s.id === step) >= index
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <stepItem.icon className="w-6 h-6" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {stepItem.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="mx-4 w-8 h-0.5 bg-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {step === 'template' && (
              <TemplateUpload onUpload={handleTemplateUpload} />
            )}

            {step === 'text' && (
              <TextDumpInput
                template={portfolioState.template}
                onSubmit={handleTextSubmit}
              />
            )}

            {step === 'chat' && (
              <InteractiveChatbot
                template={portfolioState.template}
                rawText={portfolioState.rawText}
                onComplete={handleChatComplete}
              />
            )}

            {step === 'generate' && (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    포트폴리오 준비 완료!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    모든 정보가 수집되었습니다. 이제 포트폴리오를 생성할 준비가 되었습니다.
                  </p>
                </motion.div>

                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200"
                >
                  {generateMutation.isPending ? '생성 중...' : '포트폴리오 생성하기'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePortfolio;