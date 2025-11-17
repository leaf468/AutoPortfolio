import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { tokenService } from '../services/authService';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // URL에서 OAuth 토큰 가져오기
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError('인증 처리 중 오류가 발생했습니다.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!session) {
          setError('세션을 찾을 수 없습니다.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const authUser = session.user;

        // users 테이블에서 사용자 확인
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          setError('사용자 정보 확인 중 오류가 발생했습니다.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        let userData;

        if (!existingUser) {
          // 신규 사용자 - users 테이블에 추가
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '사용자',
                password_hash: '', // OAuth 사용자는 비밀번호 없음
                profile_image_url: authUser.user_metadata?.avatar_url || null,
                email_verified: true, // Google OAuth는 이메일 검증됨
                is_active: true,
              }
            ])
            .select()
            .single();

          if (insertError) {
            setError('사용자 정보 저장에 실패했습니다.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }

          userData = newUser;

          // user_profiles 테이블에 프로필 생성
          await supabase
            .from('user_profiles')
            .insert([{ user_id: userData.user_id }]);
        } else {
          userData = existingUser;

          // 마지막 로그인 시간 업데이트
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('user_id', userData.user_id);
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
        };

        tokenService.setUser(user);
        setUser(user);

        // 마이페이지로 이동
        navigate('/mypage');
      } catch (error) {
        setError('인증 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleOAuthCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-red-500 text-xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">인증 실패</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">인증 처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
