import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LightBulbIcon,
    ChartBarIcon,
    StarIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    SparklesIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ContentRecommendation, ContentRecommendationService } from '../services/contentRecommendationService';

interface ContentRecommendationPanelProps {
    sectionType: string;
    sectionTitle: string;
    onApplyRecommendation?: (recommendation: ContentRecommendation) => void;
    isVisible: boolean;
}

const CategoryIcons = {
    structure: DocumentTextIcon,
    content: ChartBarIcon,
    keyword: StarIcon,
    storytelling: SparklesIcon
};

const CategoryColors = {
    structure: 'blue',
    content: 'green', 
    keyword: 'yellow',
    storytelling: 'purple'
};

const ContentRecommendationPanel: React.FC<ContentRecommendationPanelProps> = ({
    sectionType,
    sectionTitle,
    onApplyRecommendation,
    isVisible
}) => {
    const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    useEffect(() => {
        const loadRecommendations = () => {
            const allRecommendations = ContentRecommendationService.getRecommendationsForSection(sectionType);
            setRecommendations(allRecommendations);
        };

        loadRecommendations();
    }, [sectionType]);

    const filteredRecommendations = selectedCategory === 'all' 
        ? recommendations 
        : recommendations.filter(rec => rec.category === selectedCategory);

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 90) return 'text-green-600 bg-green-100';
        if (rate >= 80) return 'text-blue-600 bg-blue-100';
        if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
        return 'text-gray-600 bg-gray-100';
    };

    const getCategoryColorClasses = (category: string) => {
        const color = CategoryColors[category as keyof typeof CategoryColors];
        return {
            bg: `bg-${color}-50`,
            border: `border-${color}-200`,
            text: `text-${color}-700`,
            button: `bg-${color}-100 hover:bg-${color}-200 text-${color}-800`
        };
    };

    if (!isVisible || recommendations.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
        >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <LightBulbIcon className="w-6 h-6 text-yellow-500 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {sectionTitle} 작성 팁
                        </h3>
                        <p className="text-sm text-gray-500">
                            합격률을 높이는 효과적인 작성 방법을 확인해보세요
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">총 {recommendations.length}개 팁</div>
                    <div className="text-xs text-green-600 font-medium">
                        평균 성공률 {Math.round(recommendations.reduce((acc, rec) => acc + rec.successRate, 0) / recommendations.length)}%
                    </div>
                </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === 'all'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    전체 ({recommendations.length})
                </button>
                {Object.entries(CategoryColors).map(([category, color]) => {
                    const count = recommendations.filter(rec => rec.category === category).length;
                    if (count === 0) return null;
                    
                    const categoryName = {
                        structure: '구조',
                        content: '내용',
                        keyword: '키워드',
                        storytelling: '스토리텔링'
                    }[category];

                    return (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedCategory === category
                                    ? `bg-${color}-100 text-${color}-700`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {categoryName} ({count})
                        </button>
                    );
                })}
            </div>

            {/* 추천 카드들 */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredRecommendations.map((recommendation) => {
                        const CategoryIcon = CategoryIcons[recommendation.category];
                        const isExpanded = expandedCard === recommendation.id;
                        
                        return (
                            <motion.div
                                key={recommendation.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* 카드 헤더 */}
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setExpandedCard(isExpanded ? null : recommendation.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className={`p-2 rounded-lg ${getCategoryColorClasses(recommendation.category).bg}`}>
                                                <CategoryIcon className={`w-5 h-5 ${getCategoryColorClasses(recommendation.category).text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 mb-1">
                                                    {recommendation.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {recommendation.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs">
                                                    <div className={`px-2 py-1 rounded-full font-medium ${getSuccessRateColor(recommendation.successRate)}`}>
                                                        성공률 {recommendation.successRate}%
                                                    </div>
                                                    <div className="text-gray-500">
                                                        {recommendation.impact}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* 확장된 내용 */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="border-t border-gray-200"
                                        >
                                            <div className="p-4 bg-gray-50">
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                                                        📝 예시 문구
                                                    </h5>
                                                    <div className="bg-white p-3 rounded-lg border-l-4 border-blue-400">
                                                        <p className="text-sm text-gray-700 italic">
                                                            {recommendation.example}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-3">
                                                    {onApplyRecommendation && (
                                                        <button
                                                            onClick={() => onApplyRecommendation(recommendation)}
                                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                            이 팁 적용하기
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(recommendation.example)}
                                                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                                    >
                                                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                                                        예시 복사
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* 푸터 */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        실시간 업데이트되는 채용 트렌드 기반
                    </div>
                    <div className="flex items-center">
                        <StarIcon className="w-4 h-4 mr-1" />
                        AI 추천 시스템
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ContentRecommendationPanel;