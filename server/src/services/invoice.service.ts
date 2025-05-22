import mongoose from 'mongoose';
import { Invoice, IInvoice, IInvoiceItem, InvoiceStatus, convertToIInvoice } from '../models/Invoice';
import { Subscription } from '../models/Subscription';
import { Organization } from '../models/Organization';

/**
 * 請求書フィルターオプション
 */
export interface InvoiceFilterOptions {
  organizationId?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

/**
 * 請求書管理サービス
 * 請求書の生成、管理、状態更新などを行います
 */
export default class InvoiceService {
  /**
   * 請求書一覧を取得
   * @param options フィルターオプション
   * @returns 請求書リストと総件数
   */
  async getInvoices(options: InvoiceFilterOptions = {}): Promise<{ invoices: IInvoice[]; total: number }> {
    try {
      const {
        organizationId,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = options;

      const filter: any = {};

      // 組織IDでフィルタリング
      if (organizationId) {
        filter.organizationId = new mongoose.Types.ObjectId(organizationId);
      }

      // ステータスでフィルタリング
      if (status) {
        if (Array.isArray(status)) {
          filter.status = { $in: status };
        } else {
          filter.status = status;
        }
      }

      // 日付範囲でフィルタリング
      if (dateFrom || dateTo) {
        filter.billingPeriodStart = {};
        if (dateFrom) filter.billingPeriodStart.$gte = dateFrom;
        if (dateTo) filter.billingPeriodStart.$lte = dateTo;
      }

      // 請求書の総数を取得
      const total = await Invoice.countDocuments(filter);

      // ページネーションを適用して請求書を取得
      const skip = (page - 1) * limit;
      const invoiceDocs = await Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // IInvoice型に変換
      const invoices = invoiceDocs.map(invoice => convertToIInvoice(invoice));

      return { invoices, total };
    } catch (error) {
      console.error('請求書一覧取得エラー:', error);
      throw error;
    }
  }

  /**
   * 請求書IDに基づいて請求書を取得
   * @param invoiceId 請求書ID
   */
  async getInvoiceById(invoiceId: string): Promise<IInvoice | null> {
    try {
      return await Invoice.findById(invoiceId);
    } catch (error) {
      console.error('請求書取得エラー:', error);
      throw error;
    }
  }

  /**
   * 請求書番号に基づいて請求書を取得
   * @param invoiceNumber 請求書番号
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    try {
      return await Invoice.findOne({ invoiceNumber });
    } catch (error) {
      console.error('請求書取得エラー:', error);
      throw error;
    }
  }

  /**
   * 請求書を作成
   * @param invoiceData 請求書データ
   */
  async createInvoice(invoiceData: Partial<IInvoice>): Promise<IInvoice> {
    try {
      // 請求書番号の生成（例: INV-YYYYMMDD-XXXX）
      if (!invoiceData.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // 同じ日付の請求書数を取得してシーケンス番号を生成
        const datePrefix = `INV-${year}${month}${day}`;
        const count = await Invoice.countDocuments({
          invoiceNumber: { $regex: `^${datePrefix}` }
        });
        
        invoiceData.invoiceNumber = `${datePrefix}-${String(count + 1).padStart(4, '0')}`;
      }

      // サブスクリプション情報の取得
      if (invoiceData.subscriptionId) {
        const subscription = await Subscription.findById(invoiceData.subscriptionId);
        if (subscription) {
          // サブスクリプション情報を使用して請求書データを補完
          if (!invoiceData.amount) {
            invoiceData.amount = subscription.totalAmount;
          }
          if (!invoiceData.currency) {
            invoiceData.currency = subscription.currency;
          }
        }
      }

      // 請求書の作成
      const newInvoice = new Invoice(invoiceData);
      const savedInvoice = await newInvoice.save();
      
      // IInvoice型に変換して返す
      return convertToIInvoice(savedInvoice);
    } catch (error) {
      console.error('請求書作成エラー:', error);
      throw error;
    }
  }

  /**
   * 請求書のステータスを更新
   * @param invoiceId 請求書ID
   * @param status 新しいステータス
   */
  async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus
  ): Promise<IInvoice | null> {
    try {
      const update: any = { status };
      
      // 支払い済みに変更する場合は支払日時も更新
      if (status === InvoiceStatus.PAID) {
        update.paidAt = new Date();
      }

      return await Invoice.findByIdAndUpdate(
        invoiceId,
        update,
        { new: true }
      );
    } catch (error) {
      console.error('請求書ステータス更新エラー:', error);
      throw error;
    }
  }

