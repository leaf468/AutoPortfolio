import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PencilIcon,
    EyeIcon,
    DocumentTextIcon,
    SparklesIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    PlusIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { parsePortfolioHTML, reconstructHTML, EditableSection, textToHTML, extractTextContent } from '../utils/htmlParser';
import { PortfolioDocument } from '../services/autoFillService';

interface EnhancedPortfolioEditorProps {
    document: PortfolioDocument;
    onSave: (updatedDocument: PortfolioDocument) => void;
    onBack: () => void;
    onSkipToNaturalEdit?: () => void;
}

const EnhancedPortfolioEditor: React.FC<EnhancedPortfolioEditorProps> = ({
    document,
    onSave,
    onBack,
    onSkipToNaturalEdit
}) => {
    const [sections, setSections] = useState<EditableSection[]>([]);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [currentHtml, setCurrentHtml] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // 초기 HTML 파싱
    useEffect(() => {
        if (document && document.sections.length > 0) {
            const mainSection = document.sections[0];
            const htmlContent = mainSection.blocks[0]?.text || '';
            
            const parsed = parsePortfolioHTML(htmlContent);
            setSections(parsed.sections);
            setCurrentHtml(parsed.fullHtml);
        }
    }, [document]);

    // 섹션 편집 시작
    const startEditingSection = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            setEditingSection(sectionId);
            setEditTitle(section.title);
            setEditText(extractTextContent(section.content));
        }
    };

    // 섹션 편집 저장
    const saveSection = () => {
        if (!editingSection) return;

        const updatedSections = sections.map(section => {
            if (section.id === editingSection) {
                return {
                    ...section,
                    title: editTitle,
                    content: textToHTML(editText)
                };
            }
            return section;
        });

        setSections(updatedSections);
        setEditingSection(null);
        setEditText('');
        setEditTitle('');
        setHasChanges(true);

        // HTML 재구성
        const newHtml = reconstructHTML(currentHtml, updatedSections);
        setCurrentHtml(newHtml);
    };

    // 편집 취소
    const cancelEdit = () => {
        setEditingSection(null);
        setEditText('');
        setEditTitle('');
    };

    // 새 섹션 추가
    const addNewSection = () => {
        const newSection: EditableSection = {
            id: `new-section-${Date.now()}`,
            title: '새 섹션',
            content: '<p>여기에 내용을 추가하세요...</p>',
            type: 'other',
            editable: true
        };

        setSections([...sections, newSection]);
        setHasChanges(true);
        startEditingSection(newSection.id);
    };

    // 섹션 삭제
    const deleteSection = (sectionId: string) => {
        if (window.confirm('이 섹션을 삭제하시겠습니까?')) {
            const updatedSections = sections.filter(s => s.id !== sectionId);
            setSections(updatedSections);
            setHasChanges(true);
            
            const newHtml = reconstructHTML(currentHtml, updatedSections);
            setCurrentHtml(newHtml);
        }
    };

    // 변경사항 저장
    const saveChanges = () => {
        const finalHtml = reconstructHTML(currentHtml, sections);
        
        const updatedDocument: PortfolioDocument = {
            ...document,
            sections: [
                {
                    ...document.sections[0],
                    blocks: [
                        {
                            ...document.sections[0].blocks[0],
                            text: finalHtml,
                            origin: 'user_edited',
                            updated_at: new Date().toISOString()
                        }
                    ]
                }
            ],
            updated_at: new Date().toISOString()
        };

        onSave(updatedDocument);
        setHasChanges(false);
    };

    // 섹션 타입별 아이콘
    const getSectionIcon = (type: EditableSection['type']) => {
        const icons = {
            header: DocumentTextIcon,
            about: DocumentTextIcon,
            projects: SparklesIcon,
            skills: SparklesIcon,
            experience: DocumentTextIcon,
            contact: DocumentTextIcon,
            other: DocumentTextIcon
        };
        return icons[type] || DocumentTextIcon;
    };

    // 섹션 타입별 색상
    const getSectionColor = (type: EditableSection['type']) => {
        const colors = {
            header: 'bg-purple-50 border-purple-200 text-purple-700',
            about: 'bg-blue-50 border-blue-200 text-blue-700',
            projects: 'bg-green-50 border-green-200 text-green-700',
            skills: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            experience: 'bg-red-50 border-red-200 text-red-700',
            contact: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            other: 'bg-gray-50 border-gray-200 text-gray-700'
        };
        return colors[type] || colors.other;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">포트폴리오 편집기</h1>
                        <p className="text-gray-600">AI가 생성한 포트폴리오를 섹션별로 편집하고 개선하세요</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {hasChanges && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center text-amber-600"
                            >
                                <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                                저장되지 않은 변경사항
                            </motion.div>
                        )}
                        
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('edit')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'edit'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <PencilIcon className="w-4 h-4 inline mr-2" />
                                편집
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'preview'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <EyeIcon className="w-4 h-4 inline mr-2" />
                                미리보기
                            </button>
                        </div>

                        <button
                            onClick={saveChanges}
                            disabled={!hasChanges}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                hasChanges
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                            완료
                        </button>

                        {onSkipToNaturalEdit && (
                            <button
                                onClick={onSkipToNaturalEdit}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                                <SparklesIcon className="w-4 h-4 inline mr-2" />
                                자연어 편집
                            </button>
                        )}
                        
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* 편집 모드 */}
                {viewMode === 'edit' && (
                    <>
                        {/* 섹션 리스트 */}
                        <div className="col-span-5 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">포트폴리오 섹션</h2>
                                <button
                                    onClick={addNewSection}
                                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    섹션 추가
                                </button>
                            </div>

                            {sections.map((section, index) => {
                                const Icon = getSectionIcon(section.type);
                                const isEditing = editingSection === section.id;
                                
                                return (
                                    <motion.div
                                        key={section.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`bg-white rounded-lg border-2 transition-all ${
                                            isEditing ? 'border-purple-300 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSectionColor(section.type)}`}>
                                                        <Icon className="w-3 h-3 mr-1" />
                                                        {section.type}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    {!isEditing && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditingSection(section.id)}
                                                                className="p-1 text-gray-500 hover:text-purple-600"
                                                                title="편집"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSection(section.id)}
                                                                className="p-1 text-gray-500 hover:text-red-600"
                                                                title="삭제"
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <h3 className="font-medium text-gray-900 mb-2">{section.title}</h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {extractTextContent(section.content)}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* 편집 패널 */}
                        <div className="col-span-7">
                            <AnimatePresence mode="wait">
                                {editingSection ? (
                                    <motion.div
                                        key="editing"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">섹션 편집</h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    섹션 제목
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="섹션 제목을 입력하세요"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    내용
                                                </label>
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    rows={12}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                                                    placeholder="섹션 내용을 입력하세요..."
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    * 각 문단은 빈 줄로 구분됩니다
                                                </p>
                                            </div>
                                            
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={saveSection}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
                                    >
                                        <PencilIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">편집할 섹션을 선택하세요</h3>
                                        <p className="text-gray-600">좌측의 섹션을 클릭하여 편집을 시작하세요</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                {/* 미리보기 모드 */}
                {viewMode === 'preview' && (
                    <div className="col-span-12">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">포트폴리오 미리보기</h3>
                            <div 
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: currentHtml }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedPortfolioEditor;