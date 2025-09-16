/**
 * 포트폴리오 콘텐츠를 전문적으로 다듬는 서비스
 */

interface RefinedProject {
    name: string;
    role: string;
    period: string;
    description: string;
    tech: string[];
    impact?: string;
    challenges?: string;
    solutions?: string;
}

interface RefinedPortfolio {
    name: string;
    title: string;
    email: string;
    phone: string;
    github: string;
    linkedin?: string;
    about: string;
    skills: string[];
    experience: Array<{
        position: string;
        company: string;
        duration: string;
        description: string;
        achievements?: string[];
    }>;
    projects: RefinedProject[];
    education: Array<{
        school: string;
        degree: string;
        year: string;
    }>;
}

export class PortfolioRefinementService {

    /**
     * 전체 포트폴리오 데이터를 다듬기
     */
    static async refinePortfolio(rawData: any): Promise<RefinedPortfolio> {
        const refined: RefinedPortfolio = {
            name: this.refineName(rawData.name),
            title: this.refineTitle(rawData.title),
            email: rawData.email || '',
            phone: rawData.phone || '',
            github: rawData.github || '',
            linkedin: rawData.linkedin || '',
            about: await this.refineAbout(rawData.about),
            skills: this.refineSkills(rawData.skills),
            experience: await this.refineExperiences(rawData.experience),
            projects: await this.refineProjects(rawData.projects),
            education: this.refineEducation(rawData.education)
        };

        return refined;
    }

    /**
     * 이름 다듬기
     */
    private static refineName(name: string): string {
        if (!name || name === '김개발' || name === '이름을 입력하세요') {
            return '';
        }
        return name.trim();
    }

    /**
     * 직책 다듬기
     */
    private static refineTitle(title: string): string {
        if (!title || title === '백엔드 개발자' || title === '직책을 입력하세요') {
            return '소프트웨어 개발자';
        }

        // 더 전문적인 표현으로 변환
        const titleMap: Record<string, string> = {
            '개발자': '소프트웨어 개발자',
            '백엔드': '백엔드 개발자',
            '프론트엔드': '프론트엔드 개발자',
            '풀스택': '풀스택 개발자',
            'ML': '머신러닝 엔지니어',
            'AI': 'AI 엔지니어',
            '데이터': '데이터 엔지니어'
        };

        for (const [key, value] of Object.entries(titleMap)) {
            if (title.includes(key)) {
                return value;
            }
        }

        return title.trim();
    }

    /**
     * 자기소개 다듬기 - AI를 사용한 개선
     */
    private static async refineAbout(about: string): Promise<string> {
        if (!about || about.includes('개발자 지망생입니다')) {
            return '';
        }

        // 자기소개 템플릿과 키워드를 사용한 개선
        const improvedAbout = this.improveAboutText(about);

        // 실제 구현에서는 OpenAI API 호출
        // const refinedAbout = await this.callOpenAI(improvedAbout, 'about');

        return improvedAbout;
    }

    /**
     * 자기소개 텍스트 개선
     */
    private static improveAboutText(text: string): string {
        // 불필요한 표현 제거
        let improved = text
            .replace(/안녕하세요[.,]?\s*/gi, '')
            .replace(/저는\s*/gi, '')
            .replace(/입니다[.,]?\s*/gi, '. ')
            .replace(/합니다[.,]?\s*/gi, '. ')
            .trim();

        // 문장 구조 개선
        const sentences = improved.split(/[.!?]+/).filter(s => s.trim());
        const improvedSentences = sentences.map(sentence => {
            let s = sentence.trim();

            // 첫 글자 대문자화 (영문의 경우)
            s = s.charAt(0).toUpperCase() + s.slice(1);

            // 약한 표현을 강한 표현으로
            s = s.replace(/관심이 많습니다/g, '전문성을 보유하고 있습니다');
            s = s.replace(/경험이 있습니다/g, '성공적으로 수행했습니다');
            s = s.replace(/학습했습니다/g, '숙달했습니다');
            s = s.replace(/노력하고 있습니다/g, '지속적으로 발전시키고 있습니다');

            return s;
        });

        // 문단으로 재구성
        const paragraphs = [];

        // 첫 문단: 핵심 역량
        const coreCompetencies = improvedSentences.filter(s =>
            s.includes('개발') || s.includes('경험') || s.includes('전문')
        );
        if (coreCompetencies.length > 0) {
            paragraphs.push(coreCompetencies.join('. ') + '.');
        }

        // 두 번째 문단: 기술 스택과 프로젝트
        const technical = improvedSentences.filter(s =>
            s.includes('기술') || s.includes('프로젝트') || s.includes('구현')
        );
        if (technical.length > 0) {
            paragraphs.push(technical.join('. ') + '.');
        }

        // 세 번째 문단: 성장과 목표
        const growth = improvedSentences.filter(s =>
            s.includes('성장') || s.includes('목표') || s.includes('지속')
        );
        if (growth.length > 0) {
            paragraphs.push(growth.join('. ') + '.');
        }

        return paragraphs.join('\n\n');
    }