  /**
   * 請求書を更新
   * @param invoiceId 請求書ID
   * @param invoiceData 更新データ
   */
  async updateInvoice(
    invoiceId: string,
    invoiceData: Partial<IInvoice>
  ): Promise<IInvoice | null> {
    try {
      return await Invoice.findByIdAndUpdate(
        invoiceId,
        invoiceData,
        { new: true }
      );
    } catch (error) {
      console.error('請求書更新エラー:', error);
      throw error;
    }
  }

  /**
   * 支払い催促メールを送信
   * @param invoiceId 請求書ID
   * @param message カスタムメッセージ
   */
  async sendPaymentReminder(
    invoiceId: string,
    message?: string
  ): Promise<boolean> {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('請求書が見つかりません');
      }

      // 既に支払い済みの場合はエラー
      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error('既に支払い済みの請求書には催促メールを送信できません');
      }

      // 組織情報を取得
      const organization = await Organization.findById(invoice.organizationId);
      if (!organization) {
        throw new Error('組織が見つかりません');
      }

      // メール送信ロジック（実際の実装はメールサービスを使用）
      console.log('支払い催促メールを送信しました:', {
        to: organization.billingInfo.contactEmail,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        message: message || '支払いの期限が近づいています。ご確認ください。'
      });

      return true;
    } catch (error) {
      console.error('支払い催促メール送信エラー:', error);
      throw error;
    }
  }

  /**
   * 請求書のPDFを生成
   * @param invoiceId 請求書ID
   */
  async generateInvoicePdf(invoiceId: string): Promise<Buffer | null> {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('請求書が見つかりません');
      }

      const organization = await Organization.findById(invoice.organizationId);
      if (!organization) {
        throw new Error('組織が見つかりません');
      }

      // PDFの生成ロジック（実際の実装ではPDF生成ライブラリを使用）
      // ここでは仮の実装としてnullを返す
      return null;
    } catch (error) {
      console.error('請求書PDF生成エラー:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションの更新時に請求書を自動生成
   * @param subscriptionId サブスクリプションID
   */
  async generateInvoiceForSubscription(subscriptionId: string): Promise<IInvoice | null> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('サブスクリプションが見つかりません');
      }

      // 請求書の項目を作成
      const items: IInvoiceItem[] = [
        {
          description: `ユーザー課金（${subscription.quantity}名）`,
          quantity: subscription.quantity,
          unitPrice: subscription.totalAmount / subscription.quantity,
          amount: subscription.totalAmount
        }
      ];

      // 支払い期限を設定（例: 請求日から14日後）
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // 請求書を作成
      const invoiceData: Partial<IInvoice> = {
        organizationId: subscription.organizationId,
        subscriptionId: new mongoose.Types.ObjectId(subscriptionId),
        amount: subscription.totalAmount,
        currency: subscription.currency,
        status: InvoiceStatus.OPEN,
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
        dueDate,
        items
      };

      return await this.createInvoice(invoiceData);
    } catch (error) {
      console.error('サブスクリプション請求書生成エラー:', error);
      throw error;
    }
  }

  /**
   * 期限切れの請求書を取得
   */
  async getOverdueInvoices(): Promise<IInvoice[]> {
    try {
      const today = new Date();
      
      return await Invoice.find({
        status: InvoiceStatus.OPEN,
        dueDate: { $lt: today }
      });
    } catch (error) {
      console.error('期限切れ請求書取得エラー:', error);
      throw error;
    }
  }

  /**
   * 期限切れの請求書を処理
   */
  async processOverdueInvoices(): Promise<void> {
    try {
      const overdueInvoices = await this.getOverdueInvoices();
      
      for (const invoice of overdueInvoices) {
        // 請求書IDが存在する場合のみ処理
        if (invoice._id) {
          const invoiceIdStr = invoice._id.toString();
          
          // 請求書ステータスを更新
          await this.updateInvoiceStatus(invoiceIdStr, InvoiceStatus.PAST_DUE);
          
          // 催促メールを送信
          await this.sendPaymentReminder(
            invoiceIdStr,
            '請求書の支払い期限が過ぎています。至急お支払いください。'
          );
        }
      }
    } catch (error) {
      console.error('期限切れ請求書処理エラー:', error);
      throw error;
    }
  }
}