import { Portfolio } from '../types/auth.types';
import { tokenService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 포트폴리오 목록 조회
export const getUserPortfolios = async (userId: string): Promise<Portfolio[]> => {
  const token = tokenService.getToken();

  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/portfolios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const result = await response.json();
    return result.portfolios || [];
  } catch (error) {
    return [];
  }
};

// 포트폴리오 조회
export const getPortfolio = async (portfolioId: string): Promise<Portfolio | null> => {
  const token = tokenService.getToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.portfolio || null;
  } catch (error) {
    return null;
  }
};

// 포트폴리오 생성
export const createPortfolio = async (
  userId: string,
  data: Partial<Portfolio>
): Promise<Portfolio | null> => {
  const token = tokenService.getToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/portfolios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.portfolio || null;
  } catch (error) {
    return null;
  }
};

// 포트폴리오 수정
export const updatePortfolio = async (
  portfolioId: string,
  data: Partial<Portfolio>
): Promise<boolean> => {
  const token = tokenService.getToken();

  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    return false;
  }
};

// 포트폴리오 삭제
export const deletePortfolio = async (portfolioId: string): Promise<boolean> => {
  const token = tokenService.getToken();

  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    return false;
  }
};

// 포트폴리오 발행
export const publishPortfolio = async (portfolioId: string): Promise<string | null> => {
  const token = tokenService.getToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result.published_url || null;
  } catch (error) {
    return null;
  }
};
