# DailyFortune プロジェクト - デバッグ戦略ガイド

## 目次
1. [はじめに](#はじめに)
2. [問題の切り分け戦略](#問題の切り分け戦略)
3. [フロントエンドデバッグ強化](#フロントエンドデバッグ強化)
4. [バックエンドデバッグ強化](#バックエンドデバッグ強化)
5. [API通信デバッグ強化](#api通信デバッグ強化)
6. [ログ管理と共有戦略](#ログ管理と共有戦略)
7. [環境差異の検出](#環境差異の検出)
8. [チームコミュニケーション](#チームコミュニケーション)
9. [デバッグツールと環境の統一](#デバッグツールと環境の統一)

## はじめに

DailyFortuneプロジェクトでは、フロントエンドとバックエンドの連携における問題を早期に発見・解決するために、構造化されたデバッグアプローチが必要です。このドキュメントでは、主要な問題特定アプローチと解決戦略を提供します。

---

## 問題の切り分け戦略

### 三層アプローチによる問題特定

問題の根本原因を特定するための効率的なアプローチとして、三層に分けて考えます：

1. **フロントエンド層**
   - リクエストの生成
   - トークン管理
   - データの整形

2. **通信層**
   - ネットワークリクエストの送信
   - レスポンスの受信
   - CORS、認証ヘッダー

3. **バックエンド層**
   - リクエストの受信と解析
   - ビジネスロジックの実行
   - レスポンスの生成

### 問題切り分けのディシジョンツリー

問題が発生した場合、以下のフローで切り分けを行います：

```
1. リクエストはフロントエンドで正しく構築されているか？
   ├── Yes → リクエストはネットワーク層に届いているか？
   │         ├── Yes → バックエンドに届いているか？
   │         │         ├── Yes → バックエンドの処理は成功しているか？
   │         │         └── No  → バックエンドの受信ログを確認
   │         └── No  → ブラウザのネットワークタブでブロックされていないか確認
   └── No  → フロントエンドのコードを確認
```

---

## フロントエンドデバッグ強化

### APIサービスへのデバッグモード追加

`api.service.ts`に詳細なデバッグオプションを追加します：

```typescript
// api.service.ts に追加
private isDebugMode = true; // 環境変数で制御可能

private logRequest(config: AxiosRequestConfig) {
  if (!this.isDebugMode) return;
  
  console.group(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('Headers:', config.headers);
  console.log('Params:', config.params);
  console.log('Data:', config.data);
  console.groupEnd();
}

private logResponse(response: AxiosResponse) {
  if (!this.isDebugMode) return;
  
  console.group(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
  console.log('Data:', response.data);
  console.log('Headers:', response.headers);
  console.groupEnd();
}

private logError(error: any) {
  console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', error.response.data);
    console.log('Headers:', error.response.headers);
  } else if (error.request) {
    console.log('Request made but no response received');
    console.log(error.request);
  } else {
    console.log('Error:', error.message);
  }
  console.log('Config:', error.config);
  console.groupEnd();
}
```

インターセプターに組み込み：

```typescript
// リクエストインターセプター
this.api.interceptors.request.use(
  async (config) => {
    // 既存のコード...
    this.logRequest(config);
    return config;
  },
  (error) => {
    this.logError(error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
this.api.interceptors.response.use(
  (response) => {
    this.logResponse(response);
    return response;
  },
  (error) => {
    this.logError(error);
    return Promise.reject(error);
  }
);
```

### ネットワークモニタリングの強化

ブラウザの開発者ツールで特定のAPIリクエストを確実に監視するための明示的なデバッグコードを追加：

```typescript
// 重要なAPIコールの前に追加
console.log('%c🔍 NETWORK DEBUG: 以下のリクエストをネットワークタブで追跡してください', 'color: blue; font-weight: bold');
console.log(`${method.toUpperCase()} ${url}`);
console.table({
  'Header Authorization': 'Bearer ...[token]',
  'Content-Type': 'application/json',
  'Request Body': JSON.stringify(data)
});
```

### Firebaseトークン検証

APIリクエスト前のトークン状態のログ記録：

```typescript
// api.service.tsのリクエストインターセプターに追加
const auth = getAuth();
const user = auth.currentUser;

if (user) {
  try {
    // 現在のトークン情報をログ
    const currentToken = await user.getIdTokenResult();
    console.group('🔐 Firebase Token Info');
    console.log('Token exists:', !!currentToken.token);
    console.log('Token length:', currentToken.token.length);
    console.log('Token expiration:', currentToken.expirationTime);
    console.log('Claims:', currentToken.claims);
    console.groupEnd();
    
    // トークン有効性確認
    const tokenAge = new Date(currentToken.expirationTime).getTime() - Date.now();
    if (tokenAge < 0) {
      console.warn('⚠️ Token is expired! Forcing refresh...');
      // 強制更新
      const freshToken = await user.getIdToken(true);
      config.headers['Authorization'] = `Bearer ${freshToken}`;
    } else {
      console.log(`🔐 Token valid for ${Math.floor(tokenAge / 1000 / 60)} minutes`);
      config.headers['Authorization'] = `Bearer ${currentToken.token}`;
    }
  } catch (error) {
    console.error('🚫 Token retrieval error:', error);
  }
} else {
  console.warn('⚠️ No user logged in, request will be unauthorized');
}
```

---

## バックエンドデバッグ強化

### リクエスト受信ログの強化

`server/src/index.ts` または Express設定ファイルに詳細なリクエストロギングを追加：

```typescript
// リクエストロギングミドルウェア
app.use((req, res, next) => {
  // 重要なリクエスト情報をログ
  console.group(`📥 Request: ${req.method} ${req.originalUrl}`);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? 'Bearer [exists]' : 'None',
    'user-agent': req.headers['user-agent']
  });
  
  // POST/PUT/PATCHメソッドのボディをログ
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    console.log('Body:', req.body);
  }
  
  // GETメソッドのクエリパラメータをログ
  if (req.method === 'GET' && Object.keys(req.query).length > 0) {
    console.log('Query:', req.query);
  }
  
  console.log('Params:', req.params);
  console.groupEnd();
  
  // レスポンスをログ
  const originalSend = res.send;
  res.send = function(body) {
    console.group(`📤 Response: ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    
    try {
      // JSONレスポンスのみログ
      if (res.getHeader('content-type')?.includes('application/json')) {
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        console.log('Data:', data);
      } else {
        console.log('Response type:', res.getHeader('content-type'));
      }
    } catch (e) {
      console.log('Raw response (not JSON):', body);
    }
    
    console.groupEnd();
    return originalSend.call(this, body);
  };
  
  next();
});
```

### 認証ミドルウェアのデバッグ強化

`auth.middleware.ts`にデバッグログを強化し、認証の流れを詳細に追跡できるようにします：

```typescript
// server/src/middleware/auth.middleware.ts
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.group('🔑 Auth Middleware');
    
    const authHeader = req.headers.authorization;
    console.log('Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      console.groupEnd();
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token extracted, length:', token.length);
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✅ Token verified successfully');
      console.log('User ID:', decodedToken.uid);
      console.log('Email:', decodedToken.email);
      console.log('Role claims:', decodedToken.role || 'No role claim');
      
      req.user = decodedToken;
      console.groupEnd();
      next();
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.message);
      console.groupEnd();
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.log('❌ Unexpected error in auth middleware:', error);
    console.groupEnd();
    return res.status(500).json({ message: 'Internal server error' });
  }
};
```

### ルーティングログの強化

ルートが正しく登録されているか確認するためのログを追加：

```typescript
// server/src/index.ts の起動時に追加
console.log('📚 Registered Routes:');
// Express Routerの全ルートをログ出力する関数
function printRoutes(app) {
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))));
    } else if (layer.method) {
      console.log('%s %s', layer.method.toUpperCase(), path.concat(split(layer.regexp)).filter(Boolean).join('/'));
    }
  }

  function split(thing) {
    if (typeof thing === 'string') {
      return thing.split('/');
    } else if (thing.fast_slash) {
      return [''];
    } else {
      const match = thing.toString()
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '$')
        .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
      return match ?
        match[1].replace(/\\(.)/g, '$1').split('/') :
        ['<complex>'];
    }
  }

  app._router.stack.forEach(print.bind(null, []));
}

