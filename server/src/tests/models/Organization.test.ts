import mongoose from 'mongoose';
import { Organization, IOrganization } from '../../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

// テスト用のモックデータ
const mockOrganization: Partial<IOrganization> = {
  name: 'テスト組織',
  superAdminId: new mongoose.Types.ObjectId(),
  subscriptionPlan: {
    type: 'active',
    isActive: true,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  billingInfo: {
    companyName: 'テスト株式会社',
    contactName: '担当者 太郎',
    contactEmail: 'test@example.com',
    address: '東京都渋谷区',
    postalCode: '150-0001',
    country: 'Japan',
    taxId: 'T1234567890'
  }
};

describe('Organization Model', () => {
  // 各テスト後にメモリDBをクリア
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('有効な組織を作成できること', async () => {
    const validOrg = new Organization(mockOrganization);
    const savedOrg = await validOrg.validateSync();
    
    expect(savedOrg).toBeUndefined(); // バリデーションエラーがないこと
    expect(validOrg.name).toBe(mockOrganization.name);
    expect(validOrg.superAdminId).toEqual(mockOrganization.superAdminId);
    expect(validOrg.subscriptionPlan.isActive).toBe(true);
  });

  it('組織名が必須であること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      name: undefined
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.name).toBeDefined();
  });

  it('組織名が最小長より短い場合エラーになること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      name: 'A' // 1文字は短すぎる
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.name).toBeDefined();
  });

  it('組織名が最大長を超える場合エラーになること', async () => {
    const longName = 'A'.repeat(101); // 101文字（最大は100文字）
    const invalidOrg = new Organization({
      ...mockOrganization,
      name: longName
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.name).toBeDefined();
  });

  it('スーパー管理者IDが必須であること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      superAdminId: undefined
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.superAdminId).toBeDefined();
  });

  it('請求先担当者名が必須であること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      billingInfo: {
        ...mockOrganization.billingInfo,
        contactName: undefined
      }
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['billingInfo.contactName']).toBeDefined();
  });

  it('請求先メールアドレスが必須であること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      billingInfo: {
        ...mockOrganization.billingInfo,
        contactEmail: undefined
      }
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['billingInfo.contactEmail']).toBeDefined();
  });

  it('無効なメールアドレスはエラーになること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      billingInfo: {
        ...mockOrganization.billingInfo,
        contactEmail: 'invalid-email'
      }
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['billingInfo.contactEmail']).toBeDefined();
  });

  it('サブスクリプションタイプは列挙値のみ許可されること', async () => {
    const invalidOrg = new Organization({
      ...mockOrganization,
      subscriptionPlan: {
        ...mockOrganization.subscriptionPlan,
        type: 'invalid_type' // 無効な値
      }
    });

    const validationError = invalidOrg.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['subscriptionPlan.type']).toBeDefined();
  });

  // デフォルト値のテスト
  it('サブスクリプションプランのデフォルト値が正しく設定されること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const OrganizationModel = conn.model('Organization', Organization.schema);
    
    // サブスクリプションプランを指定せずに組織を作成
    const orgWithoutSubscription = new OrganizationModel({
      name: 'デフォルト値テスト組織',
      superAdminId: new mongoose.Types.ObjectId(),
      billingInfo: {
        contactName: '担当者 花子',
        contactEmail: 'hanako@example.com'
      }
    });
    
    // 保存前
    // デフォルト値が設定されていることを確認
    expect(orgWithoutSubscription.subscriptionPlan.type).toBe('none');
    expect(orgWithoutSubscription.subscriptionPlan.isActive).toBe(false);
    expect(orgWithoutSubscription.subscriptionPlan.currentPeriodStart).toBeInstanceOf(Date);
    expect(orgWithoutSubscription.subscriptionPlan.currentPeriodEnd).toBeInstanceOf(Date);
    
    // 現在日付と期間終了日の差が約30日であることを確認
    const daysDiff = Math.ceil(
      (orgWithoutSubscription.subscriptionPlan.currentPeriodEnd.getTime() - 
       orgWithoutSubscription.subscriptionPlan.currentPeriodStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    expect(daysDiff).toBeCloseTo(30, 0); // 30日前後であることを確認
    
    // 請求情報のデフォルト値も確認
    expect(orgWithoutSubscription.billingInfo.country).toBe('Japan');
    
    // 保存
    await orgWithoutSubscription.save();
    
    // 保存後もデフォルト値が維持されていることを確認
    expect(orgWithoutSubscription.subscriptionPlan.type).toBe('none');
    expect(orgWithoutSubscription.subscriptionPlan.isActive).toBe(false);
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
});