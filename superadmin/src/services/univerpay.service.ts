import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL, UNIVERPAY_TEST_MODE } from '../config/constants';

// Univerpay連携サービス型定義
export interface UniverpayCredentials {
  apiToken: string;
  secret: string;
  storeId: string;
}

// トランザクショントークン作成パラメータ
export interface TokenParams {
  payment_type: 'card';
  type: 'one_time' | 'subscription' | 'recurring';
  email: string;
  data: {
    cardholder: string;
    card_number: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
    phone_number?: {
      country_code: string;
      local_number: string;
    };
    three_ds?: {
      enabled: boolean;
      redirect_endpoint?: string;
    };
  };
}

// サブスクリプション作成パラメータ
export interface SubscriptionParams {
  amount: number;
  currency: string;
  period: 'month' | 'year' | 'week' | 'day';
  initial_amount?: number;
  start_date?: string;
  metadata?: Record<string, string>;
}

// サブスクリプション更新パラメータ
export interface SubscriptionUpdateParams {
  amount?: number;
  period?: 'month' | 'year' | 'week' | 'day';
  metadata?: Record<string, string>;
  status?: 'active' | 'suspended' | 'canceled';
}

// 支払いステータス型定義
export type PaymentStatus = 
  | 'pending' 
  | 'authorized' 
  | 'completed' 
  | 'failed' 
  | 'canceled' 
  | 'refunded' 
  | 'partially_refunded';

// 課金データパラメータ
export interface ChargeParams {
  amount: number;
  currency: string;
  capture: boolean;
  descriptor?: string;
  metadata?: Record<string, string>;
}

// 支払い履歴フィルタパラメータ
export interface PaymentHistoryParams {
  from_date?: string;
  to_date?: string;
  status?: PaymentStatus[];
  limit?: number;
  offset?: number;
}

// Univerpayエラータイプ
export interface UniverpayError {
  code: string;
  status: number;
  message: string;
  data?: any;
}

/**
 * Univerpay決済サービスとの連携を管理するサービス
 */
export class UniverpayService {
  private apiBaseUrl: string;
  private credentials: UniverpayCredentials | null = null;
  private isTestMode: boolean = UNIVERPAY_TEST_MODE;

  constructor() {
    this.apiBaseUrl = 'https://api.univapay.com';
  }
  
  /**
   * 認証情報の設定
   */
  setCredentials(credentials: UniverpayCredentials, testMode: boolean = UNIVERPAY_TEST_MODE) {
    this.credentials = credentials;
    this.isTestMode = testMode;
  }

  /**
   * 認証ヘッダーを生成
   */
  private getAuthHeaders() {
    if (!this.credentials) {
      throw new Error('Univerpay認証情報が設定されていません');
    }

    return {
      'Authorization': `Bearer ${this.credentials.secret}.${this.credentials.apiToken}`,
      'Content-type': 'application/json'
    };
  }

  /**
   * ストアIDを取得
   */
  private getStoreId(): string {
    if (!this.credentials) {
      throw new Error('Univerpay認証情報が設定されていません');
    }
    return this.credentials.storeId;
  }

