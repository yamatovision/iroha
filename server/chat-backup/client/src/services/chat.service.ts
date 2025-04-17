import { CHAT } from '../../../shared';
import { ChatMode } from '../../../shared';
import api from './api.service';

/**
 * チャットサービス
 * AIチャット機能に関連するAPIとのインタラクションを提供
 */
export class ChatService {
  /**
   * メッセージを送信してAIレスポンスを取得
   */
  async sendMessage(
    message: string,
    mode: ChatMode = ChatMode.PERSONAL,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    aiMessage: string;
    timestamp: string;
    chatHistory: {
      id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    };
  }> {
    try {
      const response = await api.post(CHAT.SEND_MESSAGE, {
        message,
        mode,
        contextInfo
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'メッセージの送信に失敗しました');
      }

      return {
        aiMessage: response.data.response.message,
        timestamp: response.data.response.timestamp,
        chatHistory: response.data.chatHistory
      };
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャットサービスエラー');
    }
  }

  /**
   * チャット履歴を取得
   */
  async getHistory(
    options: {
      mode?: ChatMode;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    chatHistories: Array<{
      id: string;
      chatType: ChatMode;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
      createdAt: string;
      lastMessageAt: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const { mode, limit, offset } = options;
      const queryParams = new URLSearchParams();

      if (mode) queryParams.append('mode', mode);
      if (limit) queryParams.append('limit', limit.toString());
      if (offset) queryParams.append('offset', offset.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `${CHAT.GET_HISTORY}?${queryString}` : CHAT.GET_HISTORY;

      const response = await api.get(url);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'チャット履歴の取得に失敗しました');
      }

      return {
        chatHistories: response.data.chatHistories,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('Get chat history error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャット履歴の取得に失敗しました');
    }
  }

  /**
   * チャット履歴をクリア
   */
  async clearHistory(
    options: {
      mode?: ChatMode;
      chatId?: string;
    } = {}
  ): Promise<{
    message: string;
    deletedCount: number;
  }> {
    try {
      const { mode, chatId } = options;
      const queryParams = new URLSearchParams();

      if (mode) queryParams.append('mode', mode);
      if (chatId) queryParams.append('chatId', chatId);

      const queryString = queryParams.toString();
      const url = queryString ? `${CHAT.CLEAR_HISTORY}?${queryString}` : CHAT.CLEAR_HISTORY;

      const response = await api.delete(url);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'チャット履歴のクリアに失敗しました');
      }

      return {
        message: response.data.message,
        deletedCount: response.data.deletedCount
      };
    } catch (error: any) {
      console.error('Clear chat history error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャット履歴のクリアに失敗しました');
    }
  }

  /**
   * チャットモードを変更
   */
  async setMode(
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    mode: ChatMode;
    welcomeMessage: string;
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    };
    chatHistory: {
      id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    };
  }> {
    try {
      const response = await api.put(CHAT.SET_CHAT_MODE, {
        mode,
        contextInfo
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'モードの変更に失敗しました');
      }

      return {
        mode: response.data.mode,
        welcomeMessage: response.data.welcomeMessage,
        contextInfo: response.data.contextInfo,
        chatHistory: response.data.chatHistory
      };
    } catch (error: any) {
      console.error('Set chat mode error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'チャットモードの設定に失敗しました');
    }
  }
}

// シングルトンインスタンスをエクスポート
export const chatService = new ChatService();