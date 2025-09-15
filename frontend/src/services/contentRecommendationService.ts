export interface ContentRecommendation {
    id: string;
    title: string;
    description: string;
    example: string;
    impact: string;
    successRate: number;
    category: 'structure' | 'content' | 'keyword' | 'storytelling';
}

export interface SectionRecommendations {
    [sectionType: string]: ContentRecommendation[];
}

export const contentRecommendations: SectionRecommendations = {
    about: [
        {
            id: 'about-impact-first',
            title: '임팩트 우선 자기소개',
            description: '성과와 임팩트를 앞세워 첫인상을 강하게 만드세요',
            example: '"3년간 웹 서비스 개발로 사용자 경험 40% 개선과 매출 증대에 기여한 풀스택 개발자입니다."',
            impact: '채용담당자의 관심 집중도 +65%',
            successRate: 89,
            category: 'structure'
        },
        {
            id: 'about-problem-solver',
            title: '문제 해결자 포지셔닝',
            description: '기술적 문제해결 능력을 강조하여 전문성을 어필하세요',
            example: '"복잡한 레거시 시스템을 모던 아키텍처로 전환하며 성능을 3배 향상시킨 경험이 있습니다."',
            impact: '기술 면접 통과율 +72%',
            successRate: 84,
            category: 'content'
        },
        {
            id: 'about-growth-mindset',
            title: '성장 마인드셋 강조',
            description: '지속적 학습과 발전 의지를 보여주세요',
            example: '"새로운 기술 습득을 즐기며, 팀과 함께 성장하는 것을 가치로 여기는 개발자입니다."',
            impact: '문화적 적합성 평가 +58%',
            successRate: 76,
            category: 'storytelling'
        },
        {
            id: 'about-specific-tech',
            title: '구체적 기술 스택 명시',
            description: '사용 가능한 기술을 구체적으로 언급하여 매칭도를 높이세요',
            example: '"React, TypeScript, Node.js를 활용한 풀스택 개발과 AWS 기반 클라우드 인프라 구축 경험을 보유하고 있습니다."',
            impact: 'ATS 필터링 통과율 +91%',
            successRate: 93,
            category: 'keyword'
        }
    ],
    
    experience: [
        {
            id: 'exp-quantified-results',
            title: '수치화된 성과 중심',
            description: '구체적인 숫자와 지표로 성과를 표현하세요',
            example: '"사용자 로딩 시간 40% 단축, 서버 비용 30% 절감, 버그 발생률 85% 감소"',
            impact: '경력 평가 점수 +78%',
            successRate: 92,
            category: 'content'
        },
        {
            id: 'exp-star-method',
            title: 'STAR 방법론 적용',
            description: 'Situation-Task-Action-Result 구조로 체계적으로 작성하세요',
            example: '"[상황] 레거시 시스템 성능 이슈 → [과제] API 응답속도 개선 → [행동] 캐싱 전략 도입 → [결과] 응답시간 70% 단축"',
            impact: '구조화된 사고력 인정 +69%',
            successRate: 87,
            category: 'structure'
        },
        {
            id: 'exp-leadership-collaboration',
            title: '리더십 & 협업 경험',
            description: '팀워크와 리더십 경험을 포함하여 소프트 스킬을 어필하세요',
            example: '"3명의 주니어 개발자 멘토링을 담당하며, 코드 리뷰와 기술 세미나를 통해 팀 전체의 개발 역량 향상에 기여"',
            impact: '리더십 역량 평가 +82%',
            successRate: 79,
            category: 'storytelling'
        },
        {
            id: 'exp-tech-migration',
            title: '기술 전환/마이그레이션 경험',
            description: '신기술 도입이나 시스템 전환 경험을 강조하세요',
            example: '"jQuery 기반 레거시 프론트엔드를 React로 전면 전환하며, 개발 생산성 50% 향상"',
            impact: '기술 적응력 인정 +74%',
            successRate: 85,
            category: 'keyword'
        }
    ],
    
    projects: [
        {
            id: 'proj-business-impact',
            title: '비즈니스 임팩트 강조',
            description: '기술적 구현보다 비즈니스에 미친 영향을 중심으로 서술하세요',
            example: '"이커머스 플랫폼 개발로 월 거래액 200% 증가, 고객 만족도 4.8/5.0 달성"',
            impact: '비즈니스 이해도 평가 +86%',
            successRate: 91,
            category: 'content'
        },
        {
            id: 'proj-problem-statement',
            title: '문제 정의부터 시작',
            description: '해결하고자 한 문제를 명확히 정의하고 시작하세요',
            example: '"기존 수동 데이터 처리로 인한 4시간 소요 → 자동화 시스템 구축으로 10분 단축"',
            impact: '문제 해결 능력 인정 +77%',
            successRate: 83,
            category: 'structure'
        },
        {
            id: 'proj-tech-challenge',
            title: '기술적 도전과 해결',
            description: '마주한 기술적 어려움과 창의적 해결 과정을 상세히 설명하세요',
            example: '"대용량 데이터 처리 성능 이슈를 Redis 캐싱과 DB 샤딩으로 해결하여 처리속도 10배 향상"',
            impact: '기술 문제해결력 +81%',
            successRate: 88,
            category: 'storytelling'
        },
        {
            id: 'proj-scalability',
            title: '확장성과 유지보수성',
            description: '장기적 관점에서의 시스템 설계 경험을 강조하세요',
            example: '"마이크로서비스 아키텍처 도입으로 서비스별 독립 배포 가능, 개발팀 확장에 대비한 구조 설계"',
            impact: '시스템 설계 역량 +75%',
            successRate: 80,
            category: 'keyword'
        }
    ],
    
    skills: [
        {
            id: 'skills-proficiency-level',
            title: '숙련도 단계별 분류',
            description: '기술별 숙련도를 구체적으로 분류하여 신뢰성을 높이세요',
            example: '"Expert: React, JavaScript | Advanced: TypeScript, Node.js | Intermediate: Python, Docker"',
            impact: '기술 평가 정확성 +68%',
            successRate: 82,
            category: 'structure'
        },
        {
            id: 'skills-practical-experience',
            title: '실무 적용 경험 명시',
            description: '각 기술을 실제 프로젝트에서 어떻게 활용했는지 설명하세요',
            example: '"React: 3년간 10개+ 프로젝트 | Node.js: RESTful API 설계 및 구현 | AWS: EC2, RDS, S3 운영 경험"',
            impact: '실무 역량 신뢰도 +84%',
            successRate: 89,
            category: 'content'
        },
        {
            id: 'skills-learning-timeline',
            title: '학습 및 성장 스토리',
            description: '기술 습득 과정과 지속적 학습 의지를 보여주세요',
            example: '"2021년 React 입문 → 2022년 TypeScript 도입 → 2023년 Next.js 마스터 → 현재 Web3 기술 학습 중"',
            impact: '성장 잠재력 평가 +71%',
            successRate: 76,
            category: 'storytelling'
        },
        {
            id: 'skills-trending-tech',
            title: '최신 기술 트렌드 반영',
            description: '업계 트렌드에 맞는 최신 기술 스택을 포함하세요',
            example: '"최신 기술: Next.js 13 App Router, Tailwind CSS, Prisma ORM, Vercel 배포 경험"',
            impact: '기술 트렌드 인식 +79%',
            successRate: 85,
            category: 'keyword'
        }
    ],
    
    education: [
        {
            id: 'edu-relevant-coursework',
            title: '관련 전공/과목 강조',
            description: '지원 직무와 관련된 전공 과목이나 프로젝트를 명시하세요',
            example: '"컴퓨터공학 전공 - 자료구조, 알고리즘, 데이터베이스, 소프트웨어 공학 우수 성적 이수"',
            impact: '전공 적합성 평가 +64%',
            successRate: 73,
            category: 'content'
        },
        {
            id: 'edu-practical-projects',
            title: '실습 프로젝트 성과',
            description: '학교에서 진행한 팀 프로젝트나 개인 프로젝트 성과를 포함하세요',
            example: '"졸업작품: 웹 기반 학사관리 시스템 개발, 교수진 및 학생 300명 실사용, 우수작품상 수상"',
            impact: '실무 준비도 평가 +69%',
            successRate: 78,
            category: 'storytelling'
        },
        {
            id: 'edu-continuous-learning',
            title: '지속적 학습 이력',
            description: '온라인 코스, 자격증, 세미나 참여 등 자기계발 노력을 보여주세요',
            example: '"추가 학습: AWS Solutions Architect 자격증, Google Analytics 인증, React 고급 과정 수료"',
            impact: '학습 의지 평가 +72%',
            successRate: 81,
            category: 'keyword'
        }
    ]
};

export class ContentRecommendationService {
    static getRecommendationsForSection(sectionType: string): ContentRecommendation[] {
        return contentRecommendations[sectionType] || [];
    }

    static getTopRecommendation(sectionType: string): ContentRecommendation | null {
        const recommendations = this.getRecommendationsForSection(sectionType);
        if (recommendations.length === 0) return null;
        
        return recommendations.reduce((prev, current) => 
            current.successRate > prev.successRate ? current : prev
        );
    }

    static getRecommendationsByCategory(sectionType: string, category: ContentRecommendation['category']): ContentRecommendation[] {
        return this.getRecommendationsForSection(sectionType)
            .filter(rec => rec.category === category);
    }

    static searchRecommendations(sectionType: string, query: string): ContentRecommendation[] {
        const recommendations = this.getRecommendationsForSection(sectionType);
        const lowerQuery = query.toLowerCase();
        
        return recommendations.filter(rec => 
            rec.title.toLowerCase().includes(lowerQuery) ||
            rec.description.toLowerCase().includes(lowerQuery) ||
            rec.example.toLowerCase().includes(lowerQuery)
        );
    }

    static getRandomRecommendations(sectionType: string, count: number = 2): ContentRecommendation[] {
        const recommendations = this.getRecommendationsForSection(sectionType);
        const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
}