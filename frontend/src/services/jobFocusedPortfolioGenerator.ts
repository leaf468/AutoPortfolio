// 직무 기반 포트폴리오 생성 서비스
import OpenAI from 'openai';
import { OrganizedContent } from './aiOrganizer';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

// 직무별 핵심 역량 매핑
const JOB_COMPETENCIES = {
  'backend-developer': {
    technical: ['API 설계/구현', '데이터베이스 최적화', '서버 아키텍처', '성능 튜닝', '보안'],
    business: ['서비스 안정성', '확장성', '운영 효율성', '장애 대응', '협업'],
    metrics: ['응답시간', '처리량', '가용성', '에러율', '비용 절감']
  },
  'frontend-developer': {
    technical: ['UI/UX 구현', '성능 최적화', '반응형 디자인', '사용자 경험', '접근성'],
    business: ['사용자 만족도', '전환율', '페이지 성능', '브랜드 일관성', '제품 품질'],
    metrics: ['로딩시간', '전환율', '사용자 만족도', 'Core Web Vitals', 'A/B 테스트 결과']
  },
  'product-manager': {
    technical: ['제품 기획', '사용자 리서치', '데이터 분석', '프로토타이핑', '로드맵 수립'],
    business: ['비즈니스 성과', '사용자 성장', '수익 창출', '시장 점유율', '경쟁력'],
    metrics: ['DAU/MAU', '수익', '전환율', '사용자 유지율', 'NPS']
  },
  'data-analyst': {
    technical: ['데이터 분석', '시각화', '통계 분석', '머신러닝', 'SQL/Python'],
    business: ['비즈니스 인사이트', '의사결정 지원', '성과 측정', '예측 모델링', '최적화'],
    metrics: ['정확도', '예측 성능', '비즈니스 임팩트', '효율성 개선', '비용 절감']
  }
};

// 직무별 프로젝트 스토리텔링 구조
const PROJECT_STORYTELLING_FRAMEWORK = {
  'backend-developer': {
    situation: '서비스 규모/트래픽 상황',
    task: '해결해야 할 기술적 과제', 
    action: '구현한 기술적 해결책',
    result: '성능/안정성 개선 결과',
    metrics: '구체적 수치 (응답시간, 처리량 등)'
  },
  'frontend-developer': {
    situation: '사용자 경험 문제 상황',
    task: 'UI/UX 개선 목표',
    action: '구현한 기술적 솔루션',
    result: '사용자 경험 개선 결과',
    metrics: '성과 지표 (전환율, 만족도 등)'
  }
};

export interface JobFocusedAnalysis {
  jobRole: string;
  keyCompetencies: string[];
  missingElements: string[];
  strengthAreas: string[];
  improvementSuggestions: string[];
  industryAlignment: number; // 0-100
}

export interface ProjectStoryEnhancement {
  projectId: string;
  enhancedStory: {
    situation: string;
    task: string;
    action: string;
    result: string;
    metrics: string[];
  };
  trustSignals: string[];
  industryRelevance: number;
}

export interface JobFocusedPortfolio extends OrganizedContent {
  jobFocusedAnalysis: JobFocusedAnalysis;
  enhancedProjects: ProjectStoryEnhancement[];
  competencyMapping: {
    [competency: string]: {
      projects: string[];
      evidence: string[];
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    };
  };
  trustScore: number;
  industryReadiness: number;
}

class JobFocusedPortfolioGenerator {
  
