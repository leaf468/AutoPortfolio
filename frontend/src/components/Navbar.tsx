import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Careeroad Portfolio
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              홈
            </Link>
            <Link
              to="/create"
              className={`flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/create'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              <SparklesIcon className="h-4 w-4" />
              <span>포트폴리오 만들기</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;