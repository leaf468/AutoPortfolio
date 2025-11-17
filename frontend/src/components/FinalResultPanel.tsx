import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    CheckCircleIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    ShareIcon,
    StarIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    ClipboardDocumentIcon,
    CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { GenerationResult } from "../services/oneClickGenerator";
import { BoostResult } from "../services/interactiveBooster";
import { FeedbackResult } from "../services/userFeedbackService";
import { portfolioTemplates } from "../templates/portfolioTemplates";
import { htmlToMarkdownConverter } from "../services/htmlToMarkdownConverter";
import { pdfGenerator } from "../services/pdfGenerator";
import pptxGenerationService from "../services/pptxGenerationService";
import { trackRating, trackPDFDownload, trackButtonClick } from "../utils/analytics";
import { CustomAlert } from "./CustomAlert";
import { useAlert } from "../hooks/useAlert";
import { PortfolioData } from "../types/portfolio";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { pptTemplates, PPTTemplate, PPTTemplateId } from "../types/pptTemplate";
import SubscribeModal from "./SubscribeModal";

type TemplateType = "minimal" | "clean" | "colorful" | "elegant";

interface FinalResultPanelProps {
    finalResult: GenerationResult;
    boostResult?: BoostResult;
    feedbackResult?: FeedbackResult;
    selectedTemplate?: TemplateType;
    onReset: () => void;
}

