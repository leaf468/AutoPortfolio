import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    EyeIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    SwatchIcon,
    PlusIcon,
    XMarkIcon,
    SparklesIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { PortfolioDocument } from '../services/autoFillService';
import { portfolioTemplates } from '../templates/portfolioTemplates';
import portfolioTextEnhancer, { ProjectData, PortfolioData } from '../services/portfolioTextEnhancer';
import BlurFade from './ui/BlurFade';
import Badge from './ui/Badge';

type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

interface EnhancedPortfolioEditorProps {
    document: PortfolioDocument;
    selectedTemplate?: TemplateType;
    onSave: (updatedDocument: PortfolioDocument) => void;
    onBack: () => void;
    onSkipToNaturalEdit?: () => void;
    onTemplateChange?: (template: TemplateType) => void;
}


const EnhancedPortfolioEditor: React.FC<EnhancedPortfolioEditorProps> = ({
    document,
    selectedTemplate = 'james',
    onSave,
    onBack,
    onSkipToNaturalEdit,
    onTemplateChange
}) => {
    const [portfolioData, setPortfolioData] = useState<PortfolioData>({
        name: '',
        title: '',
        email: '',
        phone: '',
        github: '',
        about: '',
        skills: [],
        projects: [],
        experience: [],
        education: []
    });

    const [currentHtml, setCurrentHtml] = useState<string>('');
    const [currentTemplate, setCurrentTemplate] = useState<TemplateType>(selectedTemplate);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showOthers, setShowOthers] = useState(false); // 기타 섹션 토글
    const [newSkill, setNewSkill] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedFields, setEnhancedFields] = useState<Record<string, boolean>>({}); // AI 생성 필드 추적
    const [sectionTitles, setSectionTitles] = useState({
        about: 'About Me',
        projects: '핵심 프로젝트',
        skills: '기술 스택',
        experience: '경력',
        education: '학력'
    });

    // 초기화 완료 상태 추적
    const hasInitialized = useRef(false);

    // HTML에서 실제 포트폴리오 데이터 추출 - 의존성에서 portfolioData 제거하여 무한 루프 방지
    const extractPortfolioData = useCallback((html: string): PortfolioData => {
        if (!html) return {
            name: '',
            title: '',
            email: '',
            phone: '',
            github: '',
            about: '',
            skills: [],
            projects: [],
            experience: [],
            education: []
        };

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const extractedData: PortfolioData = {
            name: '',
            title: '',
            email: '',
            phone: '',
            github: '',
            about: '',
            skills: [],
            projects: [],
            experience: [],
            education: []
        };

        // 이름 추출
        const nameElement = doc.querySelector('h1');
        if (nameElement) {
            extractedData.name = nameElement.textContent?.trim() || '';
        }

        // 직책 추출
        const titleElement = doc.querySelector('header p');
        if (titleElement) {
            extractedData.title = titleElement.textContent?.trim() || '';
        }

        // 연락처 추출
        const allTextElements = doc.querySelectorAll('p, span, div, a');
        allTextElements.forEach(el => {
            const text = el.textContent || '';

            if (text.includes('@')) {
                const emailMatch = text.match(/\S+@\S+\.\S+/);
                if (emailMatch) extractedData.email = emailMatch[0];
            }

            if (text.includes('010') || text.includes('+82')) {
                const phoneMatch = text.match(/[\d\-+\s()]+/);
                if (phoneMatch) extractedData.phone = phoneMatch[0].trim();
            }

            if (text.includes('github')) {
                const githubMatch = text.match(/github\.com\/[\w\-.]+/);
                if (githubMatch) extractedData.github = githubMatch[0];
            }
        });

        // About 섹션 추출
        const aboutSection = doc.querySelector('.about, section.about');
        if (aboutSection) {
            const aboutParagraphs = aboutSection.querySelectorAll('p');
            extractedData.about = Array.from(aboutParagraphs)
                .map(p => p.textContent?.trim())
                .filter(text => text && text.length > 0)
                .join('\n\n');
        }

        // 기술 스택 추출
        const skillElements = doc.querySelectorAll('.skill-tag, .skill, .tech-stack span');
        extractedData.skills = Array.from(skillElements)
            .map(el => el.textContent?.trim())
            .filter((skill): skill is string => !!skill && skill.length > 0);

        return extractedData;
    }, []);

    // 초기 데이터 로드 및 개선 - 한 번만 실행되도록 수정
    useEffect(() => {
        const initializeData = async () => {
            // 이미 초기화되었으면 실행하지 않음
            if (!document || hasInitialized.current) return;

            hasInitialized.current = true;

            const firstBlock = document.sections?.[0]?.blocks?.[0];
            if (firstBlock && firstBlock.text) {
                const html = firstBlock.text;
                setCurrentHtml(html);

                const extractedData = extractPortfolioData(html);

                // 데이터가 부족한 경우 AI로 개선 - 초기 로드 시에만
                if (!extractedData.about || extractedData.about.length < 50) {
                    setIsEnhancing(true);
                    try {
                        const enhanced = await portfolioTextEnhancer.enhancePortfolioData(extractedData);
                        setPortfolioData(enhanced);

                        // AI 생성 필드 표시
                        const generatedFields: Record<string, boolean> = {};
                        if (!extractedData.about && enhanced.about) {
                            generatedFields['about'] = true;
                        }
                        setEnhancedFields(generatedFields);
                    } catch (error) {
                        console.error('데이터 개선 실패:', error);
                        setPortfolioData(extractedData);
                    } finally {
                        setIsEnhancing(false);
                    }
                } else {
                    setPortfolioData(extractedData);
                }
            }
        };

        initializeData();
        // document만 의존성으로 하고, extractPortfolioData는 제거
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [document]);

    // 자기소개 개선
    const handleEnhanceAbout = async () => {
        setIsEnhancing(true);
        try {
            const enhanced = await portfolioTextEnhancer.enhanceAboutMe(portfolioData.about);
            setPortfolioData(prev => ({ ...prev, about: enhanced.enhanced }));
            if (enhanced.isGenerated) {
                setEnhancedFields(prev => ({ ...prev, about: true }));
            }
        } catch (error) {
            console.error('자기소개 개선 실패:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    // 프로젝트 추가
    const handleAddProject = () => {
        const newProject: ProjectData = {
            name: '새 프로젝트',
            description: '프로젝트 설명을 입력하세요',
            period: '',
            role: '',
            company: '',
            tech: []
        };
        setPortfolioData(prev => ({
            ...prev,
            projects: [...prev.projects, newProject]
        }));
    };

    // 경력 추가
    const handleAddExperience = () => {
        const newExperience = {
            position: '새 경력',
            company: '회사명',
            duration: '',
            description: '담당 업무를 입력하세요'
        };
        setPortfolioData(prev => ({
            ...prev,
            experience: [...prev.experience, newExperience]
        }));
    };

    // 학력 추가
    const handleAddEducation = () => {
        const newEducation = {
            school: '새 학력',
            degree: '전공/학위',
            period: '',
            description: '상세 내용을 입력하세요'
        };
        setPortfolioData(prev => ({
            ...prev,
            education: [...prev.education, newEducation]
        }));
    };

    // 프로젝트 수정
    const handleUpdateProject = (index: number, field: keyof ProjectData, value: string | string[]) => {
        setPortfolioData(prev => {
            const updatedProjects = [...prev.projects];
            updatedProjects[index] = {
                ...updatedProjects[index],
                [field]: value
            };
            return { ...prev, projects: updatedProjects };
        });
    };

    // 프로젝트 삭제
    const handleDeleteProject = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

    // 경력 수정
    const handleUpdateExperience = (index: number, field: string, value: string) => {
        setPortfolioData(prev => {
            const updatedExperience = [...prev.experience];
            updatedExperience[index] = {
                ...updatedExperience[index],
                [field]: value
            };
            return { ...prev, experience: updatedExperience };
        });
    };

    // 경력 삭제
    const handleDeleteExperience = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };

    // 학력 수정
    const handleUpdateEducation = (index: number, field: string, value: string) => {
        setPortfolioData(prev => {
            const updatedEducation = [...prev.education];
            updatedEducation[index] = {
                ...updatedEducation[index],
                [field]: value
            };
            return { ...prev, education: updatedEducation };
        });
    };

    // 학력 삭제
    const handleDeleteEducation = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // 프로젝트 개선
    const handleEnhanceProject = async (index: number) => {
        setIsEnhancing(true);
        try {
            const project = portfolioData.projects[index];
            const enhanced = await portfolioTextEnhancer.enhanceProject(project);

            setPortfolioData(prev => {
                const updatedProjects = [...prev.projects];
                updatedProjects[index] = {
                    name: enhanced.name,
                    description: enhanced.description,
                    period: enhanced.period || '',
                    role: enhanced.role || '',
                    company: enhanced.company || '',
                    tech: enhanced.tech || []
                };
                return { ...prev, projects: updatedProjects };
            });

            if (enhanced.enhanced?.isGenerated) {
                setEnhancedFields(prev => ({ ...prev, [`project_${index}`]: true }));
            }
        } catch (error) {
            console.error('프로젝트 개선 실패:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    // 스킬 추가
    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setPortfolioData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }));
            setNewSkill('');
        }
    };

    // 스킬 삭제
    const handleDeleteSkill = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    // HTML 업데이트
    const updateHtml = useCallback(() => {
        const template = portfolioTemplates[currentTemplate];
        if (template && template.generateHTML) {
            // 섹션 제목이 포함된 포트폴리오 데이터 생성
            const dataWithTitles = {
                ...portfolioData,
                sectionTitles: sectionTitles
            };
            const html = template.generateHTML(dataWithTitles);
            setCurrentHtml(html);
            return html;
        }
        return currentHtml;
    }, [portfolioData, sectionTitles, currentTemplate, currentHtml]);

    // 포트폴리오 데이터나 섹션 제목이 변경될 때마다 HTML 업데이트 (debounce 적용)
    useEffect(() => {
        if (portfolioData.name) { // 데이터가 로드된 후에만 실행
            const timer = setTimeout(() => {
                updateHtml();
            }, 100); // 100ms 디바운스

            return () => clearTimeout(timer);
        }
    }, [portfolioData, sectionTitles, currentTemplate, updateHtml]);

    // 저장 처리
    const handleSave = () => {
        const updatedHtml = updateHtml();
        const updatedDocument = {
            ...document,
            metadata: {
                extractedData: portfolioData,
                lastUpdated: new Date().toISOString()
            },
            sections: document.sections?.map(section => ({
                ...section,
                blocks: section.blocks?.map(block => ({
                    ...block,
                    text: updatedHtml,
                    extractedData: portfolioData
                }))
            }))
        };
        onSave(updatedDocument);
    };

    const handleTemplateChange = (templateId: TemplateType) => {
        setCurrentTemplate(templateId);
        setShowTemplateSelector(false);
        if (onTemplateChange) {
            onTemplateChange(templateId);
        }
        updateHtml();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={onBack}
                                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-semibold text-gray-900">포트폴리오 상세 편집</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            {onSkipToNaturalEdit && (
                                <button
                                    onClick={onSkipToNaturalEdit}
                                    className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    자연어 편집으로 건너뛰기
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 왼쪽: 편집 인터페이스 */}
                    <div className="space-y-6">
                        {/* 기본 정보 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">👤 기본 정보</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                        <input
                                            type="text"
                                            value={portfolioData.name || ''}
                                            onChange={(e) => setPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                                        <input
                                            type="text"
                                            value={portfolioData.title || ''}
                                            onChange={(e) => setPortfolioData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                        <input
                                            type="email"
                                            value={portfolioData.email || ''}
                                            onChange={(e) => setPortfolioData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                        <input
                                            type="tel"
                                            value={portfolioData.phone || ''}
                                            onChange={(e) => setPortfolioData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                                    <input
                                        type="text"
                                        value={portfolioData.github || ''}
                                        onChange={(e) => setPortfolioData(prev => ({ ...prev, github: e.target.value }))}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        placeholder="github.com/username"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 자기소개 - 큰 박스로 묶음 */}
                        <BlurFade delay={0.1}>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">💬 {sectionTitles.about}</h3>
                                <button
                                    onClick={handleEnhanceAbout}
                                    disabled={isEnhancing}
                                    className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-1" />
                                    {isEnhancing ? 'AI 개선 중...' : 'AI로 개선'}
                                </button>
                            </div>
                            <textarea
                                value={portfolioData.about || ''}
                                onChange={(e) => setPortfolioData(prev => ({ ...prev, about: e.target.value }))}
                                className={`w-full p-4 border rounded-lg min-h-[150px] ${
                                    enhancedFields['about']
                                        ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                                        : 'bg-white border-gray-300'
                                }`}
                                placeholder="자기소개를 입력하세요. AI가 전문적으로 개선해드립니다."
                            />
                            {enhancedFields['about'] && (
                                <p className="mt-2 text-xs text-yellow-700">
                                    ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                </p>
                            )}
                        </div>
                        </BlurFade>

                        {/* 프로젝트 */}
                        <BlurFade delay={0.2}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">🚀 {sectionTitles.projects}</h3>
                                <button
                                    onClick={handleAddProject}
                                    className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    프로젝트 추가
                                </button>
                            </div>

                            {portfolioData.projects.map((project, index) => (
                                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <input
                                            type="text"
                                            value={project.name || ''}
                                            onChange={(e) => handleUpdateProject(index, 'name', e.target.value)}
                                            className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEnhanceProject(index)}
                                                disabled={isEnhancing}
                                                className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                                title="AI로 개선"
                                            >
                                                <SparklesIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProject(index)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        value={project.description || ''}
                                        onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
                                        className={`w-full p-2 mb-3 border rounded min-h-[80px] ${
                                            enhancedFields[`project_${index}`]
                                                ? 'bg-yellow-50 border-yellow-300'
                                                : 'bg-white border-gray-300'
                                        }`}
                                        placeholder="프로젝트 설명"
                                    />

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-600">기간</label>
                                            <input
                                                type="text"
                                                value={project.period || ''}
                                                onChange={(e) => handleUpdateProject(index, 'period', e.target.value)}
                                                className="w-full p-1 text-sm border border-gray-300 rounded"
                                                placeholder="2023.01 - 2023.06"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">역할</label>
                                            <input
                                                type="text"
                                                value={project.role || ''}
                                                onChange={(e) => handleUpdateProject(index, 'role', e.target.value)}
                                                className="w-full p-1 text-sm border border-gray-300 rounded"
                                                placeholder="프론트엔드 개발"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">회사/단체</label>
                                            <input
                                                type="text"
                                                value={project.company || ''}
                                                onChange={(e) => handleUpdateProject(index, 'company', e.target.value)}
                                                className="w-full p-1 text-sm border border-gray-300 rounded"
                                                placeholder="○○회사"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {portfolioData.projects.length === 0 && (
                                <p className="text-gray-500 text-center py-8">
                                    프로젝트를 추가해주세요
                                </p>
                            )}
                        </div>
                        </BlurFade>

                        {/* 기술 스택 - 모던 Badge 스타일 */}
                        <BlurFade delay={0.3}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">🛠️ {sectionTitles.skills}</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {portfolioData.skills.map((skill, index) => (
                                        <div key={index} className="group relative">
                                            <Badge variant="primary" className="pr-8">
                                                {skill}
                                                <button
                                                    onClick={() => handleDeleteSkill(index)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                                    placeholder="기술 스택 추가 (예: React, TypeScript)"
                                />
                                <button
                                    onClick={handleAddSkill}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        </BlurFade>

                        {/* 경력 - 모던 카드 레이아웃 */}
                        <BlurFade delay={0.4}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">💼 {sectionTitles.experience}</h3>
                                    <button
                                        onClick={handleAddExperience}
                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        경력 추가
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {portfolioData.experience.map((exp: any, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <input
                                            type="text"
                                            value={exp.position || ''}
                                            onChange={(e) => handleUpdateExperience(index, 'position', e.target.value)}
                                            className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1 mr-4"
                                            placeholder="직책"
                                        />
                                        <button
                                            onClick={() => handleDeleteExperience(index)}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <input
                                                type="text"
                                                value={exp.company || ''}
                                                onChange={(e) => handleUpdateExperience(index, 'company', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                                placeholder="회사명"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={exp.duration || ''}
                                                onChange={(e) => handleUpdateExperience(index, 'duration', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                                placeholder="기간 (예: 2022.01 - 2023.12)"
                                            />
                                        </div>
                                    </div>

                                    <textarea
                                        value={exp.description || ''}
                                        onChange={(e) => handleUpdateExperience(index, 'description', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded min-h-[60px] text-sm"
                                        placeholder="담당 업무와 성과를 입력하세요"
                                    />
                                        </motion.div>
                                    ))}
                                </div>

                                {portfolioData.experience.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        경력을 추가해주세요
                                    </p>
                                )}
                            </div>
                        </BlurFade>

                        {/* 학력 - 모던 카드 레이아웃 */}
                        <BlurFade delay={0.5}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">🎓 {sectionTitles.education}</h3>
                                    <button
                                        onClick={handleAddEducation}
                                        className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        학력 추가
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {portfolioData.education.map((edu: any, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 bg-gradient-to-r from-indigo-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                                        >
                                    <div className="flex items-start justify-between mb-3">
                                        <input
                                            type="text"
                                            value={edu.school || ''}
                                            onChange={(e) => handleUpdateEducation(index, 'school', e.target.value)}
                                            className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none flex-1 mr-4"
                                            placeholder="학교명"
                                        />
                                        <button
                                            onClick={() => handleDeleteEducation(index)}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <input
                                                type="text"
                                                value={edu.degree || ''}
                                                onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                                placeholder="전공/학위"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={edu.period || ''}
                                                onChange={(e) => handleUpdateEducation(index, 'period', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                                placeholder="기간 (예: 2018.03 - 2022.02)"
                                            />
                                        </div>
                                    </div>

                                    <textarea
                                        value={edu.description || ''}
                                        onChange={(e) => handleUpdateEducation(index, 'description', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded min-h-[60px] text-sm"
                                        placeholder="전공 내용이나 특이사항을 입력하세요"
                                    />
                                        </motion.div>
                                    ))}
                                </div>

                                {portfolioData.education.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        학력을 추가해주세요
                                    </p>
                                )}
                            </div>
                        </BlurFade>

                        {/* 기타 - 섹션 제목 편집 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <button
                                onClick={() => setShowOthers(!showOthers)}
                                className="w-full flex items-center justify-between text-lg font-bold text-gray-900"
                            >
                                <span>⚙️ 섹션 제목 편집</span>
                                {showOthers ? (
                                    <ChevronUpIcon className="w-5 h-5" />
                                ) : (
                                    <ChevronDownIcon className="w-5 h-5" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showOthers && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 space-y-4"
                                    >
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">포트폴리오 섹션 제목 수정</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">자기소개 섹션</label>
                                                    <input
                                                        type="text"
                                                        value={sectionTitles.about}
                                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, about: e.target.value }))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded"
                                                        placeholder="About Me"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">프로젝트 섹션</label>
                                                    <input
                                                        type="text"
                                                        value={sectionTitles.projects}
                                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, projects: e.target.value }))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded"
                                                        placeholder="핵심 프로젝트"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">기술 스택 섹션</label>
                                                    <input
                                                        type="text"
                                                        value={sectionTitles.skills}
                                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, skills: e.target.value }))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded"
                                                        placeholder="기술 스택"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">경력 섹션</label>
                                                    <input
                                                        type="text"
                                                        value={sectionTitles.experience}
                                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, experience: e.target.value }))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded"
                                                        placeholder="경력"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">학력 섹션</label>
                                                    <input
                                                        type="text"
                                                        value={sectionTitles.education}
                                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, education: e.target.value }))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded"
                                                        placeholder="학력"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-500">
                                                💡 섹션 제목을 원하는 대로 수정할 수 있습니다. (예: "About Me" → "소개", "핵심 프로젝트" → "주요 작업물")
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* 오른쪽: HTML 미리보기 */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <EyeIcon className="w-5 h-5 mr-2 text-purple-600" />
                                실시간 미리보기
                            </h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                    {portfolioTemplates[currentTemplate]?.name || currentTemplate} 스타일
                                </span>
                                <button
                                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="다른 템플릿 선택"
                                >
                                    <SwatchIcon className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* 템플릿 선택 드롭다운 */}
                        <AnimatePresence>
                            {showTemplateSelector && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-6 top-16 bg-white rounded-lg border border-gray-200 shadow-lg z-10 p-2 min-w-48"
                                >
                                    <div className="text-sm text-gray-700 mb-2 px-2 py-1 font-medium">템플릿 선택</div>
                                    {Object.entries(portfolioTemplates).map(([key, template]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleTemplateChange(key as TemplateType)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                currentTemplate === key
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <div className="font-medium">{template.name}</div>
                                            <div className="text-xs text-gray-500">{template.description}</div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* HTML 미리보기 */}
                        <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px] bg-white">
                            <iframe
                                srcDoc={currentHtml}
                                className="w-full h-[600px] border-0"
                                title="Portfolio Preview"
                                style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: '750px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedPortfolioEditor;