import axios from 'axios';
import tokenService from './token.service';
import { JWT_AUTH } from '../types';

// APIパスと認証プロパティを取得
// 開発時はプロキシを使用するため /api/v1 で OK (vite.config.ts で設定済み)
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * ログイン処理
 * @param email ユーザーメールアドレス
 * @param password パスワード
 * @returns ログイン結果
 */
const login = async (email: string, password: string) => {
  try {
    // URL をそのまま使わず、API_URL と組み合わせる
    const loginUrl = `${API_URL}/jwt-auth/login`;
    console.log('Sending login request to:', loginUrl);
    
    const response = await axios.post(loginUrl, {
      email,
      password
    });

    if (response.data.tokens) {
      const { accessToken, refreshToken } = response.data.tokens;
      await tokenService.setTokens(accessToken, refreshToken);
    }

    return response.data;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'ログインに失敗しました');
  }
};

/**
 * ログアウト処理
 * @returns ログアウト結果
 */
const logout = async () => {
  try {
    const refreshToken = await tokenService.getRefreshToken();
    if (refreshToken) {
      try {
        const logoutUrl = `${API_URL}/jwt-auth/logout`;
        await axios.post(logoutUrl, { refreshToken });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }

    await tokenService.clearTokens();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
};

/**
 * トークンリフレッシュ処理
 * @returns リフレッシュ結果
 */
const refreshToken = async () => {
  try {
    const refreshToken = await tokenService.getRefreshToken();
    if (!refreshToken) {
      return { success: false };
    }

    const refreshUrl = `${API_URL}/jwt-auth/refresh-token`;
    const response = await axios.post(refreshUrl, {
      refreshToken
    });

    if (response.data.tokens) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
      await tokenService.setTokens(accessToken, newRefreshToken);
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false };
  }
};

/**
 * ユーザープロフィール取得
 * @returns ユーザープロフィール
 */
const getProfile = async () => {
  try {
    const token = await tokenService.getAccessToken();
    if (!token) return null;

    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
};

/**
 * SuperAdmin権限チェック
 * @param user ユーザー情報
 * @returns SuperAdmin権限を持っているかどうか
 */
const checkIsSuperAdmin = (user: any): boolean => {
  return user && user.role === 'SuperAdmin';
};

export default { 
  login, 
  logout, 
  refreshToken, 
  getProfile, 
  checkIsSuperAdmin 
};