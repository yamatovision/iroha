/**
 * テスト用のコンテキストタイプ定義
 * 
 * プロジェクト内で使用するコンテキストタイプを直接定義する。
 * バンドル問題を回避するため、直接値を持つオブジェクトとして定義。
 */

// コンテキストタイプの列挙型定義
export const ContextType = {
  SELF: 'self',
  FRIEND: 'friend',
  FORTUNE: 'fortune',
  TEAM: 'team',
  TEAM_GOAL: 'team_goal'
};

// コンテキストタイプの文字列型（TypeScript型定義用）
export type ContextTypeString = 'self' | 'friend' | 'fortune' | 'team' | 'team_goal';

// チャットモードの列挙型定義（後方互換性のため）
export const ChatMode = {
  PERSONAL: 'personal',
  TEAM_MEMBER: 'team_member',
  TEAM_GOAL: 'team_goal'
};

// APIエンドポイント定義
export const CHAT_API_ENDPOINTS = {
  AVAILABLE_CONTEXTS: '/api/v1/chat/contexts/available',
  CONTEXT_DETAIL: '/api/v1/chat/contexts/detail',
  SEND_MESSAGE: '/api/v1/chat/message',
  CHAT_HISTORY: '/api/v1/chat/history'
};