import * as teamService from './team.service';
import * as teamMemberService from './team-member.service';
import * as teamGoalService from './team-goal.service';
import { compatibilityService } from './compatibility.service';
import { enhancedCompatibilityService } from './enhanced-compatibility.service';
// 新しいヘルパー関数を再エクスポート
import { isTeamAdmin, isTeamMember, getDefaultTeamId, getUserTeamRole } from '../team-membership-helpers';
export { isTeamAdmin, isTeamMember, getDefaultTeamId, getUserTeamRole };

// チームサービス関連をエクスポート
export { 
  teamService, 
  teamMemberService, 
  teamGoalService, 
  compatibilityService,
  enhancedCompatibilityService
};

// チーム操作に関する主要関数をダイレクトエクスポート
export const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  // isTeamAdmin と isTeamMember は team-membership-helpers.ts に移動
  addFriendToTeam,
  inviteUserByEmail,
  establishTeamFriendships,
  joinTeamByInvitation,
  getUserTeamsWithMemberships
} = teamService;

// チームメンバー操作に関する主要関数をダイレクトエクスポート
export const {
  getTeamMembers,
  addMemberById,
  addMember,
  updateMemberRole,
  removeMember,
  addFriendAsMember
} = teamMemberService;

// チーム目標関連の主要関数をダイレクトエクスポート
export const {
  createTeamGoal,
  getTeamGoals,
  getLatestTeamGoal,
  updateTeamGoal,
  deleteTeamGoal,
  getTeamGoalAdvice
} = teamGoalService;