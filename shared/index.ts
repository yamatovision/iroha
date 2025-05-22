/**
 * ===== 統合型定義・APIパスガイドライン =====
 * 
 * 【重要】このファイルはフロントエンド（client）からは直接インポートして使用します。
 * バックエンド（server）では、このファイルをリファレンスとして、
 * server/src/types/index.ts に必要な型定義をコピーして使用してください。
 * これはデプロイ時の問題を回避するためのアプローチです。
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. データの形はこのファイルで一元的に定義し、バックエンドはこれをコピーして使用
 * 5. APIパスは必ずこのファイルで一元管理する
 * 6. コード内でAPIパスをハードコードしない
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 * 
 * 【変更手順】
 * 1. このファイルに型定義やAPIパスを追加/更新
 * 2. バックエンド用に server/src/types/index.ts にも同じ変更を手動で反映
 * 3. 両ファイルの一貫性を確保することで「単一の真実源」の概念を維持
 * 
 * 【Expressルーティング実装のルール】
 * 1. ベースパスの二重定義を避けるため、index.tsとroutes/*.tsでは以下の役割分担をする：
 *   - index.ts: `app.use(${API_BASE_PATH}/xxx, xxxRoutes)`でベースパスを設定
 *   - routes/*.ts: 各ルートハンドラでは`/`から始まる相対パスのみを指定（例: `/profile`）
 * 
 * 2. 正しいルーティング例:
 *   - index.ts: `app.use(${API_BASE_PATH}/auth, authRoutes)`
 *   - auth.routes.ts: `router.get('/profile', authenticate, authController.getProfile)`
 *   - 結果のパス: `/api/v1/auth/profile`
 * 
 * 3. 間違ったルーティング例 (二重定義):
 *   - index.ts: `app.use(${API_BASE_PATH}/auth, authRoutes)`
 *   - auth.routes.ts: `router.get(AUTH.PROFILE.replace('/api/v1', ''), authenticate, authController.getProfile)`
 *   - 結果: 混乱とバグの原因
 * 
 * 4. FE側ではこのファイルのAPIパス定数を直接使用する:
 *   - ✅ 正解: `fetch(AUTH.PROFILE)`
 *   - ❌ 不正解: `fetch('/api/v1/auth/profile')`
 * 
 * 【命名規則】
 * - データモデル: [Model]Type または I[Model]
 * - リクエスト: [Model]Request
 * - レスポンス: [Model]Response
 * 
 * 【変更履歴】
 * - 2025/04/05: 初期モデル・APIパス定義 (Claude)
 * - 2025/04/06: バックエンド用のリファレンス方式に変更 (Tatsuya)
 * - 2025/04/07: Expressルーティング実装ルールを追加 (Claude)
 * - 2025/04/08: SajuProfileの削除とUserモデルへの統合 (Claude)
 * - 2025/04/12: HarmonyCompassインターフェースを追加 (Claude)
 * - 2025/04/24: チャットコンテキスト管理システム用の型定義を追加 (Claude)
 * - 2025/04/30: クライアント管理API定義を追加 (Claude)
 * - 2025/04/30: 本日の施術クライアント一覧機能のAPI定義と型を追加 (Claude)
 */

// API基本パス
// ※※※ 重要 ※※※
// デプロイ時の問題回避：
// 環境変数VITE_API_URLには '/api/v1' を含めないこと
// APIパスと合わせると '/api/v1/api/v1/...' のように重複するため
export const API_BASE_PATH = '/api/v1';

// ========== 認証関連 ==========
export const AUTH = {
  LOGIN: `${API_BASE_PATH}/auth/login`,
  REGISTER: `${API_BASE_PATH}/auth/register`,
  PROFILE: `${API_BASE_PATH}/auth/profile`,
  PASSWORD_RESET: `${API_BASE_PATH}/auth/password-reset`,
  LOGOUT: `${API_BASE_PATH}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_PATH}/auth/refresh-token`,
  VERIFY_EMAIL: `${API_BASE_PATH}/auth/verify-email`,
};

// ========== サポートチケット関連 ==========
export const SUPPORT = {
  // サロン側
  TICKETS: `${API_BASE_PATH}/support/tickets`,
  TICKET_DETAIL: (id: string) => `${API_BASE_PATH}/support/tickets/${id}`,
  TICKET_REPLY: (id: string) => `${API_BASE_PATH}/support/tickets/${id}/reply`,
  
  // SuperAdmin側
  ADMIN_TICKETS: `${API_BASE_PATH}/admin/support/tickets`,
  ADMIN_TICKET_DETAIL: (id: string) => `${API_BASE_PATH}/admin/support/tickets/${id}`,
  ADMIN_TICKET_REPLY: (id: string) => `${API_BASE_PATH}/admin/support/tickets/${id}/reply`,
  ADMIN_SUPPORT_STATS: `${API_BASE_PATH}/admin/support/stats`,
};

// ========== JWT認証関連 ==========
export const JWT_AUTH = {
  LOGIN: `${API_BASE_PATH}/jwt-auth/login`,
  REGISTER: `${API_BASE_PATH}/jwt-auth/register`,
  REFRESH_TOKEN: `${API_BASE_PATH}/jwt-auth/refresh-token`,
  LOGOUT: `${API_BASE_PATH}/jwt-auth/logout`,
  MIGRATE_TO_JWT: `${API_BASE_PATH}/jwt-auth/migrate-to-jwt`,
};

// ========== 四柱推命関連 (ユーザーモデルに統合) ==========
export const SAJU = {
  GET_AVAILABLE_CITIES: `${API_BASE_PATH}/public/saju/available-cities`,
  GET_CITY_COORDINATES: (cityName: string) => `${API_BASE_PATH}/public/saju/city-coordinates/${encodeURIComponent(cityName)}`,
  CALCULATE_LOCAL_TIME_OFFSET: `${API_BASE_PATH}/public/saju/local-time-offset`,
};

// ========== 日柱関連 ==========
export const DAY_PILLAR = {
  GET_TODAY: `${API_BASE_PATH}/day-pillars/today`,
  GET_BY_DATE: (date: string) => `${API_BASE_PATH}/day-pillars/${date}`,
  GET_RANGE: `${API_BASE_PATH}/day-pillars`,
  GET_TIMEZONE_INFO: `${API_BASE_PATH}/day-pillars/timezone-info`,
  GET_AVAILABLE_CITIES: `${API_BASE_PATH}/day-pillars/available-cities`,
};

// ========== ユーザー関連 ==========
export const USER = {
  GET_USER: (userId: string) => `${API_BASE_PATH}/users/${userId}`,
  UPDATE_USER: (userId: string) => `${API_BASE_PATH}/users/${userId}`,
  LIST_USERS: `${API_BASE_PATH}/users`,
  GET_PROFILE: `${API_BASE_PATH}/users/profile`,
  UPDATE_PROFILE: `${API_BASE_PATH}/users/profile`, // 統合エンドポイント（PUT）
  PATCH_PROFILE: `${API_BASE_PATH}/users/profile`, // 部分更新エンドポイント（PATCH）
  UPDATE_EMAIL: `${API_BASE_PATH}/users/email`,
  SET_BIRTH_INFO: `${API_BASE_PATH}/users/birth-info`, // レガシーエンドポイント（互換性のため維持）
  CALCULATE_SAJU: `${API_BASE_PATH}/users/calculate-saju`, // レガシーエンドポイント（互換性のため維持）
  GET_SAJU_PROFILE: `${API_BASE_PATH}/users/profile`, // サポート注: 四柱推命データはユーザープロフィールに含まれます
  SET_GOALS: `${API_BASE_PATH}/users/goals`,
  GET_GOALS: `${API_BASE_PATH}/users/goals`,
  DELETE_GOAL: (goalId: string) => `${API_BASE_PATH}/users/goals/${goalId}`,
  UPDATE_GOAL: (goalId: string) => `${API_BASE_PATH}/users/goals/${goalId}`,
};

