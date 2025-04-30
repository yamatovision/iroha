import mongoose, { Types } from 'mongoose';
import { ChatMode, IContextItem } from '../../types';
import { ChatHistory, IChatHistoryDocument } from '../../models/ChatHistory';
import { User } from '../../models/User';
import { generateChatResponse, ChatMessage } from '../ai-provider-adapter'; 
import { buildChatContext, contextBuilderService } from './context-builder.service';
import { CHAT_SYSTEM_PROMPT, createContextPrompt, formatChatHistory } from './chat-contexts';
import { claudeApiClient } from '../claude-api-client'; // 一時的に残す（ストリーミング用）
import logger from '../../utils/logger';

/**
 * ChatService - チャット機能の中核サービス
 * ユーザーのメッセージ処理、チャット履歴管理、AIレスポンス生成などを担当
 */
export class ChatService {
  /**
   * ユーザーを検索するヘルパー - MongoDB ObjectIDのみを使用
   * @param userId ユーザーID（MongoDBのObjectID）
   * @returns ユーザーオブジェクト
   */
  private async findUserById(userId: string): Promise<any> {
    try {
      return await User.findById(new mongoose.Types.ObjectId(userId));
    } catch (error) {
      console.error('User search error:', error);
      throw error;
    }
  }
  /**
   * 新しいメッセージを処理し、AI応答を返す
   */
  public async processMessage(
    userId: string,
    message: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    aiResponse: string;
    chatHistory: IChatHistoryDocument;
  }> {
    const traceId = Math.random().toString(36).substring(2, 15);
    
    try {
      // 処理開始のログ
      console.log(`[${traceId}] 🔄 チャットメッセージ処理開始 - ユーザーID: ${userId}, モード: ${mode}`);
      
      // ユーザー情報の取得（エリートかライトプランかを判断するため）
      // 柔軟な検索ヘルパーを使用
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      console.log(`[${traceId}] 👤 ユーザー情報取得完了 - 名前: ${user.displayName}, プラン: ${user.plan || 'standard'}`);

      // AIモデルの選択（エリートプランならSonnet、ライトプランならHaiku）
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // 関連情報の検証
      await this.validateContextInfo(mode, contextInfo);

      // アクティブなチャット履歴を取得または作成
      let chatHistory = await this.getOrCreateChatSession(userId, mode, contextInfo, aiModel) as IChatHistoryDocument;
      
      console.log(`[${traceId}] 📜 チャット履歴取得完了 - ID: ${chatHistory.id}, メッセージ数: ${chatHistory.messages.length}`);

      // ユーザーメッセージを追加
      this.addUserMessage(chatHistory, message);

      // チャットコンテキストの構築
      const context = await buildChatContext(user, mode, contextInfo);
      
      console.log(`[${traceId}] processMessage: コンテキストデータ確認:`, {
        contextKeys: Object.keys(context),
        contextType: typeof context,
        hasUser: !!context.user,
        modeUsed: mode,
        hasElementAttribute: context.user?.elementAttribute !== undefined,
        hasKakukyoku: context.user?.kakukyoku !== undefined,
        hasYojin: context.user?.yojin !== undefined
      });

      // コンテキストプロンプトの構築
      const contextPrompt = createContextPrompt(context);
      
      // メッセージをAPIフォーマットに変換（最初にコンテキストプロンプトを追加）
      const messages = [
        // 最初のメッセージとしてコンテキストプロンプトを追加
        {
          role: 'user' as const,
          content: contextPrompt
        },
        // AIからの応答としてウェルカムメッセージを追加（空の場合はスキップ）
        {
          role: 'assistant' as const,
          content: 'このコンテキスト情報を受け取りました。あなたの運勢情報を確認し、質問に対応いたします。'
        },
        // 実際のチャット履歴を追加
        ...chatHistory.messages.map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        }))
      ];
      
      // AI modelの選択
      const model = aiModel === 'sonnet' ? 'claude-3-7-sonnet-20250219' : 'claude-3-haiku-20240307';
      
      console.log(`[${traceId}] 🤖 通常モードでのAI API呼び出し開始 - モデル: ${model}`);
      
      const startTime = Date.now();
      
      // AIレスポンスの生成
      const aiResponse = await claudeApiClient.callAPI({
        messages,
        system: CHAT_SYSTEM_PROMPT,
        maxTokens: aiModel === 'sonnet' ? 4000 : 1500,
        model
      });
      
      const processingTime = Date.now() - startTime;
      
      console.log(`[${traceId}] ✅ AI API呼び出し完了 - レスポンス長: ${aiResponse.length}文字, 処理時間: ${processingTime}ms`);

      // AIレスポンスをチャット履歴に追加
      this.addAIMessage(chatHistory, aiResponse);

      // チャット履歴を保存
      await chatHistory.save();
      
      console.log(`[${traceId}] 💾 チャットメッセージ処理完了 - 合計メッセージ数: ${chatHistory.messages.length}`);

      return {
        aiResponse,
        chatHistory
      };
    } catch (error) {
      console.error(`[${traceId}] ❌ チャットメッセージ処理エラー:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 新しいメッセージを処理し、AI応答をストリーミングで返す
   */
  public async *streamMessage(
    userId: string,
    message: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): AsyncGenerator<string, { chatHistory: IChatHistoryDocument }, unknown> {
    const traceId = Math.random().toString(36).substring(2, 15);
    
    try {
      // 処理開始のログ
      console.log(`[${traceId}] 🔄 チャットストリーミング処理開始 - ユーザーID: ${userId}, モード: ${mode}`);
      
      // ユーザー情報の取得（エリートかライトプランかを判断するため）
      // 柔軟な検索ヘルパーを使用
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択（エリートプランならSonnet、ライトプランならHaiku）
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // 関連情報の検証
      await this.validateContextInfo(mode, contextInfo);

      // アクティブなチャット履歴を取得または作成
      let chatHistory = await this.getOrCreateChatSession(userId, mode, contextInfo, aiModel) as IChatHistoryDocument;
      
      console.log(`[${traceId}] 📜 チャット履歴取得完了 - ID: ${chatHistory.id}, メッセージ数: ${chatHistory.messages.length}`);

      // ユーザーメッセージを追加
      this.addUserMessage(chatHistory, message);

      // チャットコンテキストの構築
      const context = await buildChatContext(user, mode, contextInfo);
      
      console.log(`[${traceId}] streamMessage: コンテキストデータ確認:`, {
        contextKeys: Object.keys(context),
        contextType: typeof context,
        hasUser: !!context.user,
        modeUsed: mode,
        hasElementAttribute: context.user?.elementAttribute !== undefined,
        hasKakukyoku: context.user?.kakukyoku !== undefined,
        hasYojin: context.user?.yojin !== undefined
      });

      // コンテキストプロンプトの構築
      const contextPrompt = createContextPrompt(context);
      
      // メッセージと役割をマッピング（最初にコンテキストプロンプトを追加）
      const messages = [
        // 最初のメッセージとしてコンテキストプロンプトを追加
        {
          role: 'user' as const,
          content: contextPrompt
        },
        // AIからの応答としてウェルカムメッセージを追加
        {
          role: 'assistant' as const,
          content: 'このコンテキスト情報を受け取りました。あなたの運勢情報を確認し、質問に対応いたします。'
        },
        // 実際のチャット履歴を追加
        ...chatHistory.messages.map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        }))
      ];

      // トークン上限を調整
      const maxTokens = aiModel === 'haiku' ? 1500 : 4000;
      
      // AI modelの選択
      const model = aiModel === 'sonnet' ? 'claude-3-7-sonnet-20250219' : 'claude-3-haiku-20240307';
      
      console.log(`[${traceId}] 📝 コンテキスト構築完了 - コンテキスト情報キー: ${Object.keys(context).join(', ')}`);
      
      // 四柱推命情報の存在を確認して出力
      console.log(`[${traceId}] 🔮 四柱推命コンテキスト情報:`, {
        hasKakukyoku: context.user?.kakukyoku ? true : false,
        hasYojin: context.user?.yojin ? true : false,
        hasElementProfile: context.user?.elementProfile ? true : false,
        hasPillars: !!context.user?.pillars,
        hasDailyFortune: !!context.dailyFortune
      });
      
      console.log(`[${traceId}] 🤖 Streaming call to Claude API with model: ${model}`);
      
      // ストリーミングAPIを呼び出し
      let completeResponse = '';
      try {
        // ストリームジェネレータを作成
        const streamGenerator = claudeApiClient.streamAPI({
          messages: messages,
          system: CHAT_SYSTEM_PROMPT,
          maxTokens: maxTokens,
          model: model,
          stream: true
        });

        // チャンクを順次受け取り転送
        for await (const chunk of streamGenerator) {
          completeResponse += chunk;
          yield chunk;
        }
        
        console.log(`[${traceId}] ✅ ストリーミングレスポンス完了 - 合計文字数: ${completeResponse.length}文字`);
      } catch (error) {
        console.error(`[${traceId}] ❌ ストリーミングエラー:`, error);
        throw error;
      }

      // AIレスポンスをチャット履歴に追加
      this.addAIMessage(chatHistory, completeResponse);

      // チャット履歴を保存
      await chatHistory.save();
      
      console.log(`[${traceId}] 💾 チャット履歴保存完了 - 合計メッセージ数: ${chatHistory.messages.length}`);

      return { chatHistory };
    } catch (error) {
      console.error(`[${traceId}] ❌ チャットストリーミングサービスエラー:`, error);
      throw error;
    }
  }


  /**
   * チャットモードを切り替え、ウェルカムメッセージを返す
   */
  public async changeMode(
    userId: string,
    mode: string | ChatMode, // 文字列としても受け付けるように変更
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    welcomeMessage: string;
    chatHistory: IChatHistoryDocument;
  }> {
    try {
      console.log('ChatService.changeMode開始:', { userId, mode, contextInfoExists: !!contextInfo });
      
      // ユーザー情報の取得 - 柔軟な検索ヘルパーを使用
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // 関連情報の検証
      await this.validateContextInfo(mode, contextInfo);

      // 新しいチャットセッションを作成
      const chatHistory = await this.createNewChatSession(userId, mode, contextInfo, aiModel) as IChatHistoryDocument;

      // モードに応じたウェルカムメッセージを取得
      const welcomeMessage = await this.generateWelcomeMessage(mode, contextInfo);

      // AIメッセージとしてウェルカムメッセージを追加
      this.addAIMessage(chatHistory, welcomeMessage);

      // チャット履歴を保存
      await chatHistory.save();

      return {
        welcomeMessage,
        chatHistory
      };
    } catch (error) {
      console.error('Chat mode change error:', error);
      throw error;
    }
  }

  /**
   * チャット履歴を取得する
   */
  public async getChatHistory(
    userId: string,
    options: {
      mode?: ChatMode;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    chatHistories: IChatHistoryDocument[];
    total: number;
    hasMore: boolean;
  }> {
    const { mode, limit = 10, offset = 0 } = options;

    try {
      // クエリの構築
      const query: any = { userId }; // そのままuserIdを使用（文字列のまま）
      if (mode) {
        query.chatType = mode;
      }

      // 合計数の取得
      const total = await ChatHistory.countDocuments(query);

      // チャット履歴の取得
      const chatHistories = await ChatHistory.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        chatHistories,
        total,
        hasMore: offset + chatHistories.length < total
      };
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  /**
   * チャット履歴をクリアする
   */
  public async clearChatHistory(
    userId: string,
    options: {
      mode?: ChatMode;
      chatId?: string;
    } = {}
  ): Promise<{
    deletedCount: number;
  }> {
    const { mode, chatId } = options;

    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      let query: any = { userId: objectId };

      // 特定のチャットIDが指定されている場合
      if (chatId) {
        query._id = new Types.ObjectId(chatId);
      }
      // 特定のモードが指定されている場合
      else if (mode) {
        query.chatType = mode;
      }

      // チャット履歴の削除
      const result = await ChatHistory.deleteMany(query);

      return {
        deletedCount: result.deletedCount || 0
      };
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error;
    }
  }

  /**
   * アクティブなチャットセッションを取得または作成する
   */
  private async getOrCreateChatSession(
    userId: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    },
    aiModel: 'sonnet' | 'haiku' = 'haiku'
  ): Promise<IChatHistoryDocument> {
    // クエリの構築 - MongoDB ObjectIDを使用
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      chatType: mode
    };

    // relatedInfoの構築
    if (contextInfo) {
      if (mode === ChatMode.TEAM_MEMBER && contextInfo.memberId) {
        query['relatedInfo.teamMemberId'] = new Types.ObjectId(contextInfo.memberId);
      } else if (mode === ChatMode.TEAM_GOAL && contextInfo.teamGoalId) {
        query['relatedInfo.teamGoalId'] = new Types.ObjectId(contextInfo.teamGoalId);
      }
    }

    // 最新のチャット履歴を取得
    let chatHistory = await ChatHistory.findOne(query).sort({ lastMessageAt: -1 });

    // チャット履歴が存在しない場合は新規作成
    if (!chatHistory) {
      return await this.createNewChatSession(userId, mode, contextInfo, aiModel);
    }

    return chatHistory;
  }

  /**
   * 新しいチャットセッションを作成する
   */
  private async createNewChatSession(
    userId: string,
    mode: string | ChatMode, // 文字列としても受け付ける
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    },
    aiModel: 'sonnet' | 'haiku' = 'haiku'
  ): Promise<IChatHistoryDocument> {
    console.log('createNewChatSession開始:', { userId, mode, contextInfo, aiModel });
    
    // relatedInfoの構築
    const relatedInfo: any = {};
    if (contextInfo) {
      // 文字列として比較
      if (mode === 'team_member' && contextInfo.memberId) {
        relatedInfo.teamMemberId = new Types.ObjectId(contextInfo.memberId);
      } else if (mode === 'team_goal' && contextInfo.teamGoalId) {
        relatedInfo.teamGoalId = new Types.ObjectId(contextInfo.teamGoalId);
      }
    }

    // 新しいチャット履歴の作成
    const chatHistory = new ChatHistory({
      userId: new mongoose.Types.ObjectId(userId),
      chatType: mode,
      relatedInfo: Object.keys(relatedInfo).length > 0 ? relatedInfo : undefined,
      aiModel,
      messages: [],
      tokenCount: 0,
      contextData: {},
      lastMessageAt: new Date()
    });

    return chatHistory;
  }

  /**
   * ユーザーメッセージをチャット履歴に追加する
   */
  private addUserMessage(chatHistory: IChatHistoryDocument, message: string): void {
    chatHistory.messages.push({
      sender: 'user',
      content: message,
      timestamp: new Date()
    });
    chatHistory.lastMessageAt = new Date();
  }

  /**
   * AIメッセージをチャット履歴に追加する
   */
  private addAIMessage(chatHistory: IChatHistoryDocument, message: string): void {
    chatHistory.messages.push({
      sender: 'ai',
      content: message,
      timestamp: new Date()
    });
    chatHistory.lastMessageAt = new Date();

    // トークン数の簡易計算 (実際の実装ではもっと精密な計算が必要)
    chatHistory.tokenCount += this.estimateTokenCount(message);
  }

  /**
   * 簡易的なトークン数の計算
   */
  private estimateTokenCount(text: string): number {
    // 英語では単語数の約1.3倍がトークン数の目安
    // 日本語ではもっと複雑なので、文字数を4で割った値を使用
    return Math.ceil(text.length / 4);
  }

  /**
   * チャットモードに応じたウェルカムメッセージを生成
   */
  private async generateWelcomeMessage(
    mode: string | ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<string> {
    console.log('generateWelcomeMessage - モード:', mode);
    
    // 文字列として比較
    if (mode === 'personal') {
      return 'こんにちは。今日の運勢や個人的な質問について相談したいことがあれば、お気軽にお尋ねください。';
    } 
    else if (mode === 'team_member') {
      if (contextInfo?.memberId) {
        // メンバー名を取得 - 柔軟な検索を使用
        const member = await this.findUserById(contextInfo.memberId);
        if (member) {
          return `${member.displayName}さんとの相性について相談モードに切り替えました。何について知りたいですか？`;
        }
      }
      return 'チームメンバーとの相性について相談モードに切り替えました。相談したいメンバーを選択してください。';
    }
    else if (mode === 'team_goal') {
      return 'チーム目標達成のための相談モードに切り替えました。目標達成に向けたアドバイスが必要な場合は、具体的な状況を教えてください。';
    }
    else {
      // デフォルトのメッセージ
      return 'こんにちは。何かお手伝いできることはありますか？';
    }
  }

  /**
   * チャットモードに応じた関連情報の検証
   */
  private async validateContextInfo(
    mode: string | ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<void> {
    // 文字列に変換して小文字化（大文字小文字の違いを吸収）
    const modeStr = String(mode).toLowerCase();
    console.log('validateContextInfo - モード検証:', { mode, modeStr, contextType: typeof mode });
    
    // 文字列として比較して安全に処理
    if (modeStr === 'team_member' && contextInfo?.memberId) {
      // メンバーIDの検証
      console.log('チームメンバーモード - メンバーID検証:', contextInfo.memberId);
      const member = await User.findById(contextInfo.memberId);
      if (!member) {
        throw new Error('指定されたチームメンバーが見つかりません');
      }
    } else if (modeStr === 'team_goal' && contextInfo?.teamGoalId) {
      // チーム目標IDの検証
      console.log('チーム目標モード - 目標ID検証:', contextInfo.teamGoalId);
      const TeamGoal = require('../../models/TeamGoal').TeamGoal;
      const teamGoal = await TeamGoal.findById(contextInfo.teamGoalId);
      if (!teamGoal) {
        throw new Error('指定されたチーム目標が見つかりません');
      }
    }
  }

  /**
   * コンテキストアイテムを使用したメッセージ処理
   */
  public async processMessageWithContexts(
    userId: string,
    message: string,
    contextItems: { type: string; id?: string; additionalInfo?: any }[]
  ): Promise<{
    aiResponse: string;
    chatHistory: IChatHistoryDocument;
  }> {
    const traceId = Math.random().toString(36).substring(2, 15);
    
    try {
      console.log(`[${traceId}] 🔄 コンテキストベースのチャットメッセージ処理開始 - ユーザーID: ${userId}`);
      console.log(`[${traceId}] コンテキストアイテム:`, JSON.stringify(contextItems));
      
      // ユーザー情報の取得
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択（エリートプランならSonnet、ライトプランならHaiku）
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // アクティブなチャット履歴を取得または作成
      // 注意: コンテキストベースのチャット履歴は別のタイプで保存
      const chatSession = await this.getOrCreateContextBasedChatSession(userId, contextItems, aiModel);
      
      console.log(`[${traceId}] 📜 チャット履歴取得完了 - ID: ${chatSession.id}, メッセージ数: ${chatSession.messages.length}`);

      // ユーザーメッセージを追加
      this.addUserMessage(chatSession, message);
      
      try {
        // 実際のコンテキスト構築前にユーザー自身の基本情報が必ず含まれるようにする
        console.log(`[${traceId}] ⚠️ コンテキストタイプ検査 - ContextType値の確認`);
        for (const item of contextItems) {
          console.log(`[${traceId}] コンテキストアイテム: ${JSON.stringify(item)}`);
        }
        // コンテキストタイプ定義の問題を回避するため文字列として直接比較
        let hasCurrentUser = contextItems.some(item => item.type === 'self');
        let updatedContextItems = [...contextItems];
        
        // 自分情報がない場合は追加
        if (!hasCurrentUser) {
          updatedContextItems.unshift({
            type: 'self',
            id: 'current_user'
          });
          console.log(`[${traceId}] 自分の情報が含まれていなかったため追加しました`);
        }
        
        // コンテキストベースのコンテキスト構築
        let context = null;
        try {
          context = await contextBuilderService.processMessageWithContexts(userId, updatedContextItems);
          console.log(`[${traceId}] processMessageWithContexts: コンテキストデータ確認:`, {
            contextKeys: Object.keys(context),
            contextTypes: updatedContextItems.map(item => item.type).join(', '),
            itemCount: updatedContextItems.length
          });
        } catch (contextError) {
          console.error(`[${traceId}] コンテキスト構築エラー:`, contextError);
          // 最低限のコンテキスト情報を設定（エラー復旧）
          context = { 
            user: { 
              displayName: user.displayName || 'ユーザー',
              elementAttribute: user.elementAttribute || '',
              dayMaster: user.dayMaster || '' 
            } 
          };
          console.log(`[${traceId}] エラー復旧: 最低限のコンテキスト情報で続行します`);
        }
        
        // コンテキストプロンプトの構築
        const contextPrompt = createContextPrompt(context);
        
        // メッセージをAPIフォーマットに変換
        const messages = [
          // 最初のメッセージとしてコンテキストプロンプトを追加
          {
            role: 'user' as const,
            content: contextPrompt
          },
          // AIからの応答としてウェルカムメッセージを追加
          {
            role: 'assistant' as const,
            content: 'このコンテキスト情報を受け取りました。あなたの質問に対応いたします。'
          },
          // ユーザーとAIのやり取りを追加（最大3ターン分）
          ...chatSession.messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content
          }))
        ];
        
        // AI modelの選択
        const model = aiModel === 'sonnet' ? 'claude-3-7-sonnet-20250219' : 'claude-3-haiku-20240307';
        
        console.log(`[${traceId}] 🤖 コンテキストベースモードでのAI API呼び出し開始 - モデル: ${model}, メッセージ数: ${messages.length}`);
        
        const startTime = Date.now();
        
        // AIレスポンスの生成
        const aiResponse = await claudeApiClient.callAPI({
          messages,
          system: CHAT_SYSTEM_PROMPT,
          maxTokens: aiModel === 'sonnet' ? 4000 : 1500,
          model
        });
        
        const processingTime = Date.now() - startTime;
        
        console.log(`[${traceId}] ✅ AI API呼び出し完了 - レスポンス長: ${aiResponse.length}文字, 処理時間: ${processingTime}ms`);
        
        // AIレスポンスをチャット履歴に追加
        this.addAIMessage(chatSession, aiResponse);
        
        // チャット履歴のコンテキスト情報を保存
        chatSession.contextData = {
          contextItems: updatedContextItems 
        };
        
        // チャット履歴を保存
        await chatSession.save();
        
        console.log(`[${traceId}] 💾 チャットメッセージ処理完了 - 合計メッセージ数: ${chatSession.messages.length}`);
        
        return {
          aiResponse,
          chatHistory: chatSession
        };
      } catch (contextError) {
        console.error(`[${traceId}] ❌ コンテキスト処理エラー:`, contextError);
        
        // エラーが発生した場合でも、フォールバックとして基本的な返答を生成
        const fallbackResponse = "申し訳ありません。コンテキスト情報の処理中にエラーが発生しました。もう一度お試しいただくか、別のコンテキストでお試しください。";
        
        // エラーメッセージをチャット履歴に追加
        this.addAIMessage(chatSession, fallbackResponse);
        await chatSession.save();
        
        console.log(`[${traceId}] ⚠️ フォールバック応答を返します`);
        
        return {
          aiResponse: fallbackResponse,
          chatHistory: chatSession
        };
      }
    } catch (error) {
      console.error(`[${traceId}] ❌ コンテキストベースのチャットメッセージ処理エラー:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * コンテキストアイテムを使用したストリーミングメッセージ処理
   */
  public async *streamMessageWithContexts(
    userId: string,
    message: string,
    contextItems: { type: string; id?: string; additionalInfo?: any }[]
  ): AsyncGenerator<string, { chatHistory: IChatHistoryDocument }, unknown> {
    const traceId = Math.random().toString(36).substring(2, 15);
    
    try {
      console.log(`[${traceId}] 🔄 コンテキストベースのチャットストリーミング処理開始 - ユーザーID: ${userId}`);
      console.log(`[${traceId}] コンテキストアイテム:`, JSON.stringify(contextItems));
      
      // ユーザー情報の取得
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // アクティブなチャット履歴を取得または作成
      const chatSession = await this.getOrCreateContextBasedChatSession(userId, contextItems, aiModel);
      
      console.log(`[${traceId}] 📜 チャット履歴取得完了 - ID: ${chatSession.id}, メッセージ数: ${chatSession.messages.length}`);

      // ユーザーメッセージを追加
      this.addUserMessage(chatSession, message);

      try {
        // 実際のコンテキスト構築前にユーザー自身の基本情報が必ず含まれるようにする
        console.log(`[${traceId}] ⚠️ コンテキストタイプ検査 - ContextType値の確認`);
        for (const item of contextItems) {
          console.log(`[${traceId}] コンテキストアイテム: ${JSON.stringify(item)}`);
        }
        // コンテキストタイプ定義の問題を回避するため文字列として直接比較
        let hasCurrentUser = contextItems.some(item => item.type === 'self');
        let updatedContextItems = [...contextItems];
        
        // 自分情報がない場合は追加
        if (!hasCurrentUser) {
          updatedContextItems.unshift({
            type: 'self',
            id: 'current_user'
          });
          console.log(`[${traceId}] 自分の情報が含まれていなかったため追加しました`);
        }

        // コンテキストベースのコンテキスト構築
        let context = null;
        try {
          context = await contextBuilderService.processMessageWithContexts(userId, updatedContextItems);
          console.log(`[${traceId}] streamMessageWithContexts: コンテキストデータ確認:`, {
            contextKeys: Object.keys(context),
            contextTypes: updatedContextItems.map(item => item.type).join(', '),
            itemCount: updatedContextItems.length
          });
        } catch (contextError) {
          console.error(`[${traceId}] コンテキスト構築エラー:`, contextError);
          // 最低限のコンテキスト情報を設定（エラー復旧）
          context = { 
            user: { 
              displayName: user.displayName || 'ユーザー',
              elementAttribute: user.elementAttribute || '',
              dayMaster: user.dayMaster || '' 
            } 
          };
          console.log(`[${traceId}] エラー復旧: 最低限のコンテキスト情報で続行します`);
        }
  
        // コンテキストプロンプトの構築
        const contextPrompt = createContextPrompt(context);
        
        // メッセージをAPIフォーマットに変換
        const messages = [
          // 最初のメッセージとしてコンテキストプロンプトを追加
          {
            role: 'user' as const,
            content: contextPrompt
          },
          // AIからの応答としてウェルカムメッセージを追加
          {
            role: 'assistant' as const,
            content: 'このコンテキスト情報を受け取りました。あなたの質問に対応いたします。'
          },
          // ユーザーとAIのやり取りを追加（最大3ターン分）
          ...chatSession.messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content
          }))
        ];
        
        // AI modelとトークン上限の選択
        const model = aiModel === 'sonnet' ? 'claude-3-7-sonnet-20250219' : 'claude-3-haiku-20240307';
        const maxTokens = aiModel === 'sonnet' ? 4000 : 1500;
        
        console.log(`[${traceId}] 🤖 コンテキストベースのストリーミングAPI呼び出し開始 - モデル: ${model}, メッセージ数: ${messages.length}`);
        
        // ストリーミングAPIを呼び出し
        let completeResponse = '';
        try {
          // ストリームジェネレータを作成
          const streamGenerator = claudeApiClient.streamAPI({
            messages: messages,
            system: CHAT_SYSTEM_PROMPT,
            maxTokens: maxTokens,
            model: model,
            stream: true
          });
  
          // チャンクを順次受け取り転送
          for await (const chunk of streamGenerator) {
            completeResponse += chunk;
            yield chunk;
          }
          
          console.log(`[${traceId}] ✅ ストリーミングレスポンス完了 - 合計文字数: ${completeResponse.length}文字`);
        } catch (streamError) {
          console.error(`[${traceId}] ❌ ストリーミングエラー:`, streamError);
          
          // ストリーミングエラーの場合、エラーメッセージを生成
          const errorChunk = "申し訳ありません。ストリーミング処理中にエラーが発生しました。";
          completeResponse = errorChunk;
          yield errorChunk;
        }
  
        // AIレスポンスをチャット履歴に追加
        this.addAIMessage(chatSession, completeResponse);
  
        // チャット履歴のコンテキスト情報を保存
        chatSession.contextData = {
          contextItems: updatedContextItems
        };
  
        // チャット履歴を保存
        await chatSession.save();
        
        console.log(`[${traceId}] 💾 チャット履歴保存完了 - 合計メッセージ数: ${chatSession.messages.length}`);
  
        return { chatHistory: chatSession };
      } catch (contextError) {
        console.error(`[${traceId}] ❌ コンテキスト処理エラー:`, contextError);
        
        // エラーが発生した場合でも、フォールバックとして基本的な返答を生成
        const fallbackResponse = "申し訳ありません。コンテキスト情報の処理中にエラーが発生しました。";
        
        // エラーメッセージをチャット履歴に追加
        this.addAIMessage(chatSession, fallbackResponse);
        await chatSession.save();
        
        console.log(`[${traceId}] ⚠️ フォールバック応答をストリーミングします`);
        
        yield fallbackResponse;
        
        return { chatHistory: chatSession };
      }
    } catch (error) {
      console.error(`[${traceId}] ❌ コンテキストベースのチャットストリーミングエラー:`, error);
      
      // 深刻なエラーの場合でも最低限のレスポンスを返す
      yield "システムエラーが発生しました。しばらく経ってからお試しください。";
      
      throw error;
    }
  }

  /**
   * コンテキストベースのチャットセッションを取得または作成
   */
  private async getOrCreateContextBasedChatSession(
    userId: string,
    contextItems: { type: string; id?: string; additionalInfo?: any }[],
    aiModel: 'sonnet' | 'haiku' = 'haiku'
  ): Promise<IChatHistoryDocument> {
    // セッションタイプ（contextが常に最初にあることを想定）
    const mainContextType = contextItems.length > 0 ? contextItems[0].type : 'mixed';
    
    // クエリの構築
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      chatType: 'context_based',
      'contextData.contextItems': { $exists: true }
    };

    // 最新のチャット履歴を取得
    let chatHistory = await ChatHistory.findOne(query).sort({ lastMessageAt: -1 });

    // チャット履歴が存在しない場合は新規作成
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId: new mongoose.Types.ObjectId(userId),
        chatType: 'context_based',
        aiModel,
        messages: [],
        tokenCount: 0,
        contextData: {
          contextItems,
          mainContextType
        },
        lastMessageAt: new Date()
      });
    }

    return chatHistory;
  }
}

// シングルトンインスタンスのエクスポート
export const chatService = new ChatService();