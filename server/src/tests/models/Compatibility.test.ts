import mongoose from 'mongoose';
import { Compatibility, ICompatibility } from '../../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

// テスト用のモックデータ
const mockCompatibility: Partial<ICompatibility> = {
  user1Id: new mongoose.Types.ObjectId(),
  user2Id: new mongoose.Types.ObjectId(),
  compatibilityScore: 75,
  relationship: 'mutual_generation',
  user1Element: 'wood',
  user2Element: 'fire',
  detailDescription: 'お互いを高め合う良い相性です。'
};

describe('Compatibility Model', () => {
  // 各テスト後にメモリDBをクリア
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('有効な相性データを作成できること', async () => {
    const validCompatibility = new Compatibility(mockCompatibility);
    const savedCompatibility = await validCompatibility.validateSync();
    
    expect(savedCompatibility).toBeUndefined(); // バリデーションエラーがないこと
    expect(validCompatibility.compatibilityScore).toBe(mockCompatibility.compatibilityScore);
    expect(validCompatibility.relationship).toBe(mockCompatibility.relationship);
  });

  it('user1Idが必須であること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      user1Id: undefined
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.user1Id).toBeDefined();
  });

  it('user2Idが必須であること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      user2Id: undefined
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.user2Id).toBeDefined();
  });

  it('相性スコアが必須であること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      compatibilityScore: undefined
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.compatibilityScore).toBeDefined();
  });

  it('相性スコアが0未満の場合エラーになること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      compatibilityScore: -1
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.compatibilityScore).toBeDefined();
  });

  it('相性スコアが100超の場合エラーになること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      compatibilityScore: 101
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.compatibilityScore).toBeDefined();
  });

  it('relationship列挙値がバリデーションされること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      relationship: 'invalid'
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.relationship).toBeDefined();
  });

  it('user1Elementがバリデーションされること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      user1Element: 'invalid'
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.user1Element).toBeDefined();
  });

  it('user2Elementがバリデーションされること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      user2Element: 'invalid'
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.user2Element).toBeDefined();
  });

  it('詳細説明が必須であること', async () => {
    const invalidCompatibility = new Compatibility({
      ...mockCompatibility,
      detailDescription: undefined
    });

    const validationError = invalidCompatibility.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.detailDescription).toBeDefined();
  });
  
  // save前のフックのテスト - user1Idとuser2Idの入れ替え
  it('save前にuser1Idが常に小さいIDになるよう入れ替えられること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const CompatibilityModel = conn.model('Compatibility', Compatibility.schema);
    
    // 大きいIDを先に設定したデータを作成
    const smallerId = new mongoose.Types.ObjectId();
    const largerId = new mongoose.Types.ObjectId(
      // 大きい値のIDを確実に作成
      smallerId.toString().replace(/[0-9a-f]/g, 'f')
    );
    
    // IDの大小関係を確認
    expect(largerId.toString() > smallerId.toString()).toBe(true);
    
    // 大きいIDを1番目に設定
    const testCompatibility = new CompatibilityModel({
      ...mockCompatibility,
      user1Id: largerId,
      user2Id: smallerId,
      user1Element: 'fire', // 1番目のユーザーの属性
      user2Element: 'wood'  // 2番目のユーザーの属性
    });
    
    // 保存
    await testCompatibility.save();
    
    // 保存後にIDが入れ替わっていることを確認
    expect(testCompatibility.user1Id.toString()).toBe(smallerId.toString());
    expect(testCompatibility.user2Id.toString()).toBe(largerId.toString());
    
    // 属性も入れ替わっていることを確認
    expect(testCompatibility.user1Element).toBe('wood');
    expect(testCompatibility.user2Element).toBe('fire');
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000); // タイムアウトを10秒に設定
  
  // IDが既に小さい順になっている場合は入れ替えられないこと
  it('user1Idが既に小さい場合は入れ替えられないこと', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const CompatibilityModel = conn.model('Compatibility', Compatibility.schema);
    
    // 小さいIDを先に設定したデータを作成
    const smallerId = new mongoose.Types.ObjectId();
    const largerId = new mongoose.Types.ObjectId(
      // 大きい値のIDを確実に作成
      smallerId.toString().replace(/[0-9a-f]/g, 'f')
    );
    
    // IDの大小関係を確認
    expect(smallerId.toString() < largerId.toString()).toBe(true);
    
    // 小さいIDを1番目に設定
    const testCompatibility = new CompatibilityModel({
      ...mockCompatibility,
      user1Id: smallerId,
      user2Id: largerId,
      user1Element: 'wood', // 1番目のユーザーの属性
      user2Element: 'fire'  // 2番目のユーザーの属性
    });
    
    // 保存
    await testCompatibility.save();
    
    // 保存後もIDが入れ替わっていないことを確認
    expect(testCompatibility.user1Id.toString()).toBe(smallerId.toString());
    expect(testCompatibility.user2Id.toString()).toBe(largerId.toString());
    
    // 属性も入れ替わっていないことを確認
    expect(testCompatibility.user1Element).toBe('wood');
    expect(testCompatibility.user2Element).toBe('fire');
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000); // タイムアウトを10秒に設定
});