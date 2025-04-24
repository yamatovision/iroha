import { Types } from 'mongoose';
import { User } from '../../models/User';
// 列挙型の代わりに直接文字列を使用（バンドル問題を回避）
const ChatModeEnum = {
  PERSONAL: 'personal',
  TEAM_MEMBER: 'team_member',
  TEAM_GOAL: 'team_goal'
};

// コンテキストタイプを直接定義（他のファイルと一致するように文字列値を使用）
export const ContextTypeEnum = {
  SELF: 'self',
  FRIEND: 'friend',
  FORTUNE: 'fortune'
};

// 実際に使用する文字列値
const CONTEXT_TYPE = {
  self: 'self',        
  friend: 'friend',
  fortune: 'fortune'
};
import { ChatMode, IContextItem, ContextType } from '../../types';
import logger from '../../utils/logger';
// ContextTypeを型として使わず、値としてのみ使用
import { Friendship } from '../../models/Friendship';
import { DailyFortune } from '../../models/DailyFortune';
import { DayPillar } from '../../models/DayPillar';
import { Team } from '../../models/Team';
import { TeamGoal } from '../../models/TeamGoal';
import { TeamMembership } from '../../models/TeamMembership';
import { UserGoal } from '../../models/UserGoal';

// MongoDB ID を安全に文字列に変換するヘルパー関数
function safeIdToString(id: unknown): string {
  if (!id) return '';
  
  if (typeof id === 'string') return id;
  
  // MongooseのObjectIDの場合
  if (id && typeof id === 'object' && 'toString' in id && typeof id.toString === 'function') {
    return id.toString();
  }
  
  return '';
}

/**
 * コンテキストビルダーサービス
 * チャットAIに提供するコンテキスト情報を構築するサービス
 */

