import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
import CreatePortfolio from './pages/CreatePortfolio';
import PreviewPortfolio from './pages/PreviewPortfolio';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePortfolio />} />
            <Route path="/preview/:id" element={<PreviewPortfolio />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
