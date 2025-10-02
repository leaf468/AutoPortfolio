import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseIcon, SparklesIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  tags: string[];
  matchScore: number;
  url: string;
}

interface JobRecommendationSliderProps {
  userKeywords?: string[];
}

// 샘플 직무 데이터 (실제로는 API에서 가져올 데이터)
const SAMPLE_JOBS: JobRecommendation[] = [
  { id: '1', title: '프론트엔드 개발자', company: '네이버', tags: ['React', 'TypeScript', 'UI/UX'], matchScore: 95, url: 'https://recruit.navercorp.com/rcrt/list.do?srchClassCd=1000000' },
  { id: '2', title: '풀스택 개발자', company: '카카오', tags: ['Node.js', 'React', 'AWS'], matchScore: 92, url: 'https://careers.kakao.com/jobs' },
  { id: '3', title: 'UI/UX 디자이너', company: '토스', tags: ['Figma', 'Prototype', '사용자 조사'], matchScore: 88, url: 'https://toss.im/career/jobs' },
  { id: '4', title: '백엔드 개발자', company: '라인', tags: ['Java', 'Spring', 'MSA'], matchScore: 85, url: 'https://careers.linecorp.com/ko/jobs' },
  { id: '5', title: '데이터 분석가', company: '쿠팡', tags: ['Python', 'SQL', 'Tableau'], matchScore: 82, url: 'https://www.coupang.jobs/' },
  { id: '6', title: '제품 매니저', company: '배달의민족', tags: ['기획', 'Agile', '데이터 분석'], matchScore: 80, url: 'https://career.woowahan.com/' },
  { id: '7', title: '모바일 개발자', company: '당근마켓', tags: ['React Native', 'iOS', 'Android'], matchScore: 87, url: 'https://team.daangn.com/jobs/' },
  { id: '8', title: 'DevOps 엔지니어', company: 'SK텔레콤', tags: ['Kubernetes', 'Docker', 'CI/CD'], matchScore: 84, url: 'https://careers.sktelecom.com/' },
  { id: '9', title: '마케팅 매니저', company: '무신사', tags: ['그로스해킹', 'GA4', 'SEO'], matchScore: 78, url: 'https://careers.musinsa.com/' },
  { id: '10', title: 'QA 엔지니어', company: 'NHN', tags: ['자동화 테스트', 'Selenium', 'API 테스트'], matchScore: 81, url: 'https://recruit.nhn.com/' },
  { id: '11', title: 'AI 엔지니어', company: '네이버클라우드', tags: ['Python', 'ML', 'TensorFlow'], matchScore: 90, url: 'https://www.ncloud.com/company/career' },
  { id: '12', title: '블록체인 개발자', company: '두나무', tags: ['Solidity', 'Web3', 'Ethereum'], matchScore: 86, url: 'https://www.dunamu.com/careers' }
];

const JobRecommendationSlider: React.FC<JobRecommendationSliderProps> = ({ userKeywords }) => {
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);

  useEffect(() => {
    // 사용자 키워드 기반으로 직무 필터링/정렬
    const filteredJobs = [...SAMPLE_JOBS].sort(() => Math.random() - 0.5);
    setJobs([...filteredJobs, ...filteredJobs, ...filteredJobs]); // 무한 스크롤을 위해 3배 복제
  }, [userKeywords]);

  const handleJobClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 첫 번째 줄과 두 번째 줄로 나누기
  const firstRowJobs = jobs.slice(0, jobs.length / 2);
  const secondRowJobs = jobs.slice(jobs.length / 2);

  return (
    <div className="w-full overflow-hidden py-8">
      <div className="mb-6 text-center">
        <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          이런 직무는 어떤가요?
        </h3>
      </div>

      <div className="space-y-5">
        {/* 첫 번째 줄 - 왼쪽으로 이동 */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-3"
            animate={{
              x: [0, -3000],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 60,
                ease: "linear",
              },
            }}
          >
            {firstRowJobs.map((job, index) => (
              <div
                key={`row1-${job.id}-${index}`}
                onClick={() => handleJobClick(job.url)}
                className="flex-shrink-0 w-[420px] bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-7 border border-gray-100 cursor-pointer group hover:scale-105"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BriefcaseIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{job.title}</h4>
                      <p className="text-base text-gray-500">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <SparklesIcon className="w-5 h-5 text-yellow-500" />
                      <span className="text-base font-bold text-purple-600">{job.matchScore}%</span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${job.matchScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* 두 번째 줄 - 오른쪽으로 이동 */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-3"
            animate={{
              x: [-3000, 0],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 60,
                ease: "linear",
              },
            }}
          >
            {secondRowJobs.map((job, index) => (
              <div
                key={`row2-${job.id}-${index}`}
                onClick={() => handleJobClick(job.url)}
                className="flex-shrink-0 w-[420px] bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-7 border border-gray-100 cursor-pointer group hover:scale-105"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BriefcaseIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{job.title}</h4>
                      <p className="text-base text-gray-500">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <SparklesIcon className="w-5 h-5 text-yellow-500" />
                      <span className="text-base font-bold text-blue-600">{job.matchScore}%</span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${job.matchScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JobRecommendationSlider;
