// 버튼 디자인 시스템 통일
export const buttonStyles = {
  // 기본 버튼 스타일
  base: "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",

  // 사이즈
  sizes: {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    xl: "px-6 py-3 text-base"
  },

  // 변형
  variants: {
    // Primary (보라색 그라데이션)
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg",

    // Secondary (보라색 아웃라인)
    secondary: "bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100",

    // Success (녹색)
    success: "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg",

    // Info (파란색)
    info: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",

    // Warning (노란색)
    warning: "bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg",

    // Danger (빨간색)
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",

    // Ghost (투명)
    ghost: "text-gray-600 hover:bg-gray-100",

    // Outline
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  },

  // 비활성화 상태
  disabled: "opacity-50 cursor-not-allowed",

  // 플로팅 버튼 (특수)
  floating: "fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200 flex items-center gap-2.5"
};

// 헬퍼 함수
export const getButtonClass = (
  variant: keyof typeof buttonStyles.variants = 'primary',
  size: keyof typeof buttonStyles.sizes = 'md',
  disabled?: boolean,
  className?: string
): string => {
  const classes = [
    buttonStyles.base,
    buttonStyles.sizes[size],
    buttonStyles.variants[variant],
    disabled && buttonStyles.disabled,
    className
  ].filter(Boolean).join(' ');

  return classes;
};