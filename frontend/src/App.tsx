import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PortfolioProvider } from './contexts/PortfolioContext';

// Pages
import HomePage from './pages/HomePage';
import TemplateSelectionPage from './pages/TemplateSelectionPage';
import OrganizeContentPage from './pages/OrganizeContentPage';
import AutoFillPage from './pages/AutoFillPage';
import EnhancedEditPage from './pages/EnhancedEditPage';
import TemplateEditPage from './pages/TemplateEditPage';
import FeedbackEditPage from './pages/FeedbackEditPage';
import CompletePage from './pages/CompletePage';

function App() {
  return (
    <PortfolioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TemplateSelectionPage />} />
          <Route path="/landing" element={<HomePage />} />
          <Route path="/template" element={<TemplateSelectionPage />} />
          <Route path="/organize" element={<OrganizeContentPage />} />
          <Route path="/autofill" element={<AutoFillPage />} />
          <Route path="/edit" element={<EnhancedEditPage />} />
          <Route path="/edit/:template" element={<TemplateEditPage />} />
          <Route path="/feedback" element={<FeedbackEditPage />} />
          <Route path="/complete" element={<CompletePage />} />
        </Routes>
      </Router>
    </PortfolioProvider>
  );
}

export default App;
