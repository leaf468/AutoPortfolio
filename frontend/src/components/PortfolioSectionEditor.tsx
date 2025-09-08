import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import SectionEditor from './SectionEditor';
import type { Section } from '../services/sectionEditorService';
import { sectionEditorService } from '../services/sectionEditorService';
import { GenerationResult } from '../services/oneClickGenerator';
import { OrganizedContent } from '../services/aiOrganizer';

interface PortfolioSectionEditorProps {
  initialContent: GenerationResult;
  organizedContent: OrganizedContent;
  onComplete: (finalContent: string) => void;
  onBack?: () => void;
}

const PortfolioSectionEditor: React.FC<PortfolioSectionEditorProps> = ({
  initialContent,
  organizedContent,
  onComplete,
  onBack
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [changeSummary, setChangeSummary] = useState({ totalChanges: 0, sections: [] as string[] });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 초기 섹션 파싱
  useEffect(() => {
    console.log('Initial content for parsing:', initialContent.content);
    const parsedSections = sectionEditorService.parsePortfolioIntoSections(
      initialContent.content,
      initialContent.id
    );
    console.log('Parsed sections result:', parsedSections);
    setSections(parsedSections);
  }, [initialContent]);

  // 섹션 업데이트 핸들러
  const handleSectionUpdate = (sectionId: string, newText: string) => {
    setSections(prevSections => 
      prevSections.map(s => 
        s.section_id === sectionId 
          ? { ...s, current_text: newText }
          : s
      )
    );
    
    // 변경 사항 요약 업데이트
    const summary = sectionEditorService.getChangeSummary();
    setChangeSummary(summary);
    
    // 자동 저장 표시
    setLastSaved(new Date());
  };

  // 미리보기 생성
  const generatePreview = () => {
    const finalDoc = sectionEditorService.buildFinalDocument();
    setPreviewContent(finalDoc);
    setIsPreviewOpen(true);
  };

  // 최종 내보내기
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const finalDoc = sectionEditorService.buildFinalDocument();
      onComplete(finalDoc);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // 전체 되돌리기
  const revertAll = () => {
    if (window.confirm('모든 변경사항을 취소하고 원본으로 되돌리시겠습니까?')) {
      sections.forEach(section => {
        sectionEditorService.revertToOriginal(section.section_id);
      });
      setSections(sectionEditorService.getAllSections());
      setChangeSummary({ totalChanges: 0, sections: [] });
    }
  };

  // 섹션 타입별 그룹화
  const groupedSections = {
    summary: sections.filter(s => s.type === 'summary'),
    experience: sections.filter(s => s.type === 'experience'),
    project: sections.filter(s => s.type === 'project'),
    skill: sections.filter(s => s.type === 'skill'),
    achievement: sections.filter(s => s.type === 'achievement')
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  포트폴리오 편집기
                </h1>
                <p className="text-sm text-gray-500">
                  각 섹션을 클릭하여 개별 편집할 수 있습니다
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 변경 사항 표시 */}
              {changeSummary.totalChanges > 0 && (
                <div className="flex items-center text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-orange-600">
                    {changeSummary.totalChanges}개 섹션 수정됨
                  </span>
                </div>
              )}

              {/* 자동 저장 표시 */}
              {lastSaved && (
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>
                    {new Date(lastSaved).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 저장됨
                  </span>
                </div>
              )}

              {/* 액션 버튼들 */}
              <button
                onClick={revertAll}
                disabled={changeSummary.totalChanges === 0}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className="w-4 h-4 inline mr-1" />
                전체 되돌리기
              </button>

              <button
                onClick={generatePreview}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <EyeIcon className="w-4 h-4 inline mr-1" />
                미리보기
              </button>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-1"></div>
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                    완료 & 내보내기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 편집 패널 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 요약 섹션 */}
            {groupedSections.summary.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">📝 요약</h2>
                <div className="space-y-3">
                  {groupedSections.summary.map(section => (
                    <SectionEditor
                      key={section.section_id}
                      section={section}
                      onUpdate={handleSectionUpdate}
                      role={organizedContent.experiences[0]?.position}
                      targetJob={organizedContent.keywords.industry[0]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 경험 섹션 */}
            {groupedSections.experience.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">💼 경력 사항</h2>
                <div className="space-y-3">
                  {groupedSections.experience.map(section => (
                    <SectionEditor
                      key={section.section_id}
                      section={section}
                      onUpdate={handleSectionUpdate}
                      role={organizedContent.experiences[0]?.position}
                      targetJob={organizedContent.keywords.industry[0]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 프로젝트 섹션 */}
            {groupedSections.project.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">🚀 프로젝트</h2>
                <div className="space-y-3">
                  {groupedSections.project.map(section => (
                    <SectionEditor
                      key={section.section_id}
                      section={section}
                      onUpdate={handleSectionUpdate}
                      role={organizedContent.experiences[0]?.position}
                      targetJob={organizedContent.keywords.industry[0]}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* 편집 가이드 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">✨ 편집 가이드</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>각 섹션의 드롭다운(⌄)을 클릭하세요</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>"추천 문구 보기"로 AI 제안을 받아보세요</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>마음에 드는 제안을 선택하거나 직접 수정하세요</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>언제든 원본으로 되돌릴 수 있습니다</span>
                  </li>
                </ul>
              </div>

              {/* 변경 사항 요약 */}
              {changeSummary.totalChanges > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                >
                  <h3 className="font-medium text-orange-900 mb-2">
                    📝 변경 사항
                  </h3>
                  <div className="space-y-1">
                    {changeSummary.sections.map((sectionTitle, idx) => (
                      <div key={idx} className="text-sm text-orange-700">
                        • {sectionTitle}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 추천 톤 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">
                  💡 추천 스타일 조합
                </h3>
                <div className="space-y-2 text-sm text-purple-700">
                  <div>
                    <strong>면접용:</strong> 성과중심 + STAR형식
                  </div>
                  <div>
                    <strong>스타트업:</strong> 간결한 + 성과중심
                  </div>
                  <div>
                    <strong>대기업:</strong> 공식적 + ATS최적화
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 미리보기 모달 */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">포트폴리오 미리보기</h3>
                <div className="flex items-center space-x-3">
                  {changeSummary.totalChanges > 0 && (
                    <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                      {changeSummary.totalChanges}개 섹션 수정됨
                    </span>
                  )}
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                  className="portfolio-preview"
                />
              </div>
              
              <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 flex justify-center space-x-3">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  닫기
                </button>
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                  완료 & 내보내기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioSectionEditor;