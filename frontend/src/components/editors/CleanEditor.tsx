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
import { BaseEditorProps, CleanPortfolioData, ProjectData, ExperienceData, AwardData, SkillCategory } from './types';
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
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-colors"
                placeholder="기술 스택 추가 (예: React, TypeScript)"
            />
            <button
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const CleanEditor: React.FC<BaseEditorProps> = ({
    document,
    selectedTemplate,
    onSave,
    onBack,
    onSkipToNaturalEdit,
    onTemplateChange
}) => {
    const [portfolioData, setPortfolioData] = useState<CleanPortfolioData>({
        name: '',
        title: '',
        email: '',
        phone: '',
        github: '',
        location: '', // Clean 템플릿 전용
        about: '',
        skills: [],
        skillCategories: [
            { category: '언어', skills: [], icon: '💻' },
            { category: '프레임워크', skills: [], icon: '🔧' }
        ],
        projects: [],
        experience: [],
        awards: [] // Clean 템플릿 전용
    });

    const [currentHtml, setCurrentHtml] = useState<string>('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedFields, setEnhancedFields] = useState<Record<string, boolean>>({});
    const [isInitializing, setIsInitializing] = useState(true);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Clean 템플릿 전용 섹션 제목 (education 없음, awards 있음)
    const [sectionTitles, setSectionTitles] = useState({
        contact: '기본 정보',
        about: '개인소개',
        experience: '커리어/경력',
        projects: '프로젝트',
        skills: '스킬셋',
        awards: '수상/자격증'
    });

    const hasInitialized = useRef(false);
    const { iframeRef, preserveScrollAndUpdate } = useScrollPreservation();

    // HTML에서 포트폴리오 데이터 추출
    const extractPortfolioData = useCallback((html: string): CleanPortfolioData => {
        if (!html) {
            return {
                name: '',
                title: '',
                email: '',
                phone: '',
                github: '',
                location: '',
                about: '',
                skills: [],
                skillCategories: [],
                projects: [],
                experience: [],
                awards: []
            };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const extractedData: CleanPortfolioData = {
            name: '',
            title: '',
            email: '',
            phone: '',
            github: '',
            location: '',
            about: '',
            skills: [],
            projects: [],
            experience: [],
            awards: []
        };

        // 이름 추출
        const nameElement = doc.querySelector('.profile-section h1');
        if (nameElement) {
            extractedData.name = nameElement.textContent?.trim() || '';
        }

        // 직책 추출
        const titleElement = doc.querySelector('.profile-section .title');
        if (titleElement) {
            extractedData.title = titleElement.textContent?.trim() || '';
        }

        // 위치 추출 (Clean 템플릿 전용)
        const locationElements = doc.querySelectorAll('.profile-section p');
        if (locationElements.length > 1) {
            extractedData.location = locationElements[1].textContent?.trim() || '';
        }

        // 연락처 추출
        const contactInfo = doc.querySelector('.contact-info');
        if (contactInfo) {
            const emailElement = contactInfo.querySelector('p:first-child');
            if (emailElement) {
                extractedData.email = emailElement.textContent?.replace('📧 ', '').trim() || '';
            }

            const githubElement = contactInfo.querySelector('p:nth-child(2)');
            if (githubElement) {
                extractedData.github = githubElement.textContent?.replace('🔗 ', '').trim() || '';
            }
        }

        // About 섹션 추출
        const aboutSection = doc.querySelector('#about p');
        if (aboutSection) {
            extractedData.about = aboutSection.textContent?.trim() || '';
        }

        // 기술 스택 추출
        const skillElements = doc.querySelectorAll('.tech-badge');
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
                    console.log('🔍 CleanEditor Initial HTML Loading:');
                    console.log('  - HTML preview (first 200 chars):', html.substring(0, 200));
                    console.log('  - HTML contains "colorful":', html.includes('colorful'));
                    console.log('  - HTML contains "minimal":', html.includes('minimal'));
                    console.log('  - HTML contains "clean":', html.includes('clean'));
                    console.log('  - HTML contains "elegant":', html.includes('elegant'));

                    setCurrentHtml(html);

                    let actualData: CleanPortfolioData;

                    if (firstBlock.extractedData) {
                        const extracted = firstBlock.extractedData as any;
                        actualData = {
                            ...extracted,
                            location: extracted.location || 'Seoul, Korea',
                            awards: extracted.awards || []
                        };
                    } else {
                        actualData = extractPortfolioData(html);
                    }

                    if (actualData.name || actualData.title || actualData.about) {
                        // skillCategories가 없으면 기존 skills 배열로부터 생성
                        if (!actualData.skillCategories && actualData.skills?.length > 0) {
                            const midPoint = Math.ceil(actualData.skills.length / 2);
                            actualData.skillCategories = [
                                {
                                    category: '언어',
                                    skills: actualData.skills.slice(0, midPoint),
                                    icon: '💻'
                                },
                                {
                                    category: '프레임워크',
                                    skills: actualData.skills.slice(midPoint),
                                    icon: '🔧'
                                }
                            ];
                        } else if (!actualData.skillCategories || actualData.skillCategories.length === 0) {
                            // 아예 스킬이 없으면 기본 구조 생성
                            actualData.skillCategories = [
                                { category: '언어', skills: [], icon: '💻' },
                                { category: '프레임워크', skills: [], icon: '🔧' }
                            ];
                        }

                        setPortfolioData(actualData);
                        setDataLoaded(true);

                        // 🔧 CRITICAL FIX: Force immediate HTML regeneration with correct template
                        setTimeout(async () => {
                            console.log('🔧 CleanEditor: Force updating HTML with correct template on initialization');
                            await updateHtml();
                        }, 100);
                    }

                    // 데이터가 부족한 경우 AI로 개선
                    const needsEnhancement = !actualData.about || actualData.about.length < 50;
                    if (needsEnhancement) {
                        setIsEnhancing(true);
                        try {
                            const enhanced = await portfolioTextEnhancer.enhancePortfolioData(actualData);
                            const enhancedCleanData: CleanPortfolioData = {
                                ...enhanced,
                                location: actualData.location || 'Seoul, Korea',
                                awards: actualData.awards || []
                            };
                            setPortfolioData(enhancedCleanData);

                            const generatedFields: Record<string, boolean> = {};
                            if (!actualData.about && enhanced.about) {
                                generatedFields['about'] = true;
                            }
                            if (!actualData.location && enhancedCleanData.location) {
                                generatedFields['location'] = true;
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

        // Only run once when document is available
        if (document && !hasInitialized.current) {
            initializeData();
        }
    }, []); // Empty dependency array - run only once

    // 빈 섹션 감지 및 AI 더미 데이터 생성
    useEffect(() => {
        const checkAndGenerateDummyData = async () => {
            if (!dataLoaded || isEnhancing) return;

            const hasAwards = portfolioData.awards && portfolioData.awards.length > 0;

            if (!hasAwards && !enhancedFields['awards']) {
                try {
                    const { data: awardsData, isGenerated } = await portfolioTextEnhancer.generateDummyAwards();
                    setPortfolioData(prev => ({
                        ...prev,
                        awards: awardsData
                    }));
                    if (isGenerated) {
                        setEnhancedFields(prev => ({ ...prev, awards: true }));
                    }
                } catch (error) {
                    console.error('더미 수상 데이터 생성 실패:', error);
                }
            }
        };

        // Only run after data is loaded and not enhancing
        if (dataLoaded && !isEnhancing && portfolioData.awards !== undefined) {
            const timer = setTimeout(checkAndGenerateDummyData, 300);
            return () => clearTimeout(timer);
        }
    }, [dataLoaded, isEnhancing]); // Reduced dependencies

    // HTML 업데이트
    const updateHtml = useCallback(async () => {
        console.log('🔧 CleanEditor updateHtml:');
        console.log('  - selectedTemplate prop:', selectedTemplate);
        console.log('  - portfolioTemplates keys:', Object.keys(portfolioTemplates));

        // Always use clean template for CleanEditor
        const template = portfolioTemplates['clean'];
        console.log('  - template found:', !!template);
        console.log('  - template.name:', template?.name);
        console.log('  - template.id:', template?.id);

        if (template?.generateHTML) {
            // Clean 템플릿에 맞는 데이터 구조 생성
            const initials = portfolioData.name
                ? portfolioData.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
                : 'GL';

            const dataForTemplate = {
                name: portfolioData.name || '포트폴리오 작성자',
                title: portfolioData.title || '소프트웨어 개발자',
                location: portfolioData.location || 'Seoul, Korea',
                initials: initials,
                contact: {
                    email: portfolioData.email || 'contact@example.com',
                    phone: portfolioData.phone || '+82 10-0000-0000',
                    github: portfolioData.github || 'github.com/username',
                },
                about: portfolioData.about || '열정적인 개발자로서 사용자 중심의 서비스를 만들고 있습니다.',
                skills: portfolioData.skillCategories?.flatMap(cat => cat.skills) || portfolioData.skills || [],
                skillCategories: portfolioData.skillCategories?.length > 0 ? portfolioData.skillCategories : [
                    {
                        category: '언어',
                        skills: ['JavaScript', 'TypeScript', 'Python', 'Java'],
                        icon: '💻'
                    },
                    {
                        category: '프레임워크',
                        skills: ['React', 'Vue.js', 'Node.js', 'Spring'],
                        icon: '🔧'
                    }
                ],
                experience: portfolioData.experience?.map(exp => ({
                    ...exp,
                    achievements: exp.achievements || ['업무 효율성 개선', '팀 협업을 통한 성공적 완수']
                })) || [],
                projects: portfolioData.projects?.map(project => ({
                    ...project,
                    tech: project.tech?.length > 0 ? project.tech : ['React', 'TypeScript', 'Node.js'],
                    results: project.results || ['사용자 만족도 향상', '성능 최적화 달성']
                })) || [],
                awards: portfolioData.awards || [],
                sectionTitles: sectionTitles
            };

            // Clean 템플릿에서 sectionTitles를 직접 활용
            const html = template.generateHTML(dataForTemplate);
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
            console.log('🔄 CleanEditor data changed, updating HTML immediately');
            updateHtml().catch(console.error);
        }
    }, [portfolioData, sectionTitles, dataLoaded, updateHtml]);

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
            description: '담당 업무를 입력하세요'
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

    // 수상/자격증 관련 핸들러들 (Clean 템플릿 전용)
    const handleAddAward = () => {
        const newAward: AwardData = {
            title: '새 수상/자격증',
            organization: '발급 기관',
            year: '2024',
            description: '상세 내용을 입력하세요'
        };
        setPortfolioData(prev => ({
            ...prev,
            awards: [...prev.awards, newAward]
        }));
    };

    const handleUpdateAward = (index: number, field: keyof AwardData, value: string) => {
        setPortfolioData(prev => {
            const updatedAwards = [...prev.awards];
            updatedAwards[index] = {
                ...updatedAwards[index],
                [field]: value
            };
            return { ...prev, awards: updatedAwards };
        });
    };

    const handleDeleteAward = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            awards: prev.awards.filter((_, i) => i !== index)
        }));
    };

    // 스킬 카테고리 관련 핸들러들
    const handleAddSkillCategory = () => {
        setPortfolioData(prev => ({
            ...prev,
            skillCategories: [
                ...(prev.skillCategories || []),
                { category: '새 카테고리', skills: [], icon: '🔧' }
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
    if (isInitializing) {
        return (
            <div className="min-h-screen bg-gray-50 relative">
                <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="flex justify-center items-center mb-6">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Clean 템플릿 데이터 준비 중</h3>
                        <p className="text-gray-600 mb-6">
                            {isEnhancing ? 'AI가 사용자 입력을 전문적으로 가공하고 있습니다...' : 'Clean 템플릿 데이터를 불러오는 중입니다...'}
                        </p>
                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-xl font-semibold text-gray-900">
                                Clean 템플릿 편집 - 기업형 스타일
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
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center space-x-2 mb-4">
                                    <input
                                        type="text"
                                        value={sectionTitles.contact}
                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, contact: e.target.value }))}
                                        className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
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
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 소개</label>
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">위치 (Clean 전용)</label>
                                            <input
                                                type="text"
                                                value={portfolioData.location || ''}
                                                onChange={(e) => setPortfolioData(prev => ({ ...prev, location: e.target.value }))}
                                                className={`w-full p-2 border rounded-lg ${
                                                    enhancedFields['location']
                                                        ? 'bg-yellow-50 border-yellow-300'
                                                        : 'border-gray-300'
                                                }`}
                                                placeholder="Seoul, Korea"
                                            />
                                            {enhancedFields['location'] && (
                                                <p className="mt-1 text-xs text-yellow-700">⚠️ AI가 자동 생성한 내용입니다.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BlurFade>

                        {/* 자기소개 섹션 */}
                        <BlurFade delay={0.1}>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.about}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, about: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
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

                        {/* 경력 섹션 */}
                        <BlurFade delay={0.2}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.experience}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, experience: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddExperience}
                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
                                            className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                                        >
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
                                                className="w-full p-2 border border-gray-300 rounded min-h-[60px] text-sm mb-3"
                                                placeholder="담당 업무를 입력하세요"
                                            />

                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">주요 성과 (각 줄에 하나씩)</label>
                                                <textarea
                                                    value={exp.achievements ? exp.achievements.join('\n') : ''}
                                                    onChange={(e) => handleUpdateExperience(index, 'achievements',
                                                        e.target.value.split('\n').filter((achievement: string) => achievement.trim())
                                                    )}
                                                    className="w-full p-2 border border-gray-300 rounded min-h-[60px] text-sm"
                                                    placeholder="• 매출 20% 증가에 기여
• 시스템 성능 30% 개선
• 팀 생산성 향상을 위한 자동화 도구 개발"
                                                />
                                            </div>
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

                        {/* 프로젝트 섹션 */}
                        <BlurFade delay={0.3}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.projects}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, projects: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-green-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
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
                                            className="w-full p-2 mb-3 border border-gray-300 rounded min-h-[80px]"
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
                                                    placeholder="풀스택 개발"
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

                        {/* 기술 스택 섹션 */}
                        <BlurFade delay={0.4}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <input
                                        type="text"
                                        value={sectionTitles.skills}
                                        onChange={(e) => setSectionTitles(prev => ({ ...prev, skills: e.target.value }))}
                                        className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                                        placeholder="섹션 제목"
                                    />
                                    <button
                                        onClick={handleAddSkillCategory}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        카테고리 추가
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {(portfolioData.skillCategories || []).map((category, categoryIndex) => (
                                        <div key={categoryIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={category.category}
                                                        onChange={(e) => handleUpdateSkillCategory(categoryIndex, 'category', e.target.value)}
                                                        className="font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1"
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
                                                        <Badge variant="secondary" className="pr-8">
                                                            {skill}
                                                            <button
                                                                onClick={() => handleDeleteSkillFromCategory(categoryIndex, skillIndex)}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                                                            >
                                                                <XMarkIcon className="w-3 h-3" />
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

                        {/* 수상/자격증 섹션 (Clean 템플릿 전용) */}
                        <BlurFade delay={0.5}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.awards}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, awards: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddAward}
                                        className="flex items-center px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        수상/자격증 추가
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {portfolioData.awards.map((award, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                                enhancedFields['awards']
                                                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
                                                    : 'bg-gradient-to-r from-orange-50 to-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={award.title || ''}
                                                    onChange={(e) => handleUpdateAward(index, 'title', e.target.value)}
                                                    className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none flex-1 mr-4"
                                                    placeholder="수상명/자격증명"
                                                />
                                                <button
                                                    onClick={() => handleDeleteAward(index)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={award.organization || ''}
                                                        onChange={(e) => handleUpdateAward(index, 'organization', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                                        placeholder="발급기관/주최기관"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={award.year || ''}
                                                        onChange={(e) => handleUpdateAward(index, 'year', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                                        placeholder="연도 (예: 2024)"
                                                    />
                                                </div>
                                            </div>

                                            <textarea
                                                value={award.description || ''}
                                                onChange={(e) => handleUpdateAward(index, 'description', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded min-h-[60px] text-sm"
                                                placeholder="상세 내용을 입력하세요"
                                            />
                                            {enhancedFields['awards'] && (
                                                <p className="mt-2 text-xs text-yellow-700">
                                                    ⚠️ AI가 생성한 더미 데이터입니다. 검토 후 수정해주세요.
                                                </p>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {portfolioData.awards.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        수상/자격증을 추가해주세요
                                    </p>
                                )}

                                {enhancedFields['awards'] && portfolioData.awards.length > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            ⚠️ 수상/자격증 정보가 없어 AI가 더미 데이터를 생성했습니다. 실제 정보로 수정해주세요.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </BlurFade>
                    </div>

                    {/* 오른쪽: HTML 미리보기 */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-8 lg:self-start">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <EyeIcon className="w-5 h-5 mr-2 text-blue-600" />
                                실시간 미리보기 - Clean 스타일
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="다른 템플릿으로 변경"
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
                                    <div className="text-sm text-gray-700 mb-2 px-2 py-1 font-medium">템플릿 변경</div>
                                    {Object.entries(portfolioTemplates).map(([key, template]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleTemplateChange(key as 'minimal' | 'clean' | 'colorful' | 'elegant')}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedTemplate === key
                                                    ? 'bg-blue-100 text-blue-700'
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
                        <div className="border border-gray-200 rounded-lg overflow-auto bg-white">
                            <div className="relative">
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={currentHtml}
                                    className="w-full border-0 h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)] min-h-[600px]"
                                    title="Clean Portfolio Preview"
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

export default CleanEditor;