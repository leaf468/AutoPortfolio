import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ComprehensiveStats, getComprehensiveStats } from '../services/comprehensiveAnalysisService';
import { ComprehensiveStatsDashboard } from '../components/ComprehensiveStatsDashboard';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

export const PositionStatsDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to={user ? "/mypage" : "/"}>
                <img
                  src="/Careeroad_logo.png"
                  alt="Careeroad"
                  className="h-20 w-auto cursor-pointer"
                />
              </Link>
              <div className="border-l-2 border-gray-300 pl-4 py-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {position} 직무 합격자 상세 통계
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  실제 합격자 데이터를 기반으로 한 종합 분석 결과입니다
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/cover-letter"
                className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
              >
                자기소개서 작성하기
              </Link>
              <Link
                to="/template-selection"
                className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
              >
                포트폴리오 제작하기
              </Link>
              <Link
                to="/mypage"
                className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
              >
                마이페이지
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4 font-semibold">데이터 분석 중...</p>
            <p className="text-gray-500 text-sm mt-2">
              해당 직무의 합격자 데이터를 분석하고 있습니다.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              이 작업은 약 10-20초 정도 소요될 수 있습니다.
            </p>
          </div>
        ) : stats ? (
          <ComprehensiveStatsDashboard stats={stats} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">해당 직무의 데이터가 충분하지 않습니다.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
