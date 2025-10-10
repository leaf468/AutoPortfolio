// Google Analytics 유틸리티 함수

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

// 페이지뷰 추적
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-LB2JSQMFT3', {
      page_path: pagePath,
      page_title: pageTitle,
    });
    console.log('GA Page View:', pagePath, pageTitle);
  }
};

// 이벤트 추적
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
    console.log('GA Event:', eventName, eventParams);
  }
};

// 버튼 클릭 추적
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location || 'unknown',
  });
};

// 별점 추적
export const trackRating = (rating: number, portfolioId?: string) => {
  trackEvent('rating_submitted', {
    rating_value: rating,
    portfolio_id: portfolioId || 'unknown',
  });
};

// PDF 다운로드 추적
export const trackPDFDownload = (portfolioId?: string) => {
  trackEvent('pdf_download', {
    portfolio_id: portfolioId || 'unknown',
  });
};

// 포트폴리오 생성 추적
export const trackPortfolioGeneration = (templateType?: string) => {
  trackEvent('portfolio_generation', {
    template_type: templateType || 'unknown',
  });
};

// 템플릿 선택 추적
export const trackTemplateSelection = (templateName: string) => {
  trackEvent('template_selected', {
    template_name: templateName,
  });
};

// 메인 페이지 방문 추적
export const trackMainPageVisit = () => {
  trackEvent('main_page_visit', {
    timestamp: new Date().toISOString(),
  });
};
