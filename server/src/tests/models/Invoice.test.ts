import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

// テスト用のモックデータ
const mockInvoice: Partial<IInvoice> = {
  organizationId: new mongoose.Types.ObjectId(),
  subscriptionId: new mongoose.Types.ObjectId(),
  invoiceNumber: 'INV-2025-0001',
  amount: 97000,
  currency: 'JPY',
  status: 'draft',
  billingPeriodStart: new Date('2025-04-01'),
  billingPeriodEnd: new Date('2025-04-30'),
  dueDate: new Date('2025-05-15'),
  items: [
    {
      description: 'エリートプラン x 2ユーザー',
      quantity: 2,
      unitPrice: 9700,
      amount: 19400
    },
    {
      description: 'ライトプラン x 8ユーザー',
      quantity: 8,
      unitPrice: 1500,
      amount: 12000
    }
  ]
};

describe('Invoice Model', () => {
  // 各テスト後にメモリDBをクリア
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('有効な請求書を作成できること', async () => {
    const validInvoice = new Invoice(mockInvoice);
    const savedInvoice = await validInvoice.validateSync();
    
    expect(savedInvoice).toBeUndefined(); // バリデーションエラーがないこと
    expect(validInvoice.invoiceNumber).toBe(mockInvoice.invoiceNumber);
    expect(validInvoice.amount).toBe(mockInvoice.amount);
    expect(validInvoice.status).toBe('draft'); // デフォルト値
  });

  it('組織IDが必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      organizationId: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.organizationId).toBeDefined();
  });

  it('サブスクリプションIDが必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      subscriptionId: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.subscriptionId).toBeDefined();
  });

  it('請求書番号が必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      invoiceNumber: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.invoiceNumber).toBeDefined();
  });

  it('金額が必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      amount: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.amount).toBeDefined();
  });

  it('金額が0未満の場合エラーになること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      amount: -1
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.amount).toBeDefined();
  });

  it('通貨がデフォルト値を持つこと', async () => {
    const invoiceWithoutCurrency = new Invoice({
      ...mockInvoice,
      currency: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(invoiceWithoutCurrency.currency).toBe('JPY');
  });

  it('ステータスがデフォルト値を持つこと', async () => {
    const invoiceWithoutStatus = new Invoice({
      ...mockInvoice,
      status: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(invoiceWithoutStatus.status).toBe('draft');
  });

  it('ステータスが列挙値のみ許可されること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      status: 'invalid'
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.status).toBeDefined();
  });

  it('請求期間開始日が必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      billingPeriodStart: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.billingPeriodStart).toBeDefined();
  });

  it('請求期間終了日が必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      billingPeriodEnd: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.billingPeriodEnd).toBeDefined();
  });

  it('支払期限が必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      dueDate: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.dueDate).toBeDefined();
  });

  it('請求項目が必須であること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      items: undefined
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.items).toBeDefined();
  });

  it('請求項目が空の場合エラーになること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      items: []
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.items).toBeDefined();
  });

  it('請求項目のバリデーションが正しく行われること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      items: [
        {
          // 説明が欠けている
          quantity: 2,
          unitPrice: 9700,
          amount: 19400
        } as any
      ]
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['items.0.description']).toBeDefined();
  });

  it('請求項目の数量が0以下の場合エラーになること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      items: [
        {
          description: 'テスト項目',
          quantity: 0, // 無効な値
          unitPrice: 1000,
          amount: 0
        }
      ]
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['items.0.quantity']).toBeDefined();
  });

  it('請求項目の単価が0未満の場合エラーになること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      items: [
        {
          description: 'テスト項目',
          quantity: 1,
          unitPrice: -1, // 無効な値
          amount: -1
        }
      ]
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['items.0.unitPrice']).toBeDefined();
  });

  it('請求項目の金額が0未満の場合エラーになること', async () => {
    const invalidInvoice = new Invoice({
      ...mockInvoice,
      items: [
        {
          description: 'テスト項目',
          quantity: 1,
          unitPrice: 1000,
          amount: -1 // 無効な値
        }
      ]
    });

    const validationError = invalidInvoice.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['items.0.amount']).toBeDefined();
  });

  // デフォルト値のテスト
  it('デフォルト値が正しく設定されること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const InvoiceModel = conn.model('Invoice', Invoice.schema);
    
    // 最小限の設定で請求書を作成
    const minimalInvoice = new InvoiceModel({
      organizationId: new mongoose.Types.ObjectId(),
      subscriptionId: new mongoose.Types.ObjectId(),
      invoiceNumber: 'INV-TEST-001',
      amount: 10000,
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(),
      dueDate: new Date(),
      items: [
        {
          description: 'テスト項目',
          quantity: 1,
          unitPrice: 10000,
          amount: 10000
        }
      ]
    });
    
    // 保存前
    expect(minimalInvoice.currency).toBe('JPY'); // デフォルト通貨
    expect(minimalInvoice.status).toBe('draft'); // デフォルトステータス
    
    // 保存
    await minimalInvoice.save();
    
    // 保存後もデフォルト値が維持されていることを確認
    expect(minimalInvoice.currency).toBe('JPY');
    expect(minimalInvoice.status).toBe('draft');
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
});