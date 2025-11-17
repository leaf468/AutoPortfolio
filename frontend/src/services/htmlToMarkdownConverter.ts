/**
 * HTML to Markdown Converter Service
 * Converts portfolio HTML to well-structured markdown while preserving layout and content
 */

export class HTMLToMarkdownConverter {
    /**
     * Convert HTML string to Markdown
     * Uses a comprehensive DOM traversal approach to capture all content
     */
    convertToMarkdown(html: string): string {
        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        let markdown = '';

        // Step 1: Extract header information
        const header = tempDiv.querySelector('header, .header');
        if (header) {
            markdown += this.extractHeader(header);
        }

        // Step 2: Extract all section elements
        const sections = tempDiv.querySelectorAll('section, .section, [data-section]');

        if (sections.length > 0) {
            sections.forEach((section) => {
                const sectionMarkdown = this.extractSectionContent(section as HTMLElement);
                if (sectionMarkdown) {
                    markdown += sectionMarkdown + '\n\n';
                }
            });
        } else {
            // Fallback: if no sections found, try to extract all h2 blocks
            markdown += this.extractByHeadings(tempDiv);
        }

        // Step 3: Clean up and format
        markdown = this.cleanupMarkdown(markdown);

        return markdown.trim();
    }

    /**
     * Extract header section (name, title, contact)
     */
    private extractHeader(header: Element): string {
        let markdown = '';

        // Extract main title (h1)
        const h1 = header.querySelector('h1');
        if (h1) {
            markdown += `# ${this.cleanText(h1.textContent)}\n\n`;
        }

        // Extract subtitle/pitch
        const subtitle = header.querySelector('.subtitle, h2, .oneliner, .pitch, .title');
        if (subtitle && subtitle !== h1) {
            const text = this.cleanText(subtitle.textContent);
            if (text) {
                markdown += `**${text}**\n\n`;
            }
        }

        // Extract contact links
        const contactLinks = header.querySelectorAll('a[href], .contact-link, .contact a');
        if (contactLinks.length > 0) {
            markdown += `---\n\n`;
            const contacts: string[] = [];
            contactLinks.forEach((link) => {
                const href = (link as HTMLAnchorElement).href;
                const text = this.cleanText(link.textContent);

                if (!text || !href) return;

                if (href.startsWith('mailto:')) {
                    contacts.push(`📧 ${text}`);
                } else if (href.startsWith('tel:')) {
                    contacts.push(`📞 ${text}`);
                } else if (href.includes('github')) {
                    contacts.push(`[GitHub](${href})`);
                } else if (href.includes('linkedin')) {
                    contacts.push(`[LinkedIn](${href})`);
                } else {
                    contacts.push(`[${text}](${href})`);
                }
            });

            if (contacts.length > 0) {
                markdown += contacts.join(' • ') + '\n\n';
            }
        }

        markdown += `---\n\n`;
        return markdown;
    }

    /**
     * Extract content from a section element
     */
    private extractSectionContent(section: HTMLElement): string {
        let markdown = '';

        // Get section title
        const sectionTitle = section.querySelector('h2, .section-title, h3');
        if (sectionTitle) {
            markdown += `## ${this.cleanText(sectionTitle.textContent)}\n\n`;
        }

        // Get section class or data attribute to determine type
        const className = section.className.toLowerCase();
        const dataSection = section.getAttribute('data-section')?.toLowerCase() || '';
        const sectionType = className + ' ' + dataSection;

        // Handle different section types
        if (sectionType.includes('about') || sectionType.includes('summary') || sectionType.includes('introduction')) {
            markdown += this.extractAboutSection(section);
        } else if (sectionType.includes('experience') || sectionType.includes('work')) {
            markdown += this.extractExperienceSection(section);
        } else if (sectionType.includes('project')) {
            markdown += this.extractProjectsSection(section);
        } else if (sectionType.includes('education')) {
            markdown += this.extractEducationSection(section);
        } else if (sectionType.includes('skill')) {
            markdown += this.extractSkillsSection(section);
        } else {
            // Generic section extraction
            markdown += this.extractGenericSection(section);
        }

        return markdown;
    }

