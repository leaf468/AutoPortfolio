import React, { useEffect, useState, useRef } from 'react';
import { AIRecommendation, generateRealtimeRecommendations } from '../services/aiRecommendationService';
import { LightBulbIcon, SparklesIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface AIRecommendationPanelProps {
  currentInput: string;
  position: string;
  questionId: string;
  questionText?: string;
}

// 캐시 타입 정의
interface CachedRecommendation {
  recommendations: AIRecommendation[];
  input: string;
  timestamp: number;
}

// 로컬스토리지 키
const CACHE_KEY = 'ai_recommendations_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24시간

// 초기 캐시 로드 함수 (컴포넌트 외부에서 정의)
const loadInitialCache = (): Record<string, CachedRecommendation> => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 만료된 캐시 제거
      const now = Date.now();
      const filtered: Record<string, CachedRecommendation> = {};
      Object.keys(parsed).forEach(key => {
        if (now - parsed[key].timestamp < CACHE_EXPIRY) {
          filtered[key] = parsed[key];
        }
      });
      return filtered;
    }
  } catch (error) {
    console.error('캐시 로드 실패:', error);
  }
  return {};
};

export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  currentInput,
  position,
  questionId,
  questionText,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // 메모리 캐시 (useRef로 관리하여 무한 루프 방지)
  const recommendationCacheRef = useRef<Record<string, CachedRecommendation>>(loadInitialCache());

  // 캐시 키 생성 (questionId + currentInput의 해시)
  const getCacheKey = (qId: string, input: string): string => {
    return `${qId}_${input.substring(0, 100)}`; // 입력의 첫 100자로 키 생성
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentInput || currentInput.length < 10 || !position.trim()) {
        setRecommendations([]);
        return;
      }

      const cacheKey = getCacheKey(questionId, currentInput);

      // 캐시 확인
      const cached = recommendationCacheRef.current[cacheKey];
      if (cached && cached.input === currentInput) {
        console.log('✅ 캐시된 AI 추천 사용:', questionId);
        setRecommendations(cached.recommendations);
        setLoading(false);
        return;
      }

      // 캐시가 없거나 입력이 변경되었으면 새로 생성
      console.log('🔄 새로운 AI 추천 생성:', questionId);
      setLoading(true);
      try {
        const recs = await generateRealtimeRecommendations(currentInput, position, questionText);
        setRecommendations(recs);

        // 캐시 저장 (메모리)
        recommendationCacheRef.current = {
          ...recommendationCacheRef.current,
          [cacheKey]: {
            recommendations: recs,
            input: currentInput,
            timestamp: Date.now(),
          },
        };

        // 캐시 저장 (localStorage)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(recommendationCacheRef.current));
        } catch (error) {
          console.error('캐시 저장 실패:', error);
        }
      } catch (error) {
        console.error('추천 생성 실패:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce: 사용자가 타이핑을 멈춘 후 500ms 뒤에 실행
    const timeoutId = setTimeout(fetchRecommendations, 500);

    return () => clearTimeout(timeoutId);
  }, [currentInput, position, questionId, questionText]);

  const getIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'pattern':
        return <ChartBarIcon className="w-5 h-5" />;
      case 'example':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'keyword':
        return <SparklesIcon className="w-5 h-5" />;
      case 'insight':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'llm_suggestion':
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'pattern':
        return '데이터 패턴';
      case 'example':
        return '실제 예시';
      case 'keyword':
        return '키워드 제안';
      case 'insight':
        return 'AI 인사이트';
      case 'llm_suggestion':
        return 'AI 추천';
    }
  };

  const getTypeColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'pattern':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'example':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'keyword':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'insight':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'llm_suggestion':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  if (!position.trim()) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 px-6 text-center">
        <div className="py-12">
          <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm leading-relaxed">
            지원 직무를 입력하면<br />
            AI 기반 추천이 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  if (!currentInput || currentInput.length < 10) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 px-6 text-center">
        <div className="py-12">
          <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm leading-relaxed">
            답변을 작성하면<br />
            AI 기반 추천이 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-blue-600" />
          AI 추천
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          데이터 기반 실시간 피드백
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">분석 중...</p>
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          추천 항목이 없습니다.<br />
          더 많은 내용을 작성해보세요.
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start mb-2">
              <div className={`p-2 rounded-lg ${getTypeColor(rec.type)} border mr-3`}>
                {getIcon(rec.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {rec.title}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {rec.relevance.toFixed(0)}%
                  </span>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTypeColor(rec.type)} border-0`}>
                  {getTypeLabel(rec.type)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed ml-14">
              {rec.content}
            </p>
          </div>
        ))}
      </div>

      {!loading && recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800">
            💡 <strong>팁:</strong> AI 추천은 실제 합격자 데이터를 기반으로 생성됩니다.
            모든 추천을 따를 필요는 없으며, 본인의 경험에 맞게 선택적으로 활용하세요.
          </p>
        </div>
      )}
    </div>
  );
};
