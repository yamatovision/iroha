import request from 'supertest';
import express from 'express';
import { auth } from '../../config/firebase';
import { API_BASE_PATH } from '../../types/index';

// テスト用のモックアプリ
const app = express();

// Firebase Admin SDK のモック
jest.mock('../../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
    generatePasswordResetLink: jest.fn()
  }
}));

describe('認証APIテスト', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /auth/profile', () => {
    it('有効なトークンでプロフィールを取得できること', async () => {
      // Firebaseトークン検証のモック
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      });

      const response = await request(app)
        .get(`${API_BASE_PATH}/auth/profile`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'test-user-id');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(auth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('無効なトークンでは401エラーを返すこと', async () => {
      // トークン検証エラーをシミュレート
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get(`${API_BASE_PATH}/auth/profile`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('トークンなしでは401エラーを返すこと', async () => {
      const response = await request(app)
        .get(`${API_BASE_PATH}/auth/profile`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', '認証トークンがありません');
    });
  });

  describe('POST /auth/register', () => {
    it('有効なトークンで登録できること', async () => {
      // Firebaseトークン検証のモック
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'new-user-id',
        email: 'newuser@example.com'
      });

      const response = await request(app)
        .post(`${API_BASE_PATH}/auth/register`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          displayName: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'new-user-id');
      expect(response.body).toHaveProperty('displayName', 'New User');
    });
  });

  describe('POST /auth/password-reset', () => {
    it('有効なメールアドレスでパスワードリセットリンクを送信できること', async () => {
      // パスワードリセットリンク生成のモック
      (auth.generatePasswordResetLink as jest.Mock).mockResolvedValue('reset-link');

      const response = await request(app)
        .post(`${API_BASE_PATH}/auth/password-reset`)
        .send({
          email: 'reset@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(auth.generatePasswordResetLink).toHaveBeenCalledWith('reset@example.com');
    });

    it('メールアドレスなしでは400エラーを返すこと', async () => {
      const response = await request(app)
        .post(`${API_BASE_PATH}/auth/password-reset`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('Firebase APIエラーでは500エラーを返すこと', async () => {
      // パスワードリセットエラーをシミュレート
      (auth.generatePasswordResetLink as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const response = await request(app)
        .post(`${API_BASE_PATH}/auth/password-reset`)
        .send({
          email: 'error@example.com'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});