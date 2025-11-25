import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { tokenService } from '../services/authService';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('로그인 처리 중...');
  const processedRef = useRef(false);

  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (processedRef.current) return;

    const processOAuthUser = async (session: any) => {
      try {
        const authUser = session.user;

        // users 테이블에서 사용자 확인
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('User check error:', checkError);
          // 에러가 있어도 계속 진행 시도
        }

        let userData;

        if (!existingUser) {
          // 신규 사용자 - users 테이블에 추가
          setStatus('계정을 생성하는 중...');

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '사용자',
                password_hash: '',
                profile_image_url: authUser.user_metadata?.avatar_url || null,
                email_verified: true,
                is_active: true,
                pay: true,
                last_pay_date: new Date().toISOString(),
              }
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Insert error:', insertError);
            // 이미 존재하는 경우 다시 조회
            const { data: retryUser } = await supabase
              .from('users')
              .select('*')
              .eq('email', authUser.email)
              .maybeSingle();

            if (retryUser) {
              userData = retryUser;
            } else {
              // 최후의 수단: 기본 데이터로 진행
              userData = {
                user_id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.full_name || '사용자',
                profile_image_url: authUser.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString(),
                is_active: true,
                email_verified: true,
                pay: true,
                last_pay_date: new Date().toISOString(),
              };
            }
          } else {
            userData = newUser;

            // user_profiles 테이블에 프로필 생성
            try {
              await supabase
                .from('user_profiles')
                .insert([{ user_id: userData.user_id }]);
            } catch {
              // 실패해도 무시
            }
          }
        } else {
          userData = existingUser;

          // 마지막 로그인 시간 업데이트
          try {
            await supabase
              .from('users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('user_id', userData.user_id);
          } catch {
            // 실패해도 무시
          }
        }

        // 토큰 저장
        tokenService.setTokens(session.access_token, session.refresh_token || '');

        // 사용자 정보 저장
        const user = {
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
        setUser(user);

        setStatus('로그인 완료! 이동 중...');

        // 마이페이지로 이동
        setTimeout(() => {
          navigate('/mypage', { replace: true });
        }, 500);
      } catch (error) {
        console.error('OAuth processing error:', error);
        // 에러가 발생해도 마이페이지로 이동 시도
        setTimeout(() => {
          navigate('/mypage', { replace: true });
        }, 1000);
      }
    };

    // onAuthStateChange 리스너 등록
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (processedRef.current) return;

        if (event === 'SIGNED_IN' && session) {
          processedRef.current = true;
          await processOAuthUser(session);
        }
      }
    );

    // 이미 세션이 있는 경우 처리 (페이지 새로고침 등)
    const checkExistingSession = async () => {
      // 짧은 딜레이 후 세션 확인
      await new Promise(resolve => setTimeout(resolve, 500));

      if (processedRef.current) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session && !processedRef.current) {
        processedRef.current = true;
        await processOAuthUser(session);
      }
    };

    checkExistingSession();

    // 10초 타임아웃 (무한 대기 방지)
    const timeout = setTimeout(() => {
      if (!processedRef.current) {
        navigate('/login', { replace: true });
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{status}</h2>
        <p className="text-gray-600">잠시만 기다려주세요</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
