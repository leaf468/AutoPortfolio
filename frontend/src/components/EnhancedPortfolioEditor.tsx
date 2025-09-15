import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PencilIcon,
    EyeIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    SparklesIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    LightBulbIcon,
    SwatchIcon
} from '@heroicons/react/24/outline';
import { PortfolioDocument, TextBlock } from '../services/autoFillService';
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

const EnhancedPortfolioEditor: React.FC<EnhancedPortfolioEditorProps> = ({
    document,
    selectedTemplate = 'james',
    onSave,
    onBack,
    onSkipToNaturalEdit,
    onTemplateChange
}) => {
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showNaturalEditPrompt, setShowNaturalEditPrompt] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [currentSection, setCurrentSection] = useState<string>('about');
    const [currentTemplate, setCurrentTemplate] = useState<TemplateType>(selectedTemplate);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // HTML을 자연어로 변환하는 강력한 함수
    const htmlToNaturalLanguage = (html: string): string => {
        if (!html || typeof html !== 'string') return html;
        
        let text = html;
        
        // HTML 엔티티 디코딩
        const entities: Record<string, string> = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&copy;': '©',
            '&reg;': '®',
            '&trade;': '™'
        };
        
        Object.entries(entities).forEach(([entity, char]) => {
            text = text.replace(new RegExp(entity, 'g'), char);
        });
        
        // 숫자 엔티티 디코딩 (&#123; 형태)
        text = text.replace(/&#(\d+);/g, (match, num) => {
            return String.fromCharCode(parseInt(num, 10));
        });
        
        // 16진수 엔티티 디코딩 (&#x7B; 형태)
        text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
        
        // 블록 레벨 태그를 줄바꿈으로 변환
        text = text.replace(/<\/(div|p|h[1-6]|section|article|header|footer|nav|main|aside|br)>/gi, '\n');
        text = text.replace(/<(div|p|h[1-6]|section|article|header|footer|nav|main|aside)[^>]*>/gi, '\n');
        text = text.replace(/<br\s*\/?>/gi, '\n');
        
        // 리스트 아이템을 적절한 형태로 변환
        text = text.replace(/<li[^>]*>/gi, '• ');
        text = text.replace(/<\/li>/gi, '\n');
        
        // 테이블 구조를 텍스트로 변환
        text = text.replace(/<\/tr>/gi, '\n');
        text = text.replace(/<td[^>]*>/gi, ' | ');
        text = text.replace(/<th[^>]*>/gi, ' | ');
        
        // 나머지 모든 HTML 태그 제거
        text = text.replace(/<[^>]*>/g, '');
        
        // 연속된 공백과 줄바꿈 정리
        text = text.replace(/\s+/g, ' '); // 연속된 공백을 하나로
        text = text.replace(/\n\s*\n/g, '\n'); // 연속된 줄바꿈을 하나로
        text = text.replace(/^\s+|\s+$/gm, ''); // 각 줄의 시작과 끝 공백 제거
        
        // 특수 패턴들을 자연어로 변환
        text = text.replace(/\[\s*\]/g, ''); // 빈 대괄호 제거
        text = text.replace(/\{\s*\}/g, ''); // 빈 중괄호 제거
        text = text.replace(/\(\s*\)/g, ''); // 빈 소괄호 제거
        
        // URL을 더 자연스럽게 변환
        text = text.replace(/https?:\/\/[^\s]+/g, (url) => {
            if (url.includes('github')) return `GitHub: ${url}`;
            if (url.includes('linkedin')) return `LinkedIn: ${url}`;
            return url;
        });
        
        return text.trim();
    };

    // 이전 버전과의 호환성을 위한 stripHtml 함수
    const stripHtml = (html: string) => htmlToNaturalLanguage(html);

    // 포트폴리오 문서에서 데이터 추출 - 스마트 콘텐츠 분류 시스템
    const extractPortfolioData = (doc: PortfolioDocument) => {
        console.log('=== extractPortfolioData START ===');
        console.log('Document structure:', doc);
        console.log('Document sections:', doc.sections);
        console.log('Sections count:', doc.sections?.length || 0);
        
        // 각 섹션의 상세 구조 확인
        if (doc.sections && doc.sections.length > 0) {
            doc.sections.forEach((section, index) => {
                console.log(`Section ${index}:`, section);
                console.log(`- section_id: ${section.section_id}`);
                console.log(`- section_title: ${section.section_title}`);
                console.log(`- blocks:`, section.blocks);
            });
        }
        
        // 모든 섹션의 블록들을 수집하고 HTML을 자연어로 변환
        const allBlocks = (doc.sections || []).flatMap(section => 
            (section.blocks || []).map((block: any) => ({
                ...block,
                originalText: block.text,
                text: htmlToNaturalLanguage(block.text),
                section_id: section.section_id
            }))
        ).filter(block => block.text && block.text.length > 0);
        
        console.log('All blocks (HTML converted to natural language):', allBlocks);
        
        // 사용된 블록들을 추적하여 중복 방지
        const usedBlocks = new Set<string>();
        
        // 스마트 콘텐츠 분류 시스템
        const classifyBlocks = () => {
            const result = {
                name: '',
                title: '',
                email: '',
                phone: '',
                github: '',
                linkedin: '',
                about: '',
                skills: [] as string[],
                experience: [] as any[],
                projects: [] as any[],
                education: [] as any[]
            };
            
            // 1단계: 명확한 식별자가 있는 블록들부터 분류
            
            // 이름 찾기 - 짧고 사람 이름 같은 패턴
            const nameBlock = allBlocks.find(block => 
                !usedBlocks.has(block.block_id) &&
                block.text.length < 30 &&
                !block.text.includes('개발자') &&
                !block.text.includes('풀스택') &&
                !block.text.includes('@') &&
                !block.text.includes('http') &&
                /^[가-힣a-zA-Z\s]{2,20}$/.test(block.text.trim()) &&
                !/(React|JavaScript|TypeScript|Python|Java|HTML|CSS|Node|Spring|SQL|AWS|GitHub)/i.test(block.text)
            );
            
            if (nameBlock) {
                result.name = nameBlock.text.trim();
                usedBlocks.add(nameBlock.block_id);
                console.log('Found name:', result.name);
            }
            
            // 직책/타이틀 찾기
            const titleBlock = allBlocks.find(block => 
                !usedBlocks.has(block.block_id) &&
                block.text.length < 100 &&
                (block.text.includes('개발자') ||
                 block.text.includes('엔지니어') ||
                 block.text.includes('풀스택') ||
                 block.text.includes('백엔드') ||
                 block.text.includes('프론트엔드') ||
                 block.text.includes('Developer') ||
                 block.text.includes('Engineer'))
            );
            
            if (titleBlock) {
                result.title = titleBlock.text.trim();
                usedBlocks.add(titleBlock.block_id);
                console.log('Found title:', result.title);
            }
            
            // 연락처 정보 추출
            const emailMatch = allBlocks.find(block => 
                !usedBlocks.has(block.block_id) && 
                /[\w.-]+@[\w.-]+\.\w+/.test(block.text)
            );
            if (emailMatch) {
                result.email = emailMatch.text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '';
                usedBlocks.add(emailMatch.block_id);
            }
            
            const phoneMatch = allBlocks.find(block => 
                !usedBlocks.has(block.block_id) && 
                /\b\d{2,3}[.-]?\d{3,4}[.-]?\d{4}\b/.test(block.text)
            );
            if (phoneMatch) {
                result.phone = phoneMatch.text.match(/\b\d{2,3}[.-]?\d{3,4}[.-]?\d{4}\b/)?.[0] || '';
                usedBlocks.add(phoneMatch.block_id);
            }
            
            const githubMatch = allBlocks.find(block => 
                !usedBlocks.has(block.block_id) && 
                /github\.com\/[^\s]+/i.test(block.text)
            );
            if (githubMatch) {
                result.github = githubMatch.text.match(/https?:\/\/github\.com\/[^\s]+/i)?.[0] || 
                               'https://github.com/' + githubMatch.text.match(/github\.com\/([^\s]+)/i)?.[1] || '';
                usedBlocks.add(githubMatch.block_id);
            }
            
            // 2단계: 스킬/기술 블록 분류
            const skillKeywords = ['React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'HTML', 'CSS', 
                                'Node.js', 'Express', 'Spring', 'Boot', 'MySQL', 'MongoDB', 'Redis', 
                                'AWS', 'Docker', 'Git', 'GitHub', 'Vue', 'Angular', 'PHP', 'C++', 'C#'];
            
            const skillBlocks = allBlocks.filter(block => 
                !usedBlocks.has(block.block_id) &&
                block.text.length < 300 &&
                skillKeywords.some(skill => 
                    block.text.toLowerCase().includes(skill.toLowerCase())
                ) &&
                // 기술 단어의 밀도가 높은 블록
                (block.text.match(new RegExp(skillKeywords.join('|'), 'gi')) || []).length >= 2
            );
            
            skillBlocks.forEach(block => {
                // 기술 스택 추출
                const skills = block.text
                    .split(/[,\n\s|•]+/)
                    .map(s => s.trim())
                    .filter(s => 
                        s.length > 1 && 
                        s.length < 30 &&
                        /^[a-zA-Z0-9.\s-]+$/.test(s) &&
                        skillKeywords.some(keyword => 
                            s.toLowerCase().includes(keyword.toLowerCase())
                        )
                    );
                    
                const combinedSkills = result.skills.concat(skills);
                result.skills = Array.from(new Set(combinedSkills));
                usedBlocks.add(block.block_id);
            });
            
            console.log('Found skills:', result.skills);
            
            // 3단계: 경력 블록 분류
            const experienceBlocks = allBlocks.filter(block => 
                !usedBlocks.has(block.block_id) &&
                (
                    /\d{4}[\s-]*(~|-)\s*\d{4}|\d{4}[\s-]*(~|-)\s*현재/.test(block.text) ||
                    /(경력|회사|개발팀|팀장|대리|과장|부장|차장|사원|인턴|수료|부스트캠프)/.test(block.text) ||
                    /\b\d+년\s*(차|경험)|\b\d+개월/.test(block.text)
                ) &&
                block.text.length > 20
            );
            
            experienceBlocks.forEach(block => {
                // 경력 정보 파싱
                const lines = block.text.split('\n').filter(l => l.trim());
                const text = block.text;
                
                let position = '';
                let company = '';
                let duration = '';
                
                // 기간 패턴 찾기
                const durationMatch = text.match(/\d{4}[\s-]*(~|-)\s*(\d{4}|현재)|\b\d+년\s*차|\b\d+개월/);
                if (durationMatch) {
                    duration = durationMatch[0];
                }
                
                // 회사명 찾기
                const companyMatch = text.match(/(\S+)\s*(회사|기업|코퍼레이션|Corporation|Inc|Ltd|부스트캠프|아카데미)/);
                if (companyMatch) {
                    company = companyMatch[0];
                }
                
                // 직책 찾기
                const positionMatch = text.match(/(개발자|엔지니어|인턴|사원|대리|과장|팀장|수료생|연구원)/);
                if (positionMatch) {
                    position = lines[0]?.includes(positionMatch[0]) ? lines[0] : positionMatch[0];
                }
                
                result.experience.push({
                    position: position || '개발자',
                    company: company || '회사명',
                    duration: duration || '기간',
                    description: text
                });
                
                usedBlocks.add(block.block_id);
            });
            
            console.log('Found experience:', result.experience);
            
            // 4단계: 프로젝트 블록 분류
            const projectBlocks = allBlocks.filter(block => 
                !usedBlocks.has(block.block_id) &&
                (
                    /(프로젝트|플랫폼|시스템|웹사이트|앱|서비스|개발|구현|제작)/.test(block.text) &&
                    block.text.length > 30
                ) ||
                // 기술 스택과 함께 설명이 있는 긴 블록
                (
                    block.text.length > 50 &&
                    skillKeywords.some(skill => block.text.toLowerCase().includes(skill.toLowerCase()))
                )
            );
            
            projectBlocks.forEach(block => {
                const lines = block.text.split('\n').filter(l => l.trim());
                const firstLine = lines[0] || block.text.substring(0, 50);
                
                let projectName = firstLine;
                if (firstLine.includes('프로젝트')) {
                    projectName = firstLine;
                } else if (firstLine.length > 50) {
                    projectName = firstLine.substring(0, 47) + '...';
                }
                
                result.projects.push({
                    name: projectName,
                    description: block.text,
                    tech: [],
                    role: '개발자'
                });
                
                usedBlocks.add(block.block_id);
            });
            
            console.log('Found projects:', result.projects);
            
            // 5단계: 자기소개 블록 분류 (남은 긴 텍스트)
            const aboutBlocks = allBlocks.filter(block => 
                !usedBlocks.has(block.block_id) &&
                block.text.length > 50 &&
                (
                    /(안녕하세요|소개|저는|입니다|합니다|관심|경험|학습|성장|목표|꿈|비전)/.test(block.text) ||
                    (block.text.length > 100 && 
                     !/(React|JavaScript|TypeScript|Python|Java|HTML|CSS|프로젝트|회사|경력)/.test(block.text))
                )
            );
            
            if (aboutBlocks.length > 0) {
                result.about = aboutBlocks.map(block => block.text).join('\n\n');
                aboutBlocks.forEach(block => usedBlocks.add(block.block_id));
            }
            
            console.log('Found about:', result.about);
            
            // 기본값 설정
            if (!result.name) result.name = '김개발';
            if (!result.title) result.title = '백엔드 개발자';
            if (!result.email) result.email = 'dev.kim@example.com';
            if (!result.phone) result.phone = '010-1234-5678';
            if (!result.github) result.github = 'https://github.com/dev-kim';
            if (!result.linkedin) result.linkedin = 'https://linkedin.com/in/dev-kim';
            
            if (!result.about) {
                result.about = `컴퓨터공학을 전공한 백엔드 개발자 지망생입니다. Spring Boot와 MySQL을 활용한 웹 서비스 개발 경험이 있으며, 실시간 통신과 성능 최적화에 관심이 많습니다. 네이버 부스트캠프를 수료하며 협업과 코드 품질의 중요성을 깨달았고, 지속적인 학습을 통해 성장하고 있습니다.`;
            }
            
            if (result.skills.length === 0) {
                result.skills = ['Spring Boot', 'Java', 'MySQL', 'Redis', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'WebSocket', 'GitHub Actions', 'AWS'];
            }
            
            if (result.experience.length === 0) {
                result.experience = [{
                    position: '부스트캠프 수료생',
                    company: '네이버 부스트캠프',
                    duration: '2023.07 - 2023.12',
                    description: '6개월간의 집중 부트캠프에서 JavaScript 기초부터 React, Node.js를 활용한 풀스택 개발까지 학습했습니다. 최종 프로젝트에서 우수상을 수상했습니다.'
                }];
            }
            
            if (result.projects.length === 0) {
                result.projects = [
                    {
                        name: '"함께해요" - 스터디 매칭 플랫폼',
                        description: 'Spring Boot와 MySQL을 활용해 스터디 그룹 매칭 서비스를 개발했습니다. REST API 설계부터 배포까지 전체 백엔드를 담당했으며, WebSocket으로 실시간 채팅 기능을 구현하고 Redis 캐싱으로 응답 속도를 40% 개선했습니다.',
                        tech: ['Spring Boot', 'MySQL', 'Redis', 'WebSocket'],
                        role: '백엔드 개발자'
                    },
                    {
                        name: '날씨 기반 옷차림 추천 앱',
                        description: '기상청 API와 연동하여 현재 날씨와 체감온도를 분석하고 적절한 옷차림을 추천하는 서비스입니다. Node.js와 Express로 서버를 구축하고, MongoDB로 사용자 선호도 데이터를 저장했습니다.',
                        tech: ['Node.js', 'Express', 'MongoDB', 'GitHub Actions'],
                        role: '풀스택 개발자'
                    }
                ];
            }
            
            if (result.education.length === 0) {
                result.education = [{
                    school: 'OO대학교',
                    degree: '컴퓨터공학 전공',
                    year: '2020 - 2024'
                }];
            }
            
            return result;
        };
        
        const result = classifyBlocks();
        
        console.log('=== extractPortfolioData RESULT ===');
        console.log('Final extracted data:', result);
        console.log('=== extractPortfolioData END ===');
        return result;
    };

    // 누락된 정보 감지
    const detectMissingInfo = (data: any): MissingInfo[] => {
        const missing: MissingInfo[] = [];

        if (!data.name || data.name.includes('홍길동') || data.name.includes('포트폴리오')) {
            missing.push({
                section: 'header',
                field: 'name',
                description: '실제 이름을 입력해주세요',
                placeholder: '홍길동'
            });
        }

        if (!data.email) {
            missing.push({
                section: 'contact',
                field: 'email',
                description: '이메일 주소를 추가해주세요',
                placeholder: 'example@email.com'
            });
        }

        if (!data.phone) {
            missing.push({
                section: 'contact',
                field: 'phone',
                description: '전화번호를 추가해주세요',
                placeholder: '010-1234-5678'
            });
        }

        if (!data.github) {
            missing.push({
                section: 'contact',
                field: 'github',
                description: 'GitHub 주소를 추가해주세요',
                placeholder: 'https://github.com/username'
            });
        }

        if (data.experience.length === 0) {
            missing.push({
                section: 'experience',
                field: 'experience',
                description: '경력 사항을 추가해주세요',
                placeholder: '개발자 | 회사명 | 2022-2024'
            });
        }

        if (data.projects.length === 0) {
            missing.push({
                section: 'projects',
                field: 'projects',
                description: '프로젝트를 추가해주세요',
                placeholder: '프로젝트명과 설명'
            });
        }

        return missing;
    };

    // 포트폴리오 데이터 초기화 및 누락된 정보 감지
    useEffect(() => {
        if (document) {
            console.log('EnhancedPortfolioEditor - Received document:', document);
            const data = extractPortfolioData(document);
            console.log('EnhancedPortfolioEditor - Extracted data:', data);
            setPortfolioData(data);
            setMissingInfo(detectMissingInfo(data));
        }
    }, [document, extractPortfolioData, detectMissingInfo]);

    // 템플릿 변경 핸들러
    const handleTemplateChange = (templateId: TemplateType) => {
        setCurrentTemplate(templateId);
        setShowTemplateSelector(false);
        if (onTemplateChange) {
            onTemplateChange(templateId);
        }
    };

    // 값을 자연어 형태로 표시 - 강화된 HTML 처리
    const formatDisplayValue = (field: string, value: any) => {
        switch (field) {
            case 'name':
            case 'title':
                // 강력한 HTML-to-자연어 변환
                const cleanValue = htmlToNaturalLanguage(value);
                return cleanValue || (field === 'name' ? '이름을 입력해주세요' : '직책을 입력해주세요');
            
            case 'skills':
                if (Array.isArray(value) && value.length > 0) {
                    // 스킬 배열에서 HTML을 자연어로 변환
                    const cleanSkills = value.map(skill => htmlToNaturalLanguage(skill))
                        .filter(skill => skill && skill.length > 0);
                    return cleanSkills.join(', ');
                }
                return '기술 스택을 입력해주세요';
            
            case 'experience':
                if (Array.isArray(value) && value.length > 0) {
                    return value.map(exp => 
                        `${htmlToNaturalLanguage(exp.position)} · ${htmlToNaturalLanguage(exp.company)} (${htmlToNaturalLanguage(exp.duration)})`
                    ).join('\n');
                }
                return '경력 사항을 입력해주세요';
            
            case 'projects':
                if (Array.isArray(value) && value.length > 0) {
                    return value.map(proj => 
                        `${htmlToNaturalLanguage(proj.name)}\n${htmlToNaturalLanguage(proj.description)}`
                    ).join('\n\n');
                }
                return '프로젝트 경험을 입력해주세요';
            
            case 'education':
                if (Array.isArray(value) && value.length > 0) {
                    return value.map(edu => 
                        `${htmlToNaturalLanguage(edu.school)} · ${htmlToNaturalLanguage(edu.degree)} (${htmlToNaturalLanguage(edu.year)})`
                    ).join('\n');
                }
                return '학력 정보를 입력해주세요';
            
            case 'about':
                const cleanAbout = htmlToNaturalLanguage(value);
                return cleanAbout || '자기소개를 작성해주세요';
                
            default:
                const cleanDefault = htmlToNaturalLanguage(value);
                return cleanDefault || `${field}을(를) 입력해주세요`;
        }
    };

    // 필드 편집 시작
    const startEditing = (field: string, currentValue: any) => {
        setEditingField(field);
        // 편집을 위해 자연어 형태의 값으로 변환
        setEditValue(formatDisplayValue(field, currentValue));
    };

    // 자연어 입력을 구조화된 데이터로 파싱
    const parseNaturalLanguage = (field: string, value: string) => {
        console.log(`Parsing ${field}:`, value);
        
        switch (field) {
            case 'skills':
                // 쉼표, 줄바꿈, 공백으로 분리
                const skills = value.split(/[,\n\s]+/).map(skill => skill.trim()).filter(skill => skill.length > 0);
                console.log('Parsed skills:', skills);
                return skills;
                
            case 'experience':
                // 자연어 경력 정보를 구조화
                const lines = value.split('\n').filter(line => line.trim());
                const experiences = lines.map(line => {
                    // "포지션 · 회사 (기간)" 패턴 파싱
                    const match = line.match(/(.+?)\s*·\s*(.+?)\s*\((.+?)\)/);
                    if (match) {
                        return {
                            position: match[1].trim(),
                            company: match[2].trim(),  
                            duration: match[3].trim(),
                            description: line
                        };
                    }
                    // 더 유연한 파싱 - 첫 줄은 직책, 나머지는 설명
                    const words = line.split(' ');
                    return {
                        position: words.slice(0, 2).join(' ') || '개발자',
                        company: '회사명',
                        duration: '기간',
                        description: line
                    };
                });
                console.log('Parsed experience:', experiences);
                return experiences;
                
            case 'projects':
                // 프로젝트 정보를 더 유연하게 파싱
                let projects = [];
                if (value.includes('\n\n')) {
                    // 이중 줄바꿈으로 구분된 경우
                    const projectSections = value.split('\n\n').filter(section => section.trim());
                    projects = projectSections.map(section => {
                        const lines = section.split('\n').filter(l => l.trim());
                        return {
                            name: lines[0] || '프로젝트',
                            description: lines.slice(1).join(' ') || section,
                            tech: [],
                            role: '개발자'
                        };
                    });
                } else {
                    // 단순한 텍스트인 경우 하나의 프로젝트로 처리
                    const lines = value.split('\n').filter(l => l.trim());
                    if (lines.length > 0) {
                        projects = [{
                            name: lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : ''),
                            description: value,
                            tech: [],
                            role: '개발자'
                        }];
                    }
                }
                console.log('Parsed projects:', projects);
                return projects;
                
            case 'education':
                // 학력 정보 파싱
                const eduLines = value.split('\n').filter(line => line.trim());
                const education = eduLines.map(line => {
                    const match = line.match(/(.+?)\s*·\s*(.+?)\s*\((.+?)\)/);
                    if (match) {
                        return {
                            school: match[1].trim(),
                            degree: match[2].trim(),
                            year: match[3].trim()
                        };
                    }
                    return {
                        school: line.split(' ')[0] || line,
                        degree: '전공',
                        year: '기간'
                    };
                });
                console.log('Parsed education:', education);
                return education;
                
            default:
                return value;
        }
    };

    // 편집 저장
    const saveEdit = () => {
        if (!editingField) return;

        const updatedData = { ...portfolioData };
        const parsedValue = parseNaturalLanguage(editingField, editValue);
        
        // 파싱된 값을 저장
        updatedData[editingField] = parsedValue;

        setPortfolioData(updatedData);
        setMissingInfo(detectMissingInfo(updatedData));
        setEditingField(null);
        setEditValue('');
    };

    // TextBlock 생성 헬퍼 함수
    const createTextBlock = (text: string, sectionId: string): TextBlock => ({
        block_id: `block_${Date.now()}_${Math.random()}`,
        section_id: sectionId,
        text,
        origin: 'user_edited' as const,
        confidence: 1.0,
        created_at: new Date().toISOString(),
        created_by: 'user',
        edit_history: []
    });

    // 추천 적용 핸들러
    const handleApplyRecommendation = (recommendation: ContentRecommendation) => {
        // 현재 편집 중인 섹션에 따라 추천을 적용
        const updatedData = { ...portfolioData };
        
        switch (currentSection) {
            case 'about':
                updatedData.about = recommendation.example;
                break;
            case 'experience':
                // 경험 섹션에 추천 예시를 첫 번째 항목으로 추가
                const newExperience = {
                    position: '시니어 개발자', // 예시에서 추출하거나 기본값
                    company: '테크 회사',
                    duration: '2021-현재',
                    description: recommendation.example
                };
                if (!updatedData.experience || updatedData.experience.length === 0) {
                    updatedData.experience = [newExperience];
                } else {
                    updatedData.experience[0] = { ...updatedData.experience[0], description: recommendation.example };
                }
                break;
            case 'projects':
                // 프로젝트 섹션에 추천 예시를 첫 번째 항목으로 추가
                const newProject = {
                    name: '추천 프로젝트',
                    description: recommendation.example,
                    tech: ['React', 'TypeScript'],
                    role: '개발자'
                };
                if (!updatedData.projects || updatedData.projects.length === 0) {
                    updatedData.projects = [newProject];
                } else {
                    updatedData.projects[0] = { ...updatedData.projects[0], description: recommendation.example };
                }
                break;
            case 'skills':
                // 스킬은 추천 예시에서 기술들을 추출
                if (recommendation.example.includes(',')) {
                    updatedData.skills = recommendation.example.split(',').map(s => s.trim());
                } else {
                    updatedData.skills = [recommendation.example];
                }
                break;
            case 'education':
                // 학력은 추천 예시를 그대로 사용
                const newEducation = {
                    year: '2015-2019',
                    school: '대학교',
                    degree: recommendation.example
                };
                if (!updatedData.education || updatedData.education.length === 0) {
                    updatedData.education = [newEducation];
                } else {
                    updatedData.education[0] = { ...updatedData.education[0], degree: recommendation.example };
                }
                break;
        }
        
        setPortfolioData(updatedData);
        setMissingInfo(detectMissingInfo(updatedData));
    };

    // 섹션 선택 핸들러
    const handleSectionSelect = (section: string) => {
        setCurrentSection(section);
        setShowRecommendations(true);
    };

    // 최종 저장
    const handleSave = () => {
        // portfolioData를 PortfolioDocument 형식으로 변환
        const updatedDocument: PortfolioDocument = {
            ...document,
            sections: [
                {
                    section_id: 'header',
                    section_title: '헤더',
                    blocks: [
                        createTextBlock(portfolioData.name, 'header'),
                        createTextBlock(portfolioData.title, 'header')
                    ]
                },
                {
                    section_id: 'contact',
                    section_title: '연락처',
                    blocks: [
                        createTextBlock(`이메일: ${portfolioData.email}`, 'contact'),
                        createTextBlock(`전화: ${portfolioData.phone}`, 'contact'),
                        createTextBlock(`GitHub: ${portfolioData.github}`, 'contact')
                    ]
                },
                {
                    section_id: 'about',
                    section_title: '소개',
                    blocks: [createTextBlock(portfolioData.about, 'about')]
                },
                {
                    section_id: 'skills',
                    section_title: '기술',
                    blocks: portfolioData.skills.map((skill: string) => createTextBlock(skill, 'skills'))
                },
                {
                    section_id: 'experience',
                    section_title: '경험',
                    blocks: portfolioData.experience.map((exp: any) => 
                        createTextBlock(`${exp.position}\n${exp.company}\n${exp.duration}\n${exp.description}`, 'experience')
                    )
                },
                {
                    section_id: 'projects',
                    section_title: '프로젝트',
                    blocks: portfolioData.projects.map((project: any) => 
                        createTextBlock(`${project.name}\n${project.description}`, 'projects')
                    )
                },
                {
                    section_id: 'education',
                    section_title: '교육',
                    blocks: portfolioData.education.map((edu: any) => 
                        createTextBlock(`${edu.school}\n${edu.degree}\n${edu.year}`, 'education')
                    )
                }
            ]
        };

        onSave(updatedDocument);
    };

    const isMissingField = (field: string) => {
        return missingInfo.some(info => `${info.section}.${info.field}` === field || info.field === field);
    };

    if (!portfolioData) {
        return <div className="flex justify-center items-center h-64">로딩 중...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <button
                                onClick={onBack}
                                className="mr-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">상세 편집</h2>
                                <p className="text-gray-600">포트폴리오의 세부 내용을 수정하고 누락된 정보를 추가하세요</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            {onSkipToNaturalEdit && (
                                <button
                                    onClick={() => setShowNaturalEditPrompt(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    자연어 편집으로
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                            >
                                저장하고 완료
                            </button>
                        </div>
                    </div>

                    {/* 누락 정보 안내 */}
                    {missingInfo.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-orange-900 mb-1">추가 정보가 필요합니다</h3>
                                    <p className="text-orange-800 text-sm mb-2">
                                        아래 정보들을 추가하면 더 완성도 높은 포트폴리오를 만들 수 있습니다:
                                    </p>
                                    <ul className="list-disc list-inside text-orange-700 text-sm">
                                        {missingInfo.map((info, idx) => (
                                            <li key={idx}>{info.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 왼쪽: 편집 패널 */}
                    <div className="space-y-6">
                        {/* 기본 정보 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                                    기본 정보
                                </h3>
                                <button
                                    onClick={() => handleSectionSelect('about')}
                                    className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                    <LightBulbIcon className="w-4 h-4 mr-1" />
                                    작성 팁
                                </button>
                            </div>
                            <div className="space-y-4">
                                {/* 이름 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                    {editingField === 'name' ? (
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            />
                                            <button onClick={saveEdit} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                isMissingField('name') ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                                            }`}
                                            onClick={() => startEditing('name', portfolioData.name)}
                                        >
                                            <span className={isMissingField('name') ? 'text-orange-700' : 'text-gray-900'}>
                                                {portfolioData?.name && portfolioData.name !== '이름을 입력하세요' ? portfolioData.name : '이름을 입력하세요'}
                                            </span>
                                            <PencilIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* 직책 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                                    {editingField === 'title' ? (
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            />
                                            <button onClick={saveEdit} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => startEditing('title', portfolioData.title)}
                                        >
                                            <span className="text-gray-900">{portfolioData?.title && portfolioData.title !== '직책을 입력하세요' ? portfolioData.title : '직책을 입력하세요'}</span>
                                            <PencilIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* 이메일 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                    {editingField === 'email' ? (
                                        <div className="flex space-x-2">
                                            <input
                                                type="email"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            />
                                            <button onClick={saveEdit} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                isMissingField('email') ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                                            }`}
                                            onClick={() => startEditing('email', portfolioData.email)}
                                        >
                                            <span className={isMissingField('email') ? 'text-orange-700' : 'text-gray-900'}>
                                                {portfolioData.email || '이메일을 입력하세요'}
                                            </span>
                                            <PencilIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* GitHub */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                                    {editingField === 'github' ? (
                                        <div className="flex space-x-2">
                                            <input
                                                type="url"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            />
                                            <button onClick={saveEdit} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                isMissingField('github') ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                                            }`}
                                            onClick={() => startEditing('github', portfolioData.github)}
                                        >
                                            <span className={isMissingField('github') ? 'text-orange-700' : 'text-gray-900'}>
                                                {portfolioData.github || 'GitHub 주소를 입력하세요'}
                                            </span>
                                            <PencilIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 자기소개 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">자기소개</h3>
                                <button
                                    onClick={() => handleSectionSelect('about')}
                                    className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                    <LightBulbIcon className="w-4 h-4 mr-1" />
                                    작성 팁
                                </button>
                            </div>
                            {editingField === 'about' ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="자신을 소개하는 글을 작성하세요..."
                                    />
                                    <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        저장
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px]"
                                    onClick={() => startEditing('about', portfolioData.about)}
                                >
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {formatDisplayValue('about', portfolioData.about)}
                                    </p>
                                    <PencilIcon className="w-4 h-4 text-gray-400 float-right mt-2" />
                                </div>
                            )}
                        </div>

                        {/* 경력 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">경력</h3>
                                <button
                                    onClick={() => handleSectionSelect('experience')}
                                    className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                    <LightBulbIcon className="w-4 h-4 mr-1" />
                                    작성 팁
                                </button>
                            </div>
                            {editingField === 'experience' ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="경력을 자연어로 입력하세요.&#10;예시: 백엔드 개발자 · 네이버 (2022-2024)&#10;Spring Boot와 MySQL을 활용한 웹 서비스 개발"
                                    />
                                    <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        저장
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px]"
                                    onClick={() => startEditing('experience', portfolioData.experience)}
                                >
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {formatDisplayValue('experience', portfolioData.experience)}
                                    </p>
                                    <PencilIcon className="w-4 h-4 text-gray-400 float-right mt-2" />
                                </div>
                            )}
                        </div>

                        {/* 프로젝트 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">프로젝트</h3>
                                <button
                                    onClick={() => handleSectionSelect('projects')}
                                    className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                    <LightBulbIcon className="w-4 h-4 mr-1" />
                                    작성 팁
                                </button>
                            </div>
                            {editingField === 'projects' ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="프로젝트를 자연어로 입력하세요.&#10;&#10;예시:&#10;함께해요 - 스터디 매칭 플랫폼&#10;Spring Boot와 MySQL을 활용해 스터디 그룹 매칭 서비스를 개발했습니다. WebSocket으로 실시간 채팅 기능을 구현했습니다."
                                    />
                                    <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        저장
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px]"
                                    onClick={() => startEditing('projects', portfolioData.projects)}
                                >
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {formatDisplayValue('projects', portfolioData.projects)}
                                    </p>
                                    <PencilIcon className="w-4 h-4 text-gray-400 float-right mt-2" />
                                </div>
                            )}
                        </div>

                        {/* 기술 스킬 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">기술 스킬</h3>
                                <button
                                    onClick={() => handleSectionSelect('skills')}
                                    className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                    <LightBulbIcon className="w-4 h-4 mr-1" />
                                    작성 팁
                                </button>
                            </div>
                            {editingField === 'skills' ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="보유 기술을 입력하세요.&#10;예시: Spring Boot, Java, MySQL, Redis, JavaScript, Node.js, Express, MongoDB, WebSocket, GitHub Actions, AWS"
                                    />
                                    <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        저장
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px]"
                                    onClick={() => startEditing('skills', portfolioData.skills)}
                                >
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {formatDisplayValue('skills', portfolioData.skills)}
                                    </p>
                                    <PencilIcon className="w-4 h-4 text-gray-400 float-right mt-2" />
                                </div>
                            )}
                        </div>

                        {/* 학력 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">학력</h3>
                                <button
                                    onClick={() => handleSectionSelect('education')}
                                    className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                    <LightBulbIcon className="w-4 h-4 mr-1" />
                                    작성 팁
                                </button>
                            </div>
                            {editingField === 'education' ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="학력을 입력하세요.&#10;예시: OO대학교 · 컴퓨터공학 전공 (2020-2024)"
                                    />
                                    <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        저장
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px]"
                                    onClick={() => startEditing('education', portfolioData.education)}
                                >
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {formatDisplayValue('education', portfolioData.education)}
                                    </p>
                                    <PencilIcon className="w-4 h-4 text-gray-400 float-right mt-2" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 미리보기 */}
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
                        
                        <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px] bg-white">
                            {portfolioTemplates[currentTemplate] ? (
                                <iframe 
                                    srcDoc={portfolioTemplates[currentTemplate].generateHTML(portfolioData)}
                                    className="w-full h-[600px] border-0"
                                    title="Portfolio Preview"
                                    style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: '750px' }}
                                />
                            ) : (
                                <div className="p-6 min-h-[400px]">
                                    <div className="space-y-6">
                                        {/* 헤더 정보 */}
                                        <div className="text-center border-b pb-4">
                                            <h1 className="text-2xl font-bold text-gray-900">{htmlToNaturalLanguage(portfolioData?.name) || '이름'}</h1>
                                            <p className="text-lg text-gray-600 mt-1">{htmlToNaturalLanguage(portfolioData?.title) || '직책'}</p>
                                            <div className="flex justify-center gap-4 mt-2 text-sm text-gray-500">
                                                {portfolioData?.email && <span>{htmlToNaturalLanguage(portfolioData.email)}</span>}
                                                {portfolioData?.phone && <span>{htmlToNaturalLanguage(portfolioData.phone)}</span>}
                                            </div>
                                        </div>
                                        
                                        {/* 자기소개 */}
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3">소개</h2>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {htmlToNaturalLanguage(portfolioData?.about) || '자기소개를 작성해주세요'}
                                            </p>
                                        </div>
                                        
                                        {/* 기술 스킬 */}
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3">기술 스킬</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {(portfolioData?.skills || []).map((skill: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                        {htmlToNaturalLanguage(skill)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* 프로젝트 */}
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3">프로젝트</h2>
                                            <div className="space-y-4">
                                                {(portfolioData?.projects || []).map((project: any, idx: number) => (
                                                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                                                        <h3 className="font-semibold text-gray-900">{htmlToNaturalLanguage(project.name)}</h3>
                                                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{htmlToNaturalLanguage(project.description)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* 경력 */}
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3">경력</h2>
                                            <div className="space-y-4">
                                                {(portfolioData?.experience || []).map((exp: any, idx: number) => (
                                                    <div key={idx} className="border-l-4 border-green-500 pl-4">
                                                        <h3 className="font-semibold text-gray-900">{htmlToNaturalLanguage(exp.position)}</h3>
                                                        <p className="text-gray-600">{htmlToNaturalLanguage(exp.company)} • {htmlToNaturalLanguage(exp.duration)}</p>
                                                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{htmlToNaturalLanguage(exp.description)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* 교육 */}
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3">교육</h2>
                                            <div className="space-y-3">
                                                {(portfolioData?.education || []).map((edu: any, idx: number) => (
                                                    <div key={idx}>
                                                        <h3 className="font-semibold text-gray-900">{htmlToNaturalLanguage(edu.school)}</h3>
                                                        <p className="text-gray-600">{htmlToNaturalLanguage(edu.degree)} • {htmlToNaturalLanguage(edu.year)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 콘텐츠 추천 패널 */}
                <AnimatePresence>
                    {showRecommendations && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowRecommendations(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">콘텐츠 작성 가이드</h2>
                                    <button
                                        onClick={() => setShowRecommendations(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                                    <ContentRecommendationPanel
                                        sectionType={currentSection}
                                        sectionTitle={
                                            currentSection === 'about' ? '자기소개' :
                                            currentSection === 'experience' ? '경력' :
                                            currentSection === 'projects' ? '프로젝트' :
                                            currentSection === 'skills' ? '기술' :
                                            currentSection === 'education' ? '학력' : '섹션'
                                        }
                                        onApplyRecommendation={(rec) => {
                                            handleApplyRecommendation(rec);
                                            setShowRecommendations(false);
                                        }}
                                        isVisible={true}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 자연어 편집 프롬프트 모달 */}
                <AnimatePresence>
                    {showNaturalEditPrompt && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowNaturalEditPrompt(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl p-6 max-w-md w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center mb-4">
                                    <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
                                    <h3 className="text-lg font-bold text-gray-900">자연어 편집으로 전환</h3>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    AI와 대화하면서 포트폴리오를 더 자연스럽게 개선할 수 있습니다. 
                                    현재까지의 편집 내용이 저장됩니다.
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            handleSave();
                                            onSkipToNaturalEdit?.();
                                        }}
                                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        자연어 편집으로
                                    </button>
                                    <button
                                        onClick={() => setShowNaturalEditPrompt(false)}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        계속 편집
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EnhancedPortfolioEditor;