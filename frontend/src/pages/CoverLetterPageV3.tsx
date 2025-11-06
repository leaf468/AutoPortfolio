import React, { useState, useEffect } from 'react';
import { UserSpec } from '../services/coverLetterAnalysisService';
import { ComprehensiveStats, getComprehensiveStats } from '../services/comprehensiveAnalysisService';
import { CompanyCategoryOnlySelector } from '../components/CompanyCategoryOnlySelector';
import { CompanyCategory } from '../services/companyCategories';
import { CoverLetterQuestion, CoverLetterQuestionInput } from '../components/CoverLetterQuestionInput';
import { AIRecommendationPanel } from '../components/AIRecommendationPanel';
import { ComprehensiveStatsDashboard } from '../components/ComprehensiveStatsDashboard';
import { analyzeCoverLetterComplete } from '../services/aiRecommendationService';
import {
  RecommendedCompany,
  getRecommendedCompaniesByCategory
} from '../services/categoryBasedRecommendationService';
import { analyzeAllQuestions, QuestionAnalysis } from '../services/questionAnalysisService';
import { QuestionAnalysisPanel } from '../components/QuestionAnalysisPanel';
import { PositionStats, getPositionStats } from '../services/positionStatsService';
import { PositionStatsPanel } from '../components/PositionStatsPanel';

const DEFAULT_QUESTIONS: Omit<CoverLetterQuestion, 'answer'>[] = [
  {
    id: 'q1',
    question: '지원 동기를 작성해주세요.',
    placeholder: '해당 회사/직무에 지원하게 된 이유와 본인의 목표를 구체적으로 작성해주세요...',
    maxLength: 1000,
  },
  {
    id: 'q2',
    question: '관련 경험이나 프로젝트를 설명해주세요.',
    placeholder: '지원하는 직무와 관련된 경험, 프로젝트, 활동 등을 구체적으로 작성해주세요...',
    maxLength: 1500,
  },
  {
    id: 'q3',
    question: '본인의 강점과 역량을 작성해주세요.',
    placeholder: '본인이 가진 강점과 역량을 구체적인 사례와 함께 작성해주세요...',
    maxLength: 1000,
  },
  {
    id: 'q4',
    question: '입사 후 포부와 목표를 작성해주세요.',
    placeholder: '입사 후 이루고 싶은 목표와 기여할 수 있는 부분을 작성해주세요...',
    maxLength: 800,
  },
];

