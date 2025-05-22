import mongoose from 'mongoose';
import { Organization } from '../models/Organization';
// 通知ログの型定義とモデルを使用
import { NotificationLog } from '../models/NotificationLog';

/**
 * 通知タイプ
 */
export enum NotificationType {
  PAYMENT_SUCCESS = 'payment_success',         // 支払い成功
  PAYMENT_FAILURE = 'payment_failure',         // 支払い失敗
  SUBSCRIPTION_CREATED = 'subscription_created', // サブスクリプション作成
  SUBSCRIPTION_PAYMENT = 'subscription_payment', // サブスクリプション支払い
  SUBSCRIPTION_FAILURE = 'subscription_failure', // サブスクリプション失敗
  SUBSCRIPTION_EXPIRING = 'subscription_expiring', // サブスクリプション期限切れ
  SUBSCRIPTION_SUSPENDED = 'subscription_suspended', // サブスクリプション一時停止
  SUBSCRIPTION_CANCELED = 'subscription_canceled', // サブスクリプションキャンセル
  INVOICE_CREATED = 'invoice_created',         // 請求書作成
  INVOICE_PAYMENT_REMINDER = 'invoice_payment_reminder', // 支払い催促
  ACCESS_SUSPENDED = 'access_suspended',       // アクセス停止
  ACCESS_RESTORED = 'access_restored',         // アクセス復元
  PLAN_UPDATED = 'plan_updated',               // プラン更新
  REFUND_NOTIFICATION = 'refund_notification', // 返金通知
  REFUND_FAILURE = 'refund_failure',           // 返金失敗
  GENERAL = 'general'                          // 一般通知
}

/**
 * 通知サービス
 * ユーザーや管理者への通知の送信、管理を行います
 */
export default class NotificationService {
  /**
   * 通知を送信し、ログに記録する
   * @param organizationId 組織ID
   * @param type 通知タイプ
   * @param message 通知メッセージ
   * @param metadata 追加メタデータ
   */
  private async sendNotification(
    organizationId: string,
    type: NotificationType,
    message: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      // 組織情報を取得
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('組織が見つかりません');
      }

      // 通知の受信者を決定
      const recipientEmail = organization.billingInfo.contactEmail;
      
      // 通知の送信（実際にはメールサービスなどを使用）
      console.log(`通知送信: ${type} to ${recipientEmail}`, { message });
      
      // 通知ログに記録
      const notificationLog = new NotificationLog({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        type,
        message,
        recipient: recipientEmail,
        metadata,
        sentAt: new Date()
      });
      
