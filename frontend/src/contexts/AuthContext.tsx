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
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(
    getSubscriptionInfo(null)
  );

  // setUser를 래핑하여 subscriptionInfo도 함께 업데이트
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    setSubscriptionInfo(getSubscriptionInfo(newUser));
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = tokenService.getUser();

      if (storedUser) {
        setUserState(storedUser);
        setSubscriptionInfo(getSubscriptionInfo(storedUser));

        // 서버에서 최신 정보 가져오기
        const currentUser = await getCurrentUser();

        if (currentUser) {
          // 로그인 시 구독 만료 체크 (30일 경과 여부)
          if (currentUser.user_id) {
            await checkSubscriptionExpiry(currentUser.user_id);

            // 만료 체크 후 다시 최신 정보 조회
            const updatedUser = await getCurrentUser();

            if (updatedUser) {
              setUserState(updatedUser);
              const subInfo = getSubscriptionInfo(updatedUser);
              setSubscriptionInfo(subInfo);
            }
          } else {
            setUserState(currentUser);
            const subInfo = getSubscriptionInfo(currentUser);
            setSubscriptionInfo(subInfo);
          }
        } else {
          // 토큰이 만료되었으면 로그아웃
          tokenService.clearTokens();
          setUserState(null);
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
      // setUser가 이미 subscriptionInfo도 업데이트하므로 별도 호출 불필요
      setUser(updatedUser);
    } else {
      setUser(currentUser);
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
