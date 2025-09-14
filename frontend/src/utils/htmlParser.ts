export interface EditableSection {
    id: string;
    title: string;
    content: string;
    type: 'header' | 'about' | 'projects' | 'skills' | 'experience' | 'contact' | 'other';
    editable: boolean;
}

export interface ParsedPortfolio {
    sections: EditableSection[];
    fullHtml: string;
}

/**
 * HTML 포트폴리오를 편집 가능한 섹션들로 파싱합니다
 */
export function parsePortfolioHTML(html: string): ParsedPortfolio {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const sections: EditableSection[] = [];
    
    // 각 섹션을 식별하고 추출
    const sectionElements = doc.querySelectorAll('section, .section, div[class*="section"], header, .header, .about, .projects, .skills, .experience, .contact');
    
    sectionElements.forEach((element, index) => {
        const className = element.className.toLowerCase();
        const tagName = element.tagName.toLowerCase();
        const id = element.id || `section-${index}`;
        
        // 섹션 타입 결정
        let type: EditableSection['type'] = 'other';
        if (tagName === 'header' || className.includes('header') || className.includes('hero')) {
            type = 'header';
        } else if (className.includes('about') || className.includes('summary')) {
            type = 'about';
        } else if (className.includes('project')) {
            type = 'projects';
        } else if (className.includes('skill')) {
            type = 'skills';
        } else if (className.includes('experience') || className.includes('work')) {
            type = 'experience';
        } else if (className.includes('contact')) {
            type = 'contact';
        }
        
        // 제목 찾기
        const titleElement = element.querySelector('h1, h2, h3, .title, .section-title');
        const title = titleElement?.textContent?.trim() || getDefaultSectionTitle(type);
        
        // 내용 추출 (제목 제외)
        const content = extractSectionContent(element);
        
        sections.push({
            id,
            title,
            content,
            type,
            editable: true
        });
    });
    
    // 섹션이 없으면 전체 body를 하나의 섹션으로 처리
    if (sections.length === 0) {
        sections.push({
            id: 'main-content',
            title: '포트폴리오',
            content: doc.body.innerHTML,
            type: 'other',
            editable: true
        });
    }
    
    return {
        sections,
        fullHtml: html
    };
}

/**
 * 편집된 섹션들을 다시 완전한 HTML로 결합합니다
 */
export function reconstructHTML(originalHtml: string, editedSections: EditableSection[]): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, 'text/html');
    
    // 각 섹션을 업데이트
    editedSections.forEach(section => {
        const element = doc.getElementById(section.id) || 
                       doc.querySelector(`[data-section-id="${section.id}"]`);
        
        if (element) {
            // 제목 업데이트
            const titleElement = element.querySelector('h1, h2, h3, .title, .section-title');
            if (titleElement) {
                titleElement.textContent = section.title;
            }
            
            // 내용 업데이트 (제목은 유지)
            const contentWrapper = element.querySelector('.content, .section-content') || element;
            if (contentWrapper !== titleElement) {
                // 제목 요소가 아닌 경우에만 내용 업데이트
                const tempDiv = doc.createElement('div');
                tempDiv.innerHTML = section.content;
                
                // 기존 내용을 새 내용으로 교체 (제목 제외)
                Array.from(contentWrapper.children).forEach(child => {
                    if (child !== titleElement) {
                        child.remove();
                    }
                });
                
                Array.from(tempDiv.children).forEach(child => {
                    contentWrapper.appendChild(child);
                });
            }
        }
    });
    
    return doc.documentElement.outerHTML;
}

/**
 * 섹션 내용을 추출합니다 (제목 제외)
 */
function extractSectionContent(element: Element): string {
    const clone = element.cloneNode(true) as Element;
    
    // 제목 요소 제거
    const titleElements = clone.querySelectorAll('h1, h2, h3, .title, .section-title');
    titleElements.forEach(title => title.remove());
    
    return clone.innerHTML;
}

/**
 * 섹션 타입에 따른 기본 제목을 반환합니다
 */
function getDefaultSectionTitle(type: EditableSection['type']): string {
    const titles = {
        header: '소개',
        about: '자기소개',
        projects: '프로젝트',
        skills: '기술 스택',
        experience: '경력',
        contact: '연락처',
        other: '기타'
    };
    
    return titles[type] || '섹션';
}

/**
 * HTML에서 텍스트만 추출합니다 (편집용)
 */
export function extractTextContent(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

/**
 * 텍스트를 기본 HTML 구조로 변환합니다
 */
export function textToHTML(text: string): string {
    return text
        .split('\n\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('\n');
}