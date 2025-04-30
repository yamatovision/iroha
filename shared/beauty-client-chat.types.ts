// 美容クライアント専用チャット 型定義

// 美容クライアントチャット API パス (共有ファイルからエクスポート)
export const BEAUTY_CLIENT_CHAT = {
  // チャット履歴の取得
  GET_HISTORY: '/api/v1/beauty/client-chat/history',
  
  // メッセージの送信
  SEND_MESSAGE: '/api/v1/beauty/client-chat/message',
  
  // ストリーミングメッセージの送信
  STREAM_MESSAGE: '/api/v1/beauty/client-chat/stream-message',
  
  // クライアントノートの追加
  ADD_NOTE: '/api/v1/beauty/client/notes',
  
  // クライアントプロフィールの取得
  GET_PROFILE: '/api/v1/beauty/client/profile',
};

// チャットメッセージの役割
export enum BeautyClientChatRole {
  USER = 'user',           // スタイリストからのメッセージ
  ASSISTANT = 'assistant'  // AIアシスタントからのメッセージ
}

// チャットメッセージ
export interface BeautyClientChatMessage {
  role: BeautyClientChatRole;
  content: string;
  timestamp: string;
  senderId?: string;      // ユーザーメッセージの場合のみ
  senderName?: string;    // 表示用
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// サジュプロファイル (四柱推命データ)
export interface SajuProfileData {
  fourPillars: {
    yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
    monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
    dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
    hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
  };
  kakukyoku?: {
    type: string;
    category: string;
    strength: string;
    description: string;
  };
  yojin?: {
    tenGod: string;
    element: string;
    description: string;
    supportElements: string[];
  };
  elementProfile: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
    mainElement: string;
    secondaryElement?: string;
  };
}

// 日柱データ
export interface DayPillarData {
  date: string;
  heavenlyStem: string;
  earthlyBranch: string;
  hiddenStems: string[];
  energyDescription: string;
}

// クライアントプロフィール
export interface ClientProfileData {
  name: string;
  gender: 'M' | 'F';
  birthdate: string;
  birthtime?: string;
  notes?: string[];
  visitHistory?: Array<{
    date: string;
    service: string;
    stylist: string;
    notes?: string;
  }>;
}

// チャット履歴リクエスト
export interface BeautyClientChatHistoryRequest {
  clientId: string;     // クライアントID
  limit?: number;       // 取得するメッセージ数（デフォルト：10）
  offset?: number;      // 取得開始位置（ページネーション用）
}

// チャット履歴レスポンス
export interface BeautyClientChatHistoryResponse {
  success: boolean;
  clientChatHistory: {
    id: string;         // チャットセッションID
    clientId: string;   // クライアントID
    clientName: string; // クライアント名
    messages: BeautyClientChatMessage[];
    createdAt: string;
    lastMessageAt: string;
  };
  contextData: {
    sajuProfile: SajuProfileData;
    todayDayPillar: DayPillarData;
    clientProfile: ClientProfileData;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// メッセージ送信リクエスト
export interface BeautyClientChatSendRequest {
  clientId: string;     // クライアントID
  message: string;      // 送信メッセージ内容
  additionalContext?: {
    visitPurpose?: string;      // 来店目的（カット、カラー、パーマなど）
    clientConcerns?: string[];  // クライアントの悩み・要望
    seasonalEvent?: string;     // 季節イベント（旅行、結婚式など）
    hairCondition?: string;     // 現在の髪の状態
  };
}

// メッセージ送信レスポンス
export interface BeautyClientChatSendResponse {
  success: boolean;
  aiMessage: string;    // AI応答メッセージ
  timestamp: string;    // タイムスタンプ
  chatHistory: {
    id: string;
    messages: BeautyClientChatMessage[];
  };
  tokenUsage?: {
    prompt: number;     // プロンプトトークン数
    completion: number; // 完了トークン数
    total: number;      // 合計トークン数
  };
}

// ストリーミングチャンク形式
export interface BeautyClientChatStreamChunk {
  event: 'start' | 'chunk' | 'end' | 'error';
  sessionId?: string;   // start時に返されるセッションID
  text?: string;        // チャンク時に返される部分テキスト
  error?: string;       // エラー時に返されるエラーメッセージ
  tokenUsage?: {        // end時に返されるトークン使用量
    prompt: number;
    completion: number;
    total: number;
  };
}

// クライアントノート追加リクエスト
export interface AddClientNoteRequest {
  clientId: string;     // クライアントID
  note: string;         // メモ内容
  serviceType?: string; // サービスタイプ（カット、カラー等）
  timestamp?: string;   // タイムスタンプ（指定なしの場合は現在時刻）
}

// クライアントノート追加レスポンス
export interface AddClientNoteResponse {
  success: boolean;
  clientNote: {
    id: string;
    clientId: string;
    note: string;
    serviceType?: string;
    createdBy: string;  // 作成者ID
    createdByName: string; // 作成者名
    createdAt: string;
  };
}

// クライアントプロフィール取得レスポンス
export interface GetClientProfileResponse {
  success: boolean;
  clientProfile: {
    id: string;
    name: string;
    gender: 'M' | 'F';
    birthdate: string;
    birthtime?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    sajuProfile?: SajuProfileData;
    visitHistory: Array<{
      id: string;
      date: string;
      serviceType: string;
      stylistId: string;
      stylistName: string;
      notes?: string;
    }>;
    notes: Array<{
      id: string;
      content: string;
      createdAt: string;
      createdBy: string;
      createdByName: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}