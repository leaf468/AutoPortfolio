import React from 'react';
import { CompanyCategory, COMPANY_CATEGORIES } from '../services/companyCategories';

interface CompanyCategoryOnlySelectorProps {
  selectedCategory?: CompanyCategory;
  onSelect: (category: CompanyCategory) => void;
  label?: string;
}

const getCategoryIcon = (category: CompanyCategory): string => {
  const iconMap: Record<CompanyCategory, string> = {
    [CompanyCategory.대기업]: '🏢',
    [CompanyCategory.은행권]: '🏦',
    [CompanyCategory.증권금융]: '💰',
    [CompanyCategory.공기업]: '🏛️',
    [CompanyCategory.스타트업]: '🚀',
    [CompanyCategory.IT대기업]: '💻',
    [CompanyCategory.외국계]: '🌏',
    [CompanyCategory.중견기업]: '🏭',
    [CompanyCategory.기타]: '📦',
  };
  return iconMap[category] || '📦';
};

export const CompanyCategoryOnlySelector: React.FC<CompanyCategoryOnlySelectorProps> = ({
  selectedCategory,
  onSelect,
  label = '회사 카테고리',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      <div className="grid grid-cols-3 gap-3">
        {COMPANY_CATEGORIES.map((categoryInfo) => {
          const isSelected = selectedCategory === categoryInfo.category;
          return (
            <button
              key={categoryInfo.category}
              onClick={() => onSelect(categoryInfo.category)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="text-2xl mb-1">{getCategoryIcon(categoryInfo.category)}</div>
              <div className="text-sm font-medium">{categoryInfo.category}</div>
            </button>
          );
        })}
      </div>
      {selectedCategory && (
        <div className="mt-3 text-sm text-gray-600">
          ✓ <strong>{selectedCategory}</strong> 카테고리의 데이터를 기반으로 추천합니다
        </div>
      )}
    </div>
  );
};
