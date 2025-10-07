import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircleIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    ShareIcon,
    StarIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { GenerationResult } from "../services/oneClickGenerator";
import { BoostResult } from "../services/interactiveBooster";
import { FeedbackResult } from "../services/userFeedbackService";
import { portfolioTemplates } from "../templates/portfolioTemplates";

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
    const [showPreview, setShowPreview] = useState(false);
    const [userRating, setUserRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
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
            // 프로젝트를 4개씩 분할
            const projectChunks: any[][] = [];
            for (let i = 0; i < projects.length; i += 4) {
                projectChunks.push(projects.slice(i, i + 4));
            }

            // 첫 번째 프로젝트 페이지
            if (projectChunks.length > 0) {
                pages.push({
                    type: 'projects',
                    data: { projects: projectChunks[0] }
                });
            }

            // 나머지 프로젝트 + 커리어
            let remainingProjects = projectChunks.slice(1).flat();
            let remainingExperience = [...experience];

            while (remainingProjects.length > 0 || remainingExperience.length > 0) {
                const pageItems: any = { projects: [], experience: [] };
                let itemCount = 0;

                // 최대 4개까지 추가
                while (itemCount < 4 && remainingProjects.length > 0) {
                    pageItems.projects.push(remainingProjects.shift());
                    itemCount++;
                }

                while (itemCount < 4 && remainingExperience.length > 0) {
                    pageItems.experience.push(remainingExperience.shift());
                    itemCount++;
                }

                if (pageItems.projects.length > 0 || pageItems.experience.length > 0) {
                    pages.push({
                        type: 'mixed',
                        data: pageItems
                    });
                }
            }
        }

        // 마지막 페이지: 스킬셋 + 수상내역
        pages.push({
            type: 'skills_awards',
            data: {
                skills: skills,
                awards: awards,
            }
        });

        return pages;
    };

    // 페이지별 HTML 생성
    const generatePageHTML = (page: any, templateData: any, template: any) => {
        const { type, data } = page;
        const colors = template.designSystem.colors;

        if (type === 'profile') {
            return `
                <div class="page-content">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="font-size: 36px; margin-bottom: 10px; color: ${colors.primary};">${data.name || ''}</h1>
                        <p style="font-size: 20px; color: ${colors.secondary}; margin-bottom: 20px;">${data.title || ''}</p>
                        ${data.contact ? `
                            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; font-size: 14px; color: ${colors.text};">
                                ${data.contact.email ? `<span>📧 ${data.contact.email}</span>` : ''}
                                ${data.contact.phone ? `<span>📱 ${data.contact.phone}</span>` : ''}
                                ${data.contact.github ? `<span>💻 ${data.contact.github}</span>` : ''}
                                ${data.contact.linkedin ? `<span>🔗 ${data.contact.linkedin}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div style="border-top: 2px solid ${colors.border}; padding-top: 30px;">
                        <h2 style="font-size: 24px; margin-bottom: 15px; color: ${colors.primary};">자기소개</h2>
                        <p style="line-height: 1.8; color: ${colors.text};">${data.about || ''}</p>
                    </div>
                </div>
            `;
        }

        if (type === 'combined') {
            return `
                <div class="page-content">
                    ${data.projects.length > 0 ? `
                        <div style="margin-bottom: 40px;">
                            <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">프로젝트</h2>
                            ${data.projects.map((proj: any) => `
                                <div style="margin-bottom: 25px; padding: 15px; border-left: 3px solid ${colors.accent}; background: ${colors.background};">
                                    <h3 style="font-size: 18px; margin-bottom: 8px; color: ${colors.primary};">${proj.name || ''}</h3>
                                    <p style="color: ${colors.text}; margin-bottom: 10px;">${proj.description || ''}</p>
                                    ${proj.tech && proj.tech.length > 0 ? `
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                            ${proj.tech.map((t: string) => `<span style="background: ${colors.accent}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">${t}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${data.experience.length > 0 ? `
                        <div>
                            <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">경력</h2>
                            ${data.experience.map((exp: any) => `
                                <div style="margin-bottom: 25px; padding: 15px; border-left: 3px solid ${colors.accent}; background: ${colors.background};">
                                    <h3 style="font-size: 18px; margin-bottom: 5px; color: ${colors.primary};">${exp.position || ''}</h3>
                                    <p style="color: ${colors.secondary}; margin-bottom: 10px;">${exp.company || ''} | ${exp.duration || ''}</p>
                                    <p style="color: ${colors.text};">${exp.description || ''}</p>
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
                    <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">프로젝트</h2>
                    ${data.projects.map((proj: any) => `
                        <div style="margin-bottom: 25px; padding: 15px; border-left: 3px solid ${colors.accent}; background: ${colors.background};">
                            <h3 style="font-size: 18px; margin-bottom: 8px; color: ${colors.primary};">${proj.name || ''}</h3>
                            <p style="color: ${colors.text}; margin-bottom: 10px;">${proj.description || ''}</p>
                            ${proj.tech && proj.tech.length > 0 ? `
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${proj.tech.map((t: string) => `<span style="background: ${colors.accent}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">${t}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (type === 'mixed') {
            return `
                <div class="page-content">
                    ${data.projects.length > 0 ? `
                        <div style="margin-bottom: 40px;">
                            <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">프로젝트 (계속)</h2>
                            ${data.projects.map((proj: any) => `
                                <div style="margin-bottom: 25px; padding: 15px; border-left: 3px solid ${colors.accent}; background: ${colors.background};">
                                    <h3 style="font-size: 18px; margin-bottom: 8px; color: ${colors.primary};">${proj.name || ''}</h3>
                                    <p style="color: ${colors.text}; margin-bottom: 10px;">${proj.description || ''}</p>
                                    ${proj.tech && proj.tech.length > 0 ? `
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                            ${proj.tech.map((t: string) => `<span style="background: ${colors.accent}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">${t}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${data.experience.length > 0 ? `
                        <div>
                            <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">경력${data.projects.length > 0 ? ' (계속)' : ''}</h2>
                            ${data.experience.map((exp: any) => `
                                <div style="margin-bottom: 25px; padding: 15px; border-left: 3px solid ${colors.accent}; background: ${colors.background};">
                                    <h3 style="font-size: 18px; margin-bottom: 5px; color: ${colors.primary};">${exp.position || ''}</h3>
                                    <p style="color: ${colors.secondary}; margin-bottom: 10px;">${exp.company || ''} | ${exp.duration || ''}</p>
                                    <p style="color: ${colors.text};">${exp.description || ''}</p>
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
                        <div style="margin-bottom: 40px;">
                            <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">스킬</h2>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                                ${data.skills.map((skillCat: any) => `
                                    <div style="padding: 15px; background: ${colors.background}; border-radius: 8px;">
                                        <h3 style="font-size: 16px; margin-bottom: 10px; color: ${colors.primary};">${skillCat.category || ''}</h3>
                                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                            ${(skillCat.skills || []).map((skill: string) => `
                                                <span style="background: ${colors.accent}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 11px;">${skill}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${data.awards && data.awards.length > 0 ? `
                        <div>
                            <h2 style="font-size: 24px; margin-bottom: 20px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 10px;">수상 내역</h2>
                            ${data.awards.map((award: any) => `
                                <div style="margin-bottom: 20px; padding: 15px; background: ${colors.background}; border-left: 3px solid ${colors.accent};">
                                    <h3 style="font-size: 18px; margin-bottom: 5px; color: ${colors.primary};">${award.title || ''}</h3>
                                    <p style="color: ${colors.secondary};">${award.organization || ''} | ${award.year || ''}</p>
                                    ${award.description ? `<p style="color: ${colors.text}; margin-top: 8px;">${award.description}</p>` : ''}
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

        // 연락처 추출 (.social-links 안의 링크들)
        const socialLinks = doc.querySelectorAll('.social-links a[href], .social-link[href]');
        socialLinks.forEach(el => {
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

    // 브라우저 인쇄 기능을 사용한 PDF 저장 (페이징 적용)
    const handlePrintToPDF = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
            return;
        }

        try {
            // 미리보기와 동일한 HTML 생성 로직 사용
            const htmlContent = generateTemplatedHTML();

            console.log("=== PDF 생성 디버깅 ===");
            console.log("HTML 길이:", htmlContent.length);
            console.log("HTML 샘플 (처음 500자):", htmlContent.substring(0, 500));

            // HTML에서 데이터 추출
            let portfolioData = extractPortfolioDataFromHTML(htmlContent);

            console.log("추출된 데이터:", portfolioData);

            const template = portfolioTemplates[selectedTemplate];
            if (!template) {
                alert("템플릿을 찾을 수 없습니다.");
                return;
            }

            // 데이터 추출 실패 시 샘플 데이터 사용
            if (!portfolioData || !portfolioData.name) {
                console.warn("⚠️ 데이터 추출 실패, 템플릿 샘플 데이터 사용");
                portfolioData = template.sampleData;
            }

            console.log("최종 사용될 데이터:", portfolioData);

            const colors = template.designSystem.colors;

            // 페이지 분할
            const pages = splitDataIntoPages(portfolioData);
            console.log("페이지 분할 결과:", pages.length, "페이지");

            // 전체 HTML 생성
            const pagesHTML = pages.map(page => generatePageHTML(page, portfolioData, template)).join('');

            const fullHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${portfolioData.name || 'Portfolio'} - Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 20mm;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: ${colors.text};
            background: white;
        }

        .page-content {
            page-break-after: always;
            min-height: 257mm; /* A4 height - margins */
            padding: 20px 0;
        }

        .page-content:last-child {
            page-break-after: auto;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .page-content {
                page-break-inside: avoid;
            }

            * {
                box-shadow: none !important;
                animation: none !important;
                transition: none !important;
            }
        }
    </style>
</head>
<body>
    ${pagesHTML}
</body>
</html>
            `;

            printWindow.document.write(fullHTML);
            printWindow.document.close();

            // 콘텐츠 로딩 대기 후 인쇄 다이얼로그 표시
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
        } catch (error) {
            console.error("PDF 생성 중 오류:", error);
            alert("PDF 생성 중 오류가 발생했습니다.");
        }
    };

    // 별점 평가 핸들러
    const handleRating = (rating: number) => {
        setUserRating(rating);
        setRatingSubmitted(true);

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
                alert("포트폴리오 링크가 클립보드에 복사되었습니다!");
            } catch (error) {
                console.error("클립보드 복사 실패:", error);
                alert("클립보드 복사에 실패했습니다.");
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                            </div>

                            {/* 추가 옵션 */}
                            <div className="space-y-4 mb-8">
                                <h3 className="font-semibold text-gray-700">
                                    추가 옵션
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <ShareIcon className="w-5 h-5 mr-2" />
                                        공유하기
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 <strong>PDF 다운로드</strong>: 브라우저의
                                    인쇄 기능을 사용하여 PDF로 저장합니다.
                                    빠르고 안정적이며, 디자인이 완벽하게
                                    유지됩니다.
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
            </div>
        </div>
    );
};

export default FinalResultPanel;