printRoutes(app);
```

---

## API通信デバッグ強化

### APIモニタリングツールの導入

APIリクエストのキャプチャと分析のためのツールを導入します：

1. **内部モニタリングミドルウェア**

```typescript
// server/src/middleware/api-monitor.middleware.ts
export const apiMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = uuidv4().substr(0, 8);
  
  // リクエスト情報を一時保存
  const requestInfo = {
    id: requestId,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    startTime,
    clientIP: req.ip,
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
  
  // リクエストの開始をログ
  console.log(`[REQ:${requestId}] ${req.method} ${req.originalUrl} started`);
  
  // メモリに保存（実際の実装ではRedisなどを使用）
  apiRequests.set(requestId, requestInfo);
  
  // レスポンスフック
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // レスポンス情報を追加
    const fullRequestInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration,
      responseHeaders: res.getHeaders(),
      responseBody: res.locals.responseBody, // レスポンスボディをキャプチャするには追加の処理が必要
      endTime
    };
    
    // ログに記録
    console.log(`[RES:${requestId}] ${req.method} ${req.originalUrl} completed in ${duration}ms with status ${res.statusCode}`);
    
    // 遅いレスポンスを警告
    if (duration > 1000) {
      console.warn(`⚠️ Slow API: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    // エラーレスポンスを警告
    if (res.statusCode >= 400) {
      console.error(`❌ API Error: ${req.method} ${req.originalUrl} returned ${res.statusCode}`);
      // エラー詳細をログに記録
    }
    
    // 結果を保存（実装によってはファイルやデータベースに保存）
    apiRequests.set(requestId, fullRequestInfo);
    
    // 一定時間経過後にメモリからクリア
    setTimeout(() => {
      apiRequests.delete(requestId);
    }, 3600000); // 1時間後
    
    return originalEnd.apply(res, arguments);
  };
  
  // リクエストIDをレスポンスヘッダーに追加
  res.setHeader('X-Request-ID', requestId);
  next();
};

// システム起動時に初期化
const apiRequests = new Map();
```

2. **APIリクエスト可視化エンドポイント** (開発環境のみ)

```typescript
// 開発環境のみで有効なデバッグUIエンドポイント
if (process.env.NODE_ENV === 'development') {
  app.get('/_debug/api-monitor', (req, res) => {
    const requestsArray = Array.from(apiRequests.values()).sort((a, b) => b.startTime - a.startTime);
    res.render('api-monitor', { requests: requestsArray });
  });
  
  app.get('/_debug/api-monitor/:id', (req, res) => {
    const requestInfo = apiRequests.get(req.params.id);
    if (!requestInfo) {
      return res.status(404).send('Request not found');
    }
    res.render('api-monitor-detail', { request: requestInfo });
  });
}
```

### APIフローの視覚化

開発環境でフロントエンドからバックエンドまでのリクエストフローを視覚化するコンソールツールを実装：

```typescript
// フロントエンドのapi.service.tsに追加
private visualizeRequestFlow(config: AxiosRequestConfig, requestId: string) {
  if (!this.isDebugMode) return;
  
  console.log(
    `%c${requestId} → [FE] → [NET] → [BE] → [DB] → [BE] → [NET] → [FE]`,
    'font-family: monospace; font-size: 14px; color: gray'
  );
  
  // リクエスト送信時
  console.log(
    `%c${requestId} → %c[FE] %c→ [NET] → [BE] → [DB] → [BE] → [NET] → [FE]`,
    'font-family: monospace; font-size: 14px; color: gray',
    'font-family: monospace; font-size: 14px; color: blue; font-weight: bold',
    'font-family: monospace; font-size: 14px; color: gray'
  );
  
  // レスポンスでの完了時の表示は、インターセプターで対応
}

// レスポンスインターセプターでのフロー完了表示
private visualizeResponseFlow(response: AxiosResponse, requestId: string) {
  if (!this.isDebugMode) return;
  
  console.log(
    `%c${requestId} → %c[FE] → [NET] → [BE] → [DB] → [BE] → [NET] %c→ [FE]`,
    'font-family: monospace; font-size: 14px; color: gray',
    'font-family: monospace; font-size: 14px; color: gray',
    'font-family: monospace; font-size: 14px; color: green; font-weight: bold'
  );
}
```

### クロスオリジンリクエスト問題の検出

CORS問題を検出するための特殊なロギング機能をバックエンドに追加：

```typescript
// server/src/middleware/cors-debug.middleware.ts
export const corsDebugMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  console.log('🌐 CORS Check: Request origin =', origin || 'None (Same origin or no origin header)');
  console.log('🌐 CORS Check: Current allowed origins =', process.env.CORS_ALLOWED_ORIGINS?.split(',') || 'All allowed');
  
  // プリフライトリクエストの詳細ログ
  if (req.method === 'OPTIONS') {
    console.group('🌐 CORS Preflight Request');
    console.log('Request headers:', {
      'origin': req.headers.origin,
      'access-control-request-method': req.headers['access-control-request-method'],
      'access-control-request-headers': req.headers['access-control-request-headers']
    });
    console.groupEnd();
  }
  
  next();
  
  // レスポンスのCORSヘッダーをログ
  res.on('finish', () => {
    const corsHeaders = {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-methods': res.getHeader('access-control-allow-methods'),
      'access-control-allow-headers': res.getHeader('access-control-allow-headers'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials')
    };
    
    console.log('🌐 CORS Response Headers:', corsHeaders);
    
    // CORSエラーの可能性を検出
    if (origin && !corsHeaders['access-control-allow-origin']) {
      console.warn('⚠️ Potential CORS issue: Origin not allowed in response headers');
    }
  });
};
```

---

## ログ管理と共有戦略

### 構造化ログフォーマット

JSONベースの構造化ログフォーマットを導入してログの検索性と分析を向上させます：

```typescript
// server/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'daily-fortune' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => {
          const { timestamp, level, message, ...rest } = info;
          return `${timestamp} [${level}]: ${message} ${Object.keys(rest).length ? JSON.stringify(rest) : ''}`;
        })
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// リクエストID付きのロガー取得関数
export function getRequestLogger(requestId: string) {
  return {
    info: (message: string, meta = {}) => {
      logger.info(message, { requestId, ...meta });
    },
    warn: (message: string, meta = {}) => {
      logger.warn(message, { requestId, ...meta });
    },
    error: (message: string, meta = {}) => {
      logger.error(message, { requestId, ...meta });
    },
    debug: (message: string, meta = {}) => {
      logger.debug(message, { requestId, ...meta });
    }
  };
}

export default logger;
```

### ログエクスポート機能

デバッグセッション中のログをファイルとしてエクスポートできる機能を追加：

```typescript
// クライアント側のデバッグユーティリティ
export const exportLogs = (identifier = 'debug-logs') => {
  // コンソールログを上書き
  if (!window._logHistory) {
    window._logHistory = [];
    
    // コンソールメソッドの元の実装を保存
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    // コンソールメソッドをログ記録と元の動作を両方行うバージョンで上書き
    Object.keys(originalConsole).forEach(method => {
      console[method] = function(...args) {
        // 元のコンソール出力を実行
        originalConsole[method].apply(console, args);
        
        // ログを記録
        window._logHistory.push({
          type: method,
          args: args.map(arg => {
            try {
              // オブジェクトを文字列化
              return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch (e) {
              return '[Unstringifiable Object]';
            }
          }),
          timestamp: new Date().toISOString()
        });
      };
    });
  }
  
  // ログをエクスポート
  const logBlob = new Blob(
    [JSON.stringify(window._logHistory, null, 2)], 
    { type: 'application/json' }
  );
  
  const url = URL.createObjectURL(logBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${identifier}-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return `Exported ${window._logHistory.length} log entries`;
};

// 開発者ツールコンソールでの使用例:
// > exportLogs('api-debug-session')
```

バックエンドでも同様のエクスポート機能を実装：

```typescript
// server/src/utils/log-exporter.ts
import fs from 'fs';
import path from 'path';

// 最近のログエントリを保持するメモリバッファ
const logBuffer = [];
const MAX_BUFFER_SIZE = 1000;

// ログバッファに追加
export function addToLogBuffer(entry) {
  logBuffer.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  
  // バッファサイズを制限
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

// ログをエクスポート
export function exportLogs(identifier = 'server-logs') {
  const filename = `${identifier}-${new Date().toISOString()}.json`;
  const logDir = path.join(process.cwd(), 'logs', 'exports');
  
  // ディレクトリ作成（存在しない場合）
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // ファイルに書き込み
  fs.writeFileSync(
    path.join(logDir, filename),
    JSON.stringify(logBuffer, null, 2)
  );
  
  return {
    filename,
    entryCount: logBuffer.length,
    path: path.join(logDir, filename)
  };
}

// APIエンドポイント用の関数
export function exportLogsHandler(req, res) {
  try {
    const result = exportLogs(req.query.identifier || 'api-logs');
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### エラーログの自動分析

エラーログを自動的に分析してパターンを検出するユーティリティ：

```typescript
// server/src/utils/error-analyzer.ts
import fs from 'fs';
import path from 'path';

// エラーのパターンを分析
export function analyzeErrorPatterns() {
  const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');
  
  if (!fs.existsSync(errorLogPath)) {
    return {
      count: 0,
      patterns: [],
      message: 'No error logs found'
    };
  }
  
  // エラーログを読み込み
  const content = fs.readFileSync(errorLogPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // エラーを解析
  const errors = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return { raw: line };
    }
  });
  
  // エラーカウント
  const errorTypes = {};
  const endpoints = {};
  const statusCodes = {};
  
  errors.forEach(error => {
    // エラータイプをカウント
    const type = error.error || error.message || 'unknown';
    errorTypes[type] = (errorTypes[type] || 0) + 1;
    
    // エンドポイントをカウント
    if (error.url || error.path) {
      const endpoint = error.url || error.path;
      endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
    }
    
    // ステータスコードをカウント
    if (error.statusCode || error.status) {
      const status = error.statusCode || error.status;
      statusCodes[status] = (statusCodes[status] || 0) + 1;
    }
  });
  
  // 結果を生成
  return {
    count: errors.length,
    topErrorTypes: Object.entries(errorTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    topEndpoints: Object.entries(endpoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    topStatusCodes: Object.entries(statusCodes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    recentErrors: errors.slice(-10)
  };
}
```

---

## 環境差異の検出

### 環境検証ツール

環境間の差異を検出するためのスクリプトを作成：

```typescript
// scripts/verify-environment.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

// 必須環境変数リスト
const REQUIRED_ENV_VARS = [
  'FIREBASE_SERVICE_ACCOUNT_PATH',
  'FIREBASE_PROJECT_ID',
  'MONGODB_URI',
  'API_PORT',
  'CORS_ALLOWED_ORIGINS',
  'JWT_SECRET'
];

// 環境別の想定値（オプション）
const EXPECTED_VALUES = {
  development: {
    'API_PORT': '8080',
    'LOG_LEVEL': 'debug'
  },
  production: {
    'API_PORT': '8080',
    'LOG_LEVEL': 'info'
  }
};

async function verifyEnvironment() {
  console.log('🔍 Verifying environment...');
  const issues = [];
  
  // .envファイル存在確認
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    issues.push({
      level: 'critical',
      message: '.env file not found',
      fix: 'Create .env file with required variables'
    });
    // 致命的な問題があれば早期リターン
    return { valid: false, issues };
  }
  
  // 環境変数ロード
  const envVars = dotenv.parse(fs.readFileSync(envPath));
  
  // 必須環境変数チェック
  for (const variable of REQUIRED_ENV_VARS) {
    if (!envVars[variable]) {
      issues.push({
        level: 'critical',
        message: `Missing required env var: ${variable}`,
        fix: `Add ${variable} to .env file`
      });
    }
  }
  
  // Firebaseキーファイル存在確認
  if (envVars.FIREBASE_SERVICE_ACCOUNT_PATH) {
    if (!fs.existsSync(envVars.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      issues.push({
        level: 'critical',
        message: `Firebase service account file not found at ${envVars.FIREBASE_SERVICE_ACCOUNT_PATH}`,
        fix: 'Check the path or download the service account file'
      });
    }
  }
  
  // MongoDB接続確認
  if (envVars.MONGODB_URI) {
    try {
      // MongoDBに実際に接続するコードをここに追加
      console.log('Checking MongoDB connection...');
      // ...
    } catch (error) {
      issues.push({
        level: 'critical',
        message: `Failed to connect to MongoDB: ${error.message}`,
        fix: 'Check MongoDB URI and credentials'
      });
    }
  }
  
  // 想定値との比較
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (EXPECTED_VALUES[nodeEnv]) {
    for (const [key, value] of Object.entries(EXPECTED_VALUES[nodeEnv])) {
      if (envVars[key] !== value) {
        issues.push({
          level: 'warning',
          message: `Env var ${key} has unexpected value. Got: ${envVars[key]}, Expected: ${value}`,
          fix: `Set ${key}=${value} in .env for ${nodeEnv} environment`
        });
      }
    }
  }
  
  // バックエンドのヘルスチェック
  try {
    const port = envVars.API_PORT || '8080';
    const response = await axios.get(`http://localhost:${port}/health`);
    if (response.status !== 200) {
      issues.push({
        level: 'warning',
        message: `Health check failed: ${response.status} ${response.statusText}`,
        fix: 'Check if backend is running correctly'
      });
    }
  } catch (error) {
    issues.push({
      level: 'warning',
      message: `Health check failed: ${error.message}`,
      fix: 'Make sure backend is running'
    });
  }
  
  // 結果
  return {
    valid: issues.filter(i => i.level === 'critical').length === 0,
    issues
  };
}

// 実行
verifyEnvironment().then(result => {
  console.log('Environment verification complete:');
  console.log(`Valid: ${result.valid}`);
  
  if (result.issues.length > 0) {
    console.log('Issues found:');
    result.issues.forEach(issue => {
      console.log(`[${issue.level.toUpperCase()}] ${issue.message}`);
      console.log(`    Fix: ${issue.fix}`);
    });
  }
});
```

### ヘルスチェックエンドポイント

バックエンドに詳細なヘルスチェックエンドポイントを追加：

```typescript
// server/src/routes/health.routes.ts
import { Router } from 'express';
import mongoose from 'mongoose';
import admin from 'firebase-admin';
import os from 'os';

const router = Router();

// 基本ヘルスチェック
router.get('/', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 詳細ヘルスチェック（開発環境専用）
router.get('/detailed', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Detailed health check only available in development environment' });
  }
  
  try {
    // DB接続状態
    const dbState = {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models)
    };
    
    // Firebase接続状態
    let firebaseState = { initialized: false };
    try {
      const app = admin.app();
      firebaseState = {
        initialized: true,
        name: app.name,
        projectId: process.env.FIREBASE_PROJECT_ID
      };
    } catch (e) {
      firebaseState.error = e.message;
    }
    
    // システムリソース
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        processUsage: process.memoryUsage()
      },
      cpus: os.cpus().length,
      loadAvg: os.loadavg()
    };
    
    // アプリの状態
    const appState = {
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.API_PORT || 8080,
      corsOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || []
    };
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbState,
      firebase: firebaseState,
      system: systemInfo,
      application: appState
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

---

## チームコミュニケーション

### エラーレポート生成

開発チームでエラーを共有しやすくするためのレポート生成機能：

```typescript
// フロントエンドのデバッグユーティリティに追加
export function generateErrorReport() {
  const reportData = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    // 最近のコンソールログ
    recentLogs: window._logHistory?.slice(-20) || [],
    // ローカルストレージの一部のデータ（機密情報は除外）
    storage: {
      hasToken: !!localStorage.getItem('token'),
      loggedIn: !!localStorage.getItem('loggedIn'),
      // 機密情報は含めない
    },
    // その他の環境情報
    environment: {
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform
    }
  };
  
  // レポートの文字列化
  const reportString = 
`## エラーレポート
**日時**: ${reportData.timestamp}
**URL**: ${reportData.url}
**ブラウザ**: ${reportData.userAgent}

### 環境情報
- **画面サイズ**: ${reportData.environment.screenSize}
- **言語**: ${reportData.environment.language}
- **プラットフォーム**: ${reportData.environment.platform}

### 認証状態
- **トークン存在**: ${reportData.storage.hasToken}
- **ログイン状態**: ${reportData.storage.loggedIn}

### 最近のログ
\`\`\`
${reportData.recentLogs.map(log => 
  `[${log.timestamp}] [${log.type}] ${log.args.join(' ')}`
).join('\n')}
\`\`\`
`;

  console.info('エラーレポートが生成されました:');
  console.info(reportString);
  
  // クリップボードにコピー
  navigator.clipboard.writeText(reportString)
    .then(() => console.info('レポートをクリップボードにコピーしました'))
    .catch(e => console.error('クリップボードへのコピーに失敗しました:', e));
  
  return reportString;
}
```

### 即時共有システム

トラブルシューティングセッションで問題を即座に共有できるシステム：

```typescript
// GIST APIを使用した共有機能
export async function shareDebugSession(title = 'デバッグセッション') {
  // APIアクセストークンが必要な場合は、安全な方法で取得するか、
  // 開発環境用の限定的なトークンを使用
  const API_TOKEN = process.env.GIST_API_TOKEN;
  if (!API_TOKEN) {
    console.error('GIST API TOKENが設定されていません');
    return null;
  }
  
  // ログデータを取得
  const logs = window._logHistory || [];
  const lastLogs = logs.slice(-100); // 最新の100件のみ
  
  // 環境情報を取得
  const envInfo = {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    screenSize: `${window.innerWidth}x${window.innerHeight}`
  };
  
  // GISTに投稿する内容を作成
  const content = {
    description: `${title} - ${envInfo.timestamp}`,
    public: false,
    files: {
      'debug-info.md': {
        content: `# ${title}\n\n## 環境情報\n\`\`\`json\n${JSON.stringify(envInfo, null, 2)}\n\`\`\`\n\n## 認証状態\n- トークン存在: ${!!localStorage.getItem('token')}\n`
      },
      'console-logs.json': {
        content: JSON.stringify(lastLogs, null, 2)
      }
    }
  };
  
  try {
    // GitHub GIST APIを使用して共有
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    });
    
    const data = await response.json();
    
    if (data.html_url) {
      console.info(`デバッグセッションを共有しました: ${data.html_url}`);
      return data.html_url;
    } else {
      console.error('GISTの作成に失敗しました:', data);
      return null;
    }
  } catch (error) {
    console.error('デバッグセッションの共有に失敗しました:', error);
    return null;
  }
}
```

---

## デバッグツールと環境の統一

### デバッグコマンドセット

開発環境で使用するデバッグコマンドセットを定義し、チーム間で共有します：

```typescript
// デバッグユーティリティを公開
window.DF = {
  // APIデバッグ
  api: {
    // APIリクエストを追跡
    traceRequest: (method, url, data = null) => {
      const requestId = Math.random().toString(36).substring(2, 8);
      console.group(`🔍 API Request Trace [${requestId}]`);
      console.log(`${method.toUpperCase()} ${url}`);
      if (data) console.log('Request data:', data);
      console.groupEnd();
      
      return requestId; // トレース用ID
    },
    
    // トレースIDでレスポンスを記録
    traceResponse: (requestId, status, data) => {
      console.group(`✅ API Response [${requestId}]`);
      console.log(`Status: ${status}`);
      console.log('Response data:', data);
      console.groupEnd();
    },
    
    // トレースIDでエラーを記録
    traceError: (requestId, error) => {
      console.group(`❌ API Error [${requestId}]`);
      console.error(error);
      console.groupEnd();
    },
    
    // 認証トークンを検証
    checkAuth: async () => {
      const auth = window.firebase.auth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('❌ No user logged in');
        return false;
      }
      
      try {
        const token = await user.getIdToken();
        console.log(`✅ Valid token: ${token.substring(0, 10)}...`);
        
        // トークン詳細
        const tokenResult = await user.getIdTokenResult();
        console.log('Token claims:', tokenResult.claims);
        console.log('Token expiration:', new Date(tokenResult.expirationTime));
        
        return true;
      } catch (error) {
        console.error('❌ Token error:', error);
        return false;
      }
    },
    
    // フォースリフレッシュトークン
    forceRefreshToken: async () => {
      const auth = window.firebase.auth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('❌ No user logged in');
        return null;
      }
      
      try {
        const token = await user.getIdToken(true);
        console.log(`✅ Token refreshed: ${token.substring(0, 10)}...`);
        return token;
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        return null;
      }
    }
  },
  
  // ログ管理
  logs: {
    exportLogs,
    generateErrorReport,
    shareDebugSession,
    
    // ログをクリア
    clear: () => {
      if (window._logHistory) {
        window._logHistory = [];
      }
      console.clear();
      console.log('✨ Logs cleared');
    }
  },
  
  // 環境情報
  env: {
    // 環境情報を表示
    info: () => {
      console.group('🔧 Environment Info');
      console.log('App version:', process.env.REACT_APP_VERSION || 'Unknown');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Firebase config:', {
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN
      });
      console.groupEnd();
    },
    
    // ブラウザ情報を表示
    browser: () => {
      console.group('🌐 Browser Info');
      console.log('User agent:', navigator.userAgent);
      console.log('Language:', navigator.language);
      console.log('Platform:', navigator.platform);
      console.log('Screen size:', `${window.innerWidth}x${window.innerHeight}`);
      console.groupEnd();
    }
  }
};