  /**
   * トランザクショントークンの作成
   * カード情報を受け取り、Univerpayトークンを生成します
   * @param params トークン作成パラメータ
   */
  async createTransactionToken(params: TokenParams) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/tokens`,
        params,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('トランザクショントークン生成エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * トランザクショントークン情報を取得
   * @param tokenId トランザクショントークンID
   */
  async getTransactionToken(tokenId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/tokens/${tokenId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('トランザクショントークン取得エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * トランザクショントークンを更新
   * @param tokenId トランザクショントークンID
   * @param updateData 更新データ
   */
  async updateTransactionToken(tokenId: string, updateData: any) {
    try {
      const response = await axios.patch(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/tokens/${tokenId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('トランザクショントークン更新エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * トランザクショントークンを削除
   * @param tokenId トランザクショントークンID
   */
  async deleteTransactionToken(tokenId: string) {
    try {
      await axios.delete(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/tokens/${tokenId}`,
        { headers: this.getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('トランザクショントークン削除エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 単発課金を作成
   * @param tokenId トランザクショントークンID
   * @param chargeData 課金データ
   */
  async createCharge(tokenId: string, chargeData: ChargeParams) {
    try {
      const data = {
        transaction_token_id: tokenId,
        ...chargeData
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/charges`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('課金作成エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 課金状態を取得
   * @param chargeId 課金ID
   */
  async getCharge(chargeId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/charges/${chargeId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('課金状態取得エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 課金のキャンセル
   * @param chargeId 課金ID
   */
  async cancelCharge(chargeId: string) {
    try {
      const response = await axios.delete(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/charges/${chargeId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('課金キャンセルエラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 課金の返金
   * @param chargeId 課金ID
   * @param amount 返金額（指定しない場合は全額返金）
   * @param reason 返金理由
   */
  async refundCharge(chargeId: string, amount?: number, reason?: string) {
    try {
      const data: any = {};
      if (amount) data.amount = amount;
      if (reason) data.reason = reason;

      const response = await axios.post(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/charges/${chargeId}/refund`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('課金返金エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * サブスクリプション（定期課金）を作成
   * @param tokenId トランザクショントークンID
   * @param subscriptionData サブスクリプションデータ
   */
  async createSubscription(tokenId: string, subscriptionData: SubscriptionParams) {
    try {
      const data = {
        transaction_token_id: tokenId,
        ...subscriptionData
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/subscriptions`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('サブスクリプション作成エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * サブスクリプション情報を取得
   * @param subscriptionId サブスクリプションID
   */
  async getSubscription(subscriptionId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/subscriptions/${subscriptionId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('サブスクリプション取得エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * サブスクリプションを更新
   * @param subscriptionId サブスクリプションID
   * @param updateData 更新データ
   */
  async updateSubscription(subscriptionId: string, updateData: SubscriptionUpdateParams) {
    try {
      const response = await axios.patch(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/subscriptions/${subscriptionId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('サブスクリプション更新エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * サブスクリプションを一時停止
   * @param subscriptionId サブスクリプションID
   */
  async suspendSubscription(subscriptionId: string) {
    return this.updateSubscription(subscriptionId, { status: 'suspended' });
  }

  /**
   * サブスクリプションを再開
   * @param subscriptionId サブスクリプションID
   */
  async resumeSubscription(subscriptionId: string) {
    return this.updateSubscription(subscriptionId, { status: 'active' });
  }

  /**
   * サブスクリプションをキャンセル
   * @param subscriptionId サブスクリプションID
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      const response = await axios.delete(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/subscriptions/${subscriptionId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('サブスクリプションキャンセルエラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * サブスクリプションの支払い履歴を取得
   * @param subscriptionId サブスクリプションID
   */
  async getSubscriptionCharges(subscriptionId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/subscriptions/${subscriptionId}/charges`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('サブスクリプション支払い履歴取得エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 支払い履歴一覧を取得
   * @param params フィルタパラメータ
   */
  async getPaymentHistory(params?: PaymentHistoryParams) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/charges`,
        { 
          headers: this.getAuthHeaders(),
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error('支払い履歴取得エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 支払い状態を確認
   * @param paymentId 支払いID（課金IDまたはサブスクリプションID）
   * @param paymentType 支払いタイプ ('charge' または 'subscription')
   */
  async checkPaymentStatus(paymentId: string, paymentType: 'charge' | 'subscription' = 'charge') {
    try {
      if (paymentType === 'charge') {
        return await this.getCharge(paymentId);
      } else {
        return await this.getSubscription(paymentId);
      }
    } catch (error) {
      console.error('支払い状態確認エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * 3Dセキュア認証用のイシュアトークンを取得
   * @param tokenId トランザクショントークンID
   */
  async getIssuerToken(tokenId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/stores/${this.getStoreId()}/tokens/${tokenId}/three_ds/issuer_token`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('イシュアトークン取得エラー:', error);
      throw this.handleUniverpayError(error);
    }
  }

  /**
   * Webhook署名の検証
   * @param payload Webhookペイロード
   * @param signature 署名
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.credentials) {
      throw new Error('Univerpay認証情報が設定されていません');
    }
    
    // 実際の実装では、HMACなどを使用して署名を検証
    // これはダミー実装で、実際の環境では適切な署名検証アルゴリズムを実装する必要がある
    return true;
  }

  /**
   * Univerpayエラーのハンドリング
   * @param error エラーオブジェクト
   */
  private handleUniverpayError(error: any): Error {
    const univerpayError: UniverpayError = {
      code: 'unknown_error',
      status: 500,
      message: '決済処理中に予期せぬエラーが発生しました'
    };

    if (error.response) {
      // APIからのエラーレスポンス
      const response: AxiosResponse = error.response;
      univerpayError.status = response.status;
      
      if (response.data) {
        univerpayError.code = response.data.code || 'api_error';
        univerpayError.message = response.data.message || '決済処理中にエラーが発生しました';
        univerpayError.data = response.data;
      }
      
      // エラーコードに応じてユーザーフレンドリーなメッセージを返す
      if (response.status === 400) {
        return new Error(`入力内容に誤りがあります: ${univerpayError.message}`);
      } else if (response.status === 401 || response.status === 403) {
        return new Error('認証エラー: 決済サービスへの認証に失敗しました');
      } else if (response.status === 404) {
        return new Error('指定されたリソースが見つかりません');
      } else if (response.status === 402) {
        return new Error('決済処理が拒否されました。カード情報をご確認ください');
      } else if (response.status === 409) {
        return new Error('決済処理が競合しています。操作をやり直してください');
      } else if (response.status >= 500) {
        return new Error('決済サービス側でエラーが発生しました。しばらく経ってからお試しください');
      }
      
      return new Error(`決済エラー (${response.status}): ${univerpayError.message}`);
    }
    
    // 接続エラーなどネットワーク関連
    if (error.request) {
      return new Error('決済サービスに接続できませんでした。インターネット接続を確認してください');
    }
    
    // その他のエラー
    return new Error(`決済処理中にエラーが発生しました: ${error.message || 'Unknown error'}`);
  }

  /**
   * 環境変数から設定を読み込み
   */
  loadConfigFromEnv() {
    const apiToken = process.env.UNIVERPAY_API_TOKEN;
    const secret = process.env.UNIVERPAY_SECRET;
    const storeId = process.env.UNIVERPAY_STORE_ID;
    const testMode = process.env.UNIVERPAY_TEST_MODE === 'true';
    
    if (!apiToken || !secret || !storeId) {
      throw new Error('Univerpay環境変数が正しく設定されていません');
    }
    
    this.setCredentials({
      apiToken,
      secret,
      storeId
    }, testMode);
    
    return {
      apiToken,
      secret,
      storeId,
      testMode
    };
  }

  /**
   * テストカード情報の取得
   * テスト環境でのみ使用可能
   */
  getTestCards() {
    if (!this.isTestMode) {
      throw new Error('テストカード情報は本番環境では利用できません');
    }
    
    return [
      { number: '4000020000000000', name: '正常に処理されるカード' },
      { number: '4111111111111111', name: '課金失敗となるカード' },
      { number: '4242424242424242', name: '課金成功、返金失敗のカード' },
      { number: '4012888888881881', name: '課金成功、取り消し失敗のカード' },
    ];
  }
}

export default new UniverpayService();