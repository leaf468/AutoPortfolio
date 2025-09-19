export interface PortfolioTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    author: string;
    designSystem: {
        colors: {
            primary: string;
            secondary: string;
            background: string;
            text: string;
            accent: string;
            border: string;
        };
        darkMode?: {
            background: string;
            text: string;
            accent: string;
            border: string;
        };
        typography: {
            fontFamily: string;
            headingSize: string;
            bodySize: string;
            lineHeight: string;
        };
        layout: {
            maxWidth: string;
            padding: string;
            sectionGap: string;
            columnGap: string;
        };
    };
    features: string[];
    sampleData: {
        name: string;
        title: string;
        contact: {
            email: string;
            phone?: string;
            github?: string;
            blog?: string;
            linkedin?: string;
        };
        about: string;
        skills: string[];
        skillCategories: Array<{
            category: string;
            skills: string[];
            icon?: string;
        }>;
        experience: Array<{
            position: string;
            company: string;
            duration: string;
            description: string;
            achievements: string[];
        }>;
        projects: Array<{
            name: string;
            description: string;
            tech: string[];
            role: string;
            results: string[];
            url?: string;
            github?: string;
            demo?: string;
        }>;
        education: Array<{
            degree: string;
            school: string;
            year: string;
        }>;
        awards?: Array<{
            title: string;
            organization: string;
            year: string;
            description?: string;
        }>;
        certifications?: Array<{
            name: string;
            organization: string;
            year: string;
            id?: string;
        }>;
    };
    generateHTML: (data: any) => string;
}

export type TemplateType = 'james' | 'geon' | 'eunseong' | 'iu';

