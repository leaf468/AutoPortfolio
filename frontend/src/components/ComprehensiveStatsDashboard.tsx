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
          합격자 데이터를 기반으로 분석했습니다
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
                <BarChart data={stats.topMajors.slice(0, 5).map(m => ({
                  name: m.name,
                  percentage: stats.totalApplicants > 0 ? (m.count / stats.totalApplicants * 100) : 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Bar dataKey="percentage" fill="#8B5CF6" />
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
                  {univ.name}
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

                {/* 구체적인 활동 예시 (익명화된 데이터) */}
                {activity.anonymizedExamples && activity.anonymizedExamples.length > 0 && (
                  <div className="mt-2 mb-3">
                    <p className="text-xs text-gray-500 mb-1">구체적인 활동 예시:</p>
                    <div className="space-y-1">
                      {activity.anonymizedExamples.map((example, idx) => (
                        <p key={idx} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                          • {example.length > 80 ? example.slice(0, 80) + '...' : example}
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

      {/* 활동 참여도 */}
      {stats.activityEngagement && stats.activityEngagement.avgActivityCount > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <ChartBarIcon className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold">활동 참여도</h3>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 평균 활동 개수 */}
              <div>
                <p className="text-sm text-gray-600 mb-2">평균 활동 개수</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats.activityEngagement.avgActivityCount.toFixed(1)}<span className="text-lg text-gray-500">개</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  합격자들은 평균적으로 {stats.activityEngagement.avgActivityCount.toFixed(0)}개의 활동 경험을 작성합니다
                </p>
              </div>

              {/* 활동 개수 분포 */}
              <div>
                <p className="text-sm text-gray-600 mb-3">활동 개수 분포</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={stats.activityEngagement.activityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 핵심 역량 키워드 */}
      {stats.topSkills && stats.topSkills.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 text-pink-600 mr-2" />
            <h3 className="text-lg font-semibold">핵심 역량 & 기술 스택</h3>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-4">합격자들이 자주 언급하는 역량과 기술</p>
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

      {/* 자격증 통계 */}
      {stats.topCertificates.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold">주요 자격증 분포</h3>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* 원형 그래프 */}
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const topCerts = stats.topCertificates.slice(0, 10);
                        const totalPercentage = topCerts.reduce((sum, cert) => sum + cert.percentage, 0);
                        return topCerts.map(cert => ({
                          name: cert.name,
                          value: totalPercentage > 0 ? (cert.percentage / totalPercentage) * 100 : 0,
                          originalPercentage: cert.percentage
                        }));
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={130}
                      innerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {stats.topCertificates.slice(0, 10).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          stroke="#fff"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-gray-100">
                              <p className="font-bold text-gray-900 mb-2">{data.name}</p>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600">
                                  그래프 비율: <span className="font-semibold text-gray-900">{data.value.toFixed(1)}%</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  합격자 보유율: <span className="font-semibold text-blue-600">{data.originalPercentage.toFixed(1)}%</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 범례 및 통계 */}
              <div className="space-y-3">
                {stats.topCertificates.slice(0, 10).map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-6 h-6 rounded-md flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={cert.name}>
                          {cert.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
                        {cert.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-blue-700">💡 Tip:</span> 도넛 차트는 상위 10개 자격증의 상대적 비율을 나타내며,
                오른쪽 수치는 실제 합격자 중 해당 자격증 보유 비율입니다.
              </p>
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
              💡 합격자 데이터를 기반으로 한 맞춤형 개선 가이드입니다
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
