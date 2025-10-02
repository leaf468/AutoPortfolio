import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    EyeIcon,
    ArrowRightIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { portfolioTemplates } from '../templates/portfolioTemplates';

type TemplateType = 'minimal' | 'clean' | 'colorful' | 'elegant';

interface TemplateSelectorProps {
    onTemplateSelect: (templateType: TemplateType) => void;
    selectedTemplate?: TemplateType;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    onTemplateSelect,
    selectedTemplate
}) => {
    const [previewTemplate, setPreviewTemplate] = useState<TemplateType | null>(null);

    const handlePreview = (templateType: TemplateType) => {
        setPreviewTemplate(templateType);
    };

    const handleClosePreview = () => {
        setPreviewTemplate(null);
    };

    const handleSelectTemplate = (templateType: TemplateType) => {
        onTemplateSelect(templateType);
        setPreviewTemplate(null);
    };

    return (
        <div className="template-selector">
            {/* 헤더 */}
            <div className="mb-4 text-center">
                <div className="flex items-center justify-center mb-2">
                    <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
                    <h2 className="text-2xl font-bold text-gray-900">포트폴리오 템플릿 선택</h2>
                </div>
                <p className="text-sm text-gray-600">
                    원하시는 디자인 스타일을 선택해주세요
                </p>
            </div>

            {/* 템플릿 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                {Object.entries(portfolioTemplates).map(([templateType, template]) => {
                    const isSelected = selectedTemplate === templateType;
                    
                    return (
                        <motion.div
                            key={templateType}
                            onClick={() => handleSelectTemplate(templateType as TemplateType)}
                            className={`relative bg-white rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                                isSelected
                                    ? 'border-purple-500 ring-4 ring-purple-200'
                                    : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* 템플릿 미리보기 */}
                            <div
                                className="relative h-36 overflow-hidden rounded-t-xl"
                                style={{
                                    background: template.designSystem?.colors?.background || '#ffffff'
                                }}
                            >
                                <div className="p-4 h-full flex flex-col">
                                    {/* 헤더 영역 */}
                                    <div className="mb-2">
                                        <div
                                            className={`text-base mb-1 ${
                                                templateType === 'minimal' ? 'font-light' :
                                                templateType === 'clean' ? 'font-bold' :
                                                templateType === 'colorful' ? 'font-extrabold' :
                                                'font-medium'
                                            }`}
                                            style={{ color: template.designSystem?.colors?.primary || '#000000' }}
                                        >
                                            Your name
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{
                                                color: template.designSystem?.colors?.secondary || '#6B7280'
                                            }}
                                        >
                                            풀스택 개발자
                                        </div>
                                    </div>

                                    {/* 스킬 태그 */}
                                    <div className="mb-2 flex flex-wrap gap-1">
                                        {['React', 'TypeScript', 'Node.js'].map((skill, idx) => (
                                            <div
                                                key={idx}
                                                className={`px-1.5 py-0.5 text-[10px] ${
                                                    templateType === 'minimal' ? 'border-2 bg-transparent' :
                                                    templateType === 'clean' ? 'rounded-sm' :
                                                    templateType === 'colorful' ? 'rounded-full' :
                                                    'rounded-lg'
                                                }`}
                                                style={{
                                                    backgroundColor: templateType === 'minimal' ? 'transparent' :
                                                                   template.designSystem?.colors?.secondary || '#6366f1',
                                                    color: templateType === 'minimal' ?
                                                           template.designSystem?.colors?.primary : 'white',
                                                    borderColor: templateType === 'minimal' ?
                                                                template.designSystem?.colors?.primary : 'transparent',
                                                    borderWidth: templateType === 'minimal' ? '2px' : '0'
                                                }}
                                            >
                                                {skill}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 템플릿별 특징적 요소 */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        {templateType === 'minimal' ? (
                                            // 미니멀 - 단순한 라인과 타이포그래피
                                            <div className="space-y-4">
                                                <div
                                                    className="w-full h-px"
                                                    style={{ backgroundColor: template.designSystem?.colors?.primary }}
                                                />
                                                <div className="text-center text-sm font-light text-gray-500">
                                                    Clean & Minimal
                                                </div>
                                                <div
                                                    className="w-full h-px"
                                                    style={{ backgroundColor: template.designSystem?.colors?.primary }}
                                                />
                                            </div>
                                        ) : templateType === 'clean' ? (
                                            // 기업형 - 깔끔한 라인과 타이포그래피
                                            <div className="space-y-4">
                                                <div
                                                    className="w-full h-px"
                                                    style={{ backgroundColor: template.designSystem?.colors?.primary }}
                                                />
                                                <div className="text-center text-sm font-semibold">
                                                    <span style={{ color: template.designSystem?.colors?.primary }}>Business</span>
                                                    <span className="mx-1">&</span>
                                                    <span style={{ color: template.designSystem?.colors?.accent }}>Professional</span>
                                                </div>
                                                <div
                                                    className="w-full h-px"
                                                    style={{ backgroundColor: template.designSystem?.colors?.primary }}
                                                />
                                            </div>
                                        ) : templateType === 'colorful' ? (
                                            // 컬러풀 - 활동적인 색상 조합
                                            <div className="space-y-4">
                                                <div className="flex justify-center space-x-2">
                                                    <div
                                                        className="w-8 h-8 rounded-full"
                                                        style={{ backgroundColor: template.designSystem?.colors?.primary }}
                                                    />
                                                    <div
                                                        className="w-8 h-8 rounded-full"
                                                        style={{ backgroundColor: template.designSystem?.colors?.secondary }}
                                                    />
                                                    <div
                                                        className="w-8 h-8 rounded-full"
                                                        style={{ backgroundColor: template.designSystem?.colors?.accent }}
                                                    />
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400" />
                                                </div>
                                                <div className="text-center text-sm font-bold">
                                                    <span style={{ color: template.designSystem?.colors?.primary }}>Colorful</span>
                                                    <span className="mx-1">&</span>
                                                    <span style={{ color: template.designSystem?.colors?.accent }}>Dynamic</span>
                                                </div>
                                            </div>
                                        ) : (
                                            // 엘레간트 - 우아한 그라데이션
                                            <div className="space-y-4">
                                                <div
                                                    className="w-full h-1 rounded-full opacity-80"
                                                    style={{ background: `linear-gradient(90deg, ${template.designSystem?.colors?.primary}20, ${template.designSystem?.colors?.primary}, ${template.designSystem?.colors?.accent})` }}
                                                />
                                                <div className="text-center text-sm italic" style={{ color: template.designSystem?.colors?.secondary }}>
                                                    Elegant & Sophisticated
                                                </div>
                                                <div
                                                    className="w-full h-1 rounded-full opacity-60"
                                                    style={{ background: `linear-gradient(90deg, ${template.designSystem?.colors?.accent}20, ${template.designSystem?.colors?.accent}, ${template.designSystem?.colors?.primary})` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 선택됨 표시 */}
                                {isSelected && (
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-purple-600 text-white rounded-full p-2">
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 템플릿 정보 */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {template.name}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: template.designSystem?.colors?.primary || '#6366f1' }}
                                        />
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: template.designSystem?.colors?.secondary || '#8b5cf6' }}
                                        />
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: template.designSystem?.colors?.accent || '#f59e0b' }}
                                        />
                                    </div>
                                </div>

                                <p className="text-gray-600 text-[11px] mb-2 leading-relaxed">
                                    {template.description}
                                </p>

                                {/* 특징 태그 */}
                                <div className="flex flex-wrap gap-1 mb-2.5">
                                    {(template.features || ['반응형', '모던', '깔끔한']).map((feature: any, idx: any) => (
                                        <span
                                            key={idx}
                                            className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* 액션 버튼 */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(templateType as TemplateType);
                                        }}
                                        className="flex-1 flex items-center justify-center px-2.5 py-1.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-[11px] font-medium"
                                    >
                                        <EyeIcon className="w-3.5 h-3.5 mr-1" />
                                        미리보기
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectTemplate(templateType as TemplateType);
                                        }}
                                        className={`flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-colors text-[11px] font-medium ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        }`}
                                    >
                                        {isSelected ? (
                                            <>
                                                <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                                                선택됨
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRightIcon className="w-3.5 h-3.5 mr-1" />
                                                선택하기
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 미리보기 모달 */}
            <AnimatePresence>
                {previewTemplate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={handleClosePreview}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 모달 헤더 */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {portfolioTemplates[previewTemplate].sampleData?.name || portfolioTemplates[previewTemplate].name} 스타일 미리보기
                                </h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleSelectTemplate(previewTemplate)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        이 템플릿 선택
                                    </button>
                                    <button
                                        onClick={handleClosePreview}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>

                            {/* 미리보기 콘텐츠 */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                                <div 
                                    className="portfolio-preview"
                                    dangerouslySetInnerHTML={{
                                        __html: portfolioTemplates[previewTemplate]?.generateHTML?.({
                                            name: portfolioTemplates[previewTemplate]?.sampleData?.name || '홍길동',
                                            title: portfolioTemplates[previewTemplate]?.sampleData?.title || '개발자',
                                            contact: portfolioTemplates[previewTemplate]?.sampleData?.contact || {},
                                            about: portfolioTemplates[previewTemplate]?.sampleData?.about || '안녕하세요',
                                            skills: portfolioTemplates[previewTemplate]?.sampleData?.skills || ['React', 'TypeScript'],
                                            experience: portfolioTemplates[previewTemplate]?.sampleData?.experience || [],
                                            projects: portfolioTemplates[previewTemplate]?.sampleData?.projects || [],
                                            education: portfolioTemplates[previewTemplate]?.sampleData?.education || []
                                        }) || '<div>미리보기를 사용할 수 없습니다</div>'
                                    }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TemplateSelector;