      await notificationLog.save();
    } catch (error) {
      console.error('通知送信エラー:', error);
      throw error;
    }
  }

  /**
   * 支払い成功通知を送信
   * @param organizationId 組織ID
   * @param metadata 追加メタデータ
   */
  async sendPaymentSuccessNotification(
    organizationId: string,
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.PAYMENT_SUCCESS,
      'お支払いが正常に処理されました。',
      metadata
    );
  }

  /**
   * 支払い失敗通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendPaymentFailureNotification(
    organizationId: string,
    message: string = 'お支払い処理に失敗しました。支払い情報をご確認ください。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.PAYMENT_FAILURE,
      message,
      metadata
    );
  }

  /**
   * サブスクリプション作成通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendSubscriptionCreatedNotification(
    organizationId: string,
    message: string = 'サブスクリプションが正常に作成されました。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.SUBSCRIPTION_CREATED,
      message,
      metadata
    );
  }

  /**
   * サブスクリプション失敗通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendSubscriptionFailureNotification(
    organizationId: string,
    message: string = 'サブスクリプションの処理に失敗しました。支払い情報をご確認ください。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.SUBSCRIPTION_FAILURE,
      message,
      metadata
    );
  }

  /**
   * サブスクリプション一時停止通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendSubscriptionSuspendedNotification(
    organizationId: string,
    message: string = 'サブスクリプションが一時停止されました。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.SUBSCRIPTION_SUSPENDED,
      message,
      metadata
    );
  }

  /**
   * サブスクリプションキャンセル通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendSubscriptionCanceledNotification(
    organizationId: string,
    message: string = 'サブスクリプションがキャンセルされました。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.SUBSCRIPTION_CANCELED,
      message,
      metadata
    );
  }

  /**
   * 請求書作成通知を送信
   * @param organizationId 組織ID
   * @param invoiceNumber 請求書番号
   * @param dueDate 支払期限
   * @param metadata 追加メタデータ
   */
  async sendInvoiceCreatedNotification(
    organizationId: string,
    invoiceNumber: string,
    dueDate: Date,
    metadata: any = {}
  ): Promise<void> {
    const dueDateStr = dueDate.toLocaleDateString('ja-JP');
    await this.sendNotification(
      organizationId,
      NotificationType.INVOICE_CREATED,
      `新しい請求書（${invoiceNumber}）が発行されました。支払期限は${dueDateStr}です。`,
      { ...metadata, invoiceNumber, dueDate }
    );
  }

  /**
   * 支払い催促通知を送信
   * @param organizationId 組織ID
   * @param invoiceNumber 請求書番号
   * @param daysOverdue 支払い遅延日数
   * @param metadata 追加メタデータ
   */
  async sendPaymentReminderNotification(
    organizationId: string,
    invoiceNumber: string,
    daysOverdue: number,
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.INVOICE_PAYMENT_REMINDER,
      `請求書（${invoiceNumber}）の支払いが${daysOverdue}日遅延しています。至急お支払いください。`,
      { ...metadata, invoiceNumber, daysOverdue }
    );
  }

  /**
   * アクセス停止通知を送信
   * @param organizationId 組織ID
   * @param reason 停止理由
   * @param metadata 追加メタデータ
   */
  async sendAccessSuspendedNotification(
    organizationId: string,
    reason: string,
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.ACCESS_SUSPENDED,
      `サービスへのアクセスが停止されました。理由: ${reason}`,
      { ...metadata, reason }
    );
  }

  /**
   * アクセス復元通知を送信
   * @param organizationId 組織ID
   * @param metadata 追加メタデータ
   */
  async sendAccessRestoredNotification(
    organizationId: string,
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.ACCESS_RESTORED,
      'サービスへのアクセスが復元されました。',
      metadata
    );
  }

  /**
   * 返金通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendRefundNotification(
    organizationId: string,
    message: string = '返金処理が完了しました。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.REFUND_NOTIFICATION,
      message,
      metadata
    );
  }

  /**
   * 返金失敗通知を送信
   * @param organizationId 組織ID
   * @param message カスタムメッセージ
   * @param metadata 追加メタデータ
   */
  async sendRefundFailureNotification(
    organizationId: string,
    message: string = '返金処理に失敗しました。',
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.REFUND_FAILURE,
      message,
      metadata
    );
  }

  /**
   * プラン更新通知を送信
   * @param organizationId 組織ID
   * @param planName プラン名
   * @param metadata 追加メタデータ
   */
  async sendPlanUpdatedNotification(
    organizationId: string,
    planName: string,
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.PLAN_UPDATED,
      `プランが「${planName}」に更新されました。`,
      { ...metadata, planName }
    );
  }

  /**
   * 一般通知を送信
   * @param organizationId 組織ID
   * @param message 通知メッセージ
   * @param metadata 追加メタデータ
   */
  async sendGeneralNotification(
    organizationId: string,
    message: string,
    metadata: any = {}
  ): Promise<void> {
    await this.sendNotification(
      organizationId,
      NotificationType.GENERAL,
      message,
      metadata
    );
  }

  /**
   * 組織の通知履歴を取得
   * @param organizationId 組織ID
   * @param limit 取得件数
   */
  async getOrganizationNotifications(
    organizationId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      return await NotificationLog.find({
        organizationId: new mongoose.Types.ObjectId(organizationId)
      })
        .sort({ sentAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('通知履歴取得エラー:', error);
      throw error;
    }
  }
}