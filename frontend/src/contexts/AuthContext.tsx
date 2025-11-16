import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SubscriptionInfo } from '../types/auth.types';
import {
  tokenService,
  getCurrentUser,
  checkSubscriptionExpiry,
  getSubscriptionInfo
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  subscriptionInfo: SubscriptionInfo;
  isProUser: () => boolean;
  canUsePdfCorrection: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(
    getSubscriptionInfo(null)
  );

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = tokenService.getUser();
      console.log('🔄 AuthContext 초기화 - localStorage 사용자:', storedUser);
      console.log('🔄 localStorage pay 상태:', storedUser?.pay, 'free_pdf_used:', storedUser?.free_pdf_used);

      if (storedUser) {
        setUser(storedUser);

        // 서버에서 최신 정보 가져오기
        const currentUser = await getCurrentUser();
        console.log('🔄 DB에서 가져온 최신 사용자 정보:', currentUser);
        console.log('🔄 DB pay 상태:', currentUser?.pay, 'free_pdf_used:', currentUser?.free_pdf_used);

        if (currentUser) {
          // 로그인 시 구독 만료 체크 (30일 경과 여부)
          if (currentUser.user_id) {
            await checkSubscriptionExpiry(currentUser.user_id);

            // 만료 체크 후 다시 최신 정보 조회
            const updatedUser = await getCurrentUser();
            console.log('🔄 구독 만료 체크 후 최종 사용자 정보:', updatedUser);
            console.log('🔄 최종 pay 상태:', updatedUser?.pay, 'free_pdf_used:', updatedUser?.free_pdf_used);

            if (updatedUser) {
              setUser(updatedUser);
              const subInfo = getSubscriptionInfo(updatedUser);
              console.log('🔄 구독 정보:', subInfo);
              setSubscriptionInfo(subInfo);
            }
          } else {
            setUser(currentUser);
            const subInfo = getSubscriptionInfo(currentUser);
            console.log('🔄 구독 정보:', subInfo);
            setSubscriptionInfo(subInfo);
          }
        } else {
          // 토큰이 만료되었으면 로그아웃
          console.log('❌ 토큰 만료 - 로그아웃 처리');
          tokenService.clearTokens();
          setUser(null);
          setSubscriptionInfo(getSubscriptionInfo(null));
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();

    // refreshUser 호출 시에도 구독 만료 체크
    if (currentUser?.user_id) {
      await checkSubscriptionExpiry(currentUser.user_id);
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      setSubscriptionInfo(getSubscriptionInfo(updatedUser));
    } else {
      setUser(currentUser);
      setSubscriptionInfo(getSubscriptionInfo(currentUser));
    }
  };

  // 헬퍼 함수들
  const isProUser = () => {
    return subscriptionInfo.isPro;
  };

  const canUsePdfCorrection = () => {
    return subscriptionInfo.canUsePdfCorrection;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        refreshUser,
        subscriptionInfo,
        isProUser,
        canUsePdfCorrection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
