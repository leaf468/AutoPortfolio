import React from 'react';
import { ComprehensiveStats } from '../services/comprehensiveAnalysisService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AcademicCapIcon,
  LanguageIcon,
  TrophyIcon,
  UserGroupIcon,
  LightBulbIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ComprehensiveStatsDashboardProps {
  stats: ComprehensiveStats;
  compact?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ComprehensiveStatsDashboard: React.FC<ComprehensiveStatsDashboardProps> = ({ stats, compact = false }) => {
  const [visibleCount, setVisibleCount] = React.useState(5);

  if (stats.totalApplicants === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">해당 직무의 데이터가 충분하지 않습니다.</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-8"}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{stats.position} 직무 종합 분석</h2>
        <p className="text-blue-100">
          AI가 직무 특성을 분석해 제공하는 개인화 통계입니다
        </p>
      </div>

      {/* 핵심 인사이트 */}
      {stats.insights.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">핵심 인사이트</h3>
          </div>
          <div className="space-y-2">
            {stats.insights.map((insight, index) => (
              <div key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-2 mr-3 flex-shrink-0"></span>
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학력 & 어학 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 학력 통계 */}
        <div>
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">학력 통계</h3>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* 평균 학점 */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">평균 학점</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.avgGpa.toFixed(2)}<span className="text-lg text-gray-500">/4.5</span>
              </p>
            </div>

            {stats.gpaDistribution.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">학점 분포</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.gpaDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 어학 통계 */}
        {stats.toeicDistribution.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <LanguageIcon className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">어학 통계</h3>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* 평균 토익 */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">평균 TOEIC 점수</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.avgToeic > 0 ? Math.round(stats.avgToeic) : '-'}<span className="text-lg text-gray-500">{stats.avgToeic > 0 ? '점' : ''}</span>
                </p>
              </div>

              {/* 토익 분포 */}
              <div>
                <p className="text-sm text-gray-600 mb-3">점수 분포</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.toeicDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 추천 활동 & 추천 자격증 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 추천 활동 */}
        {stats.commonActivities.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <UserGroupIcon className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">추천 활동</h3>
            </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {stats.commonActivities.slice(0, visibleCount).map((activity, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-3">{activity.activityType}</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">{activity.insight}</p>

                  {/* 구체적인 활동 예시 */}
                  {activity.anonymizedExamples && activity.anonymizedExamples.length > 0 && (
                    <div className="space-y-2">
                      {activity.anonymizedExamples.map((example, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg">
                          <span className="text-purple-600 font-bold flex-shrink-0">•</span>
                          <p className="text-sm text-gray-800">{example}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stats.commonActivities.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(visibleCount + 10)}
                className="mt-4 w-full py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                더 보기 ({Math.min(10, stats.commonActivities.length - visibleCount)}개 더) ▼
              </button>
            )}
          </div>
          </div>
        )}

        {/* 추천 자격증 */}
        {stats.topCertificates.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold">추천 자격증</h3>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-3">
                {stats.topCertificates.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-50 transition-colors border border-gray-100"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <p className="text-sm font-medium text-gray-900" title={cert.name}>
                      {cert.name}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold text-yellow-700">💡 Tip:</span> 해당 직무에서 취득하면 좋은 추천 자격증입니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* 핵심 역량 키워드 */}
      {stats.topSkills && stats.topSkills.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 text-pink-600 mr-2" />
            <h3 className="text-lg font-semibold">핵심 역량 & 기술 스택</h3>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-4">자주 언급되는 핵심 역량과 기술</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.topSkills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-100 hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-gray-900 text-sm truncate" title={skill.skill}>
                    {skill.skill}
                  </p>
                  <div className="flex items-center justify-end mt-1">
                    <span className="text-xs font-semibold text-pink-600">
                      {skill.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* 추천 개선 사항 */}
      {stats.recommendations && stats.recommendations.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <CheckCircleIcon className="w-6 h-6 text-emerald-600 mr-2" />
            <h3 className="text-lg font-semibold">합격을 위한 추천 사항</h3>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-6">
            <p className="text-sm text-emerald-800 mb-4 font-medium">
              💡 AI 분석을 통한 맞춤형 개선 가이드입니다
            </p>
            <div className="space-y-3">
              {stats.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
