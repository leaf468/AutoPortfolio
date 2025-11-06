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
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ComprehensiveStatsDashboard: React.FC<ComprehensiveStatsDashboardProps> = ({ stats }) => {
  if (stats.totalApplicants === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">해당 직무의 데이터가 충분하지 않습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <AcademicCapIcon className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">학력 통계</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 평균 학점 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">평균 학점</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.avgGpa.toFixed(2)}<span className="text-lg text-gray-500">/4.5</span>
            </p>
          </div>

          {/* 학점 분포 */}
          <div>
            <p className="text-sm text-gray-600 mb-3">학점 분포</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={stats.gpaDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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

        {/* 상위 전공 */}
        {stats.topMajors.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">상위 전공</p>
            <div className="flex flex-wrap gap-2">
              {stats.topMajors.slice(0, 10).map((major, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200"
                >
                  {major.name} ({major.count}명)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 어학 통계 */}
      {stats.avgToeic > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <LanguageIcon className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">어학 통계</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 평균 토익 */}
            <div>
              <p className="text-sm text-gray-600 mb-2">평균 TOEIC 점수</p>
              <p className="text-3xl font-bold text-green-600">
                {Math.round(stats.avgToeic)}<span className="text-lg text-gray-500">점</span>
              </p>
            </div>

            {/* 토익 분포 */}
            <div>
              <p className="text-sm text-gray-600 mb-3">점수 분포</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={stats.toeicDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold">주요 활동 패턴</h3>
          </div>

          <div className="space-y-4">
            {stats.commonActivities.slice(0, 10).map((activity, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{activity.activityType}</h4>
                  <span className="text-sm font-semibold text-purple-600">
                    {activity.percentage.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{activity.insight}</p>
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
        </div>
      )}

      {/* 자격증 통계 */}
      {stats.topCertificates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold">주요 자격증</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.topCertificates.slice(0, 6)}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.name} (${entry.percentage.toFixed(0)}%)`}
                  >
                    {stats.topCertificates.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col justify-center">
              {stats.topCertificates.slice(0, 10).map((cert, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{cert.name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {cert.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
