import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    EyeIcon,
    ArrowRightIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { portfolioTemplates } from '../templates/portfolioTemplates';

type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

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
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                    <SparklesIcon className="w-8 h-8 text-purple-600 mr-3" />
                    <h2 className="text-3xl font-bold text-gray-900">포트폴리오 템플릿 선택</h2>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    원하시는 디자인 스타일을 선택해주세요. 각 템플릿은 실제 개발자들의 포트폴리오를 기반으로 제작되었습니다.
                </p>
            </div>

            {/* 템플릿 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {Object.entries(portfolioTemplates).map(([templateType, template]) => {
                    const isSelected = selectedTemplate === templateType;
                    
                    return (
                        <motion.div
                            key={templateType}
                            className={`relative bg-white rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                                isSelected
                                    ? 'border-purple-500 ring-4 ring-purple-200'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* 템플릿 미리보기 */}
                            <div 
                                className="relative h-80 overflow-hidden rounded-t-xl"
                                style={{
                                    background: template.designSystem?.colors?.background || '#ffffff'
                                }}
                            >
                                <div className="p-6 h-full flex flex-col">
                                    {/* 헤더 영역 */}
                                    <div className="mb-6">
                                        <div 
                                            className={`text-2xl mb-3 ${
                                                templateType === 'james' ? 'font-light' :
                                                templateType === 'geon' ? 'font-bold' :
                                                templateType === 'eunseong' ? 'font-extrabold' :
                                                'font-medium'
                                            }`}
                                            style={{ color: template.designSystem?.colors?.primary || '#000000' }}
                                        >
                                            김포트폴리오
                                        </div>
                                        <div 
                                            className="text-lg"
                                            style={{ 
                                                color: template.designSystem?.colors?.secondary || '#6B7280'
                                            }}
                                        >
                                            풀스택 개발자
                                        </div>
                                    </div>

                                    {/* 스킬 태그 */}
                                    <div className="mb-6 flex flex-wrap gap-2">
                                        {['React', 'TypeScript', 'Node.js'].map((skill, idx) => (
                                            <div 
                                                key={idx}
                                                className={`px-3 py-1 text-sm ${
                                                    templateType === 'james' ? 'border-2 bg-transparent' :
                                                    templateType === 'geon' ? 'rounded-sm' :
                                                    templateType === 'eunseong' ? 'rounded-full' :
                                                    'rounded-lg'
                                                }`}
                                                style={{ 
                                                    backgroundColor: templateType === 'james' ? 'transparent' : 
                                                                   template.designSystem?.colors?.secondary || '#6366f1',
                                                    color: templateType === 'james' ? 
                                                           template.designSystem?.colors?.primary : 'white',
                                                    borderColor: templateType === 'james' ? 
                                                                template.designSystem?.colors?.primary : 'transparent',
                                                    borderWidth: templateType === 'james' ? '2px' : '0'
                                                }}
                                            >
                                                {skill}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 템플릿별 특징적 요소 */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        {templateType === 'james' ? (
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
                                        ) : templateType === 'geon' ? (
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
                                        ) : templateType === 'eunseong' ? (
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
                                                <div className="w-full h-1 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-600 rounded-full opacity-80"></div>
                                                <div className="text-center text-sm italic text-gray-500">
                                                    Elegant & Sophisticated
                                                </div>
                                                <div className="w-full h-1 bg-gradient-to-r from-pink-200 via-pink-400 to-pink-600 rounded-full opacity-60"></div>
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
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {template.name} 스타일
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: template.designSystem?.colors?.primary || '#6366f1' }}
                                        />
                                        <span 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: template.designSystem?.colors?.secondary || '#8b5cf6' }}
                                        />
                                        <span 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: template.designSystem?.colors?.accent || '#f59e0b' }}
                                        />
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-4">
                                    {template.description}
                                </p>

                                {/* 특징 태그 */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(template.features || ['반응형', '모던', '깔끔한']).map((feature: any, idx: any) => (
                                        <span 
                                            key={idx}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* 액션 버튼 */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handlePreview(templateType as TemplateType)}
                                        className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <EyeIcon className="w-4 h-4 mr-2" />
                                        미리보기
                                    </button>
                                    <button
                                        onClick={() => handleSelectTemplate(templateType as TemplateType)}
                                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                                            isSelected
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        }`}
                                    >
                                        {isSelected ? (
                                            <>
                                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                선택됨
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRightIcon className="w-4 h-4 mr-2" />
                                                선택
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