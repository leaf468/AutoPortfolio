import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 회원가입
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    // 이메일 중복 확인
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해시
    const password_hash = await bcrypt.hash(password, 10);

    // 사용자 생성
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, email_verified, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, name, created_at, is_active, email_verified',
      [email, password_hash, name, false, true]
    );

    const user = result.rows[0];

    // 프로필 생성
    await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [user.user_id]);

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const refresh_token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    });

    res.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user,
      token,
      refresh_token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 사용자 조회
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = result.rows[0];

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 활성화 여부 확인
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: '비활성화된 계정입니다.' });
    }

    // 마지막 로그인 시간 업데이트
    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const refresh_token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    });

    // 비밀번호 해시 제거
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '로그인 성공',
      user: userWithoutPassword,
      token,
      refresh_token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '로그인 중 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  // 토큰 무효화는 클라이언트에서 처리 (localStorage 삭제)
  // 필요시 세션 테이블에서 삭제 가능
  res.json({ success: true, message: '로그아웃 되었습니다.' });
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT user_id, email, name, profile_image_url, created_at, last_login_at, is_active, email_verified FROM users WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
