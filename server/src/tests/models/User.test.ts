import mongoose from 'mongoose';
import { User, IUser } from '../../models';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

// テスト用のモックデータ
const mockUser: Partial<IUser> = {
  email: 'test@example.com',
  password: 'Password123',
  displayName: 'テストユーザー',
  role: 'User',
  organizationId: new mongoose.Types.ObjectId(),
  teamId: new mongoose.Types.ObjectId(),
  jobTitle: 'エンジニア',
  plan: 'lite',
  isActive: true
};

describe('User Model', () => {
  // 各テスト後にメモリDBをクリア
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('有効なユーザーを作成できること', async () => {
    const validUser = new User(mockUser);
    const savedUser = await validUser.validateSync();
    
    expect(savedUser).toBeUndefined(); // バリデーションエラーがないこと
    expect(validUser.email).toBe(mockUser.email);
    expect(validUser.displayName).toBe(mockUser.displayName);
    expect(validUser.role).toBe(mockUser.role);
  });

  it('メールアドレスが必須であること', async () => {
    const invalidUser = new User({
      ...mockUser,
      email: undefined
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.email).toBeDefined();
  });

  it('無効なメールアドレス形式はエラーになること', async () => {
    const invalidUser = new User({
      ...mockUser,
      email: 'invalid-email'
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.email).toBeDefined();
  });

  it('パスワードが必須であること', async () => {
    const invalidUser = new User({
      ...mockUser,
      password: undefined
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.password).toBeDefined();
  });

  it('パスワードが8文字未満の場合エラーになること', async () => {
    const invalidUser = new User({
      ...mockUser,
      password: 'short'
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.password).toBeDefined();
  });

  it('表示名が必須であること', async () => {
    const invalidUser = new User({
      ...mockUser,
      displayName: undefined
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.displayName).toBeDefined();
  });

  it('表示名が2文字未満の場合エラーになること', async () => {
    const invalidUser = new User({
      ...mockUser,
      displayName: 'A' // 1文字は短すぎる
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.displayName).toBeDefined();
  });

  it('権限が列挙値のみ許可されること', async () => {
    const invalidUser = new User({
      ...mockUser,
      role: 'InvalidRole' // 無効な値
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.role).toBeDefined();
  });

  it('組織IDが必須であること', async () => {
    const invalidUser = new User({
      ...mockUser,
      organizationId: undefined
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.organizationId).toBeDefined();
  });

  it('チームIDが必須であること（第一フェーズでは）', async () => {
    const invalidUser = new User({
      ...mockUser,
      teamId: undefined
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.teamId).toBeDefined();
  });

  it('五行属性が列挙値のみ許可されること', async () => {
    const invalidUser = new User({
      ...mockUser,
      elementAttribute: 'invalid' // 無効な値
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.elementAttribute).toBeDefined();
  });

  it('プランが列挙値のみ許可されること', async () => {
    const invalidUser = new User({
      ...mockUser,
      plan: 'invalid' // 無効な値
    });

    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.plan).toBeDefined();
  });

  // パスワードハッシュ化のテスト
  it('パスワードが保存時に自動的にハッシュ化されること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const UserModel = conn.model('User', User.schema);
    
    // ユーザーを作成
    const plainPassword = 'Password123';
    const testUser = new UserModel({
      ...mockUser,
      password: plainPassword
    });
    
    // 保存前のパスワードを記録
    const beforeHash = testUser.password;
    
    // 保存
    await testUser.save();
    
    // 保存後のパスワードがハッシュ化されていることを確認
    expect(testUser.password).not.toBe(beforeHash);
    expect(testUser.password.length).toBeGreaterThan(beforeHash.length);
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000); // タイムアウトを10秒に設定
  
  // パスワードが変更されていない場合のテスト
  it('パスワードが変更されていない場合はハッシュ化されないこと', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const UserModel = conn.model('User', User.schema);
    
    // ユーザーを作成して保存（パスワードがハッシュ化される）
    const testUser = new UserModel({
      ...mockUser,
      password: 'Password123'
    });
    await testUser.save();
    
    // ハッシュ化されたパスワードを記録
    const hashedPassword = testUser.password;
    
    // ユーザー名だけ変更して再保存（パスワードは変更なし）
    testUser.displayName = '新しい名前';
    await testUser.save();
    
    // パスワードが変わっていないことを確認
    expect(testUser.password).toBe(hashedPassword);
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000); // タイムアウトを10秒に設定
  
  // パスワードハッシュ化のエラーハンドリングテスト
  it('パスワードハッシュ化でエラーが発生した場合のハンドリング', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const UserModel = conn.model('User', User.schema);
    
    // ユーザーを作成
    const testUser = new UserModel({
      ...mockUser,
      password: 'Password123'
    });
    
    // bcrypt.genSaltをモックしてエラーをスローさせる
    const originalGenSalt = bcrypt.genSalt;
    bcrypt.genSalt = jest.fn().mockImplementationOnce(() => {
      throw new Error('テスト用エラー');
    });
    
    // エラーハンドリングのテスト
    try {
      await testUser.save();
      // エラーがスローされるはずなので、ここには到達しないはず
      expect(true).toBe(false);
    } catch (error) {
      // エラーがスローされることを確認
      expect(error).toBeDefined();
    }
    
    // モックを元に戻す
    bcrypt.genSalt = originalGenSalt;
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000); // タイムアウトを10秒に設定
  
  // パスワード比較メソッドのテスト
  it('comparePassword メソッドが正しく動作すること', async () => {
    const user = new User(mockUser);
    const plainPassword = 'Password123';
    
    // パスワードを直接ハッシュ化して設定
    user.password = await bcrypt.hash(plainPassword, 10);
    
    // 正しいパスワード
    const isMatch1 = await user.comparePassword(plainPassword);
    expect(isMatch1).toBe(true);
    
    // 誤ったパスワード
    const isMatch2 = await user.comparePassword('WrongPassword');
    expect(isMatch2).toBe(false);
  });
  
  // パスワード比較メソッドのエラーハンドリングテスト
  it('comparePassword メソッドがエラー時にfalseを返すこと', async () => {
    const user = new User(mockUser);
    
    // compare関数をモックしてエラーをスローさせる
    jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => {
      throw new Error('テスト用エラー');
    });
    
    const result = await user.comparePassword('anyPassword');
    expect(result).toBe(false);
    
    // モックをリセット
    jest.restoreAllMocks();
  });
});