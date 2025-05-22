import { Request, Response } from 'express';
import { handleError } from '../../utils/error-handler';
import { OrganizationStatus } from '../../models/Organization';
import { SubscriptionStatus } from '../../models/Subscription';
import { InvoiceStatus } from '../../models/Invoice';
import SubscriptionService from '../../services/subscription.service';
import OrganizationService from '../../services/organization.service';
import InvoiceService from '../../services/invoice.service';
import NotificationService from '../../services/notification.service';
import AuditLogService from '../../services/audit-log.service';
import crypto from 'crypto';

/**
 * Univerpay Webhookイベント処理コントローラー
 * 支払い状態の変更を監視し、アプリケーションの状態を更新します
 * 
 * 対応イベント:
 * - subscription_created: 定期課金作成
 * - subscription_payment: 定期課金支払い成功
 * - subscription_failure: 定期課金失敗
 * - subscription_suspended: 定期課金一時停止
 * - subscription_canceled: 定期課金永久停止
 * - charge_updated: 課金申込完了
 * - charge_finished: 課金処理完了
 * - refund_finished: 返金完了
 */
export default class PaymentWebhookController {
  private subscriptionService = new SubscriptionService();
  private organizationService = new OrganizationService();
  private invoiceService = new InvoiceService();
  private notificationService = new NotificationService();
  private auditLogService = new AuditLogService();

  /**
   * Webhookハンドラー - すべてのWebhookイベントを受け取り処理します
   * UniverpayのWebhookは3秒以内の応答が必要
   */
  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // すぐに200 OKで応答してから処理を行う（タイムアウト防止）
      res.status(200).json({ received: true });

      // リクエストの署名を検証
      const signature = req.headers['x-univapay-hmac-sha256'] as string;
      if (!this.verifySignature(req.body, signature)) {
        console.error('無効な署名でのWebhookリクエスト');
        await this.auditLogService.logError('payment_webhook', new Error('無効な署名'));
        return;
      }

      // イベントタイプに基づいて処理を振り分け
      const eventType = req.body.type;
      const eventData = req.body.data;

      // 監査ログに全イベントを記録
      await this.auditLogService.logEvent('payment_webhook', eventType, eventData);

