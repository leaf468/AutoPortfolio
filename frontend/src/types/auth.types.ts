// 인증 관련 타입 정의

export interface User {
  user_id: string;
  email: string;
  name: string;
  profile_image_url?: string;
  created_at: string;
  last_login_at?: string;
  is_active: boolean;
  email_verified: boolean;
  // 구독 관련 필드
  pay?: boolean; // 프로 플랜 구독 여부
  last_pay_date?: string; // 최근 결제일
  free_pdf_used?: boolean; // 무료 자소서 첨삭 사용 여부
  subscription_cancelled?: boolean; // 구독 취소 여부 (기한은 남아있음)
}

export interface UserProfile {
  profile_id: string;
  user_id: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  github_url?: string;
  blog_url?: string;
  linkedin_url?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  refresh_token?: string;
}

export interface UserDocument {
  document_id: string;
  user_id: string;
  title: string;
  company_name?: string;
  position?: string;
  content: string;
  status: 'draft' | 'completed' | 'submitted' | 'archived';
  deadline_at?: string;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
  version: number;
}

export interface Portfolio {
  portfolio_id: string;
  user_id: string;
  title: string;
  template_type?: string;
  theme_color?: string;
  layout_config?: any;
  sections?: any;
  published: boolean;
  published_url?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
}

// 구독 관련 타입
export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'cancelled';

export interface SubscriptionInfo {
  isPro: boolean;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  daysRemaining: number | null;
  canUsePdfCorrection: boolean;
  isCancelled: boolean;
}
