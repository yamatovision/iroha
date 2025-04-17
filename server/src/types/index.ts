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
  GET_TEAM_MEMBERS: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members`,
  ADD_TEAM_MEMBER: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members`,
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
  SET_CHAT_MODE: `${API_BASE_PATH}/chat/mode`,
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

// チャットモード
export enum ChatMode {
  PERSONAL = 'personal',
  TEAM_MEMBER = 'team_member',
  TEAM_GOAL = 'team_goal',
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

// チャットデータ
export interface IChat {
  id: string;
  userId: string;
  mode: ChatMode;
  relatedUserId?: string; // チームメイトモード時の対象ユーザーID
  messages: IChatMessage[];
  contextData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// チャットメッセージ
export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// システム設定
export interface ISystemSetting {
  key: string;
  value: string;
  description: string;
  updatedAt: Date;
  updatedBy: string;
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

// チャットメッセージ送信リクエスト
export interface ChatMessageRequest {
  message: string;
  mode: ChatMode;
  relatedUserId?: string; // チームメイトモード時の対象ユーザーID
  contextInfo?: Record<string, any>; // 追加コンテキスト情報
}

// チャットモード設定リクエスト
export interface ChatModeRequest {
  mode: ChatMode;
  relatedUserId?: string;
  contextInfo?: Record<string, any>; // 追加コンテキスト情報
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