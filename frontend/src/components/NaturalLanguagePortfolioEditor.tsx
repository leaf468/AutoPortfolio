import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { GenerationResult } from '../services/oneClickGenerator';
import { OrganizedContent } from '../services/aiOrganizer';

interface NaturalLanguagePortfolioEditorProps {
  initialContent: GenerationResult;
  organizedContent: OrganizedContent;
  onComplete: (finalContent: string) => void;
  onBack?: () => void;
}

const NaturalLanguagePortfolioEditor: React.FC<NaturalLanguagePortfolioEditorProps> = ({
  initialContent,
  organizedContent,
  onComplete,
  onBack
}) => {
  const [currentContent, setCurrentContent] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<Array<{instruction: string, timestamp: Date}>>([]);

  useEffect(() => {
    // Extract HTML content from the initial content
    let htmlContent = '';
    try {
      const parsedContent = JSON.parse(initialContent.content);
      if (parsedContent.sections && parsedContent.sections[0]?.blocks?.[0]?.text) {
        htmlContent = parsedContent.sections[0].blocks[0].text;
      }
    } catch (error) {
      htmlContent = initialContent.content;
    }
    setCurrentContent(htmlContent);
  }, [initialContent]);

  const handleNaturalLanguageEdit = async () => {
    if (!editInstructions.trim()) return;

    setIsProcessing(true);
    try {
      // Here we would call an AI service to modify the content based on natural language instructions
      // For now, we'll simulate this with a simple implementation
      
      // Add to edit history
      setEditHistory(prev => [...prev, {
        instruction: editInstructions,
        timestamp: new Date()
      }]);

      // In a real implementation, you would call an AI service like OpenAI to modify the HTML content
      // based on the natural language instructions
      
      // For now, just show that we processed the instruction
      console.log('Processing instruction:', editInstructions);
      
      setEditInstructions('');
    } catch (error) {
      console.error('Error processing edit instruction:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromHtml = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const handleComplete = () => {
    onComplete(currentContent);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center items-center mb-4">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600 mr-2" />
          <h2 className="text-3xl font-bold text-gray-900">자연어 포트폴리오 편집</h2>
        </div>
        <p className="text-lg text-gray-600">
          자연어로 포트폴리오를 수정해보세요. 예: "프로젝트 설명을 더 구체적으로 써줘" 또는 "기술 스택 부분에 Docker 추가해줘"
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Natural Language Input */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-blue-600" />
              편집 요청
            </h3>
            
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="어떻게 수정하고 싶으신가요?&#10;예시:&#10;- 프로젝트 설명을 더 자세히 써줘&#10;- 기술 스택에 Docker와 Kubernetes 추가해줘&#10;- 경력 부분을 더 임팩트 있게 작성해줘&#10;- 전체적인 톤을 더 전문적으로 바꿔줘"
            />
            
            <button
              onClick={handleNaturalLanguageEdit}
              disabled={!editInstructions.trim() || isProcessing}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  수정 중...
                </>
              ) : (
                <>
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  자연어로 수정하기
                </>
              )}
            </button>
          </div>

          {/* Edit History */}
          {editHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-3">편집 기록</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {editHistory.map((edit, index) => (
                  <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{edit.instruction}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {edit.timestamp.toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                포트폴리오 미리보기
              </h3>
              <button
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <EyeIcon className="w-5 h-5 mr-1" />
                {isPreviewOpen ? '접기' : '펼치기'}
              </button>
            </div>
            
            {isPreviewOpen && (
              <div className="p-6">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentContent }}
                />
              </div>
            )}
            
            {!isPreviewOpen && (
              <div className="p-6">
                <p className="text-gray-600 mb-4">현재 포트폴리오 내용:</p>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {extractTextFromHtml(currentContent)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            이전으로
          </button>
        )}
        
        <div className="flex-1" />
        
        <button
          onClick={handleComplete}
          className="bg-green-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          편집 완료
        </button>
      </div>
    </div>
  );
};

export default NaturalLanguagePortfolioEditor;