export const CoverLetterPageV3: React.FC = () => {
  // 기본 정보
  const [userSpec, setUserSpec] = useState<UserSpec>({
    targetCompany: '',
    referenceCategory: undefined,
    position: '',
    major: '',
    year: '',
    gpa: '',
    toeic: undefined,
    certificates: [],
    others: [],
  });

  const [questions, setQuestions] = useState<CoverLetterQuestion[]>(
    DEFAULT_QUESTIONS.map((q) => ({ ...q, answer: '' }))
  );
  const [focusedQuestionId, setFocusedQuestionId] = useState<string>('');

  // 추천 회사
  const [recommendedCompanies, setRecommendedCompanies] = useState<RecommendedCompany[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // 직무 통계
  const [positionStats, setPositionStats] = useState<PositionStats | null>(null);
  const [isLoadingPositionStats, setIsLoadingPositionStats] = useState(false);

  // 분석 상태
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [questionAnalyses, setQuestionAnalyses] = useState<QuestionAnalysis[]>([]);
  const [isLoadingQuestionAnalysis, setIsLoadingQuestionAnalysis] = useState(false);
  const [overallAnalysis, setOverallAnalysis] = useState<{
    overallScore: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  } | null>(null);

  // 카테고리 + 직무가 입력되면 추천 회사 로드
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!userSpec.referenceCategory || !userSpec.position.trim()) {
        setRecommendedCompanies([]);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        const recommendations = await getRecommendedCompaniesByCategory(
          userSpec.referenceCategory as CompanyCategory,
          userSpec.position,
          5
        );
        setRecommendedCompanies(recommendations);
      } catch (error) {
        console.error('추천 회사 로드 실패:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    const timeoutId = setTimeout(loadRecommendations, 500);
    return () => clearTimeout(timeoutId);
  }, [userSpec.referenceCategory, userSpec.position]);

  // 직무가 입력되면 자동으로 종합 통계 및 직무 통계 로드
  useEffect(() => {
    const loadStats = async () => {
      if (!userSpec.position.trim()) {
        setComprehensiveStats(null);
        setPositionStats(null);
        return;
      }

      setIsLoadingStats(true);
      setIsLoadingPositionStats(true);
      try {
        const [stats, posStats] = await Promise.all([
          getComprehensiveStats(userSpec.position),
          getPositionStats(userSpec.position),
        ]);
        setComprehensiveStats(stats);
        setPositionStats(posStats);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingPositionStats(false);
      }
    };

    const timeoutId = setTimeout(loadStats, 500);
    return () => clearTimeout(timeoutId);
  }, [userSpec.position]);

  const handleSpecChange = (field: keyof UserSpec, value: any) => {
    setUserSpec((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answer } : q))
    );
  };

  const handleQuestionChange = (questionId: string, question: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, question } : q))
    );
  };

  const handleMaxLengthChange = (questionId: string, maxLength: number | undefined) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, maxLength } : q))
    );
  };

  const handleQuestionAdd = () => {
    const newQuestion: CoverLetterQuestion = {
      id: `q${Date.now()}`,
      question: '새로운 질문을 입력하세요',
      answer: '',
      placeholder: '답변을 작성해주세요...',
      maxLength: 1000,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleQuestionRemove = (questionId: string) => {
    if (questions.length <= 1) {
      alert('최소 1개의 질문은 필요합니다.');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleQuestionFocus = (questionId: string) => {
    setFocusedQuestionId(questionId);
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

  const handleOtherAdd = () => {
    const other = prompt('기타 항목을 입력하세요:');
    if (other) {
      setUserSpec((prev) => ({
        ...prev,
        others: [...(prev.others || []), other],
      }));
    }
  };

  const handleOtherRemove = (index: number) => {
    setUserSpec((prev) => ({
      ...prev,
      others: (prev.others || []).filter((_, i) => i !== index),
    }));
  };

  const handleAnalyzeQuestions = async () => {
    if (!userSpec.position.trim()) {
      alert('직무를 입력해주세요.');
      return;
    }

    setIsLoadingQuestionAnalysis(true);
    try {
      const analyses = await analyzeAllQuestions(
        questions.map((q) => ({ id: q.id, question: q.question })),
        userSpec.position
      );
      setQuestionAnalyses(analyses);

      setTimeout(() => {
        document.getElementById('question-analysis')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('질문 분석 실패:', error);
      alert('질문 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingQuestionAnalysis(false);
    }
  };

  const handleAnalyzeComplete = async () => {
    if (!userSpec.position.trim()) {
      alert('직무를 입력해주세요.');
      return;
    }

    const answeredQuestions = questions.filter((q) => q.answer.trim().length > 0);
    if (answeredQuestions.length === 0) {
      alert('최소 하나 이상의 질문에 답변해주세요.');
      return;
    }

    try {
      const analysis = await analyzeCoverLetterComplete(
        answeredQuestions.map((q) => ({ question: q.question, answer: q.answer })),
        userSpec.position
      );
      setOverallAnalysis(analysis);

      setTimeout(() => {
        document.getElementById('overall-analysis')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('종합 분석 실패:', error);
      alert('분석 중 오류가 발생했습니다.');
    }
  };

  const currentInput = focusedQuestionId
    ? questions.find((q) => q.id === focusedQuestionId)?.answer || ''
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            AI 기반 자소서 작성 도우미
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            실제 합격자 데이터를 기반으로 실시간 피드백을 받으며 자소서를 작성하세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 정보 입력 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 왼쪽: 기본 정보 입력 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">정보 입력</h2>

              <div className="space-y-5">
                {/* 첫 번째 행: 지원 회사, 지원 직무 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지원 회사 *</label>
                    <input
                      type="text"
                      value={userSpec.targetCompany}
                      onChange={(e) => handleSpecChange('targetCompany', e.target.value)}
                      placeholder="예: 네이버, 카카오"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지원 직무 *</label>
                    <input
                      type="text"
                      value={userSpec.position}
                      onChange={(e) => handleSpecChange('position', e.target.value)}
                      placeholder="예: 백엔드 개발"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 두 번째 행: 학과, 학년, 학점, TOEIC */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
                    <input
                      type="text"
                      value={userSpec.major || ''}
                      onChange={(e) => handleSpecChange('major', e.target.value)}
                      placeholder="컴퓨터공학"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                    <select
                      value={userSpec.year || ''}
                      onChange={(e) => handleSpecChange('year', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                      <option value="졸업">졸업</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학점</label>
                    <input
                      type="text"
                      value={userSpec.gpa || ''}
                      onChange={(e) => handleSpecChange('gpa', e.target.value)}
                      placeholder="4.2/4.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TOEIC</label>
                    <input
                      type="number"
                      value={userSpec.toeic || ''}
                      onChange={(e) =>
                        handleSpecChange('toeic', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      placeholder="850"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 세 번째 행: 자격증, 기타 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">자격증</label>
                    <div className="flex flex-wrap gap-2">
                      {(userSpec.certificates || []).map((cert, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                          {cert}
                          <button
                            onClick={() => handleCertificateRemove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={handleCertificateAdd}
                        className="px-3 py-1 border border-dashed border-gray-400 rounded-full text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        + 추가
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기타</label>
                    <div className="flex flex-wrap gap-2">
                      {(userSpec.others || []).map((other, index) => (
                        <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-2">
                          {other}
                          <button
                            onClick={() => handleOtherRemove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={handleOtherAdd}
                        className="px-3 py-1 border border-dashed border-gray-400 rounded-full text-sm text-gray-600 hover:border-green-500 hover:text-green-500"
                      >
                        + 추가
                      </button>
                    </div>
                  </div>
                </div>

                {/* 카테고리 선택 */}
                <div className="pt-4 border-t border-gray-200">
                  <CompanyCategoryOnlySelector
                    selectedCategory={userSpec.referenceCategory as CompanyCategory | undefined}
                    onSelect={(category) => handleSpecChange('referenceCategory', category)}
                    label="참고 카테고리 (선택)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 직무 통계 */}
          <div className="lg:col-span-1">
            <PositionStatsPanel
              stats={positionStats}
              isLoading={isLoadingPositionStats}
            />
          </div>
        </div>

        {/* 메인 콘텐츠: 질문 답변 (좌) + AI 추천 (우) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 좌측: 질문 답변 (2/3) */}
          <div className="lg:col-span-2">
            <CoverLetterQuestionInput
              questions={questions}
              onAnswerChange={handleAnswerChange}
              onQuestionChange={handleQuestionChange}
              onMaxLengthChange={handleMaxLengthChange}
              onQuestionAdd={handleQuestionAdd}
              onQuestionRemove={handleQuestionRemove}
              onFocus={handleQuestionFocus}
            />

            {/* 분석 버튼 */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={handleAnalyzeQuestions}
                disabled={!userSpec.position.trim() || isLoadingQuestionAnalysis}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingQuestionAnalysis ? '분석 중...' : '질문 분석'}
              </button>
              <button
                onClick={handleAnalyzeComplete}
                disabled={!userSpec.position.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                답변 종합 분석
              </button>
            </div>
          </div>

          {/* 우측: AI 추천 패널 (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg sticky top-24 h-[calc(100vh-7rem)]">
              <AIRecommendationPanel
                currentInput={currentInput}
                position={userSpec.position}
                questionId={focusedQuestionId}
              />
            </div>
          </div>
        </div>

        {/* 질문 분석 결과 */}
        <div id="question-analysis">
          <QuestionAnalysisPanel
            analyses={questionAnalyses}
            isLoading={isLoadingQuestionAnalysis}
          />
        </div>

        {/* 종합 분석 결과 */}
        {overallAnalysis && (
          <div id="overall-analysis" className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">종합 분석 결과</h2>

            {/* 점수 */}
            <div className="mb-6 text-center">
              <div className="inline-block">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {overallAnalysis.overallScore}
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <p className="text-sm text-gray-600">종합 점수</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 강점 */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  ✅ 강점 ({overallAnalysis.strengths.length})
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-700">• {strength}</li>
                  ))}
                </ul>
              </div>

              {/* 개선점 */}
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                  ⚠️ 개선점 ({overallAnalysis.improvements.length})
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-orange-700">• {improvement}</li>
                  ))}
                </ul>
              </div>

              {/* 추천사항 */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                  💡 추천 ({overallAnalysis.recommendations.length})
                </h3>
                <ul className="space-y-2">
                  {overallAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 직무별 종합 통계 */}
        {userSpec.position.trim() && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {userSpec.position} 직무 합격자 통계
            </h2>
            {isLoadingStats ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">데이터 분석 중...</p>
              </div>
            ) : comprehensiveStats ? (
              <ComprehensiveStatsDashboard stats={comprehensiveStats} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterPageV3;
