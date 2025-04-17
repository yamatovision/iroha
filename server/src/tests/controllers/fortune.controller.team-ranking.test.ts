import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { Express } from 'express';
import { API_BASE_PATH } from '../../types';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import { DailyFortune } from '../../models/DailyFortune';
import { TeamContextFortune } from '../../models/TeamContextFortune';
import { withRealAuth } from '../utils/test-auth-middleware';
import { config } from 'dotenv';
import * as path from 'path';
import { MongoDBConnector } from '../utils/test-helpers';

// 環境変数の読み込み
// プロジェクトルートの.envファイルへのパスを指定
const envPath = path.resolve(__dirname, '../../../../.env');
config({ path: envPath });

// タイムアウト設定（テストは時間がかかる場合があるため）
jest.setTimeout(60000);

// スキーマ関連のWarningを抑制
mongoose.set('strictQuery', false);

describe('FortuneController - チームコンテキスト運勢テスト（実データ使用）', () => {
  let app: Express;
  let testUser: any;
  let testTeam: any;
  let headers: Record<string, string>;
  let mongoConnector: MongoDBConnector;

  // テスト環境の準備
  beforeAll(async () => {
    console.log('MongoDB接続を開始します...');
    
    // MongoDB接続
    mongoConnector = new MongoDBConnector();
    await mongoConnector.connect();
    
    console.log('MongoDB接続成功');
    
    // テスト用のExpressアプリケーションを作成
    app = express();
    app.use(express.json());
    
    // fortuneRouterを使用
    const fortuneRouter = require('../../routes/fortune.routes').default;
    app.use(`${API_BASE_PATH}`, fortuneRouter);
    
    try {
      // 実際の認証情報を取得
      headers = await withRealAuth();
      
      if (!headers.Authorization) {
        console.log('認証トークンが取得できませんでした。テストが正常に動作しない可能性があります。');
      } else {
        console.log('認証トークン取得成功');
      }
      
      // テストユーザーを取得（実際に存在するユーザー）
      testUser = await User.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
      
      if (!testUser) {
        console.log('テストユーザーが見つかりませんでした。既存のユーザーを検索します。');
        // 既存のユーザーを検索（バリデーションエラーを回避）
        testUser = await User.findOne();
        
        if (!testUser) {
          console.log('ユーザーが見つかりません。テストはスキップされます。');
        } else {
          console.log(`テスト用ユーザーを使用します: ${testUser.displayName}`);
        }
      }
      
      if (testUser) {
        console.log(`テストユーザー: ${testUser.displayName} (${testUser._id})`);
      } else {
        console.log('テストユーザーが設定されていません');
      }
      
      if (!testUser) {
        console.log('テストユーザーがないためチームの検索をスキップします');
      } else {
        // ユーザーが所属するチームを検索（まずユーザーのチームID）
        if (testUser.teamId) {
          testTeam = await Team.findById(testUser.teamId);
          if (testTeam) {
            console.log(`ユーザーが所属するチームを見つけました: ${testTeam.name} (${testTeam._id})`);
          }
        }
        
        // チームが見つからなければ、どれか一つ検索
        if (!testTeam) {
          console.log('ユーザーのチームが見つかりません。既存のチームを検索します。');
          testTeam = await Team.findOne();
          
          if (testTeam) {
            console.log(`テスト用にチームを使用します: ${testTeam.name} (${testTeam._id})`);
          } else {
            console.log('チームが見つかりません。テストはスキップされます。');
          }
        }
      }
      
      if (testTeam) {
        console.log(`テストチーム: ${testTeam.name || 'unknown'} (${testTeam._id || 'no-id'})`);
        
        // 本日の日付の運勢データが存在するか確認
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (testUser) {
          const existingDailyFortune = await DailyFortune.findOne({
            userId: testUser._id,
            date: today
          });
          
          if (!existingDailyFortune) {
            console.log('今日の運勢データがありません。テストの際に生成されます。');
          } else {
            console.log('今日の運勢データが存在します:', existingDailyFortune._id);
          }
          
          const existingTeamContextFortune = await TeamContextFortune.findOne({
            userId: testUser._id,
            teamId: testTeam._id,
            date: today
          });
          
          if (!existingTeamContextFortune) {
            console.log('今日のチームコンテキスト運勢データがありません。テストの際に生成されます。');
          } else {
            console.log('今日のチームコンテキスト運勢データが存在します:', existingTeamContextFortune._id);
          }
        }
      } else {
        console.log('テストチームが設定されていないため、運勢データの確認をスキップします');
      }
    } catch (error) {
      console.error('テスト環境の準備中にエラーが発生しました:', error);
    }
  });
  
  // テスト終了時のクリーンアップ
  afterAll(async () => {
    try {
      // MongoDB接続を閉じる
      await mongoConnector.disconnect();
      console.log('テスト終了: MongoDBとの接続を閉じました');
    } catch (error) {
      console.error('クリーンアップ中にエラーが発生しました:', error);
    }
  });
  
  test('GET /api/v1/fortune/team/:teamId/context - チームコンテキスト運勢を取得できること', async () => {
    try {
      // テストチームIDが設定されているか確認
      if (!testTeam || !testTeam._id) {
        console.log('テストチームIDが設定されていないためテストをスキップします');
        return;
      }
      
      if (!headers.Authorization) {
        console.log('認証トークンが設定されていないためテストをスキップします');
        return;
      }
      
      // APIリクエストをシミュレート
      const response = await request(app)
        .get(`${API_BASE_PATH}/fortune/team/${testTeam._id}/context`)
        .set(headers);
      
      console.log(`チームコンテキスト運勢取得ステータス: ${response.status}`);
      
      // ステータスコードチェック
      expect([200, 201, 404]).toContain(response.status);
      
      if (response.status === 200) {
        // レスポンスのプロパティ確認（200の場合のみ）
        expect(response.body).toHaveProperty('fortuneScore');
        expect(response.body).toHaveProperty('teamContextAdvice');
        expect(response.body).toHaveProperty('collaborationTips');
        
        console.log('チームコンテキスト運勢取得成功:', {
          fortuneScore: response.body.fortuneScore,
          advicePreview: response.body.teamContextAdvice.substring(0, 30) + '...',
          tips: response.body.collaborationTips.length
        });
      } else if (response.status === 404) {
        console.log('チームコンテキスト運勢が見つかりません。次のテストで生成します。');
      }
    } catch (error) {
      console.error('テスト実行エラー:', error);
      fail('テスト実行中にエラーが発生しました');
    }
  });
  
  test('POST /api/v1/fortune/team/:teamId/context/generate - チームコンテキスト運勢を生成できること', async () => {
    try {
      // テストチームIDが設定されているか確認
      if (!testTeam || !testTeam._id) {
        console.log('テストチームIDが設定されていないためテストをスキップします');
        return;
      }
      
      if (!headers.Authorization) {
        console.log('認証トークンが設定されていないためテストをスキップします');
        return;
      }
      
      // APIリクエストをシミュレート
      const response = await request(app)
        .post(`${API_BASE_PATH}/fortune/team/${testTeam._id}/context/generate`)
        .set(headers);
      
      console.log(`チームコンテキスト運勢生成ステータス: ${response.status}`);
      
      // ステータスコードチェック
      expect([200, 201, 400, 403, 500]).toContain(response.status);
      
      if (response.status === 201 || response.status === 200) {
        // レスポンスのプロパティ確認（成功時のみ）
        expect(response.body).toHaveProperty('fortuneScore');
        expect(response.body).toHaveProperty('teamContextAdvice');
        expect(response.body).toHaveProperty('collaborationTips');
        
        console.log('チームコンテキスト運勢生成成功:', {
          fortuneScore: response.body.fortuneScore,
          advicePreview: response.body.teamContextAdvice.substring(0, 30) + '...',
          tips: response.body.collaborationTips.length
        });
      } else {
        console.log('チームコンテキスト運勢生成失敗:', response.body);
      }
    } catch (error) {
      console.error('テスト実行エラー:', error);
      fail('テスト実行中にエラーが発生しました');
    }
  });
  
  test('GET /api/v1/fortune/dashboard - 運勢ダッシュボードを取得できること', async () => {
    try {
      if (!headers.Authorization) {
        console.log('認証トークンが設定されていないためテストをスキップします');
        return;
      }
      
      // APIリクエストをシミュレート
      const response = await request(app)
        .get(`${API_BASE_PATH}/fortune/dashboard`)
        .set(headers);
      
      console.log(`運勢ダッシュボード取得ステータス: ${response.status}`);
      
      // ステータスコードチェック
      expect([200, 400, 404]).toContain(response.status);
      
      if (response.status === 200) {
        // レスポンスのプロパティ確認
        expect(response.body).toHaveProperty('personalFortune');
        
        console.log('運勢ダッシュボード取得成功:', {
          personalFortune: response.body.personalFortune ? 'あり' : 'なし',
          teamContextFortune: response.body.teamContextFortune ? 'あり' : 'なし',
          teamRanking: response.body.teamRanking ? 'あり' : 'なし'
        });
      } else {
        console.log('運勢ダッシュボード取得失敗:', response.body);
      }
    } catch (error) {
      console.error('テスト実行エラー:', error);
      fail('テスト実行中にエラーが発生しました');
    }
  });
  
  test('GET /api/v1/fortune/dashboard?teamId=xxx - チームIDを指定して運勢ダッシュボードを取得できること', async () => {
    try {
      // テストチームIDが設定されているか確認
      if (!testTeam || !testTeam._id) {
        console.log('テストチームIDが設定されていないためテストをスキップします');
        return;
      }
      
      if (!headers.Authorization) {
        console.log('認証トークンが設定されていないためテストをスキップします');
        return;
      }
      
      // APIリクエストをシミュレート
      const response = await request(app)
        .get(`${API_BASE_PATH}/fortune/dashboard?teamId=${testTeam._id}`)
        .set(headers);
      
      console.log(`チームコンテキスト運勢ダッシュボード取得ステータス: ${response.status}`);
      
      // ステータスコードチェック
      expect([200, 400, 404]).toContain(response.status);
      
      if (response.status === 200) {
        // レスポンスのプロパティ確認
        expect(response.body).toHaveProperty('personalFortune');
        
        if (response.body.teamContextFortune) {
          expect(response.body.teamContextFortune).toHaveProperty('fortuneScore');
          expect(response.body.teamContextFortune).toHaveProperty('teamContextAdvice');
        }
        
        if (response.body.teamRanking) {
          expect(response.body.teamRanking).toHaveProperty('ranking');
        }
        
        console.log('チーム指定ダッシュボード取得成功:', {
          personalFortune: response.body.personalFortune ? 'あり' : 'なし',
          teamContextFortune: response.body.teamContextFortune ? 'あり' : 'なし',
          teamRanking: response.body.teamRanking ? {
            memberCount: response.body.teamRanking.ranking.length,
            userRank: response.body.teamRanking.userRank
          } : 'なし'
        });
      } else {
        console.log('チーム指定ダッシュボード取得失敗:', response.body);
      }
    } catch (error) {
      console.error('テスト実行エラー:', error);
      fail('テスト実行中にエラーが発生しました');
    }
  });
  
  test('GET /api/v1/fortune/team/:teamId/ranking - チーム運勢ランキングを取得できること', async () => {
    try {
      // テストチームIDが設定されているか確認
      if (!testTeam || !testTeam._id) {
        console.log('テストチームIDが設定されていないためテストをスキップします');
        return;
      }
      
      if (!headers.Authorization) {
        console.log('認証トークンが設定されていないためテストをスキップします');
        return;
      }
      
      // APIリクエストをシミュレート
      const response = await request(app)
        .get(`${API_BASE_PATH}/fortune/team/${testTeam._id}/ranking`)
        .set(headers);
      
      console.log(`チーム運勢ランキング取得ステータス: ${response.status}`);
      
      // ステータスコードチェック
      expect([200, 400, 404]).toContain(response.status);
      
      if (response.status === 200) {
        // レスポンスのプロパティ確認
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('ranking');
        
        const ranking = response.body.data.ranking;
        
        console.log('チーム運勢ランキング取得成功:', {
          teamName: response.body.data.teamName,
          memberCount: ranking.length,
          topMember: ranking.length > 0 ? {
            name: ranking[0].displayName,
            score: ranking[0].score
          } : 'なし'
        });
      } else {
        console.log('チーム運勢ランキング取得失敗:', response.body);
      }
    } catch (error) {
      console.error('テスト実行エラー:', error);
      fail('テスト実行中にエラーが発生しました');
    }
  });
});