    /**
     * Extract About/Summary section
     */
    private extractAboutSection(section: HTMLElement): string {
        const content = section.querySelector('.about-content, .summary-content, p, .content');

        if (content) {
            // Get all paragraphs
            const paragraphs = content.querySelectorAll('p');
            if (paragraphs.length > 0) {
                return Array.from(paragraphs)
                    .map(p => this.cleanText(p.textContent))
                    .filter(Boolean)
                    .join('\n\n') + '\n';
            }

            // Fallback to direct text content
            const text = this.cleanText(content.textContent);
            return text ? text + '\n' : '';
        }

        // Try to get any paragraph in the section
        const paragraphs = section.querySelectorAll('p');
        if (paragraphs.length > 0) {
            return Array.from(paragraphs)
                .map(p => this.cleanText(p.textContent))
                .filter(Boolean)
                .join('\n\n') + '\n';
        }

        return '';
    }

    /**
     * Extract Experience section with detailed formatting
     */
    private extractExperienceSection(section: HTMLElement): string {
        let markdown = '';

        const experienceItems = section.querySelectorAll('.experience-item, .job, .position, .work-item, article');

        if (experienceItems.length > 0) {
            experienceItems.forEach((item) => {
                // Company/Organization
                const company = item.querySelector('h3, .company, .organization, .company-info h3');

                // Position/Role
                const position = item.querySelector('.position, .role, .job-title, .company-info .position');

                // Duration/Period
                const duration = item.querySelector('.duration, .period, .date, time');

                // Build header
                if (company) {
                    const companyText = this.cleanText(company.textContent);
                    const positionText = position ? this.cleanText(position.textContent) : '';

                    if (positionText) {
                        markdown += `### ${positionText} - ${companyText}\n\n`;
                    } else {
                        markdown += `### ${companyText}\n\n`;
                    }
                }

                if (duration) {
                    markdown += `**${this.cleanText(duration.textContent)}**\n\n`;
                }

                // Impact statement
                const impact = item.querySelector('.impact, .highlight');
                if (impact) {
                    markdown += `*${this.cleanText(impact.textContent)}*\n\n`;
                }

                // Achievements/Description
                const achievements = item.querySelectorAll('.achievements li, ul li, .achievement');
                if (achievements.length > 0) {
                    achievements.forEach((achievement) => {
                        const text = this.cleanText(achievement.textContent);
                        if (text) {
                            markdown += `- ${text}\n`;
                        }
                    });
                    markdown += '\n';
                }

                // If no list items, try to get description paragraphs
                if (achievements.length === 0) {
                    const description = item.querySelector('.description, p');
                    if (description) {
                        markdown += `${this.cleanText(description.textContent)}\n\n`;
                    }
                }

                // Technologies used
                const techTags = item.querySelectorAll('.tech-tag, .technology, .skill-tag, .tech-tags .tag');
                if (techTags.length > 0) {
                    const techs = Array.from(techTags)
                        .map(tag => this.cleanText(tag.textContent))
                        .filter(Boolean);
                    if (techs.length > 0) {
                        markdown += `**Technologies:** ${techs.join(', ')}\n\n`;
                    }
                }

                markdown += '---\n\n';
            });
        } else {
            // Fallback: try to extract by h3 headers
            markdown += this.extractBySubheadings(section);
        }

        return markdown;
    }

