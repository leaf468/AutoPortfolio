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
    console.error('Login error:', error);
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
      console.error('Insert user error:', insertError);
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
    console.error('Signup error:', error);
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
    console.error('Logout error:', error);
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
    };

    tokenService.setUser(user);
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
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
    console.error('Get user profile error:', error);
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
    console.error('Update user profile error:', error);
    return false;
  }
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  return tokenService.getToken() !== null;
};