    /**
     * 기술 스택 다듬기
     */
    private static refineSkills(skills: string[]): string[] {
        if (!skills || skills.length === 0) {
            return [];
        }

        // 중복 제거 및 정렬
        const uniqueSkills = Array.from(new Set(skills));

        // 카테고리별로 정렬
        const categories = {
            languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust'],
            frontend: ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Sass'],
            backend: ['Node.js', 'Express', 'Spring', 'Django', 'FastAPI', 'NestJS'],
            database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'],
            devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'GitHub Actions'],
            tools: ['Git', 'Jira', 'Figma', 'Postman', 'VS Code']
        };

        const sortedSkills: string[] = [];

        // 카테고리 순서대로 정렬
        Object.values(categories).forEach(categorySkills => {
            categorySkills.forEach(skill => {
                if (uniqueSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                    sortedSkills.push(skill);
                }
            });
        });

        // 카테고리에 없는 기술들 추가
        uniqueSkills.forEach(skill => {
            if (!sortedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                sortedSkills.push(skill);
            }
        });

        return sortedSkills;
    }

    /**
     * 경력 다듬기
     */
    private static async refineExperiences(experiences: any[]): Promise<any[]> {
        if (!experiences || experiences.length === 0) {
            return [];
        }

        return experiences.map(exp => ({
            position: this.refinePosition(exp.position),
            company: exp.company || '회사명',
            duration: this.refineDuration(exp.duration),
            description: this.refineExperienceDescription(exp.description),
            achievements: this.extractAchievements(exp.description)
        }));
    }

    /**
     * 직책 다듬기
     */
    private static refinePosition(position: string): string {
        if (!position || position === '개발자') {
            return '소프트웨어 개발자';
        }

        // 더 전문적인 표현으로
        const positionMap: Record<string, string> = {
            '수료생': '교육 수료생',
            '인턴': '개발 인턴',
            '주니어': '주니어 개발자',
            '시니어': '시니어 개발자',
            '팀장': '개발 팀 리드'
        };

        for (const [key, value] of Object.entries(positionMap)) {
            if (position.includes(key)) {
                return value;
            }
        }

        return position;
    }

    /**
     * 기간 다듬기
     */
    private static refineDuration(duration: string): string {
        if (!duration || duration === '기간') {
            return '';
        }

        // YYYY.MM 형식으로 통일
        return duration.replace(/[\s-]/g, '.').replace(/~/g, ' - ');
    }

    /**
     * 경력 설명 다듬기
     */
    private static refineExperienceDescription(description: string): string {
        if (!description) {
            return '';
        }

        // 불필요한 표현 제거 및 개선
        let refined = description
            .replace(/했습니다/g, '수행')
            .replace(/하였습니다/g, '완료')
            .replace(/개발했습니다/g, '개발 완료')
            .replace(/참여했습니다/g, '참여')
            .trim();

        // 문장을 더 간결하게
        const sentences = refined.split('.').filter(s => s.trim());
        return sentences.map(s => s.trim()).join('. ') + '.';
    }

    /**
     * 성과 추출
     */
    private static extractAchievements(description: string): string[] {
        const achievements = [];

        // 성과 관련 키워드
        const achievementKeywords = ['개선', '향상', '달성', '수상', '완료', '구현', '최적화'];

        const sentences = description.split(/[.!?]+/);
        for (const sentence of sentences) {
            if (achievementKeywords.some(keyword => sentence.includes(keyword))) {
                achievements.push(sentence.trim());
            }
        }

        return achievements;
    }

    /**
     * 프로젝트 다듬기
     */
    private static async refineProjects(projects: any[]): Promise<RefinedProject[]> {
        if (!projects || projects.length === 0) {
            return [];
        }

        return projects.map(project => {
            const refined: RefinedProject = {
                name: this.refineProjectName(project.name),
                role: this.refineRole(project.role),
                period: this.refineDuration(project.period || ''),
                description: this.refineProjectDescription(project.description),
                tech: this.refineTechStack(project.tech),
                impact: this.extractImpact(project.description),
                challenges: this.extractChallenges(project.description),
                solutions: this.extractSolutions(project.description)
            };

            return refined;
        });
    }

    /**
     * 프로젝트명 다듬기
     */
    private static refineProjectName(name: string): string {
        if (!name || name === '새 프로젝트' || name === '프로젝트명') {
            return '프로젝트';
        }

        // 따옴표 제거
        return name.replace(/['"]/g, '').trim();
    }

    /**
     * 역할 다듬기
     */
    private static refineRole(role: string): string {
        if (!role || role === '개발자' || role === '역할') {
            return '풀스택 개발';
        }

        const roleMap: Record<string, string> = {
            '프론트엔드 개발': '프론트엔드 개발 (주도)',
            '백엔드 개발': '백엔드 개발 (주도)',
            '풀스택 개발': '풀스택 개발',
            '팀원': '개발 팀원',
            '팀장': '프로젝트 리드',
            '단독': '단독 개발'
        };

        for (const [key, value] of Object.entries(roleMap)) {
            if (role.includes(key)) {
                return value;
            }
        }

        return role;
    }

    /**
     * 프로젝트 설명 다듬기
     */
    private static refineProjectDescription(description: string): string {
        if (!description || description === '프로젝트 설명을 입력하세요') {
            return '';
        }

        // 프로젝트 설명 구조화
        let refined = description;

        // 문제-해결-결과 구조로 변환
        const sections = {
            problem: '',
            solution: '',
            result: ''
        };

        const sentences = refined.split(/[.!?]+/).filter(s => s.trim());

        sentences.forEach(sentence => {
            if (sentence.includes('문제') || sentence.includes('이슈') || sentence.includes('필요')) {
                sections.problem += sentence.trim() + '. ';
            } else if (sentence.includes('구현') || sentence.includes('개발') || sentence.includes('활용')) {
                sections.solution += sentence.trim() + '. ';
            } else if (sentence.includes('결과') || sentence.includes('개선') || sentence.includes('향상')) {
                sections.result += sentence.trim() + '. ';
            } else {
                sections.solution += sentence.trim() + '. ';
            }
        });

        // 구조화된 설명 생성
        let structuredDescription = '';

        if (sections.problem) {
            structuredDescription += sections.problem + '\n';
        }
        if (sections.solution) {
            structuredDescription += sections.solution + '\n';
        }
        if (sections.result) {
            structuredDescription += sections.result;
        }

        return structuredDescription.trim() || refined;
    }

    /**
     * 기술 스택 다듬기
     */
    private static refineTechStack(tech: string[]): string[] {
        if (!tech || tech.length === 0) {
            return [];
        }

        // 중복 제거 및 대소문자 정규화
        const normalized = tech.map(t => {
            const techMap: Record<string, string> = {
                'react': 'React',
                'vue': 'Vue.js',
                'angular': 'Angular',
                'node': 'Node.js',
                'express': 'Express.js',
                'mongodb': 'MongoDB',
                'mysql': 'MySQL',
                'postgresql': 'PostgreSQL',
                'docker': 'Docker',
                'kubernetes': 'Kubernetes',
                'aws': 'AWS',
                'typescript': 'TypeScript',
                'javascript': 'JavaScript',
                'python': 'Python',
                'java': 'Java'
            };

            const lower = t.toLowerCase().trim();
            return techMap[lower] || t;
        });

        return Array.from(new Set(normalized));
    }

    /**
     * 임팩트 추출
     */
    private static extractImpact(description: string): string {
        const impactKeywords = ['향상', '개선', '증가', '감소', '절감', '%', '배'];
        const sentences = description.split(/[.!?]+/);

        for (const sentence of sentences) {
            if (impactKeywords.some(keyword => sentence.includes(keyword))) {
                return sentence.trim();
            }
        }

        return '';
    }

    /**
     * 도전 과제 추출
     */
    private static extractChallenges(description: string): string {
        const challengeKeywords = ['문제', '이슈', '어려움', '도전', '한계'];
        const sentences = description.split(/[.!?]+/);

        for (const sentence of sentences) {
            if (challengeKeywords.some(keyword => sentence.includes(keyword))) {
                return sentence.trim();
            }
        }

        return '';
    }

    /**
     * 해결 방안 추출
     */
    private static extractSolutions(description: string): string {
        const solutionKeywords = ['해결', '구현', '개발', '적용', '도입'];
        const sentences = description.split(/[.!?]+/);

        for (const sentence of sentences) {
            if (solutionKeywords.some(keyword => sentence.includes(keyword))) {
                return sentence.trim();
            }
        }

        return '';
    }

    /**
     * 교육 다듬기
     */
    private static refineEducation(education: any[]): any[] {
        if (!education || education.length === 0) {
            return [];
        }

        return education.map(edu => ({
            school: edu.school || '교육기관',
            degree: this.refineDegree(edu.degree),
            year: this.refineDuration(edu.year || '')
        }));
    }

    /**
     * 학위/전공 다듬기
     */
    private static refineDegree(degree: string): string {
        if (!degree || degree === '전공') {
            return '컴퓨터공학 전공';
        }

        // 전공명 정규화
        const degreeMap: Record<string, string> = {
            '컴공': '컴퓨터공학',
            '전산': '전산학',
            '소프트웨어': '소프트웨어공학',
            'CS': '컴퓨터과학'
        };

        for (const [key, value] of Object.entries(degreeMap)) {
            if (degree.includes(key)) {
                return degree.replace(key, value);
            }
        }

        return degree;
    }

    /**
     * HTML 생성을 위한 포맷팅
     */
    static formatForHTML(refined: RefinedPortfolio): any {
        return {
            ...refined,
            about: refined.about.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>'),
            projects: refined.projects.map(project => ({
                ...project,
                description: project.description.replace(/\n/g, '<br>')
            }))
        };
    }
}