import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import tokenService from './token.service';
import authService from './auth.service';

// APIパスの設定
// 開発時はプロキシを使用するため /api/v1 で OK (vite.config.ts で設定済み)
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// APIリクエスト用のインスタンスを作成
const apiClient = axios.create({
  baseURL: API_URL
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenService.getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // トークン期限切れエラーの場合でかつ、未処理の場合
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResult = await authService.refreshToken();

        if (refreshResult.success) {
          // リクエストを再試行
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 汎用リクエストメソッド
const request = async <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient(config);
};

// GET メソッド
const get = async <T>(url: string, params?: any): Promise<AxiosResponse<T>> => {
  return request<T>({
    method: 'GET',
    url,
    params
  });
};

// POST メソッド
const post = async <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
  return request<T>({
    method: 'POST',
    url,
    data
  });
};

// PUT メソッド
const put = async <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
  return request<T>({
    method: 'PUT',
    url,
    data
  });
};

// DELETE メソッド
const del = async <T>(url: string): Promise<AxiosResponse<T>> => {
  return request<T>({
    method: 'DELETE',
    url
  });
};

export default {
  get,
  post,
  put,
  delete: del
};