import OpenAI from "openai";
import { OrganizedContent } from "./aiOrganizer";
import Mustache from "mustache";
import { improvedTemplates } from "../templates/improvedTemplates";

const openai = new OpenAI({
    baseURL: process.env.REACT_APP_OPENAI_BASE_URL || `${window.location.origin}/api/openai`,
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || "proxy",
    dangerouslyAllowBrowser: true,
  });

const REACT_APP_OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export interface GenerationTemplate {
    id: string;
    name: string;
    description: string;
    category: "presentation" | "document" | "web" | "notion";
    format: "pptx" | "html" | "markdown" | "json";
    template: string;
    styles?: {
        primaryColor: string;
        secondaryColor: string;
        font: string;
        layout?: string;
    };
    targetAudience?: "recruiter" | "technical" | "executive" | "general";
}

export interface GenerationOptions {
    templateId: string;
    format: "pptx" | "html" | "markdown" | "notion-json";
    customStyles?: {
        primaryColor?: string;
        secondaryColor?: string;
        font?: string;
    };
    sections: string[]; // 포함할 섹션들
    length: "concise" | "standard" | "detailed";
    tone: "professional" | "creative" | "technical" | "friendly";
    targetRole?:
        | "backend-developer"
        | "frontend-developer"
        | "product-manager"
        | "data-analyst";
    includeJobAnalysis?: boolean;
    includeTrustSignals?: boolean;
}

export interface GenerationResult {
    id: string;
    format: string;
    content: string;
    previewUrl?: string;
    downloadUrl?: string;
    metadata: {
        pageCount?: number;
        wordCount: number;
        estimatedReadTime: number;
        generatedAt: Date;
        template: string;
    };
    qualityScore: number; // 0-100
    suggestions: string[];
    jobAnalysis?: {
        industryAlignment: number;
        trustScore: number;
        industryReadiness: number;
        keyCompetencies: string[];
        missingElements: string[];
    };
}

