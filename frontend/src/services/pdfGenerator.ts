/**
 * PDF Generator Service
 * Generates high-quality PDFs with proper pagination and layout control
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export class PDFGenerator {
    /**
     * Generate PDF using HTML2Canvas + jsPDF
     * Ensures each major section starts on a new page
     */
    async generatePDF(
        htmlContent: string,
        filename: string = 'portfolio.pdf',
        options?: {
            quality?: number;
            format?: 'a4' | 'letter';
            orientation?: 'portrait' | 'landscape';
        }
    ): Promise<void> {
        let iframe: HTMLIFrameElement | null = null;

        try {
            console.log('[PDF Generator] 시작');

            // PDF configuration
            const format = options?.format || 'a4';
            const orientation = options?.orientation || 'portrait';
            const quality = options?.quality || 2;

            // Create PDF
            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                compress: true,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);

            console.log('[PDF Generator] PDF 설정:', { pageWidth, pageHeight, margin, contentWidth });

            // Create an invisible iframe to render the HTML properly with all styles
            iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '794px'; // A4 width at 96 DPI
            iframe.style.height = '1123px'; // A4 height at 96 DPI
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            // Wait for iframe to be ready
            await new Promise((resolve) => {
                iframe!.onload = resolve;
                // Write the complete HTML document to iframe
                iframe!.srcdoc = htmlContent;
            });

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
                throw new Error('Iframe document를 찾을 수 없습니다.');
            }

            console.log('[PDF Generator] Iframe 로드 완료');

            // Wait for fonts and images to load
            await this.waitForContent(iframeDoc);

            console.log('[PDF Generator] 콘텐츠 로딩 완료');

            // Get sections from iframe document
            const sections = this.identifySections(iframeDoc.body);

            console.log('[PDF Generator] 섹션 식별 완료:', sections.length);

            if (sections.length === 0) {
                // Fallback: render the entire body as one page
                console.log('[PDF Generator] 섹션을 찾을 수 없어 전체 문서를 렌더링합니다.');
                sections.push({
                    name: 'full-document',
                    element: iframeDoc.body,
                });
            }

            let isFirstPage = true;

            // Process each section
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                console.log(`[PDF Generator] 섹션 ${i + 1}/${sections.length} 처리 중: ${section.name}`);

                if (!isFirstPage) {
                    pdf.addPage();
                }

                try {
                    // IMPORTANT: Render from the iframe's window context
                    const iframeWindow = iframe.contentWindow;
                    if (!iframeWindow) {
                        throw new Error('Iframe window를 찾을 수 없습니다.');
                    }

                    // Render section to canvas using iframe's window
                    const canvas = await html2canvas(section.element, {
                        scale: quality,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        allowTaint: true,
                        windowWidth: section.element.scrollWidth,
                        windowHeight: section.element.scrollHeight,
                        // Use the iframe's window for proper style resolution
                        foreignObjectRendering: false,
                    });

                    console.log(`[PDF Generator] Canvas 생성 완료: ${canvas.width}x${canvas.height}`);

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = contentWidth;
                    const imgHeight = (canvas.height * contentWidth) / canvas.width;

                    // Check if image fits on one page
                    if (imgHeight <= pageHeight - (margin * 2)) {
                        // Fits on one page
                        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
                        console.log(`[PDF Generator] 섹션 ${section.name}: 한 페이지에 추가 완료`);
                    } else {
                        // Need to split across multiple pages
                        console.log(`[PDF Generator] 섹션 ${section.name}: 여러 페이지로 분할 필요`);

                        let remainingHeight = imgHeight;
                        let yPosition = 0;
                        let pageNumber = 0;

                        while (remainingHeight > 0) {
                            if (pageNumber > 0) {
                                pdf.addPage();
                            }

                            const heightToAdd = Math.min(pageHeight - (margin * 2), remainingHeight);
                            const sourceY = yPosition * (canvas.height / imgHeight);
                            const sourceHeight = heightToAdd * (canvas.height / imgHeight);

                            // Create a temporary canvas for this slice
                            const sliceCanvas = document.createElement('canvas');
                            sliceCanvas.width = canvas.width;
                            sliceCanvas.height = sourceHeight;
                            const sliceCtx = sliceCanvas.getContext('2d');

                            if (sliceCtx) {
                                sliceCtx.drawImage(
                                    canvas,
                                    0, sourceY,
                                    canvas.width, sourceHeight,
                                    0, 0,
                                    canvas.width, sourceHeight
                                );

                                const sliceImgData = sliceCanvas.toDataURL('image/png');
                                pdf.addImage(sliceImgData, 'PNG', margin, margin, imgWidth, heightToAdd);
                                console.log(`[PDF Generator] 섹션 ${section.name}: 페이지 ${pageNumber + 1} 추가`);
                            }

                            yPosition += heightToAdd;
                            remainingHeight -= heightToAdd;
                            pageNumber++;
                        }
                    }
                } catch (sectionError) {
                    console.error(`[PDF Generator] 섹션 ${section.name} 처리 실패:`, sectionError);
                    // Continue with other sections
                }

                isFirstPage = false;
            }

            console.log('[PDF Generator] PDF 생성 완료, 다운로드 중...');

            // Save PDF
            pdf.save(filename);

            console.log('[PDF Generator] 다운로드 완료');
        } catch (error) {
            console.error('[PDF Generator] 오류 발생:', error);
            throw error;
        } finally {
            // Clean up iframe
            if (iframe && iframe.parentNode) {
                document.body.removeChild(iframe);
                console.log('[PDF Generator] Iframe 정리 완료');
            }
        }
    }

    /**
     * Identify logical sections in the HTML for pagination
     * Returns references to elements in their original DOM context (don't clone!)
     */
    private identifySections(container: HTMLElement): Array<{ name: string; element: HTMLElement }> {
        const sections: Array<{ name: string; element: HTMLElement }> = [];

        // Find all <section> elements
        const sectionElements = container.querySelectorAll('section');

        if (sectionElements.length > 0) {
            console.log(`[PDF Generator] ${sectionElements.length}개의 section 요소 발견`);

            // Strategy: Capture header + first section together, then each section separately
            const header = container.querySelector('header');

            // First, we'll create a temporary combined element for header + about
            // This needs to be done inside the iframe's document
            if (header && sectionElements[0]) {
                const doc = container.ownerDocument;
                if (doc) {
                    // Create wrapper in the same document
                    const wrapper = doc.createElement('div');
                    wrapper.style.position = 'absolute';
                    wrapper.style.left = '0';
                    wrapper.style.top = '0';
                    wrapper.style.backgroundColor = '#ffffff';
                    wrapper.style.width = '794px';

                    // Clone and append to wrapper
                    wrapper.appendChild(header.cloneNode(true));
                    wrapper.appendChild(sectionElements[0].cloneNode(true));

                    // Append wrapper to body temporarily
                    container.appendChild(wrapper);

                    sections.push({
                        name: 'header-about',
                        element: wrapper,
                    });

                    console.log('[PDF Generator] Header + About 섹션 생성');
                }

                // Add remaining sections individually (use original elements, not clones)
                for (let i = 1; i < sectionElements.length; i++) {
                    const section = sectionElements[i] as HTMLElement;
                    const sectionName = this.getSectionName(section, i);

                    sections.push({
                        name: sectionName,
                        element: section,
                    });

                    console.log(`[PDF Generator] 섹션 ${sectionName} 추가`);
                }
            } else if (header) {
                // Only header exists
                sections.push({
                    name: 'header',
                    element: header as HTMLElement,
                });

                // Add all sections individually
                sectionElements.forEach((section, i) => {
                    const sectionName = this.getSectionName(section, i);
                    sections.push({
                        name: sectionName,
                        element: section as HTMLElement,
                    });
                });
            } else {
                // No header, just sections
                sectionElements.forEach((section, i) => {
                    const sectionName = this.getSectionName(section, i);
                    sections.push({
                        name: sectionName,
                        element: section as HTMLElement,
                    });
                });
            }
        } else {
            // Fallback: try to find sections by class or data-section
            console.log('[PDF Generator] <section> 요소를 찾을 수 없음, class 기반으로 검색');

            const header = container.querySelector('header, .header') as HTMLElement | null;
            const aboutSection = this.findSectionByClass(container, ['about', 'summary']);
            const experienceSection = this.findSectionByClass(container, ['experience', 'work']);
            const projectsSection = this.findSectionByClass(container, ['project']);
            const educationSection = this.findSectionByClass(container, ['education']);
            const skillsSection = this.findSectionByClass(container, ['skill']);

            // Combine header + about
            if (header || aboutSection) {
                const doc = container.ownerDocument;
                if (doc) {
                    const wrapper = doc.createElement('div');
                    wrapper.style.backgroundColor = '#ffffff';
                    wrapper.style.width = '794px';

                    if (header) wrapper.appendChild(header.cloneNode(true));
                    if (aboutSection) wrapper.appendChild(aboutSection.cloneNode(true));

                    container.appendChild(wrapper);

                    sections.push({
                        name: 'header-about',
                        element: wrapper,
                    });
                }
            }

            // Add other sections (use original elements)
            const otherSections = [
                { element: experienceSection, name: 'experience' },
                { element: projectsSection, name: 'projects' },
                { element: educationSection, name: 'education' },
                { element: skillsSection, name: 'skills' },
            ];

            otherSections.forEach(({ element, name }) => {
                if (element) {
                    sections.push({
                        name,
                        element,
                    });
                }
            });
        }

        return sections;
    }

    /**
     * Get section name from element
     */
    private getSectionName(section: Element, index: number): string {
        // Try to get name from class or id
        const className = section.className.toLowerCase();
        const id = section.id.toLowerCase();

        if (className.includes('experience') || id.includes('experience')) return 'experience';
        if (className.includes('project') || id.includes('project')) return 'projects';
        if (className.includes('education') || id.includes('education')) return 'education';
        if (className.includes('skill') || id.includes('skill')) return 'skills';
        if (className.includes('about') || id.includes('about')) return 'about';

        // Try to get from h2 text
        const h2 = section.querySelector('h2');
        if (h2) {
            const text = h2.textContent?.toLowerCase() || '';
            if (text.includes('experience') || text.includes('경험') || text.includes('경력')) return 'experience';
            if (text.includes('project') || text.includes('프로젝트')) return 'projects';
            if (text.includes('education') || text.includes('학력')) return 'education';
            if (text.includes('skill') || text.includes('스킬')) return 'skills';
            if (text.includes('about') || text.includes('소개')) return 'about';
        }

        return `section-${index + 1}`;
    }

    /**
     * Find section by class name
     */
    private findSectionByClass(container: HTMLElement, classNames: string[]): HTMLElement | null {
        for (const name of classNames) {
            const selectors = [
                `.${name}`,
                `#${name}`,
                `[data-section="${name}"]`,
                `[class*="${name}"]`,
            ];

            for (const selector of selectors) {
                try {
                    const element = container.querySelector(selector);
                    if (element) {
                        return element as HTMLElement;
                    }
                } catch (e) {
                    // Invalid selector, continue
                }
            }
        }
        return null;
    }

    /**
     * Wait for images and fonts to load
     */
    private async waitForContent(doc: Document): Promise<void> {
        // Wait for images
        const images = doc.querySelectorAll('img');
        const imagePromises = Array.from(images).map((img) => {
            if (img.complete) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Still resolve on error
                // Timeout after 5 seconds
                setTimeout(resolve, 5000);
            });
        });

        await Promise.all(imagePromises);

        // Wait for fonts (if document.fonts API is available)
        if (doc.fonts && doc.fonts.ready) {
            try {
                await Promise.race([
                    doc.fonts.ready,
                    new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second timeout
                ]);
            } catch (e) {
                console.warn('[PDF Generator] Font loading timeout');
            }
        }

        // Additional delay to ensure rendering
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    /**
     * Generate enhanced print-optimized HTML with page breaks
     * This version adds CSS for better browser print control
     */
    generatePrintOptimizedHTML(htmlContent: string): string {
        // Add page break CSS
        const printStyles = `
            <style>
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }

                    /* Prevent page breaks inside elements */
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    p, li {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* Force page break before major sections (except first two - header and about) */
                    section:nth-of-type(n+3) {
                        page-break-before: always;
                        break-before: page;
                    }

                    /* Keep header and about together */
                    header + section {
                        page-break-before: avoid;
                        break-before: avoid;
                    }

                    /* Remove shadows and animations for print */
                    * {
                        box-shadow: none !important;
                        animation: none !important;
                        transition: none !important;
                    }

                    /* Ensure backgrounds print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
            </style>
        `;

        // Insert styles before </head>
        if (htmlContent.includes('</head>')) {
            return htmlContent.replace('</head>', printStyles + '</head>');
        } else {
            // If no head tag, wrap content
            return `<!DOCTYPE html><html><head>${printStyles}</head><body>${htmlContent}</body></html>`;
        }
    }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();
