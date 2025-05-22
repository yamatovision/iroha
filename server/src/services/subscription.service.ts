import mongoose from 'mongoose';
import { Subscription, ISubscription, SubscriptionStatus } from '../models/Subscription';
import { Organization } from '../models/Organization';

/**
 * サブスクリプション管理サービス
 * 定期課金の作成、更新、キャンセルなどを管理します
 */
export default class SubscriptionService {
  /**
   * 組織IDに基づいてサブスクリプション情報を取得
   * @param organizationId 組織ID
   */
  async getSubscriptionByOrganizationId(organizationId: string): Promise<ISubscription | null> {
    try {
      return await Subscription.findOne({ organizationId: new mongoose.Types.ObjectId(organizationId) });
    } catch (error) {
      console.error('サブスクリプション取得エラー:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションIDに基づいてサブスクリプション情報を取得
   * @param subscriptionId サブスクリプションID
   */
  async getSubscriptionById(subscriptionId: string): Promise<ISubscription | null> {
    try {
      return await Subscription.findById(subscriptionId);
    } catch (error) {
      console.error('サブスクリプション取得エラー:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションを作成
   * @param subscriptionData サブスクリプションデータ
   */
  async createSubscription(subscriptionData: Partial<ISubscription>): Promise<ISubscription> {
    try {
      const newSubscription = new Subscription(subscriptionData);
      const saved = await newSubscription.save();

      // 組織のサブスクリプション情報も更新
      await Organization.findByIdAndUpdate(
        subscriptionData.organizationId,
        {
          'subscriptionPlan.type': subscriptionData.status === 'trialing' ? 'trial' : 'active',
          'subscriptionPlan.isActive': true,
          'subscriptionPlan.currentPeriodStart': subscriptionData.currentPeriodStart,
          'subscriptionPlan.currentPeriodEnd': subscriptionData.currentPeriodEnd
        }
      );

      return saved;
    } catch (error) {
      console.error('サブスクリプション作成エラー:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションのステータスを更新
   * @param subscriptionId サブスクリプションID
   * @param status 新しいステータス
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ): Promise<ISubscription | null> {
    try {
      const subscription = await Subscription.findByIdAndUpdate(
        subscriptionId,
        { status },
        { new: true }
      );

      if (subscription) {
        // 組織のサブスクリプション情報も更新
        const organizationUpdate: any = {};
        
        if (status === 'active' || status === 'trialing') {
          organizationUpdate['subscriptionPlan.type'] = status === 'trialing' ? 'trial' : 'active';
          organizationUpdate['subscriptionPlan.isActive'] = true;
        } else if (status === 'canceled') {
          organizationUpdate['subscriptionPlan.type'] = 'cancelled';
          organizationUpdate['subscriptionPlan.isActive'] = false;
        } else if (status === 'past_due') {
          // past_dueの場合はすぐに無効にはしない（猶予期間を設ける）
          organizationUpdate['subscriptionPlan.isActive'] = true;
        }

        if (Object.keys(organizationUpdate).length > 0) {
          await Organization.findByIdAndUpdate(
            subscription.organizationId,
            organizationUpdate
          );
        }
      }

      return subscription;
    } catch (error) {
      console.error('サブスクリプションステータス更新エラー:', error);
      throw error;
    }
  }

  /**
   * 次回の請求日を更新
   * @param subscriptionId サブスクリプションID
   * @param nextBillingDate 次回請求日
   */
  async updateNextBillingDate(
    subscriptionId: string,
    nextBillingDate: Date
  ): Promise<ISubscription | null> {
    try {
      return await Subscription.findByIdAndUpdate(
        subscriptionId,
        {
          currentPeriodEnd: nextBillingDate
        },
        { new: true }
      );
    } catch (error) {
      console.error('次回請求日更新エラー:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションをキャンセル
   * @param subscriptionId サブスクリプションID
   * @param cancelImmediately 即時キャンセルするかどうか
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelImmediately: boolean = false
  ): Promise<ISubscription | null> {
    try {
      const update: any = {
        cancelAtPeriodEnd: !cancelImmediately
      };

      if (cancelImmediately) {
        update.status = 'canceled';
      }

      const subscription = await Subscription.findByIdAndUpdate(
        subscriptionId,
        update,
        { new: true }
      );

      if (subscription && cancelImmediately) {
        // 組織のサブスクリプション情報も更新
        await Organization.findByIdAndUpdate(
          subscription.organizationId,
          {
            'subscriptionPlan.type': 'cancelled',
            'subscriptionPlan.isActive': false
          }
        );
      }

      return subscription;
    } catch (error) {
      console.error('サブスクリプションキャンセルエラー:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションの支払い失敗回数をカウントアップ
   * @param organizationId 組織ID
   */
  async incrementFailureCount(organizationId: string): Promise<number> {
    try {
      // この組織の過去の失敗回数を取得するロジック
      // 例: 専用のコレクション（PaymentFailure）を使用するか、Subscriptionにフィールドを追加
      // ここでは仮の実装としてカウンターを1増やす
      const currentFailCount = await this.getFailureCount(organizationId);
      const newFailCount = currentFailCount + 1;
      
      // 失敗回数を保存するロジック
      // 例: PaymentFailureコレクションに保存、またはSubscriptionモデルのフィールドを更新
      
      return newFailCount;
    } catch (error) {
      console.error('支払い失敗カウントアップエラー:', error);
      throw error;
    }
  }

  /**
   * 組織の支払い失敗回数を取得
   * @param organizationId 組織ID
   */
  async getFailureCount(organizationId: string): Promise<number> {
    try {
      // 支払い失敗回数を取得するロジック
      // 例: 専用のコレクション（PaymentFailure）から取得、またはSubscriptionモデルのフィールドから取得
      // ここでは仮の実装として0を返す
      return 0;
    } catch (error) {
      console.error('支払い失敗回数取得エラー:', error);
      throw error;
    }
  }

  /**
   * 支払い失敗回数をリセット
   * @param organizationId 組織ID
   */
  async resetFailureCount(organizationId: string): Promise<void> {
    try {
      // 支払い失敗回数をリセットするロジック
      // 例: PaymentFailureコレクションから削除、またはSubscriptionモデルのフィールドを0にリセット
    } catch (error) {
      console.error('支払い失敗回数リセットエラー:', error);
      throw error;
    }
  }

  /**
   * 期限切れの間もなく切れるサブスクリプションを取得
   * @param daysThreshold 期限切れまでの日数
   */
  async getExpiringSubscriptions(daysThreshold: number = 7): Promise<ISubscription[]> {
    try {
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + daysThreshold);

      return await Subscription.find({
        status: { $in: ['active', 'trialing'] },
        currentPeriodEnd: {
          $gte: today,
          $lte: thresholdDate
        }
      });
    } catch (error) {
      console.error('期限切れ間近のサブスクリプション取得エラー:', error);
      throw error;
    }
  }

  /**
   * 期限切れのサブスクリプションを処理
   */
  async processExpiredSubscriptions(): Promise<void> {
    try {
      const today = new Date();
      
      // 期限切れのサブスクリプションを取得
      const expiredSubscriptions = await Subscription.find({
        status: { $in: ['active', 'trialing'] },
        currentPeriodEnd: { $lt: today },
        cancelAtPeriodEnd: true
      });

      // 各サブスクリプションを処理
      for (const subscription of expiredSubscriptions) {
        if (subscription._id) {
          await this.updateSubscriptionStatus(subscription._id.toString(), SubscriptionStatus.CANCELED);
        }
      }
    } catch (error) {
      console.error('期限切れサブスクリプション処理エラー:', error);
      throw error;
    }
  }
}