// ========== チーム関連 ==========
export const TEAM = {
  CREATE_TEAM: `${API_BASE_PATH}/teams`,
  GET_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}`,
  UPDATE_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}`,
  DELETE_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}`,
  LIST_TEAMS: `${API_BASE_PATH}/teams`,
  GET_USER_TEAMS: `${API_BASE_PATH}/teams/user`,
  GET_TEAM_MEMBERS: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members`,
  ADD_TEAM_MEMBER: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members`,
  ADD_MEMBER_FROM_FRIEND: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members/from-friend`,
  REMOVE_TEAM_MEMBER: (teamId: string, userId: string) => `${API_BASE_PATH}/teams/${teamId}/members/${userId}`,
  UPDATE_TEAM_MEMBER_ROLE: (teamId: string, userId: string) => `${API_BASE_PATH}/teams/${teamId}/members/${userId}/role`,
  SET_TEAM_GOAL: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/goal`,
  GET_TEAM_GOAL: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/goal`,
  GET_TEAM_COMPATIBILITY: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/compatibility`,
  GET_MEMBER_COMPATIBILITY: (teamId: string, userId1: string, userId2: string) => 
    `${API_BASE_PATH}/teams/${teamId}/compatibility/${userId1}/${userId2}`,
  GET_TEAM_ENHANCED_COMPATIBILITY: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/enhanced-compatibility`,
  GET_MEMBER_ENHANCED_COMPATIBILITY: (teamId: string, userId1: string, userId2: string) => 
    `${API_BASE_PATH}/teams/${teamId}/enhanced-compatibility/${userId1}/${userId2}`,
  GET_MEMBER_CARD: (teamId: string, userId: string) => `${API_BASE_PATH}/teams/${teamId}/members/${userId}/card`,
  LEAVE_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/leave`,
};

// ========== 運勢関連 ==========
export const FORTUNE = {
  GET_DAILY_FORTUNE: `${API_BASE_PATH}/fortune/daily`,
  GET_USER_FORTUNE: (userId: string) => `${API_BASE_PATH}/fortune/user/${userId}`,
  GET_TEAM_FORTUNE_RANKING: (teamId: string) => `${API_BASE_PATH}/fortune/team/${teamId}/ranking`,
  UPDATE_ALL_FORTUNES: `${API_BASE_PATH}/fortune/update-all`, // SuperAdmin専用
  UPDATE_FORTUNE: `${API_BASE_PATH}/fortune/update-fortune`, // 個人運勢の更新・生成
  
  // チームコンテキスト運勢API
  GET_TEAM_CONTEXT_FORTUNE: (teamId: string) => 
    `${API_BASE_PATH}/fortune/team/${teamId}/context`,
  GENERATE_TEAM_CONTEXT_FORTUNE: (teamId: string) => 
    `${API_BASE_PATH}/fortune/team/${teamId}/context/generate`,
  
  // 統合ダッシュボードAPI
  GET_FORTUNE_DASHBOARD: (teamId?: string) => 
    teamId ? `${API_BASE_PATH}/fortune/dashboard?teamId=${teamId}` 
           : `${API_BASE_PATH}/fortune/dashboard`,
};

// ========== AIチャット関連 ==========
export const CHAT = {
  SEND_MESSAGE: `${API_BASE_PATH}/chat/message`,
  GET_HISTORY: `${API_BASE_PATH}/chat/history`,
  CLEAR_HISTORY: `${API_BASE_PATH}/chat/clear`,
  
  // 新しいコンテキスト管理APIエンドポイント
  GET_AVAILABLE_CONTEXTS: `${API_BASE_PATH}/chat/contexts/available`,
  GET_CONTEXT_DETAIL: `${API_BASE_PATH}/chat/contexts/detail`,
};

// ========== 友達関連 ==========
export const FRIENDS = {
  SEARCH: `${API_BASE_PATH}/friends/search`, // 友達検索
  GET_ALL: `${API_BASE_PATH}/friends`, // 友達一覧取得
  GET_REQUESTS: `${API_BASE_PATH}/friends/requests`, // 受信した友達リクエスト
  GET_SENT_REQUESTS: `${API_BASE_PATH}/friends/sent-requests`, // 送信した友達リクエスト
  SEND_REQUEST: `${API_BASE_PATH}/friends/request`, // 友達リクエスト送信
  ACCEPT_REQUEST: (id: string) => `${API_BASE_PATH}/friends/requests/${id}/accept`, // リクエスト承認
  REJECT_REQUEST: (id: string) => `${API_BASE_PATH}/friends/requests/${id}/reject`, // リクエスト拒否
  REMOVE: (id: string) => `${API_BASE_PATH}/friends/${id}`, // 友達関係削除
  COMPATIBILITY: (id: string) => `${API_BASE_PATH}/friends/${id}/compatibility`, // 基本相性スコア
  ENHANCED_COMPATIBILITY: (id: string) => `${API_BASE_PATH}/friends/${id}/enhanced-compatibility`, // 拡張相性スコア（詳細アルゴリズム）
  GET_PROFILE: (id: string) => `${API_BASE_PATH}/friends/${id}/profile`, // 友達プロフィール取得
};

// ========== 招待関連 ==========
export const INVITATION = {
  // 友達招待作成
  CREATE_FRIEND: `${API_BASE_PATH}/invitations/friend`,
  // チーム招待作成
  CREATE_TEAM: `${API_BASE_PATH}/invitations/team`,
  // 招待情報取得
  GET_BY_CODE: (code: string) => `${API_BASE_PATH}/invitations/${code}`,
  // 招待承認
  ACCEPT: (code: string) => `${API_BASE_PATH}/invitations/${code}/accept`,
  // 招待拒否
  REJECT: (code: string) => `${API_BASE_PATH}/invitations/${code}/reject`,
  // 招待取り消し
  CANCEL: (id: string) => `${API_BASE_PATH}/invitations/${id}`,
  // 保留中の招待一覧取得
  GET_USER_INVITATIONS: `${API_BASE_PATH}/invitations`
};

// ========== 管理者専用 ==========
export const ADMIN = {
  DASHBOARD: `${API_BASE_PATH}/admin/dashboard`,
  USER_INSIGHTS: (userId: string) => `${API_BASE_PATH}/admin/insights/user/${userId}`,
  TEAM_INSIGHTS: (teamId: string) => `${API_BASE_PATH}/admin/insights/team/${teamId}`,
  SYSTEM_SETTINGS: `${API_BASE_PATH}/admin/settings`,
  UPDATE_SETTING: (settingKey: string) => `${API_BASE_PATH}/admin/settings/${settingKey}`,
  STATS: `${API_BASE_PATH}/admin/stats`,
  MANAGE_ADMINS: `${API_BASE_PATH}/admin/admins`,
  ADD_ADMIN: `${API_BASE_PATH}/admin/admins`,
  REMOVE_ADMIN: (userId: string) => `${API_BASE_PATH}/admin/admins/${userId}`,
  UPDATE_ADMIN_ROLE: (userId: string) => `${API_BASE_PATH}/admin/admins/${userId}/role`,
  
  // 運勢更新管理
  GET_FORTUNE_UPDATE_SETTINGS: `${API_BASE_PATH}/admin/settings/fortune-update`,
  UPDATE_FORTUNE_UPDATE_SETTINGS: `${API_BASE_PATH}/admin/settings/fortune-update`,
  GET_FORTUNE_UPDATE_LOGS: `${API_BASE_PATH}/admin/settings/fortune-updates/logs`,
  GET_FORTUNE_UPDATE_LOG_DETAIL: (logId: string) => `${API_BASE_PATH}/admin/settings/fortune-updates/logs/${logId}`,
  RUN_FORTUNE_UPDATE: `${API_BASE_PATH}/admin/settings/fortune-updates/manual-run`,
  
  // 日柱管理
  GET_DAY_PILLARS: `${API_BASE_PATH}/admin/settings/day-pillars`,
  GET_DAY_PILLAR_LOGS: `${API_BASE_PATH}/admin/settings/day-pillars/logs`,
  GET_DAY_PILLAR_LOG_DETAIL: (logId: string) => `${API_BASE_PATH}/admin/settings/day-pillars/logs/${logId}`,
  RUN_DAY_PILLAR_GENERATION: `${API_BASE_PATH}/admin/settings/day-pillars/manual-run`,
  
  // 認証管理
  GET_AUTH_STATS: `${API_BASE_PATH}/admin/settings/auth/stats`,
  GET_USER_AUTH_STATE: (userId: string) => `${API_BASE_PATH}/admin/settings/auth/users/${userId}`,
  INVALIDATE_USER_TOKENS: (userId: string) => `${API_BASE_PATH}/admin/settings/auth/users/${userId}/invalidate`,
  GET_MIGRATION_STATS: `${API_BASE_PATH}/admin/settings/auth/migration`,
  RUN_TOKEN_CLEANUP: `${API_BASE_PATH}/admin/settings/auth/cleanup`,
  
  // 美容サロン管理（スーパー管理者用）
  GET_SALON_STATS: `${API_BASE_PATH}/admin/salon-stats`,
  GET_SALON_DETAILS: (organizationId: string) => `${API_BASE_PATH}/admin/salons/${organizationId}`,
  UPDATE_SALON_STATUS: (organizationId: string) => `${API_BASE_PATH}/admin/salons/${organizationId}/status`,
  GET_CLIENT_STATS: `${API_BASE_PATH}/admin/client-stats`,
  GET_STYLIST_STATS: `${API_BASE_PATH}/admin/stylist-stats`,
};

// ========== クライアント管理API ==========
export const CLIENT = {
  LIST: `${API_BASE_PATH}/clients`,
  DETAIL: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}`,
  CREATE: `${API_BASE_PATH}/clients`,
  UPDATE: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}`,
  DELETE: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}`,
  
  // 四柱推命関連
  UPDATE_SAJU: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/saju`,
  GET_COMPATIBILITY: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/compatibility`,
  RECALCULATE_COMPATIBILITY: (clientId: string) => 
    `${API_BASE_PATH}/clients/${clientId}/compatibility/recalculate`,
    
  // メモ関連
  GET_NOTES: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/notes`,
  CREATE_NOTE: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/notes`,
  UPDATE_NOTE: (clientId: string, noteId: string) => 
    `${API_BASE_PATH}/clients/${clientId}/notes/${noteId}`,
  DELETE_NOTE: (clientId: string, noteId: string) => 
    `${API_BASE_PATH}/clients/${clientId}/notes/${noteId}`,
    
  // データインポート/エクスポート
  IMPORT: `${API_BASE_PATH}/clients/import`,
  EXPORT: `${API_BASE_PATH}/clients/export`,
  
  // チャット連携
  GET_CHAT: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/chat`,
  SEND_CHAT: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/chat`,
  
  // 本日の施術クライアント一覧関連
  GET_DAILY_APPOINTMENTS: `${API_BASE_PATH}/appointments/daily`,
  GET_CLIENT_DETAILS: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/details`,
  ADD_CLIENT_MEMO: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/memos`,
  REGISTER_SAJU: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/register-saju`,
  REFRESH_AI_SUGGESTIONS: (clientId: string) => `${API_BASE_PATH}/clients/${clientId}/refresh-ai-suggestions`,
};

// ========== 美容クライアント直接入力・チャット連携API ==========
export const BEAUTY_CLIENT_INPUT = {
  // クライアント検索・詳細
  SEARCH_CLIENTS: `${API_BASE_PATH}/beauty-clients/search`,
  GET_CLIENT_DETAILS: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/details`,
  
  // 誕生日情報更新
  UPDATE_BIRTH_INFO: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/birth-info`,
  
  // チャット関連
  GET_CHAT_SESSION: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/chat`,
  SEND_CHAT_MESSAGE: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/chat`,
};

// ========== データモデル ==========

// 調和のコンパスのインターフェース
export interface IHarmonyCompass {
  version: string;
  type: string;
  sections: {
    strengths: string;    // 強化すべき方向性
    balance: string;      // 注意すべきバランス
    relationships: string; // 人間関係の智慧
    challenges: string;   // 成長のための課題
  };
}

// SajuEngine計算オプション
export interface SajuOptions {
  useLocalTime?: boolean;          // 地方時（経度に基づく時差）を使用するか
  useDST?: boolean;                // 夏時間（サマータイム）を考慮するか
  useHistoricalDST?: boolean;      // 歴史的サマータイム（日本1948-1951年）を考慮するか
  useStandardTimeZone?: boolean;   // 標準タイムゾーンを使用するか（政治的/行政的）
  useInternationalMode?: boolean;  // 国際対応モードを使用するか
  useSecondsPrecision?: boolean;   // 秒単位の精度を使用するか
  gender?: Gender;                 // 性別 (M=男性, F=女性)
  location?: string | {            // 出生地（都市名または座標）
    longitude: number;
    latitude: number;
    timeZone?: string;             // オプションでタイムゾーン指定
  } | ExtendedLocation;            // 拡張ロケーション情報
  referenceStandardMeridian?: number; // 標準経度（デフォルト：東経135度）
}

// 拡張ロケーション情報
export interface ExtendedLocation {
  name?: string;
  country?: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  timeZone?: string;
}

// タイムゾーン調整情報
export interface TimezoneAdjustmentInfo {
  politicalTimeZone?: string;        // 政治的タイムゾーン (e.g. "Asia/Tokyo")
  isDST?: boolean;                   // サマータイム適用状態
  timeZoneOffsetMinutes?: number;    // タイムゾーンオフセット（分）
  timeZoneOffsetSeconds?: number;    // タイムゾーンオフセット（秒）
  localTimeAdjustmentSeconds?: number; // 秒単位の地方時調整
  adjustmentDetails?: {              // 調整詳細
    politicalTimeZoneAdjustment: number; // 政治的タイムゾーンによる調整（分）
    longitudeBasedAdjustment: number;    // 経度ベースの調整（分）
    dstAdjustment: number;               // サマータイム調整（分）
    regionalAdjustment: number;          // 地域特有の調整（分）
    totalAdjustmentMinutes: number;      // 合計調整（分）
    totalAdjustmentSeconds: number;      // 合計調整（秒）
  };
}

// 権限レベル
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// チームメンバーロール
export enum TeamMemberRole {
  CREATOR = 'creator',   // チーム作成者（最高権限）
  ADMIN = 'admin',       // 管理者（一部権限）
  MEMBER = 'member'      // 一般メンバー
}

// 性別
export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

// 目標タイプ
export enum GoalType {
  CAREER = 'career',
  TEAM = 'team',
  PERSONAL = 'personal',
}

// チャットコンテキストタイプ
export enum ContextType {
  SELF = 'self',         // 自分の情報
  FRIEND = 'friend',     // 友達の情報
  FORTUNE = 'fortune',   // 運勢情報
  TEAM = 'team',         // チーム情報
  TEAM_GOAL = 'team_goal', // チーム目標情報
  CLIENT = 'client',     // クライアント情報（美容サロン向け）
}

// 五行属性
export enum Element {
  WOOD = 'wood',
  FIRE = 'fire',
  EARTH = 'earth',
  METAL = 'metal',
  WATER = 'water',
}

// 五行関係タイプ
export enum ElementRelation {
  PRODUCING = 'producing', // 相生
  CONTROLLING = 'controlling', // 相克
  NEUTRAL = 'neutral', // 中和
}

// 地理座標インターフェース
export interface IGeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

// ユーザーモデル
export interface IUser {
  id: string; // クライアント向けには文字列として提供
  email: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  jobTitle?: string; // 役割（エンジニア、営業など）
  goal?: string; // 個人目標
  
  // 四柱推命関連フィールド（旧SajuProfileから統合）
  birthDate?: Date;
  birthTime?: string; // HH:MM形式
  birthPlace?: string;
  gender?: Gender;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number; // 地方時オフセット（分単位）
  // 国際対応拡張情報
  timeZone?: string; // タイムゾーン識別子（例：'Asia/Tokyo'）
  extendedLocation?: ExtendedLocation; // 拡張ロケーション情報
  elementAttribute?: Element; // 五行属性
  dayMaster?: string; // 日主
  fourPillars?: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
  };
  elementProfile?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {               // 格局情報
    type: string;                   // 例: '従旺格', '建禄格'など
    category: 'special' | 'normal'; // 特別格局か普通格局か
    strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
    description?: string;           // 格局の説明
  };
  yojin?: {                         // 用神情報
    tenGod: string;                 // 十神表記: 例 '比肩', '食神'
    element: string;                // 五行表記: 例 'wood', 'fire'
    description?: string;           // 用神の説明
    supportElements?: string[];     // 用神をサポートする五行
    kijin?: {                       // 喜神情報（用神を助ける要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
    kijin2?: {                      // 忌神情報（避けるべき要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
    kyujin?: {                      // 仇神情報（強く避けるべき要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
  };
  personalityDescription?: string;
  careerAptitude?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// 後方互換性のための型定義
// (注意: 実際のデータはIUserに統合済み、これはAPIの後方互換性のためだけに存在)
export interface ISajuProfile {
  userId: string;
  birthplace: string;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number;
  fourPillars: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
  };
  mainElement: Element;
  secondaryElement?: Element;
  elementProfile: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  // 格局（気質タイプ）情報
  kakukyoku?: {
    type: string;                   // 例: '従旺格', '建禄格'など
    category: 'special' | 'normal'; // 特別格局か普通格局か
    strength: 'strong' | 'weak' | 'neutral'; // 身強か身弱か中和か
    description?: string;           // 格局の説明
  };
  yojin?: {                         // 用神情報
    tenGod: string;                 // 十神表記: 例 '比肩', '食神'
    element: string;                // 五行表記: 例 'wood', 'fire'
    description?: string;           // 用神の説明
    supportElements?: string[];     // 用神をサポートする五行
    kijin?: {                       // 喜神情報（用神を助ける要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
    kijin2?: {                      // 忌神情報（避けるべき要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
    kyujin?: {                      // 仇神情報（強く避けるべき要素）
      tenGod: string;               // 十神表記
      element: string;              // 五行表記
      description?: string;         // 説明
    };
  };
  personalityDescription: string;
  careerAptitude: string;
  createdAt: Date;
  updatedAt: Date;
}

// ユーザー目標
export interface IGoal {
  id: string;
  userId: string;
  type: GoalType;
  content: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// チームモデル
export interface ITeam {
  id: string;
  name: string;
  adminId: string; // チーム管理者のユーザーID
  organizationId: string; // 組織への参照
  description?: string;
  iconInitial?: string;
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal';
  createdAt: Date;
  updatedAt: Date;
}

// チームメンバー
export interface ITeamMember {
  userId: string;
  teamId: string;
  role: string; // チーム内での役割（エンジニア、営業など）
  joinedAt: Date;
}

// 運勢データ
export interface IFortune {
  id: string;
  userId: string;
  date: Date;
  dayPillar: {
    heavenlyStem: string;
    earthlyBranch: string;
  };
  score: number; // 0-100点
  advice: string; // マークダウン形式のアドバイス（運勢詳細、個人目標アドバイス、チーム目標アドバイスを含む）
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 運勢スコア計算結果（サーバー内部で使用）
export interface FortuneScoreResult {
  score: number;
  advice: string;
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  stemElement: string;
  branchElement: string;
  balanceStatus?: {
    wood: string;
    fire: string;
    earth: string;
    metal: string;
    water: string;
  };
  yojinRelation?: string;
  dayIsGeneratingYojin?: boolean;
  dayIsControllingYojin?: boolean;
  useBalancedAlgorithm: boolean;
  useEnhancedAlgorithm: boolean;
  fortuneType?: string;
}

// チームコンテキスト運勢データ
export interface ITeamContextFortune {
  id: string;
  userId: string;
  teamId: string;
  date: Date;
  dayPillar: {
    heavenlyStem: string;
    earthlyBranch: string;
  };
  teamGoalId?: string; // チーム目標ID（オプション）
  score: number; // 0-100点
  teamContextAdvice: string; // チーム特化アドバイス
  collaborationTips: string[]; // チーム協力のためのヒント
  createdAt: Date;
  updatedAt: Date;
}

// 運勢ダッシュボードレスポンス
export interface IFortuneDashboardResponse {
  personalFortune: IFortune; // 個人の基本運勢
  teamContextFortune?: ITeamContextFortune; // チームコンテキスト運勢（選択中のチーム）
  teamGoal?: {
    id: string;
    content: string;
    deadline?: Date;
    progressRate: number;
  }; // チーム目標情報
  teamRanking?: {
    ranking: Array<{
      userId: string;
      displayName: string;
      jobTitle?: string;
      elementAttribute?: string;
      score: number;
    }>;
    userRank?: number; // 現在のユーザーの順位
  }; // チーム運勢ランキング
  teamsList?: Array<{
    id: string;
    name: string;
  }>; // ユーザーが所属する全チームリスト（管理者用）
}

// 相性データ
export interface ICompatibility {
  id: string;
  userId1: string;
  userId2: string;
  score: number; // 0-100点
  relationType: ElementRelation;
  element1: Element;
  element2: Element;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// チャットコンテキスト情報のインターフェース
export interface IContextItem {
  id: string;         // 一意のID
  type: ContextType;  // 情報の種類
  name: string;       // 表示名
  iconType: string;   // アイコン種類
  color: string;      // 表示色
  removable: boolean; // 削除可能かどうか
  payload: any;       // 実際のデータペイロード
}

// チャットメッセージ
export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextItems?: {   // メッセージごとのコンテキスト情報
    type: string;    // コンテキストの種類
    refId?: string;  // 参照ID（友達ID、運勢タイプなど）
    data?: any;      // 追加データ
  }[];
}

// チャット履歴データ
export interface IChat {
  id: string;
  userId: string;
  messages: IChatMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 友達関係
export interface IFriendship {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'rejected';
  requesterId: string;
  compatibilityScore?: number;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// チームメンバーシップ（改良版）
export interface ITeamMembership {
  id: string;
  userId: string;
  teamId: string;
  role: string;                  // 職務役割（例：エンジニア、マーケター）
  memberRole?: TeamMemberRole;   // メンバー権限ロール（creator, admin, member）
  isAdmin: boolean;              // 後方互換性のため維持
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 招待リンク
export interface IInvitationLink {
  id: string;
  code: string;
  teamId?: string;
  inviterId: string;
  email: string;
  type: 'team' | 'friend';
  role?: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// システム設定
export interface ISystemSetting {
  key: string;
  value: string;
  description: string;
  updatedAt: Date;
  updatedBy: string;
}

// クライアント（美容サロンの顧客）
export interface IClient {
  id: string;                 // クライアントのユニークID
  organizationId: string;     // 所属組織ID（美容サロンID）
  name: string;               // 氏名
  nameReading?: string;       // 読み仮名
  gender?: string;            // 性別
  birthdate?: Date;           // 生年月日
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  phone?: string;             // 電話番号
  email?: string;             // メールアドレス
  address?: string;           // 住所
  memo?: string;              // メモ・備考
  
  // カスタムプロパティ
  customFields?: Record<string, any>; // カスタムフィールド
  
  // 外部システム連携情報
  externalSources?: {
    [sourceKey: string]: string;  // 例: { "hotpepper": "HP12345", "salonanswer": "SA67890" }
  };
  
  // 四柱推命情報
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number;   // 地方時オフセット（分単位）
  timeZone?: string;          // タイムゾーン
  elementAttribute?: string;  // 主要五行属性
  fourPillars?: {             // 四柱（年月日時）
    year: GanShiPillar;
    month: GanShiPillar;
    day: GanShiPillar;
    hour: GanShiPillar;
  };
  elementProfile?: {          // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {               // 格局情報
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {                   // 用神情報
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
  };
  personalityDescription?: string; // 性格特性
  
  // 内部管理用
  isFavorite: boolean;        // お気に入り登録
  hasCompleteSajuProfile: boolean; // 四柱推命プロフィール完成状態
  lastVisitDate?: Date;       // 最終来店日
  createdBy: string;          // 作成者ID
  updatedBy: string;          // 更新者ID
  createdAt: Date;            // 登録日時
  updatedAt: Date;            // 更新日時
}

// 干支柱（四柱の基本単位）
export interface GanShiPillar {
  gan: string;                 // 天干
  shi: string;                 // 地支
  element: string;             // 五行属性
}

// クライアント-スタイリスト相性
export interface IClientStylistCompatibility {
  id: string;
  clientId: string;
  stylistId: string;
  organizationId: string;
  overallScore: number;
  calculatedAt: Date;
  calculationVersion: string;
}

// クライアントメモ
export interface IClientNote {
  id: string;
  clientId: string;
  organizationId: string;
  authorId: string;
  content: string;
  noteType: ClientNoteType;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  isRemoved: boolean;
}

// メモタイプ
export enum ClientNoteType {
  GENERAL = 'general',
  PREFERENCE = 'preference',
  TREATMENT = 'treatment',
  FOLLOW_UP = 'follow_up'
}

// クライアントチャット
export interface IClientChat {
  id: string;
  clientId: string;
  organizationId: string;
  messages: IClientChatMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// クライアントチャットメッセージ
export interface IClientChatMessage {
  role: 'stylist' | 'assistant';
  content: string;
  timestamp: Date;
  stylistId?: string;
  contextItems?: {
    type: string;
    refId?: string;
    data?: any;
  }[];
}

// ========== リクエスト/レスポンス型 ==========

// ログインリクエスト
export interface LoginRequest {
  email: string;
  password: string;
}

// ログインレスポンス
export interface LoginResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

// JWT認証関連の型
export interface JwtLoginRequest {
  email: string;
  password: string;
}

export interface JwtAuthResponse {
  user: IUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface JwtRefreshTokenRequest {
  refreshToken: string;
}

export interface JwtRefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface JwtMigrateRequest {
  password: string;
  firebaseUid?: string;
}

// 登録リクエスト
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

// 出生情報設定リクエスト
export interface BirthInfoRequest {
  birthDate: Date;
  birthTime: string; // HH:MM形式
  birthPlace: string;
  gender: Gender;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number;
  // 国際対応拡張情報
  timeZone?: string; // タイムゾーン識別子
  extendedLocation?: ExtendedLocation; // 拡張ロケーション情報
}

// 目標設定リクエスト
export interface GoalRequest {
  type: GoalType;
  content: string;
  deadline?: Date;
}

// チーム作成リクエスト
export interface TeamRequest {
  name: string;
  goal?: string;
}

// チームメンバー追加リクエスト
export interface AddTeamMemberRequest {
  email: string;
  role: string;
  password?: string;
  displayName?: string;
}

// チャットメッセージ送信リクエスト（コンテキストベース）
export interface ChatMessageRequest {
  message: string;
  contextItems: {
    type: ContextType;
    id?: string;        // 友達ID、運勢タイプ（today/tomorrow）など
    additionalInfo?: any; // 追加情報（必要に応じて）
  }[];
}

// 利用可能なコンテキスト情報レスポンス
export interface AvailableContextsResponse {
  success: boolean;
  availableContexts: {
    self: {
      id: string;
      name: string;
      iconType: string;
      color: string;
    };
    fortune: {
      id: string;
      name: string;
      iconType: string;
      color: string;
    }[];
    friends: {
      id: string;
      name: string;
      iconType: string;
      color: string;
      elementAttribute?: string;
    }[];
    teams?: {
      id: string;
      name: string;
      iconType: string;
      color: string;
    }[];
  };
}

// コンテキスト詳細取得リクエスト
export interface ContextDetailRequest {
  type: ContextType;
  id: string;
}

// コンテキスト詳細レスポンス
export interface ContextDetailResponse {
  success: boolean;
  context: IContextItem;
}

// 管理者ダッシュボードレスポンス
export interface AdminDashboardResponse {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  alerts: {
    userId: string;
    userName: string;
    teamId: string;
    teamName: string;
    type: 'motivation_drop' | 'turnover_risk';
    level: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

// システム統計レスポンス
export interface SystemStatsResponse {
  userStats: {
    total: number;
    active: number;
    byRole: {
      [key in UserRole]: number;
    };
    registrationTrend: {
      date: string;
      count: number;
    }[];
  };
  aiStats: {
    totalRequests: number;
    averageResponseTime: number;
    requestsByDay: {
      date: string;
      count: number;
    }[];
  };
}

// ========== サポートチケットシステム関連 ==========

// サポートチケットステータス
export enum TicketStatus {
  PENDING = 'pending',   // 未回答
  ANSWERED = 'answered', // 回答済み
}

// サポートチケット送信者タイプ
export enum TicketSenderType {
  SALON = 'salon',         // サロンスタッフ
  SUPERADMIN = 'superadmin' // スーパー管理者
}

// サポートチケット
export interface ISupportTicket {
  id: string;
  ticketNumber: string;     // 表示用チケット番号（TK-XXXX形式）
  organizationId: string;   // 組織ID
  creatorId: string;        // 作成者ID（ユーザーID）
  title: string;            // タイトル
  status: TicketStatus;     // ステータス
  createdAt: Date;
  updatedAt: Date;
}

// チケットメッセージ
export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderId: string;         // 送信者ID（ユーザーIDまたは'superadmin'）
  senderType: TicketSenderType; // 送信者タイプ
  content: string;          // メッセージ内容
  createdAt: Date;
  isRead: boolean;          // 既読フラグ
}

// チケット作成リクエスト
export interface CreateTicketRequest {
  title: string;            // タイトル
  content: string;          // 詳細内容
}

// チケット作成レスポンス
export interface CreateTicketResponse {
  ticketId: string;
  ticketNumber: string;
  title: string;
  content: string;
  status: TicketStatus;
  createdAt: string;
}

// チケット一覧クエリパラメータ
export interface TicketListQuery {
  status?: 'all' | 'pending' | 'answered';
  page?: number;
  limit?: number;
}

// チケット一覧レスポンス
export interface TicketListResponse {
  tickets: {
    ticketId: string;
    ticketNumber: string;
    title: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  counts: {
    all: number;
    pending: number;
    answered: number;
  };
}

// チケット詳細レスポンス
export interface TicketDetailResponse {
  ticketId: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: {
    messageId: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      type: TicketSenderType;
    };
    isRead: boolean;
  }[];
}

// チケット返信リクエスト
export interface ReplyTicketRequest {
  content: string;
}

// チケット返信レスポンス
export interface ReplyTicketResponse {
  messageId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    type: TicketSenderType;
  };
  ticketStatus: TicketStatus;
}

// SuperAdmin用チケット一覧クエリパラメータ
export interface AdminTicketListQuery extends TicketListQuery {
  organizationId?: string;
  search?: string;
}

// SuperAdmin用チケット一覧レスポンス
export interface AdminTicketListResponse {
  tickets: {
    ticketId: string;
    ticketNumber: string;
    title: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    organization: {
      id: string;
      name: string;
    };
    creator: {
      id: string;
      name: string;
    };
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  counts: {
    all: number;
    pending: number;
    answered: number;
  };
}

// SuperAdmin用チケット詳細レスポンス
export interface AdminTicketDetailResponse extends TicketDetailResponse {
  organization: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
    role: 'owner' | 'admin';
  };
}

// サポート統計情報レスポンス
export interface SupportStatsResponse {
  totalTickets: number;
  pendingTickets: number;
  answeredTickets: number;
  avgResponseTime: number;
  topOrganizations: {
    id: string;
    name: string;
    ticketCount: number;
  }[];
  ticketsPerDay: {
    date: string;
    count: number;
  }[];
}

// ========== 課金・支払い管理関連 ==========

// 請求サイクル
export enum BillingCycle {
  MONTHLY = 'monthly',        // 月額
  YEARLY = 'yearly'           // 年額
}

// 請求書ステータス
export enum InvoiceStatus {
  PENDING = 'pending',        // 支払い待ち
  PAID = 'paid',              // 支払い済み
  PAST_DUE = 'past_due',      // 支払い遅延
  CANCELED = 'canceled'       // キャンセル
}

// サブスクリプションのステータス
export enum SubscriptionStatus {
  TRIAL = 'trial',            // トライアル中
  ACTIVE = 'active',          // アクティブ
  PAST_DUE = 'past_due',      // 支払い遅延
  CANCELED = 'canceled',      // キャンセル済み
  SUSPENDED = 'suspended'     // 一時停止中
}

// 支払いステータス
export enum PaymentStatus {
  SUCCESS = 'success',   // 支払い成功
  FAILED = 'failed',     // 支払い失敗
  PENDING = 'pending'    // 処理中
}

// 料金プランモデル
export interface IPricePlan {
  _id: string;                // プランID
  name: string;               // プラン名
  price: number;              // 月額料金
  description: string;        // プラン説明
  features: string[];         // 機能リスト
  maxStylists: number | null; // 最大スタイリスト数（nullは無制限）
  maxClients: number | null;  // 最大クライアント数（nullは無制限）
  maxTokensPerMonth: number;  // 月間最大トークン数
  additionalTokenPrice: number; // 追加トークン1Mあたりの価格
  isActive: boolean;          // 有効/無効フラグ
  displayOrder: number;       // 表示順序
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// サブスクリプションモデル
export interface ISubscription {
  _id: string;                // サブスクリプションID
  organizationId: string;     // 組織ID
  planId: string;             // プランID
  status: SubscriptionStatus; // ステータス
  paymentStatus: PaymentStatus; // 支払いステータス
  startDate: Date;            // 開始日
  endDate: Date | null;       // 終了日（nullは無期限）
  billingCycle: BillingCycle; // 請求サイクル
  nextBillingDate: Date;      // 次回請求日
  currentPeriodStart: Date;   // 現在の請求期間開始日
  currentPeriodEnd: Date;     // 現在の請求期間終了日
  paymentFailCount: number;   // 支払い失敗回数
  lastPaymentDate?: Date;     // 最終支払い日
  lastFailureReason?: string; // 最後の失敗理由
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// 請求書項目
export interface IInvoiceItem {
  description: string;        // 内容
  quantity: number;           // 数量
  unitPrice: number;          // 単価
  amount: number;             // 金額
}

// 請求書モデル
export interface IInvoice {
  _id: string;                // 請求書ID
  invoiceNumber: string;      // 請求書番号
  subscriptionId: string;     // サブスクリプションID
  organizationId: string;     // 組織ID
  planId: string;             // プランID
  amount: number;             // 請求金額
  status: InvoiceStatus;      // ステータス
  issueDate: Date;            // 発行日
  dueDate: Date;              // 支払期限
  paidAt: Date | null;        // 支払日
  items: IInvoiceItem[];      // 請求項目
  notes: string;              // 備考
  tokenUsage?: {              // トークン使用状況
    totalTokens: number;      // 合計トークン数
    planLimit: number;        // プラン上限
    additionalTokens: number; // 追加トークン
    utilizationPercentage: number; // 使用率
  };
  paymentMethod?: {           // 支払い方法
    type: string;             // 種類（クレジットカードなど）
    last4: string;            // 下4桁
    brand: string;            // ブランド（VISAなど）
  };
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// トークンチャージ履歴
export interface ITokenCharge {
  _id: string;                // チャージID
  organizationId: string;     // 組織ID
  userId: string;             // 購入者ID
  purchaseDate: Date;         // 購入日時
  chargeType: 'standard' | 'premium'; // チャージタイプ
  tokenAmount: number;        // トークン数
  price: number;              // 金額
  expirationDate: Date;       // 有効期限
  remainingTokens: number;    // 残りトークン数
  status: 'active' | 'expired' | 'exhausted'; // ステータス
  invoiceId?: string;         // 関連する請求書ID
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// APIトークン使用統計
export interface ITokenUsageStats {
  organizationId: string;     // 組織ID
  period: string;             // 期間（YYYY-MM形式）
  totalTokens: number;        // 合計トークン数
  planLimit: number;          // プラン上限
  additionalTokens: number;   // 追加チャージトークン
  utilizationPercentage: number; // 使用率
  byDay: {                    // 日別統計
    date: string;             // 日付
    tokens: number;           // トークン数
  }[];
  byUser: {                   // ユーザー別統計
    userId: string;           // ユーザーID
    userName: string;         // ユーザー名
    tokens: number;           // トークン数
    percentage: number;       // 割合
  }[];
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// 組織の支払い情報
export interface IPaymentMethod {
  _id: string;                // 支払い方法ID
  organizationId: string;     // 組織ID
  type: string;               // 種類（クレジットカードなど）
  cardHolder?: string;        // カード保持者名
  last4?: string;             // 下4桁
  brand?: string;             // ブランド（VISAなど）
  expiryMonth?: number;       // 有効期限（月）
  expiryYear?: number;        // 有効期限（年）
  isDefault: boolean;         // デフォルトフラグ
  createdAt: Date;            // 作成日時
  updatedAt: Date;            // 更新日時
}

// 課金・支払い関連のAPIパス
export const BILLING = {
  // プラン関連
  GET_CURRENT_PLAN: `${API_BASE_PATH}/billing/plan`,
  CHANGE_PLAN: `${API_BASE_PATH}/billing/plan`,
  
  // 請求書関連
  GET_INVOICES: `${API_BASE_PATH}/billing/invoices`,
  GET_INVOICE_DETAIL: (invoiceId: string) => `${API_BASE_PATH}/billing/invoices/${invoiceId}`,
  DOWNLOAD_INVOICE: (invoiceId: string) => `${API_BASE_PATH}/billing/invoices/${invoiceId}/pdf`,
  
  // 支払い方法関連
  GET_PAYMENT_METHODS: `${API_BASE_PATH}/billing/payment-methods`,
  ADD_PAYMENT_METHOD: `${API_BASE_PATH}/billing/payment-methods`,
  UPDATE_PAYMENT_METHOD: (methodId: string) => `${API_BASE_PATH}/billing/payment-methods/${methodId}`,
  DELETE_PAYMENT_METHOD: (methodId: string) => `${API_BASE_PATH}/billing/payment-methods/${methodId}`,
  SET_DEFAULT_PAYMENT_METHOD: (methodId: string) => `${API_BASE_PATH}/billing/payment-methods/${methodId}/default`,
  
  // APIトークン関連
  GET_TOKEN_USAGE: `${API_BASE_PATH}/billing/token-usage`,
  PURCHASE_TOKENS: `${API_BASE_PATH}/billing/purchase-tokens`,
  GET_TOKEN_CHARGES: `${API_BASE_PATH}/billing/token-charges`,
  
  // 課金サイクル関連
  CHANGE_BILLING_CYCLE: `${API_BASE_PATH}/billing/cycle`,
};

// リクエスト・レスポンス型定義
// 現在のプラン情報取得レスポンス
export interface CurrentPlanResponse {
  subscription: {
    _id: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    nextBillingDate: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  plan: {
    _id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    maxStylists: number | null;
    maxClients: number | null;
    maxTokensPerMonth: number;
  };
  monthlyPrice: number;
  yearlyPrice: number;
  tokenUsage: {
    currentUsage: number;
    planLimit: number;
    additionalTokens: number;
    utilizationPercentage: number;
    estimatedConversationsLeft: number;
  };
}

// プラン変更リクエスト
export interface ChangePlanRequest {
  planId: string;
  billingCycle?: BillingCycle;
  startImmediately?: boolean;
}

// プラン変更レスポンス
export interface ChangePlanResponse {
  success: boolean;
  message: string;
  effectiveDate: string;
  newPlan: {
    name: string;
    price: number;
  };
}

// 請求書一覧取得リクエスト
export interface InvoiceListRequest {
  page?: number;
  limit?: number;
  status?: InvoiceStatus | 'all';
  startDate?: string;
  endDate?: string;
}

// 請求書一覧レスポンス
export interface InvoiceListResponse {
  invoices: {
    _id: string;
    invoiceNumber: string;
    amount: number;
    status: InvoiceStatus;
    issueDate: string;
    dueDate: string;
    paidAt: string | null;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// 請求書詳細レスポンス
export interface InvoiceDetailResponse {
  _id: string;
  invoiceNumber: string;
  subscription: {
    _id: string;
    plan: {
      name: string;
      price: number;
    };
  };
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  notes: string;
  tokenUsage?: {
    totalTokens: number;
    planLimit: number;
    additionalTokens: number;
    utilizationPercentage: number;
    details?: {
      date: string;
      tokens: number;
    }[];
  };
  paymentMethod?: {
    type: string;
    last4: string;
    brand: string;
  };
}

// 支払い方法一覧レスポンス
export interface PaymentMethodListResponse {
  paymentMethods: {
    _id: string;
    type: string;
    cardHolder?: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }[];
}

// 支払い方法追加リクエスト
export interface AddPaymentMethodRequest {
  cardHolder: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  isDefault?: boolean;
}

// トークン使用状況レスポンス
export interface TokenUsageResponse {
  currentPeriod: {
    start: string;
    end: string;
  };
  usage: {
    totalTokens: number;
    planLimit: number;
    additionalTokens: number;
    utilizationPercentage: number;
    estimatedConversationsLeft: number;
  };
  dailyUsage: {
    date: string;
    tokens: number;
  }[];
  userBreakdown: {
    userId: string;
    userName: string;
    tokens: number;
    percentage: number;
  }[];
  trendData: {
    previousMonthUsage: number;
    monthOverMonthChange: number;
    averageDailyUsage: number;
  };
}

// トークン購入リクエスト
export interface PurchaseTokensRequest {
  chargeType: 'standard' | 'premium';
  paymentMethodId?: string;
}

// トークン購入レスポンス
export interface PurchaseTokensResponse {
  success: boolean;
  message: string;
  tokenCharge: {
    tokenAmount: number;
    price: number;
    expirationDate: string;
    remainingTokens: number;
  };
  invoiceId?: string;
}

// トークンチャージ履歴レスポンス
export interface TokenChargeListResponse {
  charges: {
    _id: string;
    purchaseDate: string;
    chargeType: string;
    tokenAmount: number;
    price: number;
    expirationDate: string;
    remainingTokens: number;
    status: string;
  }[];
}

// 課金サイクル変更リクエスト
export interface ChangeBillingCycleRequest {
  billingCycle: BillingCycle;
}

// 課金サイクル変更レスポンス
export interface ChangeBillingCycleResponse {
  success: boolean;
  message: string;
  effectiveDate: string;
  newCycle: BillingCycle;
  priceChange: {
    oldPrice: number;
    newPrice: number;
    savingsPercentage?: number;
  };
}

// ========== クライアント管理API関連 ==========

// クライアント一覧クエリパラメータ
export interface ClientListRequest {
  page?: number;               // ページ番号（1から開始）
  limit?: number;              // 1ページあたりの件数
  search?: string;             // 検索キーワード（名前、電話、メールなど）
  filter?: string;             // フィルター条件（all, no_birthday, recent_visit, favorite）
  sortBy?: string;             // ソート項目（name, last_visit, created_at）
  sortOrder?: 'asc' | 'desc';  // ソート順
}

// クライアント一覧レスポンス
export interface ClientListResponse {
  clients: {
    id: string;
    name: string;
    gender?: string;
    phone?: string;
    email?: string;
    birthdate?: string;
    hasCompleteSajuProfile: boolean;
    isFavorite: boolean;
    lastVisitDate?: string;
    elementAttribute?: string;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  counts: {
    all: number;
    no_birthday: number;
    recent_visit: number;
    favorite: number;
  };
}

// クライアント詳細レスポンス
export interface ClientDetailResponse {
  client: IClient;
  stylistCompatibility?: {  // 現在のスタイリストとの相性
    stylistId: string;
    stylistName: string;
    overallScore: number;
  }[];
  recentVisits?: {  // 最近の来店履歴
    date: string;
    stylistName: string;
    treatmentTypes: string[];
  }[];
}

// クライアント作成リクエスト
export interface CreateClientRequest {
  name: string;               // 氏名（必須）
  nameReading?: string;       // 読み仮名
  gender?: string;            // 性別
  birthdate?: string;         // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  phone?: string;             // 電話番号
  email?: string;             // メールアドレス
  address?: string;           // 住所
  memo?: string;              // メモ・備考
  customFields?: Record<string, any>; // カスタムフィールド
  isFavorite?: boolean;       // お気に入り登録
}

// クライアント更新リクエスト
export interface UpdateClientRequest {
  name?: string;              // 氏名
  nameReading?: string;       // 読み仮名
  gender?: string;            // 性別
  birthdate?: string;         // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  phone?: string;             // 電話番号
  email?: string;             // メールアドレス
  address?: string;           // 住所
  memo?: string;              // メモ・備考
  customFields?: Record<string, any>; // カスタムフィールド
  isFavorite?: boolean;       // お気に入り登録
}

// クライアント四柱推命情報更新リクエスト
export interface UpdateClientSajuRequest {
  birthdate: string;          // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  gender: string;             // 性別
  birthplaceCoordinates?: {   // 出生地座標
    longitude: number;
    latitude: number;
  };
  timeZone?: string;          // タイムゾーン
}

// クライアントメモ作成リクエスト
export interface CreateClientNoteRequest {
  content: string;            // メモ内容
  noteType: ClientNoteType;   // メモタイプ
  isPrivate?: boolean;        // プライベートメモか
}

// クライアントチャット送信リクエスト
export interface SendClientChatRequest {
  message: string;            // メッセージ内容
  includeContext?: boolean;   // クライアント情報をコンテキストに含めるか
}

// クライアントデータインポートリクエスト
export interface ImportClientsRequest {
  source: 'hotpepper' | 'salonanswer' | 'csv';  // データソース
  apiKey?: string;            // 外部APIキー（ホットペッパー等の場合）
  fileContent?: string;       // CSVファイルのBase64エンコード文字列
  mapping?: {                 // CSVカラムマッピング
    [key: string]: string;    // フィールド名: CSVカラム名
  };
  options?: {
    updateExisting: boolean;  // 既存データを更新するか
    importNotes: boolean;     // メモもインポートするか
  };
}

// クライアントデータエクスポートリクエスト
export interface ExportClientsRequest {
  format: 'csv' | 'json';     // エクスポート形式
  filter?: string;            // フィルター条件
  fields?: string[];          // エクスポートするフィールド
  includeNotes?: boolean;     // メモも含めるか
}

// ========== 本日の施術クライアント一覧関連 ==========

// 本日の予約一覧取得クエリパラメータ
export interface DailyAppointmentsRequest {
  date?: string;              // 日付 (YYYY-MM-DD形式、省略時は本日)
  sortBy?: 'time' | 'name';   // ソート基準
  timeSlot?: 'morning' | 'afternoon' | 'evening' | 'all';  // 時間帯フィルター
}

// 時間帯
export enum TimeSlot {
  MORNING = 'morning',       // 午前 (00:00-12:00)
  AFTERNOON = 'afternoon',   // 午後 (12:00-17:00)
  EVENING = 'evening'        // 夕方以降 (17:00-24:00)
}

// 施術タイプ
export enum TreatmentType {
  CUT = 'cut',               // カット
  COLOR = 'color',           // カラー
  PERM = 'perm',             // パーマ
  STRAIGHT = 'straight',     // 縮毛矯正
  TREATMENT = 'treatment',   // トリートメント
  SPA = 'spa',               // ヘッドスパ
  STYLING = 'styling',       // スタイリング
  EXTENSION = 'extension',   // エクステンション
  OTHER = 'other'            // その他
}

// アポイントメント（予約）
export interface IAppointment {
  id: string;                 // 予約ID
  clientId: string;           // クライアントID
  date: string;               // 日付 (YYYY-MM-DD形式)
  time: string;               // 時間 (HH:MM形式)
  endTime: string;            // 終了時間 (HH:MM形式)
  stylistId: string;          // 担当スタイリストID
  treatmentTypes: TreatmentType[]; // 施術タイプ
  notes?: string;             // 備考
  status: 'confirmed' | 'canceled' | 'completed' | 'noshow'; // ステータス
  timeSlot: TimeSlot;         // 時間帯区分
}

// クライアント詳細情報（四柱推命データ含む）
export interface ClientDetailsResponse {
  client: IClient;            // クライアント基本情報
  compatibility?: {           // スタイリストとの相性
    overallScore: number;     // 総合相性スコア（0-100）
    elementRelation: string;  // 五行関係
    advice: string;           // 相性アドバイス
  };
  appointments: {             // 過去の来店履歴（直近5件）
    id: string;
    date: string;
    treatmentTypes: TreatmentType[];
    stylistName: string;
  }[];
  notes: {                    // メモ履歴（直近5件）
    id: string;
    content: string;
    createdAt: string;
    authorName: string;
    noteType: ClientNoteType;
  }[];
  suggestions: {              // AI提案
    hairStyle: string;        // ヘアスタイル提案
    color: string;            // カラー提案
    careAdvice: string;       // ケアアドバイス
    conversationTopics: string[]; // 会話トピック
    generatedAt: string;      // 生成日時
  };
}

// メモ追加リクエスト
export interface AddClientMemoRequest {
  content: string;            // メモ内容
  noteType: ClientNoteType;   // メモタイプ
  isPrivate?: boolean;        // プライベートメモかどうか
}

// 四柱推命登録リクエスト
export interface RegisterClientSajuRequest {
  birthdate: string;          // 生年月日（YYYY-MM-DD形式）
  birthtime?: string;         // 生まれた時間（HH:MM形式）
  birthPlace?: string;        // 出生地
  gender: Gender;             // 性別
  timeZone?: string;          // タイムゾーン
}

// AI提案更新レスポンス
export interface RefreshAiSuggestionsResponse {
  success: boolean;
  suggestions: {
    hairStyle: string;
    color: string;
    careAdvice: string;
    conversationTopics: string[];
    generatedAt: string;
  };
}

// 本日の予約一覧レスポンス
export interface DailyAppointmentsResponse {
  date: string;               // 対象日
  timeSlots: {
    [key in TimeSlot]: {
      appointments: {
        id: string;
        time: string;
        endTime: string;
        client: {
          id: string;
          name: string;
          nameReading?: string;
          phone?: string;
          hasCompleteSajuProfile: boolean;
          elementAttribute?: Element;
        };
        treatmentTypes: TreatmentType[];
        compatibilityScore?: number;
        conversationSuggestion?: string;
      }[];
    };
  };
}

// ========== SuperAdmin組織管理関連 ==========

// 組織ステータス
export enum OrganizationStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

// 組織
export interface Organization {
  _id: string;
  name: string;
  address?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
  plan?: {
    _id: string;
    name: string;
  };
  userCount: number;
  clientCount: number;
  status: OrganizationStatus;
  subscription?: {
    status: string;
    startDate: string;
    currentPeriodEnd: string;
    trialEndsAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// 組織一覧レスポンス
export interface OrganizationListResponse {
  organizations: Organization[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// 組織詳細レスポンス
export interface OrganizationDetailResponse extends Organization {
  adminUsers: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
  statistics: {
    userCount: number;
    clientCount: number;
    activeUserCount: number;
  };
}

// 組織作成リクエスト
export interface CreateOrganizationRequest {
  name: string;
  address?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  initialOwner: {
    name: string;
    email: string;
    password: string;
  };
  plan: string;
  trialDays?: number;
}

// 組織ステータス更新リクエスト
export interface UpdateOrganizationStatusRequest {
  status: OrganizationStatus;
  reason?: string;
  notifyOwner?: boolean;
}

// トライアル延長リクエスト
export interface ExtendTrialRequest {
  days: number;
  reason?: string;
  notifyOwner?: boolean;
}

// 一括ステータス更新リクエスト
export interface BatchUpdateStatusRequest {
  organizationIds: string[];
  status: 'active' | 'suspended';
  reason?: string;
  notifyOwners?: boolean;
}

// 一括トライアル延長リクエスト
export interface BatchExtendTrialRequest {
  organizationIds: string[];
  days: number;
  reason?: string;
  notifyOwners?: boolean;
}