const FinalResultPanel: React.FC<FinalResultPanelProps> = ({
    finalResult,
    boostResult,
    feedbackResult,
    selectedTemplate = "minimal",
    onReset,
}) => {
    const navigate = useNavigate();
    const { user, subscriptionInfo } = useAuth();
    const { alertState, hideAlert, success, error: showError, warning, confirm } = useAlert();
    const [showPreview, setShowPreview] = useState(false);
    const [userRating, setUserRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string>('');
    const [isPPTGenerating, setIsPPTGenerating] = useState(false);
    const [showPPTTemplateModal, setShowPPTTemplateModal] = useState(false);
    const [selectedPPTTemplate, setSelectedPPTTemplate] = useState<PPTTemplateId>('corporate');
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const portfolioRef = useRef<HTMLDivElement>(null);

    // 기존 평가 불러오기
    useEffect(() => {
        try {
            const savedRating = localStorage.getItem(
                `portfolio_rating_${finalResult.id}`
            );
            if (savedRating) {
                const ratingData = JSON.parse(savedRating);
                setUserRating(ratingData.rating);
                setRatingSubmitted(true);
            }
        } catch (error) {
            console.error("기존 평가 불러오기 실패:", error);
        }
    }, [finalResult.id]);

    // 선택한 템플릿을 사용해서 완전한 HTML 생성 (CSS 포함)
    const generateTemplatedHTML = () => {
        try {
            // finalResult.content가 PortfolioDocument JSON이라면 파싱해서 사용
            let portfolioData;

            try {
                portfolioData = JSON.parse(finalResult.content);
                console.log("파싱된 포트폴리오 데이터:", portfolioData);

                // 편집된 HTML을 우선적으로 사용 (EnhancedPortfolioEditor에서 저장한 HTML)
                const editedHTML =
                    portfolioData.sections?.[0]?.blocks?.[0]?.text;
                if (editedHTML) {
                    // 편집된 HTML이 있으면 그대로 사용
                    console.log("편집된 HTML 사용");
                    return editedHTML;
                }
            } catch (parseError) {
                console.error("JSON 파싱 실패:", parseError);
            }

            // fallback: 기본 템플릿으로 생성
            const template = portfolioTemplates[selectedTemplate];
            if (template && template.generateHTML) {
                const defaultData = template.sampleData;
                console.log("기본 데이터로 템플릿 생성");
                return template.generateHTML(defaultData);
            }

            return finalResult.content;
        } catch (error) {
            console.error("템플릿 HTML 생성 실패:", error);
            return finalResult.content;
        }
    };

    // 데이터를 페이지별로 분할하는 함수
    const splitDataIntoPages = (data: any) => {
        const pages: any[] = [];

        const projects = data.projects || [];
        const experience = data.experience || [];
        const skills = data.skills || data.skillCategories || [];
        const awards = data.awards || [];

        // 1페이지: 프로필 + 자기소개
        pages.push({
            type: 'profile',
            data: {
                name: data.name,
                title: data.title,
                contact: data.contact,
                about: data.about,
            }
        });

        // 2페이지 로직: 프로젝트≤2 && 커리어≤2 → 합침
        if (projects.length <= 2 && experience.length <= 2) {
            pages.push({
                type: 'combined',
                data: {
                    projects: projects,
                    experience: experience,
                }
            });
        } else {
            // 프로젝트가 많으면 별도 페이지로
            if (projects.length > 0) {
                // 프로젝트를 2개씩 분할 (한 페이지에 2개씩만)
                for (let i = 0; i < projects.length; i += 2) {
                    const chunk = projects.slice(i, i + 2);
                    pages.push({
                        type: 'projects',
                        data: { projects: chunk }
                    });
                }
            }

            // 경력을 별도 페이지로 (2개씩)
            if (experience.length > 0) {
                for (let i = 0; i < experience.length; i += 2) {
                    const chunk = experience.slice(i, i + 2);
                    pages.push({
                        type: 'experience',
                        data: { experience: chunk }
                    });
                }
            }
        }

        // 마지막 페이지: 스킬셋 + 수상내역
        if (skills.length > 0 || awards.length > 0) {
            pages.push({
                type: 'skills_awards',
                data: {
                    skills: skills,
                    awards: awards,
                }
            });
        }

        return pages;
    };

    // 페이지별 HTML 생성
    const generatePageHTML = (page: any, templateData: any, template: any) => {
        const { type, data } = page;
        const colors = template.designSystem.colors;

        if (type === 'profile') {
            // 연락처 정보 배열 생성
            const contactItems = [];
            if (data.contact?.email) contactItems.push(`📧 ${data.contact.email}`);
            if (data.contact?.phone) contactItems.push(`📱 ${data.contact.phone}`);
            if (data.contact?.github) contactItems.push(`💻 GitHub`);
            if (data.contact?.linkedin) contactItems.push(`🔗 LinkedIn`);

            return `
                <div class="page-content">
                    <div style="text-align: center; margin-bottom: 50px; padding: 30px 0;">
                        <h1 style="font-size: 42px; font-weight: 700; margin-bottom: 12px; color: ${colors.primary};">${data.name || ''}</h1>
                        <p style="font-size: 22px; color: ${colors.secondary}; margin-bottom: 25px; font-weight: 500;">${data.title || ''}</p>
                        ${contactItems.length > 0 ? `
                            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 15px; color: ${colors.text}; margin-top: 20px;">
                                ${contactItems.map(item => `<span style="padding: 8px 16px; background: ${colors.background}; border-radius: 20px; border: 1px solid ${colors.border};">${item}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div style="border-top: 3px solid ${colors.primary}; padding-top: 35px;">
                        <h2 style="font-size: 28px; margin-bottom: 20px; color: ${colors.primary}; font-weight: 600;">자기소개</h2>
                        <p style="line-height: 2; color: ${colors.text}; font-size: 16px; text-align: justify; white-space: pre-wrap; word-break: keep-all;">${data.about || ''}</p>
                    </div>
                </div>
            `;
        }

        if (type === 'combined') {
            return `
                <div class="page-content">
                    ${data.projects.length > 0 ? `
                        <div style="margin-bottom: 50px;">
                            <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">프로젝트</h2>
                            ${data.projects.map((proj: any) => `
                                <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid ${colors.accent}; background: ${colors.background}; border-radius: 0 8px 8px 0;">
                                    <h3 style="font-size: 20px; margin-bottom: 12px; color: ${colors.primary}; font-weight: 600;">${proj.name || ''}</h3>
                                    <p style="color: ${colors.text}; margin-bottom: 12px; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${proj.description || ''}</p>
                                    ${proj.tech && proj.tech.length > 0 ? `
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                                            ${proj.tech.map((t: string) => `<span style="background: ${colors.accent}; color: white; padding: 6px 12px; border-radius: 14px; font-size: 13px; font-weight: 500;">${t}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${data.experience.length > 0 ? `
                        <div>
                            <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">경력</h2>
                            ${data.experience.map((exp: any) => `
                                <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid ${colors.accent}; background: ${colors.background}; border-radius: 0 8px 8px 0;">
                                    <h3 style="font-size: 20px; margin-bottom: 8px; color: ${colors.primary}; font-weight: 600;">${exp.position || ''}</h3>
                                    <p style="color: ${colors.secondary}; margin-bottom: 12px; font-size: 14px; font-weight: 500;">${exp.company || ''} • ${exp.duration || ''}</p>
                                    <p style="color: ${colors.text}; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${exp.description || ''}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        if (type === 'projects') {
            return `
                <div class="page-content">
                    <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">프로젝트</h2>
                    ${data.projects.map((proj: any) => `
                        <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid ${colors.accent}; background: ${colors.background}; border-radius: 0 8px 8px 0;">
                            <h3 style="font-size: 20px; margin-bottom: 12px; color: ${colors.primary}; font-weight: 600;">${proj.name || ''}</h3>
                            <p style="color: ${colors.text}; margin-bottom: 12px; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${proj.description || ''}</p>
                            ${proj.tech && proj.tech.length > 0 ? `
                                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                                    ${proj.tech.map((t: string) => `<span style="background: ${colors.accent}; color: white; padding: 6px 12px; border-radius: 14px; font-size: 13px; font-weight: 500;">${t}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (type === 'experience') {
            return `
                <div class="page-content">
                    <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">경력</h2>
                    ${data.experience.map((exp: any) => `
                        <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid ${colors.accent}; background: ${colors.background}; border-radius: 0 8px 8px 0;">
                            <h3 style="font-size: 20px; margin-bottom: 8px; color: ${colors.primary}; font-weight: 600;">${exp.position || ''}</h3>
                            <p style="color: ${colors.secondary}; margin-bottom: 12px; font-size: 14px; font-weight: 500;">${exp.company || ''} • ${exp.duration || ''}</p>
                            <p style="color: ${colors.text}; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${exp.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (type === 'mixed') {
            return `
                <div class="page-content">
                    ${data.projects.length > 0 ? `
                        <div style="margin-bottom: 50px;">
                            <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">프로젝트 (계속)</h2>
                            ${data.projects.map((proj: any) => `
                                <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid ${colors.accent}; background: ${colors.background}; border-radius: 0 8px 8px 0;">
                                    <h3 style="font-size: 20px; margin-bottom: 12px; color: ${colors.primary}; font-weight: 600;">${proj.name || ''}</h3>
                                    <p style="color: ${colors.text}; margin-bottom: 12px; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${proj.description || ''}</p>
                                    ${proj.tech && proj.tech.length > 0 ? `
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                                            ${proj.tech.map((t: string) => `<span style="background: ${colors.accent}; color: white; padding: 6px 12px; border-radius: 14px; font-size: 13px; font-weight: 500;">${t}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${data.experience.length > 0 ? `
                        <div>
                            <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">경력${data.projects.length > 0 ? ' (계속)' : ''}</h2>
                            ${data.experience.map((exp: any) => `
                                <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid ${colors.accent}; background: ${colors.background}; border-radius: 0 8px 8px 0;">
                                    <h3 style="font-size: 20px; margin-bottom: 8px; color: ${colors.primary}; font-weight: 600;">${exp.position || ''}</h3>
                                    <p style="color: ${colors.secondary}; margin-bottom: 12px; font-size: 14px; font-weight: 500;">${exp.company || ''} • ${exp.duration || ''}</p>
                                    <p style="color: ${colors.text}; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${exp.description || ''}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        if (type === 'skills_awards') {
            return `
                <div class="page-content">
                    ${data.skills && data.skills.length > 0 ? `
                        <div style="margin-bottom: 50px;">
                            <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">스킬</h2>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                                ${data.skills.map((skillCat: any) => `
                                    <div style="padding: 20px; background: ${colors.background}; border-radius: 10px; border: 1px solid ${colors.border};">
                                        <h3 style="font-size: 18px; margin-bottom: 14px; color: ${colors.primary}; font-weight: 600;">${skillCat.category || ''}</h3>
                                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                            ${(skillCat.skills || []).map((skill: string) => `
                                                <span style="background: ${colors.accent}; color: white; padding: 6px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">${skill}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${data.awards && data.awards.length > 0 ? `
                        <div>
                            <h2 style="font-size: 28px; margin-bottom: 25px; color: ${colors.primary}; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; font-weight: 600;">수상 내역</h2>
                            ${data.awards.map((award: any) => `
                                <div style="margin-bottom: 25px; padding: 20px; background: ${colors.background}; border-left: 4px solid ${colors.accent}; border-radius: 0 8px 8px 0;">
                                    <h3 style="font-size: 20px; margin-bottom: 8px; color: ${colors.primary}; font-weight: 600;">${award.title || ''}</h3>
                                    <p style="color: ${colors.secondary}; font-size: 14px; font-weight: 500;">${award.organization || ''} • ${award.year || ''}</p>
                                    ${award.description ? `<p style="color: ${colors.text}; margin-top: 12px; line-height: 1.8; font-size: 15px;">${award.description}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return '';
    };

    // HTML에서 포트폴리오 데이터 추출
    const extractPortfolioDataFromHTML = (html: string) => {
        if (!html) {
            return null;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const extractedData: any = {
            name: '',
            title: '',
            contact: {
                email: '',
                phone: '',
                github: '',
                linkedin: ''
            },
            about: '',
            skills: [],
            skillCategories: [],
            projects: [],
            experience: [],
            education: [],
            awards: []
        };

        // 이름 추출 (h1 태그 - header나 .hero 안에 있음)
        const nameElement = doc.querySelector('header h1, .hero h1, h1');
        if (nameElement) {
            extractedData.name = nameElement.textContent?.trim() || '';
        }

        // 직책 추출 (.subtitle 클래스)
        const titleElement = doc.querySelector('.subtitle');
        if (titleElement) {
            extractedData.title = titleElement.textContent?.trim() || '';
        }

        // 연락처 추출 (.social-links 안의 링크들 + 일반 링크)
        const allLinks = doc.querySelectorAll('a[href]');
        allLinks.forEach(el => {
            const href = el.getAttribute('href') || '';

            if (href.startsWith('mailto:')) {
                extractedData.contact.email = href.replace('mailto:', '');
            } else if (href.startsWith('tel:')) {
                extractedData.contact.phone = href.replace('tel:', '');
            } else if (href.includes('github')) {
                extractedData.contact.github = href;
            } else if (href.includes('linkedin')) {
                extractedData.contact.linkedin = href;
            }
        });

        console.log("📧 추출된 연락처:", extractedData.contact);

        // About 추출 - section 안에서 찾기
        const sections = doc.querySelectorAll('section.section, section');
        sections.forEach(section => {
            const sectionTitle = section.querySelector('h2, .section-title');
            const titleText = sectionTitle?.textContent?.trim().toLowerCase() || '';

            if (titleText.includes('about') || titleText.includes('소개')) {
                const aboutP = section.querySelector('p');
                if (aboutP) {
                    // <br>을 줄바꿈으로 변환
                    let aboutText = aboutP.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                    // HTML 태그 제거
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = aboutText;
                    extractedData.about = tempDiv.textContent || '';
                }
            }

            // 프로젝트 추출
            if (titleText.includes('project') || titleText.includes('프로젝트')) {
                const projectCards = section.querySelectorAll('.project-card, .card');
                projectCards.forEach(card => {
                    const name = card.querySelector('h3, h4, .project-name')?.textContent?.trim() || '';
                    const descP = card.querySelector('p, .project-description');
                    let description = '';
                    if (descP) {
                        let descHTML = descP.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = descHTML;
                        description = tempDiv.textContent || '';
                    }
                    const techElements = card.querySelectorAll('.tech-pill, .tech-tag, .badge');
                    const tech = Array.from(techElements).map(el => el.textContent?.trim() || '').filter(Boolean);

                    if (name) {
                        extractedData.projects.push({
                            name,
                            description,
                            tech,
                            role: '',
                            results: []
                        });
                    }
                });
            }

            // 경력 추출
            if (titleText.includes('experience') || titleText.includes('경력')) {
                const expCards = section.querySelectorAll('.timeline-item, .experience-card, .card');
                expCards.forEach(card => {
                    const position = card.querySelector('h3')?.textContent?.trim() || '';
                    const metaText = card.querySelector('.meta, p.meta')?.textContent?.trim() || '';

                    // "회사 • 기간" 형식 파싱
                    const metaParts = metaText.split('•').map(s => s.trim());
                    const company = metaParts[0] || '';
                    const duration = metaParts[1] || '';

                    const descP = card.querySelector('p:not(.meta)');
                    let description = '';
                    if (descP) {
                        let descHTML = descP.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = descHTML;
                        description = tempDiv.textContent || '';
                    }

                    if (position) {
                        extractedData.experience.push({
                            position,
                            company,
                            duration,
                            description,
                            achievements: []
                        });
                    }
                });
            }

            // 스킬 추출
            if (titleText.includes('skill') || titleText.includes('스킬')) {
                const skillGroups = section.querySelectorAll('.skill-category');
                if (skillGroups.length > 0) {
                    skillGroups.forEach(group => {
                        const categoryH3 = group.querySelector('h3');
                        let category = categoryH3?.textContent?.trim() || '';
                        // 이모지 제거 (✨ 같은 것들)
                        category = category.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

                        const skillItems = group.querySelectorAll('.skill-list li, li');
                        const skills = Array.from(skillItems).map(li =>
                            li.textContent?.trim().replace(/^[✨💡🚀⚡️]+\s*/, '') || ''
                        ).filter(Boolean);

                        if (category && skills.length > 0) {
                            extractedData.skillCategories.push({ category, skills });
                        }
                    });
                } else {
                    // 단순 스킬 리스트
                    const skillElements = section.querySelectorAll('.skill-badge, .badge, .tech-pill');
                    const skills = Array.from(skillElements).map(el => el.textContent?.trim() || '').filter(Boolean);
                    if (skills.length > 0) {
                        extractedData.skills = skills;
                        extractedData.skillCategories = [{ category: 'Skills', skills }];
                    }
                }
            }

            // 수상 내역 추출
            if (titleText.includes('award') || titleText.includes('수상')) {
                const awardCards = section.querySelectorAll('.award-card, .card');
                awardCards.forEach(card => {
                    const title = card.querySelector('h3, h4')?.textContent?.trim() || '';
                    const metaText = card.querySelector('.meta')?.textContent?.trim() || '';
                    const metaParts = metaText.split('•').map(s => s.trim());
                    const organization = metaParts[0] || '';
                    const year = metaParts[1] || '';
                    const description = card.querySelector('p:not(.meta)')?.textContent?.trim() || '';

                    if (title) {
                        extractedData.awards.push({
                            title,
                            organization,
                            year,
                            description
                        });
                    }
                });
            }
        });

        console.log("📊 추출된 데이터 상세:", {
            name: extractedData.name,
            title: extractedData.title,
            projectsCount: extractedData.projects.length,
            experienceCount: extractedData.experience.length,
            skillCategoriesCount: extractedData.skillCategories.length
        });

        return extractedData;
    };

    // 브라우저 인쇄 기능을 사용한 PDF 저장 (미리보기 HTML 그대로 사용)
    const handlePrintToPDF = () => {
        // GA 이벤트 추적
        trackPDFDownload(finalResult.id);
        trackButtonClick('PDF 다운로드', 'FinalResultPanel');

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            warning("팝업이 차단되었습니다. 팝업을 허용해주세요.");
            return;
        }

        try {
            // 미리보기와 동일한 HTML 생성 (데이터 추출 없이 바로 사용)
            const htmlContent = generateTemplatedHTML();

            console.log("=== PDF 생성 (미리보기 HTML 사용) ===");
            console.log("HTML 길이:", htmlContent.length);

            // pdfGenerator 서비스를 사용하여 PDF 최적화 HTML 생성 (주황색 텍스트 제거 포함)
            const optimizedHTML = pdfGenerator.generatePrintOptimizedHTML(htmlContent);

            printWindow.document.write(optimizedHTML);
            printWindow.document.close();

            // 콘텐츠 로딩 대기 후 인쇄 다이얼로그 표시
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
        } catch (error) {
            console.error("PDF 생성 중 오류:", error);
            showError("PDF 생성 중 오류가 발생했습니다.");
        }
    };

    // Markdown 다운로드
    const handleDownloadMarkdown = () => {
        // GA 이벤트 추적
        trackButtonClick('Markdown 다운로드', 'FinalResultPanel');

        try {
            const htmlContent = generateTemplatedHTML();
            const markdown = htmlToMarkdownConverter.convertToMarkdown(htmlContent);
            htmlToMarkdownConverter.downloadMarkdown(markdown, `${finalResult.id}_portfolio.md`);
        } catch (error) {
            console.error("Markdown 다운로드 실패:", error);
            showError("Markdown 다운로드에 실패했습니다.");
        }
    };

    // Markdown 클립보드 복사
    const handleCopyMarkdown = async () => {
        try {
            const htmlContent = generateTemplatedHTML();
            const markdown = htmlToMarkdownConverter.convertToMarkdown(htmlContent);
            const copySuccess = await htmlToMarkdownConverter.copyToClipboard(markdown);

            if (copySuccess) {
                setCopySuccess('Markdown이 클립보드에 복사되었습니다!');
                setTimeout(() => setCopySuccess(''), 3000);
            } else {
                showError("클립보드 복사에 실패했습니다.");
            }
        } catch (error) {
            console.error("Markdown 복사 실패:", error);
            showError("Markdown 복사에 실패했습니다.");
        }
    };

    // HTML 다운로드
    const handleDownloadHTML = () => {
        // GA 이벤트 추적
        trackButtonClick('HTML 다운로드', 'FinalResultPanel');

        try {
            const htmlContent = generateTemplatedHTML();
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${finalResult.id}_portfolio.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("HTML 다운로드 실패:", error);
            showError("HTML 다운로드에 실패했습니다.");
        }
    };

    /**
     * 마이페이지 프로필 정보 가져오기
     */
    const getUserProfile = async () => {
        if (!user) {
            console.warn('⚠️ user 객체가 없습니다');
            return null;
        }

        try {
            console.log('🔍 프로필 조회 시작 - user_id:', user.user_id);

            // users 테이블에서 name 가져오기 (마이페이지에서 저장한 최신 이름)
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('name')
                .eq('user_id', user.user_id)
                .single();

            if (userError) {
                console.error('❌ users 테이블 조회 실패:', userError);
                console.log('📋 에러 상세:', {
                    code: userError.code,
                    message: userError.message,
                    details: userError.details
                });
            } else {
                console.log('✅ users 테이블에서 가져온 이름:', userData?.name);
            }

            // user_profiles 테이블에서 프로필 정보 가져오기
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.user_id)
                .maybeSingle();

            if (profileError) {
                console.error('❌ user_profiles 테이블 조회 실패:', profileError);
            } else {
                console.log('✅ user_profiles 테이블 조회 성공');
            }

            // 이름 우선순위: DB users 테이블 (마이페이지에서 저장한 이름) > AuthContext user 객체 > 기본값
            const userName = userData?.name || user.name || '사용자';
            console.log('👤 최종 사용자 이름:', userName);
            console.log('📊 이름 출처:', userData?.name ? 'DB users 테이블' : (user.name ? 'AuthContext' : '기본값'));

            const profile = {
                name: userName,
                phone: profileData?.phone || '',
                email: user.email || '',
                company: profileData?.company || '',
                position: profileData?.position || '',
                github_url: profileData?.github_url || '',
                blog_url: profileData?.blog_url || '',
            };

            console.log('📦 최종 프로필 데이터:', profile);
            return profile;
        } catch (error) {
            console.error('❌ 프로필 로드 중 예외 발생:', error);
            // 에러 발생 시에도 최소한 user 객체의 정보는 반환
            const fallbackProfile = {
                name: user.name || '사용자',
                phone: '',
                email: user.email || '',
                company: '',
                position: '',
                github_url: '',
                blog_url: '',
            };
            console.log('⚠️ fallback 프로필 사용:', fallbackProfile);
            return fallbackProfile;
        }
    };

    // PPT 템플릿 선택 모달 열기
    const handleOpenPPTTemplateModal = () => {
        trackButtonClick('PPT 다운로드', 'FinalResultPanel');

        // 프로 플랜 체크
        if (!subscriptionInfo.isPro) {
            setShowSubscribeModal(true);
            return;
        }

        setShowPPTTemplateModal(true);
    };

    // PPT 다운로드 (선택된 템플릿으로)
    const handleDownloadPPT = async (templateId: PPTTemplateId) => {
        const selectedTemplate = pptTemplates.find(t => t.id === templateId);
        if (!selectedTemplate) {
            showError('템플릿을 찾을 수 없습니다.');
            return;
        }

        // 프리미엄 템플릿 체크 (프로 플랜 사용자만)
        if (selectedTemplate.isPremium && !subscriptionInfo.isPro) {
            setShowSubscribeModal(true);
            return;
        }

        setShowPPTTemplateModal(false);
        setIsPPTGenerating(true);

        try {
            // HTML에서 포트폴리오 데이터 추출
            const htmlContent = generateTemplatedHTML();
            const extractedData = extractPortfolioDataFromHTML(htmlContent);

            if (!extractedData) {
                throw new Error('포트폴리오 데이터를 추출할 수 없습니다.');
            }

            // 마이페이지 프로필 정보 가져오기
            const userProfile = await getUserProfile();
            console.log('👤 사용자 프로필 정보:', userProfile);

            // PortfolioData 형식으로 변환 (프로필 정보를 fallback으로 사용)
            const portfolioData: PortfolioData = {
                userInfo: {
                    name: extractedData.name || userProfile?.name || '이름 없음',
                    title: extractedData.title || userProfile?.position || '직무 없음',
                    email: extractedData.contact?.email || userProfile?.email || '',
                    phone: extractedData.contact?.phone || userProfile?.phone || '',
                    github: extractedData.contact?.github || userProfile?.github_url || '',
                    website: extractedData.contact?.linkedin || userProfile?.blog_url || '',
                    summary: extractedData.about || '자기소개 없음',
                },
                experiences: extractedData.experience.map((exp: any) => ({
                    company: exp.company || '',
                    position: exp.position || '',
                    startDate: exp.duration?.split('-')[0]?.trim() || '',
                    endDate: exp.duration?.split('-')[1]?.trim(),
                    description: exp.description || '',
                    achievements: exp.achievements || [],
                    technologies: []
                })),
                projects: extractedData.projects.slice(0, 3).map((proj: any) => ({
                    name: proj.name || '',
                    description: proj.description || '',
                    technologies: proj.tech || [],
                    highlights: proj.results || [],
                    date: ''
                })),
                education: extractedData.education.map((edu: any) => ({
                    institution: edu.school || '',
                    degree: edu.degree || '',
                    startDate: '',
                    endDate: ''
                })),
                skills: extractedData.skillCategories.map((cat: any) => ({
                    category: cat.category || '',
                    items: cat.skills || []
                })),
                certifications: [],
                languages: []
            };

            console.log('🔄 포트폴리오 데이터 (프로필 fallback 적용):', portfolioData);

            // PPT 템플릿 경로
            const templatePath = selectedTemplate.templatePath;

            // PPT 생성 (프로필 정보 전달)
            const pptBlob = await pptxGenerationService.generatePPT(portfolioData, templatePath, userProfile, templateId);

            // 파일명 생성: 사용자님_직무_포트폴리오
            const userName = userProfile?.name || extractedData.name || '사용자';
            const userPosition = userProfile?.position || extractedData.title || '포트폴리오';
            const filename = `${userName}_${userPosition}_포트폴리오.pptx`;

            // 다운로드
            pptxGenerationService.downloadPPT(pptBlob, filename);

            success('PPT 파일이 생성되었습니다!');
        } catch (error) {
            console.error('PPT 생성 실패:', error);
            showError('PPT 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsPPTGenerating(false);
        }
    };

    // 별점 평가 핸들러
    const handleRating = (rating: number) => {
        setUserRating(rating);
        setRatingSubmitted(true);

        // GA 이벤트 추적
        trackRating(rating, finalResult.id);

        // 평가 데이터 저장 (로컬 스토리지 또는 서버)
        const ratingData = {
            portfolioId: finalResult.id,
            rating: rating,
            timestamp: new Date().toISOString(),
            template: selectedTemplate,
        };

        try {
            localStorage.setItem(
                `portfolio_rating_${finalResult.id}`,
                JSON.stringify(ratingData)
            );
            console.log("사용자 평가 저장됨:", ratingData);
        } catch (error) {
            console.error("평가 저장 실패:", error);
        }
    };

    const handleRatingHover = (rating: number) => {
        setHoverRating(rating);
    };

    const handleRatingLeave = () => {
        setHoverRating(0);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "내 포트폴리오",
                    text: "AI로 생성한 포트폴리오를 확인해보세요!",
                    url: window.location.href,
                });
            } catch (error) {
                console.log("공유 취소됨");
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                success("포트폴리오 링크가 클립보드에 복사되었습니다!");
            } catch (error) {
                console.error("클립보드 복사 실패:", error);
                showError("클립보드 복사에 실패했습니다.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex justify-center items-center mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-600 mr-2" />
                        <h2 className="text-3xl font-bold text-gray-900">
                            포트폴리오 완성!
                        </h2>
                    </div>
                    <p className="text-lg text-gray-600">
                        AI가 생성한 포트폴리오가 완성되었습니다. 미리보기를
                        확인하고 다운로드하세요.
                    </p>
                </motion.div>

                {/* 저장 완료 안내 배너 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8 shadow-sm"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="w-6 h-6 text-green-600 mt-1" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    마이페이지에 저장되었습니다
                                </h3>
                                <p className="text-sm text-green-800 mb-3">
                                    작성하신 포트폴리오가 자동으로 마이페이지에 저장되었습니다.
                                    언제든지 마이페이지에서 확인하고 수정할 수 있습니다.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/mypage')}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                        >
                            마이페이지로 이동
                        </button>
                    </div>
                </motion.div>

                {/* 메인 콘텐츠 그리드 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 왼쪽: 통계 카드 */}
                    <motion.div
                        className="lg:col-span-1 space-y-6"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* 통계 정보 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
                                포트폴리오 정보
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        사용된 템플릿:
                                    </span>
                                    <strong className="text-gray-900 capitalize">
                                        {selectedTemplate}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* 사용자 만족도 평가 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <StarIcon className="w-5 h-5 mr-2 text-yellow-600" />
                                만족도 평가
                            </h3>

                            {!ratingSubmitted ? (
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-4">
                                        생성된 포트폴리오에 대한 만족도를
                                        평가해주세요
                                    </p>

                                    <div className="flex justify-center space-x-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() =>
                                                    handleRating(star)
                                                }
                                                onMouseEnter={() =>
                                                    handleRatingHover(star)
                                                }
                                                onMouseLeave={handleRatingLeave}
                                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                {star <=
                                                (hoverRating || userRating) ? (
                                                    <StarIconSolid className="w-8 h-8 text-yellow-400" />
                                                ) : (
                                                    <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {hoverRating === 1 && "매우 불만족"}
                                        {hoverRating === 2 && "불만족"}
                                        {hoverRating === 3 && "보통"}
                                        {hoverRating === 4 && "만족"}
                                        {hoverRating === 5 && "매우 만족"}
                                        {hoverRating === 0 &&
                                            "별점을 클릭해주세요"}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="flex justify-center space-x-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIconSolid
                                                key={star}
                                                className={`w-6 h-6 ${
                                                    star <= userRating
                                                        ? "text-yellow-400"
                                                        : "text-gray-300"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        평가해주셔서 감사합니다!
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {userRating === 1 &&
                                            "소중한 의견 감사합니다"}
                                        {userRating === 2 &&
                                            "더 나은 서비스를 위해 노력하겠습니다"}
                                        {userRating === 3 &&
                                            "의견을 반영하여 개선하겠습니다"}
                                        {userRating === 4 &&
                                            "만족스러운 결과를 제공할 수 있어 기쁩니다"}
                                        {userRating === 5 &&
                                            "최고의 평가 감사합니다!"}
                                    </p>
                                </div>
                            )}

                            <div className="text-center mt-4">
                                <a
                                    href="https://forms.gle/BuGqR1Wauwfjbes69"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                                >
                                    자세한 리뷰 작성하기
                                </a>
                            </div>
                        </div>

                        {/* AI 개선 효과 */}
                        {(boostResult || feedbackResult) && (
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                                <h3 className="font-bold text-purple-900 mb-4 flex items-center">
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    AI 개선 효과
                                </h3>

                                {boostResult && (
                                    <div className="mb-4 p-3 bg-white bg-opacity-60 rounded-lg">
                                        <div className="text-sm font-medium text-blue-800 mb-1">
                                            대화형 보강
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                완성도:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .completeness
                                                    }
                                                    %
                                                </strong>
                                            </div>
                                            <div>
                                                구체성:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .specificity
                                                    }
                                                    %
                                                </strong>
                                            </div>
                                            <div>
                                                임팩트:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .impact
                                                    }
                                                    %
                                                </strong>
                                            </div>
                                            <div>
                                                ATS:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .atsScore
                                                    }
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {feedbackResult && (
                                    <div className="p-3 bg-white bg-opacity-60 rounded-lg">
                                        <div className="text-sm font-medium text-purple-800 mb-2">
                                            스타일 개선
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {feedbackResult.changesApplied
                                                .slice(0, 3)
                                                .map((change, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                                                    >
                                                        {change.length > 15
                                                            ? change.substring(
                                                                  0,
                                                                  15
                                                              ) + "..."
                                                            : change}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* 오른쪽: 메인 액션 */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="bg-white rounded-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">
                                포트폴리오 다운로드 & 공유
                            </h2>

                            {/* 메인 액션 버튼들 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="group flex items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <EyeIcon className="w-6 h-6 mr-2" />
                                    미리보기
                                </button>

                                <button
                                    onClick={handlePrintToPDF}
                                    className="group flex items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <DocumentArrowDownIcon className="w-6 h-6 mr-2" />
                                    PDF 다운로드
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={handleOpenPPTTemplateModal}
                                        disabled={isPPTGenerating}
                                        className="group flex items-center justify-center p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                    >
                                        <DocumentArrowDownIcon className="w-6 h-6 mr-2" />
                                        {isPPTGenerating ? 'PPT 생성 중...' : 'PPT 다운로드'}
                                    </button>
                                    {!subscriptionInfo.isPro && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                            PRO
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!subscriptionInfo.isPro && (
                                <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-sm text-purple-700 text-center">
                                        <span className="font-semibold">PPT 다운로드</span>는 프로 플랜 전용 기능입니다.
                                    </p>
                                </div>
                            )}

                            {/* 추가 옵션 */}
                            <div className="space-y-4 mb-8">
                                <h3 className="font-semibold text-gray-700">
                                    추가 옵션
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        onClick={handleDownloadMarkdown}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <DocumentTextIcon className="w-5 h-5 mr-2" />
                                        Markdown 다운로드
                                    </button>
                                    <button
                                        onClick={handleCopyMarkdown}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                                        Markdown 복사
                                    </button>
                                    <button
                                        onClick={handleDownloadHTML}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <CodeBracketIcon className="w-5 h-5 mr-2" />
                                        HTML 다운로드
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <ShareIcon className="w-5 h-5 mr-2" />
                                        공유하기
                                    </button>
                                </div>
                                {copySuccess && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                                        {copySuccess}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 <strong>다양한 형식 지원</strong>: PDF, Markdown, HTML 형식으로 포트폴리오를 다운로드할 수 있습니다.
                                </p>
                            </div>

                            {/* 하단 액션 */}
                            <div className="flex justify-center pt-6 border-t border-gray-200">
                                <button
                                    onClick={onReset}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <ArrowPathIcon className="w-5 h-5 mr-2" />새
                                    포트폴리오 만들기
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 미리보기 모달 */}
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowPreview(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        포트폴리오 미리보기
                                    </h3>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-8 bg-white overflow-auto max-h-[calc(90vh-140px)]">
                                    {/* EnhancedPortfolioEditor와 동일한 iframe 방식 사용 */}
                                    <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px] bg-white">
                                        <div
                                            ref={portfolioRef}
                                            style={{
                                                width: "794px", // A4 width in pixels at 96 DPI
                                                minHeight: "1123px", // A4 height in pixels at 96 DPI
                                                margin: "0 auto",
                                                transform: "scale(0.8)",
                                                transformOrigin: "top left",
                                                backgroundColor: "#ffffff",
                                            }}
                                        >
                                            <iframe
                                                srcDoc={generateTemplatedHTML()}
                                                className="w-full h-[600px] border-0"
                                                title="Portfolio Preview"
                                                style={{
                                                    transform: "scale(0.8)",
                                                    transformOrigin: "top left",
                                                    width: "125%",
                                                    height: "750px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 border-t flex justify-center space-x-3">
                                    <button
                                        onClick={handlePrintToPDF}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                                    >
                                        PDF 다운로드
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PPT 템플릿 선택 모달 */}
                <AnimatePresence>
                    {showPPTTemplateModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowPPTTemplateModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                                    <h3 className="text-2xl font-bold">
                                        PPT 템플릿 선택
                                    </h3>
                                    <p className="text-orange-100 mt-1">
                                        원하는 디자인을 선택하세요. 새로운 템플릿이 지속적으로 추가됩니다!
                                    </p>
                                </div>

                                <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {pptTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                className={`relative border-2 rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-lg ${
                                                    selectedPPTTemplate === template.id
                                                        ? 'border-orange-500 ring-2 ring-orange-200'
                                                        : 'border-gray-200 hover:border-orange-300'
                                                }`}
                                                onClick={() => setSelectedPPTTemplate(template.id as PPTTemplateId)}
                                            >
                                                {/* 프리미엄 뱃지 */}
                                                {template.isPremium && (
                                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                                        PRO
                                                    </div>
                                                )}

                                                {/* 썸네일 */}
                                                <div className="bg-gray-50 flex items-center justify-center min-h-[200px] overflow-hidden">
                                                    <img
                                                        src={template.thumbnailUrl}
                                                        alt={template.name}
                                                        className="w-full h-auto"
                                                        onError={(e) => {
                                                            // 이미지 로드 실패 시 기본 아이콘 표시
                                                            const target = e.currentTarget;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                const fallback = document.createElement('div');
                                                                fallback.className = 'text-center p-8';
                                                                fallback.innerHTML = `
                                                                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <p class="text-sm text-gray-500">${template.slideCount} Slides</p>
                                                                `;
                                                                parent.appendChild(fallback);
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                {/* 정보 */}
                                                <div className="p-4">
                                                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                                                        {template.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {template.description}
                                                    </p>
                                                </div>

                                                {/* 선택 표시 */}
                                                {selectedPPTTemplate === template.id && (
                                                    <div className="absolute bottom-4 right-4">
                                                        <CheckCircleIcon className="w-6 h-6 text-orange-500" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
                                    <p className="text-sm text-gray-500">
                                        선택: <strong>{pptTemplates.find(t => t.id === selectedPPTTemplate)?.name}</strong>
                                    </p>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setShowPPTTemplateModal(false)}
                                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={() => handleDownloadPPT(selectedPPTTemplate)}
                                            className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 shadow-md hover:shadow-lg transition-all"
                                        >
                                            다운로드
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Custom Alert */}
                <CustomAlert
                    isOpen={alertState.isOpen}
                    onClose={hideAlert}
                    onConfirm={alertState.onConfirm}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                    confirmText={alertState.confirmText}
                    cancelText={alertState.cancelText}
                />

                {/* Subscribe Modal */}
                <SubscribeModal
                    isOpen={showSubscribeModal}
                    onClose={() => setShowSubscribeModal(false)}
                />
            </div>
        </div>
    );
};

export default FinalResultPanel;
