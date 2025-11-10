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
import { portfolioTemplates } from '../../templates/portfolioTemplates';
import portfolioTextEnhancer from '../../services/portfolioTextEnhancer';
import BlurFade from '../ui/BlurFade';
import Badge from '../ui/Badge';
import { BaseEditorProps, MinimalPortfolioData, ProjectData, ExperienceData, EducationData, SkillCategory } from './types';
import { useScrollPreservation } from '../../hooks/useScrollPreservation';
import NaturalLanguageModal from '../NaturalLanguageModal';
import { userFeedbackService } from '../../services/userFeedbackService';
import { getButtonClass } from '../../styles/buttonStyles';

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
                className={getButtonClass('info', 'sm')}
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const MinimalEditor: React.FC<BaseEditorProps> = ({
    document,
    selectedTemplate,
    onSave,
    onSaveOnly,
    onDocumentChange,
    onBack,
    onSkipToNaturalEdit,
    onTemplateChange,
    isSaving
}) => {
    const [portfolioData, setPortfolioData] = useState<MinimalPortfolioData>({
        name: '',
        title: '',
        email: '',
        phone: '',
        github: '',
        about: '',
        skills: [],
        skillCategories: [
            { category: '언어', skills: [], icon: '💻' },
            { category: '프레임워크', skills: [], icon: '🔧' }
        ],
        projects: [],
        experience: [],
        education: []
    });

    const [currentHtml, setCurrentHtml] = useState<string>('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancingSection, setEnhancingSection] = useState<string | null>(null);
    const [initialEnhancedFields, setInitialEnhancedFields] = useState<Record<string, boolean>>({}); // 초기 AI 생성 필드
    const [userEnhancedFields, setUserEnhancedFields] = useState<Record<string, boolean>>({}); // 사용자가 'AI로 개선' 버튼 눌러서 생성된 필드
    const [isInitializing, setIsInitializing] = useState(true);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showNaturalLanguage, setShowNaturalLanguage] = useState(false);

    // Minimal 템플릿 전용 섹션 제목
    const [sectionTitles, setSectionTitles] = useState({
        contact: '기본 정보',
        about: '개인소개',
        skills: '기술 스택',
        projects: '프로젝트',
        experience: '경력',
        education: '학력'
    });

    const hasInitialized = useRef(false);
    const isDataReady = useRef(false);
    const { iframeRef, preserveScrollAndUpdate } = useScrollPreservation();
    const isUserTyping = useRef(false);
    const updateDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const aboutEditorRef = useRef<HTMLDivElement>(null);
    const expDescRefs = useRef<(HTMLDivElement | null)[]>([]);
    const projDescRefs = useRef<(HTMLDivElement | null)[]>([]);
    const eduDescRefs = useRef<(HTMLDivElement | null)[]>([]);

    // HTML에서 포트폴리오 데이터 추출
    const extractPortfolioData = useCallback((html: string): MinimalPortfolioData => {
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
                experience: [],
                education: []
            };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const extractedData: MinimalPortfolioData = {
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
            extractedData.name = nameElement.textContent?.replace('👋 ', '').trim() || '';
        }

        // 직책 추출
        const titleElements = doc.querySelectorAll('header p, .subtitle');
        if (titleElements.length > 0) {
            extractedData.title = titleElements[0].textContent?.trim() || '';
        }

        // 연락처 추출
        const emailLinks = doc.querySelectorAll('a[href^="mailto:"]');
        if (emailLinks.length > 0) {
            extractedData.email = emailLinks[0].getAttribute('href')?.replace('mailto:', '') || '';
        }

        const githubLinks = doc.querySelectorAll('a[href*="github"]');
        if (githubLinks.length > 0) {
            const href = githubLinks[0].getAttribute('href') || '';
            extractedData.github = href.replace('https://', '').replace('http://', '');
        }

        // About 섹션 추출
        const aboutSection = doc.querySelector('.section');
        if (aboutSection) {
            const aboutP = aboutSection.querySelector('p');
            if (aboutP) {
                extractedData.about = aboutP.textContent?.trim() || '';
            }
        }

        // 기술 스택 추출
        const skillElements = doc.querySelectorAll('.skill-tag');
        extractedData.skills = Array.from(skillElements)
            .map(el => el.textContent?.trim())
            .filter((skill): skill is string => !!skill && skill.length > 0);

        return extractedData;
    }, []);

    // 초기 데이터 로드 - 한 번만 실행
    useEffect(() => {
        const initializeData = async () => {
            if (!document || hasInitialized.current || isDataReady.current) return;

            hasInitialized.current = true;
            setIsInitializing(true);

            try {
                const firstBlock = document.sections?.[0]?.blocks?.[0];
                if (firstBlock) {
                    const html = firstBlock.text || '';
                    console.log('🔍 MinimalEditor Initial HTML Loading:');
                    console.log('  - HTML preview (first 200 chars):', html.substring(0, 200));
                    console.log('  - HTML contains "colorful":', html.includes('colorful'));
                    console.log('  - HTML contains "minimal":', html.includes('minimal'));
                    console.log('  - HTML contains "clean":', html.includes('clean'));
                    console.log('  - HTML contains "elegant":', html.includes('elegant'));
                    console.log('  - Has extractedData:', !!firstBlock.extractedData);

                    setCurrentHtml(html);

                    let actualData: MinimalPortfolioData;

                    if (firstBlock.extractedData) {
                        const extracted = firstBlock.extractedData as any;
                        console.log('📦 MinimalEditor extractedData:', extracted);
                        console.log('📦 extractedData keys:', Object.keys(extracted));

                        // DB에서 온 데이터가 summary, skills, projects 형태인지 확인
                        if (extracted.summary || extracted.projects) {
                            console.log('🔄 Converting AI analysis data to MinimalPortfolioData format');

                            // experiences를 experience로 변환
                            const experienceData = Array.isArray(extracted.experiences)
                                ? extracted.experiences.map((exp: any) => ({
                                    company: exp.company || '',
                                    position: exp.position || '',
                                    period: exp.duration || exp.period || '',
                                    description: exp.achievements?.join(' • ') || exp.description || '',
                                    achievements: exp.achievements || []
                                }))
                                : Array.isArray(extracted.experience) ? extracted.experience : [];

                            // skills 배열 처리 (category별로 그룹화되어 있는 경우)
                            const skillsFlat = Array.isArray(extracted.skills)
                                ? extracted.skills.flatMap((s: any) =>
                                    Array.isArray(s.skills) ? s.skills : (typeof s === 'string' ? [s] : [])
                                  )
                                : [];

                            console.log('📊 Data mapping details:');
                            console.log('  - extracted.name:', extracted.name);
                            console.log('  - extracted.email:', extracted.email);
                            console.log('  - extracted.phone:', extracted.phone);
                            console.log('  - extracted.github:', extracted.github);
                            console.log('  - originalInput:', extracted.originalInput);
                            console.log('  - skills flat:', skillsFlat);
                            console.log('  - projects (first item):', extracted.projects?.[0]);
                            console.log('  - experiences (first item):', extracted.experiences?.[0]);

                            actualData = {
                                name: extracted.name || '',
                                title: extracted.originalInput?.jobPosition || extracted.position || extracted.title || '개발자',
                                email: extracted.email || '',
                                phone: extracted.phone || '',
                                github: extracted.github || '',
                                location: extracted.location || '',
                                about: extracted.summary || '',
                                skills: skillsFlat,
                                skillCategories: [],
                                projects: Array.isArray(extracted.projects) ? extracted.projects.map((p: any) => ({
                                    name: p.name || p.title || '',
                                    period: p.period || p.duration || '',
                                    description: p.summary || p.description || '',
                                    techStack: p.technologies || p.techStack || p.skills || [],
                                    achievements: p.achievements || p.results || []
                                })) : [],
                                experience: experienceData,
                                education: Array.isArray(extracted.education) ? extracted.education.map((edu: any) => ({
                                    school: edu.school || edu.institution || '',
                                    degree: edu.degree || '',
                                    major: edu.major || edu.field || '',
                                    period: edu.period || edu.duration || '',
                                    description: edu.description || edu.details || ''
                                })) : []
                            };

                            console.log('✅ Final actualData:', actualData);
                        } else {
                            actualData = extracted as MinimalPortfolioData;
                        }
                    } else {
                        actualData = extractPortfolioData(html);
                    }

                    // skillCategories 마이그레이션 로직
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
                        actualData.skillCategories = [
                            { category: '언어', skills: [], icon: '💻' },
                            { category: '프레임워크', skills: [], icon: '🔧' }
                        ];
                    }

                    setPortfolioData(actualData);
                    isDataReady.current = true;

                    // 🔧 CRITICAL FIX: Immediately trigger HTML update after data is loaded
                    // Use requestAnimationFrame to ensure state update has completed
                    requestAnimationFrame(() => {
                        console.log('🔧 MinimalEditor: Immediately updating HTML with correct template on initialization');
                        updateHtml().catch(console.error);
                    });

                    // AI 확장된 필드 표시 (autoFillService에서 이미 확장됨)
                    const newInitialEnhancedFields: Record<string, boolean> = {};
                    if (actualData.about && actualData.about.includes('<span style="color:orange">')) {
                        newInitialEnhancedFields['about'] = true;
                    }
                    actualData.projects?.forEach((project, index) => {
                        if (project.description && project.description.includes('<span style="color:orange">')) {
                            newInitialEnhancedFields[`project_${index}_description`] = true;
                        }
                    });
                    actualData.experience?.forEach((exp, index) => {
                        if (exp.description && exp.description.includes('<span style="color:orange">')) {
                            newInitialEnhancedFields[`experience_${index}_description`] = true;
                        }
                    });
                    if (Object.keys(newInitialEnhancedFields).length > 0) {
                        setInitialEnhancedFields(newInitialEnhancedFields);
                    }

                    // DB에서 불러온 데이터인지 확인 (summary 또는 이미 충분한 데이터가 있는 경우)
                    const extracted = firstBlock.extractedData as any;
                    const isFromDB = extracted && (
                        extracted.summary ||  // AI 분석 결과
                        extracted.about ||    // 이미 저장된 about 필드
                        (extracted.projects && extracted.projects.length > 0) ||  // 프로젝트 데이터 존재
                        (extracted.experience && extracted.experience.length > 0) ||  // 경력 데이터 존재
                        (extracted.experiences && extracted.experiences.length > 0)  // 경력 데이터 존재 (복수형)
                    );
                    const needsEnhancement = !isFromDB && (!actualData.about || actualData.about.length < 50);

                    console.log('🔍 Enhancement check:', {
                        isFromDB,
                        hasExtractedData: !!extracted,
                        hasSummary: !!(extracted?.summary),
                        hasAbout: !!actualData.about,
                        hasProjects: !!(extracted?.projects?.length),
                        hasExperience: !!(extracted?.experience?.length || extracted?.experiences?.length),
                        aboutLength: actualData.about?.length,
                        needsEnhancement
                    });

                    if (needsEnhancement) {
                        setIsEnhancing(true);
                        try {
                            const enhanced = await portfolioTextEnhancer.enhancePortfolioData(actualData);
                            setPortfolioData(enhanced);

                            if (!actualData.about && enhanced.about) {
                                setInitialEnhancedFields(prev => ({ ...prev, about: true }));
                            }
                        } catch (error) {
                            console.error('데이터 개선 실패:', error);
                        } finally {
                            setIsEnhancing(false);
                        }
                    }
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

    // AI 더미 데이터 생성 (초기화 완료 후 한 번만)
    useEffect(() => {
        const checkAndGenerateDummyData = async () => {
            if (isInitializing || isEnhancing || !isDataReady.current) return;

            const hasEducation = portfolioData.education && portfolioData.education.length > 0;

            if (!hasEducation && !initialEnhancedFields['education'] && !userEnhancedFields['education']) {
                try {
                    const { data: educationData, isGenerated } = await portfolioTextEnhancer.generateDummyEducation();
                    setPortfolioData(prev => ({
                        ...prev,
                        education: educationData
                    }));
                    if (isGenerated) {
                        setInitialEnhancedFields(prev => ({ ...prev, education: true }));
                    }
                } catch (error) {
                    console.error('더미 학력 데이터 생성 실패:', error);
                }
            }
        };

        // Only run after initialization is complete and data is ready
        if (!isInitializing && isDataReady.current && portfolioData.education !== undefined) {
            const timer = setTimeout(checkAndGenerateDummyData, 300);
            return () => clearTimeout(timer);
        }
    }, [isInitializing]); // Only depend on initialization state

    // portfolioData 변경 시 상위 컴포넌트에 알림
    useEffect(() => {
        if (!isInitializing && onDocumentChange && portfolioData.name) {
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
                        extractedData: portfolioData
                    }))
                }))
            };
            onDocumentChange(updatedDocument);
        }
    }, [portfolioData, isInitializing]);

    // HTML 업데이트 with scroll preservation
    const updateHtml = useCallback(async () => {
        console.log('🔧 MinimalEditor updateHtml:');
        console.log('  - selectedTemplate prop:', selectedTemplate);
        console.log('  - portfolioTemplates keys:', Object.keys(portfolioTemplates));

        // Always use minimal template for MinimalEditor
        const template = portfolioTemplates['minimal'];
        console.log('  - using minimal template:', !!template);
        console.log('  - template.name:', template?.name);

        if (template?.generateHTML) {
            // Minimal 템플릿에 맞는 데이터 구조 생성
            const dataForTemplate = {
                name: portfolioData.name || '포트폴리오 작성자',
                title: portfolioData.title || '소프트웨어 개발자',
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
                        skills: ['React', 'Node.js', 'Express', 'Spring'],
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
                education: portfolioData.education || [],
                sectionTitles: sectionTitles
            };

            // Minimal 템플릿에서 sectionTitles를 직접 활용
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
        if (isDataReady.current && !isInitializing) {
            console.log('🔄 Data changed, updating HTML immediately');
            updateHtml().catch(console.error);
        }
    }, [portfolioData, sectionTitles, isInitializing, updateHtml]);

    // About 섹션 동기화 (커서 점프 방지)
    useEffect(() => {
        if (aboutEditorRef.current && !isUserTyping.current) {
            const currentContent = aboutEditorRef.current.innerHTML;
            const newContent = portfolioData.about || '';

            // 내용이 다를 때만 업데이트 (무한 루프 방지)
            if (currentContent !== newContent) {
                aboutEditorRef.current.innerHTML = newContent;
            }
        }
    }, [portfolioData.about]);

    // Experience description 동기화 (커서 점프 방지)
    useEffect(() => {
        portfolioData.experience.forEach((exp, index) => {
            const ref = expDescRefs.current[index];
            if (ref && !isUserTyping.current) {
                const currentContent = ref.innerHTML;
                const newContent = exp.description || '';
                if (currentContent !== newContent) {
                    ref.innerHTML = newContent;
                }
            }
        });
    }, [portfolioData.experience]);

    // Project description 동기화 (커서 점프 방지)
    useEffect(() => {
        portfolioData.projects.forEach((project, index) => {
            const ref = projDescRefs.current[index];
            if (ref && !isUserTyping.current) {
                const currentContent = ref.innerHTML;
                const newContent = project.description || '';
                if (currentContent !== newContent) {
                    ref.innerHTML = newContent;
                }
            }
        });
    }, [portfolioData.projects]);

    // Education description 동기화 (커서 점프 방지)
    useEffect(() => {
        portfolioData.education.forEach((edu, index) => {
            const ref = eduDescRefs.current[index];
            if (ref && !isUserTyping.current) {
                const currentContent = ref.innerHTML;
                const newContent = edu.description || '';
                if (currentContent !== newContent) {
                    ref.innerHTML = newContent;
                }
            }
        });
    }, [portfolioData.education]);

    // 자기소개 개선
    const handleEnhanceAbout = async () => {
        setIsEnhancing(true);
        setEnhancingSection('about');
        try {
            const enhanced = await portfolioTextEnhancer.enhanceAboutMe(portfolioData.about);
            setPortfolioData(prev => ({ ...prev, about: enhanced.enhanced }));
            if (enhanced.isGenerated) {
                setUserEnhancedFields(prev => ({ ...prev, about: true }));
                setInitialEnhancedFields(prev => ({ ...prev, about: false }));
            }
        } catch (error) {
            console.error('자기소개 개선 실패:', error);
            alert('AI 개선에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsEnhancing(false);
            setEnhancingSection(null);
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
            await updateHtml();
        } catch (error) {
            console.error('자연어 편집 실패:', error);
            throw error;
        }
    };

    // 경력 개선
    const handleEnhanceExperience = async (index: number) => {
        setIsEnhancing(true);
        setEnhancingSection(`experience_${index}`);
        try {
            const experience = portfolioData.experience[index];
            const enhanced = await portfolioTextEnhancer.enhanceExperience(experience);

            setPortfolioData(prev => {
                const updatedExperience = [...prev.experience];
                updatedExperience[index] = {
                    position: enhanced.position,
                    company: enhanced.company,
                    duration: enhanced.duration,
                    description: enhanced.description,
                    achievements: enhanced.achievements || []
                };
                return { ...prev, experience: updatedExperience };
            });

            // AI 개선 시 description 필드 추적
            setUserEnhancedFields(prev => ({
                ...prev,
                [`experience_${index}_description`]: true
            }));
            setInitialEnhancedFields(prev => ({
                ...prev,
                [`experience_${index}_description`]: false
            }));
        } catch (error) {
            console.error('경력 개선 실패:', error);
            alert('AI 개선에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsEnhancing(false);
            setEnhancingSection(null);
        }
    };

    // 학력 개선
    const handleEnhanceEducation = async (index: number) => {
        setIsEnhancing(true);
        setEnhancingSection(`education_${index}`);
        try {
            const education = portfolioData.education[index];
            const enhanced = await portfolioTextEnhancer.enhanceEducation(education);

            setPortfolioData(prev => {
                const updatedEducation = [...prev.education];
                updatedEducation[index] = {
                    school: enhanced.school,
                    degree: enhanced.degree,
                    period: enhanced.period,
                    description: enhanced.description
                };
                return { ...prev, education: updatedEducation };
            });

            if (enhanced.enhanced?.isGenerated) {
                setUserEnhancedFields(prev => ({ ...prev, [`education_${index}_description`]: true }));
                setInitialEnhancedFields(prev => ({ ...prev, [`education_${index}_description`]: false }));
            }
        } catch (error) {
            console.error('학력 개선 실패:', error);
            alert('AI 개선에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsEnhancing(false);
            setEnhancingSection(null);
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
        setEnhancingSection(`project_${index}`);
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
                setUserEnhancedFields(prev => ({ ...prev, [`project_${index}_description`]: true }));
                setInitialEnhancedFields(prev => ({ ...prev, [`project_${index}_description`]: false }));
            }
        } catch (error) {
            console.error('프로젝트 개선 실패:', error);
            alert('AI 개선에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsEnhancing(false);
            setEnhancingSection(null);
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

    // 학력 관련 핸들러들 (Minimal 템플릿 전용)
    const handleAddEducation = () => {
        const newEducation: EducationData = {
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

    const handleDeleteEducation = (index: number) => {
        setPortfolioData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
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

    // 로딩 화면 (초기화 중에만 표시)
    if (isInitializing) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-6">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Minimal 템플릿 데이터 준비 중</h3>
                    <p className="text-gray-600">
                        {isEnhancing ? 'AI가 사용자 입력을 전문적으로 가공하고 있습니다...' : 'Minimal 템플릿 데이터를 불러오는 중입니다...'}
                    </p>
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
                                Minimal 템플릿 편집 - 미니멀리스트 스타일
                            </h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            {onSaveOnly && (
                                <button
                                    onClick={onSaveOnly}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    {isSaving ? '저장 중...' : '저장하기'}
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                {isSaving ? '완성 중...' : '완성하기'}
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
                        </BlurFade>

                        {/* 자기소개 섹션 */}
                        <BlurFade delay={0.1}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.about}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, about: e.target.value }))}
                                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                                            placeholder="섹션 제목"
                                        />
                                    </div>
                                    <button
                                        onClick={handleEnhanceAbout}
                                        disabled={isEnhancing}
                                        className={getButtonClass('primary', 'sm', isEnhancing)}
                                    >
                                        <SparklesIcon className="w-4 h-4 mr-1" />
                                        {isEnhancing ? 'AI 개선 중...' : 'AI로 개선'}
                                    </button>
                                </div>
                                <div
                                    ref={aboutEditorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onFocus={() => {
                                        isUserTyping.current = true;
                                    }}
                                    onBlur={() => {
                                        isUserTyping.current = false;
                                        // Blur 시 마지막 변경사항 즉시 적용
                                        if (updateDebounceRef.current) {
                                            clearTimeout(updateDebounceRef.current);
                                            updateDebounceRef.current = null;
                                        }
                                    }}
                                    onInput={(e) => {
                                        const newValue = e.currentTarget.innerHTML;

                                        // Clear existing timeout
                                        if (updateDebounceRef.current) {
                                            clearTimeout(updateDebounceRef.current);
                                        }

                                        // Debounce state update to improve performance
                                        updateDebounceRef.current = setTimeout(() => {
                                            setPortfolioData(prev => ({ ...prev, about: newValue }));

                                            // AI가 확장한 내용을 사용자가 수정하면 userEnhancedFields 해제 (initialEnhancedFields는 유지)
                                            if (userEnhancedFields['about']) {
                                                setUserEnhancedFields(prev => ({ ...prev, about: false }));
                                            }
                                        }, 300);
                                    }}
                                    className={`w-full p-4 border rounded-lg min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        userEnhancedFields['about']
                                            ? 'bg-yellow-50 border-yellow-300'
                                            : 'bg-white border-gray-300'
                                    }`}
                                    data-placeholder="자기소개를 입력하세요."
                                    style={{
                                        minHeight: '150px',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word'
                                    }}
                                />
                                {userEnhancedFields['about'] ? (
                                    <p className="mt-2 text-xs text-yellow-700">
                                        ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                    </p>
                                ) : initialEnhancedFields['about'] ? (
                                    <p className="mt-2 text-xs text-yellow-700">
                                        색이 다른 글씨는 AI가 보충하여 생성한 데이터입니다. 검토 후 필요시 수정해주세요.
                                    </p>
                                ) : null}
                            </div>
                        </BlurFade>

                        {/* 기술 스택 섹션 */}
                        <BlurFade delay={0.2}>
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
                                                {category.skills.map((skill, skillIndex) => {
                                                    const skillText = typeof skill === 'string' ? skill : (skill as any)?.name || String(skill);
                                                    return (
                                                        <div key={skillIndex} className="group relative">
                                                            <Badge variant="secondary" className="pr-8">
                                                                {skillText}
                                                                <button
                                                                    onClick={() => handleDeleteSkillFromCategory(categoryIndex, skillIndex)}
                                                                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                                                                >
                                                                    <XMarkIcon className="w-3 h-3" />
                                                                </button>
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
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
                                    <div key={index} className={`mb-4 p-4 rounded-lg border ${
                                        userEnhancedFields[`project_${index}`]
                                            ? 'bg-yellow-50 border-yellow-300'
                                            : 'bg-gray-50 border-gray-200'
                                    }`}>
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

                                        <div
                                            ref={(el) => { projDescRefs.current[index] = el; }}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onFocus={() => { isUserTyping.current = true; }}
                                            onBlur={() => {
                                                isUserTyping.current = false;
                                                // Blur 시 마지막 변경사항 즉시 적용
                                                if (updateDebounceRef.current) {
                                                    clearTimeout(updateDebounceRef.current);
                                                    updateDebounceRef.current = null;
                                                }
                                            }}
                                            onInput={(e) => {
                                                const newValue = e.currentTarget.innerHTML;

                                                // Clear existing timeout
                                                if (updateDebounceRef.current) {
                                                    clearTimeout(updateDebounceRef.current);
                                                }

                                                // Debounce state update to improve performance
                                                updateDebounceRef.current = setTimeout(() => {
                                                    handleUpdateProject(index, 'description', newValue);
                                                    if (userEnhancedFields[`project_${index}_description`]) {
                                                        setUserEnhancedFields(prev => ({ ...prev, [`project_${index}_description`]: false }));
                                                    }
                                                }, 300);
                                            }}
                                            className={`w-full p-2 border rounded min-h-[80px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                userEnhancedFields[`project_${index}_description`]
                                                    ? 'bg-yellow-50 border-yellow-300'
                                                    : 'bg-white border-gray-300'
                                            }`}
                                            data-placeholder="프로젝트 설명을 입력하세요."
                                            style={{
                                                minHeight: '80px',
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word'
                                            }}
                                        />
                                        {userEnhancedFields[`project_${index}_description`] ? (
                                            <p className="mt-2 text-xs text-yellow-700">
                                                ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                            </p>
                                        ) : initialEnhancedFields[`project_${index}_description`] ? (
                                            <p className="mt-2 text-xs text-yellow-700">
                                                색이 다른 글씨는 AI가 보충하여 생성한 데이터입니다. 검토 후 필요시 수정해주세요.
                                            </p>
                                        ) : null}

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
                                        {(initialEnhancedFields[`project_${index}`] || userEnhancedFields[`project_${index}`]) && (
                                            <p className="mt-2 text-xs text-yellow-700">
                                                ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                            </p>
                                        )}
                                    </div>
                                ))}

                                {portfolioData.projects.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        프로젝트를 추가해주세요
                                    </p>
                                )}
                            </div>
                        </BlurFade>

                        {/* 경력 섹션 */}
                        <BlurFade delay={0.4}>
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
                                            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                                userEnhancedFields[`experience_${index}`]
                                                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
                                                    : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={exp.position || ''}
                                                    onChange={(e) => handleUpdateExperience(index, 'position', e.target.value)}
                                                    className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1 mr-4"
                                                    placeholder="직책"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEnhanceExperience(index)}
                                                        disabled={isEnhancing}
                                                        className="p-1 text-purple-600 hover:bg-purple-100 rounded disabled:opacity-50"
                                                        title="AI로 개선"
                                                    >
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExperience(index)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
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

                                            <div
                                                ref={(el) => { expDescRefs.current[index] = el; }}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onFocus={() => { isUserTyping.current = true; }}
                                                onBlur={() => {
                                                    isUserTyping.current = false;
                                                    // Blur 시 마지막 변경사항 즉시 적용
                                                    if (updateDebounceRef.current) {
                                                        clearTimeout(updateDebounceRef.current);
                                                        updateDebounceRef.current = null;
                                                    }
                                                }}
                                                onInput={(e) => {
                                                    const newValue = e.currentTarget.innerHTML;

                                                    // Clear existing timeout
                                                    if (updateDebounceRef.current) {
                                                        clearTimeout(updateDebounceRef.current);
                                                    }

                                                    // Debounce state update to improve performance
                                                    updateDebounceRef.current = setTimeout(() => {
                                                        handleUpdateExperience(index, 'description', newValue);
                                                        if (userEnhancedFields[`experience_${index}_description`]) {
                                                            setUserEnhancedFields(prev => ({ ...prev, [`experience_${index}_description`]: false }));
                                                        }
                                                    }, 300);
                                                }}
                                                className={`w-full p-2 border rounded min-h-[60px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    userEnhancedFields[`experience_${index}_description`]
                                                        ? 'bg-yellow-50 border-yellow-300'
                                                        : 'bg-white border-gray-300'
                                                }`}
                                                data-placeholder="담당 업무를 입력하세요."
                                                style={{
                                                    minHeight: '60px',
                                                    whiteSpace: 'pre-wrap',
                                                    wordWrap: 'break-word'
                                                }}
                                            />
                                            {userEnhancedFields[`experience_${index}_description`] ? (
                                                <p className="mt-2 text-xs text-yellow-700">
                                                    ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                                </p>
                                            ) : initialEnhancedFields[`experience_${index}_description`] ? (
                                                <p className="mt-2 text-xs text-yellow-700">
                                                    색이 다른 글씨는 AI가 보충하여 생성한 데이터입니다. 검토 후 필요시 수정해주세요.
                                                </p>
                                            ) : null}

                                            <div className="mt-3">
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

                        {/* 학력 섹션 (Minimal 템플릿 전용) */}
                        <BlurFade delay={0.5}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={sectionTitles.education}
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
                                    {portfolioData.education.map((edu, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                                userEnhancedFields['education']
                                                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
                                                    : 'bg-gradient-to-r from-indigo-50 to-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={edu.school || ''}
                                                    onChange={(e) => handleUpdateEducation(index, 'school', e.target.value)}
                                                    className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none flex-1 mr-4"
                                                    placeholder="학교명"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEnhanceEducation(index)}
                                                        disabled={isEnhancing}
                                                        className="p-1 text-purple-600 hover:bg-purple-100 rounded disabled:opacity-50"
                                                        title="AI로 개선"
                                                    >
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEducation(index)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
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

                                            <div
                                                ref={(el) => { eduDescRefs.current[index] = el; }}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onFocus={() => { isUserTyping.current = true; }}
                                                onBlur={() => {
                                                    isUserTyping.current = false;
                                                    // Blur 시 마지막 변경사항 즉시 적용
                                                    if (updateDebounceRef.current) {
                                                        clearTimeout(updateDebounceRef.current);
                                                        updateDebounceRef.current = null;
                                                    }
                                                }}
                                                onInput={(e) => {
                                                    const newValue = e.currentTarget.innerHTML;

                                                    // Clear existing timeout
                                                    if (updateDebounceRef.current) {
                                                        clearTimeout(updateDebounceRef.current);
                                                    }

                                                    // Debounce state update to improve performance
                                                    updateDebounceRef.current = setTimeout(() => {
                                                        handleUpdateEducation(index, 'description', newValue);
                                                        if (userEnhancedFields[`education_${index}_description`]) {
                                                            setUserEnhancedFields(prev => ({ ...prev, [`education_${index}_description`]: false }));
                                                        }
                                                    }, 300);
                                                }}
                                                className={`w-full p-2 border rounded min-h-[60px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    userEnhancedFields[`education_${index}_description`]
                                                        ? 'bg-yellow-50 border-yellow-300'
                                                        : 'bg-white border-gray-300'
                                                }`}
                                                style={{
                                                    minHeight: '60px',
                                                    whiteSpace: 'pre-wrap',
                                                    wordWrap: 'break-word'
                                                }}
                                            />
                                            {userEnhancedFields[`education_${index}_description`] ? (
                                                <p className="mt-2 text-xs text-yellow-700">
                                                    ⚠️ AI가 생성/개선한 내용입니다. 검토 후 필요시 수정해주세요.
                                                </p>
                                            ) : initialEnhancedFields[`education_${index}_description`] ? (
                                                <p className="mt-2 text-xs text-yellow-700">
                                                    색이 다른 글씨는 AI가 보충하여 생성한 데이터입니다. 검토 후 필요시 수정해주세요.
                                                </p>
                                            ) : null}
                                        </motion.div>
                                    ))}
                                </div>

                                {portfolioData.education.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        학력을 추가해주세요
                                    </p>
                                )}

                                {(initialEnhancedFields['education'] || userEnhancedFields['education']) && portfolioData.education.length > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            ⚠️ 학력 정보가 없어 AI가 더미 데이터를 생성했습니다. 실제 학력 정보로 수정해주세요.
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
                                실시간 미리보기 - Minimal 스타일
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
                                    title="Minimal Portfolio Preview"
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

            {/* AI 개선 중 로딩 오버레이 */}
            {isEnhancing && enhancingSection && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
                        <div className="flex flex-col items-center">
                            <div className="flex space-x-2 mb-4">
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <SparklesIcon className="w-6 h-6 text-purple-600 animate-pulse" />
                                <h3 className="text-xl font-bold text-gray-900">AI로 개선 중입니다...</h3>
                            </div>
                            <p className="text-gray-600 text-center">
                                {enhancingSection.startsWith('about') && '자기소개를 개선하고 있습니다'}
                                {enhancingSection.startsWith('project') && '프로젝트 설명을 개선하고 있습니다'}
                                {enhancingSection.startsWith('experience') && '경력 사항을 개선하고 있습니다'}
                                {enhancingSection.startsWith('education') && '학력 정보를 작성하고 있습니다'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 자연어 편집 플로팅 버튼 - 항상 화면에 고정 */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowNaturalLanguage(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200 flex items-center gap-2.5"
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

export default MinimalEditor;