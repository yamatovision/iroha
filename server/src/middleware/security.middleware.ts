import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * セキュリティヘッダーを設定するミドルウェア
 * Helmetの設定をカスタマイズ
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://storage.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * APIレート制限ミドルウェア
 * 短時間に大量のリクエストを防止しつつ、通常の利用には十分な余裕を持たせる
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 300, // 15分間に最大300リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'リクエスト数が制限を超えました。しばらく待ってから再試行してください。' },
  skip: (req) => process.env.NODE_ENV === 'development' // 開発環境ではスキップ
  // express-rate-limitがtrustProxyプロパティを受け付けない
  // app.set('trust proxy')で代替
});

/**
 * 認証エンドポイント用のレート制限
 * ブルートフォース攻撃を防止しつつ、通常の利用には十分な余裕を持たせる
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 200, // 15分間に最大200リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '認証リクエスト数が制限を超えました。しばらく待ってから再試行してください。' },
  skip: (req) => process.env.NODE_ENV === 'development' // 開発環境ではスキップ
  // express-rate-limitがtrustProxyプロパティを受け付けない
  // app.set('trust proxy')で代替
});

/**
 * CORS設定ミドルウェア
 * 許可されたオリジンからのみアクセスを許可
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 許可するオリジン
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173', // Vite開発サーバーのデフォルトポート
      'http://localhost:8080', // 直接サーバーアクセス
      'capacitor://localhost', // Capacitorアプリ用
      'http://localhost', // ローカルホスト
      'ionic://localhost', // Ionicフレームワーク用
      'https://dailyfortune.web.app', // 本番Webアプリ
      'https://*.dailyfortune.web.app', // サブドメイン対応
      'app://dailyfortune.app', // ネイティブアプリディープリンク
      undefined // undefined は開発環境でのリクエスト用
    ];

    console.log(`CORS検証: ${origin}`);
    
    // 開発環境では全て許可
    if (process.env.NODE_ENV === 'development') {
      console.log('開発環境: すべてのオリジンからのCORSリクエストを許可');
      callback(null, true);
      return;
    }
    
    // 本番環境ではオリジンを確認
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS違反: ${origin} からのリクエストを拒否`);
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-ID', 'X-Direct-Refresh', 'X-Capacitor-Request'],
  exposedHeaders: ['X-Trace-ID'], // クライアントに公開するヘッダー
  credentials: true,
  maxAge: 86400 // 24時間
};

/**
 * NoSQLインジェクション対策ミドルウェア
 * MongoDBクエリインジェクションを防止
 */
export const sanitizeMongo = mongoSanitize();

/**
 * JSON解析エラーハンドラー
 * 不正なJSONリクエストを適切に処理
 */
export const jsonErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: '不正なJSONフォーマットです' });
  }
  next(err);
};