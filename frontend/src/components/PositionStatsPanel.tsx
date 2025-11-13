import React from 'react';
import { PositionStats } from '../services/positionStatsService';
import { ChartBarIcon, AcademicCapIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface PositionStatsPanelProps {
  stats: PositionStats | null;
  isLoading: boolean;
}

export const PositionStatsPanel: React.FC<PositionStatsPanelProps> = ({ stats, isLoading }) => {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-blue-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          직무를 입력하면 통계 데이터가 표시됩니다
        </p>
      </div>
    );
  }

  const handleViewDetails = () => {
    if (stats) {
      // position을 URL 파라미터로 전달하여 새 페이지에서 전체 데이터 로드
      navigate('/position-stats', { state: { position: stats.position } });
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            <h3 className="font-bold text-lg">{stats.position} 통계</h3>
          </div>
          <button
            onClick={handleViewDetails}
            className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
          >
            <span>자세히</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm opacity-90">분석 데이터: {stats.totalApplicants}개</p>
      </div>

      {/* 평균 학점 & TOEIC */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AcademicCapIcon className="w-4 h-4 text-blue-600" />
          평균 스펙
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">평균 학점</span>
            <span className="font-semibold text-blue-600">{stats.avgGpa.toFixed(2)}/4.5</span>
          </div>
          {stats.avgToeic > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">평균 TOEIC</span>
              <span className="font-semibold text-blue-600">{Math.round(stats.avgToeic)}점</span>
            </div>
          )}
        </div>

        {/* 학점 분포 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">학점 분포</p>
          <div className="space-y-1">
            {stats.gpaDistribution
              .filter(item => item.count > 0)
              .map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-16">{item.range}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{item.percentage.toFixed(0)}%</span>
                </div>
              ))}
          </div>
        </div>

        {/* TOEIC 분포 */}
        {stats.avgToeic > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-2">TOEIC 분포</p>
            <div className="space-y-1">
              {stats.toeicDistribution
                .filter(item => item.count > 0)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-16">{item.range}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{item.percentage.toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 주요 활동 */}
      {stats.topActivities.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4 text-green-600" />
            주요 활동 Top 10
          </h4>
          <div className="space-y-2">
            {stats.topActivities.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-400 w-5">{idx + 1}</span>
                  <span className="text-gray-700 truncate">{item.activity}</span>
                </div>
                <span className="text-xs font-semibold text-green-600 ml-2">{item.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
