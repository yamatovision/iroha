import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  exp: number;
  role?: string;
  tokenVersion?: number;
}

const ACCESS_TOKEN_KEY = 'superadmin_access_token';
const REFRESH_TOKEN_KEY = 'superadmin_refresh_token';

const getAccessToken = async (): Promise<string | null> => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const getRefreshToken = async (): Promise<string | null> => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = async (): Promise<void> => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const isAccessTokenValid = async (): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const payload = jwtDecode<JwtPayload>(token);
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

const isRefreshTokenValid = async (): Promise<boolean> => {
  const token = await getRefreshToken();
  if (!token) return false;

  try {
    const payload = jwtDecode<JwtPayload>(token);
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

const getTokenPayload = async (): Promise<JwtPayload | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    return null;
  }
};

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAccessTokenValid,
  isRefreshTokenValid,
  getTokenPayload
};