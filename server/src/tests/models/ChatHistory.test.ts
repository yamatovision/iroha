import mongoose from 'mongoose';
import { ChatHistory, IChatHistory } from '../../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

// テスト用のモックデータ
const mockChatHistory: Partial<IChatHistory> = {
  userId: new mongoose.Types.ObjectId(),
  chatType: 'personal',
  messages: [
    {
      sender: 'user',
      content: 'こんにちは',
      timestamp: new Date()
    },
    {
      sender: 'ai',
      content: 'いかがお過ごしですか？',
      timestamp: new Date()
    }
  ],
  tokenCount: 50,
  contextData: { userInfo: { name: 'テストユーザー' } },
  aiModel: 'haiku',
  lastMessageAt: new Date()
};

// チームメンバー相談用モックデータ
const mockTeamMemberChat: Partial<IChatHistory> = {
  ...mockChatHistory,
  chatType: 'team_member',
  relatedInfo: {
    teamMemberId: new mongoose.Types.ObjectId()
  }
};

// チーム目標相談用モックデータ
const mockTeamGoalChat: Partial<IChatHistory> = {
  ...mockChatHistory,
  chatType: 'team_goal',
  relatedInfo: {
    teamGoalId: new mongoose.Types.ObjectId()
  }
};

describe('ChatHistory Model', () => {
  // 各テスト後にメモリDBをクリア
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('有効な個人相談チャット履歴を作成できること', async () => {
    const validChat = new ChatHistory(mockChatHistory);
    const savedChat = await validChat.validateSync();
    
    expect(savedChat).toBeUndefined(); // バリデーションエラーがないこと
    expect(validChat.chatType).toBe(mockChatHistory.chatType);
    expect(validChat.messages.length).toBe(mockChatHistory.messages?.length);
  });

  it('有効なチームメンバー相談チャット履歴を作成できること', async () => {
    const validChat = new ChatHistory(mockTeamMemberChat);
    const savedChat = await validChat.validateSync();
    
    expect(savedChat).toBeUndefined(); // バリデーションエラーがないこと
    expect(validChat.chatType).toBe('team_member');
    expect(validChat.relatedInfo?.teamMemberId).toBeDefined();
  });

  it('有効なチーム目標相談チャット履歴を作成できること', async () => {
    const validChat = new ChatHistory(mockTeamGoalChat);
    const savedChat = await validChat.validateSync();
    
    expect(savedChat).toBeUndefined(); // バリデーションエラーがないこと
    expect(validChat.chatType).toBe('team_goal');
    expect(validChat.relatedInfo?.teamGoalId).toBeDefined();
  });

  it('ユーザーIDが必須であること', async () => {
    const invalidChat = new ChatHistory({
      ...mockChatHistory,
      userId: undefined
    });

    const validationError = invalidChat.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.userId).toBeDefined();
  });

  it('チャットタイプが必須であること', async () => {
    const invalidChat = new ChatHistory({
      ...mockChatHistory,
      chatType: undefined
    });

    const validationError = invalidChat.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.chatType).toBeDefined();
  });

  it('チャットタイプが列挙値のみ許可されること', async () => {
    const invalidChat = new ChatHistory({
      ...mockChatHistory,
      chatType: 'invalid'
    });

    const validationError = invalidChat.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.chatType).toBeDefined();
  });

  it('AIモデルが必須であること', async () => {
    const invalidChat = new ChatHistory({
      ...mockChatHistory,
      aiModel: undefined
    });

    const validationError = invalidChat.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.aiModel).toBeDefined();
  });

  it('AIモデルが列挙値のみ許可されること', async () => {
    const invalidChat = new ChatHistory({
      ...mockChatHistory,
      aiModel: 'invalid'
    });

    const validationError = invalidChat.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors.aiModel).toBeDefined();
  });

  it('チームメンバーチャット時にチームメンバーIDが必要であること - バリデーション', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットだがチームメンバーIDがない
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: {} // teamMemberIdがない
    });
    
    // 保存して検証フックがエラーを返すことを確認
    try {
      await invalidChat.save();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チームメンバーチャットにはチームメンバーIDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);

  it('チーム目標チャット時にチーム目標IDが必要であること - バリデーション', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットだがチーム目標IDがない
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: {} // teamGoalIdがない
    });
    
    // 保存して検証フックがエラーを返すことを確認
    try {
      await invalidChat.save();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チーム目標チャットにはチーム目標IDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);

  // 有効なケースでの保存も確認
  it('有効なチャット履歴が保存できること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // 個人チャット（関連情報不要）
    const personalChat = new ChatHistoryModel(mockChatHistory);
    await personalChat.save();
    expect(personalChat._id).toBeDefined();
    
    // チームメンバーチャット（チームメンバーID必須）
    const teamMemberChat = new ChatHistoryModel(mockTeamMemberChat);
    await teamMemberChat.save();
    expect(teamMemberChat._id).toBeDefined();
    
    // チーム目標チャット（チーム目標ID必須）
    const teamGoalChat = new ChatHistoryModel(mockTeamGoalChat);
    await teamGoalChat.save();
    expect(teamGoalChat._id).toBeDefined();
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // バリデーションフックの「何もエラーがない」パスをテスト
  it('パーソナルチャットではrelatedInfoが不要であること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // バリデーションフックが通過するかテスト
    const spy = jest.spyOn(console, 'log');
    
    // パーソナルチャットを作成 - relatedInfoなし
    const personalChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'personal',
      relatedInfo: undefined // 明示的にundefinedに設定
    });
    
    console.log('バリデーションフックをテスト中');
    
    // validateメソッドを直接呼び出してフックをトリガー
    await personalChat.validate();
    
    // バリデーションエラーが発生しないことを確認
    await personalChat.save(); // エラーが発生しなければ成功
    
    // スパイをリセット
    spy.mockRestore();
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チームメンバーチャット用のチーム目標IDが指定された場合のテスト
  it('チームメンバーチャットでチーム目標IDを指定した場合でもチームメンバーIDが必要', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットだがチームメンバーIDの代わりにチーム目標IDが設定されている
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: {
        teamGoalId: new mongoose.Types.ObjectId() // チーム目標IDは設定されているが、チームメンバーIDがない
      }
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チームメンバーチャットにはチームメンバーIDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チーム目標チャット用のチームメンバーIDが指定された場合のテスト
  it('チーム目標チャットでチームメンバーIDを指定した場合でもチーム目標IDが必要', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットだがチーム目標IDの代わりにチームメンバーIDが設定されている
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: {
        teamMemberId: new mongoose.Types.ObjectId() // チームメンバーIDは設定されているが、チーム目標IDがない
      }
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チーム目標チャットにはチーム目標IDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チームメンバーチャットで空のrelatedInfoがある場合のテスト
  it('チームメンバーチャットで空のrelatedInfoがある場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットでrelatedInfoがあるが、teamMemberIdがない
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: {} // 空のオブジェクト（teamMemberIdなし）
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チームメンバーチャットにはチームメンバーIDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チームメンバーチャットでrelatedInfoがundefinedの場合のテスト
  it('チームメンバーチャットでrelatedInfoがundefinedの場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットでrelatedInfoが完全にundefined
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: undefined // 完全に未定義
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チームメンバーチャットにはチームメンバーIDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チームメンバーチャットで正しいrelatedInfoがある場合のテスト（条件分岐の別ルート）
  it('チームメンバーチャットで正しいrelatedInfoがある場合エラーにならないこと', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットで正しいrelatedInfoを持つ
    const validChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: { 
        teamMemberId: new mongoose.Types.ObjectId() // 正しくteamMemberIdを設定
      }
    });
    
    // バリデーションエラーが発生しないことを確認
    await validChat.validate(); // エラーが投げられなければOK
    await validChat.save();
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チーム目標チャットで空のrelatedInfoがある場合のテスト
  it('チーム目標チャットで空のrelatedInfoがある場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットでrelatedInfoがあるが、teamGoalIdがない
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: {} // 空のオブジェクト（teamGoalIdなし）
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チーム目標チャットにはチーム目標IDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チーム目標チャットでrelatedInfoがundefinedの場合のテスト
  it('チーム目標チャットでrelatedInfoがundefinedの場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットでrelatedInfoが完全にundefined
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: undefined // 完全に未定義
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チーム目標チャットにはチーム目標IDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チーム目標チャットで正しいrelatedInfoがある場合のテスト（条件分岐の別ルート）
  it('チーム目標チャットで正しいrelatedInfoがある場合エラーにならないこと', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットで正しいrelatedInfoを持つ
    const validChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: { 
        teamGoalId: new mongoose.Types.ObjectId() // 正しくteamGoalIdを設定
      }
    });
    
    // バリデーションエラーが発生しないことを確認
    await validChat.validate(); // エラーが投げられなければOK
    await validChat.save();
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チームメンバーチャットでteamMemberIdがnullの場合のテスト
  it('チームメンバーチャットでteamMemberIdがnullの場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットでteamMemberIdがnull
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: { 
        teamMemberId: null // 明示的にnullを設定
      }
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チームメンバーチャットにはチームメンバーIDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チーム目標チャットでteamGoalIdがnullの場合のテスト
  it('チーム目標チャットでteamGoalIdがnullの場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットでteamGoalIdがnull
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: { 
        teamGoalId: null // 明示的にnullを設定
      }
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チーム目標チャットにはチーム目標IDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チームメンバーチャットでrelatedInfoがnullの場合のテスト
  it('チームメンバーチャットでrelatedInfoがnullの場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チームメンバーチャットでrelatedInfoがnull
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_member',
      relatedInfo: null // 明示的にnullを設定
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チームメンバーチャットにはチームメンバーIDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
  
  // チーム目標チャットでrelatedInfoがnullの場合のテスト
  it('チーム目標チャットでrelatedInfoがnullの場合エラーになること', async () => {
    // モンゴDBメモリサーバーを準備
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 一時的な接続を確立
    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const ChatHistoryModel = conn.model('ChatHistory', ChatHistory.schema);
    
    // チーム目標チャットでrelatedInfoがnull
    const invalidChat = new ChatHistoryModel({
      ...mockChatHistory,
      chatType: 'team_goal',
      relatedInfo: null // 明示的にnullを設定
    });
    
    // バリデーションエラーが発生することを確認
    try {
      await invalidChat.validate();
      fail('バリデーションエラーが発生すべきです');
    } catch (error: any) {
      expect(error.message).toContain('チーム目標チャットにはチーム目標IDが必要です');
    }
    
    // クリーンアップ
    await conn.close();
    await mongoServer.stop();
  }, 10000);
});