import { supabase } from '../lib/supabaseClient';
import { LoginRequest, SignupRequest, AuthResponse, User, UserProfile } from '../types/auth.types';

// 토큰 저장/조회/삭제
export const tokenService = {
  getToken: (): string | null => localStorage.getItem('auth_token'),
  getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
  setTokens: (token: string, refreshToken: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// 로그인
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    // 기존 세션 정리 (캐시/쿠키 충돌 방지)
    tokenService.clearTokens();
    await supabase.auth.signOut();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        success: false,
        message: error.message || '로그인에 실패했습니다.',
      };
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        message: '로그인에 실패했습니다.',
      };
    }

    // users 테이블에서 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', data.email)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      };
    }

    const user: User = {
      user_id: userData.user_id,
      email: userData.email,
      name: userData.name,
      profile_image_url: userData.profile_image_url,
      created_at: userData.created_at,
      last_login_at: userData.last_login_at,
      is_active: userData.is_active,
      email_verified: userData.email_verified,
      pay: userData.pay,
      last_pay_date: userData.last_pay_date,
      free_pdf_used: userData.free_pdf_used,
      subscription_cancelled: userData.subscription_cancelled,
    };

    tokenService.setTokens(authData.session.access_token, authData.session.refresh_token || '');
    tokenService.setUser(user);

    return {
      success: true,
      message: '로그인 성공',
      user,
      token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    };
  } catch (error) {
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
    };
  }
};

// 회원가입
export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  try {
    // Supabase Auth로 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      // Supabase Auth에서 이미 등록된 이메일 에러
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        return {
          success: false,
          message: 'User already registered',
        };
      }
      return {
        success: false,
        message: authError.message || '회원가입에 실패했습니다.',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: '회원가입에 실패했습니다.',
      };
    }

    // Supabase Auth에서 이미 등록된 이메일은 identities가 빈 배열
    if (authData.user.identities && authData.user.identities.length === 0) {
      return {
        success: false,
        message: 'User already registered',
      };
    }

    // users 테이블에 사용자 정보 추가
    // password_hash는 Supabase Auth에서 관리하므로 빈 문자열로 설정
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email: data.email,
          name: data.name,
          password_hash: '', // Supabase Auth 사용 시 빈 값
          email_verified: false,
          is_active: true,
        }
      ])
      .select()
      .single();

    if (insertError) {
      // 409 에러 또는 중복 키 에러는 이미 가입된 이메일
      if (insertError.code === '23505' || insertError.message?.includes('duplicate') || (insertError as any).status === 409) {
        return {
          success: false,
          message: 'User already registered',
        };
      }
      return {
        success: false,
        message: '사용자 정보 저장에 실패했습니다.',
      };
    }

    // user_profiles 테이블에 프로필 생성
    await supabase
      .from('user_profiles')
      .insert([{ user_id: userData.user_id }]);

    const user: User = {
      user_id: userData.user_id,
      email: userData.email,
      name: userData.name,
      profile_image_url: userData.profile_image_url,
      created_at: userData.created_at,
      last_login_at: userData.last_login_at,
      is_active: userData.is_active,
      email_verified: userData.email_verified,
      pay: userData.pay,
      last_pay_date: userData.last_pay_date,
      free_pdf_used: userData.free_pdf_used,
    };

    if (authData.session) {
      tokenService.setTokens(authData.session.access_token, authData.session.refresh_token || '');
      tokenService.setUser(user);
    }

    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      user,
      token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
    };
  } catch (error) {
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    };
  }
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
  }
  tokenService.clearTokens();
};

// 현재 사용자 정보 조회
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (error || !userData) {
      tokenService.clearTokens();
      return null;
    }

    const user: User = {
      user_id: userData.user_id,
      email: userData.email,
      name: userData.name,
      profile_image_url: userData.profile_image_url,
      created_at: userData.created_at,
      last_login_at: userData.last_login_at,
      is_active: userData.is_active,
      email_verified: userData.email_verified,
      pay: userData.pay,
      last_pay_date: userData.last_pay_date,
      free_pdf_used: userData.free_pdf_used,
      subscription_cancelled: userData.subscription_cancelled,
    };

    tokenService.setUser(user);
    return user;
  } catch (error) {
    return null;
  }
};

// 프로필 조회
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return data as UserProfile;
  } catch (error) {
    return null;
  }
};

// 프로필 업데이트
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    return false;
  }
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  return tokenService.getToken() !== null;
};

// 구글 로그인
export const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      return {
        success: false,
        message: error.message || '구글 로그인에 실패했습니다.',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: '구글 로그인 중 오류가 발생했습니다.',
    };
  }
};

// ==================== 구독 관리 함수 ====================