export const contextBuilderService = {
  /**
   * 自分自身のコンテキスト情報を構築
   */
  async buildSelfContext(userId: string): Promise<any> {
    try {
      console.log(`buildSelfContext - ユーザーID: ${userId} で自分のコンテキストを構築します`);
      
      if (!userId) {
        throw new Error('無効なユーザーID: 空またはnullのIDが指定されました');
      }
      
      // ObjectIDへの変換を試みる
      let objectId;
      try {
        objectId = new Types.ObjectId(userId);
        console.log(`有効なObjectID形式: ${objectId}`);
      } catch (error) {
        throw new Error(`無効なObjectID形式: ${userId} - ${error instanceof Error ? error.message : String(error)}`);
      }
      
      const user = await User.findById(objectId);
      if (!user) {
        throw new Error(`ユーザーが見つかりません - ID: ${userId}`);
      }
      
      console.log(`ユーザー検索成功 - 名前: ${user.displayName || '未設定'}`);
      
      return {
        id: 'current_user',
        type: ContextTypeEnum.SELF,
        name: user.displayName || 'あなた',
        iconType: 'person',
        color: '#9c27b0',
        removable: false,
        payload: {
          id: safeIdToString(user._id),
          displayName: user.displayName || 'あなた',
          elementAttribute: user.elementAttribute,
          dayMaster: user.dayMaster,
          fourPillars: user.fourPillars,
          elementProfile: user.elementProfile,
          kakukyoku: user.kakukyoku,
          yojin: user.yojin
        }
      };
    } catch (error) {
      console.error(`buildSelfContext エラー - ${error instanceof Error ? error.message : String(error)}`);
      throw error; // 呼び出し元でもエラーをキャッチできるよう再スロー
    }
  },

  /**
   * 利用可能な友達コンテキスト情報を構築
   */
  async buildAvailableFriendsContexts(userId: string): Promise<any[]> {
    try {
      console.log(`buildAvailableFriendsContexts - ユーザーID: ${userId} の友達コンテキストを構築します`);
      
      if (!userId) {
        throw new Error('無効なユーザーID: 空またはnullのIDが指定されました');
      }

      // ObjectIDへの変換を試みる
      let objectId;
      try {
        objectId = new Types.ObjectId(userId);
        console.log(`有効なObjectID形式: ${objectId}`);
      } catch (error) {
        throw new Error(`無効なObjectID形式: ${userId} - ${error instanceof Error ? error.message : String(error)}`);
      }
      
      const friendships = await Friendship.find({
        $or: [
          { userId1: objectId, status: 'accepted' },
          { userId2: objectId, status: 'accepted' }
        ]
      });
      
      console.log(`友達関係データ取得完了 - ${friendships.length}件見つかりました`);

      const friendContexts: IContextItem[] = [];

    for (const friendship of friendships) {
      try {
        const friendId = friendship.userId1.toString() === userId 
          ? friendship.userId2.toString() 
          : friendship.userId1.toString();
        
        console.log(`友達ID処理: ${friendId}`);
        
        const friend = await User.findById(friendId);
        if (!friend) {
          console.log(`友達ID ${friendId} に対応するユーザーが見つかりません`);
          continue;
        }

        console.log(`友達データ取得完了 - 名前: ${friend.displayName || '未設定'}`);
        
        friendContexts.push({
          id: friendId,
          type: ContextTypeEnum.FRIEND,
          name: friend.displayName || `友達ID: ${friendId.substring(0, 8)}`,
          iconType: 'person',
          color: '#2196f3',
          removable: true,
          payload: {
            id: friendId,
            displayName: friend.displayName || `友達ID: ${friendId.substring(0, 8)}`,
            elementAttribute: friend.elementAttribute,
            dayMaster: friend.dayMaster,
            compatibility: friendship.compatibilityScore || 50
          }
        });
      } catch (itemError) {
        console.error(`友達データ処理エラー: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
        // 1つの友達処理でエラーが発生しても全体を中断しない
        continue;
      }
    }

    console.log(`友達コンテキスト構築完了 - ${friendContexts.length}件`);
    return friendContexts;
    } catch (error) {
      console.error(`buildAvailableFriendsContexts エラー - ${error instanceof Error ? error.message : String(error)}`);
      throw error; // 呼び出し元でもエラーをキャッチできるよう再スロー
    }
  },

  /**
   * 利用可能なチームコンテキスト情報を構築 (削除予定)
   */
  async buildAvailableTeamContexts(userId: string): Promise<any[]> {
    // チーム関連コンテキスト削除のため、空の配列を返す
    console.log(`buildAvailableTeamContexts - チーム関連コンテキストは削除されました`);
    return [];
  },

  /**
   * コンテキスト詳細情報を取得
   */
  async getContextDetail(userId: string, contextType: string, contextId: string): Promise<any> {
    const traceId = Math.random().toString(36).substring(2, 15);
    try {
      // コンテキストタイプを小文字に変換して正規化
      const type = String(contextType).toLowerCase();
      console.log(`[${traceId}] getContextDetail - type: ${type}, id: ${contextId || 'なし'}`);
      
      // 文字列比較を使用したswitch文
      switch (type) {
        case CONTEXT_TYPE.self: {
          // selfタイプの場合、IDに関わらずユーザー自身の情報を返す
          // current_userやundefined、null、userId自体など、いかなる値でも対応
          const user = await User.findById(userId);
          if (!user) throw new Error('ユーザーが見つかりません');
          
          // 最新の運勢情報を取得
          const fortune = await DailyFortune.findOne({ userId: user._id }).sort({ date: -1 });
          
          // ユーザーの目標情報を取得
          const UserGoal = require('../../models/UserGoal').UserGoal;
          const goals = await UserGoal.find({ userId: user._id });
          
          return {
            id: safeIdToString(user._id),
            type: CONTEXT_TYPE.self,
            name: user.displayName || 'あなた',
            details: {
              displayName: user.displayName || 'あなた',
              elementAttribute: user.elementAttribute || '',
              dayMaster: user.dayMaster || '',
              fortune: fortune ? {
                date: fortune.date,
                score: fortune.fortuneScore,
                luckyItems: fortune.luckyItems
              } : null,
              goals: goals && goals.length > 0 ? goals.map((goal: any) => ({
                type: goal.type,
                content: goal.content,
                deadline: goal.deadline
              })) : []
            }
          };
        }
        
        case CONTEXT_TYPE.friend: {
          const friend = await User.findById(contextId);
          if (!friend) throw new Error('友達が見つかりません');
          
          // 友達との相性情報を取得
          const userId1 = userId < contextId ? userId : contextId;
          const userId2 = userId < contextId ? contextId : userId;
          
          const Compatibility = require('../../models/Compatibility').Compatibility;
          const compatibility = await Compatibility.findOne({
            userId1: new Types.ObjectId(userId1),
            userId2: new Types.ObjectId(userId2)
          });
          
          return {
            id: safeIdToString(friend._id),
            type: CONTEXT_TYPE.friend,
            name: friend.displayName || '友達',
            details: {
              displayName: friend.displayName || '友達',
              elementAttribute: friend.elementAttribute || '',
              dayMaster: friend.dayMaster || '',
              compatibility: compatibility ? {
                score: compatibility.score,
                relationship: compatibility.relationType,
                description: compatibility.description
              } : {
                score: 50,
                relationship: 'neutral',
                description: '相性情報はまだ計算されていません'
              }
            }
          };
        }
        
        case CONTEXT_TYPE.fortune: {
          // 今日か明日の運勢情報を取得
          if (contextId === 'today' || contextId === 'tomorrow') {
            const user = await User.findById(userId);
            if (!user) throw new Error('ユーザーが見つかりません');
            
            // 今日の日付を基準に、今日または明日の運勢を取得
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const targetDate = new Date(today);
            if (contextId === 'tomorrow') {
              targetDate.setDate(targetDate.getDate() + 1);
            }
            
            // 日柱情報を取得
            const dayPillar = await DayPillar.findOne({
              date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) }
            });
            
            // 運勢情報を取得
            const fortune = await DailyFortune.findOne({
              userId: user._id,
              date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) }
            });
            
            return {
              id: contextId,
              type: CONTEXT_TYPE.fortune,
              name: contextId === 'today' ? '今日の運勢' : '明日の運勢',
              details: {
                date: targetDate.toISOString().split('T')[0],
                dayPillar: dayPillar ? {
                  heavenlyStem: dayPillar.heavenlyStem,
                  earthlyBranch: dayPillar.earthlyBranch,
                  hiddenStems: dayPillar.hiddenStems
                } : null,
                fortune: fortune ? {
                  score: fortune.fortuneScore,
                  luckyItems: fortune.luckyItems
                } : null
              }
            };
          }
          throw new Error('無効な運勢コンテキストIDです');
        }
        
        default:
          console.log(`[${traceId}] 未知または削除されたコンテキストタイプ: ${type}`);
          throw new Error(`サポートされていないコンテキストタイプです: ${type}`);
      }
    } catch (error) {
      console.error(`[${traceId}] コンテキスト詳細取得エラー:`, error);
      return null;
    }
  },

  /**
   * コンテキストアイテムを使用したメッセージ処理用のコンテキスト情報を構築
   */
  async processMessageWithContexts(
    userId: string,
    contextItems: { type: string; id?: string; additionalInfo?: any }[]
  ): Promise<Record<string, any>> {
    const traceId = Math.random().toString(36).substring(2, 15);
    console.log(`[${traceId}] processMessageWithContexts - ユーザーID: ${userId}, コンテキストアイテム数: ${contextItems.length}`);
    console.log(`[${traceId}] コンテキストタイプ: ${contextItems.map(item => item.type).join(', ')}`);

    // 基本コンテキスト情報を最初に初期化して外部スコープでも利用可能にする
    const context: Record<string, any> = {
      user: {
        displayName: 'ユーザー',
        elementAttribute: '',
        dayMaster: ''
      }
    };
      
    try {
      // ユーザーの検証と取得
      if (!userId) {
        throw new Error('無効なユーザーID: 空またはnullのIDが指定されました');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`ユーザーが見つかりません: ${userId}`);
      }

      console.log(`[${traceId}] ユーザー情報取得成功: ${user.displayName || userId}`);

      // 基本コンテキスト情報を更新
      context.user = {
        displayName: user.displayName || 'ユーザー',
        elementAttribute: user.elementAttribute || '',
        dayMaster: user.dayMaster || ''
      };

      // 各コンテキストアイテムを処理
      for (const item of contextItems) {
        try {
          if (!item || typeof item !== 'object') {
            console.error(`[${traceId}] 無効なコンテキストアイテム:`, item);
            continue;
          }

          // 型の検証と正規化
          const itemType = typeof item.type === 'string' ? item.type.toLowerCase() : '';
          const itemId = item.id || '';
          
          console.log(`[${traceId}] コンテキストアイテム処理 - タイプ: ${itemType}, ID: ${itemId || '未指定'}`);
          
          // 一部のコンテキストタイプではIDが不要な場合がある
          let detailContext = null;
          
          // 文字列比較に修正（列挙型との比較ではなく）
          if (itemId) {
            // IDがある場合は詳細情報を取得
            detailContext = await this.getContextDetail(userId, itemType, itemId);
          } else if (itemType === 'self') {
            // 自分自身の場合はIDがなくても問題ない
            detailContext = await this.getContextDetail(userId, 'self', 'current_user');
          }
          
          if (!detailContext && itemType !== 'self') {
            console.log(`[${traceId}] コンテキスト情報が見つかりません - タイプ: ${itemType}, ID: ${itemId || '未指定'}`);
            continue;
          }
          
          // 正規化された文字列値を使用してケース分けを行う
          switch (itemType) {
            case 'self': // 直接文字列で比較
              // 常に自分自身の詳細情報を拡張
              context.user = {
                ...context.user,
                pillars: user.fourPillars || {},
                kakukyoku: user.kakukyoku || null,
                yojin: user.yojin || null,
                elementProfile: user.elementProfile || null
              };
              
              if (detailContext?.details?.fortune) {
                context.dailyFortune = detailContext.details.fortune;
              }
              
              if (detailContext?.details?.goals && Array.isArray(detailContext.details.goals) && detailContext.details.goals.length > 0) {
                context.userGoals = detailContext.details.goals;
              }
              
              console.log(`[${traceId}] 自分自身のコンテキスト情報構築完了 - 名前: ${context.user.displayName}`);
              break;
              
            case 'friend': // 直接文字列で比較
              if (!context.friends) context.friends = [];
              if (detailContext?.details) {
                context.friends.push({
                  displayName: detailContext.details.displayName,
                  elementAttribute: detailContext.details.elementAttribute,
                  dayMaster: detailContext.details.dayMaster,
                  compatibility: detailContext.details.compatibility
                });
                console.log(`[${traceId}] 友達コンテキスト情報追加 - 名前: ${detailContext.details.displayName}`);
              }
              break;
              
            case 'fortune': // 直接文字列で比較
              if (detailContext?.details) {
                context.dailyFortune = detailContext.details.fortune;
                context.dayPillar = detailContext.details.dayPillar;
                context.fortuneDate = detailContext.details.date;
                console.log(`[${traceId}] 運勢コンテキスト情報構築完了 - 日付: ${detailContext.details.date}`);
              } else {
                // 今日の日付のデフォルト情報
                const today = new Date().toISOString().split('T')[0];
                context.fortuneDate = today;
                console.log(`[${traceId}] 運勢コンテキスト情報（デフォルト） - 日付: ${today}`);
              }
              break;
              
            default:
              console.log(`[${traceId}] 未知のコンテキストタイプ: ${itemType} - スキップします`);
              break;
          }
        } catch (itemError) {
          console.error(`[${traceId}] コンテキスト処理エラー (${item?.type || '不明'}, ${item?.id || '未指定'}):`, itemError);
          // コンテキスト一つの処理でエラーが発生しても全体を停止しない
          continue;
        }
      }

      console.log(`[${traceId}] コンテキスト情報構築完了 - キー: ${Object.keys(context).join(', ')}`);
      return context;
    } catch (error) {
      console.error(`[${traceId}] コンテキスト構築エラー:`, error);
      // contextはスコープ外で既に初期化済みなので、エラー時には現在のcontextを返す
      // これにより、部分的に処理できたデータは保持される
      console.log(`[${traceId}] エラー復旧: 部分的に構築されたコンテキスト情報を返します`);
      return context;
    }
  }
};

/**
 * チャットAIに提供するコンテキスト情報を構築するサービス
 * 従来のモードベースのコンテキスト構築（後方互換性のため維持）
 */
export async function buildChatContext(
  user: any,
  mode: ChatMode,
  contextInfo?: {
    memberId?: string;
    teamGoalId?: string;
  }
): Promise<Record<string, any>> {
  const traceId = Math.random().toString(36).substring(2, 15);
  
  // デバッグログを追加
  console.log(`[${traceId}] 🔧 buildChatContext - mode: ${mode}, typeof mode: ${typeof mode}`);
  console.log(`[${traceId}] 🔧 ChatMode列挙型の値:`, {
    personal: ChatModeEnum.PERSONAL,
    team_member: ChatModeEnum.TEAM_MEMBER,
    team_goal: ChatModeEnum.TEAM_GOAL,
    rawValue: mode
  });
  
  // 標準出力に直接ログを表示
  console.log(`[${traceId}] 🔧 チャットコンテキスト構築開始 - ユーザー: ${user.displayName}, モード: ${mode}`);
  
  try {
    let context;
    
    // 文字列としてモードを扱う（列挙型の問題を回避）
    const modeStr = String(mode).toLowerCase();
    
    if (modeStr === 'personal') {
      context = await buildPersonalContext(user);
    }
    else if (modeStr === 'team_member') {
      if (!contextInfo?.memberId) {
        throw new Error('チームメンバー相性相談にはメンバーIDが必要です');
      }
      context = await buildTeamMemberContext(user, contextInfo.memberId);
    }
    else if (modeStr === 'team_goal') {
      if (!contextInfo?.teamGoalId) {
        context = await buildTeamContext(user);
      } else {
        context = await buildTeamGoalContext(user, contextInfo.teamGoalId);
      }
    } else {
      // デフォルトケース
      context = {
        user: {
          displayName: user.displayName
        }
      };
    }
    
    // 四柱推命情報の確認
    const saju_info = {
      hasKakukyoku: context.user?.kakukyoku ? true : false,
      hasYojin: context.user?.yojin ? true : false,
      hasElementProfile: context.user?.elementProfile ? true : false,
      hasPillars: !!context.user?.pillars,
      hasDailyFortune: !!context.dailyFortune,
      userElementAttribute: context.user?.elementAttribute || 'なし',
      dayMaster: context.user?.dayMaster || 'なし'
    };
    
    console.log(`[${traceId}] 📊 コンテキスト構築完了 - データキー: ${Object.keys(context).join(', ')}`);
    console.log(`[${traceId}] 🔮 四柱推命情報:`, saju_info);
    
    if (context.dailyFortune) {
      console.log(`[${traceId}] 📅 日運情報あり - 日付: ${context.dailyFortune.date}, スコア: ${context.dailyFortune.fortuneScore || '不明'}`);
      console.log(`[${traceId}] 📊 日運データ詳細:`, JSON.stringify(context.dailyFortune, null, 2));
    } else {
      console.log(`[${traceId}] ⚠️ 日運情報なし`);
    }
    
    return context;
  } catch (error) {
    console.error(`[${traceId}] ❌ コンテキスト構築エラー:`, error instanceof Error ? error.message : String(error));
    
    // 最低限のコンテキスト情報を返す
    return {
      user: {
        displayName: user.displayName
      }
    };
  }
}

/**
 * 個人相談用のコンテキスト情報を構築
 */
async function buildPersonalContext(user: any): Promise<Record<string, any>> {
  try {
    // 運勢情報を取得
    const DailyFortune = require('../../models/DailyFortune').DailyFortune;
    const DayPillar = require('../../models/DayPillar').DayPillar;
    
    // 最新の運勢データを取得するように変更
    console.log(`🔍 ユーザー ${user._id} の最新運勢データを検索します`);
    const fortune = await DailyFortune.findOne({
      userId: user._id
    }).sort({ date: -1 }); // 日付の降順で並べ、最新のデータを取得
    
    // 日柱情報を取得して運勢情報に結合
    let dayPillarData = null;
    if (fortune && fortune.dayPillarId) {
      dayPillarData = await DayPillar.findById(fortune.dayPillarId);
      console.log('🔍 関連する日柱情報を取得:', dayPillarData ? 'あり' : 'なし');
    }
    
    if (fortune) {
      // UTCから日本時間への変換
      const utcDate = new Date(fortune.date);
      // 日本時間に変換（+9時間）
      const jstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
      
      console.log('🔍 日運情報DB取得結果:', JSON.stringify({
        date: fortune.date,
        dateUTC: utcDate.toISOString().split('T')[0],
        dateJST: jstDate.toISOString().split('T')[0],
        score: fortune.fortuneScore,
        dayPillarId: fortune.dayPillarId,
        luckyItemsKeys: fortune.luckyItems ? Object.keys(fortune.luckyItems) : []
      }, null, 2));
      
      // 詳細なデバッグ情報
      console.log('🔎 日運情報の詳細診断:');
      console.log('  - 日付(JST):', jstDate.toISOString().split('T')[0]);
      console.log('  - スコア情報:', fortune.fortuneScore === undefined ? '未設定' : fortune.fortuneScore);
      
      if (dayPillarData) {
        console.log('  - 日柱情報あり:',
          'heavenlyStem=', dayPillarData.heavenlyStem || '未設定',
          'earthlyBranch=', dayPillarData.earthlyBranch || '未設定',
          'hiddenStems=', (dayPillarData.hiddenStems && dayPillarData.hiddenStems.length) || '未設定'
        );
      } else {
        console.log('  - 日柱情報なし または 日柱IDが見つかりません');
      }
      
      // luckyItems の確認
      if (fortune.luckyItems) {
        console.log('  - ラッキーアイテム情報あり:', Object.keys(fortune.luckyItems).join(', '));
      } else {
        console.log('  - ラッキーアイテム情報なし');
      }
    } else {
      console.log('⚠️ 日運情報がDBに見つかりませんでした');
    }

    // 目標情報を取得
    const UserGoal = require('../../models/UserGoal').UserGoal;
    let goals = [];
    try {
      // MongoDBのObjectIDとして目標を取得
      goals = await UserGoal.find({ userId: user._id });
    } catch (error: any) {
      console.error('目標情報の取得に失敗:', error?.message || 'エラー詳細なし');
      goals = [];
    }

    // チーム情報を取得
    let team = null;
    let teamGoals = [];
    
    if (user.teamId) {
      const Team = require('../../models/Team').Team;
      team = await Team.findById(user.teamId);
      
      if (team) {
        const TeamGoal = require('../../models/TeamGoal').TeamGoal;
        teamGoals = await TeamGoal.find({ teamId: team._id });
      }
    }

    // コンテキスト情報を構築
    return {
      user: {
        displayName: user.displayName,
        elementAttribute: user.elementAttribute,
        dayMaster: user.dayMaster,
        jobTitle: user.jobTitle || '',
        pillars: user.fourPillars || {},
        // 格局情報を追加
        kakukyoku: user.kakukyoku || null,
        // 用神情報を追加
        yojin: user.yojin || null,
        // 五行バランス情報を追加
        elementProfile: user.elementProfile || null
      },
      dailyFortune: fortune ? {
        date: new Date(fortune.date.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0], // JST変換
        dayPillar: dayPillarData ? {
          heavenlyStem: dayPillarData.heavenlyStem,
          earthlyBranch: dayPillarData.earthlyBranch,
          hiddenStems: dayPillarData.hiddenStems
        } : null,
        fortuneScore: fortune.fortuneScore,
        luckyItems: fortune.luckyItems
      } : null,
      userGoals: goals.map((goal: any) => ({
        type: goal.type,
        content: goal.content,
        deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null
      })),
      team: team ? {
        name: team.name,
        role: user.jobTitle || ''
      } : null,
      teamGoals: teamGoals.map((goal: any) => ({
        content: goal.content,
        deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null
      }))
    };
  } catch (error) {
    console.error('Build personal context error:', error);
    // 最低限のコンテキスト情報を返す
    return {
      user: {
        displayName: user.displayName,
        elementAttribute: user.elementAttribute || 'unknown'
      }
    };
  }
}

/**
 * チームメンバー相性相談用のコンテキスト情報を構築
 */
async function buildTeamMemberContext(user: any, memberId: string): Promise<Record<string, any>> {
  try {
    // メンバー情報を取得
    const targetMember = await User.findById(memberId);
    if (!targetMember) {
      throw new Error('指定されたチームメンバーが見つかりません');
    }

    // 相性情報を取得
    const Compatibility = require('../../models/Compatibility').Compatibility;
    
    // userId1には常に小さいIDを、userId2には大きいIDを設定するルールがあるため
    const userId1 = user._id.toString() < memberId ? user._id : new Types.ObjectId(memberId);
    const userId2 = user._id.toString() < memberId ? new Types.ObjectId(memberId) : user._id;
    
    const compatibility = await Compatibility.findOne({
      userId1,
      userId2
    });

    // 日柱情報を取得
    const DayPillar = require('../../models/DayPillar').DayPillar;
    
    // 最新の日柱データを取得するように変更
    console.log(`🔍 チームメンバーモード: 最新の日柱データを検索します`);
    const dayPillar = await DayPillar.findOne({}).sort({ date: -1 });
    
    console.log('🔍 日柱情報の取得結果:', dayPillar ? 'あり' : 'なし');

    // チーム目標情報を取得
    let teamGoals = [];
    
    if (user.teamId) {
      const TeamGoal = require('../../models/TeamGoal').TeamGoal;
      teamGoals = await TeamGoal.find({ teamId: user.teamId });
    }

    // コンテキスト情報を構築
    return {
      user: {
        displayName: user.displayName,
        elementAttribute: user.elementAttribute,
        dayMaster: user.dayMaster,
        pillars: user.fourPillars || {},
        jobTitle: user.jobTitle || ''
      },
      targetMember: {
        displayName: targetMember.displayName,
        elementAttribute: targetMember.elementAttribute,
        dayMaster: targetMember.dayMaster,
        pillars: targetMember.fourPillars || {},
        jobTitle: targetMember.jobTitle || ''
      },
      compatibility: compatibility ? {
        score: compatibility.score,
        relationship: compatibility.relationType,
        detailDescription: compatibility.description
      } : {
        score: 50,
        relationship: 'neutral',
        detailDescription: '相性情報はまだ計算されていません'
      },
      todaysEnergy: dayPillar ? {
        date: dayPillar.date.toISOString().split('T')[0],
        dayPillar: {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch,
          hiddenStems: dayPillar.hiddenStems
        }
      } : null,
      teamGoals: teamGoals.map((goal: any) => ({
        content: goal.content,
        deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null
      }))
    };
  } catch (error) {
    console.error('Build team member context error:', error);
    // 最低限のコンテキスト情報を返す
    return {
      user: {
        displayName: user.displayName,
        elementAttribute: user.elementAttribute || 'unknown'
      }
    };
  }
}

/**
 * チーム目標相談用のコンテキスト情報を構築
 */
async function buildTeamGoalContext(user: any, teamGoalId: string): Promise<Record<string, any>> {
  try {
    // チーム目標情報を取得
    const TeamGoal = require('../../models/TeamGoal').TeamGoal;
    const teamGoal = await TeamGoal.findById(teamGoalId);
    if (!teamGoal) {
      throw new Error('指定されたチーム目標が見つかりません');
    }

    // チーム情報を取得
    const Team = require('../../models/Team').Team;
    const team = await Team.findById(user.teamId);
    if (!team) {
      throw new Error('チーム情報が見つかりません');
    }

    // チームメンバー情報を取得
    const teamMembers = await User.find({ teamId: team._id });

    // 日柱情報を取得
    const DayPillar = require('../../models/DayPillar').DayPillar;
    
    // 最新の日柱データを取得するように変更
    console.log(`🔍 チームメンバーモード: 最新の日柱データを検索します`);
    const dayPillar = await DayPillar.findOne({}).sort({ date: -1 });
    
    console.log('🔍 日柱情報の取得結果:', dayPillar ? 'あり' : 'なし');

    // コンテキスト情報を構築
    return {
      user: {
        displayName: user.displayName,
        elementAttribute: user.elementAttribute,
        dayMaster: user.dayMaster,
        jobTitle: user.jobTitle || '',
        pillars: { day: user.fourPillars?.day || {} }
      },
      team: {
        name: team.name,
        size: teamMembers.length
      },
      teamGoal: {
        content: teamGoal.content,
        deadline: teamGoal.deadline ? teamGoal.deadline.toISOString().split('T')[0] : null
      },
      teamMembers: teamMembers.map(member => ({
        displayName: member.displayName,
        elementAttribute: member.elementAttribute,
        jobTitle: member.jobTitle || '',
        dayMaster: member.dayMaster
      })),
      todaysEnergy: dayPillar ? {
        date: dayPillar.date.toISOString().split('T')[0],
        dayPillar: {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch,
          hiddenStems: dayPillar.hiddenStems
        }
      } : null
    };
  } catch (error) {
    console.error('Build team goal context error:', error);
    // 最低限のコンテキスト情報を返す
    return {
      user: {
        displayName: user.displayName
      }
    };
  }
}

/**
 * チーム相談用の基本コンテキスト情報を構築
 */
async function buildTeamContext(user: any): Promise<Record<string, any>> {
  try {
    // チーム情報を取得
    const Team = require('../../models/Team').Team;
    const team = await Team.findById(user.teamId);
    if (!team) {
      throw new Error('チーム情報が見つかりません');
    }

    // チームメンバー情報を取得
    const teamMembers = await User.find({ teamId: team._id });

    // 日柱情報を取得
    const DayPillar = require('../../models/DayPillar').DayPillar;
    
    // 最新の日柱データを取得するように変更
    console.log(`🔍 チームメンバーモード: 最新の日柱データを検索します`);
    const dayPillar = await DayPillar.findOne({}).sort({ date: -1 });
    
    console.log('🔍 日柱情報の取得結果:', dayPillar ? 'あり' : 'なし');

    // チーム目標情報を取得
    const TeamGoal = require('../../models/TeamGoal').TeamGoal;
    const teamGoals = await TeamGoal.find({ teamId: team._id });

    // コンテキスト情報を構築
    return {
      user: {
        displayName: user.displayName,
        elementAttribute: user.elementAttribute,
        dayMaster: user.dayMaster,
        jobTitle: user.jobTitle || '',
        pillars: { day: user.fourPillars?.day || {} }
      },
      team: {
        name: team.name,
        size: teamMembers.length
      },
      teamGoals: teamGoals.map((goal: any) => ({
        content: goal.content,
        deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null
      })),
      teamMembers: teamMembers.map(member => ({
        displayName: member.displayName,
        elementAttribute: member.elementAttribute,
        jobTitle: member.jobTitle || '',
        dayMaster: member.dayMaster
      })),
      todaysEnergy: dayPillar ? {
        date: dayPillar.date.toISOString().split('T')[0],
        dayPillar: {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch,
          hiddenStems: dayPillar.hiddenStems
        }
      } : null
    };
  } catch (error) {
    console.error('Build team context error:', error);
    // 最低限のコンテキスト情報を返す
    return {
      user: {
        displayName: user.displayName
      }
    };
  }
}