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
} from '@heroicons/react/24/outline';

interface ComprehensiveStatsDashboardProps {
  stats: ComprehensiveStats;
  compact?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ComprehensiveStatsDashboard: React.FC<ComprehensiveStatsDashboardProps> = ({ stats, compact = false }) => {
  const [visibleCount, setVisibleCount] = React.useState(5);

  console.log('📈 ComprehensiveStatsDashboard - Rendering with:', {
    totalApplicants: stats.totalApplicants,
    commonActivitiesCount: stats.commonActivities.length,
    firstActivity: stats.commonActivities[0]
  });

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
          총 {stats.totalApplicants}명의 합격자 데이터를 기반으로 분석했습니다
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

      {/* 학력 통계 */}
      <div>
        <div className="flex items-center mb-4">
          <AcademicCapIcon className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">학력 통계</h3>
        </div>

        {/* 평균 학점 */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">평균 학점</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats.avgGpa.toFixed(2)}<span className="text-lg text-gray-500">/4.5</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 학점 분포 */}
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

          {/* 전공 분포 */}
          {stats.topMajors.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">전공 분포</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topMajors.slice(0, 5).map(m => ({ name: m.name, count: m.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 상위 대학 */}
        {stats.topUniversities.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">상위 출신 대학</p>
            <div className="flex flex-wrap gap-2">
              {stats.topUniversities.slice(0, 10).map((univ, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                >
                  {univ.name} ({univ.count}명)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 어학 통계 */}
      {stats.toeicDistribution.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <LanguageIcon className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">어학 통계</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 평균 토익 */}
            <div>
              <p className="text-sm text-gray-600 mb-2">평균 TOEIC 점수</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.avgToeic > 0 ? Math.round(stats.avgToeic) : '-'}<span className="text-lg text-gray-500">{stats.avgToeic > 0 ? '점' : ''}</span>
              </p>
            </div>

            {/* 토익 분포 */}
            <div>
              <p className="text-sm text-gray-600 mb-3">점수 분포</p>
              <ResponsiveContainer width="100%" height={150}>
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

      {/* 활동 패턴 */}
      {stats.commonActivities.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <UserGroupIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold">상위 10개 항목</h3>
          </div>

          <div className="space-y-4">
            {stats.commonActivities.slice(0, visibleCount).map((activity, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{activity.activityType}</h4>
                  <span className="text-sm font-semibold text-purple-600">
                    {activity.percentage.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{activity.insight}</p>

                {/* 구체적인 활동 예시 */}
                {activity.examples.length > 0 && (
                  <div className="mt-2 mb-3">
                    <p className="text-xs text-gray-500 mb-1">구체적인 활동 예시:</p>
                    <div className="space-y-1">
                      {activity.examples.map((example, idx) => (
                        <p key={idx} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                          • {example.length > 60 ? example.slice(0, 60) + '...' : example}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {activity.commonKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activity.commonKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        #{keyword}
                      </span>
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
      )}
    </div>
  );
};
