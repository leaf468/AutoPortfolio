import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { trackPageView } from "./utils/analytics";

// Pages
import HomePage from './pages/HomePage';
import TemplateSelectionPage from './pages/TemplateSelectionPage';
import OrganizeContentPage from './pages/OrganizeContentPage';
import AutoFillPage from './pages/AutoFillPage';
import EnhancedEditPage from './pages/EnhancedEditPage';
import TemplateEditPage from './pages/TemplateEditPage';
import CompletePage from './pages/CompletePage';

// GA 페이지뷰 추적 컴포넌트
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    trackPageView(location.pathname, pageTitle);
  }, [location]);

  return null;
}

// 페이지 경로에 따른 제목 반환
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    '/': '템플릿 선택',
    '/landing': '메인 페이지',
    '/template': '템플릿 선택',
    '/organize': '콘텐츠 정리',
    '/autofill': '자동 채우기',
    '/edit': '포트폴리오 편집',
    '/complete': '완료',
  };

  // /edit/:template 형태 처리
  if (pathname.startsWith('/edit/')) {
    return '템플릿 편집';
  }

  return titleMap[pathname] || '알 수 없는 페이지';
}

function App() {
  return (
    <PortfolioProvider>
      <Router>
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<TemplateSelectionPage />} />
          <Route path="/landing" element={<HomePage />} />
          <Route path="/template" element={<TemplateSelectionPage />} />
          <Route path="/organize" element={<OrganizeContentPage />} />
          <Route path="/autofill" element={<AutoFillPage />} />
          <Route path="/edit" element={<EnhancedEditPage />} />
          <Route path="/edit/:template" element={<TemplateEditPage />} />
          <Route path="/complete" element={<CompletePage />} />
        </Routes>
      </Router>
    </PortfolioProvider>
  );
}

export default App;