  // 직무 기반 포트폴리오 분석
  async analyzeJobAlignment(content: OrganizedContent, targetRole: string): Promise<JobFocusedAnalysis> {
    const competencies = JOB_COMPETENCIES[targetRole as keyof typeof JOB_COMPETENCIES] || JOB_COMPETENCIES['backend-developer'];
    
    const systemPrompt = `
당신은 ${targetRole} 채용 전문가입니다. 
포트폴리오를 분석하여 해당 직무에 얼마나 적합한지 평가해주세요.

평가 기준:
1. 핵심 기술 역량: ${competencies.technical.join(', ')}
2. 비즈니스 임팩트: ${competencies.business.join(', ')}
3. 성과 지표: ${competencies.metrics.join(', ')}

HR 관점에서 이 포트폴리오의 강점과 부족한 점을 분석해주세요.

JSON 형식으로 반환:
{
  "jobRole": "${targetRole}",
  "keyCompetencies": ["역량1", "역량2"],
  "missingElements": ["부족한_요소1", "부족한_요소2"],
  "strengthAreas": ["강점1", "강점2"],
  "improvementSuggestions": ["개선사항1", "개선사항2"],
  "industryAlignment": 85
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `포트폴리오 분석 대상:\n${JSON.stringify(content, null, 2)}` }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = response.choices[0].message.content || '{}';
      return this.parseAIResponse(result);
    } catch (error) {
      console.error('Job alignment analysis failed:', error);
      return this.getFallbackAnalysis(targetRole);
    }
  }

  // 프로젝트 스토리텔링 강화
  async enhanceProjectStories(projects: any[], targetRole: string): Promise<ProjectStoryEnhancement[]> {
    const framework = PROJECT_STORYTELLING_FRAMEWORK[targetRole as keyof typeof PROJECT_STORYTELLING_FRAMEWORK];
    if (!framework) return [];

    const enhancements = await Promise.all(projects.map(async (project, index) => {
      const systemPrompt = `
당신은 ${targetRole} 경력의 시니어 전문가입니다.
프로젝트를 STAR 기법으로 재구성하여 HR에게 임팩트를 주는 스토리로 만들어주세요.

구조:
- Situation: ${framework.situation}
- Task: ${framework.task}
- Action: ${framework.action}  
- Result: ${framework.result}
- Metrics: ${framework.metrics}

추가로 신뢰도를 높이는 요소들을 포함해주세요:
- 구체적인 기술 스택
- 팀 규모 및 역할
- 프로젝트 기간
- 실제 비즈니스 임팩트

JSON 형식 반환:
{
  "enhancedStory": {
    "situation": "구체적 상황",
    "task": "해결 과제",
    "action": "실행한 행동",
    "result": "달성한 결과", 
    "metrics": ["수치1", "수치2"]
  },
  "trustSignals": ["신뢰요소1", "신뢰요소2"],
  "industryRelevance": 90
}`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `프로젝트: ${JSON.stringify(project, null, 2)}` }
          ],
          temperature: 0.3,
          max_tokens: 800
        });

        const result = response.choices[0].message.content || '{}';
        const enhancement = this.parseAIResponse(result);
        
        return {
          projectId: `project_${index}`,
          ...enhancement
        };
      } catch (error) {
        console.error(`Project ${index} enhancement failed:`, error);
        return this.getFallbackProjectEnhancement(project, index);
      }
    }));

    return enhancements;
  }

  // 역량 매핑 생성
  generateCompetencyMapping(content: OrganizedContent, enhancements: ProjectStoryEnhancement[], targetRole: string) {
    const competencies = JOB_COMPETENCIES[targetRole as keyof typeof JOB_COMPETENCIES]?.technical || [];
    const mapping: any = {};

    competencies.forEach(competency => {
      const relatedProjects: string[] = [];
      const evidence: string[] = [];
      
      // 프로젝트에서 관련 경험 찾기
      enhancements.forEach(enhancement => {
        if (enhancement.enhancedStory.action.includes(competency) || 
            enhancement.trustSignals.some(signal => signal.includes(competency))) {
          relatedProjects.push(enhancement.projectId);
          evidence.push(enhancement.enhancedStory.result);
        }
      });

      // 경력에서도 관련 경험 찾기
      content.experiences.forEach(exp => {
        if (exp.achievements.some(achievement => achievement.includes(competency))) {
          evidence.push(...exp.achievements.filter(a => a.includes(competency)));
        }
      });

      // 레벨 판정
      let level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
      if (evidence.length >= 3) level = 'intermediate';
      if (evidence.length >= 5) level = 'advanced';
      if (evidence.length >= 7) level = 'expert';

      mapping[competency] = {
        projects: relatedProjects,
        evidence: evidence.slice(0, 5), // 최대 5개만
        level
      };
    });

    return mapping;
  }

  // 신뢰도 점수 계산
  calculateTrustScore(content: OrganizedContent, enhancements: ProjectStoryEnhancement[]): number {
    let score = 0;
    const maxScore = 100;

    // 구체적 수치 포함 여부 (30점)
    const hasMetrics = enhancements.some(e => e.enhancedStory.metrics.length > 0);
    if (hasMetrics) score += 30;

    // 기술 스택 다양성 (20점) 
    const techStack = content.skills.flatMap(skill => skill.skills);
    if (techStack.length >= 10) score += 20;
    else if (techStack.length >= 5) score += 10;

    // 프로젝트 완성도 (25점)
    const completeProjects = enhancements.filter(e => 
      e.enhancedStory.situation && e.enhancedStory.task && e.enhancedStory.action && e.enhancedStory.result
    );
    score += Math.min(25, completeProjects.length * 8);

    // 경력 연속성 (25점)
    if (content.experiences.length >= 2) score += 25;
    else if (content.experiences.length >= 1) score += 15;

    return Math.min(maxScore, score);
  }

  // 업계 준비도 점수
  calculateIndustryReadiness(analysis: JobFocusedAnalysis, trustScore: number): number {
    const alignmentWeight = 0.6;
    const trustWeight = 0.4;
    
    return Math.round(analysis.industryAlignment * alignmentWeight + trustScore * trustWeight);
  }

  // 통합 분석 실행
  async generateJobFocusedPortfolio(content: OrganizedContent, targetRole: string): Promise<JobFocusedPortfolio> {
    console.log(`Generating job-focused portfolio for ${targetRole}`);
    
    // 1. 직무 적합성 분석
    const jobAnalysis = await this.analyzeJobAlignment(content, targetRole);
    
    // 2. 프로젝트 스토리 강화
    const enhancedProjects = await this.enhanceProjectStories(content.projects, targetRole);
    
    // 3. 역량 매핑
    const competencyMapping = this.generateCompetencyMapping(content, enhancedProjects, targetRole);
    
    // 4. 신뢰도 계산
    const trustScore = this.calculateTrustScore(content, enhancedProjects);
    
    // 5. 업계 준비도 계산
    const industryReadiness = this.calculateIndustryReadiness(jobAnalysis, trustScore);

    return {
      ...content,
      jobFocusedAnalysis: jobAnalysis,
      enhancedProjects,
      competencyMapping,
      trustScore,
      industryReadiness
    };
  }

  // 유틸리티 메서드들
  private parseAIResponse(response: string): any {
    try {
      let cleaned = response;
      if (response.includes('```json')) {
        const match = response.match(/```json\n([\s\S]*?)\n```/);
        cleaned = match ? match[1] : response;
      }
      
