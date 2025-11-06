import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ComprehensiveStats, getComprehensiveStats } from '../services/comprehensiveAnalysisService';
import { ComprehensiveStatsDashboard } from '../components/ComprehensiveStatsDashboard';

export const PositionStatsDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const position = location.state?.position as string | null;

  const [stats, setStats] = useState<ComprehensiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!position) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getComprehensiveStats(position);
        console.log('📊 Detail Page - Loaded stats:', {
          position,
          totalApplicants: data.totalApplicants,
          commonActivitiesCount: data.commonActivities.length,
          commonActivities: data.commonActivities.slice(0, 3)
        });
        setStats(data);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [position]);

  if (!position) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">직무 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {position} 직무 합격자 상세 통계
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            실제 합격자 데이터를 기반으로 한 종합 분석 결과입니다
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">데이터 분석 중...</p>
          </div>
        ) : stats ? (
          <ComprehensiveStatsDashboard stats={stats} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">해당 직무의 데이터가 충분하지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};
