// Improved Portfolio Templates 2024

interface GenerationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'presentation' | 'document' | 'web' | 'notion';
  format: 'pptx' | 'html' | 'markdown' | 'json';
  targetAudience?: 'recruiter' | 'technical' | 'executive' | 'general';
  template: string;
  styles?: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
    layout?: string;
  };
}

export const improvedDeveloperTemplate: GenerationTemplate = {
  id: 'improved-modern-dev',
  name: '모던 개발자 (개선판)',
  description: '2024년 웹 디자인 트렌드를 반영한 깔끔하고 전문적인 템플릿',
  category: 'presentation' as const,
  format: 'html' as const,
  targetAudience: 'technical' as const,
  template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Portfolio</title>
    <style>
        /* 리셋 및 기본 설정 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #333;
            background: #ffffff;
            font-size: 16px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 24px;
        }
        
        /* 타이포그래피 */
        h1, h2, h3 {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 1rem;
        }
        
        h1 { font-size: 2.5rem; line-height: 1.2; }
        h2 { font-size: 1.75rem; line-height: 1.3; }
        h3 { font-size: 1.25rem; line-height: 1.4; }
        
        p {
            margin-bottom: 1rem;
            color: #555;
        }
        
        /* 헤더 */
        .header {
            padding: 80px 0 60px;
            text-align: center;
            border-bottom: 1px solid #e8e8e8;
        }
        
        .header h1 {
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            font-size: 1.125rem;
            color: #666;
            margin-bottom: 2rem;
            font-weight: 400;
        }
        
        .contact-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        
        .contact-link {
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }
        
        .contact-link:hover {
            border-color: #0066cc;
        }
        
        /* 섹션 공통 */
        .section {
            padding: 60px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .section:last-child {
            border-bottom: none;
        }
        
        .section-title {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            color: #1a1a1a;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 40px;
            height: 3px;
            background: #0066cc;
        }
        
        /* About 섹션 */
        .about-content {
            font-size: 1.1rem;
            line-height: 1.8;
            max-width: 700px;
        }
        
        /* Experience 섹션 */
        .experience-item {
            margin-bottom: 3rem;
            border-left: 3px solid #0066cc;
            padding-left: 2rem;
        }
        
        .experience-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        
        .company-info h3 {
            margin-bottom: 0.25rem;
        }
        
        .position {
            color: #666;
            font-size: 1rem;
        }
        
        .duration {
            color: #888;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .impact {
            font-weight: 600;
            color: #0066cc;
            margin-bottom: 1rem;
            font-size: 1.05rem;
        }
        
        .achievements {
            list-style: none;
            margin-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 0.5rem;
            color: #555;
        }
        
        .achievements li::before {
            content: '▶';
            position: absolute;
            left: 0;
            color: #0066cc;
            font-size: 0.8rem;
        }
        
        .tech-tags {
            margin-top: 1rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            background: #f8f9fa;
            color: #495057;
            padding: 0.25rem 0.75rem;
            border-radius: 16px;
            font-size: 0.875rem;
            border: 1px solid #e9ecef;
        }
        
        /* Projects 섹션 */
        .projects-grid {
            display: grid;
            gap: 2rem;
        }
        
        .project-item {
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 2rem;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        .project-item:hover {
            border-color: #0066cc;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .project-header {
            margin-bottom: 1rem;
        }
        
        .project-title {
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }
        
        .project-role {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .project-description {
            margin-bottom: 1.5rem;
            color: #555;
        }
        
        .project-links {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .project-link {
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
            border: 1px solid #0066cc;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            transition: background-color 0.2s ease, color 0.2s ease;
        }
        
        .project-link:hover {
            background: #0066cc;
            color: white;
        }
        
        /* Skills 섹션 */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
        }
        
        .skill-category {
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 1.5rem;
        }
        
        .skill-category h3 {
            color: #1a1a1a;
            margin-bottom: 1rem;
        }
        
        .skill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .skill-item {
            background: #0066cc;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 16px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .skill-description {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 40px 0;
            color: #888;
            font-size: 0.9rem;
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
            .container {
                padding: 0 16px;
            }
            
            .header {
                padding: 40px 0 30px;
            }
            
            .section {
                padding: 40px 0;
            }
            
            .experience-header {
                flex-direction: column;
            }
            
            .duration {
                margin-top: 0.5rem;
            }
            
            .experience-item {
                padding-left: 1rem;
            }
            
            h1 { font-size: 2rem; }
            h2 { font-size: 1.5rem; }
            h3 { font-size: 1.125rem; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <h1>{{name}}</h1>
            <div class="subtitle">{{oneLinerPitch}}</div>
            <div class="contact-links">
                {{#email}}<a href="mailto:{{email}}" class="contact-link">{{email}}</a>{{/email}}
                {{#github}}<a href="{{github}}" class="contact-link">GitHub</a>{{/github}}
                {{#linkedin}}<a href="{{linkedin}}" class="contact-link">LinkedIn</a>{{/linkedin}}
                {{#phone}}<a href="tel:{{phone}}" class="contact-link">{{phone}}</a>{{/phone}}
            </div>
        </div>
    </header>
    
    <!-- About -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">About</h2>
            <div class="about-content">
                <p>{{summary}}</p>
            </div>
        </div>
    </section>
    
    <!-- Experience -->
    {{#experiences.length}}
    <section class="section">
        <div class="container">
            <h2 class="section-title">Experience</h2>
            {{#experiences}}
            <div class="experience-item">
                <div class="experience-header">
                    <div class="company-info">
                        <h3>{{company}}</h3>
                        <div class="position">{{position}}</div>
                    </div>
                    <div class="duration">{{duration}}</div>
                </div>
                {{#impact}}<div class="impact">{{impact}}</div>{{/impact}}
                <ul class="achievements">
                    {{#achievements}}
                    <li>{{.}}</li>
                    {{/achievements}}
                </ul>
                {{#technologies.length}}
                <div class="tech-tags">
                    {{#technologies}}
                    <span class="tech-tag">{{.}}</span>
                    {{/technologies}}
                </div>
                {{/technologies.length}}
            </div>
            {{/experiences}}
        </div>
    </section>
    {{/experiences.length}}
    
    <!-- Projects -->
    {{#projects.length}}
    <section class="section">
        <div class="container">
            <h2 class="section-title">Projects</h2>
            <div class="projects-grid">
                {{#projects}}
                <div class="project-item">
                    <div class="project-header">
                        <h3 class="project-title">{{name}}</h3>
                        {{#myRole}}<div class="project-role">{{myRole}}</div>{{/myRole}}
                    </div>
                    <p class="project-description">{{summary}}</p>
                    {{#achievements.length}}
                    <ul class="achievements">
                        {{#achievements}}
                        <li>{{.}}</li>
                        {{/achievements}}
                    </ul>
                    {{/achievements.length}}
                    {{#technologies.length}}
                    <div class="tech-tags">
                        {{#technologies}}
                        <span class="tech-tag">{{.}}</span>
                        {{/technologies}}
                    </div>
                    {{/technologies.length}}
                    {{#github}}
                    <div class="project-links">
                        <a href="{{github}}" class="project-link">GitHub</a>
                    </div>
                    {{/github}}
                </div>
                {{/projects}}
            </div>
        </div>
    </section>
    {{/projects.length}}
    
    <!-- Skills -->
    {{#skills.length}}
    <section class="section">
        <div class="container">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                {{#skills}}
                <div class="skill-category">
                    <h3>{{category}}</h3>
                    <div class="skill-list">
                        {{#skills}}
                        <span class="skill-item">{{value}}</span>
                        {{/skills}}
                    </div>
                    {{#experience}}<div class="skill-description">{{experience}}</div>{{/experience}}
                </div>
                {{/skills}}
            </div>
        </div>
    </section>
    {{/skills.length}}
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p>© {{timestamp}} {{name}}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`,
  styles: {
    primaryColor: '#0066cc',
    secondaryColor: '#0052a3',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI"',
    layout: 'clean'
  }
};

export const improvedPlannerTemplate: GenerationTemplate = {
  id: 'improved-planner',
  name: '서비스 기획자 (개선판)',
  description: '2024년 디자인 트렌드를 반영한 서비스 기획자용 템플릿',
  category: 'presentation' as const,
  format: 'html' as const,
  targetAudience: 'general' as const,
  template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Service Planner Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #2d3436;
            background: #ffffff;
            font-size: 16px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 24px;
        }
        
        /* 타이포그래피 */
        h1, h2, h3 {
            font-weight: 700;
            color: #2d3436;
            margin-bottom: 1rem;
        }
        
        h1 { font-size: 2.75rem; line-height: 1.2; letter-spacing: -0.02em; }
        h2 { font-size: 2rem; line-height: 1.3; letter-spacing: -0.01em; }
        h3 { font-size: 1.5rem; line-height: 1.4; }
        
        /* 헤더 */
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 0;
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
            animation: pulse 10s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
            text-align: center;
        }
        
        .hero h1 {
            color: white;
            margin-bottom: 1rem;
            font-size: 3rem;
        }
        
        .hero-subtitle {
            font-size: 1.25rem;
            opacity: 0.95;
            max-width: 600px;
            margin: 0 auto 2rem;
        }
        
        .hero-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-top: 3rem;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        /* 섹션 */
        .section {
            padding: 80px 0;
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        
        .section-title {
            font-size: 2rem;
            margin-bottom: 1rem;
            position: relative;
            display: inline-block;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .section-subtitle {
            color: #74b9ff;
            font-size: 1.1rem;
        }
        
        /* 케이스 스터디 그리드 */
        .case-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        
        .case-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .case-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .case-image {
            height: 200px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
            font-weight: 700;
        }
        
        .case-content {
            padding: 2rem;
        }
        
        .case-title {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }
        
        .case-subtitle {
            color: #74b9ff;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .case-description {
            color: #636e72;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        
        .case-metrics {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .metric-tag {
            background: #f0f3ff;
            color: #667eea;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        
        /* 스킬 섹션 */
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }
        
        .skill-card {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            border: 2px solid #f0f0f0;
            transition: border-color 0.3s ease;
        }
        
        .skill-card:hover {
            border-color: #667eea;
        }
        
        .skill-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
        }
        
        .skill-title {
            font-size: 1.125rem;
            margin-bottom: 0.5rem;
        }
        
        .skill-items {
            color: #636e72;
            font-size: 0.9rem;
            line-height: 1.8;
        }
        
        /* Footer */
        .footer {
            background: #2d3436;
            color: white;
            padding: 60px 0;
            text-align: center;
        }
        
        .footer-content {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .footer h3 {
            color: white;
            margin-bottom: 1rem;
        }
        
        .footer p {
            color: #b2bec3;
            margin-bottom: 2rem;
        }
        
        .contact-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .contact-btn {
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
            transition: transform 0.2s ease;
        }
        
        .contact-btn:hover {
            transform: scale(1.05);
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
            .container {
                padding: 0 16px;
            }
            
            .hero {
                padding: 60px 0;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
            
            .hero-stats {
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .section {
                padding: 50px 0;
            }
            
            .case-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>{{name}}</h1>
                <p class="hero-subtitle">{{oneLinerPitch}}</p>
                <div class="hero-stats">
                    <div class="stat-item">
                        <div class="stat-number">{{projectCount}}+</div>
                        <div class="stat-label">프로젝트</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">{{experienceYears}}년</div>
                        <div class="stat-label">경력</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">{{impactScore}}%</div>
                        <div class="stat-label">성과 달성률</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- About Section -->
    <section class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">About Me</h2>
                <p class="section-subtitle">사용자 중심의 서비스를 기획합니다</p>
            </div>
            <div style="max-width: 700px; margin: 0 auto; text-align: center; color: #636e72; line-height: 1.8;">
                <p>{{summary}}</p>
            </div>
        </div>
    </section>
    
    <!-- Case Studies -->
    {{#projects.length}}
    <section class="section" style="background: #f8f9fa;">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Case Studies</h2>
                <p class="section-subtitle">주요 프로젝트 성과</p>
            </div>
            <div class="case-grid">
                {{#projects}}
                <div class="case-card">
                    <div class="case-image">{{projectIcon}}</div>
                    <div class="case-content">
                        <h3 class="case-title">{{name}}</h3>
                        <p class="case-subtitle">{{myRole}}</p>
                        <p class="case-description">{{summary}}</p>
                        <div class="case-metrics">
                            {{#metrics}}
                            <span class="metric-tag">{{.}}</span>
                            {{/metrics}}
                        </div>
                    </div>
                </div>
                {{/projects}}
            </div>
        </div>
    </section>
    {{/projects.length}}
    
    <!-- Skills Section -->
    {{#skills.length}}
    <section class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Skills & Tools</h2>
                <p class="section-subtitle">전문 역량</p>
            </div>
            <div class="skills-container">
                {{#skills}}
                <div class="skill-card">
                    <div class="skill-icon">{{skillIcon}}</div>
                    <h3 class="skill-title">{{category}}</h3>
                    <p class="skill-items">
                        {{#skills}}{{value}}{{^last}}, {{/last}}{{/skills}}
                    </p>
                </div>
                {{/skills}}
            </div>
        </div>
    </section>
    {{/skills.length}}
    
    <!-- Footer / Contact -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <h3>Let's Work Together</h3>
                <p>더 나은 서비스를 만들어갈 기회를 찾고 있습니다.</p>
                <div class="contact-buttons">
                    {{#email}}<a href="mailto:{{email}}" class="contact-btn">이메일 보내기</a>{{/email}}
                    {{#linkedin}}<a href="{{linkedin}}" class="contact-btn">LinkedIn</a>{{/linkedin}}
                    {{#portfolio}}<a href="{{portfolio}}" class="contact-btn">포트폴리오</a>{{/portfolio}}
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`,
  styles: {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    font: 'Pretendard, -apple-system',
    layout: 'modern'
  }
};

// Export all improved templates
export const improvedTemplates = [
  improvedDeveloperTemplate,
  improvedPlannerTemplate
];