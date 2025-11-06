import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 로고 및 회사 정보 */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity w-fit">
              <img src="/Careeroad_logo.png" alt="Careeroad" className="h-8" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="text-xl font-bold text-white">Careeroad</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              AI 기반 자소서 작성 및 포트폴리오 생성 플랫폼
            </p>
            <p className="text-sm text-gray-400">
              © 2025 Careeroad. All rights reserved.
            </p>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-white font-semibold mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/cover-letter" className="text-sm hover:text-white transition">
                  자소서 작성
                </Link>
              </li>
              <li>
                <Link to="/landing" className="text-sm hover:text-white transition">
                  포트폴리오 생성
                </Link>
              </li>
              <li>
                <Link to="/mypage" className="text-sm hover:text-white transition">
                  마이페이지
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객 지원 */}
          <div>
            <h3 className="text-white font-semibold mb-4">고객 지원</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:careeroad2025@gmail.com" className="text-sm hover:text-white transition">
                  문의하기
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