    /**
     * Extract Projects section with links and technologies
     */
    private extractProjectsSection(section: HTMLElement): string {
        let markdown = '';

        const projectItems = section.querySelectorAll('.project-item, .project, .project-card, article');

        if (projectItems.length > 0) {
            projectItems.forEach((item) => {
                // Project title
                const title = item.querySelector('h3, .project-title, .title, .project-header h3');

                // Project role
                const role = item.querySelector('.project-role, .role');

                // Project link
                const link = item.querySelector('a[href^="http"], .project-link[href]');

                if (title) {
                    let titleText = `### ${this.cleanText(title.textContent)}`;
                    if (link) {
                        titleText += ` - [View Project](${(link as HTMLAnchorElement).href})`;
                    }
                    markdown += titleText + '\n\n';
                }

                if (role) {
                    markdown += `**${this.cleanText(role.textContent)}**\n\n`;
                }

                // Description
                const description = item.querySelector('.project-description, .description, p');
                if (description) {
                    markdown += `${this.cleanText(description.textContent)}\n\n`;
                }

                // Highlights/Achievements
                const highlights = item.querySelectorAll('ul li, .highlight, .achievement');
                if (highlights.length > 0) {
                    highlights.forEach((highlight) => {
                        const text = this.cleanText(highlight.textContent);
                        if (text && !text.includes('http')) { // Avoid duplicating links
                            markdown += `- ${text}\n`;
                        }
                    });
                    markdown += '\n';
                }

                // Technologies
                const techTags = item.querySelectorAll('.tech-tag, .technology, .skill-tag, .tech-tags .tag, .stack span');
                if (techTags.length > 0) {
                    const techs = Array.from(techTags)
                        .map(tag => this.cleanText(tag.textContent))
                        .filter(Boolean);
                    if (techs.length > 0) {
                        markdown += `**Technologies:** ${techs.join(', ')}\n\n`;
                    }
                }

                markdown += '---\n\n';
            });
        } else {
            markdown += this.extractBySubheadings(section);
        }

        return markdown;
    }

    /**
     * Extract Education section
     */
    private extractEducationSection(section: HTMLElement): string {
        let markdown = '';

        const educationItems = section.querySelectorAll('.education-item, .degree, .school, article');

        if (educationItems.length > 0) {
            educationItems.forEach((item) => {
                // Degree/Program
                const degree = item.querySelector('h3, .degree, .program, .title');

                // School/Institution
                const school = item.querySelector('.school, .institution, .university');

                // Period/Duration
                const period = item.querySelector('.period, .duration, .date, time');

                if (degree) {
                    let degreeText = `### ${this.cleanText(degree.textContent)}`;
                    if (school && school !== degree) {
                        degreeText += ` - ${this.cleanText(school.textContent)}`;
                    }
                    markdown += degreeText + '\n\n';
                }

                if (period) {
                    markdown += `**${this.cleanText(period.textContent)}**\n\n`;
                }

                // Description/Highlights
                const description = item.querySelector('.description, p');
                if (description) {
                    markdown += `${this.cleanText(description.textContent)}\n\n`;
                }

                const achievements = item.querySelectorAll('ul li');
                if (achievements.length > 0) {
                    achievements.forEach((achievement) => {
                        const text = this.cleanText(achievement.textContent);
                        if (text) {
                            markdown += `- ${text}\n`;
                        }
                    });
                    markdown += '\n';
                }

                markdown += '---\n\n';
            });
        } else {
            markdown += this.extractBySubheadings(section);
        }

        return markdown;
    }

    /**
     * Extract Skills section with categories
     */
    private extractSkillsSection(section: HTMLElement): string {
        let markdown = '';

        // Check for skill categories
        const categories = section.querySelectorAll('.skill-category, .category, .skill-group');

        if (categories.length > 0) {
            categories.forEach((category) => {
                const title = category.querySelector('h3, h4, .category-title, .title');
                if (title) {
                    markdown += `### ${this.cleanText(title.textContent)}\n\n`;
                }

                // Get skills in this category
                const skills = category.querySelectorAll('.skill-item, .skill, .tag, li, span.skill');
                const skillTexts = Array.from(skills)
                    .map(s => this.cleanText(s.textContent))
                    .filter(Boolean);

                if (skillTexts.length > 0) {
                    markdown += skillTexts.join(' • ') + '\n\n';
                }

                // Description
                const description = category.querySelector('.skill-description, .description, p');
                if (description) {
                    markdown += `*${this.cleanText(description.textContent)}*\n\n`;
                }
            });
        } else {
            // Flat skill list
            const skills = section.querySelectorAll('.skill-item, .skill, .tag, li');
            if (skills.length > 0) {
                const skillTexts = Array.from(skills)
                    .map(s => this.cleanText(s.textContent))
                    .filter(Boolean);
                markdown += skillTexts.join(' • ') + '\n\n';
            } else {
                // Fallback to all text content
                const text = this.cleanText(section.textContent);
                if (text) {
                    markdown += text + '\n\n';
                }
            }
        }

        return markdown;
    }

