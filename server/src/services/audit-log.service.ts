import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog';

/**
 * 監査ログサービス
 * システム内の重要な操作や状態変更のログを記録します
 */
export default class AuditLogService {
  /**
   * イベントログを記録
   * @param category カテゴリ
   * @param action アクション
   * @param data 関連データ
   * @param userId 操作ユーザーID（オプション）
   */
  async logEvent(
    category: string,
    action: string,
    data: any,
    userId?: string
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        category,
        action,
        data,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        timestamp: new Date()
      });
      
      await auditLog.save();
    } catch (error) {
      console.error('監査ログ記録エラー:', error);
      // ログ記録のエラーは上位に伝搬させない
    }
  }

  /**
   * エラーログを記録
   * @param category カテゴリ
   * @param error エラー
   * @param userId 操作ユーザーID（オプション）
   */
  async logError(
    category: string,
    error: any,
    userId?: string
  ): Promise<void> {
    try {
      let errorData: any = { message: 'Unknown error' };
      
      if (error instanceof Error) {
        errorData = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      } else if (typeof error === 'string') {
        errorData = { message: error };
      } else {
        errorData = error;
      }

      await this.logEvent(category, 'error', errorData, userId);
    } catch (logError) {
      console.error('エラーログ記録失敗:', logError);
      // ログ記録のエラーは上位に伝搬させない
    }
  }

  /**
   * 支払い関連イベントを記録
   * @param organizationId 組織ID
   * @param action アクション
   * @param data 関連データ
   */
  async logPaymentEvent(
    organizationId: string,
    action: string,
    data: any
  ): Promise<void> {
    await this.logEvent('payment', action, {
      ...data,
      organizationId
    });
  }

  /**
   * サブスクリプション関連イベントを記録
   * @param organizationId 組織ID
   * @param action アクション
   * @param data 関連データ
   */
  async logSubscriptionEvent(
    organizationId: string,
    action: string,
    data: any
  ): Promise<void> {
    await this.logEvent('subscription', action, {
      ...data,
      organizationId
    });
  }

  /**
   * 請求書関連イベントを記録
   * @param organizationId 組織ID
   * @param action アクション
   * @param data 関連データ
   */
  async logInvoiceEvent(
    organizationId: string,
    action: string,
    data: any
  ): Promise<void> {
    await this.logEvent('invoice', action, {
      ...data,
      organizationId
    });
  }

  /**
   * 管理者操作イベントを記録
   * @param userId 管理者ID
   * @param action アクション
   * @param data 関連データ
   */
  async logAdminEvent(
    userId: string,
    action: string,
    data: any
  ): Promise<void> {
    await this.logEvent('admin', action, data, userId);
  }

  /**
   * 監査ログを検索
   * @param category カテゴリでフィルタリング
   * @param action アクションでフィルタリング
   * @param startDate 開始日
   * @param endDate 終了日
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   */
  async searchAuditLogs(
    category?: string,
    action?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: any[]; total: number }> {
    try {
      const filter: any = {};
      
      if (category) {
        filter.category = category;
      }
      
      if (action) {
        filter.action = action;
      }
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = startDate;
        if (endDate) filter.timestamp.$lte = endDate;
      }
      
      const total = await AuditLog.countDocuments(filter);
      
      const skip = (page - 1) * limit;
      const logs = await AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
      
      return { logs, total };
    } catch (error) {
      console.error('監査ログ検索エラー:', error);
      throw error;
    }
  }
}