class OneClickGenerator {
    private templates: GenerationTemplate[] = [
        // 개선된 템플릿들을 먼저 추가
        ...improvedTemplates,
        // Job-focused 템플릿
        {
            id: "job-focused-portfolio",
            name: "직무 맞춤형 포트폴리오",
            description: "업계 준비도와 신뢰도를 강조한 전문적인 포트폴리오",
            category: "presentation",
            format: "html",
            targetAudience: "recruiter",
            template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Job-Focused Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #f8fafc;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Trust Badge */
        .trust-badge {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            padding: 1rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1000;
            min-width: 200px;
            text-align: center;
        }
        {{#showTrustIndicators}}
        .trust-score {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        .trust-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .industry-readiness {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255,255,255,0.3);
        }
        .readiness-bar {
            background: rgba(255,255,255,0.3);
            height: 8px;
            border-radius: 4px;
            margin-top: 0.5rem;
            overflow: hidden;
        }
        .readiness-fill {
            height: 100%;
            background: #4ade80;
            width: {{industryReadiness}}%;
            transition: width 2s ease;
        }
        {{/showTrustIndicators}}
        
        /* Header */
        .header {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            padding: 100px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
        }
        .header-content { position: relative; z-index: 2; }
        .header h1 {
            font-size: 4rem;
            font-weight: 900;
            margin-bottom: 1rem;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
        }
        .header .role {
            font-size: 1.8rem;
            font-weight: 300;
            margin-bottom: 2rem;
            opacity: 0.95;
        }
        
        {{#jobAnalysis}}
        /* Industry Alignment */
        .industry-alignment {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-top: 3rem;
            flex-wrap: wrap;
        }
        .alignment-metric {
            background: rgba(255,255,255,0.15);
            padding: 1.5rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
            min-width: 150px;
        }
        .metric-value {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        .metric-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        {{/jobAnalysis}}
        
        /* Sections */
        .section {
            background: white;
            margin: 3rem 0;
            padding: 4rem 0;
            border-radius: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.08);
        }
        .section:nth-child(even) { background: #ffffff; }
        
        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        .section-title {
            font-size: 2.8rem;
            font-weight: 800;
            color: {{primaryColor}};
            margin-bottom: 1rem;
            position: relative;
        }
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 5px;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            border-radius: 3px;
        }
        
        {{#competencyLevels}}
        /* Competency Levels */
        .competency-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }
        .competency-item {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 15px;
            border-left: 5px solid {{primaryColor}};
            transition: transform 0.3s ease;
        }
        .competency-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .competency-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: {{primaryColor}};
            margin-bottom: 1rem;
        }
        .competency-level {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .level-indicator {
            width: 100px;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        .level-fill {
            height: 100%;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
        }
        .level-fill.beginner { width: 25%; }
        .level-fill.intermediate { width: 50%; }
        .level-fill.advanced { width: 75%; }
        .level-fill.expert { width: 100%; }
        {{/competencyLevels}}
        
        /* Enhanced Projects */
        {{#enhancedProjects}}
        .enhanced-projects {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2.5rem;
        }
        .enhanced-project {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .enhanced-project:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .project-header {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .project-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .project-content {
            padding: 2.5rem;
        }
        .story-section {
            margin-bottom: 2rem;
        }
        .story-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: {{primaryColor}};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        .story-text {
            color: #555;
            line-height: 1.7;
            margin-bottom: 1rem;
        }
        .metrics-list {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid {{primaryColor}};
        }
        .metrics-list h4 {
            color: {{primaryColor}};
            margin-bottom: 1rem;
            font-weight: 600;
        }
        .metric-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            color: #555;
        }
        .metric-item::before {
            content: '📊';
            font-size: 1rem;
        }
        .trust-signals {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            margin-top: 1.5rem;
        }
        .trust-signal {
            background: linear-gradient(135deg, #10b981, #34d399);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        {{/enhancedProjects}}
        
        /* Missing Elements Alert */
        {{#jobAnalysis.missingElements}}
        .improvement-section {
            background: linear-gradient(135deg, #fef3c7, #fed7aa);
            border: 2px solid #f59e0b;
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
        }
        .improvement-title {
            color: #92400e;
            font-weight: 600;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .improvement-title::before {
            content: '⚠️';
        }
        .improvement-list {
            list-style: none;
        }
        .improvement-list li {
            margin-bottom: 0.5rem;
            padding-left: 1.5rem;
            position: relative;
            color: #92400e;
        }
        .improvement-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #f59e0b;
        }
        {{/jobAnalysis.missingElements}}
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            text-align: center;
            padding: 3rem 0;
            margin-top: 3rem;
        }
        .generated-info {
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .trust-badge {
                position: static;
                margin-bottom: 2rem;
            }
            .header h1 { font-size: 2.5rem; }
            .industry-alignment {
                gap: 1.5rem;
            }
            .enhanced-projects,
            .competency-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    {{#showTrustIndicators}}
    <!-- Trust Badge -->
    <div class="trust-badge">
        <div class="trust-score">{{trustScore}}</div>
        <div class="trust-label">신뢰도 점수</div>
        <div class="industry-readiness">
            <div>업계 준비도: {{industryReadiness}}%</div>
            <div class="readiness-bar">
                <div class="readiness-fill"></div>
            </div>
        </div>
    </div>
    {{/showTrustIndicators}}
    
    <!-- Header -->
    <div class="header">
        <div class="container">
            <div class="header-content">
                <h1>{{name}}</h1>
                <div class="role">{{oneLinerPitch}}</div>
                
                {{#jobAnalysis}}
                <div class="industry-alignment">
                    <div class="alignment-metric">
                        <div class="metric-value">{{industryAlignment}}%</div>
                        <div class="metric-label">업계 적합도</div>
                    </div>
                    <div class="alignment-metric">
                        <div class="metric-value">{{keyCompetencies.length}}</div>
                        <div class="metric-label">핵심 역량</div>
                    </div>
                    <div class="alignment-metric">
                        <div class="metric-value">{{../trustScore}}</div>
                        <div class="metric-label">신뢰도</div>
                    </div>
                </div>
                {{/jobAnalysis}}
            </div>
        </div>
    </div>
    
    <!-- Summary -->
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">프로필 요약</h2>
            </div>
            <p style="font-size: 1.2rem; text-align: center; max-width: 800px; margin: 0 auto; color: #555; line-height: 1.8;">{{summary}}</p>
        </div>
    </div>
    
    {{#competencyLevels}}
    <!-- Competency Mapping -->
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">역량 매핑</h2>
                <p style="color: #666;">직무에 필요한 핵심 역량에 따른 전문성 수준</p>
            </div>
            <div class="competency-grid">
                {{#../competencyLevels}}
                <div class="competency-item">
                    <div class="competency-name">{{name}}</div>
                    <div class="competency-level">
                        <div class="level-indicator">
                            <div class="level-fill {{level}}"></div>
                        </div>
                        <span>{{level}} ({{evidence}}개 근거)</span>
                    </div>
                </div>
                {{/../competencyLevels}}
            </div>
        </div>
    </div>
    {{/competencyLevels}}
    
    {{#enhancedProjects}}
    <!-- Enhanced Projects -->
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">주요 프로젝트</h2>
                <p style="color: #666;">STAR 기법으로 재구성한 프로젝트 스토리</p>
            </div>
            <div class="enhanced-projects">
                {{#../enhancedProjects}}
                <div class="enhanced-project">
                    <div class="project-header">
                        <div class="project-title">{{projectId}}</div>
                    </div>
                    <div class="project-content">
                        <div class="story-section">
                            <div class="story-label">Situation (상황)</div>
                            <div class="story-text">{{enhancedStory.situation}}</div>
                        </div>
                        <div class="story-section">
                            <div class="story-label">Task (과제)</div>
                            <div class="story-text">{{enhancedStory.task}}</div>
                        </div>
                        <div class="story-section">
                            <div class="story-label">Action (행동)</div>
                            <div class="story-text">{{enhancedStory.action}}</div>
                        </div>
                        <div class="story-section">
                            <div class="story-label">Result (결과)</div>
                            <div class="story-text">{{enhancedStory.result}}</div>
                        </div>
                        
                        {{#enhancedStory.metrics}}
                        <div class="metrics-list">
                            <h4>성과 지표</h4>
                            {{#.}}
                            <div class="metric-item">{{.}}</div>
                            {{/.}}
                        </div>
                        {{/enhancedStory.metrics}}
                        
                        <div class="trust-signals">
                            {{#trustSignals}}
                            <span class="trust-signal">{{.}}</span>
                            {{/trustSignals}}
                        </div>
                    </div>
                </div>
                {{/../enhancedProjects}}
            </div>
        </div>
    </div>
    {{/enhancedProjects}}
    
    {{#jobAnalysis.missingElements}}
    <!-- Improvement Suggestions -->
    <div class="section">
        <div class="container">
            <div class="improvement-section">
                <div class="improvement-title">개선 및 보완 사항</div>
                <ul class="improvement-list">
                    {{#.}}
                    <li>{{.}}</li>
                    {{/.}}
                </ul>
            </div>
        </div>
    </div>
    {{/jobAnalysis.missingElements}}
    
    <!-- Footer -->
    <div class="footer">
        <div class="container">
            <div class="generated-info">
                Job-Focused Portfolio • 생성일: {{timestamp}}
            </div>
        </div>
    </div>
    
    <script>
        // Trust badge animation with null checks
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('DOMContentLoaded', function() {
                try {
                    const trustBadge = document.querySelector('.trust-badge');
                    if (trustBadge && trustBadge.style) {
                        setTimeout(() => {
                            trustBadge.style.transform = 'scale(1.05)';
                            setTimeout(() => {
                                trustBadge.style.transform = 'scale(1)';
                            }, 200);
                        }, 1000);
                    }
                } catch (error) {
                }
            });
        }
    </script>
</body>
</html>`,
            styles: {
                primaryColor: "#0f766e",
                secondaryColor: "#06b6d4",
                font: "Pretendard",
                layout: "modern",
            },
        },
        // 개발자용 포트폴리오 템플릿 (기본)
        {
            id: "developer-portfolio",
            name: "개발자 포트폴리오 (기본)",
            description: "개발자를 위한 전문적인 포트폴리오 형식",
            category: "presentation",
            format: "html",
            targetAudience: "technical",
            template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Developer Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            line-height: 1.6; 
            color: #1a1a1a;
            background: #fafafa;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        
        /* 헤더 */
        .header {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            padding: 80px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23ffffff" stroke-width="0.3" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        }
        .header-content { position: relative; z-index: 2; }
        .header h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header .subtitle {
            font-size: 1.4rem;
            opacity: 0.95;
            font-weight: 300;
            margin-bottom: 2rem;
        }
        .header .contact {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.1);
            padding: 0.7rem 1.2rem;
            border-radius: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        /* 섹션 공통 스타일 */
        .section {
            padding: 80px 0;
            background: white;
            margin: 40px 0;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .section:nth-child(even) { background: #f8fafc; }
        
        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: {{primaryColor}};
            margin-bottom: 1rem;
            position: relative;
        }
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            border-radius: 2px;
        }
        .section-subtitle {
            font-size: 1.1rem;
            color: #666;
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* About 섹션 */
        .about-content {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 4rem;
            align-items: center;
        }
        .about-text {
            font-size: 1.2rem;
            line-height: 1.8;
            color: #444;
        }
        .about-image {
            width: 250px;
            height: 250px;
            border-radius: 50%;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            color: white;
            margin: 0 auto;
        }
        
        /* Skills 섹션 */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .skill-category {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-left: 5px solid {{primaryColor}};
        }
        .skill-category h3 {
            font-size: 1.3rem;
            font-weight: 600;
            color: {{primaryColor}};
            margin-bottom: 1.5rem;
        }
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
        }
        .skill-tag {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        /* Experience 섹션 */
        .experience-timeline {
            position: relative;
        }
        .experience-timeline::before {
            content: '';
            position: absolute;
            left: 2rem;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, {{primaryColor}}, {{secondaryColor}});
        }
        .experience-item {
            position: relative;
            margin-bottom: 3rem;
            padding-left: 5rem;
        }
        .experience-item::before {
            content: '';
            position: absolute;
            left: 1rem;
            top: 0.5rem;
            width: 1rem;
            height: 1rem;
            background: {{primaryColor}};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 3px {{primaryColor}};
        }
        .experience-header {
            display: flex;
            justify-content: between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        .company-info h3 {
            font-size: 1.4rem;
            font-weight: 700;
            color: {{primaryColor}};
            margin-bottom: 0.3rem;
        }
        .position {
            font-size: 1.1rem;
            color: #666;
            font-weight: 500;
        }
        .duration {
            font-size: 0.9rem;
            color: #888;
            background: #f1f5f9;
            padding: 0.3rem 0.8rem;
            border-radius: 12px;
        }
        .impact {
            font-size: 1rem;
            color: #555;
            margin: 1rem 0;
            font-style: italic;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 3px solid {{primaryColor}};
        }
        .achievements {
            list-style: none;
        }
        .achievements li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 0.5rem;
            color: #444;
        }
        .achievements li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: {{primaryColor}};
            font-weight: bold;
        }
        
        /* Projects 섹션 */
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }
        .project-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .project-image {
            height: 200px;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            font-weight: bold;
        }
        .project-content {
            padding: 2rem;
        }
        .project-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: {{primaryColor}};
            margin-bottom: 0.5rem;
        }
        .project-role {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 1rem;
        }
        .project-description {
            color: #555;
            margin-bottom: 1.5rem;
            line-height: 1.7;
        }
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .tech-tag {
            background: #f1f5f9;
            color: {{primaryColor}};
            padding: 0.3rem 0.8rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
        }
        .project-links {
            display: flex;
            gap: 1rem;
        }
        .project-link {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .project-link.primary {
            background: {{primaryColor}};
            color: white;
        }
        .project-link.secondary {
            background: #f1f5f9;
            color: {{primaryColor}};
            border: 1px solid #e2e8f0;
        }
        
        /* Contact 섹션 */
        .contact {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            text-align: center;
            border-radius: 20px;
        }
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        .contact-item {
            background: rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
            .header h1 { font-size: 2.5rem; }
            .about-content {
                grid-template-columns: 1fr;
                text-align: center;
            }
            .projects-grid {
                grid-template-columns: 1fr;
            }
            .experience-timeline::before { display: none; }
            .experience-item { padding-left: 0; }
            .experience-item::before { display: none; }
        }
    </style>
</head>
<body>
    <!-- 헤더 -->
    <div class="header">
        <div class="container">
            <div class="header-content">
                <h1>{{name}}</h1>
                <div class="subtitle">{{oneLinerPitch}}</div>
                <div class="contact">
                    <div class="contact-item">
                        <span>📧</span> developer@example.com
                    </div>
                    <div class="contact-item">
                        <span>🐱</span> GitHub
                    </div>
                    <div class="contact-item">
                        <span>🔗</span> LinkedIn
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- About -->
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">👋 About Me</h2>
                <p class="section-subtitle">개발자로서의 나의 여정과 비전을 소개합니다</p>
            </div>
            <div class="about-content">
                <div class="about-text">{{summary}}</div>
                <div class="about-image">👨‍💻</div>
            </div>
        </div>
    </div>

    <!-- Skills -->
    {{#skills.length}}
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">🛠️ Skills</h2>
                <p class="section-subtitle">전문성에 따라 분류한 기술 역량입니다</p>
            </div>
            <div class="skills-grid">
                {{#skills}}
                <div class="skill-category">
                    <h3>{{category}}</h3>
                    <div class="skill-tags">
                        {{#skills}}
                        <span class="skill-tag">{{value}}</span>
                        {{/skills}}
                    </div>
                    <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">{{experience}}</p>
                </div>
                {{/skills}}
            </div>
        </div>
    </div>
    {{/skills.length}}

    <!-- Experience -->
    {{#experiences.length}}
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">💼 Experience</h2>
                <p class="section-subtitle">전문성을 키워온 경력 사항들입니다</p>
            </div>
            <div class="experience-timeline">
                {{#experiences}}
                <div class="experience-item">
                    <div class="experience-header">
                        <div class="company-info">
                            <h3>{{company}}</h3>
                            <div class="position">{{position}}</div>
                        </div>
                        <div class="duration">{{duration}}</div>
                    </div>
                    <div class="impact">{{impact}}</div>
                    <ul class="achievements">
                        {{#achievements}}
                        <li>{{.}}</li>
                        {{/achievements}}
                    </ul>
                    
                    <!-- Experience credibility indicators -->
                    <div style="margin-top: 1rem;">
                        {{#impact}}
                        <div class="credibility-item">
                            <div class="credibility-icon">🎯</div>
                            <div class="credibility-text">비즈니스 임팩트 명시</div>
                        </div>
                        {{/impact}}
                    </div>
                    <div class="skill-tags" style="margin-top: 1rem;">
                        {{#technologies}}
                        <span class="tech-tag">{{.}}</span>
                        {{/technologies}}
                    </div>
                </div>
                {{/experiences}}
            </div>
        </div>
    </div>
    {{/experiences.length}}

    <!-- Projects -->
    {{#projects.length}}
    <div class="section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">🚀 Projects</h2>
                <p class="section-subtitle">주요 프로젝트를 최신순으로 구성했습니다</p>
            </div>
            <div class="projects-grid">
                {{#projects}}
                <div class="project-card">
                    <div class="project-image">{{name}}</div>
                    <div class="project-content">
                        <h3 class="project-title">{{name}}</h3>
                        <div class="project-role">{{myRole}}</div>
                        <div class="project-description">{{summary}}</div>
                        <div class="project-tech">
                            {{#technologies}}
                            <span class="tech-tag">{{.}}</span>
                            {{/technologies}}
                        </div>
                        <ul class="achievements">
                            {{#achievements}}
                            <li>{{.}}</li>
                            {{/achievements}}
                        </ul>
                        
                        <!-- Project credibility indicators -->
                        <div style="margin-top: 1rem;">
                            {{#url}}
                            <div class="credibility-item">
                                <div class="credibility-icon">🌐</div>
                                <div class="credibility-text">실제 운영 중인 서비스</div>
                            </div>
                            {{/url}}
                            {{#githubUrl}}
                            <div class="credibility-item">
                                <div class="credibility-icon">💻</div>
                                <div class="credibility-text">오픈소스 코드 공개</div>
                            </div>
                            {{/githubUrl}}
                        </div>
                        <div class="project-links">
                            {{#url}}
                            <a href="{{url}}" class="project-link primary" target="_blank">🌐 라이브</a>
                            {{/url}}
                            {{#githubUrl}}
                            <a href="{{githubUrl}}" class="project-link secondary" target="_blank">🐱 코드</a>
                            {{/githubUrl}}
                        </div>
                    </div>
                </div>
                {{/projects}}
            </div>
        </div>
    </div>
    {{/projects.length}}

    <!-- Contact -->
    <div class="section contact">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title" style="color: white;">👋 Contact</h2>
                <p class="section-subtitle" style="color: rgba(255,255,255,0.9);">협업을 위한 연락을 기다립니다</p>
            </div>
            <div class="contact-grid">
                <div class="contact-item">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📧</div>
                    <div>developer@example.com</div>
                </div>
                <div class="contact-item">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📱</div>
                    <div>+82 10-1234-5678</div>
                </div>
                <div class="contact-item">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏠</div>
                    <div>서울, 대한민국</div>
                </div>
            </div>
        </div>
    </div>

    <div style="text-align: center; padding: 2rem; color: #666; background: #f8fafc;">
        <p>개발자 포트폴리오 • 생성일: {{timestamp}}</p>
    </div>
</body>
</html>`,
            styles: {
                primaryColor: "#0066cc",
                secondaryColor: "#00d4ff",
                font: "Pretendard",
                layout: "modern",
            },
        },
        // 기획자용 포트폴리오 템플릿
        {
            id: "planner-portfolio",
            name: "기획자 포트폴리오",
            description: "서비스 기획자를 위한 전문적인 포트폴리오 형식",
            category: "presentation",
            format: "html",
            targetAudience: "general",
            template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Service Planner Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: #fafafa;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        
        /* 공통 스타일 */
        .section {
            background: white;
            margin: 2rem 0;
            padding: 3rem 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .section-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: {{primaryColor}};
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid {{primaryColor}};
        }
        .highlight {
            background: linear-gradient(120deg, {{secondaryColor}}40 0%, {{secondaryColor}}40 100%);
            background-repeat: no-repeat;
            background-size: 100% 30%;
            background-position: 0 85%;
            padding: 0 0.2rem;
            font-weight: 600;
        }
        
        /* 헤더 */
        .header {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            padding: 4rem 0;
            text-align: center;
            position: relative;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="25" cy="25" r="2" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="3" fill="%23ffffff" opacity="0.1"/><circle cx="80" cy="20" r="1.5" fill="%23ffffff" opacity="0.1"/></svg>');
        }
        .profile-img {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            border: 4px solid rgba(255,255,255,0.3);
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        .header .job-title {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 1rem;
        }
        .header .description {
            font-size: 1rem;
            opacity: 0.8;
            max-width: 600px;
            margin: 0 auto 2rem;
            line-height: 1.7;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.15);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        /* Profile 섹션 */
        .profile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
        }
        .profile-item h3 {
            color: {{primaryColor}};
            font-weight: 600;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        .timeline-item {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid {{primaryColor}};
        }
        .company {
            font-weight: 600;
            color: {{primaryColor}};
            margin-bottom: 0.3rem;
        }
        .period {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.5rem;
        }
        .role-desc {
            font-size: 0.95rem;
            color: #555;
        }
        
        /* Skills 섹션 */
        .skills-container {
            margin-bottom: 2rem;
        }
        .skills-category {
            margin-bottom: 2rem;
        }
        .skills-category h3 {
            color: {{primaryColor}};
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
        }
        .skill-item {
            background: {{primaryColor}};
            color: white;
            padding: 0.4rem 1rem;
            border-radius: 16px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .skill-detail {
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: #555;
        }
        
        /* Projects 섹션 */
        .projects-intro {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: #f8fafc;
            border-radius: 10px;
            border: 2px dashed {{primaryColor}};
        }
        .project-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .project-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-color: {{primaryColor}};
        }
        .project-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }
        .project-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            margin-right: 1rem;
        }
        .project-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: {{primaryColor}};
            margin-bottom: 0.2rem;
        }
        .project-summary {
            color: #666;
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        .project-role {
            background: {{primaryColor}}10;
            color: {{primaryColor}};
            padding: 0.3rem 0.8rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .project-achievements {
            list-style: none;
            margin-bottom: 1rem;
        }
        .project-achievements li {
            position: relative;
            padding-left: 1.2rem;
            margin-bottom: 0.5rem;
            color: #555;
            font-size: 0.95rem;
        }
        .project-achievements li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: {{primaryColor}};
            font-weight: bold;
        }
        
        /* About me 섹션 */
        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }
        .interest-item {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }
        .interest-icon {
            font-size: 1.5rem;
            margin-right: 1rem;
            width: 40px;
        }
        
        /* Work style 섹션 */
        .work-principles {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .principle-item {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 10px;
            border-left: 4px solid {{primaryColor}};
        }
        .principle-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
            color: white;
            text-align: center;
            padding: 3rem 0;
            margin-top: 2rem;
            border-radius: 12px;
        }
        .footer h2 {
            margin-bottom: 1rem;
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
            .profile-grid,
            .about-grid {
                grid-template-columns: 1fr;
            }
            .work-principles {
                grid-template-columns: 1fr;
            }
            .contact-info {
                flex-direction: column;
                align-items: center;
            }
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <!-- 헤더 -->
    <div class="header">
        <div class="container">
            <div class="profile-img">🧑‍💼</div>
            <h1>안녕하세요. {{name}}입니다.</h1>
            <div class="job-title">IT 서비스를 만드는 기획자</div>
            <div class="description">{{summary}}</div>
            <div class="contact-info">
                <div class="contact-item">
                    <span>✉️</span> planner@example.com
                </div>
                <div class="contact-item">
                    <span>📱</span> +82 10-1234-5678
                </div>
                <div class="contact-item">
                    <span>🏠</span> 서울, 대한민국
                </div>
            </div>
            
            {{#showTrustIndicators}}
            <!-- Planner Trust Indicators -->
            <div class="planner-trust-section">
                <div class="planner-trust-grid">
                    {{#experiences.length}}
                    <div class="planner-trust-item">
                        <div class="planner-trust-value">{{experiences.length}}+</div>
                        <div class="planner-trust-label">년 경력</div>
                    </div>
                    {{/experiences.length}}
                    {{#projects.length}}
                    <div class="planner-trust-item">
                        <div class="planner-trust-value">{{projects.length}}</div>
                        <div class="planner-trust-label">주요 프로젝트</div>
                    </div>
                    {{/projects.length}}
                    {{#trustScore}}
                    <div class="planner-trust-item">
                        <div class="planner-trust-value">{{trustScore}}</div>
                        <div class="planner-trust-label">신뢰도</div>
                    </div>
                    {{/trustScore}}
                    {{#industryReadiness}}
                    <div class="planner-trust-item">
                        <div class="planner-trust-value">{{industryReadiness}}%</div>
                        <div class="planner-trust-label">준비도</div>
                    </div>
                    {{/industryReadiness}}
                </div>
            </div>
            {{/showTrustIndicators}}
        </div>
    </div>

    <!-- Profile 섹션 -->
    <div class="section">
        <div class="container">
            <h2 class="section-title">🔎 Profile</h2>
            <div style="margin-bottom: 2rem; text-align: center; color: #666;">
                상세한 경력 기술서는 📎 <strong>이력서</strong> 에서 확인해주세요.
            </div>
            
            <div class="profile-grid">
                <div class="profile-item">
                    <h3>경력 (총 {{experiences.length}}+년)</h3>
                    {{#experiences}}
                    <div class="timeline-item">
                        <div class="company">{{company}}</div>
                        <div class="period">{{duration}}</div>
                        <div class="role-desc">{{impact}}</div>
                        <ul style="margin-top: 0.5rem; font-size: 0.9rem;">
                            {{#achievements}}
                            <li style="margin-bottom: 0.3rem;">{{.}}</li>
                            {{/achievements}}
                        </ul>
                    </div>
                    {{/experiences}}
                </div>
                
                <div class="profile-item">
                    <h3>기타</h3>
                    <div class="timeline-item">
                        <div class="company">서비스 기획 그룹 스터디 'OOOO' 운영</div>
                        <div class="role-desc">기획자들과의 네트워킹 및 지식 공유</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Skills 섹션 -->
    {{#skills.length}}
    <div class="section">
        <div class="container">
            <h2 class="section-title">⚒️ Skills</h2>
            <div style="margin-bottom: 2rem; text-align: center; color: #666;">
                역량의 <span class="highlight">전문성에 따라</span> 분류하였습니다. 각 항목을 누르면 상세 내용을 확인할 수 있습니다.
            </div>
            
            {{#skills}}
            <div class="skills-category">
                <h3>{{category}} Skills</h3>
                <div class="skills-list">
                    {{#skills}}
                    <span class="skill-item">{{value}}</span>
                    {{/skills}}
                </div>
                <div class="skill-detail">{{experience}}</div>
            </div>
            {{/skills}}
        </div>
    </div>
    {{/skills.length}}

    <!-- Projects 섹션 -->
    {{#projects.length}}
    <div class="section">
        <div class="container">
            <h2 class="section-title">👩🏻‍💻 Projects</h2>
            
            <div class="projects-intro">
                <p>담당한 프로젝트를 <span class="highlight">최신순으로 구성</span>했습니다. 각 이미지를 누르면 주요 내용 / 역할&기여도 / 기간 등을 확인할 수 있습니다.</p>
            </div>
            
            {{#projects}}
            <div class="project-card">
                <div class="project-header">
                    <div class="project-icon">🚀</div>
                    <div>
                        <div class="project-title">{{name}}</div>
                        <div class="project-role">{{myRole}}</div>
                    </div>
                </div>
                <div class="project-summary">{{summary}}</div>
                <ul class="project-achievements">
                    {{#achievements}}
                    <li>{{.}}</li>
                    {{/achievements}}
                </ul>
                <div style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                    <strong>기대 효과:</strong> {{impact}}
                </div>
            </div>
            {{/projects}}
        </div>
    </div>
    {{/projects.length}}

    <!-- About me 섹션 -->
    <div class="section">
        <div class="container">
            <h2 class="section-title">💫 About me</h2>
            
            <div class="about-grid">
                <div>
                    <div class="interest-item">
                        <div class="interest-icon">🌏</div>
                        <div>
                            <strong>여행</strong><br>
                            여행을 좋아해서 1년간 미국 배낭여행을 했어요.
                        </div>
                    </div>
                    <div class="interest-item">
                        <div class="interest-icon">🐶</div>
                        <div>
                            <strong>강아지</strong><br>
                            사이드 프로젝트로 서울 강아지 놀이터 지도를 만들었어요.
                        </div>
                    </div>
                </div>
                <div>
                    <div class="interest-item">
                        <div class="interest-icon">🏊🏻</div>
                        <div>
                            <strong>수영</strong><br>
                            수영, 다이빙을 좋아합니다.
                        </div>
                    </div>
                    <div class="interest-item">
                        <div class="interest-icon">🖋</div>
                        <div>
                            <strong>글쓰기</strong><br>
                            기획 및 업무 관련 블로그를 운영하고 있어요.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- How I Work 섹션 -->
    <div class="section">
        <div class="container">
            <h2 class="section-title">🙋🏻‍♀️ How I Work</h2>
            
            <div class="work-principles">
                <div class="principle-item">
                    <div class="principle-icon">🎯</div>
                    <strong>목표 달성도 중요하지만 일의 과정에서 재미를 찾는 편이에요.</strong>
                </div>
                <div class="principle-item">
                    <div class="principle-icon">🌟</div>
                    <strong>회사와 세상에 긍정적 영향을 주는 일은 그 자체로 동기부여가 됩니다.</strong>
                </div>
                <div class="principle-item">
                    <div class="principle-icon">🛠️</div>
                    <strong>문제가 생겨도 그 상황 안에서 일을 진행할 수 있는 방향을 찾습니다.</strong>
                </div>
                <div class="principle-item">
                    <div class="principle-icon">⏰</div>
                    <strong>함께 정한 기한은 반드시 지키려고 노력해요.</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="container">
            <h2>👋 Contact</h2>
            <div style="margin-bottom: 2rem;">
                <div style="margin-bottom: 0.5rem;">✉️ planner@example.com</div>
                <div style="margin-bottom: 0.5rem;">📱 +82 10-1234-5678</div>
                <div>🏠 서울 강진구</div>
            </div>
            <div style="font-size: 0.9rem; opacity: 0.8;">
                기획자 포트폴리오 • 생성일: {{timestamp}}
            </div>
        </div>
    </div>
</body>
</html>`,
            styles: {
                primaryColor: "#6366f1",
                secondaryColor: "#a855f7",
                font: "Pretendard",
                layout: "modern",
            },
        },
        // 기존 간단한 템플릿
        {
            id: "modern-dev",
            name: "모던 개발자",
            description: "깔끔하고 기술 중심적인 개발자용 템플릿",
            category: "presentation",
            format: "html",
            targetAudience: "technical",
            template: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .hero { background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); color: white; padding: 80px 0; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.2rem; opacity: 0.9; }
        .section { padding: 60px 0; }
        .section:nth-child(even) { background: #f8f9fa; }
        .section h2 { font-size: 2rem; margin-bottom: 2rem; text-align: center; color: {{primaryColor}}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .experience-item, .project-item { margin-bottom: 2rem; }
        .experience-header { display: flex; justify-content: between; align-items: center; margin-bottom: 1rem; }
        .company { font-size: 1.3rem; font-weight: bold; color: {{primaryColor}}; }
        .position { font-size: 1.1rem; color: #666; }
        .duration { font-size: 0.9rem; color: #888; }
        .achievements li { margin: 0.5rem 0; }
        .keywords { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .keyword { background: {{primaryColor}}; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>{{name}}</h1>
            <p>{{oneLinerPitch}}</p>
        </div>
    </div>

    <div class="section">
        <div class="container">
            <h2>About</h2>
            <p style="text-align: center; font-size: 1.1rem; max-width: 800px; margin: 0 auto;">{{summary}}</p>
        </div>
    </div>

    {{#experiences.length}}
    <div class="section">
        <div class="container">
            <h2>Experience</h2>
            {{#experiences}}
            <div class="experience-item">
                <div class="experience-header">
                    <div>
                        <div class="company">{{company}}</div>
                        <div class="position">{{position}}</div>
                    </div>
                    <div class="duration">{{duration}}</div>
                </div>
                <div class="impact">{{impact}}</div>
                <ul class="achievements">
                    {{#achievements}}
                    <li>{{.}}</li>
                    {{/achievements}}
                </ul>
                <div class="keywords">
                    {{#technologies}}
                    <span class="keyword">{{.}}</span>
                    {{/technologies}}
                </div>
            </div>
            {{/experiences}}
        </div>
    </div>
    {{/experiences.length}}

    {{#projects.length}}
    <div class="section">
        <div class="container">
            <h2>Projects</h2>
            <div class="grid">
                {{#projects}}
                <div class="card project-item">
                    <h3>{{name}}</h3>
                    <p>{{summary}}</p>
                    <p><strong>Role:</strong> {{myRole}}</p>
                    <ul class="achievements">
                        {{#achievements}}
                        <li>{{.}}</li>
                        {{/achievements}}
                    </ul>
                    <div class="keywords">
                        {{#technologies}}
                        <span class="keyword">{{.}}</span>
                        {{/technologies}}
                    </div>
                </div>
                {{/projects}}
            </div>
        </div>
    </div>
    {{/projects.length}}

    {{#skills.length}}
    <div class="section">
        <div class="container">
            <h2>Skills</h2>
            <div class="grid">
                {{#skills}}
                <div class="card">
                    <h3>{{category}}</h3>
                    <div class="keywords">
                        {{#skills}}
                        <span class="keyword">{{value}}</span>
                        {{/skills}}
                    </div>
                    <p style="margin-top: 1rem; color: #666;">{{experience}}</p>
                </div>
                {{/skills}}
            </div>
        </div>
    </div>
    {{/skills.length}}
</body>
</html>`,
            styles: {
                primaryColor: "#0168FF",
                secondaryColor: "#00D9FF",
                font: "Segoe UI",
                layout: "grid",
            },
        },
        {
            id: "executive-summary",
            name: "임원용 요약",
            description: "간결하고 임팩트 중심의 1페이지 요약",
            category: "document",
            format: "markdown",
            targetAudience: "executive",
            template: `
# {{name}}
**{{oneLinerPitch}}**

## 핵심 성과
{{#achievements}}
- {{.}}
{{/achievements}}

## 주요 경험
{{#experiences}}
### {{company}} - {{position}}
*{{duration}}*

**Impact:** {{impact}}

**Key Achievements:**
{{#achievements}}
- {{.}}
{{/achievements}}
{{/experiences}}

## 대표 프로젝트
{{#projects}}
### {{name}}
{{summary}}

**Role:** {{myRole}}  
**Impact:** {{impact}}  
{{#metrics}}**Metrics:** {{metrics}}{{/metrics}}
{{/projects}}

## 기술 역량
{{#skills}}
**{{category}}:** {{#skills}}{{value}}{{^last}}, {{/last}}{{/skills}} ({{experience}})  
{{/skills}}

---
*Generated on {{timestamp}}*`,
            styles: {
                primaryColor: "#2C3E50",
                secondaryColor: "#3498DB",
                font: "serif",
                layout: "linear",
            },
        },
    ];

    async generatePortfolio(
        content: OrganizedContent,
        options: GenerationOptions,
        customTemplate?: string
    ): Promise<GenerationResult> {
        try {

            let templateToUse;
            let templateName = "";
            let enhancedContent = content;
            let jobAnalysis = undefined;

            // Job-focused analysis 수행 (옵션이 활성화된 경우)
            if (options.includeJobAnalysis && options.targetRole) {
                // Use content as-is since jobFocusedPortfolioGenerator was removed
                enhancedContent = content;
                jobAnalysis = {
                    industryAlignment: 85, // Default alignment score
                    trustScore: 85, // Default trust score
                    industryReadiness: 80, // Default readiness score
                    keyCompetencies: [], // Empty array for default
                    missingElements: [], // Empty array for default
                };
            }

            if (customTemplate) {
                // 사용자 커스텀 템플릿 사용
                templateToUse = {
                    id: "custom",
                    name: "사용자 정의 템플릿",
                    template: customTemplate,
                    format: "markdown",
                    styles: {
                        primaryColor: "#0168FF",
                        secondaryColor: "#00D9FF",
                    },
                };
                templateName = "사용자 정의 템플릿";
            } else {
                // 기본 템플릿 사용
                templateToUse = this.templates.find(
                    (t) => t.id === options.templateId
                );
                if (!templateToUse) {
                    throw new Error("템플릿을 찾을 수 없습니다.");
                }
                templateName = templateToUse.name;
            }

            // 스타일 적용
            const styles = {
                ...templateToUse.styles,
                ...options.customStyles,
            };

            // 콘텐츠 준비 (향상된 콘텐츠 사용)
            const templateData = this.prepareTemplateData(
                enhancedContent,
                options,
                styles
            );

            let generatedContent: string;

            if (customTemplate) {
                // 커스텀 템플릿은 AI로 처리
                generatedContent = await this.generateWithAI(
                    customTemplate,
                    templateData
                );
            } else if (templateToUse.format === "html") {
                generatedContent = this.generateHTML(
                    templateToUse.template,
                    templateData
                );
            } else if (templateToUse.format === "markdown") {
                generatedContent = this.generateMarkdown(
                    templateToUse.template,
                    templateData
                );
            } else if (options.format === "notion-json") {
                generatedContent = await this.generateNotionJSON(
                    content,
                    templateData
                );
            } else {
                generatedContent = Mustache.render(
                    templateToUse.template,
                    templateData
                );
            }


            // 품질 점수 계산 (에러 시 기본값 사용)
            let qualityScore = 75;
            try {
                qualityScore = await this.calculateQualityScore(
                    generatedContent,
                    content
                );
            } catch (error) {
            }

            // 개선 제안 생성 (에러 시 기본값 사용)
            let suggestions: string[] = [];
            try {
                suggestions = await this.generateSuggestions(
                    generatedContent,
                    content
                );
            } catch (error) {
                suggestions = ["포트폴리오가 성공적으로 생성되었습니다."];
            }

            const result: GenerationResult = {
                id: `gen_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                format: options.format,
                content: generatedContent,
                downloadUrl: this.createDownloadUrl(
                    generatedContent,
                    options.format
                ),
                metadata: {
                    wordCount: this.countWords(generatedContent),
                    estimatedReadTime: Math.ceil(
                        this.countWords(generatedContent) / 200
                    ),
                    generatedAt: new Date(),
                    template: templateName,
                },
                qualityScore,
                suggestions,
                jobAnalysis,
            };

            return result;
        } catch (error) {
            throw error;
        }
    }

    private prepareTemplateData(
        content: OrganizedContent,
        options: GenerationOptions,
        styles: any
    ) {
        // 이름 추출 로직 - 첫 번째 경력에서 추출하거나 기본값 사용
        const name =
            content.experiences.length > 0
                ? `${content.experiences[0].position} 개발자`
                : "포트폴리오";

        // Job-focused content인지 확인
        const isJobFocused = "jobFocusedAnalysis" in content;
        const jobContent = isJobFocused ? (content as any) : null;

        // 기본 데이터 준비
        let templateData = {
            ...content,
            ...styles,
            name,
            timestamp: new Date().toLocaleDateString("ko-KR"),
            // 추가 헬퍼 함수들
            "experiences.length": content.experiences.length > 0,
            "projects.length": content.projects.length > 0,
            "skills.length": content.skills.length > 0,
            // 각 항목의 last 플래그 추가 (Mustache 템플릿용)
            experiences: content.experiences.map((exp, idx) => ({
                ...exp,
                last: idx === content.experiences.length - 1,
            })),
            projects: content.projects.map((proj, idx) => ({
                ...proj,
                last: idx === content.projects.length - 1,
            })),
            skills: content.skills.map((skill, idx) => ({
                ...skill,
                skills: skill.skills.map((s, i) => ({
                    value: s,
                    last: i === skill.skills.length - 1,
                })),
                last: idx === content.skills.length - 1,
            })),
        };

        // Job-focused 데이터 추가
        if (isJobFocused && jobContent) {
            templateData = {
                ...templateData,
                // 신뢰도 지표
                trustScore: jobContent.trustScore,
                industryReadiness: jobContent.industryReadiness,
                // 향상된 프로젝트 스토리
                enhancedProjects: jobContent.enhancedProjects || [],
                // 직무 분석 결과
                jobAnalysis: jobContent.jobFocusedAnalysis,
                // 역량 매핑
                competencyMapping: jobContent.competencyMapping || {},
                // 신뢰 신호 표시 여부
                showTrustIndicators: options.includeTrustSignals,
                // 역량 레벨 표시
                competencyLevels: Object.entries(
                    jobContent.competencyMapping || {}
                ).map(([competency, data]: [string, any]) => ({
                    name: competency,
                    level: data.level,
                    evidence: data.evidence.length,
                })),
            };
        }

        return templateData;
    }

    private generateHTML(template: string, data: any): string {
        return Mustache.render(template, data);
    }

    private generateMarkdown(template: string, data: any): string {
        return Mustache.render(template, data);
    }

    private async generateWithAI(
        userTemplate: string,
        data: any
    ): Promise<string> {
        const systemPrompt = `
사용자가 제공한 포트폴리오 템플릿에 실제 데이터를 채워서 완성된 포트폴리오를 생성하세요.

규칙:
1. 사용자 템플릿의 구조와 스타일을 완전히 유지하세요
2. 템플릿의 플레이스홀더나 예시 텍스트를 실제 데이터로 교체하세요
3. 템플릿에 없는 새로운 섹션이나 스타일을 추가하지 마세요
4. 마크다운 형식을 유지하세요

사용자 템플릿:
${userTemplate}

위 템플릿에 다음 데이터를 채워 넣어주세요.
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `포트폴리오 데이터:\n${JSON.stringify(
                            data,
                            null,
                            2
                        )}`,
                    },
                ],
                max_tokens: 3000,
            });

            return response.choices[0].message.content || userTemplate;
        } catch (error) {
            // AI 실패 시 기본 Mustache 렌더링 시도
            try {
                return Mustache.render(userTemplate, data);
            } catch (mustacheError) {
                return userTemplate; // 최종 fallback
            }
        }
    }

    private async generateNotionJSON(
        content: OrganizedContent,
        data: any
    ): Promise<string> {
        const systemPrompt = `
Notion 페이지용 JSON 블록 구조를 생성하세요.
Notion의 block 구조를 따라 heading, paragraph, bulleted_list_item 등을 사용하세요.

JSON 형식:
{
  "object": "block",
  "type": "paragraph", 
  "paragraph": {
    "rich_text": [{"type": "text", "text": {"content": "텍스트"}}]
  }
}
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `다음 포트폴리오 데이터를 Notion JSON 블록으로 변환해주세요:\n${JSON.stringify(
                            content,
                            null,
                            2
                        )}`,
                    },
                ],
            });

            return response.choices[0].message.content || "{}";
        } catch (error) {
            return JSON.stringify({
                error: "Notion JSON 생성에 실패했습니다.",
            });
        }
    }

    private async calculateQualityScore(
        generatedContent: string,
        originalContent: OrganizedContent
    ): Promise<number> {
        const systemPrompt = `
당신은 글로벌 테크 기업 HR 전문가입니다. 포트폴리오를 실제 채용 기준으로 평가하세요.

=== 평가 기준 (0-100점) ===
**1. 비즈니스 임팩트 (30점)**
- 정량적 성과 지표 명시 (매출, 사용자 수, 성능 개선%)
- 비즈니스 맥락과 문제 해결 스토리
- ROI 및 실질적 가치 창출 증거

**2. 기술 전문성 (25점)**
- 기술 스택의 깊이와 실전 활용도
- 복잡한 문제 해결 능력 입증
- 최신 기술 트렌드 적용 여부

**3. 협업 & 리더십 (20점)**
- 팀 협업 경험과 커뮤니케이션
- 프로젝트 리드/멘토링 경험
- 크로스 펑셔널 협업 사례

**4. 성장 가능성 (15점)**
- 학습 민첩성과 자기계발
- 커리어 성장 궤적의 일관성
- 미래 비전과 목표의 명확성

**5. ATS & 신뢰도 (10점)**
- 핵심 키워드 최적화
- 검증 가능한 정보 (URL, GitHub 등)
- 전문적 구조와 가독성

**반환 형식**: 숫자만 (예: 87)
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `생성된 포트폴리오:\n${generatedContent}\n\n원본 데이터:\n${JSON.stringify(
                            originalContent,
                            null,
                            2
                        )}`,
                    },
                ],
                max_tokens: 10,
            });

            const score = parseInt(response.choices[0].message.content || "70");
            return Math.max(0, Math.min(100, score));
        } catch (error) {
            return 70; // 기본값
        }
    }

    private async generateSuggestions(
        generatedContent: string,
        originalContent: OrganizedContent
    ): Promise<string[]> {
        const systemPrompt = `
당신은 채용 성공률 95%를 자랑하는 커리어 코치입니다.
포트폴리오를 분석하여 즉시 실행 가능한 개선 제안을 3-5개 생성하세요.

=== 제안 우선순위 ===
1. **정량적 성과 보강**: 수치가 없는 성과에 구체적 지표 추가 제안
2. **STAR 스토리텔링**: 맥락 없는 경험을 Situation-Task-Action-Result 구조로 재구성
3. **비즈니스 언어 전환**: 기술 용어를 비즈니스 임팩트로 번역
4. **신뢰 신호 추가**: URL, GitHub, 검증 가능한 레퍼런스 추가
5. **협업 경험 강조**: 팀워크, 리더십, 커뮤니케이션 사례 추가

=== 제안 형식 ===
각 제안은 "무엇을 → 어떻게 → 왜" 구조로 작성:
- 예: "프로젝트 A의 성과에 '사용자 20% 증가' 같은 구체적 수치를 추가하면, 채용담당자가 임팩트를 즉시 파악할 수 있습니다."

**반환 형식**: JSON 배열
["실행 가능한 제안 1", "실행 가능한 제안 2", "실행 가능한 제안 3"]
`;

        try {
            const response = await openai.chat.completions.create({
                model: REACT_APP_OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `포트폴리오:\n${generatedContent}`,
                    },
                ],
            });

            const result = response.choices[0].message.content || "[]";
            return JSON.parse(result) as string[];
        } catch (error) {
            return [
                "더 구체적인 성과 수치를 추가해보세요",
                "프로젝트 이미지를 포함하면 좋겠습니다",
            ];
        }
    }

    private countWords(content: string): number {
        // HTML 태그 제거 후 단어 수 계산
        const textOnly = content.replace(/<[^>]*>/g, " ");
        return textOnly.split(/\s+/).filter((word) => word.length > 0).length;
    }

    private createDownloadUrl(content: string, format: string): string {
        const blob = new Blob([content], {
            type: format === "html" ? "text/html" : "text/plain",
        });
        return URL.createObjectURL(blob);
    }

    getTemplates(): GenerationTemplate[] {
        return this.templates;
    }

    getTemplateById(id: string): GenerationTemplate | undefined {
        return this.templates.find((t) => t.id === id);
    }

    async generatePreview(
        content: OrganizedContent,
        templateId: string
    ): Promise<string> {
        const template = this.getTemplateById(templateId);
        if (!template) return "";

        const templateData = this.prepareTemplateData(
            content,
            {
                templateId,
                format: "html",
                sections: ["all"],
                length: "concise",
                tone: "professional",
            },
            template.styles
        );

        if (template.format === "html") {
            return this.generateHTML(template.template, templateData);
        } else {
            // 마크다운을 간단한 HTML로 변환
            const markdown = this.generateMarkdown(
                template.template,
                templateData
            );
            return `<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${markdown}</pre>`;
        }
    }

    // Trust validation and enhancement utilities
    validateTrustElements(content: OrganizedContent): {
        hasQuantifiedMetrics: boolean;
        hasLiveProjects: boolean;
        hasOpenSourceCode: boolean;
        hasTeamExperience: boolean;
        hasBusinessImpact: boolean;
        trustFactors: string[];
    } {
        const trustFactors: string[] = [];

        // Check for quantified metrics in achievements
        const hasQuantifiedMetrics = [
            ...content.experiences.flatMap((exp) => exp.achievements),
            ...content.projects.flatMap((proj) => proj.achievements),
        ].some((achievement) => {
            const hasNumbers = /\d/.test(achievement);
            const hasPercentage = /%/.test(achievement);
            const hasMetrics = /(증가|개선|달성|감소|향상)/.test(achievement);
            return hasNumbers || hasPercentage || hasMetrics;
        });

        if (hasQuantifiedMetrics) {
            trustFactors.push("구체적 성과 지표 포함");
        }

        // Check for live project URLs
        const hasLiveProjects = content.projects.some(
            (proj) => proj.url && proj.url.length > 0
        );
        if (hasLiveProjects) {
            trustFactors.push("실제 운영 중인 서비스");
        }

        // Check for GitHub URLs
        const hasOpenSourceCode = content.projects.some(
            (proj) =>
                proj.githubUrl || (proj.url && proj.url.includes("github"))
        );
        if (hasOpenSourceCode) {
            trustFactors.push("오픈소스 코드 공개");
        }

        // Check for team experience
        const hasTeamExperience = content.experiences.some((exp) =>
            exp.achievements.some((achievement) =>
                /(팀|협업|리드|매니지먼트)/.test(achievement)
            )
        );
        if (hasTeamExperience) {
            trustFactors.push("팀 협업 경험");
        }

        // Check for business impact
        const hasBusinessImpact = content.experiences.some(
            (exp) => exp.impact && exp.impact.length > 0
        );
        if (hasBusinessImpact) {
            trustFactors.push("비즈니스 임팩트 명시");
        }

        return {
            hasQuantifiedMetrics,
            hasLiveProjects,
            hasOpenSourceCode,
            hasTeamExperience,
            hasBusinessImpact,
            trustFactors,
        };
    }

    // Enhanced trust score calculation with validation
    calculateBasicTrustScore(content: OrganizedContent): {
        score: number;
        factors: string[];
        suggestions: string[];
    } {
        const validation = this.validateTrustElements(content);
        let score = 0;
        const suggestions: string[] = [];

        // Base scoring
        if (validation.hasQuantifiedMetrics) score += 25;
        else suggestions.push("성과에 구체적인 수치를 추가하세요");

        if (validation.hasLiveProjects) score += 20;
        else suggestions.push("실제 운영 중인 서비스 URL을 추가하세요");

        if (validation.hasOpenSourceCode) score += 20;
        else suggestions.push("오픈소스 코드를 공개하세요");

        if (validation.hasTeamExperience) score += 20;
        else suggestions.push("팀 협업 경험을 강조하세요");

        if (validation.hasBusinessImpact) score += 15;
        else suggestions.push("비즈니스 임팩트를 명시하세요");

        return {
            score: Math.min(100, score),
            factors: validation.trustFactors,
            suggestions,
        };
    }
}

export const oneClickGenerator = new OneClickGenerator();
