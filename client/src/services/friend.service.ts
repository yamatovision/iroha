import apiService from './api.service';
import { FRIENDS, INVITATION } from '../../../shared/index';

/**
 * 友達機能サービス
 * 友達関係管理に関連するAPIとの通信を担当
 */
class FriendService {
  /**
   * 友達一覧を取得する
   * @param forceRefresh キャッシュをバイパスするかどうか
   * @returns 友達一覧
   */
  async getFriends(forceRefresh = false) {
    try {
      // キャッシュオプションを設定
      const cacheOptions = forceRefresh ? { forceRefresh: true } : undefined;
      
      const response = await apiService.get(FRIENDS.GET_ALL, undefined, cacheOptions);
      console.log('友達一覧取得レスポンス:', response.data);
      
      // APIのレスポンス構造を確認して適切にマッピング
      // response.dataに直接データがある場合とdata.friendsにある場合の両方に対応
      if (response.data.data) {
        return response.data.data;
      } else if (response.data.friends) {
        return response.data.friends;
      } else {
        console.log('友達データのレスポンス構造:', response.data);
        return response.data || [];
      }
    } catch (error) {
      console.error('友達一覧の取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 受信した友達リクエスト一覧を取得する
   * @param forceRefresh キャッシュをバイパスするかどうか
   * @returns 友達リクエスト一覧
   */
  async getFriendRequests(forceRefresh = false) {
    try {
      // キャッシュオプションを設定
      const cacheOptions = forceRefresh ? { forceRefresh: true } : undefined;
      
      const response = await apiService.get(FRIENDS.GET_REQUESTS, undefined, cacheOptions);
      console.log('友達リクエスト取得レスポンス(生):', response);
      console.log('キャッシュバイパス設定:', forceRefresh);
      
      // レスポンス構造を詳細に確認
      let result;
      if (response.data.data) {
        console.log('data.dataプロパティを使用');
        result = response.data.data;
      } else if (response.data.requests) {
        console.log('data.requestsプロパティを使用');
        result = response.data.requests;
      } else {
        console.log('レスポンス構造が予期しない形式:', response.data);
        result = response.data || [];
      }
      
      console.log('処理後の友達リクエスト:', result);
      console.log('リクエスト件数:', result.length);
      
      return result;
    } catch (error) {
      console.error('友達リクエスト一覧の取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 送信済みの友達リクエスト一覧を取得する
   * @returns 送信済み友達リクエスト一覧
   */
  async getSentRequests() {
    try {
      const response = await apiService.get(FRIENDS.GET_SENT_REQUESTS);
      // APIのレスポンス構造を詳細にログ出力
      console.log('送信済みリクエストのAPIレスポンス:', response.data);
      
      let result = [];
      
      if (response.data.data) {
        result = response.data.data;
      } else if (response.data.requests) {
        result = response.data.requests;
      } else {
        result = response.data || [];
      }
      
      // 返却データの内容を確認
      console.log('処理後の送信済みリクエスト:', result);
      console.log('送信済みリクエスト数:', result.length);
      
      return result;
    } catch (error) {
      console.error('送信済みリクエスト一覧の取得に失敗しました:', error);
      // エラー発生時は空配列を返し、UIの動作を継続させる
      return [];
    }
  }

  /**
   * ユーザーの友達関係状態を確認する
   * @param userId 確認するユーザーID
   * @returns 友達状態 'none'(未申請), 'pending'(申請中), 'friend'(友達)
   */
  async checkFriendshipStatus(userId: string) {
    try {
      // 送信済みリクエスト一覧を取得
      const sentRequests = await this.getSentRequests();
      
      // 友達一覧を取得
      const friends = await this.getFriends();
      
      // 既に友達かどうかチェック
      const isFriend = friends.some((friend: any) => 
        (friend.userId === userId || friend._id === userId || friend.id === userId)
      );
      
      if (isFriend) {
        return 'friend';
      }
      
      // 既に申請済みかどうかチェック
      const isPending = sentRequests.some((request: any) => 
        (request.userId2 && (request.userId2._id === userId || request.userId2.id === userId)) ||
        (request.userId2 === userId)
      );
      
      if (isPending) {
        return 'pending';
      }
      
      return 'none';
    } catch (error) {
      console.error('友達関係状態の確認に失敗しました:', error);
      return 'none'; // エラー時はデフォルトで未申請状態を返す
    }
  }

  /**
   * ユーザーを検索する
   * @param query 検索クエリ（名前またはメールアドレス）
   * @returns 検索結果
   */
  async searchUsers(query: string) {
    try {
      const response = await apiService.get(`${FRIENDS.SEARCH}?q=${encodeURIComponent(query)}`);
      // APIのレスポンス構造を確認して適切にマッピング
      let result;
      
      if (response.data.data) {
        result = response.data.data;
      } else if (response.data.users) {
        result = response.data.users;
      } else {
        result = response.data || [];
      }
      
      // ユーザーオブジェクトの構造をコンソールに出力して確認
      console.log('ユーザー検索の結果構造:', result);
      
      // 友達一覧と送信済みリクエスト一覧を取得
      const friends = await this.getFriends();
      const sentRequests = await this.getSentRequests();
      
      console.log('既存の友達:', friends);
      console.log('送信済みリクエスト:', sentRequests);
      
      // _idをidとしてマッピングし、友達状態を追加
      return Promise.all(result.map(async (user: any) => {
        // ユニークなIDが必ず存在することを確認
        const uniqueId = user.id || user._id || `user_${Math.random().toString(36).substring(2, 10)}`;
        
        // 友達状態を確認
        let friendshipStatus = 'none';
        
        // 既に友達かどうかチェック
        const isFriend = friends.some((friend: any) => 
          (friend.userId === uniqueId || friend._id === uniqueId) ||
          (friend.userId1 && (friend.userId1._id === uniqueId || friend.userId1.id === uniqueId)) ||
          (friend.userId2 && (friend.userId2._id === uniqueId || friend.userId2.id === uniqueId))
        );
        
        if (isFriend) {
          friendshipStatus = 'friend';
        } else {
          // 既に申請済みかどうかチェック
          const isPending = sentRequests.some((request: any) => 
            (request.userId2 && (request.userId2._id === uniqueId || request.userId2.id === uniqueId)) ||
            (request.userId2 === uniqueId)
          );
          
          if (isPending) {
            friendshipStatus = 'pending';
          }
        }
        
        return {
          ...user,
          id: uniqueId, // 必ずidプロパティを持つようにする
          _id: user._id || uniqueId, // _idが存在しない場合は一意の値を設定
          friendshipStatus // 友達状態を追加
        };
      }));
    } catch (error) {
      console.error('ユーザー検索に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 友達申請を送信する
   * @param userId 申請を送る相手のユーザーID
   * @returns 申請結果
   */
  async sendFriendRequest(userId: string) {
    try {
      if (!userId) {
        throw new Error('友達申請を送信するにはユーザーIDが必要です');
      }
      
      // デバッグ用にリクエスト情報をログ出力
      console.log('友達申請送信リクエスト:', { targetUserId: userId });
      
      const response = await apiService.post(FRIENDS.SEND_REQUEST, { targetUserId: userId });
      
      console.log('友達申請送信レスポンス:', response.data);
      
      // 成功時に送信済みリクエスト一覧も更新
      await this.getSentRequests();
      
      return response.data;
    } catch (error: any) {
      console.error('友達申請の送信に失敗しました:', error);
      
      // エラーメッセージを取得（Axiosエラーからサーバーのエラーメッセージを抽出）
      let errorMessage = '友達申請の送信に失敗しました';
      
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      // 「既に友達申請を送信済みです」というエラーの場合は特別処理
      if (errorMessage.includes('既に友達申請を送信済み')) {
        // 強制的に送信済みリクエスト一覧を更新する
        await this.getSentRequests();
        
        // 親切なエラーメッセージを設定
        const customError = new Error('この相手には既に友達申請を送信済みです');
        customError.name = 'AlreadySentRequest';
        throw customError;
      }
      
      throw error;
    }
  }

  /**
   * 友達申請を承認する
   * @param requestId 友達申請ID
   * @returns 承認結果
   */
  async acceptFriendRequest(requestId: string) {
    try {
      const response = await apiService.post(FRIENDS.ACCEPT_REQUEST(requestId));
      return response.data;
    } catch (error) {
      console.error('友達申請の承認に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 友達申請を拒否する
   * @param requestId 友達申請ID
   * @returns 拒否結果
   */
  async rejectFriendRequest(requestId: string) {
    try {
      const response = await apiService.post(FRIENDS.REJECT_REQUEST(requestId));
      return response.data;
    } catch (error) {
      console.error('友達申請の拒否に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 友達関係を削除する
   * @param friendshipId 友達関係ID
   * @returns 削除結果
   */
  async removeFriend(friendshipId: string) {
    try {
      const response = await apiService.delete(FRIENDS.REMOVE(friendshipId));
      return response.data;
    } catch (error) {
      console.error('友達の削除に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 基本的な相性スコアを取得する（レガシー機能）
   * @param friendId 友達のユーザーID
   * @returns 基本的な相性スコアデータ
   * @deprecated 拡張相性診断機能が推奨されます
   */
  async getCompatibilityScore(friendId: string) {
    try {
      const response = await apiService.get(FRIENDS.COMPATIBILITY(friendId));
      return response.data;
    } catch (error) {
      console.error('相性スコアの取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 拡張相性診断を取得する（aisyouyouken.mdの詳細アルゴリズムを使用）
   * @param friendId 友達のユーザーID
   * @param forceRefresh キャッシュをバイパスするかどうか
   * @returns 拡張相性診断データ
   */
  async getEnhancedCompatibility(friendId: string, forceRefresh: boolean = false) {
    try {
      console.log('拡張相性診断を取得しています...');
      // キャッシュオプションを設定
      const cacheOptions = forceRefresh ? { forceRefresh: true } : undefined;
      
      const response = await apiService.get(FRIENDS.ENHANCED_COMPATIBILITY(friendId), undefined, cacheOptions);
      console.log('拡張相性診断レスポンス:', response.data);
      return response.data;
    } catch (error) {
      console.error('拡張相性診断の取得に失敗しました:', error);
      // エラー時は基本相性診断にフォールバック
      try {
        console.log('基本相性診断にフォールバックします...');
        return await this.getCompatibilityScore(friendId);
      } catch (fallbackError) {
        console.error('フォールバック処理にも失敗しました:', fallbackError);
        throw error; // 元のエラーをスロー
      }
    }
  }

  /**
   * 友達招待リンクを作成する
   * @param email 招待先メールアドレス (必須)
   * @returns 招待リンク情報
   */
  async createFriendInvitation(email: string) {
    try {
      if (!email) {
        throw new Error('メールアドレスは必須です');
      }

      console.log('友達招待リンクを作成しています...');
      
      const payload = { email };
      
      const response = await apiService.post(INVITATION.CREATE_FRIEND, payload);
      console.log('招待リンク作成レスポンス:', response.data);
      
      if (response.data && response.data.data && response.data.data.invitationCode) {
        // フルURLを構築して返す
        const invitationCode = response.data.data.invitationCode;
        const baseUrl = window.location.origin;  // 例: https://example.com
        return {
          code: invitationCode,
          url: `${baseUrl}/invitation/${invitationCode}`,
          existingUser: response.data.data.existingUser || false
        };
      }
      
      throw new Error('招待リンクの作成に失敗しました: 無効なレスポンス形式');
    } catch (error) {
      console.error('友達招待リンクの作成に失敗しました:', error);
      throw error;
    }
  }
}

export default new FriendService();