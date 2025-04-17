import express from 'express';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';
import { 
  teamController, 
  teamMemberController, 
  teamGoalController,
  teamMemberCardController,
  compatibilityController
} from '../controllers/team';

// 拡張相性コントローラーを直接インポート
import { enhancedCompatibilityController } from '../controllers/team/enhanced-compatibility.controller';

const router = express.Router();

// チーム関連のルート
router.get('/', hybridAuthenticate, teamController.getTeams);
router.post('/', hybridAuthenticate, teamController.createTeam);
router.get('/:teamId', hybridAuthenticate, teamController.getTeamById);
router.put('/:teamId', hybridAuthenticate, teamController.updateTeam);
router.delete('/:teamId', hybridAuthenticate, teamController.deleteTeam);

// チームメンバー関連のルート
router.get('/:teamId/members', hybridAuthenticate, teamMemberController.getTeamMembers);
router.post('/:teamId/members', hybridAuthenticate, teamMemberController.addMember);
router.put('/:teamId/members/:userId/role', hybridAuthenticate, teamMemberController.updateMemberRole);
router.delete('/:teamId/members/:userId', hybridAuthenticate, teamMemberController.removeMember);

// メンバーカルテ関連のルート
router.get('/:teamId/members/:userId/card', hybridAuthenticate, teamMemberCardController.getMemberCard);
// テスト用エンドポイント - ルート直下に配置して動作を確認
router.get('/test-card', (req, res) => {
  console.log('テストカードエンドポイントにアクセスされました');
  res.status(200).json({ message: 'テストカードエンドポイントは正常に動作しています' });
});

// チーム目標関連のルート
router.get('/:teamId/goal', hybridAuthenticate, teamGoalController.getTeamGoal);
router.post('/:teamId/goal', hybridAuthenticate, teamGoalController.createOrUpdateTeamGoal);
router.put('/:teamId/goal/progress', hybridAuthenticate, teamGoalController.updateTeamGoalProgress);

// チーム相性関連のルート
router.get('/:teamId/compatibility', hybridAuthenticate, compatibilityController.getTeamCompatibilities);
router.get('/:teamId/compatibility/:userId1/:userId2', hybridAuthenticate, compatibilityController.getMemberCompatibility);

// 拡張チーム相性関連のルート
router.get('/:teamId/enhanced-compatibility', hybridAuthenticate, enhancedCompatibilityController.getTeamEnhancedCompatibilities);
router.get('/:teamId/enhanced-compatibility/:userId1/:userId2', hybridAuthenticate, enhancedCompatibilityController.getMemberEnhancedCompatibility);

export default router;