    /**
     * Extract generic section content
     */
    private extractGenericSection(section: HTMLElement): string {
        let markdown = '';

        // Get all direct children and convert them
        const children = section.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Skip the title (already processed)
            if (child.classList.contains('section-title') ||
                child.tagName === 'H2' ||
                child.tagName === 'H3') {
                continue;
            }

            const converted = this.convertElementToMarkdown(child);
            if (converted) {
                markdown += converted + '\n\n';
            }
        }

        return markdown;
    }

    /**
     * Extract content by finding h2 headings
     */
    private extractByHeadings(element: HTMLElement): string {
        let markdown = '';
        const headings = element.querySelectorAll('h2');

        headings.forEach((heading) => {
            markdown += `## ${this.cleanText(heading.textContent)}\n\n`;

            let nextElement = heading.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H2') {
                const converted = this.convertElementToMarkdown(nextElement);
                if (converted) {
                    markdown += converted + '\n\n';
                }
                nextElement = nextElement.nextElementSibling;
            }
        });

        return markdown;
    }

    /**
     * Extract content by finding h3 subheadings
     */
    private extractBySubheadings(element: HTMLElement): string {
        let markdown = '';
        const headings = element.querySelectorAll('h3, h4');

        headings.forEach((heading) => {
            markdown += `### ${this.cleanText(heading.textContent)}\n\n`;

            let nextElement = heading.nextElementSibling;
            while (nextElement && !['H2', 'H3', 'H4'].includes(nextElement.tagName)) {
                const converted = this.convertElementToMarkdown(nextElement);
                if (converted) {
                    markdown += converted + '\n\n';
                }
                nextElement = nextElement.nextElementSibling;
            }
        });

        return markdown;
    }

    /**
     * Convert a single HTML element to markdown
     */
    private convertElementToMarkdown(element: Element): string {
        const tag = element.tagName.toLowerCase();

        switch (tag) {
            case 'p':
                return this.cleanText(element.textContent);

            case 'ul':
            case 'ol':
                const items = element.querySelectorAll('li');
                return Array.from(items)
                    .map(li => `- ${this.cleanText(li.textContent)}`)
                    .filter(Boolean)
                    .join('\n');

            case 'h1':
                return `# ${this.cleanText(element.textContent)}`;

            case 'h2':
                return `## ${this.cleanText(element.textContent)}`;

            case 'h3':
                return `### ${this.cleanText(element.textContent)}`;

            case 'h4':
                return `#### ${this.cleanText(element.textContent)}`;

            case 'a':
                const href = (element as HTMLAnchorElement).href;
                const text = this.cleanText(element.textContent);
                return href && text ? `[${text}](${href})` : text;

            case 'strong':
            case 'b':
                return `**${this.cleanText(element.textContent)}**`;

            case 'em':
            case 'i':
                return `*${this.cleanText(element.textContent)}*`;

            case 'div':
            case 'section':
            case 'article':
                // For container elements, extract text or recurse
                const children = element.children;
                if (children.length > 0) {
                    let markdown = '';
                    for (let i = 0; i < children.length; i++) {
                        const converted = this.convertElementToMarkdown(children[i]);
                        if (converted) {
                            markdown += converted + '\n';
                        }
                    }
                    return markdown.trim();
                }
                return this.cleanText(element.textContent);

            default:
                return this.cleanText(element.textContent);
        }
    }

    /**
     * Clean and normalize text content
     */
    private cleanText(text: string | null | undefined): string {
        if (!text) return '';

        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n+/g, ' ') // Remove newlines
            .trim();
    }

    /**
     * Clean up markdown formatting
     */
    private cleanupMarkdown(markdown: string): string {
        return markdown
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .replace(/---\n\n---/g, '---') // Remove duplicate separators
            .replace(/^---\n\n/gm, '') // Remove leading separators
            .trim();
    }

    /**
     * Download markdown as a .md file
     */
    downloadMarkdown(markdown: string, filename: string = 'portfolio.md'): void {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Copy markdown to clipboard
     */
    async copyToClipboard(markdown: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(markdown);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const htmlToMarkdownConverter = new HTMLToMarkdownConverter();
