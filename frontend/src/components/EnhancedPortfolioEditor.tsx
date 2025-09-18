import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PencilIcon,
    EyeIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    SwatchIcon
} from '@heroicons/react/24/outline';
import { PortfolioDocument } from '../services/autoFillService';
import { portfolioTemplates } from '../templates/portfolioTemplates';
import ContentRecommendationPanel from './ContentRecommendationPanel';
import { ContentRecommendation } from '../services/contentRecommendationService';

type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

interface EnhancedPortfolioEditorProps {
    document: PortfolioDocument;
    selectedTemplate?: TemplateType;
    onSave: (updatedDocument: PortfolioDocument) => void;
    onBack: () => void;
    onSkipToNaturalEdit?: () => void;
    onTemplateChange?: (template: TemplateType) => void;
}

interface MissingInfo {
    section: string;
    field: string;
    description: string;
    placeholder: string;
}

interface EditableTextNode {
    id: string;
    label: string;
    value: string;
    type: 'text' | 'textarea';
    path: string; // HTML 내 경로 (예: "header.h1", "section.about.p")
}

const EnhancedPortfolioEditor: React.FC<EnhancedPortfolioEditorProps> = ({
    document,
    selectedTemplate = 'james',
    onSave,
    onBack,
    onSkipToNaturalEdit,
    onTemplateChange
}) => {
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [editableFields, setEditableFields] = useState<EditableTextNode[]>([]);
    const [currentHtml, setCurrentHtml] = useState<string>('');
    const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<TemplateType>(selectedTemplate);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // HTML에서 편집 가능한 텍스트 노드 추출
    const extractEditableTextNodes = (html: string): EditableTextNode[] => {
        if (!html || typeof html !== 'string') return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const textNodes: EditableTextNode[] = [];

        // 편집 가능한 요소들의 셀렉터 정의
        const editableSelectors = [
            'h1, h2, h3, h4, h5, h6',    // 제목들
            'p',                          // 단락
            '.skill-tag',                 // 스킬 태그
            'a',                          // 링크
            'title'                       // 페이지 제목
        ];

        editableSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach((element, index) => {
                const textContent = element.textContent?.trim();
                if (textContent && textContent.length > 0) {
                    // 레이블 생성 로직 - 더 구체적이고 의미있는 라벨 생성
                    let label = '';
                    const text = textContent.toLowerCase();

                    if (element.tagName.toLowerCase().startsWith('h')) {
                        // 헤더 태그의 경우 내용 기반으로 라벨 결정
                        if (text.includes('이름') || element.tagName === 'H1') {
                            label = '이름';
                        } else if (text.includes('프로젝트') || text.includes('project')) {
                            label = '프로젝트 제목';
                        } else if (text.includes('경력') || text.includes('경험') || text.includes('experience')) {
                            label = '경력 제목';
                        } else if (text.includes('교육') || text.includes('학력') || text.includes('education')) {
                            label = '교육 제목';
                        } else if (text.includes('기술') || text.includes('스킬') || text.includes('skill')) {
                            label = '기술 스택 제목';
                        } else {
                            label = `제목 (${element.tagName})`;
                        }
                    } else if (element.tagName.toLowerCase() === 'p') {
                        // 단락의 경우 위치와 내용으로 라벨 결정
                        const parentSection = element.closest('section');
                        const parentHeader = element.closest('header');

                        if (parentHeader) {
                            // 헤더 내부의 p 태그들
                            if (text.includes('@') || text.includes('email')) {
                                label = '이메일';
                            } else if (text.includes('010') || text.includes('+82') || text.includes('phone') || text.includes('tel')) {
                                label = '연락처';
                            } else if (text.includes('github') || text.includes('git')) {
                                label = '깃허브';
                            } else if (text.includes('linkedin')) {
                                label = '링크드인';
                            } else if (text.includes('blog') || text.includes('portfolio')) {
                                label = '포트폴리오 링크';
                            } else if (text.includes('개발자') || text.includes('developer') || text.includes('engineer')) {
                                label = '직책/포지션';
                            } else {
                                label = '연락처 정보';
                            }
                        } else if (parentSection) {
                            const sectionClass = parentSection.className;
                            if (sectionClass.includes('about') || text.includes('소개')) {
                                label = '자기소개';
                            } else if (sectionClass.includes('project') || text.includes('프로젝트')) {
                                label = '프로젝트 설명';
                            } else if (sectionClass.includes('experience') || text.includes('경력')) {
                                label = '경력 설명';
                            } else if (sectionClass.includes('education') || text.includes('교육')) {
                                label = '교육 설명';
                            } else {
                                label = '설명';
                            }
                        } else {
                            label = '내용';
                        }
                    } else if (element.classList.contains('skill-tag')) {
                        label = '기술 스킬';
                    } else if (element.tagName.toLowerCase() === 'title') {
                        label = '페이지 제목';
                    } else if (element.tagName.toLowerCase() === 'a') {
                        // 링크의 경우
                        if (text.includes('github')) {
                            label = '깃허브 링크';
                        } else if (text.includes('linkedin')) {
                            label = '링크드인 링크';
                        } else if (text.includes('blog')) {
                            label = '블로그 링크';
                        } else {
                            label = '링크';
                        }
                    } else {
                        label = '텍스트';
                    }

                    // 같은 라벨이 여러 개인 경우에만 번호 추가
                    const existingLabels = textNodes.filter(node => node.label.startsWith(label));
                    const finalLabel = existingLabels.length > 0 ? `${label} ${existingLabels.length + 1}` : label;

                    textNodes.push({
                        id: `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`,
                        label: finalLabel,
                        value: textContent,
                        type: textContent.length > 50 ? 'textarea' : 'text',
                        path: `${selector}[${index}]`
                    });
                }
            });
        });

        return textNodes;
    };

    // HTML 내 특정 텍스트 노드 업데이트
    const updateHtmlTextNode = (html: string, path: string, newValue: string): string => {
        if (!html || !path || newValue === undefined) return html;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // path 파싱 (예: "h1[0]", "p[1]")
            const match = path.match(/^(.+)\[(\d+)\]$/);
            if (!match) return html;

            const [, selector, indexStr] = match;
            const index = parseInt(indexStr, 10);

            const elements = doc.querySelectorAll(selector);
            if (elements[index]) {
                elements[index].textContent = newValue;
            }

            return doc.documentElement.outerHTML;
        } catch (error) {
            console.error('HTML 업데이트 실패:', error);
            return html;
        }
    };

    // HTML에서 실제 포트폴리오 데이터 추출
    const extractRealPortfolioData = (html: string) => {
        if (!html) return null;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 실제 데이터 추출
        const extractedData = {
            name: '',
            title: '',
            email: '',
            phone: '',
            github: '',
            blog: '',
            linkedin: '',
            about: '',
            skills: [] as string[],
            projects: [] as any[],
            experience: [] as any[],
            education: [] as any[]
        };

        // 이름 추출 (h1 태그에서)
        const nameElement = doc.querySelector('h1');
        if (nameElement) {
            extractedData.name = nameElement.textContent?.trim().replace('[이름]', '').replace('|', '').trim() || '';
        }

        // 직책 추출 (header 내 p 태그에서)
        const titleElement = doc.querySelector('header p');
        if (titleElement) {
            extractedData.title = titleElement.textContent?.trim() || '';
        }

        // 연락처 추출 - 더 광범위하게 검색
        const allTextElements = doc.querySelectorAll('p, span, div, a, header');
        allTextElements.forEach(el => {
            const text = el.textContent || '';

            // 이메일 추출
            if (text.includes('@') && !extractedData.email) {
                const emailMatch = text.match(/\S+@\S+\.\S+/);
                if (emailMatch) {
                    extractedData.email = emailMatch[0];
                }
            }

            // 전화번호 추출
            if ((text.includes('010') || text.includes('+82') || text.includes('Phone:') || text.includes('Tel:')) && !extractedData.phone) {
                const phoneMatch = text.match(/(?:010|Phone:|Tel:)?\s*[\d\-\+\s()]+/);
                if (phoneMatch) {
                    extractedData.phone = phoneMatch[0].replace(/Phone:|Tel:/, '').trim();
                }
            }

            // GitHub 링크 추출
            if ((text.includes('github') || text.includes('GitHub')) && !extractedData.github) {
                const githubMatch = text.match(/github\.com\/[\w\-\.]+/);
                if (githubMatch) {
                    extractedData.github = githubMatch[0];
                }
            }
        });

        // About Me 섹션 추출
        const aboutSection = doc.querySelector('.about, section.about');
        if (aboutSection) {
            const aboutParagraphs = aboutSection.querySelectorAll('p');
            extractedData.about = Array.from(aboutParagraphs)
                .map(p => p.textContent?.trim())
                .filter(text => text && text.length > 0)
                .join('\n\n');
        }

        // 기술 스킬 추출 - 다양한 선택자 사용
        const skillSelectors = ['.skill-tag', '.skill', '.tech-stack span', '.technology'];
        skillSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0 && extractedData.skills.length === 0) {
                extractedData.skills = Array.from(elements)
                    .map(el => el.textContent?.trim())
                    .filter(skill => skill && skill.length > 0) as string[];
            }
        });

        // 모든 텍스트에서 프로젝트 관련 정보 추출
        const bodyText = doc.body?.textContent || '';
        const projects: any[] = [];
        const experience: any[] = [];
        const education: any[] = [];

        // 프로젝트 섹션 파싱 - 실제 입력 내용 기반
        const projectSections = bodyText.split(/프로젝트|project/i);
        if (projectSections.length > 1) {
            projectSections.slice(1).forEach(section => {
                const lines = section.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    // 프로젝트명과 설명 추출
                    const name = lines[0]?.replace(/[^가-힣a-zA-Z0-9\s\-]/g, '').trim();
                    if (name && name.length > 0) {
                        projects.push({
                            name: name,
                            description: lines.slice(1).join(' '),
                            tech: [],
                            role: '',
                            period: '',
                            link: ''
                        });
                    }
                }
            });
        }

        // 경력 섹션 파싱
        const experienceSections = bodyText.split(/경력|experience|활동/i);
        if (experienceSections.length > 1) {
            experienceSections.slice(1).forEach(section => {
                const lines = section.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    const firstLine = lines[0]?.trim();
                    if (firstLine && firstLine.length > 0) {
                        experience.push({
                            position: firstLine,
                            company: '',
                            duration: '',
                            description: lines.slice(1).join(' ')
                        });
                    }
                }
            });
        }

        // 교육 섹션 파싱
        const educationSections = bodyText.split(/교육|education|학력/i);
        if (educationSections.length > 1) {
            educationSections.slice(1).forEach(section => {
                const lines = section.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    const firstLine = lines[0]?.trim();
                    if (firstLine && firstLine.length > 0) {
                        education.push({
                            school: firstLine,
                            degree: '',
                            period: ''
                        });
                    }
                }
            });
        }

        // 추출된 데이터가 있으면 사용
        if (projects.length > 0) extractedData.projects = projects;
        if (experience.length > 0) extractedData.experience = experience;
        if (education.length > 0) extractedData.education = education;

        console.log('HTML에서 추출된 포트폴리오 데이터:', extractedData);
        return extractedData;
    };

    // 포트폴리오 문서에서 데이터 추출
    const extractPortfolioData = (doc: PortfolioDocument) => {
        console.log('=== extractPortfolioData START ===');
        console.log('Document structure:', doc);

        // 첫 번째 섹션의 첫 번째 블록에서 HTML 추출
        const firstBlock = doc.sections?.[0]?.blocks?.[0];
        if (firstBlock && firstBlock.text) {
            const html = firstBlock.text;
            setCurrentHtml(html);

            // HTML에서 편집 가능한 텍스트 노드 추출
            const textNodes = extractEditableTextNodes(html);
            setEditableFields(textNodes);

            // 실제 HTML에서 포트폴리오 데이터 추출
            const portfolioDataFromHtml = extractRealPortfolioData(html);

            // 추출된 데이터가 있으면 사용, 없으면 기본값
            const finalData = portfolioDataFromHtml || {
                name: '포트폴리오 소유자',
                title: '직책',
                email: 'email@example.com',
                phone: '010-0000-0000',
                about: '자기소개를 작성해주세요',
                skills: ['React', 'TypeScript', 'JavaScript'],
                projects: [],
                experience: [],
                education: []
            };

            console.log('추출된 포트폴리오 데이터:', finalData);
            return finalData;
        }

        return null;
    };

    // 편집 필드 값 변경 핸들러
    const handleFieldEdit = (fieldId: string, newValue: string) => {
        // 편집 가능한 필드 업데이트
        setEditableFields(prev =>
            prev.map(field =>
                field.id === fieldId
                    ? { ...field, value: newValue }
                    : field
            )
        );

        // HTML 업데이트
        const field = editableFields.find(f => f.id === fieldId);
        if (field) {
            const updatedHtml = updateHtmlTextNode(currentHtml, field.path, newValue);
            setCurrentHtml(updatedHtml);
        }
    };

    const findMissingInformation = async (data: any) => {
        try {
            // 기본적인 누락 정보 체크
            const missing: MissingInfo[] = [];

            if (!data.name || data.name === '포트폴리오 소유자') {
                missing.push({
                    section: 'header',
                    field: 'name',
                    description: '실제 이름을 입력해주세요',
                    placeholder: '홍길동'
                });
            }

            if (!data.title || data.title === '직책') {
                missing.push({
                    section: 'header',
                    field: 'title',
                    description: '직책/포지션을 입력해주세요',
                    placeholder: '프론트엔드 개발자'
                });
            }

            if (!data.about || data.about === '자기소개를 작성해주세요') {
                missing.push({
                    section: 'about',
                    field: 'about',
                    description: '자기소개를 작성해주세요',
                    placeholder: '개발자로서의 경험과 목표를 설명해주세요'
                });
            }

            setMissingInfo(missing);
        } catch (error) {
            console.error('누락 정보 분석 실패:', error);
            setMissingInfo([]);
        }
    };

    const initializePortfolio = () => {
        if (!document) return;

        try {
            const extractedData = extractPortfolioData(document);
            if (extractedData) {
                setPortfolioData(extractedData);
                findMissingInformation(extractedData);
            }
        } catch (error) {
            console.error('포트폴리오 초기화 실패:', error);
        }
    };

    useEffect(() => {
        initializePortfolio();
    }, [document]);

    const handleSave = () => {
        if (!portfolioData) return;

        // 현재 편집된 HTML에서 최신 데이터 추출
        const updatedPortfolioData = extractRealPortfolioData(currentHtml) || portfolioData;

        console.log('저장할 포트폴리오 데이터:', updatedPortfolioData);

        // 편집된 텍스트와 구조화된 데이터를 모두 포함하여 문서 업데이트
        const updatedDocument = {
            ...document,
            // 구조화된 데이터를 추가 섹션으로 저장
            metadata: {
                extractedData: updatedPortfolioData,
                lastUpdated: new Date().toISOString()
            },
            sections: document.sections?.map(section => ({
                ...section,
                blocks: section.blocks?.map(block => ({
                    ...block,
                    text: currentHtml,
                    // 추출된 데이터도 블록에 저장
                    extractedData: updatedPortfolioData
                }))
            }))
        };

        console.log('저장할 문서:', updatedDocument);
        onSave(updatedDocument);
    };

    const handleTemplateChange = (templateId: TemplateType) => {
        setCurrentTemplate(templateId);
        setShowTemplateSelector(false);
        if (onTemplateChange) {
            onTemplateChange(templateId);
        }
    };

    // 필드들을 논리적 섹션으로 그룹화
    const groupEditableFields = () => {
        const groups = {
            header: { title: '👤 기본 정보', fields: [] as EditableTextNode[] },
            about: { title: '💬 자기소개', fields: [] as EditableTextNode[] },
            projects: { title: '🚀 프로젝트', fields: [] as EditableTextNode[] },
            skills: { title: '🛠️ 기술 스택', fields: [] as EditableTextNode[] },
            experience: { title: '💼 경력', fields: [] as EditableTextNode[] },
            education: { title: '🎓 교육', fields: [] as EditableTextNode[] },
            etc: { title: '📝 기타', fields: [] as EditableTextNode[] }
        };

        // 필드들을 적절한 그룹에 분류
        editableFields.forEach(field => {
            const label = field.label.toLowerCase();

            if (label.includes('이름') || label.includes('이메일') || label.includes('연락처') ||
                label.includes('깃허브') || label.includes('링크드인') || label.includes('직책') ||
                label.includes('포지션') || label.includes('페이지 제목')) {
                groups.header.fields.push(field);
            } else if (label.includes('자기소개') || label.includes('about')) {
                groups.about.fields.push(field);
            } else if (label.includes('프로젝트')) {
                groups.projects.fields.push(field);
            } else if (label.includes('기술') || label.includes('스킬')) {
                groups.skills.fields.push(field);
            } else if (label.includes('경력') || label.includes('experience')) {
                groups.experience.fields.push(field);
            } else if (label.includes('교육') || label.includes('education')) {
                groups.education.fields.push(field);
            } else {
                groups.etc.fields.push(field);
            }
        });

        return groups;
    };

    const renderFieldInput = (field: EditableTextNode) => (
        <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {field.label}
            </label>
            {field.type === 'textarea' ? (
                <textarea
                    value={field.value}
                    onChange={(e) => handleFieldEdit(field.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-vertical min-h-[100px]"
                    rows={4}
                    placeholder={`${field.label}을(를) 입력해주세요`}
                />
            ) : (
                <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleFieldEdit(field.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder={`${field.label}을(를) 입력해주세요`}
                />
            )}
        </div>
    );

    const renderEditableFields = () => {
        const groups = groupEditableFields();
        const orderedGroupKeys = ['header', 'about', 'projects', 'skills', 'experience', 'education', 'etc'];

        return orderedGroupKeys.map(groupKey => {
            const group = groups[groupKey as keyof typeof groups];
            if (group.fields.length === 0) return null;

            return (
                <div key={groupKey} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                    <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        {group.title}
                    </h4>
                    <div className="space-y-4">
                        {group.fields.map(renderFieldInput)}
                    </div>
                </div>
            );
        }).filter(Boolean);
    };

    if (!portfolioData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">포트폴리오를 분석하고 있습니다...</p>
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
                            <h1 className="text-xl font-semibold text-gray-900">포트폴리오 편집</h1>
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
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
                                <PencilIcon className="w-5 h-5 mr-2 text-purple-600" />
                                포트폴리오 편집
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">각 섹션별로 정보를 입력하고 수정하세요</p>
                        </div>

                        {editableFields.length > 0 ? (
                            <div className="space-y-6">
                                {renderEditableFields()}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-8">
                                <div className="text-center">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">편집 가능한 콘텐츠를 찾을 수 없습니다.</p>
                                    <p className="text-sm text-gray-400 mt-1">HTML 데이터를 확인해주세요.</p>
                                </div>
                            </div>
                        )}

                        {/* 누락된 정보 알림 */}
                        {missingInfo.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <InformationCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-amber-800 mb-2">완성도를 높이기 위한 제안</h4>
                                        <ul className="text-sm text-amber-700 space-y-1">
                                            {missingInfo.slice(0, 3).map((info, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <span className="mr-2">•</span>
                                                    <span>{info.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                    className="absolute right-0 top-16 bg-white rounded-lg border border-gray-200 shadow-lg z-10 p-2 min-w-48"
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

            {/* 추천 사항 패널 */}
            {showRecommendations && (
                <ContentRecommendationPanel
                    sectionType="about"
                    sectionTitle="포트폴리오 추천사항"
                    onApplyRecommendation={(recommendation: ContentRecommendation) => {
                        console.log(`추천 적용:`, recommendation);
                        setShowRecommendations(false);
                    }}
                    isVisible={showRecommendations}
                />
            )}
        </div>
    );
};

export default EnhancedPortfolioEditor;