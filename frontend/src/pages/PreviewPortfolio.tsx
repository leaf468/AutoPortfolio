import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DocumentArrowDownIcon, 
  EyeIcon,
  CodeBracketIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { portfolioAPI } from '../services/api';

const PreviewPortfolio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState<'html' | 'markdown' | 'pdf'>('html');

  const handleDownload = () => {
    if (id) {
      window.open(portfolioAPI.download(id), '_blank');
    }
  };

  const handlePreview = () => {
    if (id) {
      window.open(portfolioAPI.preview(id), '_blank');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              포트폴리오가 완성되었습니다! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              원하는 형식으로 다운로드하거나 미리보기를 확인하세요
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => setFormat('html')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  format === 'html'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <CodeBracketIcon className="h-5 w-5 inline mr-2" />
                HTML
              </button>
              <button
                onClick={() => setFormat('markdown')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  format === 'markdown'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                Markdown
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  format === 'pdf'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
                PDF
              </button>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-4 mb-8 bg-gray-50">
              <div className="aspect-[8.5/11] bg-white rounded shadow-lg">
                <iframe
                  src={portfolioAPI.preview(id || '')}
                  className="w-full h-full rounded"
                  title="Portfolio Preview"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handlePreview}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
              >
                <EyeIcon className="h-5 w-5 inline mr-2" />
                전체 화면으로 보기
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
                다운로드
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-2">📝 추가 편집</h3>
              <p className="text-gray-600 mb-4">
                다운로드한 파일을 직접 편집하여 더욱 개인화된 포트폴리오를 만들어보세요.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-2">🔗 링크 공유</h3>
              <p className="text-gray-600 mb-4">
                생성된 포트폴리오를 온라인으로 공유하고 싶으신가요? URL을 복사하여 공유하세요.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-2">💾 저장하기</h3>
              <p className="text-gray-600 mb-4">
                포트폴리오를 계정에 저장하고 언제든지 수정할 수 있습니다.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PreviewPortfolio;