// デバッグユーティリティを使用するコンソールヘルプ
console.info(`
🛠️ Debug utilities available:
- DF.api.checkAuth() - Check authentication status
- DF.api.forceRefreshToken() - Force refresh the auth token
- DF.logs.exportLogs() - Export console logs
- DF.logs.generateErrorReport() - Generate a report for sharing
- DF.env.info() - Show environment info
- DF.env.browser() - Show browser info
`);
```

### 標準ヘルスチェック統合

APIサービスに定期的なヘルスチェックを統合：

```typescript
// ヘルスチェック機能
class HealthMonitor {
  private isRunning = false;
  private checkInterval = 30000; // 30秒ごと
  private intervalId: NodeJS.Timeout | null = null;
  private lastStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
  private consecutiveFailures = 0;
  private apiService: any;
  
  constructor(apiService: any) {
    this.apiService = apiService;
  }
  
  // ヘルスチェック開始
  start() {
    if (this.isRunning) return;
    
    console.log('🏥 Health monitoring started');
    this.isRunning = true;
    this.check(); // 即座に1回チェック
    
    this.intervalId = setInterval(() => {
      this.check();
    }, this.checkInterval);
  }
  
  // ヘルスチェック停止
  stop() {
    if (!this.isRunning) return;
    
    console.log('🏥 Health monitoring stopped');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // ヘルスチェック実行
  async check() {
    try {
      const response = await this.apiService.get('/health');
      
      if (response.data.status === 'ok') {
        if (this.lastStatus !== 'healthy') {
          console.log('✅ Backend is healthy');
        }
        this.lastStatus = 'healthy';
        this.consecutiveFailures = 0;
      } else {
        this.handleUnhealthy('Unexpected health status');
      }
    } catch (error) {
      this.handleUnhealthy(error.message);
    }
  }
  
  // 異常状態の処理
  private handleUnhealthy(reason: string) {
    this.consecutiveFailures++;
    
    if (this.lastStatus !== 'unhealthy' || this.consecutiveFailures % 5 === 0) {
      console.warn(`❌ Backend is unhealthy: ${reason} (Failure #${this.consecutiveFailures})`);
    }
    
    this.lastStatus = 'unhealthy';
    
    // 5回連続で失敗したらアラート
    if (this.consecutiveFailures === 5) {
      console.error('⚠️ Backend health check failed 5 times in a row');
      // 必要に応じてユーザーに通知
    }
  }
  
  // 現在の状態を取得
  getStatus() {
    return {
      status: this.lastStatus,
      failures: this.consecutiveFailures,
      isMonitoring: this.isRunning
    };
  }
}

// APIサービスに統合
const healthMonitor = new HealthMonitor(apiService);

// 開発環境で自動的に開始
if (process.env.NODE_ENV === 'development') {
  healthMonitor.start();
}

// APIサービスに追加
apiService.health = {
  monitor: healthMonitor,
  check: () => healthMonitor.check(),
  start: () => healthMonitor.start(),
  stop: () => healthMonitor.stop(),
  status: () => healthMonitor.getStatus()
};
```

---

## 導入方法と優先順位

このデバッグ戦略の導入における優先順位は以下の通りです：

1. **最優先実装:**
   - APIサービスへのログ強化 (api.service.ts)
   - バックエンドのリクエスト/レスポンスロギング
   - フロントエンドのネットワークデバッグユーティリティ

2. **高優先度実装:**
   - ヘルスチェックエンドポイント
   - 認証フローデバッグ機能
   - ログエクスポート機能

3. **中優先度実装:**
   - CORS問題検出ツール
   - エラーレポート生成機能
   - 環境検証ツール

4. **低優先度実装:**
   - デバッグコマンドセット
   - ヘルスモニター
   - エラーログ自動分析

## 今後検討すべき項目

- ブラウザ拡張機能によるデバッグ支援
- リアルタイムデータベース監視ツール
- 性能プロファイリングツール
- 自動エラー修復提案システム

---

## 結論

今回のデバッグ戦略は、フロントエンドとバックエンド間の通信を透明化し、問題の早期発見と解決を支援するための総合的なアプローチを提供します。この戦略を実装することで、デバッグプロセスがより構造化され、効率的になり、開発チーム全体の生産性が向上します。

特に、APIリクエスト/レスポンスのロギング強化と認証フローのデバッグ機能は、最も一般的な問題の根本原因を迅速に特定するために非常に重要です。また、環境差異の検出機能は、「自分の環境では動くのに」という問題を減らすのに役立ちます。

この戦略を適切に実装することで、DailyFortuneプロジェクトの開発ライフサイクル全体を通じて、問題解決にかかる時間を大幅に削減できるでしょう。