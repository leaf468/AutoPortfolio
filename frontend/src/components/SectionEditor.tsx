import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  SparklesIcon,
  PencilIcon,
  ArrowUturnLeftIcon,
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import type { Section, Suggestion } from '../services/sectionEditorService';
import { sectionEditorService } from '../services/sectionEditorService';

interface SectionEditorProps {
  section: Section;
  onUpdate: (sectionId: string, newText: string) => void;
  role?: string;
  targetJob?: string;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ 
  section, 
  onUpdate,
  role,
  targetJob 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(section.current_text);
  const [selectedTone] = useState<string[]>(['impact', 'concise']);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const hasChanges = section.current_text !== section.original_text;
  const canRevert = section.history.length > 0 || hasChanges;


  // 추천 문구 가져오기 (자동으로 드롭다운 열기)
  const fetchSuggestions = async () => {
    if (suggestions.length > 0) {
      // 이미 추천 문구가 있으면 바로 드롭다운 열기
      setIsDropdownOpen(true);
      setShowSuggestions(true);
      return;
    }
    
    setIsLoadingSuggestions(true);
    setIsDropdownOpen(true); // 로딩 중에도 드롭다운 열기
    
    try {
      const response = await sectionEditorService.getSuggestions({
        section_id: section.section_id,
        section_type: section.type, // 섹션 타입 추가
        current_text: section.current_text,
        content: section.current_text, // 폴백용 컨텐츠
        role,
        target_job: targetJob,
        locale: 'ko-KR',
        tone_preferences: selectedTone
      });
      setSuggestions(response.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      // 오류 시에도 기본 추천 내용 표시
      setSuggestions([
        {
          suggestion_id: `${section.section_id}_error`,
          section_id: section.section_id,
          text: `${section.current_text}\n\n**개선 제안:**\n• 구체적인 수치와 성과 추가\n• 사용한 기술 스택 명시\n• 비즈니스 임팩트 강조`,
          tone: 'impact' as const,
          reason: '네트워크 오류로 인한 기본 제안',
          confidence: 0.7
        }
      ]);
      setShowSuggestions(true);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // 추천 문구 적용
  const applySuggestion = (suggestion: Suggestion) => {
    sectionEditorService.applySuggestion(section.section_id, suggestion.text);
    onUpdate(section.section_id, suggestion.text);
    setShowSuggestions(false);
    setIsDropdownOpen(false);
    // 추천 문구 적용 후 새로운 추천 내용 준비
    setSuggestions([]);
  };
  
  // 드롭다운 토글
  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      fetchSuggestions(); // 드롭다운 열 때 자동으로 추천 문구 가져오기
    } else {
      setIsDropdownOpen(false);
      setShowSuggestions(false);
    }
  };

  // 수동 편집 저장
  const saveEdit = () => {
    if (editText !== section.current_text) {
      sectionEditorService.manualEdit(section.section_id, editText);
      onUpdate(section.section_id, editText);
    }
    setIsEditing(false);
  };

  // 되돌리기
  const handleRevert = () => {
    sectionEditorService.revertSection(section.section_id);
    const updatedSection = sectionEditorService.getSection(section.section_id);
    if (updatedSection) {
      onUpdate(section.section_id, updatedSection.current_text);
    }
    setIsDropdownOpen(false);
    setSuggestions([]); // 되돌리기 후 추천 문구 초기화
  };

  // 원본으로 되돌리기
  const handleRevertToOriginal = () => {
    sectionEditorService.revertToOriginal(section.section_id);
    onUpdate(section.section_id, section.original_text);
    setIsDropdownOpen(false);
  };

  // 편집 모드 시작
  const startEditing = () => {
    setEditText(section.current_text);
    setIsEditing(true);
    setIsDropdownOpen(false);
    setTimeout(() => editRef.current?.focus(), 100);
  };

  // 클립보드 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(section.current_text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative group">
      <div className={`p-4 rounded-lg border transition-all ${
        hasChanges 
          ? 'border-orange-300 bg-orange-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 flex items-center">
              {section.title}
              {hasChanges && (
                <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                  수정됨
                </span>
              )}
            </h3>
          </div>
          
          {/* 드롭다운 메뉴 버튼 */}
          <button
            onClick={toggleDropdown}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="추천 문구 보기"
          >
            {isLoadingSuggestions ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            ) : (
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`} />
            )}
          </button>
        </div>

        {/* 현재 텍스트 또는 편집 모드 */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={editRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed">
            {section.current_text}
          </p>
        )}

        {/* 드롭다운 메뉴 */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
            >
              <div className="p-2">
                {/* 추천 문구 섹션 */}
                {(showSuggestions && suggestions.length > 0) ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <SparklesIcon className="w-4 h-4 mr-2 text-purple-600" />
                        추천 문구
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">클릭하여 적용하세요</p>
                    </div>
                    
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.suggestion_id || index}
                        onClick={() => applySuggestion(suggestion)}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group"
                      >
                        <div className="text-sm text-gray-800 mb-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {suggestion.text}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {suggestion.tone === 'impact' ? '성과중심' : 
                             suggestion.tone === 'structured' ? '체계적' :
                             suggestion.tone === 'technical' ? '기술적' : '전문적'}
                          </span>
                          <span className="text-xs text-gray-400 group-hover:text-gray-600">
                            적용 →
                          </span>
                        </div>
                        {suggestion.reason && (
                          <div className="text-xs text-gray-500 mt-2">
                            {suggestion.reason}
                          </div>
                        )}
                      </button>
                    ))}
                    
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setSuggestions([]);
                          fetchSuggestions();
                        }}
                        className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        다른 추천 보기
                      </button>
                    </div>
                  </div>
                ) : isLoadingSuggestions ? (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">추천 문구를 생성하고 있어요...</p>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-center text-sm text-gray-500">
                    추천 문구를 가져오는 중입니다...
                  </div>
                )}
                
                {/* 기존 메뉴 옵션들 */}
                <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                  <button
                    onClick={startEditing}
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5 mr-3 text-blue-600" />
                    <span>직접 수정</span>
                  </button>
                  
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5 mr-3 text-green-600" />
                    <span>복사하기</span>
                  </button>
                  
                  {canRevert && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      {section.history.length > 0 && (
                        <button
                          onClick={handleRevert}
                          className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <ArrowUturnLeftIcon className="w-5 h-5 mr-3 text-gray-600" />
                          <span>이전으로 되돌리기</span>
                        </button>
                      )}
                      
                      {hasChanges && (
                        <button
                          onClick={handleRevertToOriginal}
                          className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <ArrowUturnLeftIcon className="w-5 h-5 mr-3 text-orange-600" />
                          <span>원본으로 되돌리기</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SectionEditor;