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
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { PortfolioDocument } from '../services/autoFillService';
import { portfolioTemplates } from '../templates/portfolioTemplates';
import portfolioTextEnhancer, { ProjectData, PortfolioData } from '../services/portfolioTextEnhancer';
import BlurFade from './ui/BlurFade';
import Badge from './ui/Badge';
import { useScrollPreservation } from '../hooks/useScrollPreservation';
import NaturalLanguageModal from './NaturalLanguageModal';
import { userFeedbackService } from '../services/userFeedbackService';

type TemplateType = 'minimal' | 'clean' | 'colorful' | 'elegant';

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
    selectedTemplate = 'minimal',
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
    const { iframeRef, preserveScrollAndUpdate } = useScrollPreservation();
    const currentTemplate = (selectedTemplate as TemplateType) || 'minimal';
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedFields, setEnhancedFields] = useState<Record<string, boolean>>({}); // AI 생성 필드 추적
    const [isInitializing, setIsInitializing] = useState(true); // 초기 로딩 상태
    const [dataLoaded, setDataLoaded] = useState(false); // 데이터 로딩 완료 상태
    const [showNaturalLanguage, setShowNaturalLanguage] = useState(false); // 자연어 편집 모달 상태
    // 현재 템플릿의 섹션 정보를 가져옴
    const getCurrentTemplateSections = () => {
        const template = portfolioTemplates[currentTemplate];
        return template?.sections || [];
    };

    // 템플릿별 필드 지원 여부 확인 (실제 템플릿 HTML 기준)
    const getTemplateFieldSupport = (templateId: TemplateType) => {
        return {
            location: templateId === 'clean', // clean 템플릿만 location 지원
            achievements: true, // 모든 템플릿이 achievements 지원 (HTML에서 확인됨)
            education: ['minimal'].includes(templateId), // minimal 템플릿만 education 섹션 있음
            awards: ['clean'].includes(templateId), // clean 템플릿만 awards 섹션 있음
        };
    };

    const currentFieldSupport = getTemplateFieldSupport(currentTemplate);

    const [sectionTitles, setSectionTitles] = useState(() => {
        const sections = getCurrentTemplateSections();
        const titles: Record<string, string> = {};
        sections.forEach(section => {
            titles[section.id] = section.name;
        });
        return titles;
    });

    // 초기화 완료 상태 추적
    const hasInitialized = useRef(false);

    // HTML에서 실제 포트폴리오 데이터 추출 - 의존성에서 portfolioData 제거하여 무한 루프 방지
    const extractPortfolioData = useCallback((html: string): PortfolioData => {

        if (!html) {
            return {
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
        }

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
            setIsInitializing(true);

            try {
                const firstBlock = document.sections?.[0]?.blocks?.[0];
                if (firstBlock && firstBlock.text) {
                    const html = firstBlock.text;
                    setCurrentHtml(html);

                    // 먼저 블록의 extractedData가 있는지 확인 (실제 AI 가공 데이터)
                    let actualData: PortfolioData;

                    if (firstBlock.extractedData) {
                        actualData = firstBlock.extractedData as PortfolioData;
                    } else {
                        // fallback: HTML에서 추출
                        actualData = extractPortfolioData(html);
                    }


                    // 기본 데이터가 있다면 먼저 설정하여 미리보기 표시
                    if (actualData.name || actualData.title || actualData.about) {
                        setPortfolioData(actualData);
                        setDataLoaded(true);
                    }

                    // UPDATED: Only enhance if data is truly missing or very short
                    // Rich HTML extraction should already provide 200-400 character content
                    const needsEnhancement = (
                        (!actualData.about || actualData.about.length < 50) &&
                        (!actualData.projects || actualData.projects.length === 0 ||
                         actualData.projects.every(p => !p.description || p.description.length < 50))
                    );

                    if (needsEnhancement) {
                        setIsEnhancing(true);
                        try {
                            const enhanced = await portfolioTextEnhancer.enhancePortfolioData(actualData);
                            setPortfolioData(enhanced);

                            // AI 생성 필드 표시
                            const generatedFields: Record<string, boolean> = {};
                            if (!actualData.about && enhanced.about) {
                                generatedFields['about'] = true;
                            }
                            setEnhancedFields(generatedFields);
                        } catch (error) {
                            // AI 개선이 실패해도 기본 데이터는 유지
                            if (!dataLoaded) {
                                setPortfolioData(actualData);
                            }
                        } finally {
                            setIsEnhancing(false);
                        }
                    } else {
                        if (actualData.projects && actualData.projects.length > 0) {
                        }
                    }

                    setDataLoaded(true);
                }
            } catch (error) {
            } finally {
                setIsInitializing(false);
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
        } finally {
            setIsEnhancing(false);
        }
    };

    // 자연어 편집 핸들러
    const handleNaturalLanguageChange = async (instruction: string): Promise<void> => {
        try {
            // 현재 포트폴리오 데이터를 문자열로 변환
            const currentPortfolio = JSON.stringify(portfolioData);

            // userFeedbackService를 사용하여 자연어 명령 처리
            const improvedPortfolio = await userFeedbackService.improvePortfolioWithNaturalLanguage(
                currentPortfolio,
                instruction
            );

            // 개선된 포트폴리오 데이터로 업데이트
            const parsedPortfolio = JSON.parse(improvedPortfolio);
            setPortfolioData(parsedPortfolio);

            // HTML 재생성을 위해 강제 업데이트
            const template = portfolioTemplates[currentTemplate];
            if (template && template.generateHTML) {
                const html = template.generateHTML(parsedPortfolio);
                preserveScrollAndUpdate(html);
            }
        } catch (error) {
            throw error;
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
    // 섹션 렌더링 함수들
    const renderContactSection = () => (
        <div key="contact" className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {getCurrentTemplateSections().find(s => s.id === 'contact')?.icon || '👤'} {getCurrentTemplateSections().find(s => s.id === 'contact')?.name || '기본 정보'}
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                        <input
                            type="text"
                            value={portfolioData.name || ''}
                            onChange={(e) => setPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full p-2 border rounded-lg ${
                                enhancedFields['name']
                                    ? 'bg-purple-50 border-purple-300'
                                    : 'border-gray-300'
                            }`}
                        />
                        {enhancedFields['name'] && (
                            <p className="mt-1 text-xs text-purple-700">⚠️ AI가 자동 생성한 내용입니다.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 소개</label>
                        <input
                            type="text"
                            value={portfolioData.title || ''}
                            onChange={(e) => setPortfolioData(prev => ({ ...prev, title: e.target.value }))}
                            className={`w-full p-2 border rounded-lg ${
                                enhancedFields['title']
                                    ? 'bg-purple-50 border-purple-300'
                                    : 'border-gray-300'
                            }`}
                        />
                        {enhancedFields['title'] && (
                            <p className="mt-1 text-xs text-purple-700">⚠️ AI가 자동 생성한 내용입니다.</p>
                        )}
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
                {currentFieldSupport.location && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                        <input
                            type="text"
                            value={portfolioData.location || ''}
                            onChange={(e) => setPortfolioData(prev => ({ ...prev, location: e.target.value }))}
                            className={`w-full p-2 border rounded-lg ${
                                enhancedFields['location']
                                    ? 'bg-purple-50 border-purple-300'
                                    : 'border-gray-300'
                            }`}
                            placeholder="Seoul, Korea"
                        />
                        {enhancedFields['location'] && (
                            <p className="mt-1 text-xs text-purple-700">⚠️ AI가 자동 생성한 내용입니다.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderAboutSection = () => (
        <BlurFade key="about" delay={0.1}>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCurrentTemplateSections().find(s => s.id === 'about')?.icon || '👨‍💻'}</span>
                        <input
                            type="text"
                            value={sectionTitles['about'] || '개인소개'}
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
                            ? 'bg-purple-50 border-purple-300 text-purple-900'
                            : 'bg-white border-gray-300'
                    }`}
                    placeholder="자기소개를 입력하세요. AI가 전문적으로 개선해드립니다."
                />
                <div className="mt-2 text-xs text-gray-600">
                    💡 <strong>마크다운 지원:</strong> **굵게**, *기울임*, `코드`, [링크](URL) 사용 가능 | Enter로 줄바꿈
                </div>
                {enhancedFields['about'] && (
                    <p className="mt-2 text-xs text-yellow-700">
                        ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                    </p>
                )}
            </div>
        </BlurFade>
    );

    const renderSkillsSection = () => (
        <BlurFade key="skills" delay={0.3}>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <span className="text-lg">{getCurrentTemplateSections().find(s => s.id === 'skills')?.icon || '🛠️'}</span>
                    <input
                        type="text"
                        value={sectionTitles['skills'] || '기술 스택'}
                        onChange={(e) => setSectionTitles(prev => ({ ...prev, skills: e.target.value }))}
                        className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                        placeholder="섹션 제목"
                    />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {portfolioData.skills.map((skill, index) => (
                        <div key={index} className="group relative">
                            <Badge
                                variant="primary"
                                className={`pr-8 ${
                                    enhancedFields[`skill_${index}`]
                                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                                        : ''
                                }`}
                            >
                                {skill}
                                {enhancedFields[`skill_${index}`] && (
                                    <span className="ml-1 text-xs">⚠️</span>
                                )}
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
    );

    const renderProjectsSection = () => (
        <BlurFade key="projects" delay={0.2}>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCurrentTemplateSections().find(s => s.id === 'projects')?.icon || '🚀'}</span>
                        <input
                            type="text"
                            value={sectionTitles['projects'] || '프로젝트'}
                            onChange={(e) => setSectionTitles(prev => ({ ...prev, projects: e.target.value }))}
                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-green-500 outline-none"
                            placeholder="섹션 제목"
                        />
                    </div>
                    <button
                        onClick={handleAddProject}
                        className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:shadow-md transition-all"
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
                                    className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={project.description || ''}
                            onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
                            className={`w-full p-2 mb-1 border rounded min-h-[80px] ${
                                enhancedFields[`project_${index}`]
                                    ? 'bg-purple-50 border-purple-300 text-purple-900'
                                    : 'bg-white border-gray-300'
                            }`}
                            placeholder="프로젝트 설명 (마크다운 지원)"
                        />
                        <div className="mb-3 text-xs text-gray-500">
                            💡 **굵게**, *기울임*, `코드`, [링크](URL) 사용 가능
                        </div>
                        {enhancedFields[`project_${index}`] && (
                            <p className="mb-3 text-xs text-yellow-700">
                                ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-gray-600">기간</label>
                                <input
                                    type="text"
                                    value={project.period || ''}
                                    onChange={(e) => handleUpdateProject(index, 'period', e.target.value)}
                                    className={`w-full p-1 text-sm border rounded ${
                                        enhancedFields[`project_${index}_period`]
                                            ? 'bg-purple-50 border-purple-300 text-purple-900'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="2023.01 - 2023.06"
                                />
                                {enhancedFields[`project_${index}_period`] && (
                                    <p className="mt-1 text-xs text-purple-700">⚠️ AI 생성</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">역할</label>
                                <input
                                    type="text"
                                    value={project.role || ''}
                                    onChange={(e) => handleUpdateProject(index, 'role', e.target.value)}
                                    className={`w-full p-1 text-sm border rounded ${
                                        enhancedFields[`project_${index}_role`]
                                            ? 'bg-purple-50 border-purple-300 text-purple-900'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="프론트엔드 개발"
                                />
                                {enhancedFields[`project_${index}_role`] && (
                                    <p className="mt-1 text-xs text-purple-700">⚠️ AI 생성</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">회사/단체</label>
                                <input
                                    type="text"
                                    value={project.company || ''}
                                    onChange={(e) => handleUpdateProject(index, 'company', e.target.value)}
                                    className={`w-full p-1 text-sm border rounded ${
                                        enhancedFields[`project_${index}_company`]
                                            ? 'bg-purple-50 border-purple-300 text-purple-900'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="○○회사"
                                />
                                {enhancedFields[`project_${index}_company`] && (
                                    <p className="mt-1 text-xs text-purple-700">⚠️ AI 생성</p>
                                )}
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
    );

    const renderExperienceSection = () => (
        <BlurFade key="experience" delay={0.4}>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCurrentTemplateSections().find(s => s.id === 'experience')?.icon || '💼'}</span>
                        <input
                            type="text"
                            value={sectionTitles['experience'] || '경력'}
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
                                    className="p-1 text-purple-600 hover:bg-purple-100 rounded"
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
                                className={`w-full p-2 border rounded min-h-[60px] text-sm ${
                                    enhancedFields[`experience_${index}_description`]
                                        ? 'bg-purple-50 border-purple-300 text-purple-900'
                                        : 'border-gray-300'
                                }`}
                                placeholder="담당 업무 (마크다운 지원)"
                            />
                            <div className="mt-1 text-xs text-gray-500">
                                💡 **굵게**, *기울임* 사용 가능
                            </div>
                            {enhancedFields[`experience_${index}_description`] && (
                                <p className="mt-2 text-xs text-yellow-700">
                                    ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                </p>
                            )}

                            {currentFieldSupport.achievements && (
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">주요 성과 (각 줄에 하나씩)</label>
                                    <textarea
                                        value={exp.achievements ? exp.achievements.join('\n') : ''}
                                        onChange={(e) => handleUpdateExperience(index, 'achievements',
                                            e.target.value.split('\n').filter((achievement: string) => achievement.trim())
                                        )}
                                        className={`w-full p-2 border rounded min-h-[60px] text-sm ${
                                            enhancedFields[`experience_${index}_achievements`]
                                                ? 'bg-purple-50 border-purple-300 text-purple-900'
                                                : 'border-gray-300'
                                        }`}
                                        placeholder="• 매출 20% 증가에 기여
• 시스템 성능 30% 개선
• 팀 생산성 향상을 위한 자동화 도구 개발"
                                    />
                                    {enhancedFields[`experience_${index}_achievements`] && (
                                        <p className="mt-2 text-xs text-yellow-700">
                                            ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                        </p>
                                    )}
                                </div>
                            )}
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
    );

    const renderEducationSection = () => (
        <BlurFade key="education" delay={0.5}>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCurrentTemplateSections().find(s => s.id === 'education')?.icon || '🎓'}</span>
                        <input
                            type="text"
                            value={sectionTitles['education'] || '학력'}
                            onChange={(e) => setSectionTitles(prev => ({ ...prev, education: e.target.value }))}
                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none"
                            placeholder="섹션 제목"
                        />
                    </div>
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
                                    className="p-1 text-purple-600 hover:bg-purple-100 rounded"
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
    );

    const renderAwardsSection = () => (
        <BlurFade key="awards" delay={0.6}>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <span className="text-lg">{getCurrentTemplateSections().find(s => s.id === 'awards')?.icon || '🏆'}</span>
                    <input
                        type="text"
                        value={sectionTitles['awards'] || '수상/자격증'}
                        onChange={(e) => setSectionTitles(prev => ({ ...prev, awards: e.target.value }))}
                        className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none"
                        placeholder="섹션 제목"
                    />
                </div>
                <p className="text-gray-500 text-center py-8">
                    수상/자격증 섹션 (개발 예정)
                </p>
            </div>
        </BlurFade>
    );

    // 동적으로 섹션 렌더링
    const renderSectionsByTemplate = () => {
        const sections = getCurrentTemplateSections();
        const sectionRenderers: Record<string, () => React.ReactElement> = {
            contact: renderContactSection,
            about: renderAboutSection,
            skills: renderSkillsSection,
            projects: renderProjectsSection,
            experience: renderExperienceSection,
            education: renderEducationSection,
            awards: renderAwardsSection,
        };

        return sections.map((section) => {
            const renderer = sectionRenderers[section.id];
            return renderer ? renderer() : null;
        }).filter(Boolean);
    };

    // null/빈 값을 AI로 자동 채우는 함수
    const fillNullValues = useCallback(async (data: PortfolioData): Promise<PortfolioData> => {
        const filledData = { ...data };
        const newEnhancedFields: Record<string, boolean> = {};

        try {
            // 기본 정보 자동 채우기
            if (!filledData.name || filledData.name.trim() === '') {
                filledData.name = '포트폴리오 작성자';
                newEnhancedFields['name'] = true;
            }
            if (!filledData.title || filledData.title.trim() === '') {
                filledData.title = '소프트웨어 개발자';
                newEnhancedFields['title'] = true;
            }
            if (!filledData.about || filledData.about.trim() === '' || filledData.about === 'null') {
                const enhanced = await portfolioTextEnhancer.enhanceAboutMe('열정적인 개발자로서 사용자 중심의 서비스를 만들고 있습니다.');
                filledData.about = enhanced.enhanced;
                newEnhancedFields['about'] = true;
            }

            // 위치 정보 자동 채우기 (clean 템플릿에서만)
            if (currentTemplate === 'clean' && (!filledData.location || filledData.location.trim() === '' || filledData.location === 'null')) {
                filledData.location = 'Seoul, Korea';
                newEnhancedFields['location'] = true;
            }

            // 경력의 빈 성과 자동 채우기
            if (filledData.experience && filledData.experience.length > 0) {
                filledData.experience = filledData.experience.map((exp: any, index: number) => {
                    if (!exp.achievements || exp.achievements.length === 0 ||
                        (Array.isArray(exp.achievements) && exp.achievements.some((a: string) => !a || a === 'null'))) {
                        const achievements = [
                            '업무 효율성 개선에 기여',
                            '팀 협업을 통한 프로젝트 성공적 완수',
                            '기술적 문제 해결 및 시스템 안정성 향상'
                        ];
                        newEnhancedFields[`experience_${index}_achievements`] = true;
                        return { ...exp, achievements };
                    }
                    return exp;
                });
            }

            // 프로젝트의 빈 필드 자동 채우기
            if (filledData.projects && filledData.projects.length > 0) {
                filledData.projects = filledData.projects.map((project: any, index: number) => {
                    const updatedProject = { ...project };

                    if (!updatedProject.tech || updatedProject.tech.length === 0) {
                        updatedProject.tech = ['JavaScript', 'React', 'Node.js'];
                        newEnhancedFields[`project_${index}_tech`] = true;
                    }

                    if (!updatedProject.description || updatedProject.description.trim() === '' || updatedProject.description === 'null') {
                        updatedProject.description = '웹 애플리케이션 개발 프로젝트로, 사용자 경험을 향상시키고 효율적인 시스템을 구축했습니다.';
                        newEnhancedFields[`project_${index}`] = true;
                    }

                    if (!updatedProject.period || updatedProject.period.trim() === '' || updatedProject.period === 'null') {
                        updatedProject.period = '2024.01 - 2024.06';
                        newEnhancedFields[`project_${index}_period`] = true;
                    }

                    if (!updatedProject.role || updatedProject.role.trim() === '' || updatedProject.role === 'null') {
                        updatedProject.role = '프론트엔드 개발';
                        newEnhancedFields[`project_${index}_role`] = true;
                    }

                    if (!updatedProject.company || updatedProject.company.trim() === '' || updatedProject.company === 'null') {
                        updatedProject.company = '개인 프로젝트';
                        newEnhancedFields[`project_${index}_company`] = true;
                    }

                    return updatedProject;
                });
            }

            // 경력의 빈 설명 자동 채우기
            if (filledData.experience && filledData.experience.length > 0) {
                filledData.experience = filledData.experience.map((exp: any, index: number) => {
                    const updatedExp = { ...exp };

                    if (!updatedExp.description || updatedExp.description.trim() === '' || updatedExp.description === 'null') {
                        updatedExp.description = '담당 업무를 수행하며 팀의 목표 달성에 기여했습니다. 기술적 문제 해결과 프로젝트 관리를 통해 성과를 창출했습니다.';
                        newEnhancedFields[`experience_${index}_description`] = true;
                    }

                    return updatedExp;
                });
            }

            // 기술 스택 자동 채우기 (개별 스킬)
            if (!filledData.skills || filledData.skills.length === 0) {
                filledData.skills = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Git'];
                // 각 스킬에 대해 AI 생성 마크 추가
                filledData.skills.forEach((_, index) => {
                    newEnhancedFields[`skill_${index}`] = true;
                });
            }

            // enhancedFields 업데이트
            if (Object.keys(newEnhancedFields).length > 0) {
                setEnhancedFields(prev => ({ ...prev, ...newEnhancedFields }));
            }

        } catch (error) {
        }

        return filledData;
    }, [selectedTemplate]);

    const updateHtml = useCallback(async () => {
        const template = portfolioTemplates[currentTemplate];
        if (template && template.generateHTML) {
            // 현재 템플릿의 필드 지원 상태
            const fieldSupport = getTemplateFieldSupport(currentTemplate);

            // null/빈 값 자동 채우기
            const filledData = await fillNullValues(portfolioData);

            // 템플릿에 맞는 포트폴리오 데이터 생성
            const dataForTemplate = {
                ...filledData,
                // 템플릿이 지원하지 않는 필드는 undefined로 설정
                location: fieldSupport.location ? filledData.location : undefined,
                // 연락처 정보를 contact 객체로 구조화
                contact: {
                    email: filledData.email || 'contact@example.com',
                    phone: filledData.phone || '+82 10-0000-0000',
                    github: filledData.github || 'github.com/username',
                },
                // initials 생성 (기업형 템플릿에서 사용)
                initials: filledData.name ? filledData.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase() : 'GL',
                // experience 데이터에서 achievements 필드 처리
                experience: filledData.experience?.map(exp => ({
                    ...exp,
                    achievements: fieldSupport.achievements ? exp.achievements : undefined
                })),
                sectionTitles: sectionTitles
            };

            // 템플릿별로 지원하지 않는 섹션의 데이터는 빈 배열로 설정
            const templateSections = getCurrentTemplateSections();
            const supportedSectionIds = templateSections.map(s => s.id);

            if (!supportedSectionIds.includes('education')) {
                dataForTemplate.education = [];
            }
            if (!supportedSectionIds.includes('awards')) {
                (dataForTemplate as any).awards = [];
            }


            const html = template.generateHTML(dataForTemplate);

            // Update with scroll preservation
            await preserveScrollAndUpdate(html);
            setCurrentHtml(html);
            return html;
        }
        return currentHtml;
    }, [portfolioData, sectionTitles, selectedTemplate, currentHtml, getTemplateFieldSupport, getCurrentTemplateSections, fillNullValues, preserveScrollAndUpdate]);

    // 포트폴리오 데이터나 섹션 제목이 변경될 때마다 HTML 업데이트 (debounce 적용)
    useEffect(() => {
        if (portfolioData.name) { // 데이터가 로드된 후에만 실행
            const timer = setTimeout(async () => {
                await updateHtml();
            }, 100); // 100ms 디바운스

            return () => clearTimeout(timer);
        }
    }, [portfolioData, sectionTitles, selectedTemplate, updateHtml]);

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

    const handleTemplateChange = (templateId: TemplateType) => {
        if (onTemplateChange) {
            // 부모 컴포넌트에서 템플릿 변경 및 페이지 리로드 처리
            onTemplateChange(templateId);
        }
    };

    // 로딩 화면 렌더링
    if (isInitializing || !dataLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 relative">
                {/* 로딩 오버레이 */}
                <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
                    <div className="text-center">
                        {/* 버퍼링 애니메이션 */}
                        <div className="flex justify-center items-center mb-6">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">포트폴리오 데이터 준비 중</h3>
                        <p className="text-gray-600 mb-6">
                            {isEnhancing ? 'AI가 사용자 입력을 전문적으로 가공하고 있습니다...' : '사용자 데이터를 불러오는 중입니다...'}
                        </p>

                        {/* 파도 모양 로딩 애니메이션 */}
                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse"></div>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            잠시만 기다려주세요. 품질 높은 포트폴리오를 위해 데이터를 정성스럽게 처리하고 있습니다.
                        </p>
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
                        {/* 동적 섹션 렌더링 */}
                        {renderSectionsByTemplate()}

                    </div>

                    {/* 오른쪽: HTML 미리보기 - 높이를 편집기에 맞춤 */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-8 lg:self-start">
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

                        {/* HTML 미리보기 - 동적 높이 적용 */}
                        <div className="border border-gray-200 rounded-lg overflow-auto bg-white">
                            <div className="relative">
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={currentHtml}
                                    className="w-full border-0 h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)] min-h-[600px]"
                                    title="Portfolio Preview"
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

            {/* 자연어 편집 플로팅 버튼 - 항상 화면에 고정 */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowNaturalLanguage(true)}
                className="hidden fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200 flex items-center gap-2.5"
                style={{ position: 'fixed' }}
            >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="font-semibold text-sm">AI 자연어 편집</span>
            </motion.button>

            {/* 자연어 편집 모달 */}
            <NaturalLanguageModal
                isOpen={showNaturalLanguage}
                onClose={() => setShowNaturalLanguage(false)}
                onApplyChange={handleNaturalLanguageChange}
                currentContent={JSON.stringify(portfolioData)}
            />
        </div>
    );
};

export default EnhancedPortfolioEditor;