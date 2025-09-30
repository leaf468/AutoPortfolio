import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    EyeIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    SwatchIcon,
    PlusIcon,
    XMarkIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { portfolioTemplates } from '../../templates/portfolioTemplates';
import portfolioTextEnhancer from '../../services/portfolioTextEnhancer';
import BlurFade from '../ui/BlurFade';
import Badge from '../ui/Badge';
import { BaseEditorProps, ColorfulPortfolioData, ProjectData, ExperienceData, SkillCategory } from './types';
import { useScrollPreservation } from '../../hooks/useScrollPreservation';

// 스킬 입력 컴포넌트
const SkillInput: React.FC<{
    categoryIndex: number;
    onAddSkill: (categoryIndex: number, skill: string) => void;
}> = ({ categoryIndex, onAddSkill }) => {
    const [skillInput, setSkillInput] = useState('');

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            onAddSkill(categoryIndex, skillInput.trim());
            setSkillInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddSkill();
        }
    };

    return (
        <div className="flex gap-2">
            <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3 py-1.5 text-sm border border-purple-300 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none transition-colors"
                placeholder="기술 스택 추가 (예: React, Figma)"
            />
            <button
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const ColorfulEditor: React.FC<BaseEditorProps> = ({
    document,
    selectedTemplate,
    onSave,
    onBack,
    onSkipToNaturalEdit,
    onTemplateChange
}) => {
    const [portfolioData, setPortfolioData] = useState<ColorfulPortfolioData>({
        name: '',
        title: '',
        email: '',
        phone: '',
        github: '',
        about: '',
        skills: [],
        skillCategories: [
            { category: '프론트엔드', skills: [], icon: '🎨' },
            { category: '디자인', skills: [], icon: '✨' }
        ],
        projects: [],
        experience: []
    });

    const [currentHtml, setCurrentHtml] = useState<string>('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedFields, setEnhancedFields] = useState<Record<string, boolean>>({});
    const [isInitializing, setIsInitializing] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Colorful 템플릿 전용 섹션 제목
    const [sectionTitles, setSectionTitles] = useState({
        contact: '기본 정보',
        about: 'About Me',
        experience: 'Experience',
        projects: 'Projects',
        skills: 'Skills'
    });

    const hasInitialized = useRef(false);
    const { iframeRef, preserveScrollAndUpdate } = useScrollPreservation();

    // HTML에서 포트폴리오 데이터 추출
    const extractPortfolioData = useCallback((html: string): ColorfulPortfolioData => {
        if (!html) {
            return {
                name: '',
                title: '',
                email: '',
                phone: '',
                github: '',
                about: '',
                skills: [],
                skillCategories: [],
                projects: [],
                experience: []
            };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const extractedData: ColorfulPortfolioData = {
            name: '',
            title: '',
            email: '',
            phone: '',
            github: '',
            about: '',
            skills: [],
            projects: [],
            experience: []
        };

        // 이름 추출
        const nameElement = doc.querySelector('.hero h1');
        if (nameElement) {
            extractedData.name = nameElement.textContent?.replace('👩🏻‍💻 ', '').trim() || '';
        }

        // 직책 추출
        const titleElement = doc.querySelector('.hero .subtitle');
        if (titleElement) {
            extractedData.title = titleElement.textContent?.trim() || '';
        }

        // About 섹션 추출
        const aboutCard = doc.querySelector('.section .card p');
        if (aboutCard) {
            extractedData.about = aboutCard.textContent?.trim() || '';
        }

        // 기술 스택 추출
        const skillElements = doc.querySelectorAll('.skill-item p');
        extractedData.skills = Array.from(skillElements)
            .map(el => el.textContent?.trim())
            .filter((skill): skill is string => !!skill && skill.length > 0);

        return extractedData;
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        const initializeData = async () => {
            if (!document || hasInitialized.current) return;

            hasInitialized.current = true;
            setIsInitializing(true);

            try {
                const firstBlock = document.sections?.[0]?.blocks?.[0];
                if (firstBlock && firstBlock.text) {
                    const html = firstBlock.text;
                    setCurrentHtml(html);

                    let actualData: ColorfulPortfolioData;

                    if (firstBlock.extractedData) {
                        const extracted = firstBlock.extractedData as any;
                        actualData = {
                            ...extracted,
                            education: [] // Colorful 템플릿은 education 지원 안함
                        };
                        delete (actualData as any).location; // location 필드도 제거
                    } else {
                        actualData = extractPortfolioData(html);
                    }

                    if (actualData.name || actualData.title || actualData.about) {
                        // skillCategories가 없으면 기존 skills 배열로부터 생성
                        if (!actualData.skillCategories && actualData.skills?.length > 0) {
                            const midPoint = Math.ceil(actualData.skills.length / 2);
                            actualData.skillCategories = [
                                {
                                    category: '프론트엔드',
                                    skills: actualData.skills.slice(0, midPoint),
                                    icon: '🎨'
                                },
                                {
                                    category: '디자인',
                                    skills: actualData.skills.slice(midPoint),
                                    icon: '✨'
                                }
                            ];
                        } else if (!actualData.skillCategories || actualData.skillCategories.length === 0) {
                            // 아예 스킬이 없으면 기본 구조 생성
                            actualData.skillCategories = [
                                { category: '프론트엔드', skills: [], icon: '🎨' },
                                { category: '디자인', skills: [], icon: '✨' }
                            ];
                        }

                        setPortfolioData(actualData);
                        setDataLoaded(true);

                        // 🔧 CRITICAL FIX: Force immediate HTML regeneration with correct template
                        setTimeout(async () => {
                            console.log('🔧 ColorfulEditor: Force updating HTML with correct template on initialization');
                            await updateHtml();
                        }, 100);
                    }

                    // 데이터가 부족한 경우 AI로 개선
                    const needsEnhancement = !actualData.about || actualData.about.length < 50;
                    if (needsEnhancement) {
                        setIsEnhancing(true);
                        try {
                            const enhanced = await portfolioTextEnhancer.enhancePortfolioData(actualData);
                            const { education, location, ...enhancedWithoutExtraFields } = enhanced;
                            const enhancedColorfulData: ColorfulPortfolioData = enhancedWithoutExtraFields;
                            setPortfolioData(enhancedColorfulData);

                            const generatedFields: Record<string, boolean> = {};
                            if (!actualData.about && enhanced.about) {
                                generatedFields['about'] = true;
                            }
                            setEnhancedFields(generatedFields);
                        } catch (error) {
                            console.error('데이터 개선 실패:', error);
                            if (!dataLoaded) {
                                setPortfolioData(actualData);
                            }
                        } finally {
                            setIsEnhancing(false);
                        }
                    }

                    setDataLoaded(true);
                }
            } catch (error) {
                console.error('초기 데이터 로딩 실패:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeData();
    }, [document, extractPortfolioData, dataLoaded]);

    // HTML 업데이트
    const updateHtml = useCallback(async () => {
        console.log('🔧 ColorfulEditor updateHtml:');
        console.log('  - selectedTemplate prop:', selectedTemplate);
        console.log('  - portfolioTemplates keys:', Object.keys(portfolioTemplates));

        // Always use colorful template for ColorfulEditor
        const template = portfolioTemplates['colorful'];
        console.log('  - template found:', !!template);
        console.log('  - template.name:', template?.name);
        console.log('  - template.id:', template?.id);

        if (template?.generateHTML) {
            // Colorful 템플릿에 맞는 데이터 구조 생성
            const dataForTemplate = {
                name: portfolioData.name || '포트폴리오 작성자',
                title: portfolioData.title || '크리에이티브 개발자',
                description: '창의적이고 매력적인 디지털 경험을 만들어가는 개발자입니다',
                about: portfolioData.about || '창의적인 개발자로서 아름답고 기능적인 애플리케이션을 현대 기술로 구축하는데 열정적입니다.',
                email: portfolioData.email || 'contact@example.com',
                github: portfolioData.github ? `https://${portfolioData.github}` : 'https://github.com/username',
                linkedin: portfolioData.phone ? `tel:${portfolioData.phone}` : 'https://linkedin.com/in/username',
                skills: portfolioData.skillCategories?.flatMap(cat => cat.skills) || portfolioData.skills || [],
                skillCategories: portfolioData.skillCategories?.length > 0 ? portfolioData.skillCategories : [
                    {
                        category: '프론트엔드',
                        skills: ['React', 'Vue.js', 'TypeScript', 'CSS'],
                        icon: '🎨'
                    },
                    {
                        category: '디자인',
                        skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
                        icon: '✨'
                    }
                ],
                experience: portfolioData.experience?.map(exp => ({
                    ...exp,
                    achievements: exp.achievements || ['사용자 경험 향상', '성능 최적화 달성']
                })) || [],
                projects: portfolioData.projects?.map(project => ({
                    ...project,
                    tech: project.tech?.length > 0 ? project.tech : ['React', 'Framer Motion', 'Styled Components'],
                    results: project.results || ['월 방문자 증가', '디자인 어워드 수상']
                })) || [],
                sectionTitles: sectionTitles
            };

            // Colorful 템플릿에서 sectionTitles를 활용하도록 개선된 HTML 생성
            const html = template.generateHTML(dataForTemplate).replace(
                /<h2 class="section-title">([^<]+)<\/h2>/g,
                (match, originalTitle) => {
                    // 섹션 제목 매핑
                    const titleMap: Record<string, string> = {
                        'About Me': sectionTitles.about,
                        'Experience': sectionTitles.experience,
                        'Projects': sectionTitles.projects,
                        'Skills': sectionTitles.skills
                    };
                    return `<h2 class="section-title">${titleMap[originalTitle] || originalTitle}</h2>`;
                }
            );
            console.log('  - HTML generated with template:', template.name);
            console.log('  - HTML preview (first 100 chars):', html.substring(0, 100));

            // Update with scroll preservation - use async but don't await to prevent blocking
            preserveScrollAndUpdate(html).catch(console.error);
            setCurrentHtml(html);
            return html;
        }
        return currentHtml;
    }, [portfolioData, sectionTitles, preserveScrollAndUpdate]);

    // 데이터 변경시 HTML 업데이트 (실시간 업데이트)
    useEffect(() => {
        if (portfolioData.name || dataLoaded) {
            console.log('🔄 ColorfulEditor data changed, updating HTML immediately');
            updateHtml().catch(console.error);
        }
    }, [portfolioData, sectionTitles, updateHtml, dataLoaded]);

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

    // 프로젝트 관련 핸들러들
    const handleAddProject = () => {
        const newProject: ProjectData = {
            name: '새 프로젝트',
            description: '창의적이고 인터랙티브한 프로젝트입니다',
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

    const handleDeleteProject = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

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

    // 경력 관련 핸들러들
    const handleAddExperience = () => {
        const newExperience: ExperienceData = {
            position: '새 경력',
            company: '회사명',
            duration: '',
            description: '창의적 솔루션 개발 및 사용자 경험 개선'
        };
        setPortfolioData(prev => ({
            ...prev,
            experience: [...prev.experience, newExperience]
        }));
    };

    const handleUpdateExperience = (index: number, field: string, value: string | string[]) => {
        setPortfolioData(prev => {
            const updatedExperience = [...prev.experience];
            updatedExperience[index] = {
                ...updatedExperience[index],
                [field]: value
            };
            return { ...prev, experience: updatedExperience };
        });
    };

    const handleDeleteExperience = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };

    // 스킬 카테고리 관련 핸들러들
    const handleAddSkillCategory = () => {
        setPortfolioData(prev => ({
            ...prev,
            skillCategories: [
                ...(prev.skillCategories || []),
                { category: '새 카테고리', skills: [], icon: '✨' }
            ]
        }));
    };

    const handleDeleteSkillCategory = (categoryIndex: number) => {
        setPortfolioData(prev => ({
            ...prev,
            skillCategories: prev.skillCategories?.filter((_, i) => i !== categoryIndex) || []
        }));
    };

    const handleUpdateSkillCategory = (categoryIndex: number, field: keyof SkillCategory, value: string) => {
        setPortfolioData(prev => ({
            ...prev,
            skillCategories: prev.skillCategories?.map((cat, i) =>
                i === categoryIndex ? { ...cat, [field]: value } : cat
            ) || []
        }));
    };

    const handleAddSkillToCategory = (categoryIndex: number, skill: string) => {
        if (skill.trim()) {
            setPortfolioData(prev => ({
                ...prev,
                skillCategories: prev.skillCategories?.map((cat, i) =>
                    i === categoryIndex
                        ? { ...cat, skills: [...cat.skills, skill.trim()] }
                        : cat
                ) || []
            }));
        }
    };

    const handleDeleteSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
        setPortfolioData(prev => ({
            ...prev,
            skillCategories: prev.skillCategories?.map((cat, i) =>
                i === categoryIndex
                    ? { ...cat, skills: cat.skills.filter((_, j) => j !== skillIndex) }
                    : cat
            ) || []
        }));
    };

    // 저장 처리
    const handleSave = async () => {
        const updatedHtml = await updateHtml();
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

    const handleTemplateChange = (templateId: 'minimal' | 'clean' | 'colorful' | 'elegant') => {
        if (onTemplateChange) {
            onTemplateChange(templateId);
        }
    };

    // 로딩 화면
    if (isInitializing || !dataLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 relative">
                <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="flex justify-center items-center mb-6">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Colorful 템플릿 데이터 준비 중</h3>
                        <p className="text-gray-600 mb-6">
                            {isEnhancing ? 'AI가 사용자 입력을 전문적으로 가공하고 있습니다...' : 'Colorful 템플릿 데이터를 불러오는 중입니다...'}
                        </p>
                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
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
                            <h1 className="text-xl font-semibold text-gray-900">
                                Colorful 템플릿 편집 - 활기찬 스타일
                            </h1>
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
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 border border-transparent rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center"
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
                        {/* 기본 정보 섹션 */}
                        <BlurFade delay={0.0}>
                            <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
                                <div className="flex items-center space-x-2 mb-4">
                                    <input
                                        type="text"
                                        value={sectionTitles.contact}
                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, contact: e.target.value }))}
                                        className="text-lg font-bold text-gray-900 bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none"
                                        placeholder="섹션 제목"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                            <input
                                                type="text"
                                                value={portfolioData.name || ''}
                                                onChange={(e) => setPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full p-2 border border-purple-300 rounded-lg focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 소개</label>
                                            <input
                                                type="text"
                                                value={portfolioData.title || ''}
                                                onChange={(e) => setPortfolioData(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full p-2 border border-purple-300 rounded-lg focus:border-purple-500 outline-none"
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
                                                className="w-full p-2 border border-purple-300 rounded-lg focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                            <input
                                                type="tel"
                                                value={portfolioData.phone || ''}
                                                onChange={(e) => setPortfolioData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full p-2 border border-purple-300 rounded-lg focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                                        <input
                                            type="text"
                                            value={portfolioData.github || ''}
                                            onChange={(e) => setPortfolioData(prev => ({ ...prev, github: e.target.value }))}
                                            className="w-full p-2 border border-purple-300 rounded-lg focus:border-purple-500 outline-none"
                                            placeholder="github.com/username"
                                        />
                                    </div>
                                </div>
                            </div>
                        </BlurFade>

                        {/* About Me 섹션 */}
                        <BlurFade delay={0.1}>
                            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-xl border border-purple-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.about}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, about: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
                                    <button
                                        onClick={handleEnhanceAbout}
                                        disabled={isEnhancing}
                                        className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
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
                                            : 'bg-white border-purple-300 focus:border-purple-500 outline-none'
                                    }`}
                                    placeholder="창의적인 자기소개를 입력하세요. AI가 더욱 매력적으로 개선해드립니다."
                                />
                                {enhancedFields['about'] && (
                                    <p className="mt-2 text-xs text-yellow-700">
                                        ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                    </p>
                                )}
                            </div>
                        </BlurFade>

                        {/* Experience 섹션 */}
                        <BlurFade delay={0.2}>
                            <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.experience}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, experience: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddExperience}
                                        className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        경력 추가
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {portfolioData.experience.map((exp, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={exp.position || ''}
                                                    onChange={(e) => handleUpdateExperience(index, 'position', e.target.value)}
                                                    className="text-lg font-semibold bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none flex-1 mr-4"
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
                                                        className="w-full p-2 border border-purple-300 rounded text-sm focus:border-purple-500 outline-none"
                                                        placeholder="회사명"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={exp.duration || ''}
                                                        onChange={(e) => handleUpdateExperience(index, 'duration', e.target.value)}
                                                        className="w-full p-2 border border-purple-300 rounded text-sm focus:border-purple-500 outline-none"
                                                        placeholder="기간 (예: 2022 ~ 현재)"
                                                    />
                                                </div>
                                            </div>

                                            <textarea
                                                value={exp.description || ''}
                                                onChange={(e) => handleUpdateExperience(index, 'description', e.target.value)}
                                                className="w-full p-2 border border-purple-300 rounded min-h-[60px] text-sm focus:border-purple-500 outline-none"
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

                        {/* Projects 섹션 */}
                        <BlurFade delay={0.3}>
                            <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.projects}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, projects: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddProject}
                                        className="flex items-center px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        프로젝트 추가
                                    </button>
                                </div>

                                {portfolioData.projects.map((project, index) => (
                                    <div key={index} className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <input
                                                type="text"
                                                value={project.name || ''}
                                                onChange={(e) => handleUpdateProject(index, 'name', e.target.value)}
                                                className="text-lg font-semibold bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none"
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
                                            className="w-full p-2 mb-3 border border-purple-300 rounded min-h-[80px] focus:border-purple-500 outline-none"
                                            placeholder="프로젝트에 대한 창의적인 설명을 입력하세요"
                                        />

                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-600">기간</label>
                                                <input
                                                    type="text"
                                                    value={project.period || ''}
                                                    onChange={(e) => handleUpdateProject(index, 'period', e.target.value)}
                                                    className="w-full p-1 text-sm border border-purple-300 rounded focus:border-purple-500 outline-none"
                                                    placeholder="2023.01 - 2023.06"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">역할</label>
                                                <input
                                                    type="text"
                                                    value={project.role || ''}
                                                    onChange={(e) => handleUpdateProject(index, 'role', e.target.value)}
                                                    className="w-full p-1 text-sm border border-purple-300 rounded focus:border-purple-500 outline-none"
                                                    placeholder="프론트엔드 개발자"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">회사/단체</label>
                                                <input
                                                    type="text"
                                                    value={project.company || ''}
                                                    onChange={(e) => handleUpdateProject(index, 'company', e.target.value)}
                                                    className="w-full p-1 text-sm border border-purple-300 rounded focus:border-purple-500 outline-none"
                                                    placeholder="디자인 스튜디오"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {portfolioData.projects.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        창의적인 프로젝트를 추가해주세요
                                    </p>
                                )}
                            </div>
                        </BlurFade>

                        {/* Skills 섹션 */}
                        <BlurFade delay={0.4}>
                            <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <input
                                        type="text"
                                        value={sectionTitles.skills}
                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, skills: e.target.value }))}
                                        className="text-lg font-bold text-gray-900 bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none"
                                        placeholder="섹션 제목"
                                    />
                                    <button
                                        onClick={handleAddSkillCategory}
                                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        카테고리 추가
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {(portfolioData.skillCategories || []).map((category, categoryIndex) => (
                                        <div key={categoryIndex} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={category.category}
                                                        onChange={(e) => handleUpdateSkillCategory(categoryIndex, 'category', e.target.value)}
                                                        className="font-semibold bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none flex-1"
                                                        placeholder="카테고리명"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSkillCategory(categoryIndex)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {category.skills.map((skill, skillIndex) => (
                                                    <div key={skillIndex} className="group relative">
                                                        <Badge variant="secondary" className="pr-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                                            {skill}
                                                            <button
                                                                onClick={() => handleDeleteSkillFromCategory(categoryIndex, skillIndex)}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                                                            >
                                                                <XMarkIcon className="w-3 h-3 text-white" />
                                                            </button>
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>

                                            <SkillInput
                                                categoryIndex={categoryIndex}
                                                onAddSkill={handleAddSkillToCategory}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {(!portfolioData.skillCategories || portfolioData.skillCategories.length === 0) && (
                                    <p className="text-gray-500 text-center py-8">
                                        기술 스택 카테고리를 추가해주세요
                                    </p>
                                )}
                            </div>
                        </BlurFade>
                    </div>

                    {/* 오른쪽: HTML 미리보기 */}
                    <div className="bg-white rounded-xl border border-purple-200 p-6 lg:sticky lg:top-8 lg:self-start shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <EyeIcon className="w-5 h-5 mr-2 text-purple-600" />
                                실시간 미리보기 - Colorful 스타일
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                                    className="p-1 hover:bg-purple-200 rounded-lg transition-colors"
                                    title="다른 템플릿으로 변경"
                                >
                                    <SwatchIcon className="w-5 h-5 text-purple-600" />
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
                                    className="absolute right-6 top-16 bg-white rounded-lg border border-purple-200 shadow-lg z-10 p-2 min-w-48"
                                >
                                    <div className="text-sm text-gray-700 mb-2 px-2 py-1 font-medium">템플릿 변경</div>
                                    {Object.entries(portfolioTemplates).map(([key, template]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleTemplateChange(key as 'minimal' | 'clean' | 'colorful' | 'elegant')}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedTemplate === key
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
                        <div className="border border-purple-200 rounded-lg overflow-auto bg-white">
                            <div className="relative">
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={currentHtml}
                                    className="w-full border-0 h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)] min-h-[600px]"
                                    title="Colorful Portfolio Preview"
                                    style={{
                                        transform: 'scale(1)',
                                        transformOrigin: 'top left'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorfulEditor;