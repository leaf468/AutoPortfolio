import { supabase } from '../lib/supabaseClient';
import { extractCoreActivity } from './comprehensiveAnalysisService';

export interface PositionStats {
  position: string;
  totalApplicants: number;

  // 학점 통계
  avgGpa: number;
  gpaDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  // TOEIC 통계
  avgToeic: number;
  toeicDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  // 상위 활동
  topActivities: {
    activity: string;
    count: number;
    percentage: number;
  }[];

  // 상위 자격증
  topCertificates: {
    certificate: string;
    count: number;
    percentage: number;
  }[];

  // 전공 분포
  majorDistribution: {
    major: string;
    count: number;
    percentage: number;
  }[];

  // 학년 분포
  yearDistribution: {
    year: string;
    count: number;
    percentage: number;
  }[];
}

export async function getPositionStats(position: string): Promise<PositionStats | null> {
  if (!position.trim()) return null;

  try {
    // 1. 해당 직무의 모든 자소서 가져오기
    const { data: coverLetters, error: clError } = await supabase
      .from('cover_letters')
      .select('*')
      .ilike('job_position', `%${position}%`);

    if (clError || !coverLetters || coverLetters.length === 0) {
      return null;
    }

    const totalApplicants = coverLetters.length;

    // 2. specific_info 파싱하여 통계 계산
    const gpas: number[] = [];
    const toeics: number[] = [];
    const majors: { [key: string]: number } = {};
    const years: { [key: string]: number } = {};
    const certificates: { [key: string]: number } = {};

    coverLetters.forEach((cl) => {
      const info = cl.specific_info || '';

      // 학점 추출
      const gpaMatch = info.match(/학점[:\s]*([0-9.]+)/);
      if (gpaMatch) {
        const gpa = parseFloat(gpaMatch[1]);
        if (gpa > 0 && gpa <= 4.5) gpas.push(gpa);
      }

      // TOEIC 추출
      const toeicMatch = info.match(/토익[:\s]*([0-9]+)|TOEIC[:\s]*([0-9]+)/i);
      if (toeicMatch) {
        const toeic = parseInt(toeicMatch[1] || toeicMatch[2]);
        if (toeic >= 300 && toeic <= 990) toeics.push(toeic);
      }

      // 전공 추출
      const majorMatch = info.match(/전공[:\s]*([가-힣a-zA-Z\s]+)/);
      if (majorMatch) {
        const major = majorMatch[1].trim().split(/[,\s]/)[0];
        majors[major] = (majors[major] || 0) + 1;
      }

      // 학년 추출
      const yearMatch = info.match(/([1-4])학년|졸업/);
      if (yearMatch) {
        const year = yearMatch[0];
        years[year] = (years[year] || 0) + 1;
      }

      // 자격증 추출
      const certMatches = info.match(/자격증[:\s]*([^.\n]+)/);
      if (certMatches) {
        const certs = certMatches[1].split(/[,、]/).map(c => c.trim());
        certs.forEach(cert => {
          if (cert && cert.length > 1 && cert.length < 30) {
            certificates[cert] = (certificates[cert] || 0) + 1;
          }
        });
      }
    });

    // 3. 활동 데이터 가져오기 및 매우 구체적으로 카테고리화
    const coverLetterIds = coverLetters.map(cl => cl.id);
    const { data: activities } = await supabase
      .from('activities')
      .select('activity_type, content')
      .in('cover_letter_id', coverLetterIds);

    // 활동 타입별 카테고리 (프로젝트, 논문, 대회 등)
    const activityTypeKeywords: { [key: string]: string[] } = {
      '프로젝트': ['프로젝트', 'project', '개발', '제작', '구현', '설계'],
      '논문 작성': ['논문 작성', '논문 게재', '논문 발표', '연구 논문', 'paper'],
      '논문 읽기': ['논문 읽기', '논문 리뷰', '페이퍼 리뷰', 'paper review'],
      '대회 참가': ['대회', '공모전', '경진대회', '해커톤', 'competition'],
      '대회 수상': ['수상', '입상', '우승', '최우수', '장려'],
      '인턴': ['인턴', 'intern', '실습'],
      '동아리': ['동아리', '스터디', '학회'],
      '봉사': ['봉사', '멘토링', '튜터'],
      '연구': ['연구', 'research', '실험', '랩'],
      '창업': ['창업', '스타트업', 'startup', '운영'],
      '자격증': ['자격증', '자격', '면허'],
      '교육': ['교육', '강의', '수강', '부트캠프'],
    };

    // 주제별 카테고리 (AI, 데이터, 환경 등)
    const topicKeywords: { [key: string]: string[] } = {
      'AI/머신러닝': ['ai', '인공지능', '머신러닝', '딥러닝', 'ml', 'dl', '자연어', 'nlp', '컴퓨터 비전', 'cv'],
      '데이터 분석': ['데이터', 'data', '빅데이터', '분석', 'sql', 'tableau', 'python 분석'],
      '웹 개발': ['웹', 'web', '프론트', 'frontend', '백엔드', 'backend', 'react', 'vue', 'spring', 'node'],
      '앱 개발': ['앱', 'app', '모바일', 'android', 'ios', '안드로이드'],
      '환경/에너지': ['환경', '에너지', '신재생', '친환경', '기후', '탄소', '지속가능'],
      '보건/의료': ['보건', '의료', '헬스케어', '건강', '바이오', '의학'],
      '교육': ['교육', '학습', '에듀테크', '교육공학'],
      '사회/복지': ['복지', '사회', '공익', '사회문제'],
      '경제/금융': ['경제', '금융', '핀테크', '재무', '투자', '회계'],
      '마케팅': ['마케팅', '광고', '브랜딩', 'sns'],
      '보안': ['보안', '해킹', '사이버', '정보보호', 'ctf'],
      '블록체인': ['블록체인', '암호화폐', 'nft', 'web3'],
      '게임': ['게임', 'unity', 'unreal', '게임 개발'],
      'IoT/하드웨어': ['iot', '하드웨어', '임베디드', '센서', '아두이노', '라즈베리파이'],
      '클라우드': ['클라우드', 'aws', 'azure', 'gcp', 'devops'],
    };

    // 매우 구체적인 활동 카테고리 매핑 (우선순위: 구체적 -> 일반적)
    const activityCategories: { [key: string]: string[] } = {
      // 개발 프로젝트 초세분화
      '모바일 앱 개발': ['모바일 앱', '안드로이드', 'android', 'ios', '아이폰'],
      '웹 서비스 개발': ['웹 서비스', '웹사이트', '웹페이지'],
      '웹 프론트엔드': ['웹 프론트', 'react', 'vue', 'angular'],
      '웹 백엔드': ['웹 백엔드', 'node', 'spring', 'django', 'flask'],
      '게임 개발': ['게임', 'unity', 'unreal', '게임 제작'],
      'AI 프로젝트': ['ai 프로젝트', '인공지능 프로젝트', '머신러닝 프로젝트'],
      '챗봇 개발': ['챗봇', 'chatbot', '대화형'],
      '추천 시스템': ['추천', 'recommendation', '추천시스템'],
      '빅데이터 처리': ['빅데이터', 'big data', '대용량'],
      '클라우드 구축': ['클라우드', 'aws', 'azure', 'gcp'],
      '블록체인': ['블록체인', 'blockchain', 'nft'],
      'IoT 프로젝트': ['iot', '사물인터넷', '임베디드'],
      '팀 프로젝트': ['팀 프로젝트', '팀플'],
      '개인 프로젝트': ['개인 프로젝트', '토이프로젝트'],
      '졸업 프로젝트': ['졸업작품', '졸업 프로젝트', '캡스톤'],
      '시스템 설계': ['시스템 설계', '아키텍처', 'architecture'],
      'DB 설계': ['db설계', '데이터베이스 설계', 'erd'],
      '프로젝트': ['프로젝트', 'project'],

      // 인턴/실습 초세분화
      '개발 인턴': ['개발 인턴', '개발자 인턴'],
      '백엔드 인턴': ['백엔드 인턴'],
      '프론트엔드 인턴': ['프론트엔드 인턴'],
      '데이터 인턴': ['데이터 인턴', 'da 인턴', 'ds 인턴'],
      '기획 인턴': ['기획 인턴'],
      '마케팅 인턴': ['마케팅 인턴'],
      '디자인 인턴': ['디자인 인턴'],
      'SW 인턴': ['sw 인턴', '소프트웨어 인턴'],
      '인턴십': ['인턴', '인턴십', 'intern'],
      '현장실습': ['현장실습', '실습'],
      '직무체험': ['직무체험', '잡쉐도잉'],
      '실무 프로젝트': ['실무', '실무경험', '업무'],
      '단기 근무': ['단기', '일용'],
      '아르바이트': ['아르바이트', '알바'],

      // 대외활동 초세분화
      'IT 서포터즈': ['it 서포터즈', 'tech 서포터즈'],
      '기업 서포터즈': ['서포터즈', '서포터'],
      '브랜드 앰버서더': ['앰버서더', '홍보대사', 'ambassador'],
      '대학생 기자단': ['기자단', '리포터', '취재'],
      '홍보 대사': ['홍보단', '홍보활동', '홍보 대사'],
      '체험단': ['체험단', '리뷰단'],
      '마케팅 서포터즈': ['마케팅 서포터즈'],
      '디지털 마케팅': ['디지털 마케팅', '온라인 마케팅', 'sns 마케팅'],
      '콘텐츠 크리에이터': ['크리에이터', 'creator', '유튜버'],
      '브랜드 캠페인': ['캠페인', '프로모션', '브랜드'],
      '대외활동': ['대외활동'],

      // 동아리/학회 초세분화
      'IT/개발 동아리': ['it동아리', '개발동아리', '코딩동아리', '프로그래밍동아리'],
      '알고리즘 스터디': ['알고리즘', 'ps', '코딩테스트 스터디'],
      '학술동아리': ['학술동아리', '학회'],
      '전공 학회': ['전공 학회', '전공동아리'],
      '연합 동아리': ['연합동아리', '연합'],
      '창업동아리': ['창업동아리', '예비창업'],
      'AI/ML 동아리': ['ai동아리', 'ml동아리', '인공지능동아리'],
      '데이터 분석 동아리': ['데이터동아리', 'da동아리'],
      '보안 동아리': ['보안동아리', '해킹동아리'],
      '로봇 동아리': ['로봇동아리', '로보틱스'],
      '게임 개발 동아리': ['게임동아리', '게임 개발'],
      '개발 스터디': ['개발 스터디', '코딩 스터디'],
      '영어 스터디': ['영어 스터디', '토익 스터디', '어학 스터디'],
      '취업 스터디': ['취업 스터디', '면접 스터디'],
      '독서 모임': ['독서', '북클럽'],
      '기술 세미나': ['기술 세미나', 'tech 세미나'],
      '컨퍼런스 참가': ['컨퍼런스', 'conference'],
      '동아리': ['동아리', '소모임'],

      // 공모전/대회 초세분화
      '해커톤 참가': ['해커톤', 'hackathon'],
      '해커톤 입상': ['해커톤 수상', '해커톤 우승', '해커톤 입상'],
      'AI 공모전': ['ai 공모전', '인공지능 공모전'],
      '빅데이터 공모전': ['빅데이터 공모전', '데이터 공모전'],
      '앱 개발 공모전': ['앱 공모전', '앱 개발 공모전'],
      '창업 경진대회': ['창업 경진', '창업 대회', '비즈니스 대회'],
      '아이디어 공모전': ['아이디어 공모', '아이디어 경진'],
      '기획 공모전': ['기획 공모', '마케팅 공모'],
      '디자인 공모전': ['디자인 공모'],
      'UX 공모전': ['ux 공모'],
      '코딩 대회': ['코딩 대회', '프로그래밍 대회'],
      '알고리즘 대회': ['알고리즘 대회', 'icpc', 'acm'],
      '공모전': ['공모전', '공모'],
      '경진대회': ['경진대회', '대회'],

      // 봉사 초세분화
      '코딩 멘토링': ['코딩 멘토링', '프로그래밍 멘토링'],
      '교육 멘토링': ['교육 멘토링', '학습 멘토링'],
      '입시 멘토링': ['입시 멘토', '진로 멘토'],
      '튜터링': ['튜터링', '튜터'],
      '교육 봉사': ['교육봉사', '교육 봉사'],
      '재능 기부': ['재능기부', '재능나눔'],
      '해외봉사활동': ['해외봉사', '국제봉사'],
      '사회 봉사': ['사회봉사', '지역봉사'],
      '봉사활동': ['봉사', '봉사활동', '자원봉사'],

      // 교육/자격증 초세분화
      '코딩 부트캠프': ['코딩 부트캠프', '개발 부트캠프'],
      'SW 부트캠프': ['sw 부트캠프', '소프트웨어 부트캠프'],
      '데이터 부트캠프': ['데이터 부트캠프', 'ai 부트캠프'],
      'IT 교육과정': ['it 교육', '개발 교육'],
      '온라인 강의': ['온라인강의', '인강', '유데미', 'udemy', 'coursera'],
      '자격증(정보처리)': ['정보처리', '정보처리기사', '정처기'],
      '자격증(네트워크)': ['네트워크', 'ccna', '네트워크관리사'],
      '자격증(보안)': ['정보보안', '보안', '정보보안기사'],
      '자격증(빅데이터)': ['빅데이터', 'adsp', 'adb'],
      '자격증(클라우드)': ['aws', 'azure', 'gcp', '클라우드'],
      '어학 자격증': ['토익', 'toeic', 'opic', '토스', 'hsk', 'jlpt'],
      '자격증': ['자격증', '자격', '면허'],

      // 연구/학술 초세분화
      '학부연구생(UROP)': ['urop', '학부연구', '학부생연구'],
      '인공지능 연구': ['ai 연구', '인공지능 연구'],
      '데이터 과학 연구': ['데이터 연구', '데이터 과학'],
      '연구실 인턴': ['연구실 인턴', 'lab 인턴'],
      '연구 보조': ['연구 보조', '연구원'],
      '논문 게재': ['논문', '학술', '저널', 'paper'],
      '학회 발표': ['학회 발표', '학술대회'],
      '실험 연구': ['실험', '실험실', 'lab'],
      '데이터 수집/분석': ['데이터 수집', '데이터 분석'],

      // 창업/운영 초세분화
      '스타트업 창업': ['스타트업', 'startup'],
      '1인 창업': ['1인 창업', '개인사업'],
      '팀 창업': ['팀 창업', '공동창업'],
      '앱 서비스 운영': ['앱 운영', '서비스 운영'],
      '쇼핑몰 운영': ['쇼핑몰', '온라인 스토어', '이커머스'],
      '블로그 운영': ['블로그', '기술블로그', '티스토리'],
      'SNS 운영': ['인스타', 'instagram', '유튜브 운영'],
      '커뮤니티 운영': ['커뮤니티', '온라인 커뮤니티'],
      '창업': ['창업', '사업'],

      // 리더십 초세분화
      '학생회장': ['학생회장', '총학생회장'],
      '과대표': ['과대', '과학생회장', '학과 대표'],
      '동아리 회장': ['동아리 회장', '동아리장'],
      '팀장': ['팀장', '팀 리더'],
      '파트장': ['파트장', '파트 리더'],
      '프로젝트 리더': ['프로젝트 리더', 'pl'],
      '운영진': ['운영진', '총무', '부회장'],
      '멘토': ['멘토', 'mentor'],

      // 수상 초세분화 (주제별 카테고리 추가)
      '공모전 대상': ['대상', '최우수상'],
      '공모전 우수상': ['우수상', '우승'],
      '공모전 입상': ['입상', '수상'],
      '학술 수상': ['논문상', '학술상'],
      '전액장학금': ['전액장학', '전액 장학금'],
      '성적우수 장학금': ['성적장학', '학업장학'],
      '장학금': ['장학금', '장학생'],

      // 수상/논문 주제별 카테고리
      'AI/머신러닝 관련': ['ai', '인공지능', '머신러닝', '딥러닝', 'ml', 'dl'],
      '데이터 분석 관련': ['데이터', 'data', '빅데이터', '분석'],
      '환경/에너지 관련': ['환경', '에너지', '신재생', '친환경', '기후', '탄소'],
      '보건/의료 관련': ['보건', '의료', '헬스케어', '건강', '바이오'],
      '교육 관련': ['교육', '학습', '에듀테크', '교육공학'],
      '사회복지 관련': ['복지', '사회', '공익', '봉사'],
      '경제/금융 관련': ['경제', '금융', '핀테크', '재무', '투자'],
      '마케팅/광고 관련': ['마케팅', '광고', '브랜딩', 'sns 마케팅'],
      'IoT/하드웨어 관련': ['iot', '하드웨어', '임베디드', '센서', '아두이노'],
      '블록체인/암호화 관련': ['블록체인', '암호화폐', 'nft', 'web3'],
      '게임/엔터테인먼트 관련': ['게임', '엔터', '콘텐츠'],
      '교통/모빌리티 관련': ['교통', '모빌리티', '자율주행', '스마트카'],
      '보안/해킹 관련': ['보안', '해킹', '사이버', '정보보호', 'ctf'],

      // 해외/글로벌 초세분화
      '교환학생': ['교환학생', '교환'],
      '복수학위': ['복수학위', '복수전공'],
      '어학연수': ['어학연수', '연수', '언어연수'],
      '해외 인턴십': ['해외인턴', '해외 인턴', 'global intern'],
      '해외 탐방': ['해외탐방', '글로벌 탐방', '문화탐방'],
      '국제 컨퍼런스': ['국제 컨퍼런스', 'international conference'],
      '글로벌 프로그램': ['글로벌', '국제', '해외'],

      // 직무별 초구체적 활동
      'UX 리서치': ['ux리서치', 'ux 리서치', '사용자 조사', 'user research'],
      'UI 디자인': ['ui디자인', 'ui 디자인', '인터페이스 디자인'],
      '그래픽 디자인': ['그래픽', 'graphic', '시각디자인'],
      '영상 제작': ['영상', '영상 제작', '비디오'],
      'SNS 콘텐츠': ['sns 콘텐츠', '소셜미디어'],
      '블로그 포스팅': ['블로그', '포스팅', '기술블로그'],
      '데이터 분석': ['데이터 분석', '데이터분석', 'da'],
      'SQL 분석': ['sql', 'sql 분석'],
      'Python 분석': ['python 분석', '파이썬 분석'],
      '통계 분석': ['통계', '통계 분석'],
      '머신러닝': ['머신러닝', 'machine learning', 'ml'],
      '딥러닝': ['딥러닝', 'deep learning', 'dl'],
      '자연어처리': ['nlp', '자연어', '자연어처리'],
      '컴퓨터 비전': ['cv', '컴퓨터 비전', 'computer vision', '영상처리'],
      '백엔드 개발': ['백엔드', 'backend', '서버 개발'],
      '프론트엔드 개발': ['프론트엔드', 'frontend', '프론트'],
      '풀스택 개발': ['풀스택', 'fullstack'],
      'DevOps': ['devops', 'ci/cd', '배포'],
      '테스트/QA': ['테스트', 'qa', '품질관리'],
      '서비스 기획': ['서비스 기획', '서비스 개선'],
      '사업 기획': ['사업 기획', '비즈니스 기획'],
      '전략 기획': ['전략 기획', '전략'],
      'PM': ['pm', 'product manager', '프로덕트'],
      'PO': ['po', 'product owner'],
      'B2B 영업': ['b2b', 'b2b 영업'],
      'B2C 영업': ['b2c', 'b2c 영업'],
      '영업': ['영업', '세일즈', '판매'],
      'CS/고객지원': ['cs', '고객', '상담', '고객서비스', '고객지원'],
      'HR/인사': ['hr', '인사', '채용'],
      '재무/회계': ['재무', '회계', 'accounting'],
    };

    // DB에서 구체적인 프로젝트명/활동명만 추출
    const combinedActivityCounts: { [key: string]: number} = {};

    // 구체적인 활동 패턴들 (prefix + keyword 형태)
    const activityPatterns = [
      { keyword: '프로젝트', pattern: /([\w가-힣]{2,15})\s*프로젝트/g },
      { keyword: '개발', pattern: /([\w가-힣]{2,15})\s*개발/g },
      { keyword: '인턴', pattern: /([\w가-힣]{2,15})\s*인턴/g },
      { keyword: '공모전', pattern: /([\w가-힣]{2,15})\s*공모전/g },
      { keyword: '대회', pattern: /([\w가-힣]{2,15})\s*대회/g },
      { keyword: '해커톤', pattern: /([\w가-힣]{2,15})\s*해커톤/g },
      { keyword: '연구', pattern: /([\w가-힣]{2,15})\s*연구/g },
      { keyword: '스터디', pattern: /([\w가-힣]{2,15})\s*스터디/g },
      { keyword: '동아리', pattern: /([\w가-힣]{2,15})\s*동아리/g },
    ];

    // 제외할 prefix (너무 일반적이거나 의미 없는 것들)
    const skipPrefixes = [
      '핵심', '주요', '중요', '다양한', '여러', '기타', '관련', '전반',
      '의', '을', '를', '이', '가', '에서', '에게', '으로', '로',
      '했던', '진행한', '수행한', '참여한', '만든', '개발한',
      '첫', '두번째', '세번째', '마지막',
      '학교', '대학', '회사', '기업',
    ];

    activities?.forEach(activity => {
      const content = activity.content || '';

      if (content.length < 20) return;

      // 각 패턴별로 매칭 시도
      activityPatterns.forEach(({ keyword, pattern }) => {
        const matches = Array.from(content.matchAll(pattern));

        matches.forEach(match => {
          let prefix = match[1].trim();

          // 제외 패턴 체크
          if (skipPrefixes.some(skip => prefix.includes(skip))) {
            return;
          }

          // prefix가 너무 짧거나 숫자로만 이루어진 경우 제외
          if (prefix.length < 2 || /^\d+$/.test(prefix)) {
            return;
          }

          const activityName = `${prefix} ${keyword}`;

          // 카운트 증가
          combinedActivityCounts[activityName] = (combinedActivityCounts[activityName] || 0) + 1;
        });
      });
    });

    // 4. 통계 계산
    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
    const avgToeic = toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;

    // 학점 분포
    const gpaDistribution = [
      { range: '4.0 이상', count: gpas.filter(g => g >= 4.0).length, percentage: 0 },
      { range: '3.5-3.9', count: gpas.filter(g => g >= 3.5 && g < 4.0).length, percentage: 0 },
      { range: '3.0-3.4', count: gpas.filter(g => g >= 3.0 && g < 3.5).length, percentage: 0 },
      { range: '3.0 미만', count: gpas.filter(g => g < 3.0).length, percentage: 0 },
    ].map(item => ({
      ...item,
      percentage: gpas.length > 0 ? (item.count / gpas.length) * 100 : 0,
    }));

    // TOEIC 분포
    const toeicDistribution = [
      { range: '900 이상', count: toeics.filter(t => t >= 900).length, percentage: 0 },
      { range: '800-899', count: toeics.filter(t => t >= 800 && t < 900).length, percentage: 0 },
      { range: '700-799', count: toeics.filter(t => t >= 700 && t < 800).length, percentage: 0 },
      { range: '700 미만', count: toeics.filter(t => t < 700).length, percentage: 0 },
    ].map(item => ({
      ...item,
      percentage: toeics.length > 0 ? (item.count / toeics.length) * 100 : 0,
    }));

    // 총 활동 수 (100% 넘는 문제 해결)
    const totalActivities = Object.values(combinedActivityCounts).reduce((a, b) => a + b, 0);

    // 상위 활동 (상위 10개) - 전체 활동 대비 비율
    const topActivities = Object.entries(combinedActivityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([activity, count]) => ({
        activity,
        count,
        percentage: totalActivities > 0 ? (count / totalActivities) * 100 : 0,
      }));

    // 상위 자격증 (상위 10개)
    const topCertificates = Object.entries(certificates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([certificate, count]) => ({
        certificate,
        count,
        percentage: (count / totalApplicants) * 100,
      }));

    // 전공 분포 (상위 10개)
    const majorDistribution = Object.entries(majors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([major, count]) => ({
        major,
        count,
        percentage: (count / totalApplicants) * 100,
      }));

    // 학년 분포
    const yearDistribution = Object.entries(years)
      .sort((a, b) => b[1] - a[1])
      .map(([year, count]) => ({
        year,
        count,
        percentage: (count / totalApplicants) * 100,
      }));

    return {
      position,
      totalApplicants,
      avgGpa,
      gpaDistribution,
      avgToeic,
      toeicDistribution,
      topActivities,
      topCertificates,
      majorDistribution,
      yearDistribution,
    };
  } catch (error) {
    console.error('Error fetching position stats:', error);
    return null;
  }
}
