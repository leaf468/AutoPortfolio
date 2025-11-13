import React, { useState, useEffect } from 'react';
import {
  CompanyCategory,
  groupCompaniesByCategory,
  inferCompanyCategory,
} from '../services/companyCategories';

interface CompanyCategorySelectorProps {
  companies: string[];
  selectedCompany: string | undefined;
  onSelect: (company: string) => void;
  label: string;
  placeholder?: string;
}

export const CompanyCategorySelector: React.FC<CompanyCategorySelectorProps> = ({
  companies,
  selectedCompany,
  onSelect,
  label,
  placeholder = '회사 선택',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | ''>('');
  const [groupedCompanies, setGroupedCompanies] = useState<Map<CompanyCategory, string[]>>(
    new Map()
  );
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);

  useEffect(() => {
    const grouped = groupCompaniesByCategory(companies);
    setGroupedCompanies(grouped);
  }, [companies]);

  useEffect(() => {
    if (selectedCategory) {
      const companiesInCategory = groupedCompanies.get(selectedCategory as CompanyCategory) || [];
      setFilteredCompanies(companiesInCategory);
    } else {
      setFilteredCompanies([]);
    }
  }, [selectedCategory, groupedCompanies]);

  // 선택된 회사가 있으면 해당 카테고리 자동 선택
  useEffect(() => {
    if (selectedCompany && !selectedCategory) {
      const category = inferCompanyCategory(selectedCompany);
      setSelectedCategory(category);
    }
  }, [selectedCompany, selectedCategory]);

  const getCategoryIcon = (category: CompanyCategory): string => {
    switch (category) {
      case CompanyCategory.대기업:
        return '🏢';
      case CompanyCategory.은행권:
        return '🏦';
      case CompanyCategory.증권금융:
        return '💰';
      case CompanyCategory.공기업:
        return '🏛️';
      case CompanyCategory.중견기업:
        return '🏭';
      case CompanyCategory.스타트업:
        return '🚀';
      case CompanyCategory.외국계:
        return '🌏';
      case CompanyCategory.IT대기업:
        return '💻';
      default:
        return '📁';
    }
  };

  const getCategoryCount = (category: CompanyCategory): number => {
    return groupedCompanies.get(category)?.length || 0;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* 카테고리 선택 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.values(CompanyCategory).map((category) => {
          const count = getCategoryCount(category);
          if (count === 0) return null;

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all ${
                selectedCategory === category
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{getCategoryIcon(category)}</span>
                <span className="text-sm font-medium">{category}</span>
              </span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 회사 선택 */}
      {selectedCategory && (
        <div className="mt-4">
          <select
            value={selectedCompany || ''}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{placeholder}</option>
            {filteredCompanies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      )}

      {!selectedCategory && (
        <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
          위에서 카테고리를 선택하면 회사 목록이 표시됩니다
        </div>
      )}
    </div>
  );
};

export default CompanyCategorySelector;
