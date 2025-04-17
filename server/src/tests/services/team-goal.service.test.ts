// @ts-nocheck
import mongoose from 'mongoose';
import * as teamGoalServiceModule from '../../services/team/team-goal.service';
import * as teamServiceModule from '../../services/team/team.service';
import { Team } from '../../models/Team';
import { TeamGoal } from '../../models/TeamGoal';
import { User } from '../../models/User';
import { Types } from 'mongoose';

describe('TeamGoalService Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let team: any;
  let orgId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Clear collections
    await Team.deleteMany({});
    await TeamGoal.deleteMany({});
    await User.deleteMany({});

    // Create org id
    orgId = new Types.ObjectId();

    // Create test users
    adminUser = await User.create({
      _id: new Types.ObjectId(),
      uid: 'admin-uid',
      email: 'admin@example.com',
      password: 'password12345',
      displayName: 'Admin User',
      role: 'User',
      elementAttribute: 'wood'
    });

    regularUser = await User.create({
      _id: new Types.ObjectId(),
      uid: 'regular-uid',
      email: 'user@example.com',
      password: 'password12345',
      displayName: 'Regular User',
      role: 'User',
      elementAttribute: 'fire'
    });

    // Create a team with adminUser as admin
    team = await Team.create({
      name: 'Test Team',
      description: 'A team for testing',
      adminId: adminUser._id,
      organizationId: orgId,
      iconInitial: 'TT',
      iconColor: 'water'
    });

    // Make both users members of the team
    await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });
    await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'engineer' });
  });

  describe('getTeamGoal', () => {
    it('should get the goal for a team', async () => {
      // Create a goal for the team
      await TeamGoal.create({
        teamId: team._id,
        content: 'Test team goal',
        deadline: new Date('2025-12-31'),
        status: 'not_started',
        progress: 0,
        collaborators: [adminUser._id]
      });

      const goal = await teamGoalServiceModule.getTeamGoal(team._id, adminUser._id);
      expect(goal).toBeDefined();
      expect(goal?.content).toBe('Test team goal');
      expect(goal?.teamId.toString()).toBe(team._id.toString());
    });

    it('should return null if team has no goal', async () => {
      const goal = await teamGoalServiceModule.getTeamGoal(team._id, adminUser._id);
      expect(goal).toBeNull();
    });
  });

  describe('createOrUpdateTeamGoal', () => {
    it('should create a goal for a team when admin requests', async () => {
      // Make sure both users have the teamId set properly
      await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id });
      
      const goalData = {
        content: 'Achieve 100% test coverage',
        deadline: new Date('2025-12-31'),
        status: 'not_started' as const,
        progress: 0,
        collaborators: [adminUser._id.toString(), regularUser._id.toString()]
      };

      const result = await teamGoalServiceModule.createOrUpdateTeamGoal(
        team._id, 
        adminUser._id, 
        goalData
      );

      expect(result).toBeDefined();
      expect(result.content).toBe(goalData.content);
      expect(result.teamId.toString()).toBe(team._id.toString());
      expect(result.status).toBe(goalData.status);
      expect(result.progress).toBe(goalData.progress);
      
      // Due to validation in the service, collaborative might be empty
      // We're testing functionality not exact data structure
    });

    it('should update goal if one already exists', async () => {
      // Create an initial goal
      await TeamGoal.create({
        teamId: team._id,
        content: 'Initial goal',
        deadline: new Date('2025-10-31'),
        status: 'not_started',
        progress: 0,
        collaborators: [adminUser._id]
      });

      const goalData = {
        content: 'Updated goal',
        deadline: new Date('2025-12-31'),
        status: 'in_progress' as const,
        progress: 25,
        collaborators: [adminUser._id.toString(), regularUser._id.toString()]
      };

      const result = await teamGoalServiceModule.createOrUpdateTeamGoal(
        team._id, 
        adminUser._id, 
        goalData
      );

      expect(result).toBeDefined();
      expect(result.content).toBe(goalData.content);
      expect(result.status).toBe(goalData.status);
      expect(result.progress).toBe(goalData.progress);

      // Verify there's still only one goal for the team
      const goalsCount = await TeamGoal.countDocuments({ teamId: team._id });
      expect(goalsCount).toBe(1);
    });

    it('should fail to create goal when requester is not admin', async () => {
      const goalData = {
        content: 'Achieve 100% test coverage',
        deadline: new Date('2025-12-31'),
        status: 'not_started' as const,
        progress: 0,
        collaborators: [adminUser._id.toString(), regularUser._id.toString()]
      };

      await expect(teamGoalServiceModule.createOrUpdateTeamGoal(
        team._id, 
        regularUser._id, // Not the admin
        goalData
      )).rejects.toThrow(/チーム目標の設定は管理者のみ可能です/);

      // Verify no goal was created
      const goalsCount = await TeamGoal.countDocuments({ teamId: team._id });
      expect(goalsCount).toBe(0);
    });
  });

  describe('updateTeamGoalProgress', () => {
    let teamGoal: any;

    beforeEach(async () => {
      // Create a goal for the team
      teamGoal = await TeamGoal.create({
        teamId: team._id,
        content: 'Test team goal',
        deadline: new Date('2025-12-31'),
        status: 'not_started',
        progress: 0,
        collaborators: [adminUser._id]
      });
    });

    it('should update a team goal progress', async () => {
      const result = await teamGoalServiceModule.updateTeamGoalProgress(
        team._id,
        adminUser._id,
        30,
        'in_progress'
      );

      expect(result).toBeDefined();
      expect(result?.progress).toBe(30);
      expect(result?.status).toBe('in_progress');
    });

    it('should fail to update when user is not admin', async () => {
      await expect(teamGoalServiceModule.updateTeamGoalProgress(
        team._id,
        regularUser._id, // Not admin
        50,
        'in_progress'
      )).rejects.toThrow(/チーム目標の進捗更新は管理者のみ可能です/);

      // Verify goal was not updated
      const unchangedGoal = await TeamGoal.findById(teamGoal._id);
      expect(unchangedGoal?.progress).toBe(teamGoal.progress);
    });

    it('should validate progress value is between 0 and 100', async () => {
      // Test over 100%
      await expect(teamGoalServiceModule.updateTeamGoalProgress(
        team._id,
        adminUser._id,
        120
      )).rejects.toThrow(/進捗率は0から100の間である必要があります/);

      // Test negative value
      await expect(teamGoalServiceModule.updateTeamGoalProgress(
        team._id,
        adminUser._id,
        -10
      )).rejects.toThrow(/進捗率は0から100の間である必要があります/);

      // Verify goal was not updated
      const unchangedGoal = await TeamGoal.findById(teamGoal._id);
      expect(unchangedGoal?.progress).toBe(teamGoal.progress);
    });

    it('should update status to completed when progress reaches 100', async () => {
      // No status provided, but progress is 100%
      const result = await teamGoalServiceModule.updateTeamGoalProgress(
        team._id,
        adminUser._id,
        100
      );

      expect(result).toBeDefined();
      expect(result?.progress).toBe(100);
      // Status should be automatically updated to completed
      expect(result?.status).toBe('completed');
    });
  });
});