/**
 * 구독 만료 체크 및 자동 업데이트
 * last_pay_date로부터 30일이 지났는지 확인하고 만료 시 pay를 false로 업데이트
 */
export const checkSubscriptionExpiry = async (userId: string): Promise<boolean> => {
  try {
    // 먼저 subscription_cancelled 컬럼이 있는지 확인
    let userData: any;
    let fetchError: any;

    // subscription_cancelled 컬럼 포함하여 조회 시도
    const result = await supabase
      .from('users')
      .select('pay, last_pay_date, subscription_cancelled')
      .eq('user_id', userId)
      .single();

    if (result.error?.code === '42703') {
      // 컬럼이 없으면 기본 필드만 조회
      const fallbackResult = await supabase
        .from('users')
        .select('pay, last_pay_date')
        .eq('user_id', userId)
        .single();
      userData = fallbackResult.data;
      fetchError = fallbackResult.error;
    } else {
      userData = result.data;
      fetchError = result.error;
    }

    if (fetchError || !userData) {
      return false;
    }

    // last_pay_date가 없으면 구독한 적 없음
    if (!userData.last_pay_date) {
      return false;
    }

    // last_pay_date로부터 30일이 지났는지 체크
    const lastPayDate = new Date(userData.last_pay_date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastPayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 30) {
      // 30일 이상 경과 → pay를 false로 업데이트
      const updateData: any = { pay: false };

      // subscription_cancelled 컬럼이 있으면 초기화
      if ('subscription_cancelled' in userData) {
        updateData.subscription_cancelled = false;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
      }

      return false; // 만료됨
    }

    // 30일 이내 - 취소되었더라도 기한 내에는 활성
    return true; // 구독 활성 (또는 취소되었지만 기한 내)
  } catch (error) {
    return false;
  }
};

/**
 * 구독 상태 업데이트 (수동 처리용)
 * 관리자가 결제 확인 후 DB를 업데이트하거나, 향후 자동 결제 연동 시 사용
 */
export const updateSubscriptionStatus = async (
  userId: string,
  isPro: boolean
): Promise<boolean> => {
  try {
    const updateData: any = { pay: isPro };

    // 프로 플랜 활성화 시 현재 날짜를 last_pay_date로 설정
    if (isPro) {
      updateData.last_pay_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 무료 자소서 첨삭 사용 기록
 * 비프로 사용자가 첨삭 기능을 1회 사용했음을 기록
 */
export const markFreePdfUsed = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ free_pdf_used: true })
      .eq('user_id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 구독 정보 조회 헬퍼
 * User 객체로부터 구독 상태를 계산하여 반환
 */
export const getSubscriptionInfo = (user: User | null): {
  isPro: boolean;
  status: 'active' | 'expired' | 'none' | 'cancelled';
  expiresAt: Date | null;
  daysRemaining: number | null;
  canUsePdfCorrection: boolean;
  isCancelled: boolean;
} => {
  if (!user) {
    return {
      isPro: false,
      status: 'none',
      expiresAt: null,
      daysRemaining: null,
      canUsePdfCorrection: false,
      isCancelled: false,
    };
  }

  // free_pdf_used가 명시적으로 true인 경우에만 사용한 것으로 판단
  // undefined, null, false 모두 사용하지 않은 것으로 처리
  const hasUsedFreePdf = user.free_pdf_used === true;
  const isCancelled = user.subscription_cancelled === true;

  if (!user.last_pay_date) {
    // 구독한 적 없음
    return {
      isPro: false,
      status: 'none',
      expiresAt: null,
      daysRemaining: null,
      canUsePdfCorrection: !hasUsedFreePdf, // 무료 1회 사용 가능
      isCancelled: false,
    };
  }

  // last_pay_date가 있는 경우 만료일 계산
  const lastPayDate = new Date(user.last_pay_date);
  const expiresAt = new Date(lastPayDate);
  expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 만료일이 지났는지 확인 (날짜 기반으로 판단)
  const isExpired = daysRemaining <= 0;

  if (isExpired) {
    // 만료됨
    return {
      isPro: false,
      status: 'expired',
      expiresAt,
      daysRemaining: 0,
      canUsePdfCorrection: !hasUsedFreePdf,
      isCancelled: false,
    };
  }

  // 만료되지 않은 경우
  if (isCancelled) {
    // 취소되었지만 기한이 남아있음 - 계속 프로 기능 사용 가능
    return {
      isPro: true, // 기한 내에는 프로 기능 사용 가능
      status: 'cancelled',
      expiresAt,
      daysRemaining,
      canUsePdfCorrection: true,
      isCancelled: true,
    };
  }

  // 정상 구독 중
  return {
    isPro: true,
    status: 'active',
    expiresAt,
    daysRemaining,
    canUsePdfCorrection: true,
    isCancelled: false,
  };
};
