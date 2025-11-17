import { supabase } from '../lib/supabaseClient';

/**
 * 구독/결제 상태 관리 서비스
 *
 * DB 스키마:
 * - pay: boolean (Pro 플랜 결제 여부)
 * - last_pay_date: timestamp (마지막 결제일)
 * - free_pdf_used: boolean (무료 첨삭 1회 사용 여부)
 */

export interface SubscriptionStatus {
  isPro: boolean;           // Pro 플랜 여부
  lastPayDate: Date | null; // 마지막 결제일
  freePdfUsed: boolean;     // 무료 첨삭 사용 여부
  canUseFeedback: boolean;  // 첨삭 사용 가능 여부
  canDownloadPPT: boolean;  // PPT 다운로드 가능 여부
}

/**
 * 사용자의 구독 상태를 조회합니다.
 */
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('pay, last_pay_date, free_pdf_used')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {
        isPro: false,
        lastPayDate: null,
        freePdfUsed: false,
        canUseFeedback: true, // 기본적으로 1회 무료 허용
        canDownloadPPT: false,
      };
    }

    const isPro = data.pay === true;
    const freePdfUsed = data.free_pdf_used === true;

    return {
      isPro,
      lastPayDate: data.last_pay_date ? new Date(data.last_pay_date) : null,
      freePdfUsed,
      canUseFeedback: isPro || !freePdfUsed, // Pro이거나 무료 1회 미사용
      canDownloadPPT: isPro, // Pro 플랜만 가능
    };
  } catch (error) {
    return {
      isPro: false,
      lastPayDate: null,
      freePdfUsed: false,
      canUseFeedback: true,
      canDownloadPPT: false,
    };
  }
};

/**
 * 무료 첨삭 사용을 기록합니다.
 * 첨삭 완료 후 호출하여 free_pdf_used를 true로 설정합니다.
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
 * Pro 플랜 활성화 (관리자용)
 * 사용자가 계좌이체 후 관리자가 수동으로 호출
 */
export const activateProPlan = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        pay: true,
        last_pay_date: new Date().toISOString(),
      })
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
 * Pro 플랜 비활성화 (관리자용)
 */
export const deactivateProPlan = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ pay: false })
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
 * 첨삭 사용 가능 여부를 확인합니다.
 */
export const canUseFeedback = async (userId: string): Promise<{ allowed: boolean; reason: string }> => {
  const status = await getSubscriptionStatus(userId);

  if (status.isPro) {
    return { allowed: true, reason: 'Pro 플랜 사용자입니다.' };
  }

  if (!status.freePdfUsed) {
    return { allowed: true, reason: '무료 첨삭 1회 사용 가능합니다.' };
  }

  return {
    allowed: false,
    reason: '무료 첨삭을 이미 사용하셨습니다. Pro 플랜을 구독하시면 무제한으로 사용할 수 있습니다.',
  };
};

/**
 * PPT 다운로드 가능 여부를 확인합니다.
 */
export const canDownloadPPT = async (userId: string): Promise<{ allowed: boolean; reason: string }> => {
  const status = await getSubscriptionStatus(userId);

  if (status.isPro) {
    return { allowed: true, reason: 'Pro 플랜 사용자입니다.' };
  }

  return {
    allowed: false,
    reason: 'PPT 다운로드는 Pro 플랜 전용 기능입니다. 구독하시면 사용할 수 있습니다.',
  };
};

export default {
  getSubscriptionStatus,
  markFreePdfUsed,
  activateProPlan,
  deactivateProPlan,
  canUseFeedback,
  canDownloadPPT,
};
