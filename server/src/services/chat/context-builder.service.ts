import { Types } from 'mongoose';
import { User } from '../../models/User';
import { ChatMode } from '../../types';
import logger from '../../utils/logger';

/**
 * チャットAIに提供するコンテキスト情報を構築するサービス
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
  
  // 標準出力に直接ログを表示
  console.log(`[${traceId}] 🔧 チャットコンテキスト構築開始 - ユーザー: ${user.displayName}, モード: ${mode}`);
  
  try {
    let context;
    
    switch (mode) {
      case ChatMode.PERSONAL:
        context = await buildPersonalContext(user);
        break;
      
      case ChatMode.TEAM_MEMBER:
        if (!contextInfo?.memberId) {
          throw new Error('チームメンバー相性相談にはメンバーIDが必要です');
        }
        context = await buildTeamMemberContext(user, contextInfo.memberId);
        break;
      
      case ChatMode.TEAM_GOAL:
        if (!contextInfo?.teamGoalId) {
          context = await buildTeamContext(user);
        } else {
          context = await buildTeamGoalContext(user, contextInfo.teamGoalId);
        }
        break;
      
      default:
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fortune = await DailyFortune.findOne({
      userId: user._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // 日柱情報を取得して運勢情報に結合
    let dayPillarData = null;
    if (fortune && fortune.dayPillarId) {
      dayPillarData = await DayPillar.findById(fortune.dayPillarId);
      console.log('🔍 関連する日柱情報を取得:', dayPillarData ? 'あり' : 'なし');
    }
    
    if (fortune) {
      console.log('🔍 日運情報DB取得結果:', JSON.stringify({
        date: fortune.date,
        score: fortune.fortuneScore,
        dayPillarId: fortune.dayPillarId,
        luckyItemsKeys: fortune.luckyItems ? Object.keys(fortune.luckyItems) : []
      }, null, 2));
      
      // 詳細なデバッグ情報
      console.log('🔎 日運情報の詳細診断:');
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
        date: fortune.date.toISOString().split('T')[0],
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayPillar = await DayPillar.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayPillar = await DayPillar.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayPillar = await DayPillar.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
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