import mongoose from 'mongoose';
import { Organization, IOrganization, OrganizationStatus, convertToIOrganization } from '../models/Organization';
import { Subscription } from '../models/Subscription';
import { Invoice } from '../models/Invoice';

/**
 * 組織管理サービス
 * 組織情報の管理、ステータス更新などを行います
 */
export default class OrganizationService {
  /**
   * 組織IDに基づいて組織情報を取得
   * @param organizationId 組織ID
   */
  async getOrganizationById(organizationId: string): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findById(organizationId);
      return organization ? convertToIOrganization(organization) : null;
    } catch (error) {
      console.error('組織取得エラー:', error);
      throw error;
    }
  }

  /**
   * オーナーIDに基づいて組織情報を取得
   * @param ownerId オーナーID
   */
  async getOrganizationByOwnerId(ownerId: string): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findOne({ ownerId: new mongoose.Types.ObjectId(ownerId) });
      return organization ? convertToIOrganization(organization) : null;
    } catch (error) {
      console.error('組織取得エラー:', error);
      throw error;
    }
  }

  /**
   * 組織一覧を取得
   * @param status フィルタリングするステータス
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   */
  async getOrganizations(
    status?: OrganizationStatus | OrganizationStatus[],
    page: number = 1,
    limit: number = 20
  ): Promise<{ organizations: IOrganization[]; total: number }> {
    try {
      const filter: any = {};
      
      // ステータスでフィルタリング
      if (status) {
        if (Array.isArray(status)) {
          filter.status = { $in: status };
        } else {
          filter.status = status;
        }
      }

      // 組織の総数を取得
      const total = await Organization.countDocuments(filter);

      // ページネーションを適用して組織を取得
      const skip = (page - 1) * limit;
      const organizationDocs = await Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // IOrganization型に変換
      const organizations = organizationDocs.map(org => convertToIOrganization(org));

      return { organizations, total };
    } catch (error) {
      console.error('組織一覧取得エラー:', error);
      throw error;
    }
  }

  /**
   * 組織のステータスを更新
   * @param organizationId 組織ID
   * @param status 新しいステータス
   * @param reason ステータス変更理由
   */
  async updateOrganizationStatus(
    organizationId: string,
    status: OrganizationStatus,
    reason?: string
  ): Promise<IOrganization | null> {
    try {
      const update: any = { status };

      // ステータス変更のログを保存する場合はここに処理を追加

      const updatedOrg = await Organization.findByIdAndUpdate(
        organizationId,
        update,
        { new: true }
      );
      
      return updatedOrg ? convertToIOrganization(updatedOrg) : null;
    } catch (error) {
      console.error('組織ステータス更新エラー:', error);
      throw error;
    }
  }

  /**
   * 組織情報を更新
   * @param organizationId 組織ID
   * @param organizationData 更新データ
   */
  async updateOrganization(
    organizationId: string,
    organizationData: Partial<IOrganization>
  ): Promise<IOrganization | null> {
    try {
      const updatedOrg = await Organization.findByIdAndUpdate(
        organizationId,
        organizationData,
        { new: true }
      );
      
      return updatedOrg ? convertToIOrganization(updatedOrg) : null;
    } catch (error) {
      console.error('組織更新エラー:', error);
      throw error;
    }
  }

  /**
   * 組織の支払い状態を更新
   * @param organizationId 組織ID
   * @param status 支払い状態（'success'または'failed'）
   */
  async updatePaymentStatus(
    organizationId: string,
    status: 'success' | 'failed'
  ): Promise<IOrganization | null> {
    try {
      const orgDoc = await Organization.findById(organizationId);
      if (!orgDoc) {
        throw new Error('組織が見つかりません');
      }
      
      const organization = convertToIOrganization(orgDoc);

      // 支払い状態に応じた更新
      if (status === 'success') {
        // 支払い成功時の処理
        // 組織がSUSPENDED状態であれば復元
        if (organization.status === OrganizationStatus.SUSPENDED) {
          return await this.updateOrganizationStatus(
            organizationId,
            OrganizationStatus.ACTIVE,
            '支払い成功によるアクセス復元'
          );
        }
        return organization;
      } else {
        // 支払い失敗時の処理
        // 失敗回数などに応じた処理は実施しない（Webhookコントローラーで行う）
        return organization;
      }
    } catch (error) {
      console.error('支払い状態更新エラー:', error);
      throw error;
    }
  }

  /**
   * 支払い遅延している組織を取得
   */
  async getOverdueOrganizations(): Promise<IOrganization[]> {
    try {
      const today = new Date();
      
      // アクティブなサブスクリプションを持つが、未払いの請求書がある組織を特定
      const overdueInvoices = await Invoice.find({
        status: 'open',
        dueDate: { $lt: today }
      }).distinct('organizationId');

      if (overdueInvoices.length === 0) {
        return [];
      }

      // 該当する組織を取得
      const orgDocs = await Organization.find({
        _id: { $in: overdueInvoices },
        status: { $ne: OrganizationStatus.SUSPENDED } // 既に停止されていない組織のみ
      });
      
      // IOrganization型に変換
      return orgDocs.map(org => convertToIOrganization(org));
    } catch (error) {
      console.error('支払い遅延組織取得エラー:', error);
      throw error;
    }
  }

  /**
   * 組織のアクセスを停止
   * @param organizationId 組織ID
   * @param reason 停止理由
   */
  async suspendOrganization(
    organizationId: string,
    reason: string
  ): Promise<IOrganization | null> {
    try {
      return await this.updateOrganizationStatus(
        organizationId,
        OrganizationStatus.SUSPENDED,
        reason
      );
    } catch (error) {
      console.error('組織アクセス停止エラー:', error);
      throw error;
    }
  }

  /**
   * 組織のアクセスを復元
   * @param organizationId 組織ID
   * @param reason 復元理由
   */
  async restoreOrganization(
    organizationId: string,
    reason: string
  ): Promise<IOrganization | null> {
    try {
      return await this.updateOrganizationStatus(
        organizationId,
        OrganizationStatus.ACTIVE,
        reason
      );
    } catch (error) {
      console.error('組織アクセス復元エラー:', error);
      throw error;
    }
  }

  /**
   * 支払い状態に基づいてすべての組織のアクセス状態を一括チェック
   */
  async batchCheckOrganizationsAccess(): Promise<{
    suspended: number;
    restored: number;
  }> {
    try {
      let suspended = 0;
      let restored = 0;

      // 支払い遅延している組織を取得して停止
      const overdueOrganizations = await this.getOverdueOrganizations();
      for (const org of overdueOrganizations) {
        if (org._id) {
          const orgIdStr = org._id.toString();
          await this.suspendOrganization(
            orgIdStr,
            '支払い遅延によるアクセス停止'
          );
          suspended++;
        }
      }

      // 支払いが済んでいるが停止中の組織を復元
      const suspendedOrgDocs = await Organization.find({
        status: OrganizationStatus.SUSPENDED
      });
      
      const suspendedOrgs = suspendedOrgDocs.map(org => convertToIOrganization(org));

      for (const org of suspendedOrgs) {
        // 未払いの請求書がないか確認
        const overdueInvoiceCount = await Invoice.countDocuments({
          organizationId: org._id,
          status: 'open',
          dueDate: { $lt: new Date() }
        });

        if (overdueInvoiceCount === 0) {
          // 未払いの請求書がなければ復元
          const orgIdStr = org._id.toString();
          await this.restoreOrganization(
            orgIdStr,
            '支払い確認によるアクセス復元'
          );
          restored++;
        }
      }

      return { suspended, restored };
    } catch (error) {
      console.error('組織アクセス一括チェックエラー:', error);
      throw error;
    }
  }
}