      // eslint-disable-next-line no-control-regex
      cleaned = cleaned
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('AI response parsing failed:', error);
      return {};
    }
  }

  private getFallbackAnalysis(targetRole: string): JobFocusedAnalysis {
    return {
      jobRole: targetRole,
      keyCompetencies: JOB_COMPETENCIES[targetRole as keyof typeof JOB_COMPETENCIES]?.technical.slice(0, 3) || [],
      missingElements: ['구체적인 성과 지표', '비즈니스 임팩트'],
      strengthAreas: ['기술적 경험', '프로젝트 다양성'],
      improvementSuggestions: ['수치 기반 성과 추가', '비즈니스 영향 강조'],
      industryAlignment: 70
    };
  }

  private getFallbackProjectEnhancement(project: any, index: number): ProjectStoryEnhancement {
    return {
      projectId: `project_${index}`,
      enhancedStory: {
        situation: project.summary || '프로젝트 상황 설명 필요',
        task: '해결해야 할 과제 명시 필요',
        action: project.myRole || '수행한 역할과 행동 구체화 필요',
        result: '달성한 결과 수치화 필요',
        metrics: []
      },
      trustSignals: [project.technologies?.[0] || '기술 스택'],
      industryRelevance: 60
    };
  }
}

export const jobFocusedPortfolioGenerator = new JobFocusedPortfolioGenerator();