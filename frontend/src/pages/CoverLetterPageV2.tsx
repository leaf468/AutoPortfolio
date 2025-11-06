import React, { useState, useEffect } from 'react';
import {
  UserSpec,
  SimilarApplicant,
  CompanyStatistics,
  ComparisonResult as ComparisonResultType,
  getCompanyList,
  compareCoverLetter,
} from '../services/coverLetterAnalysisService';
import { getFlexibleAnalysisData, MatchLevel } from '../services/flexibleAnalysisService';
import SimilarApplicantsSection from '../components/SimilarApplicantsSection';
import StatisticsDashboard from '../components/StatisticsDashboard';
import ComparisonResult from '../components/ComparisonResult';
import CompanyCategorySelector from '../components/CompanyCategorySelector';

interface CoverLetterPageV2Props {}

export const CoverLetterPageV2: React.FC<CoverLetterPageV2Props> = () => {
  const [userSpec, setUserSpec] = useState<UserSpec>({
    targetCompany: '',
    referenceCategory: undefined,
    position: '',
    major: '',
    year: '',
    gpa: '',
    toeic: undefined,
    certificates: [],
  });

  const [coverLetterText, setCoverLetterText] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // 분석 결과 상태
  const [similarApplicants, setSimilarApplicants] = useState<SimilarApplicant[]>([]);
  const [statistics, setStatistics] = useState<CompanyStatistics | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResultType | null>(null);
  const [matchLevel, setMatchLevel] = useState<MatchLevel | null>(null);
  const [matchedCompanies, setMatchedCompanies] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 회사 목록 로드
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      const list = await getCompanyList();
      setCompanies(list);
      setIsLoadingCompanies(false);
    };
    loadCompanies();
  }, []);

  const handleSpecChange = (field: keyof UserSpec, value: any) => {
    setUserSpec((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCertificateAdd = () => {
    const cert = prompt('자격증 이름을 입력하세요:');
    if (cert) {
      setUserSpec((prev) => ({
        ...prev,
        certificates: [...(prev.certificates || []), cert],
      }));
    }
  };

  const handleCertificateRemove = (index: number) => {
    setUserSpec((prev) => ({
      ...prev,
      certificates: (prev.certificates || []).filter((_, i) => i !== index),
    }));
  };

  // 분석 실행
  const handleAnalyze = async () => {
    if (!userSpec.targetCompany || !userSpec.position) {
      alert('지원 회사와 직무를 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // 유연한 분석 데이터 가져오기
      const analysisData = await getFlexibleAnalysisData(
        userSpec.targetCompany,
        undefined,
        userSpec.position,
        10
      );

      setMatchLevel(analysisData.matchLevel);
      setMatchedCompanies(analysisData.matchedCompanies);

      // 유사 지원자 설정
      const similar: SimilarApplicant[] = analysisData.coverLetters.map((cl) => ({
        coverLetter: cl,
        activities: analysisData.activities.filter((a) => a.cover_letter_id === cl.id),
        similarity: 75, // 간단한 유사도
      }));
      setSimilarApplicants(similar);

      // 통계 생성
      const stats: CompanyStatistics = {
        company: userSpec.targetCompany,
        position: userSpec.position,
        totalApplicants: analysisData.totalCount,
        avgGpa: calculateAvgGpa(analysisData.coverLetters),
        avgToeic: calculateAvgToeic(analysisData.coverLetters),
        topActivities: calculateTopActivities(analysisData.activities, analysisData.totalCount),
        topCertificates: [],
      };
      setStatistics(stats);

      // 자소서 비교 (자소서가 있는 경우)
      if (coverLetterText.trim()) {
        const comparison = await compareCoverLetter(coverLetterText, userSpec);
        setComparisonResult(comparison);
      } else {
        setComparisonResult(null);
      }
    } catch (error) {
      console.error('분석 중 오류:', error);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 유틸리티 함수들
  const calculateAvgGpa = (coverLetters: any[]): number => {
    const gpas: number[] = [];
    coverLetters.forEach((cl) => {
      const gpaMatch = cl.specific_info.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
      if (gpaMatch) {
        const gpa = parseFloat(gpaMatch[1]);
        const maxGpa = parseFloat(gpaMatch[2]);
        const normalized = (gpa / maxGpa) * 4.5;
        gpas.push(normalized);
      }
    });
    return gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
  };

  const calculateAvgToeic = (coverLetters: any[]): number => {
    const toeics: number[] = [];
    coverLetters.forEach((cl) => {
      const toeicMatch =
        cl.specific_info.match(/토익\s*(\d+)/i) || cl.specific_info.match(/toeic\s*(\d+)/i);
      if (toeicMatch) {
        toeics.push(parseInt(toeicMatch[1]));
      }
    });
    return toeics.length > 0 ? toeics.reduce((a, b) => a + b, 0) / toeics.length : 0;
  };

  const calculateTopActivities = (activities: any[], total: number): any[] => {
    const activityMap = new Map<string, { count: number; examples: string[] }>();
    activities.forEach((act) => {
      const existing = activityMap.get(act.activity_type) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(act.content);
      }
      activityMap.set(act.activity_type, existing);
    });

    return Array.from(activityMap.entries())
      .map(([type, data]) => ({
        activityType: type,
        count: data.count,
        percentage: (data.count / total) * 100,
        examples: data.examples,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            직무별 자소서 추천 시스템
          </h1>
          <p className="text-lg text-gray-600">
            합격자 데이터 기반으로 당신의 자소서를 분석하고 개선 방향을 제시합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 스펙 입력 폼 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">내 정보 입력</h2>

              <div className="space-y-4">
                {/* 실제 지원 회사 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지원 회사 * <span className="text-xs text-gray-500">(직접 입력)</span>
                  </label>
                  <input
                    type="text"
                    value={userSpec.targetCompany}
                    onChange={(e) => handleSpecChange('targetCompany', e.target.value)}
                    placeholder="예: 네이버, 카카오, 삼성전자"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 참고할 회사 (카테고리별 선택) */}
                <div>
                  <CompanyCategorySelector
                    companies={companies}
                    selectedCompany={undefined}
                    onSelect={(company) => handleSpecChange('targetCompany', company)}
                    label="참고할 회사 (선택사항)"
                    placeholder="참고할 회사 선택"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 이 페이지는 백업용입니다. /cover-letter를 사용하세요
                  </p>
                </div>

                {/* 직무 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지원 직무 *
                  </label>
                  <input
                    type="text"
                    value={userSpec.position}
                    onChange={(e) => handleSpecChange('position', e.target.value)}
                    placeholder="예: 백엔드 개발, 프론트엔드 개발"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 학과 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
                  <input
                    type="text"
                    value={userSpec.major || ''}
                    onChange={(e) => handleSpecChange('major', e.target.value)}
                    placeholder="예: 컴퓨터공학과"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 학년 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                  <select
                    value={userSpec.year || ''}
                    onChange={(e) => handleSpecChange('year', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">선택</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                    <option value="졸업">졸업</option>
                  </select>
                </div>

                {/* 학점 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학점 (4.5 만점)
                  </label>
                  <input
                    type="text"
                    value={userSpec.gpa || ''}
                    onChange={(e) => handleSpecChange('gpa', e.target.value)}
                    placeholder="예: 4.2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 토익 점수 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    토익 점수
                  </label>
                  <input
                    type="number"
                    value={userSpec.toeic || ''}
                    onChange={(e) =>
                      handleSpecChange('toeic', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="예: 850"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 자격증 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">자격증</label>
                  <div className="space-y-2">
                    {(userSpec.certificates || []).map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          {cert}
                        </span>
                        <button
                          onClick={() => handleCertificateRemove(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleCertificateAdd}
                      className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                    >
                      + 자격증 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 자소서 입력 및 분석 결과 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 자소서 입력 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">자기소개서 작성</h2>
              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="자기소개서를 입력하세요..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !userSpec.targetCompany || !userSpec.position}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? '분석 중...' : '분석하기'}
                </button>
              </div>
            </div>

            {/* 매칭 정보 표시 */}
            {matchLevel && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">데이터 매칭 정보</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">매칭 수준:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        matchLevel === MatchLevel.완전일치
                          ? 'bg-green-100 text-green-700'
                          : matchLevel === MatchLevel.같은회사_유사직무
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {matchLevel}
                    </span>
                  </div>
                  {matchedCompanies.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-gray-600">분석 대상:</span>
                      <div className="flex flex-wrap gap-2">
                        {matchedCompanies.map((company) => (
                          <span
                            key={company}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 자소서 비교 결과 */}
            {coverLetterText.trim() && (
              <ComparisonResult result={comparisonResult} isLoading={isAnalyzing} />
            )}

            {/* 통계 대시보드 */}
            <StatisticsDashboard statistics={statistics} isLoading={isAnalyzing} />

            {/* 비슷한 지원자 섹션 */}
            <SimilarApplicantsSection applicants={similarApplicants} isLoading={isAnalyzing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPageV2;
