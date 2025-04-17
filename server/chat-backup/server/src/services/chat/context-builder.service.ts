import { Types } from 'mongoose';
import { User } from '../../models/User';
import { ChatMode } from '../../types';

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
  try {
    switch (mode) {
      case ChatMode.PERSONAL:
        return await buildPersonalContext(user);
      
      case ChatMode.TEAM_MEMBER:
        if (!contextInfo?.memberId) {
          throw new Error('チームメンバー相性相談にはメンバーIDが必要です');
        }
        return await buildTeamMemberContext(user, contextInfo.memberId);
      
      case ChatMode.TEAM_GOAL:
        if (!contextInfo?.teamGoalId) {
          const teamContext = await buildTeamContext(user);
          return teamContext;
        }
        return await buildTeamGoalContext(user, contextInfo.teamGoalId);
      
      default:
        return {
          user: {
            displayName: user.displayName
          }
        };
    }
  } catch (error) {
    console.error('Context builder error:', error);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fortune = await DailyFortune.findOne({
      userId: user._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // 目標情報を取得
    const UserGoal = require('../../models/UserGoal').UserGoal;
    const goals = await UserGoal.find({ userId: user._id });

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
        pillars: user.fourPillars || {}
      },
      dailyFortune: fortune ? {
        date: fortune.date.toISOString().split('T')[0],
        dayPillar: fortune.dayPillar,
        fortuneScore: fortune.score,
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