      // イベントタイプに応じた処理
      switch (eventType) {
        case 'subscription_created':
          await this.handleSubscriptionCreated(eventData);
          break;
        case 'subscription_payment':
          await this.handleSubscriptionPayment(eventData);
          break;
        case 'subscription_failure':
          await this.handleSubscriptionFailure(eventData);
          break;
        case 'subscription_suspended':
          await this.handleSubscriptionSuspended(eventData);
          break;
        case 'subscription_canceled':
          await this.handleSubscriptionCanceled(eventData);
          break;
        case 'charge_updated':
          await this.handleChargeUpdated(eventData);
          break;
        case 'charge_finished':
          await this.handleChargeFinished(eventData);
          break;
        case 'refund_finished':
          await this.handleRefundFinished(eventData);
          break;
        default:
          console.log(`未処理のイベントタイプ: ${eventType}`);
      }
    } catch (error) {
      // エラーログに記録するが、レスポンスは既に返却済み
      console.error('Webhook処理エラー:', error);
      await this.auditLogService.logError('payment_webhook', error);
    }
  };

  /**
   * 定期課金作成イベント処理
   */
  private handleSubscriptionCreated = async (eventData: any): Promise<void> => {
    try {
      const { id, metadata, subscription } = eventData;
      const organizationId = metadata?.organization_id;
      const planId = metadata?.plan_id;

      if (organizationId) {
        // サブスクリプション情報を登録
        await this.subscriptionService.createSubscription({
          organizationId,
          planId,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          nextBillingDate: subscription?.next_payment ? new Date(subscription.next_payment) : undefined,
          metadata: metadata
        });

        // 組織のステータスをアクティブに更新
        await this.organizationService.updateOrganizationStatus(
          organizationId,
          OrganizationStatus.ACTIVE,
          'サブスクリプション作成によるアクティベーション'
        );

        // 通知を送信
        await this.notificationService.sendSubscriptionCreatedNotification(
          organizationId,
          'サブスクリプションが正常に作成されました。'
        );

        // 監査ログに記録
        await this.auditLogService.logSubscriptionEvent(
          organizationId,
          'subscription_created',
          { subscriptionId: id, planId }
        );
      }
    } catch (error) {
      console.error('サブスクリプション作成イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * 定期課金支払い成功イベント処理
   */
  private handleSubscriptionPayment = async (eventData: any): Promise<void> => {
    try {
      const { subscription_id, metadata, amount, currency } = eventData;
      const organizationId = metadata?.organization_id;
      const invoiceId = metadata?.invoice_id;

      if (invoiceId) {
        // 請求書ステータスを更新
        await this.invoiceService.updateInvoiceStatus(invoiceId, InvoiceStatus.PAID);
      }

      if (organizationId && subscription_id) {
        // 支払い失敗カウンターをリセット
        await this.subscriptionService.resetFailureCount(organizationId);
        
        // サブスクリプションステータスを確認・更新
        const subscription = await this.subscriptionService.getSubscriptionById(subscription_id);
        if (subscription && subscription.status !== SubscriptionStatus.ACTIVE) {
          await this.subscriptionService.updateSubscriptionStatus(
            subscription_id,
            SubscriptionStatus.ACTIVE
          );
        }

        // 組織の状態を確認
        const organization = await this.organizationService.getOrganizationById(organizationId);
        if (organization && organization.status === OrganizationStatus.SUSPENDED) {
          // 停止中の組織を再開
          await this.organizationService.updateOrganizationStatus(
            organizationId,
            OrganizationStatus.ACTIVE,
            '支払い成功によるアクセス復元'
          );
          
          // 復元通知を送信
          await this.notificationService.sendPaymentSuccessNotification(
            organizationId,
            'お支払いが確認されました。サービスへのアクセスが復元されました。'
          );
        }

        // 監査ログに記録
        await this.auditLogService.logPaymentEvent(
          organizationId,
          'subscription_payment_success',
          {
            amount,
            currency,
            subscriptionId: subscription_id,
            invoiceId
          }
        );
      }
    } catch (error) {
      console.error('サブスクリプション支払い成功イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * 定期課金失敗イベント処理
   */
  private handleSubscriptionFailure = async (eventData: any): Promise<void> => {
    try {
      const { subscription_id, metadata, error } = eventData;
      const organizationId = metadata?.organization_id;
      const invoiceId = metadata?.invoice_id;

      if (invoiceId) {
        // 請求書ステータスを更新
        await this.invoiceService.updateInvoiceStatus(invoiceId, InvoiceStatus.PAST_DUE);
      }

      if (organizationId) {
        // 失敗回数をカウントアップ
        await this.subscriptionService.incrementFailureCount(organizationId);
        
        // 現在の失敗回数を取得
        const failCount = await this.subscriptionService.getFailureCount(organizationId);
        
        // サブスクリプションステータスを更新
        if (subscription_id) {
          await this.subscriptionService.updateSubscriptionStatus(
            subscription_id,
            failCount >= 3 ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.PAST_DUE
          );
        }
        
        // 失敗回数に応じた処理
        if (failCount >= 3) {
          // 3回以上失敗した場合は組織を停止
          await this.organizationService.updateOrganizationStatus(
            organizationId, 
            OrganizationStatus.SUSPENDED,
            '支払い失敗によるアクセス停止'
          );
          
          // 停止通知を送信
          await this.notificationService.sendPaymentFailureNotification(
            organizationId, 
            'サービスが一時停止されました。支払い情報を更新してください。'
          );
        } else {
          // 警告通知を送信
          await this.notificationService.sendPaymentFailureNotification(
            organizationId, 
            '支払いに失敗しました。支払い情報を確認してください。'
          );
        }

        // 監査ログに記録
        await this.auditLogService.logPaymentEvent(
          organizationId,
          'subscription_payment_failure',
          {
            error,
            failCount,
            subscriptionId: subscription_id,
            invoiceId
          }
        );
      }
    } catch (error) {
      console.error('サブスクリプション失敗イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * 定期課金一時停止イベント処理
   */
  private handleSubscriptionSuspended = async (eventData: any): Promise<void> => {
    try {
      const { subscription_id, metadata, reason } = eventData;
      const organizationId = metadata?.organization_id;

      if (organizationId && subscription_id) {
        // サブスクリプション情報を更新
        await this.subscriptionService.updateSubscriptionStatus(
          subscription_id,
          SubscriptionStatus.SUSPENDED
        );

        // 組織のステータスを停止に更新
        await this.organizationService.updateOrganizationStatus(
          organizationId, 
          OrganizationStatus.SUSPENDED,
          'サブスクリプション停止によるアクセス停止'
        );

        // 通知を送信
        await this.notificationService.sendSubscriptionSuspendedNotification(
          organizationId,
          'サブスクリプションが一時停止されました。支払い情報を更新してください。'
        );

        // 監査ログに記録
        await this.auditLogService.logSubscriptionEvent(
          organizationId,
          'subscription_suspended',
          { 
            subscriptionId: subscription_id,
            reason
          }
        );
      }
    } catch (error) {
      console.error('サブスクリプション一時停止イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * サブスクリプションキャンセルイベント処理
   */
  private handleSubscriptionCanceled = async (eventData: any): Promise<void> => {
    try {
      const { subscription_id, metadata, reason } = eventData;
      const organizationId = metadata?.organization_id;

      if (organizationId && subscription_id) {
        // サブスクリプション情報を更新
        await this.subscriptionService.updateSubscriptionStatus(
          subscription_id,
          SubscriptionStatus.CANCELED
        );

        // 組織のステータスを更新
        await this.organizationService.updateOrganizationStatus(
          organizationId,
          OrganizationStatus.INACTIVE,
          'サブスクリプションキャンセルによるアクセス制限'
        );

        // 通知を送信
        await this.notificationService.sendSubscriptionCanceledNotification(
          organizationId,
          'サブスクリプションがキャンセルされました。サービスの利用には新しいサブスクリプションの登録が必要です。'
        );

        // 監査ログに記録
        await this.auditLogService.logSubscriptionEvent(
          organizationId,
          'subscription_canceled',
          { 
            subscriptionId: subscription_id,
            reason
          }
        );
      }
    } catch (error) {
      console.error('サブスクリプションキャンセルイベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * 課金申込完了イベント処理
   */
  private handleChargeUpdated = async (eventData: any): Promise<void> => {
    try {
      const { id, metadata, status } = eventData;
      const organizationId = metadata?.organization_id;
      const invoiceId = metadata?.invoice_id;

      if (organizationId) {
        // 課金申込完了のログを記録
        await this.auditLogService.logPaymentEvent(
          organizationId,
          'charge_updated',
          {
            chargeId: id,
            status,
            invoiceId
          }
        );

        // 請求書ステータスを更新（適用可能な場合）
        if (invoiceId && status === 'pending') {
          await this.invoiceService.updateInvoiceStatus(invoiceId, InvoiceStatus.PROCESSING);
        }
      }
    } catch (error) {
      console.error('課金申込完了イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * 課金処理完了イベント処理
   */
  private handleChargeFinished = async (eventData: any): Promise<void> => {
    try {
      const { id, metadata, amount, currency, status } = eventData;
      const organizationId = metadata?.organization_id;
      const invoiceId = metadata?.invoice_id;
      const planId = metadata?.plan_id;

      if (organizationId) {
        // 成功または失敗に応じて処理を分ける
        if (status === 'successful') {
          // 課金成功時の処理
          if (invoiceId) {
            await this.invoiceService.updateInvoiceStatus(invoiceId, InvoiceStatus.PAID);
          }

          // プランIDがある場合は新規購入の可能性
          if (planId && !metadata?.subscription_id) {
            // 通知を送信
            await this.notificationService.sendPaymentSuccessNotification(
              organizationId,
              '決済が完了しました。サービスをご利用いただけます。'
            );
          }

          // 監査ログに記録
          await this.auditLogService.logPaymentEvent(
            organizationId,
            'charge_success',
            {
              chargeId: id,
              amount,
              currency,
              invoiceId,
              planId
            }
          );
        } else {
          // 課金失敗時の処理
          if (invoiceId) {
            await this.invoiceService.updateInvoiceStatus(invoiceId, InvoiceStatus.FAILED);
          }

          // 通知を送信
          await this.notificationService.sendPaymentFailureNotification(
            organizationId,
            '決済に失敗しました。支払い情報をご確認ください。'
          );

          // 監査ログに記録
          await this.auditLogService.logPaymentEvent(
            organizationId,
            'charge_failure',
            {
              chargeId: id,
              status,
              invoiceId
            }
          );
        }
      }
    } catch (error) {
      console.error('課金処理完了イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * 返金完了イベント処理
   */
  private handleRefundFinished = async (eventData: any): Promise<void> => {
    try {
      const { id, metadata, amount, currency, charge_id, status } = eventData;
      const organizationId = metadata?.organization_id;
      const invoiceId = metadata?.invoice_id;

      if (organizationId) {
        // 返金の成功・失敗に応じて処理
        if (status === 'successful') {
          // 返金成功の場合
          if (invoiceId) {
            await this.invoiceService.updateInvoiceStatus(invoiceId, InvoiceStatus.REFUNDED);
          }

          // 通知を送信
          await this.notificationService.sendRefundNotification(
            organizationId,
            '返金処理が完了しました。'
          );
        } else {
          // 返金失敗の場合
          await this.notificationService.sendRefundFailureNotification(
            organizationId,
            '返金処理に失敗しました。サポートにお問い合わせください。'
          );
        }

        // 監査ログに記録
        await this.auditLogService.logPaymentEvent(
          organizationId,
          'refund_finished',
          {
            refundId: id,
            chargeId: charge_id,
            amount,
            currency,
            status,
            invoiceId
          }
        );
      }
    } catch (error) {
      console.error('返金完了イベント処理エラー:', error);
      throw error;
    }
  };

  /**
   * Webhook署名を検証
   * UniverpayのWebhook署名検証仕様に基づいて実装
   */
  private verifySignature(payload: any, signature: string): boolean {
    if (!signature) {
      return false;
    }

    try {
      const webhookSecret = process.env.UNIVERPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('Webhook検証キーが設定されていません');
        return false;
      }

      // ペイロードをJSON文字列に変換
      const jsonPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      // HMAC-SHA256でハッシュ値を計算
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const calculatedSignature = hmac.update(jsonPayload).digest('hex');
      
      // 計算した署名と受け取った署名を比較
      return crypto.timingSafeEqual(
        Buffer.from(calculatedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch (error) {
      console.error('署名検証エラー:', error);
      return false;
    }
  }
}