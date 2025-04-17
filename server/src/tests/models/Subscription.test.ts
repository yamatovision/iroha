import mongoose from 'mongoose';
import { Subscription, ISubscription } from '../../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

// テスト用のモックデータ
const mockSubscription: Partial<ISubscription> = {
  organizationId: new mongoose.Types.ObjectId(),
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
  cancelAtPeriodEnd: false,
  priceId: 'price_standard_monthly',
  quantity: 10,
  totalAmount: 97000, // 9,700円 x 10ユーザー
  currency: 'JPY',
  adminCount: 2,
  userCount: 8
};

describe('Subscription Model', () => {
  // 各テスト後にメモリDBをクリア
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('有効なサブスクリプションを作成できること', async () => {
    const validSubscription = new Subscription(mockSubscription);
    const savedSubscription = await validSubscription.validateSync();
    
    expect(savedSubscription).toBeUndefined(); // バリデーションエラーがないこと
    expect(validSubscription.status).toBe(mockSubscription.status);
    expect(validSubscription.quantity).toBe(mockSubscription.quantity);
    expect(validSubscription.currency).toBe('JPY'); // デフォルト値
  });

  it('organizationIdが必須であること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      organizationId: undefined
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.organizationId).toBeDefined();
  });

  it('statusがデフォルト値を持つこと', async () => {
    const subscriptionWithoutStatus = new Subscription({
      ...mockSubscription,
      status: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(subscriptionWithoutStatus.status).toBe('incomplete');
  });

  it('statusが列挙値のみ許可されること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      status: 'invalid'
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.status).toBeDefined();
  });

  it('期間開始日がデフォルト値を持つこと', async () => {
    const subscriptionWithoutStartDate = new Subscription({
      ...mockSubscription,
      currentPeriodStart: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(subscriptionWithoutStartDate.currentPeriodStart).toBeInstanceOf(Date);
  });

  it('期間終了日がデフォルト値を持つこと', async () => {
    const subscriptionWithoutEndDate = new Subscription({
      ...mockSubscription,
      currentPeriodEnd: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(subscriptionWithoutEndDate.currentPeriodEnd).toBeInstanceOf(Date);
    
    // 期間開始日と期間終了日の差が約30日であることを確認
    const daysDiff = Math.ceil(
      (subscriptionWithoutEndDate.currentPeriodEnd.getTime() - subscriptionWithoutEndDate.currentPeriodStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    expect(daysDiff).toBeGreaterThanOrEqual(30); // 少なくとも30日であることを確認
    expect(daysDiff).toBeLessThanOrEqual(31); // 最大でも31日であることを確認
  });

  it('料金プランIDが必須であること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      priceId: undefined
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.priceId).toBeDefined();
  });

  it('ユーザー数が必須であること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      quantity: undefined
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.quantity).toBeDefined();
  });

  it('ユーザー数が1未満の場合エラーになること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      quantity: 0
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.quantity).toBeDefined();
  });

  it('合計金額が必須であること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      totalAmount: undefined
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.totalAmount).toBeDefined();
  });

  it('合計金額が0未満の場合エラーになること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      totalAmount: -1
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.totalAmount).toBeDefined();
  });

  it('通貨がデフォルト値を持つこと', async () => {
    const subscriptionWithoutCurrency = new Subscription({
      ...mockSubscription,
      currency: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(subscriptionWithoutCurrency.currency).toBe('JPY');
  });

  it('管理者数がデフォルト値を持つこと', async () => {
    const subscriptionWithoutAdminCount = new Subscription({
      ...mockSubscription,
      adminCount: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(subscriptionWithoutAdminCount.adminCount).toBe(0);
  });

  it('管理者数が0未満の場合エラーになること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      adminCount: -1
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.adminCount).toBeDefined();
  });

  it('ユーザー数がデフォルト値を持つこと', async () => {
    const subscriptionWithoutUserCount = new Subscription({
      ...mockSubscription,
      userCount: undefined
    });

    // デフォルト値が設定されていることを確認
    expect(subscriptionWithoutUserCount.userCount).toBe(0);
  });

  it('ユーザー数が0未満の場合エラーになること', async () => {
    const invalidSubscription = new Subscription({
      ...mockSubscription,
      userCount: -1
    });

    const validationError = invalidSubscription.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.userCount).toBeDefined();
  });

  // デフォルト値のテスト
  it('デフォルト値が正しく設定されること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const SubscriptionModel = conn.model('Subscription', Subscription.schema);
    
    // 最小限の設定でサブスクリプションを作成
    const minimalSubscription = new SubscriptionModel({
      organizationId: new mongoose.Types.ObjectId(),
      priceId: 'price_minimal',
      quantity: 5,
      totalAmount: 48500
    });
    
    // 保存前
    expect(minimalSubscription.status).toBe('incomplete'); // デフォルトステータス
    expect(minimalSubscription.currency).toBe('JPY'); // デフォルト通貨
    expect(minimalSubscription.cancelAtPeriodEnd).toBe(false); // デフォルト値
    expect(minimalSubscription.adminCount).toBe(0); // デフォルト値
    expect(minimalSubscription.userCount).toBe(0); // デフォルト値
    
    // 日付のデフォルト値もチェック
    expect(minimalSubscription.currentPeriodStart).toBeInstanceOf(Date);
    expect(minimalSubscription.currentPeriodEnd).toBeInstanceOf(Date);
    
    // 期間終了日が約30日後に設定されていることを確認
    const daysDiff = Math.ceil(
      (minimalSubscription.currentPeriodEnd.getTime() - minimalSubscription.currentPeriodStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    expect(daysDiff).toBeCloseTo(30, 0); // 30日前後であることを確認
    
    // 保存
    await minimalSubscription.save();
    
    // 保存後もデフォルト値が維持されていることを確認
    expect(minimalSubscription.status).toBe('incomplete');
    expect(minimalSubscription.currency).toBe('JPY');
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
});