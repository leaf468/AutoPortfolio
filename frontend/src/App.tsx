import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { AuthProvider } from "./contexts/AuthContext";
import { trackPageView } from "./utils/analytics";
import { CustomAlert } from "./components/CustomAlert";

// Pages
import HomePage from './pages/HomePage';
import TemplateSelectionPage from './pages/TemplateSelectionPage';
import OrganizeContentPage from './pages/OrganizeContentPage';
import AutoFillPage from './pages/AutoFillPage';
import EnhancedEditPage from './pages/EnhancedEditPage';
import TemplateEditPage from './pages/TemplateEditPage';
import CompletePage from './pages/CompletePage';
import CoverLetterPageV2 from './pages/CoverLetterPageV2';
import CoverLetterPageV3 from './pages/CoverLetterPageV3';
import { PositionStatsDetailPage } from './pages/PositionStatsDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SubscribePage from './pages/SubscribePage';

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
    '/': '메인 페이지',
    '/template-selection': '템플릿 선택',
    '/template': '템플릿 선택',
    '/organize': '콘텐츠 정리',
    '/autofill': '자동 채우기',
    '/edit': '포트폴리오 편집',
    '/complete': '완료',
    '/cover-letter': '자소서 작성',
    '/login': '로그인',
    '/signup': '회원가입',
    '/mypage': '마이페이지',
    '/auth/callback': '인증 처리',
    '/subscribe': '프로 플랜 구독',
  };

  // /edit/:template 형태 처리
  if (pathname.startsWith('/edit/')) {
    return '템플릿 편집';
  }

  return titleMap[pathname] || '알 수 없는 페이지';
}

// 전역 다운로드 완료 알림 컴포넌트
function GlobalFeedbackAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    // localStorage에서 feedbackCompleted 확인
    const checkFeedbackCompleted = () => {
      const feedbackData = localStorage.getItem('feedbackCompleted');
      if (feedbackData) {
        try {
          const data = JSON.parse(feedbackData);
          // 5분 이내의 알림만 표시 (5 * 60 * 1000 = 300000ms)
          if (Date.now() - data.timestamp < 300000) {
            setAlertMessage(`✅ 첨삭이 완료되었습니다!\n\nPDF 다운로드가 완료되었습니다.\n평균 점수: ${data.averageScore}점\n\n다운로드 폴더에서 확인하실 수 있습니다.`);
            setShowAlert(true);
            // 알림을 표시한 후 localStorage에서 제거
            localStorage.removeItem('feedbackCompleted');
          } else {
            // 오래된 알림은 제거
            localStorage.removeItem('feedbackCompleted');
          }
        } catch (error) {
          console.error('feedbackCompleted 파싱 오류:', error);
          localStorage.removeItem('feedbackCompleted');
        }
      }
    };

    // 페이지 로드 시 확인
    checkFeedbackCompleted();

    // 다른 탭에서 변경사항 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'feedbackCompleted' && e.newValue) {
        checkFeedbackCompleted();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <CustomAlert
      isOpen={showAlert}
      onClose={() => setShowAlert(false)}
      title="첨삭 완료"
      message={alertMessage}
      type="success"
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <Router>
          <PageViewTracker />
          <GlobalFeedbackAlert />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/template-selection" element={<TemplateSelectionPage />} />
            <Route path="/template" element={<TemplateSelectionPage />} />
            <Route path="/organize" element={<OrganizeContentPage />} />
            <Route path="/autofill" element={<AutoFillPage />} />
            <Route path="/edit" element={<EnhancedEditPage />} />
            <Route path="/edit/:template" element={<TemplateEditPage />} />
            <Route path="/complete" element={<CompletePage />} />
            <Route path="/cover-letter" element={<CoverLetterPageV3 />} />
            <Route path="/cover-letter-v2" element={<CoverLetterPageV2 />} />
            <Route path="/position-stats" element={<PositionStatsDetailPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Routes>
        </Router>
      </PortfolioProvider>
    </AuthProvider>
  );
}

export default App;
