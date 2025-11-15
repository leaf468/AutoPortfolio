import React, { useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface CustomTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: TooltipPosition;
  visible?: boolean;
  className?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  content,
  children,
  position = 'top',
  visible = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // visible이 false면 툴팁 표시하지 않음
  const showTooltip = isHovered && visible;

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-indigo-600';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-indigo-600';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-indigo-600';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-indigo-600';
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-indigo-600';
    }
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* 툴팁 */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute ${getPositionClasses()} z-50 pointer-events-none transition-all duration-200 ease-in-out ${
            showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* 툴팁 내용 */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium">
            {content}
          </div>

          {/* 화살표 */}
          <div
            className={`absolute ${getArrowClasses()} w-0 h-0 border-[6px]`}
            style={{ borderStyle: 'solid' }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;