// Template 1: James (Min9koo) - Minimalist with Emoji Headers
export const jamesTemplate: PortfolioTemplate = {
    id: 'james-minimalist',
    name: '미니멀리스트',
    description: '이모지와 깔끔한 레이아웃의 미니멀 포트폴리오',
    thumbnail: '/templates/james.png',
    author: 'James (Min9koo)',
    designSystem: {
        colors: {
            primary: '#000000',
            secondary: '#666666',
            background: '#ffffff',
            text: '#191919',
            accent: '#0070f3',
            border: '#e5e5e5'
        },
        darkMode: {
            background: '#191919',
            text: '#ffffff',
            accent: '#4493f8',
            border: '#333333'
        },
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            headingSize: '2.5rem',
            bodySize: '1rem',
            lineHeight: '1.6'
        },
        layout: {
            maxWidth: '900px',
            padding: '2rem',
            sectionGap: '4rem',
            columnGap: '2rem'
        }
    },
    features: ['다크모드', '이모지 헤더', '2컬럼 레이아웃', '미니멀 디자인'],
    sampleData: {
        name: '김포트폴리오',
        title: '풀스택 개발자',
        contact: {
            email: 'portfolio@example.com',
            phone: '+82 10-0000-0000',
            github: 'github.com/portfolio',
            blog: 'portfolio.blog.com',
            linkedin: 'linkedin.com/in/portfolio'
        },
        about: '안녕하세요, 창의적이고 열정적인 풀스택 개발자입니다. 사용자 중심의 웹 서비스 개발에 전문성을 가지고 있으며, 최신 기술 트렌드를 적극적으로 학습하고 적용합니다. 효율적인 코드 작성과 팀워크를 통해 가치 있는 서비스를 만들어가겠습니다.',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
        skillCategories: [
            {
                category: '언어',
                skills: ['Python', 'Java', 'C', 'JavaScript', 'TypeScript'],
                icon: '💻'
            },
            {
                category: '프레임워크',
                skills: ['Spring Boot', 'Django', 'React', 'Express.js'],
                icon: '🔧'
            },
            {
                category: '데이터베이스',
                skills: ['MySQL', 'MongoDB', 'PostgreSQL', 'Redis'],
                icon: '🗄️'
            },
            {
                category: '클라우드 & DevOps',
                skills: ['AWS EC2', 'Docker', 'GitHub Actions', 'Jenkins'],
                icon: '☁️'
            },
            {
                category: '협업 툴',
                skills: ['Git', 'Jira', 'Slack', 'Notion'],
                icon: '🤝'
            }
        ],
        experience: [
            {
                position: 'Backend Intern',
                company: '네이버',
                duration: '2022.01 ~ 2022.09',
                description: '검색 로그 분석 시스템 고도화 참여',
                achievements: [
                    'Python + Hadoop 기반 데이터 파이프라인 개선',
                    'API 응답 속도 30% 개선, 불필요한 쿼리 최적화 진행',
                    '사내 배포 자동화 프로세스 개선 경험'
                ]
            },
            {
                position: 'Software Engineer',
                company: '스타트업 A',
                duration: '2023.03 ~ 2024.08',
                description: '백엔드 API 개발 및 데이터베이스 설계',
                achievements: [
                    'RESTful API 설계 및 구현으로 프론트엔드 개발 효율성 40% 향상',
                    '데이터베이스 인덱싱 최적화로 쿼리 성능 50% 개선',
                    '모니터링 시스템 구축으로 장애 대응 시간 60% 단축'
                ]
            }
        ],
        projects: [
            {
                name: 'Slot – AI 기반 일정 추천 서비스',
                description: 'AI를 활용하여 그룹 일정을 효율적으로 조율하는 서비스',
                tech: ['React', 'Node.js', 'MongoDB', 'OpenAI API', 'AWS'],
                role: '팀장, 백엔드 개발 (일정 추천 알고리즘 구현 및 DB 설계)',
                results: [
                    'When2Meet 대비 평균 40% 빠른 일정 확정 시간 달성',
                    '사용자 만족도 4.7/5.0 점수 기록',
                    '월 활성 사용자 1,000명 돌파'
                ],
                github: 'https://github.com/slot-ai',
                demo: 'https://slot-app.vercel.app'
            },
            {
                name: '대학생 재능 공유 플랫폼',
                description: '대학생들 간 재능 교환을 위한 매칭 플랫폼',
                tech: ['Spring Boot', 'MySQL', 'Vue.js', 'Docker'],
                role: '백엔드 리더 (매칭 알고리즘 및 결제 시스템 구현)',
                results: [
                    '출시 3개월만에 가입자 500명 달성',
                    '매칭 성공률 85% 기록',
                    '평균 거래 완료 시간 2일 단축'
                ],
                github: 'https://github.com/talent-share'
            }
        ],
        education: [
            {
                degree: '컴퓨터공학 학사',
                school: '서울대학교',
                year: '2019-2023'
            }
        ],
        awards: [
            {
                title: 'SW 창업 아이디어톤 우수상',
                organization: '교육부',
                year: '2024',
                description: 'AI 기반 재능 공유 플랫폼 기획'
            },
            {
                title: '해커톤 대상',
                organization: '카카오',
                year: '2023',
                description: '실시간 협업 도구 개발'
            }
        ],
        certifications: [
            {
                name: '정보처리기사',
                organization: '한국산업인력공단',
                year: '2023',
                id: '23202000123'
            },
            {
                name: 'AWS Solutions Architect Associate',
                organization: 'AWS',
                year: '2024',
                id: 'AWS-ASA-2024'
            }
        ]
    },
    generateHTML: (data: any) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name || 'Portfolio'} - James Style</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --bg-color: #ffffff;
            --text-color: #191919;
            --secondary-text: #666666;
            --border-color: #e5e5e5;
            --accent-color: #0070f3;
            --card-bg: #f7f7f7;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #191919;
                --text-color: #ffffff;
                --secondary-text: #999999;
                --border-color: #333333;
                --accent-color: #4493f8;
                --card-bg: #232323;
            }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            transition: all 0.3s ease;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 4rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            letter-spacing: -0.02em;
        }
        
        .header .subtitle {
            font-size: 1.25rem;
            color: var(--secondary-text);
            margin-bottom: 2rem;
        }
        
        .contact-links {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .contact-links a {
            color: var(--accent-color);
            text-decoration: none;
            padding: 0.5rem 1rem;
            border: 1px solid var(--accent-color);
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .contact-links a:hover {
            background: var(--accent-color);
            color: white;
        }
        
        .section {
            margin-bottom: 4rem;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border-color);
        }
        
        .section-header .emoji {
            font-size: 2rem;
        }
        
        .section-header h2 {
            font-size: 1.75rem;
            font-weight: 600;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }
        
        @media (max-width: 768px) {
            .two-column {
                grid-template-columns: 1fr;
            }
        }
        
        .card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .card h3 {
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
            color: var(--text-color);
        }
        
        .card p {
            color: var(--secondary-text);
            line-height: 1.6;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .skill-tag {
            background: var(--accent-color);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
        }
        
        .timeline-item {
            position: relative;
            padding-left: 2rem;
            margin-bottom: 2rem;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0.5rem;
            width: 8px;
            height: 8px;
            background: var(--accent-color);
            border-radius: 50%;
        }
        
        .timeline-item::after {
            content: '';
            position: absolute;
            left: 3px;
            top: 1rem;
            width: 2px;
            height: calc(100% + 1rem);
            background: var(--border-color);
        }
        
        .timeline-item:last-child::after {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>👋 ${data.name || '안녕하세요, 박기훈입니다'}</h1>
            <p class="subtitle">${data.title || '백엔드와 데이터 처리에 강점을 가진 주니어 개발자'}</p>
            <div class="contact-links">
                ${data.contact?.email ? `<a href="mailto:${data.contact.email}">📧 ${data.contact.email}</a>` : ''}
                ${data.contact?.github ? `<a href="https://${data.contact.github}" target="_blank">🔗 GitHub</a>` : ''}
                ${data.contact?.blog ? `<a href="https://${data.contact.blog}" target="_blank">📝 Blog</a>` : ''}
                ${data.contact?.linkedin ? `<a href="https://${data.contact.linkedin}" target="_blank">💼 LinkedIn</a>` : ''}
            </div>
        </header>
        
        <section class="section">
            <div class="section-header">
                <span class="emoji">👨‍💻</span>
                <h2>개인소개</h2>
            </div>
            <p>${data.about || '안녕하세요, 백엔드와 데이터 처리에 강점을 가진 주니어 개발자입니다.'}</p>
        </section>
        
        <section class="section">
            <div class="section-header">
                <span class="emoji">🛠</span>
                <h2>스킬셋</h2>
            </div>
            ${(data.skillCategories || []).map((category: any) => `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--secondary-color); margin-bottom: 0.75rem; font-size: 1.1rem;">
                        ${category.icon || '•'} ${category.category}
                    </h3>
                    <div class="skill-tags">
                        ${(category.skills || []).map((skill: any) => 
                            `<span class="skill-tag">${skill}</span>`
                        ).join('')}
                    </div>
                </div>
            `).join('')}
        </section>
        
        <section class="section">
            <div class="section-header">
                <span class="emoji">💼</span>
                <h2>커리어/경력</h2>
            </div>
            <div class="timeline">
                ${(data.experience || []).map((exp: any) => `
                    <div class="timeline-item">
                        <h3>${exp.position}</h3>
                        <p style="color: var(--secondary-text); margin-bottom: 0.5rem;">
                            ${exp.company} • ${exp.duration}
                        </p>
                        <p style="margin-bottom: 0.75rem;">${exp.description}</p>
                        ${exp.achievements && exp.achievements.length > 0 ? `
                            <ul style="margin: 0; padding-left: 1.2rem; color: var(--secondary-text);">
                                ${exp.achievements.map((achievement: any) => `<li>${achievement}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <span class="emoji">🚀</span>
                <h2>프로젝트</h2>
            </div>
            <div class="two-column">
                ${(data.projects || []).map((project: any) => `
                    <div class="card">
                        <h3>${project.name}</h3>
                        <p style="margin-bottom: 0.75rem;">${project.description}</p>
                        ${project.role ? `<p style="color: var(--secondary-text); font-weight: 500; margin-bottom: 0.5rem;">역할: ${project.role}</p>` : ''}
                        ${project.results && project.results.length > 0 ? `
                            <div style="margin-bottom: 0.75rem;">
                                <p style="color: var(--secondary-color); font-weight: 500; margin-bottom: 0.25rem;">주요 성과:</p>
                                <ul style="margin: 0; padding-left: 1.2rem; color: var(--secondary-text);">
                                    ${project.results.map((result: any) => `<li>${result}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${project.tech && project.tech.length > 0 ? `
                            <div class="skill-tags">
                                ${project.tech.map((tech: any) => 
                                    `<span class="skill-tag">${tech}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                        ${(project.url || project.github || project.demo) ? `
                            <div style="margin-top: 1rem;">
                                ${project.url ? `<a href="${project.url}" target="_blank" style="color: var(--accent-color); text-decoration: none; margin-right: 1rem;">🔗 사이트</a>` : ''}
                                ${project.github ? `<a href="${project.github}" target="_blank" style="color: var(--accent-color); text-decoration: none; margin-right: 1rem;">📦 GitHub</a>` : ''}
                                ${project.demo ? `<a href="${project.demo}" target="_blank" style="color: var(--accent-color); text-decoration: none;">🎬 데모</a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        
        ${data.awards && data.awards.length > 0 ? `
        <section class="section">
            <div class="section-header">
                <span class="emoji">🏆</span>
                <h2>수상/자격증</h2>
            </div>
            <div class="timeline">
                ${data.awards.map((award: any) => `
                    <div class="timeline-item">
                        <h3>${award.title}</h3>
                        <p style="color: var(--secondary-text); margin-bottom: 0.5rem;">
                            ${award.organization} • ${award.date}
                        </p>
                        ${award.description ? `<p>${award.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${data.certifications && data.certifications.length > 0 ? `
        <section class="section">
            <div class="section-header">
                <span class="emoji">📜</span>
                <h2>자격증</h2>
            </div>
            <div class="skill-tags">
                ${data.certifications.map((cert: any) => 
                    `<span class="skill-tag">${cert}</span>`
                ).join('')}
            </div>
        </section>
        ` : ''}
    </div>
</body>
</html>
    `
};

// Template 2: Geon Lee - Professional Grid Layout
export const geonTemplate: PortfolioTemplate = {
    id: 'geon-professional',
    name: '기업형',
    description: '기업 카드 디자인과 깔끔한 그리드 레이아웃',
    thumbnail: '/templates/geon.png',
    author: 'Geon Lee',
    designSystem: {
        colors: {
            primary: '#2c3e50',
            secondary: '#7f8c8d',
            background: '#ffffff',
            text: '#2c3e50',
            accent: '#3498db',
            border: '#ecf0f1'
        },
        darkMode: {
            background: '#202020',
            text: '#ecf0f1',
            accent: '#5dade2',
            border: '#34495e'
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            headingSize: '2.25rem',
            bodySize: '1rem',
            lineHeight: '1.7'
        },
        layout: {
            maxWidth: '1200px',
            padding: '3rem',
            sectionGap: '3rem',
            columnGap: '2.5rem'
        }
    },
    features: ['사이드바', '그리드 레이아웃', '프로페셔널', '구조화된 섹션'],
    sampleData: {
        name: '김포트폴리오',
        title: '풀스택 개발자',
        contact: {
            email: 'portfolio@example.com',
            github: 'github.com/portfolio',
            blog: 'portfolio.blog.com',
            linkedin: 'linkedin.com/in/portfolio'
        },
        about: '안녕하세요, 창의적이고 열정적인 풀스택 개발자입니다. 사용자 중심의 웹 서비스 개발에 전문성을 가지고 있으며, 최신 기술 트렌드를 적극적으로 학습하고 적용합니다. 효율적인 코드 작성과 팀워크를 통해 가치 있는 서비스를 만들어가겠습니다.',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
        skillCategories: [
            {
                category: '언어',
                skills: ['JavaScript', 'TypeScript', 'Python', 'Java'],
                icon: '💻'
            },
            {
                category: '프레임워크',
                skills: ['React', 'Vue.js', 'Node.js', 'Spring'],
                icon: '🔧'
            }
        ],
        experience: [
            {
                position: 'Senior Developer',
                company: '테크 회사',
                duration: '2021 ~ 현재',
                description: '풀스택 개발 및 팀 리딩',
                achievements: ['프로젝트 성공적 완료', '팀 생산성 향상']
            }
        ],
        projects: [
            {
                name: '프로페셔널 플랫폼',
                description: '기업용 솔루션 개발',
                tech: ['React', 'Node.js', 'PostgreSQL'],
                role: '풀스택 개발자',
                results: ['사용자 만족도 95%', '성능 최적화 완료']
            }
        ],
        education: [
            {
                degree: '컴퓨터공학 석사',
                school: '카이스트',
                year: '2018-2020'
            }
        ]
    },
    generateHTML: (data: any) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name || 'Portfolio'} - Professional</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --bg-color: #ffffff;
            --sidebar-bg: #f9f8f7;
            --text-color: #2c3e50;
            --secondary-text: #7f8c8d;
            --border-color: #ecf0f1;
            --accent-color: #3498db;
            --card-bg: #ffffff;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1a1a1a;
                --sidebar-bg: #202020;
                --text-color: #ecf0f1;
                --secondary-text: #95a5a6;
                --border-color: #34495e;
                --accent-color: #5dade2;
                --card-bg: #2c2c2c;
            }
        }
        
        body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.7;
        }
        
        .layout {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 280px;
            background: var(--sidebar-bg);
            padding: 3rem 2rem;
            border-right: 1px solid var(--border-color);
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }
        
        .main-content {
            flex: 1;
            margin-left: 280px;
            padding: 3rem;
            max-width: 1200px;
        }
        
        @media (max-width: 968px) {
            .layout {
                flex-direction: column;
            }
            .sidebar {
                position: relative;
                width: 100%;
                height: auto;
                border-right: none;
                border-bottom: 1px solid var(--border-color);
            }
            .main-content {
                margin-left: 0;
            }
        }
        
        .profile-section {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .profile-image {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: var(--accent-color);
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: white;
        }
        
        .profile-section h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }
        
        .profile-section .title {
            color: var(--secondary-text);
            margin-bottom: 1rem;
        }
        
        .nav-menu {
            list-style: none;
            margin-top: 2rem;
        }
        
        .nav-menu li {
            margin-bottom: 0.5rem;
        }
        
        .nav-menu a {
            display: block;
            padding: 0.75rem 1rem;
            color: var(--text-color);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .nav-menu a:hover {
            background: var(--accent-color);
            color: white;
        }
        
        .section {
            margin-bottom: 4rem;
        }
        
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 3px solid var(--accent-color);
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 2rem;
            transition: all 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            border-color: var(--accent-color);
        }
        
        .card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: var(--accent-color);
        }
        
        .card .meta {
            color: var(--secondary-text);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1.5rem;
        }
        
        .tech-badge {
            background: var(--accent-color);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .progress-bar {
            background: var(--border-color);
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--accent-color);
            border-radius: 4px;
            transition: width 1s ease;
        }
    </style>
</head>
<body>
    <div class="layout">
        <aside class="sidebar">
            <div class="profile-section">
                <div class="profile-image">
                    ${data.initials || 'GL'}
                </div>
                <h1>${data.name || 'Geon Lee'}</h1>
                <p class="title">${data.title || 'Software Engineer'}</p>
                <p>${data.location || 'Seoul, Korea'}</p>
            </div>
            
            <nav>
                <ul class="nav-menu">
                    <li><a href="#about">개인소개</a></li>
                    <li><a href="#skills">스킬셋</a></li>
                    <li><a href="#experience">커리어/경력</a></li>
                    <li><a href="#projects">프로젝트</a></li>
                    <li><a href="#awards">수상/자격증</a></li>
                    <li><a href="#contact">연락처</a></li>
                </ul>
            </nav>
            
            <div class="contact-info">
                ${data.contact?.email ? `<p>📧 ${data.contact.email}</p>` : ''}
                ${data.contact?.github ? `<p>🔗 ${data.contact.github}</p>` : ''}
                ${data.contact?.blog ? `<p>📝 ${data.contact.blog}</p>` : ''}
                ${data.contact?.linkedin ? `<p>💼 ${data.contact.linkedin}</p>` : ''}
            </div>
        </aside>
        
        <main class="main-content">
            <section id="about" class="section">
                <h2 class="section-title">개인소개</h2>
                <p>${data.about || '안녕하세요, 백엔드와 데이터 처리에 강점을 가진 주니어 개발자입니다.'}</p>
            </section>
            
            <section id="skills" class="section">
                <h2 class="section-title">스킬셋</h2>
                <div class="grid">
                    ${(data.skillCategories || []).map((category: any) => `
                        <div class="card">
                            <h3>${category.icon || '•'} ${category.category}</h3>
                            <div class="tech-stack">
                                ${(category.skills || []).map((skill: any) => 
                                    `<span class="tech-badge">${skill}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <section id="experience" class="section">
                <h2 class="section-title">커리어/경력</h2>
                <div class="grid">
                    ${(data.experience || []).map((exp: any) => `
                        <div class="card">
                            <h3>${exp.position}</h3>
                            <p class="meta">${exp.company} | ${exp.duration}</p>
                            <p style="margin-bottom: 1rem;">${exp.description}</p>
                            ${exp.achievements && exp.achievements.length > 0 ? `
                                <div>
                                    <h4 style="color: var(--accent-color); margin-bottom: 0.5rem;">주요 성과</h4>
                                    <ul style="margin: 0; padding-left: 1.2rem;">
                                        ${exp.achievements.map((achievement: any) => `<li>${achievement}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <section id="projects" class="section">
                <h2 class="section-title">프로젝트</h2>
                <div class="grid">
                    ${(data.projects || []).map((project: any) => `
                        <div class="card">
                            <h3>${project.name}</h3>
                            <p style="margin-bottom: 1rem;">${project.description}</p>
                            ${project.role ? `<p style="color: var(--secondary-text); font-weight: 500; margin-bottom: 0.5rem;">역할: ${project.role}</p>` : ''}
                            ${project.results && project.results.length > 0 ? `
                                <div style="margin-bottom: 1rem;">
                                    <h4 style="color: var(--accent-color); margin-bottom: 0.5rem;">주요 성과</h4>
                                    <ul style="margin: 0; padding-left: 1.2rem;">
                                        ${project.results.map((result: any) => `<li>${result}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            ${project.tech && project.tech.length > 0 ? `
                                <div class="tech-stack">
                                    ${project.tech.map((tech: any) => 
                                        `<span class="tech-badge">${tech}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                            ${(project.url || project.github || project.demo) ? `
                                <div style="margin-top: 1rem;">
                                    ${project.url ? `<a href="${project.url}" target="_blank" style="color: var(--accent-color); text-decoration: none; margin-right: 1rem;">🔗 사이트</a>` : ''}
                                    ${project.github ? `<a href="${project.github}" target="_blank" style="color: var(--accent-color); text-decoration: none; margin-right: 1rem;">📦 GitHub</a>` : ''}
                                    ${project.demo ? `<a href="${project.demo}" target="_blank" style="color: var(--accent-color); text-decoration: none;">🎬 데모</a>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
            
            ${data.awards && data.awards.length > 0 ? `
            <section id="awards" class="section">
                <h2 class="section-title">수상/자격증</h2>
                <div class="grid">
                    ${data.awards.map((award: any) => `
                        <div class="card">
                            <h3>${award.title}</h3>
                            <p class="meta">${award.organization} | ${award.date}</p>
                            ${award.description ? `<p>${award.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}
        </main>
    </div>
</body>
</html>
    `
};

// Template 3: Eunseong - Colorful Cards
export const eunseongTemplate: PortfolioTemplate = {
    id: 'eunseong-colorful',
    name: '활기찬',
    description: '하늘색 배경과 이모지 아이콘의 컬러풀 레이아웃',
    thumbnail: '/templates/eunseong.png',
    author: 'Eunseong',
    designSystem: {
        colors: {
            primary: '#5B47E0',
            secondary: '#8B7FE8',
            background: '#F8F9FE',
            text: '#2D3748',
            accent: '#FF6B6B',
            border: '#E2E8F0'
        },
        darkMode: {
            background: '#1A202C',
            text: '#F7FAFC',
            accent: '#FF8787',
            border: '#2D3748'
        },
        typography: {
            fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
            headingSize: '2.5rem',
            bodySize: '1.05rem',
            lineHeight: '1.75'
        },
        layout: {
            maxWidth: '1100px',
            padding: '2.5rem',
            sectionGap: '3.5rem',
            columnGap: '2rem'
        }
    },
    features: ['컬러풀 카드', '그라디언트', '이모지 아이콘', '애니메이션'],
    sampleData: {
        name: '김포트폴리오',
        title: '풀스택 개발자',
        contact: {
            email: 'portfolio@example.com',
            github: 'github.com/portfolio',
            blog: 'portfolio.blog.com',
            linkedin: 'linkedin.com/in/portfolio'
        },
        about: '안녕하세요, 창의적이고 열정적인 풀스택 개발자입니다. 사용자 중심의 웹 서비스 개발에 전문성을 가지고 있으며, 최신 기술 트렌드를 적극적으로 학습하고 적용합니다. 효율적인 코드 작성과 팀워크를 통해 가치 있는 서비스를 만들어가겠습니다.',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
        skillCategories: [
            {
                category: '프론트엔드',
                skills: ['React', 'Vue.js', 'TypeScript', 'CSS'],
                icon: '🎨'
            },
            {
                category: '디자인',
                skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
                icon: '✨'
            }
        ],
        experience: [
            {
                position: 'Frontend Developer',
                company: '디자인 스튜디오',
                duration: '2022 ~ 현재',
                description: '사용자 경험 중심의 프론트엔드 개발',
                achievements: ['UI/UX 개선으로 사용자 만족도 증가', '성능 최적화 달성']
            }
        ],
        projects: [
            {
                name: '컬러풀 포트폴리오',
                description: '창의적이고 인터랙티브한 포트폴리오 사이트',
                tech: ['React', 'Framer Motion', 'Styled Components'],
                role: '프론트엔드 개발자',
                results: ['월 방문자 5000명 달성', '디자인 어워드 수상']
            }
        ],
        education: [
            {
                degree: '디자인학과 학사',
                school: '홍익대학교',
                year: '2018-2022'
            }
        ]
    },
    generateHTML: (data: any) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name || 'Portfolio'} - Colorful</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #5B47E0;
            --secondary: #8B7FE8;
            --bg-color: #F8F9FE;
            --text-color: #2D3748;
            --card-bg: #ffffff;
            --accent-1: #FF6B6B;
            --accent-2: #4ECDC4;
            --accent-3: #45B7FF;
            --accent-4: #FFA45B;
            --border-color: #E2E8F0;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1A202C;
                --text-color: #F7FAFC;
                --card-bg: #2D3748;
                --accent-1: #FF8787;
                --accent-2: #6EE7E0;
                --accent-3: #6FC9FF;
                --accent-4: #FFB97A;
                --border-color: #4A5568;
            }
        }
        
        body {
            font-family: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.75;
        }
        
        .hero {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            padding: 6rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 20s infinite linear;
        }
        
        @keyframes float {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            animation: fadeInUp 0.8s ease;
        }
        
        .hero .subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.95;
            animation: fadeInUp 0.8s ease 0.2s backwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }
        
        .section {
            margin-bottom: 4rem;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2.5rem;
        }
        
        .section-emoji {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
        }
        
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-color);
        }
        
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
        }
        
        .card {
            background: var(--card-bg);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid var(--border-color);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-1), var(--accent-2), var(--accent-3));
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(91, 71, 224, 0.15);
        }
        
        .card:hover::before {
            transform: scaleX(1);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .card-icon {
            width: 40px;
            height: 40px;
            background: var(--accent-1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        .card h3 {
            font-size: 1.4rem;
            font-weight: 600;
            flex: 1;
        }
        
        .card-meta {
            color: var(--secondary);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1.5rem;
        }
        
        .tag {
            padding: 0.4rem 1rem;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
            color: white;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .skill-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
        }
        
        .skill-item {
            background: var(--card-bg);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .skill-item:hover {
            border-color: var(--primary);
            transform: scale(1.05);
        }
        
        .skill-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: var(--card-bg);
            border-radius: 12px;
            border: 1px solid var(--border-color);
            text-decoration: none;
            color: var(--text-color);
            transition: all 0.3s ease;
        }
        
        .contact-item:hover {
            background: var(--primary);
            color: white;
            transform: translateX(10px);
        }
    </style>
</head>
<body>
    <header class="hero">
        <div class="hero-content">
            <h1>👩🏻‍💻 ${data.name || 'Eunseong'}</h1>
            <p class="subtitle">${data.title || 'Creative Developer'}</p>
            <p>${data.description || 'Building colorful and engaging digital experiences'}</p>
        </div>
    </header>
    
    <div class="container">
        <section class="section">
            <div class="section-header">
                <div class="section-emoji">🎨</div>
                <h2 class="section-title">About Me</h2>
            </div>
            <div class="card">
                <p>${data.about || 'Creative developer passionate about building beautiful and functional applications with modern technologies.'}</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <div class="section-emoji" style="background: linear-gradient(135deg, var(--accent-2), var(--accent-3));">
                    💼
                </div>
                <h2 class="section-title">Experience</h2>
            </div>
            <div class="cards-grid">
                ${(data.experience || []).map((exp: any, index: any) => `
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: var(--accent-${(index % 4) + 1});">
                                🏢
                            </div>
                            <h3>${exp.position}</h3>
                        </div>
                        <p class="card-meta">${exp.company} • ${exp.duration}</p>
                        <p>${exp.description}</p>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <div class="section-emoji" style="background: linear-gradient(135deg, var(--accent-3), var(--accent-4));">
                    🚀
                </div>
                <h2 class="section-title">Projects</h2>
            </div>
            <div class="cards-grid">
                ${(data.projects || []).map((project: any, index: any) => `
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: var(--accent-${(index % 4) + 1});">
                                💡
                            </div>
                            <h3>${project.name}</h3>
                        </div>
                        <p>${project.description}</p>
                        <div class="tags">
                            ${(project.tech || []).map((tech: any) => 
                                `<span class="tag">${tech}</span>`
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <div class="section-emoji" style="background: linear-gradient(135deg, var(--accent-4), var(--accent-1));">
                    🛠
                </div>
                <h2 class="section-title">Skills</h2>
            </div>
            <div class="skill-grid">
                ${(data.skills || []).map((skill: any) => `
                    <div class="skill-item">
                        <div class="skill-icon">⚡</div>
                        <p>${skill}</p>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <div class="section-emoji" style="background: linear-gradient(135deg, var(--accent-1), var(--accent-4));">
                    📬
                </div>
                <h2 class="section-title">Contact</h2>
            </div>
            <div class="contact-grid">
                ${data.email ? `
                    <a href="mailto:${data.email}" class="contact-item">
                        <span>📧</span>
                        <span>Email</span>
                    </a>
                ` : ''}
                ${data.github ? `
                    <a href="${data.github}" class="contact-item">
                        <span>🐙</span>
                        <span>GitHub</span>
                    </a>
                ` : ''}
                ${data.linkedin ? `
                    <a href="${data.linkedin}" class="contact-item">
                        <span>💼</span>
                        <span>LinkedIn</span>
                    </a>
                ` : ''}
            </div>
        </section>
    </div>
</body>
</html>
    `
};

// Template 4: IU Style - Elegant and Modern
export const iuTemplate: PortfolioTemplate = {
    id: 'iu-elegant',
    name: '우아한',
    description: '보라색 그라데이션과 우아한 레이아웃',
    thumbnail: '/templates/iu.png',
    author: 'IU Style',
    designSystem: {
        colors: {
            primary: '#8B5CF6',
            secondary: '#A78BFA',
            background: '#FAFAFA',
            text: '#1F2937',
            accent: '#EC4899',
            border: '#E5E7EB'
        },
        darkMode: {
            background: '#111827',
            text: '#F9FAFB',
            accent: '#F472B6',
            border: '#374151'
        },
        typography: {
            fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
            headingSize: '2.75rem',
            bodySize: '1.1rem',
            lineHeight: '1.8'
        },
        layout: {
            maxWidth: '1000px',
            padding: '3rem',
            sectionGap: '5rem',
            columnGap: '3rem'
        }
    },
    features: ['우아한 타이포그래피', '미니멀', '파스텔 색상', '부드러운 애니메이션'],
    sampleData: {
        name: '김포트폴리오',
        title: '풀스택 개발자',
        contact: {
            email: 'portfolio@example.com',
            github: 'github.com/portfolio',
            blog: 'portfolio.blog.com',
            linkedin: 'linkedin.com/in/portfolio'
        },
        about: '안녕하세요, 혁신적인 기술과 창의적인 솔루션으로 문제를 해결하는 풀스택 개발자입니다.',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
        skillCategories: [
            {
                category: 'Frontend',
                skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
                icon: '🎨'
            },
            {
                category: 'Backend',
                skills: ['Node.js', 'Python', 'Express', 'FastAPI'],
                icon: '💻'
            },
            {
                category: 'DevOps',
                skills: ['AWS', 'Docker', 'CI/CD', 'Kubernetes'],
                icon: '☁️'
            }
        ],
        experience: [
            {
                position: '시니어 풀스택 개발자',
                company: '테크 이노베이션',
                duration: '2021 ~ 현재',
                description: '웹 애플리케이션 개발 및 시스템 아키텍처 설계',
                achievements: ['서비스 성능 40% 향상', '코드 품질 개선']
            },
            {
                position: '프론트엔드 개발자',
                company: '스타트업 솔루션',
                duration: '2019 ~ 2021',
                description: 'React 기반 사용자 인터페이스 개발',
                achievements: ['사용자 경험 개선', '개발 효율성 증대']
            }
        ],
        projects: [
            {
                name: '이커머스 플랫폼',
                description: '현대적인 온라인 쇼핑몰 구축',
                tech: ['React', 'TypeScript', 'Node.js', 'AWS'],
                role: '풀스택 개발자',
                results: ['월 매출 200% 증가', '사용자 만족도 95%']
            },
            {
                name: '데이터 분석 대시보드',
                description: '실시간 비즈니스 인텔리전스 도구',
                tech: ['Python', 'React', 'D3.js', 'PostgreSQL'],
                role: '백엔드 & 프론트엔드 개발자',
                results: ['데이터 처리 속도 60% 향상', '의사결정 시간 단축']
            }
        ],
        education: [
            {
                degree: '컴퓨터공학과 학사',
                school: '서울대학교',
                year: '2015-2019'
            }
        ]
    },
    generateHTML: (data: any) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name || 'Portfolio'} - Elegant</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #8B5CF6;
            --secondary: #A78BFA;
            --bg-color: #FAFAFA;
            --text-color: #1F2937;
            --light-text: #6B7280;
            --accent: #EC4899;
            --border-color: #E5E7EB;
            --card-bg: #FFFFFF;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #111827;
                --text-color: #F9FAFB;
                --light-text: #9CA3AF;
                --accent: #F472B6;
                --border-color: #374151;
                --card-bg: #1F2937;
            }
        }
        
        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.8;
            font-weight: 300;
        }
        
        .wrapper {
            max-width: 1000px;
            margin: 0 auto;
            padding: 3rem;
        }
        
        .hero {
            text-align: center;
            padding: 5rem 0;
            position: relative;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
            opacity: 0.1;
            filter: blur(60px);
            z-index: -1;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient 3s ease infinite;
        }
        
        @keyframes gradient {
            0%, 100% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(30deg); }
        }
        
        .hero .subtitle {
            font-size: 1.5rem;
            color: var(--light-text);
            margin-bottom: 2rem;
            font-weight: 400;
        }
        
        .hero-description {
            max-width: 600px;
            margin: 0 auto 3rem;
            color: var(--text-color);
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
        }
        
        .social-link {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: var(--text-color);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 1.2rem;
        }
        
        .social-link:hover {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            border-color: transparent;
            transform: translateY(-5px) scale(1.1);
        }
        
        .section {
            margin-bottom: 5rem;
        }
        
        .section-title {
            font-size: 2.25rem;
            font-weight: 500;
            margin-bottom: 3rem;
            text-align: center;
            position: relative;
            padding-bottom: 1rem;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            border-radius: 2px;
        }
        
        .timeline {
            position: relative;
            padding-left: 3rem;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(180deg, var(--primary), var(--accent));
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 3rem;
            animation: slideIn 0.6s ease backwards;
        }
        
        .timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .timeline-item:nth-child(3) { animation-delay: 0.3s; }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -39px;
            top: 5px;
            width: 12px;
            height: 12px;
            background: var(--card-bg);
            border: 3px solid var(--primary);
            border-radius: 50%;
        }
        
        .timeline-content {
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
        }
        
        .timeline-content:hover {
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.1);
            transform: translateX(10px);
        }
        
        .timeline-content h3 {
            font-size: 1.5rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: var(--primary);
        }
        
        .timeline-content .meta {
            color: var(--light-text);
            font-size: 0.95rem;
            margin-bottom: 1rem;
        }
        
        .project-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
        }
        
        .project-card {
            background: var(--card-bg);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .project-card:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
        }
        
        .project-image {
            height: 200px;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: white;
        }
        
        .project-content {
            padding: 2rem;
        }
        
        .project-content h3 {
            font-size: 1.5rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        
        .tech-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }
        
        .tech-pill {
            padding: 0.5rem 1.25rem;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 400;
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }
        
        .skill-category {
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid var(--border-color);
        }
        
        .skill-category h3 {
            font-size: 1.25rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
            color: var(--primary);
        }
        
        .skill-list {
            list-style: none;
        }
        
        .skill-list li {
            padding: 0.5rem 0;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .skill-list li::before {
            content: '✨';
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <header class="hero">
            <h1>${data.name || 'IU'}</h1>
            <p class="subtitle">${data.title || 'Creative Developer & Designer'}</p>
            <p class="hero-description">
                ${data.description || 'Crafting elegant digital experiences with passion and precision'}
            </p>
            <div class="social-links">
                ${data.email ? `<a href="mailto:${data.email}" class="social-link">✉️</a>` : ''}
                ${data.github ? `<a href="${data.github}" class="social-link">🐱</a>` : ''}
                ${data.linkedin ? `<a href="${data.linkedin}" class="social-link">💼</a>` : ''}
            </div>
        </header>
        
        <section class="section">
            <h2 class="section-title">Experience</h2>
            <div class="timeline">
                ${(data.experience || []).map((exp: any) => `
                    <div class="timeline-item">
                        <div class="timeline-content">
                            <h3>${exp.position}</h3>
                            <p class="meta">${exp.company} • ${exp.duration}</p>
                            <p>${exp.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <h2 class="section-title">Projects</h2>
            <div class="project-grid">
                ${(data.projects || []).map((project: any) => `
                    <div class="project-card">
                        <div class="project-image">
                            🎨
                        </div>
                        <div class="project-content">
                            <h3>${project.name}</h3>
                            <p>${project.description}</p>
                            <div class="tech-pills">
                                ${(project.tech || []).map((tech: any) => 
                                    `<span class="tech-pill">${tech}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-container">
                ${(data.skillCategories || [
                    { name: 'Frontend', skills: data.skills?.slice(0, 4) || [] },
                    { name: 'Backend', skills: data.skills?.slice(4, 8) || [] },
                    { name: 'Tools', skills: data.skills?.slice(8) || [] }
                ]).map((category: any) => `
                    <div class="skill-category">
                        <h3>${category.name}</h3>
                        <ul class="skill-list">
                            ${(category.skills || []).map((skill: any) => 
                                `<li>${typeof skill === 'string' ? skill : skill.name}</li>`
                            ).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </section>
    </div>
</body>
</html>
    `
};

export const portfolioTemplates: Record<TemplateType, PortfolioTemplate> = {
    james: jamesTemplate,
    geon: geonTemplate,
    eunseong: eunseongTemplate,
    iu: iuTemplate
};