import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CompanyStatistics } from '../services/coverLetterAnalysisService';

interface StatisticsDashboardProps {
  statistics: CompanyStatistics | null;
  isLoading: boolean;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444'];

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  statistics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">AI 기반 통계 분석</h3>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">통계 분석 중...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">AI 기반 통계 분석</h3>
        <div className="text-center py-8 text-gray-500">
          회사와 직무를 선택하고 분석하기를 클릭하세요.
        </div>
      </div>
    );
  }

  // 활동 차트 데이터 준비
  const activityChartData = statistics.topActivities.slice(0, 7).map((act) => ({
    name: act.activityType,
    percentage: parseFloat(act.percentage.toFixed(1)),
    count: act.count,
  }));

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">분석 대상자</div>
          <div className="text-3xl font-bold">{statistics.totalApplicants}명</div>
          <div className="text-xs opacity-75 mt-2">
            {statistics.company} • {statistics.position}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">평균 학점</div>
          <div className="text-3xl font-bold">
            {statistics.avgGpa ? statistics.avgGpa.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs opacity-75 mt-2">4.5 만점 기준</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">평균 토익</div>
          <div className="text-3xl font-bold">
            {statistics.avgToeic ? Math.round(statistics.avgToeic) : 'N/A'}점
          </div>
          <div className="text-xs opacity-75 mt-2">990점 만점</div>
        </div>
      </div>

      {/* 활동 통계 차트 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">주요 활동 분포</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activityChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis label={{ value: '비율 (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
                      <p className="text-blue-600">비율: {payload[0].value}%</p>
                      <p className="text-gray-600 text-sm">({payload[0].payload.count}명)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="percentage" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 활동 상세 리스트 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">활동별 상세 정보</h3>
        <div className="space-y-4">
          {statistics.topActivities.map((activity, index) => (
            <div
              key={index}
              className="border-l-4 pl-4 py-2"
              style={{ borderColor: COLORS[index % COLORS.length] }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{activity.activityType}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{activity.count}명</span>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${COLORS[index % COLORS.length]}20`,
                      color: COLORS[index % COLORS.length],
                    }}
                  >
                    {activity.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              {activity.examples.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                    예시 보기
                  </summary>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 pl-4">
                    {activity.examples.map((example, i) => (
                      <li key={i} className="list-disc">
                        {example.length > 100 ? `${example.substring(0, 100)}...` : example}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 자격증 통계 */}
      {statistics.topCertificates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">주요 자격증</h3>
          <div className="space-y-3">
            {statistics.topCertificates.map((cert, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{cert.name}</span>
                    <span className="text-sm text-gray-600">{cert.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(cert.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsDashboard;
