/**
 * PDF Generator Service
 * Optimizes HTML for browser-based PDF generation via print dialog
 *
 * Requirements:
 * 1. Remove black boxes around tech tags
 * 2. Remove page headers/footers (date, template name, URL, page numbers)
 * 3. Prevent content from splitting across pages
 * 4. Compact layout - minimize spacing
 * 5. Fit entire sections on single pages when possible
 */

export class PDFGenerator {
    /**
     * Generate print-optimized HTML with enhanced CSS for high-quality PDF output
     */
    generatePrintOptimizedHTML(htmlContent: string): string {
        const printStyles = `
            <style>
                /* ========================================
                   PDF 최적화 스타일 - Compact & Clean
                ======================================== */

                @media print {
                    /* ========================================
                       페이지 설정
                    ======================================== */

                    @page {
                        size: A4;
                        margin: 10mm 10mm; /* 최소 여백으로 공간 최대 활용 */
                    }

                    @page :first {
                        margin-bottom: 15mm; /* 첫 페이지는 하단 여백을 더 줘서 내용이 채워질 수 있도록 */
                    }

                    /* ========================================
                       헤더/푸터 제거 (날짜, URL, 페이지 번호 등)
                    ======================================== */

                    @page {
                        margin-top: 10mm;
                        margin-bottom: 10mm;
                        /* 브라우저 기본 헤더/푸터 숨김 */
                    }

                    /* 기본 설정 */
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }

                    /* ========================================
                       검은색 박스 제거 (기술 태그 등)
                    ======================================== */

                    /* 모든 테두리 제거 또는 최소화 */
                    .tech-tag,
                    .tech-tags .tag,
                    .skill-item,
                    .skill,
                    .tag,
                    .badge,
                    [class*="tag"],
                    [class*="badge"],
                    [class*="skill"] {
                        border: none !important;
                        outline: none !important;
                        /* 배경색과 텍스트만 유지 */
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Elegant 템플릿: 스킬 태그 앞 이모지(✨) 정렬 수정 */
                    .skill-list li::before,
                    .skill-category li::before {
                        content: '' !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        vertical-align: middle !important;
                        margin-right: 6px !important;
                        line-height: 1 !important;
                        position: relative !important;
                        top: 0 !important;
                    }

                    .skill-list li,
                    .skill-category li {
                        display: flex !important;
                        align-items: center !important;
                        line-height: 1.6 !important;
                        padding: 3px 0 !important;
                    }

                    /* Elegant 템플릿의 리스트 스타일 개선 */
                    .skill-list,
                    .skill-category {
                        list-style: none !important;
                    }

                    .skill-list li span,
                    .skill-category li span {
                        display: inline-flex !important;
                        align-items: center !important;
                    }

                    /* ========================================
                       Compact 레이아웃 - 여백 최소화
                    ======================================== */

                    body {
                        font-size: 10pt !important; /* 기본 폰트 크기 줄임 */
                        line-height: 1.3 !important; /* 줄 간격 줄임 */
                    }

                    /* 제목 크기 조정 */
                    h1 {
                        font-size: 18pt !important;
                        margin: 0 0 8px 0 !important;
                        padding: 0 !important;
                    }

                    h2 {
                        font-size: 14pt !important;
                        margin: 12px 0 6px 0 !important;
                        padding: 0 !important;
                    }

                    h3 {
                        font-size: 11pt !important;
                        margin: 6px 0 4px 0 !important;
                        padding: 0 !important;
                    }

                    h4, h5, h6 {
                        font-size: 10pt !important;
                        margin: 4px 0 2px 0 !important;
                        padding: 0 !important;
                    }

                    /* 단락 여백 최소화 */
                    p {
                        margin: 0 0 6px 0 !important;
                        padding: 0 !important;
                        line-height: 1.3 !important;
                    }

                    /* 리스트 여백 최소화 */
                    ul, ol {
                        margin: 4px 0 !important;
                        padding-left: 16px !important;
                    }

                    li {
                        margin: 2px 0 !important;
                        padding: 0 !important;
                        line-height: 1.3 !important;
                    }

                    /* 섹션 여백 최소화 */
                    section {
                        margin: 0 0 12px 0 !important;
                        padding: 0 !important;
                    }

                    /* 첫 번째 섹션(보통 about)은 여백을 좀 더 둬서 첫 페이지를 적절히 채움 */
                    section:first-of-type,
                    .section:first-of-type {
                        margin-bottom: 20px !important;
                    }

                    /* 마지막 섹션 전 섹션들은 적절한 간격으로 페이지를 채움 */
                    section:not(:last-child) {
                        margin-bottom: 15px !important;
                    }

                    header {
                        margin: 0 0 10px 0 !important;
                        padding: 0 0 8px 0 !important;
                    }

                    /* ========================================
                       Colorful 템플릿: 섹션별 페이지 분할 전략
                    ======================================== */

                    /* Colorful: Hero 섹션 (기본 정보 + 자기소개) - 첫 페이지 */
                    .hero {
                        padding: 4rem 2rem !important;
                        min-height: 280px !important;
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    .hero-content {
                        padding: 3rem 0 !important;
                        margin: 2rem 0 !important;
                    }

                    .hero h1 {
                        margin-bottom: 1.5rem !important;
                        font-size: 24pt !important;
                    }

                    .hero p {
                        margin: 1rem 0 !important;
                        line-height: 1.6 !important;
                    }

                    .hero .contact-links {
                        margin-top: 1.5rem !important;
                    }

                    /* Colorful: 경험 섹션 - 새 페이지 시작 */
                    section.experience,
                    .experience-section,
                    section[class*="experience"],
                    #experience {
                        page-break-before: always !important;
                        break-before: page !important;
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    /* Colorful: 프로젝트 섹션 - 새 페이지 시작 */
                    section.projects,
                    .projects-section,
                    section[class*="project"],
                    #projects {
                        page-break-before: always !important;
                        break-before: page !important;
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    /* Colorful: Skills 섹션 - 새 페이지 시작 (연락처와 함께) */
                    section.skills,
                    .skills-section,
                    section[class*="skills"],
                    #skills {
                        page-break-before: always !important;
                        break-before: page !important;
                    }

                    /* 단, 내용이 잘릴 경우 다음 페이지로 */
                    section.experience,
                    section.projects,
                    section.skills,
                    .experience-section,
                    .projects-section,
                    .skills-section {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }

                    /* Container 여백 제거 */
                    .container,
                    [class*="container"] {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                    }

                    /* Experience/Project 항목 간격 최소화 */
                    .experience-item,
                    .project-item,
                    .education-item,
                    article {
                        margin: 0 0 10px 0 !important;
                        padding: 0 !important;
                    }

                    /* ========================================
                       Colorful 템플릿: 경험/프로젝트 소제목 한 줄 레이아웃
                    ======================================== */

                    /* 경험/프로젝트 항목의 헤더 영역을 한 줄로 구성 */
                    .experience-item header,
                    .project-item header,
                    .experience-item > div:first-child,
                    .project-item > div:first-child {
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        flex-wrap: nowrap !important;
                        gap: 8px !important;
                        margin-bottom: 8px !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* 아이콘 + 제목 그룹을 왼쪽에 배치 */
                    .experience-item header > div:first-child,
                    .project-item header > div:first-child,
                    .experience-item h3,
                    .project-item h3 {
                        display: flex !important;
                        align-items: center !important;
                        gap: 6px !important;
                        margin: 0 !important;
                        flex: 1 !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                    }

                    /* 기간을 오른쪽에 배치 */
                    .experience-item .duration,
                    .project-item .duration,
                    .experience-item .period,
                    .project-item .period,
                    .experience-item time,
                    .project-item time {
                        flex-shrink: 0 !important;
                        margin: 0 !important;
                        white-space: nowrap !important;
                    }

                    /* 아이콘 크기 조정 */
                    .experience-item header svg,
                    .project-item header svg,
                    .experience-item h3 svg,
                    .project-item h3 svg {
                        width: 16px !important;
                        height: 16px !important;
                        flex-shrink: 0 !important;
                    }

                    /* 제목 텍스트 */
                    .experience-item h3,
                    .project-item h3 {
                        font-size: 11pt !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* 직책/역할 정보는 두 번째 줄에 */
                    .experience-item .position,
                    .project-item .role,
                    .experience-item .job-title,
                    .project-item .project-role {
                        display: block !important;
                        margin: 4px 0 !important;
                        font-size: 9pt !important;
                    }

                    /* 기술 태그 간격 최소화 */
                    .tech-tag,
                    .skill-item,
                    .tag,
                    .badge {
                        margin: 2px 4px 2px 0 !important;
                        padding: 2px 8px !important;
                        font-size: 9pt !important;
                    }

                    .tech-tags,
                    .skill-list {
                        margin: 4px 0 !important;
                        gap: 4px !important;
                    }

                    /* ========================================
                       페이지 분할 방지 - 항목 단위로 유지
                    ======================================== */

                    /* 제목 뒤에서 페이지 안 나뉨 */
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* 단락 중간에서 안 나뉨 */
                    p {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        orphans: 3;
                        widows: 3;
                    }

                    /* 리스트 항목 중간에서 안 나뉨 */
                    li {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* ★ 핵심: Experience/Project/Education 항목이 절대 중간에 안 잘림 */
                    .experience-item,
                    .project-item,
                    .education-item,
                    .skill-category,
                    article,
                    [class*="item"],
                    [class*="card"] {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: auto !important;
                        break-after: auto !important;
                        margin-bottom: 10px !important; /* 페이지 채움을 위해 간격 조정 */
                    }

                    /* Colorful 템플릿: 카드들이 일관되게 정렬되도록 */
                    .card {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* 각 스킬 카드가 박스 형태를 유지하도록 */
                    .skill-item {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        display: inline-block !important;
                        vertical-align: top !important;
                    }

                    /* Header와 첫 섹션 함께 유지 */
                    header {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }

                    header + section,
                    header + .section {
                        page-break-before: avoid !important;
                        break-before: avoid !important;
                    }

                    /* 첫 페이지에 여백이 많으면 다음 섹션도 같은 페이지에 */
                    header + section + section:not(.no-page-break),
                    .hero + .container > section:first-child {
                        page-break-before: auto !important;
                        break-before: auto !important;
                    }

                    /* 섹션이 너무 길지 않으면 페이지 중간에 안 나뉨 */
                    section {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }

                    /* ========================================
                       일반 템플릿(Minimal, Clean, Elegant): 첫 페이지 여백 최적화
                    ======================================== */

                    /* Colorful이 아닌 템플릿에만 적용 - 첫 페이지 여백 채우기 */
                    body:not(.colorful-template) section:nth-of-type(1),
                    body:not(.colorful-template) section:nth-of-type(2) {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    /* Colorful이 아닌 템플릿 - 섹션이 페이지에 충분히 들어갈 수 있으면 다음 페이지로 넘기지 않음 */
                    body:not(.colorful-template) section:not(.page-break-before) {
                        page-break-before: auto !important;
                        break-before: auto !important;
                    }

                    /* Colorful이 아닌 템플릿 - About 섹션 최소 높이 */
                    body:not(.colorful-template) section.about,
                    body:not(.colorful-template) .about-section {
                        min-height: 150px !important;
                    }

                    /* 모든 섹션에서 내용이 잘리지 않도록 보장 */
                    section > *:not(header):not(h1):not(h2):not(h3) {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* 일반 템플릿: 섹션 간 적절한 간격으로 페이지 채우기 */
                    body:not(.colorful-template) section + section {
                        margin-top: 18px !important;
                    }

                    /* Colorful 템플릿: 섹션 간 간격을 줄여서 명확한 페이지 구분 */
                    body.colorful-template section + section {
                        margin-top: 0 !important;
                    }

                    /* 섹션 헤더(제목)는 항상 다음 내용과 함께 */
                    .section-header,
                    .section-title,
                    [class*="section-title"] {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* Colorful 템플릿: 스킬 섹션 헤더와 내용 함께 유지 */
                    .section-header + *,
                    .section-title + * {
                        page-break-before: avoid !important;
                        break-before: avoid !important;
                    }

                    /* Skills 섹션 전체를 가능하면 함께 유지 */
                    .skills-container,
                    .skill-grid,
                    .cards-grid {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }

                    /* Colorful 템플릿: Skills 섹션 헤더가 이전 페이지에서 잘리지 않도록 */
                    section.skills,
                    .skills-section,
                    [class*="skills"] > h2,
                    [class*="skills"] > .section-title,
                    [class*="skills"] > .section-header {
                        page-break-before: auto !important;
                        break-before: auto !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        min-height: 40px !important;
                        padding: 12px 0 !important;
                    }

                    /* Colorful 템플릿: 스킬 태그 박스들이 일관되게 정렬 */
                    .skill-tags,
                    .skills-grid .skill-item,
                    .cards-grid .card {
                        display: inline-flex !important;
                        align-items: center !important;
                        vertical-align: top !important;
                        margin: 4px !important;
                    }

                    /* 스킬 태그들의 그리드 레이아웃 개선 */
                    .skills-grid,
                    .cards-grid {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 6px !important;
                        align-items: flex-start !important;
                    }

                    /* ========================================
                       색상 및 배경 유지
                    ======================================== */

                    *,
                    *::before,
                    *::after {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* ========================================
                       불필요한 효과 제거
                    ======================================== */

                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        animation: none !important;
                        transition: none !important;
                        border-radius: 3px !important; /* 둥근 모서리 최소화 */
                    }

                    /* ========================================
                       레이아웃 최적화
                    ======================================== */

                    /* Flexbox 유지하되 간격 최소화 */
                    .tech-tags,
                    .skill-list,
                    .skills-grid,
                    [class*="tags"],
                    [class*="skills"],
                    [class*="grid"] {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 4px !important;
                    }

                    /* Grid 레이아웃 최적화 */
                    .skills-grid,
                    .projects-grid,
                    [class*="grid"] {
                        gap: 8px !important;
                    }

                    /* ========================================
                       텍스트 가독성
                    ======================================== */

                    body, p, span, div, h1, h2, h3, h4, h5, h6, li {
                        text-rendering: optimizeLegibility !important;
                        -webkit-font-smoothing: antialiased !important;
                        -moz-osx-font-smoothing: grayscale !important;
                    }

                    /* ========================================
                       이미지
                    ======================================== */

                    img {
                        max-width: 100% !important;
                        height: auto !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* ========================================
                       링크 스타일
                    ======================================== */

                    a {
                        text-decoration: none !important;
                        color: inherit !important;
                    }

                    /* URL 표시 안 함 */
                    a[href]::after {
                        content: "" !important;
                    }

                    /* ========================================
                       특정 요소 숨김 (브라우저 UI 요소)
                    ======================================== */

                    /* 인쇄 시 불필요한 요소 숨김 */
                    .no-print,
                    [class*="button"],
                    button,
                    input,
                    select,
                    textarea {
                        display: none !important;
                    }

                    /* ========================================
                       Duration/Date 스타일 최적화
                    ======================================== */

                    .duration,
                    .period,
                    .date,
                    time {
                        font-size: 9pt !important;
                        color: #666 !important;
                        margin: 2px 0 !important;
                    }

                    /* ========================================
                       Position/Role 스타일 최적화
                    ======================================== */

                    .position,
                    .role,
                    .job-title {
                        font-size: 10pt !important;
                        margin: 2px 0 !important;
                    }

                    /* ========================================
                       Achievement/Description 리스트 최적화
                    ======================================== */

                    .achievements,
                    .achievements li,
                    .description ul li {
                        margin: 1px 0 !important;
                        padding-left: 4px !important;
                        line-height: 1.3 !important;
                    }

                    /* ========================================
                       Contact Links 최적화
                    ======================================== */

                    .contact-links,
                    .contact-link {
                        margin: 2px 4px !important;
                        font-size: 9pt !important;
                    }

                    /* ========================================
                       Section Title 스타일
                    ======================================== */

                    .section-title {
                        margin-bottom: 8px !important;
                        padding-bottom: 4px !important;
                        border-bottom: 1px solid #ddd !important;
                    }

                    /* Section title 밑줄 효과 제거 또는 최소화 */
                    .section-title::after {
                        display: none !important;
                    }
                }

                /* ========================================
                   화면 표시용 스타일
                ======================================== */

                @media screen {
                    body {
                        background: #f5f5f5;
                        padding: 20px;
                    }

                    .print-preview {
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white;
                        padding: 10mm;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                }
            </style>
        `;

        // HTML에 스타일 삽입
        if (htmlContent.includes('</head>')) {
            return htmlContent.replace('</head>', printStyles + '</head>');
        } else if (htmlContent.includes('<body>')) {
            return htmlContent.replace('<body>', '<head>' + printStyles + '</head><body>');
        } else {
            return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio</title>
    ${printStyles}
</head>
<body>
    ${htmlContent}
</body>
</html>`;
        }
    }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();
