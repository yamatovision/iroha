import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';

// 環境変数の読み込み
dotenv.config();

// 重要な環境変数が設定されていることを確認
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`環境変数が設定されていません: ${missingEnvVars.join(', ')}`);
  console.error('サーバー起動に必要な環境変数を設定してください');
  if (require.main === module) {
    process.exit(1);
  }
}

// JWT関連の環境変数にデフォルト値を設定
if (!process.env.JWT_ACCESS_SECRET) {
  console.warn('JWT_ACCESS_SECRET が設定されていません。JWT_SECRETまたはデフォルト値を使用します。');
  process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'dailyfortune_access_token_secret_dev';
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('JWT_REFRESH_SECRET が設定されていません。JWT_SECRETまたはデフォルト値を使用します。');
  process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET || 'dailyfortune_refresh_token_secret_dev';
}

// デバッグ: 環境変数を確認（本番環境では値は出力しない）
if (process.env.NODE_ENV === 'development') {
  console.log('環境変数確認:');
  console.log('JWT_SECRET設定:', !!process.env.JWT_SECRET);
  console.log('JWT_ACCESS_SECRET設定:', !!process.env.JWT_ACCESS_SECRET);
  console.log('JWT_REFRESH_SECRET設定:', !!process.env.JWT_REFRESH_SECRET);
} else {
  console.log('JWT関連環境変数確認:',
    !!process.env.JWT_SECRET,
    !!process.env.JWT_ACCESS_SECRET,
    !!process.env.JWT_REFRESH_SECRET
  );
}

// ロガーのインポート
import logger from './utils/logger';
import { requestTracer, requestLogger, errorLogger } from './utils/logger/middleware';

// ルーターのインポート
import authRoutes from './routes/auth.routes';
import jwtAuthRoutes from './routes/jwt-auth.routes';
import adminRoutes from './routes/admin.routes';
import dayPillarRoutes from './routes/day-pillar.routes';
import publicEndpointsRoutes from './routes/public-endpoints.routes';
import usersRoutes from './routes/users.routes';
import teamRoutes from './routes/team.routes';
import fortuneRoutes from './routes/fortune.routes';
import chatRoutes from './routes/chat.routes';

// セキュリティミドルウェアのインポート
import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  corsOptions,
  sanitizeMongo,
  jsonErrorHandler
} from './middleware/security.middleware';

// 認証ミドルウェアのインポート
import { hybridAuthenticate, requireAdmin, requireSuperAdmin } from './middleware/hybrid-auth.middleware';
import { jwtEdgeCaseHandler, refreshTokenReuseDetector, networkRecoveryHandler } from './middleware/jwt-edge-case-handler.middleware';

// 型定義のインポート (共有ディレクトリから)
import { API_BASE_PATH } from './types/index';

// Expressアプリケーションの作成
const app = express();

// Cloud Runで実行する場合、リバースプロキシ背後で動作するため信頼設定が必要
app.set('trust proxy', true);

// ロギングミドルウェアを最初に適用
app.use(requestTracer); // トレースIDを各リクエストに追加
app.use(requestLogger); // リクエストのログ記録

// セキュリティミドルウェアの設定
app.use(securityHeaders); // カスタマイズされたHelmet設定
app.use(cors(corsOptions)); // CORS設定
app.use(express.json()); // JSON解析
app.use(jsonErrorHandler); // JSON解析エラーハンドラー
app.use(sanitizeMongo); // NoSQLインジェクション対策

// ネットワーク回復処理
app.use(networkRecoveryHandler);

// 基本的なレート制限を適用
app.use(apiLimiter);

// ルートエンドポイント
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'DailyFortune API Server' });
});

// ステータスエンドポイント
app.get(`${API_BASE_PATH}/status`, (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// JWT認証ルーターを設定（リフレッシュトークン再利用検出付き）
app.use(`${API_BASE_PATH}/auth`, authLimiter, refreshTokenReuseDetector, authRoutes);

// JWT認証専用のルーターを設定
app.use(`${API_BASE_PATH}/jwt-auth`, authLimiter, refreshTokenReuseDetector, jwtAuthRoutes);

// JWT のエッジケースハンドラーを保護されたルートに適用
app.use(`${API_BASE_PATH}`, jwtEdgeCaseHandler);

// 管理者ルーターを設定
app.use(`${API_BASE_PATH}/admin`, adminRoutes);

// 四柱推命プロフィールルーター削除済み - ユーザーモデルに統合

// 日柱情報ルーターを設定
app.use(`${API_BASE_PATH}/day-pillars`, dayPillarRoutes);

// ユーザー情報ルーターを設定
app.use(`${API_BASE_PATH}/users`, usersRoutes);

// チームルーターを設定
app.use(`${API_BASE_PATH}/teams`, teamRoutes);

// 運勢ルーターを設定
app.use(`${API_BASE_PATH}/fortune`, fortuneRoutes);

// チャットルーターを設定
app.use(`${API_BASE_PATH}/chat`, chatRoutes);

// 公開エンドポイントルーターを設定
app.use(`${API_BASE_PATH}/public`, publicEndpointsRoutes);

// エラーロギングミドルウェア
app.use(errorLogger);

// エラーハンドリングミドルウェア
app.use((err: any, req: Request, res: Response, next: any) => {
  // エラーログの強化 - 詳細をログに残す
  logger.error(`エラー処理ミドルウェア: ${err.message}`, { 
    meta: { 
      traceId: req.headers['x-trace-id'],
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      user: (req as any).user?.id,
      stack: err.stack,
      name: err.name
    } 
  });

  // CORSヘッダーの強制追加（クライアント側でのエラー表示のため）
  // クライアントサイドのオリジンを取得
  const clientOrigin = req.headers.origin || process.env.CLIENT_URL || 'https://dailyfortune.web.app';
  
  res.header('Access-Control-Allow-Origin', clientOrigin); // ワイルドカードではなく具体的なオリジンを指定
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Trace-ID, X-Direct-Refresh');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // エラーレスポンスの送信
  res.status(500).json({
    message: '内部サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    traceId: req.headers['x-trace-id'], // トレースIDをレスポンスに含める
    timestamp: new Date().toISOString()
  });
});

// 404ハンドリング
app.use((req: Request, res: Response) => {
  logger.warn(`リソースが見つかりません: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'リクエストされたリソースが見つかりません',
    traceId: req.headers['x-trace-id'] // トレースIDをレスポンスに含める
  });
});

// アプリケーションのエクスポート（テスト用）
export { app };

// サーバーの起動（直接実行時のみ）
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, async () => {
    logger.info(`サーバーが起動しました: ポート ${PORT}`);
    
    // MongoDBへの接続
    try {
      await connectToDatabase();
      logger.info('MongoDBに接続しました');
      
      // バッチ処理スケジューラーの開始（全ての環境で実行）
      try {
        // importではなくrequireを使用することで、startSchedulerがPromiseを返してもawaitできるようにする
        const { startScheduler } = require('./batch/scheduler');
        await startScheduler();
        logger.info('バッチスケジューラーを開始しました');
      } catch (error) {
        logger.error('バッチスケジューラーの開始に失敗しました', { meta: { error } });
      }
    } catch (error) {
      logger.error('MongoDBへの接続に失敗しました', { meta: { error } });
    }
  });
}
