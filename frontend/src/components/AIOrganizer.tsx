import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  XMarkIcon
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
  const [result, setResult] = useState<OrganizedContent | null>(null);
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedResult, setEditedResult] = useState<OrganizedContent | null>(null);

  const handleOrganize = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      let organized = await aiOrganizer.organizeContent(input, inputType);
      
      // 채용공고가 있으면 추가 최적화
      if (jobPosting.trim()) {
        organized = await aiOrganizer.enhanceWithJobPosting(organized, jobPosting);
      }

      setResult(organized);
    } catch (error) {
      console.error('AI 정리 중 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (editedResult || result) {
      onComplete(editedResult || result!);
    }
  };

  const handleEdit = (section: string) => {
    setEditingSection(section);
    if (!editedResult && result) {
      setEditedResult({ ...result });
    }
  };

  const handleSaveEdit = () => {
    setEditingSection(null);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    if (result) {
      setEditedResult({ ...result });
    }
  };

  const updateEditedResult = (field: string, value: any) => {
    if (editedResult) {
      setEditedResult({
        ...editedResult,
        [field]: value
      });
    }
  };

  const displayResult = editedResult || result;

  const inputTypes = [
    { value: 'freetext', label: '자유 텍스트', icon: DocumentTextIcon },
    { value: 'resume', label: '이력서', icon: ClipboardDocumentListIcon },
    { value: 'markdown', label: '마크다운', icon: DocumentTextIcon }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center items-center mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600 mr-2" />
          <h2 className="text-3xl font-bold text-gray-900">AI 정리</h2>
        </div>
        <p className="text-lg text-gray-600">
          채용 관점에서 정보를 정리하고 핵심 성과를 추출합니다
        </p>
      </motion.div>

      {!result ? (
        <div className="space-y-6">
          {/* 입력 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              입력 형식 선택
            </label>
            <div className="grid grid-cols-3 gap-4">
              {inputTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInputType(type.value as any)}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    inputType === type.value
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <type.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 메인 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {inputType === 'freetext' && '자유롭게 경력, 프로젝트, 기술 등을 작성해주세요'}
              {inputType === 'resume' && '기존 이력서 내용을 붙여넣어주세요'}
              {inputType === 'markdown' && '마크다운 형식의 포트폴리오를 입력해주세요'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              placeholder="예: 3년차 풀스택 개발자입니다. React와 Node.js로 쇼핑몰 플랫폼을 개발했고, 사용자 50% 증가와 매출 200% 상승에 기여했습니다..."
            />
            <div className="text-sm text-gray-500 mt-2">
              {input.length} / 5000 글자
            </div>
          </div>

          {/* 채용공고 추가 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                채용공고 (선택사항)
              </label>
              <button
                onClick={() => setShowJobPosting(!showJobPosting)}
                className="text-sm text-purple-600 hover:text-purple-800"
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
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                  placeholder="지원하려는 채용공고 내용을 입력하면 맞춤형 최적화를 해드립니다..."
                />
              </motion.div>
            )}
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={handleOrganize}
            disabled={!input.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                AI가 정리하는 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                채용 관점으로 정리하기
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 결과 표시 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-semibold">AI 정리 완료</h3>
            </div>

            {/* 원라이너 피치 */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-purple-900">💡 핵심 피치</h4>
                <button
                  onClick={() => handleEdit('oneLinerPitch')}
                  className="text-purple-600 hover:text-purple-800 p-1"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
              </div>
              {editingSection === 'oneLinerPitch' ? (
                <div className="space-y-3">
                  <textarea
                    value={displayResult?.oneLinerPitch || ''}
                    onChange={(e) => updateEditedResult('oneLinerPitch', e.target.value)}
                    className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-purple-800 text-lg">{displayResult?.oneLinerPitch}</p>
              )}
            </div>

            {/* 요약 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">📝 전문적 요약</h4>
                <button
                  onClick={() => handleEdit('summary')}
                  className="text-gray-600 hover:text-gray-800 p-1"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
              </div>
              {editingSection === 'summary' ? (
                <div className="space-y-3">
                  <textarea
                    value={displayResult?.summary || ''}
                    onChange={(e) => updateEditedResult('summary', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">{displayResult?.summary}</p>
              )}
            </div>

            {/* 키워드 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">🏷️ 추출된 키워드</h4>
                <button
                  onClick={() => handleEdit('keywords')}
                  className="text-gray-600 hover:text-gray-800 p-1"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
              </div>
              {editingSection === 'keywords' ? (
                <div className="space-y-4">
                  {Object.entries(displayResult?.keywords || {}).map(([category, keywords]) => (
                    <div key={category}>
                      <label className="text-sm font-medium text-gray-600 capitalize block mb-2">
                        {category === 'technical' ? '기술' : 
                         category === 'soft' ? '소프트 스킬' :
                         category === 'industry' ? '산업' : 'ATS'}:
                      </label>
                      <input
                        type="text"
                        value={keywords.join(', ')}
                        onChange={(e) => {
                          const newKeywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                          updateEditedResult('keywords', {
                            ...displayResult?.keywords,
                            [category]: newKeywords
                          });
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="키워드를 쉼표로 구분하여 입력하세요"
                      />
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(displayResult?.keywords || {}).map(([category, keywords]) => (
                    keywords.length > 0 && (
                      <div key={category}>
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {category === 'technical' ? '기술' : 
                           category === 'soft' ? '소프트 스킬' :
                           category === 'industry' ? '산업' : 'ATS'}:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* 개선 제안 */}
            {(displayResult?.improvementSuggestions?.length || 0) > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">💡 개선 제안</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {displayResult?.improvementSuggestions?.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{displayResult?.experiences.length || 0}</div>
                <div className="text-sm text-gray-600">경력</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{displayResult?.projects.length || 0}</div>
                <div className="text-sm text-gray-600">프로젝트</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{displayResult?.skills.length || 0}</div>
                <div className="text-sm text-gray-600">기술 분야</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(displayResult?.keywords || {}).flat().length}
                </div>
                <div className="text-sm text-gray-600">키워드</div>
              </div>
            </div>

            {/* 편집 안내 메시지 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <PencilSquareIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">편집 기능 안내</h4>
                  <p className="text-blue-800 text-sm">
                    각 섹션의 연필 아이콘을 클릭하여 내용을 수정할 수 있습니다. 
                    AI가 정리한 내용이 적절한지 확인하고, 필요시 직접 편집해보세요.
                  </p>
                  <p className="text-blue-700 text-xs mt-2">
                    💡 팁: 핵심 성과나 기술을 추가하거나, 표현을 더 구체적으로 다듬어보세요.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 액션 버튼들 */}
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setResult(null);
                setEditedResult(null);
                setInput('');
                setJobPosting('');
                setEditingSection(null);
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              다시 정리하기
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
            >
              {editedResult ? '편집된 내용으로 생성하기' : '포트폴리오 생성하기'}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIOrganizer;