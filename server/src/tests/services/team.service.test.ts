// @ts-nocheck - Test file with test doubles
import mongoose from 'mongoose';
import * as teamServiceModule from '../../services/team/team.service';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import { Types } from 'mongoose';

describe('TeamService Tests', () => {
  let adminUser: any;
  let regularUser: any;

  beforeEach(async () => {
    // Clear collections
    await Team.deleteMany({});
    await User.deleteMany({});

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
  });

  describe('createTeam', () => {
    it('should create a team and set user as admin', async () => {
      const teamData = {
        name: 'Test Team',
        description: 'A team for testing',
        iconInitial: 'TT',
        iconColor: 'water'
      };

      // Create a fake organization ID
      const orgId = new Types.ObjectId();

      const result = await teamServiceModule.createTeam(
        teamData.name,
        adminUser._id,
        orgId,
        teamData.description,
        teamData.iconColor as any
      );

      // Verify team creation
      expect(result).toBeDefined();
      expect(result.name).toBe(teamData.name);
      expect(result.description).toBe(teamData.description);
      expect(result.iconInitial).toBe('T'); // First letter of team name
      expect(result.iconColor).toBe(teamData.iconColor);
      expect(result.adminId.toString()).toBe(adminUser._id.toString());
    });

    it('should fail to create team with invalid data', async () => {
      // Create a fake organization ID
      const orgId = new Types.ObjectId();
      
      await expect(teamServiceModule.createTeam(
        '', // Empty name should fail validation
        adminUser._id,
        orgId,
        'A team for testing',
        'water' as any
      )).rejects.toThrow();
    });
  });

  describe('getTeams', () => {
    it('should get teams for a user', async () => {
      // Create a team with admin user as admin
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      // Assign team to user
      await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });

      const teams = await teamServiceModule.getTeams(adminUser._id);
      expect(teams).toHaveLength(1);
      if (teams[0]._id) {
        expect(teams[0]._id.toString()).toBe(team._id.toString());
      }
    });

    it('should return empty array when user has no teams', async () => {
      const teams = await teamServiceModule.getTeams(regularUser._id);
      expect(teams).toHaveLength(0);
    });
  });

  describe('getTeamById', () => {
    it('should get a team by id', async () => {
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      // Assign team to user
      await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });

      const result = await teamServiceModule.getTeamById(team._id, adminUser._id);
      expect(result).toBeDefined();
      if (result && result._id) {
        expect(result._id.toString()).toBe(team._id.toString());
      }
      expect(result?.name).toBe(team.name);
    });

    it('should throw not found for non-existent team', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await expect(teamServiceModule.getTeamById(nonExistentId, adminUser._id))
        .rejects.toThrow(/チームが見つかりません/);
    });
  });

  describe('updateTeam', () => {
    it('should update team when user is admin', async () => {
      // Create a team
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description',
        iconColor: 'fire' as const
      };

      const result = await teamServiceModule.updateTeam(
        team._id,
        adminUser._id,
        updateData
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.description).toBe(updateData.description);
      expect(result?.iconInitial).toBe('U'); // First letter of updated name
      expect(result?.iconColor).toBe(updateData.iconColor);
    });

    it('should not update team when user is not admin', async () => {
      // Create a team with adminUser as admin
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      const updateData = {
        name: 'Updated Team Name',
      };

      // Try to update using regularUser (who is not admin)
      await expect(teamServiceModule.updateTeam(
        team._id,
        regularUser._id,
        updateData
      )).rejects.toThrow(/チーム情報の更新は管理者のみ可能です/);
    });
  });

  describe('isTeamAdmin', () => {
    it('should return true when user is team admin', async () => {
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      const result = await teamServiceModule.isTeamAdmin(team._id, adminUser._id);
      expect(result).toBe(true);
    });

    it('should return false when user is not team admin', async () => {
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      const result = await teamServiceModule.isTeamAdmin(team._id, regularUser._id);
      expect(result).toBe(false);
    });
  });

  describe('isTeamMember', () => {
    it('should return true when user is a team member', async () => {
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      // Make regular user a team member
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id });

      const result = await teamServiceModule.isTeamMember(team._id, regularUser._id);
      expect(result).toBe(true);
    });

    it('should return false when user is not a team member', async () => {
      const orgId = new Types.ObjectId();
      const team = await Team.create({
        name: 'Test Team',
        description: 'A team for testing',
        adminId: adminUser._id,
        organizationId: orgId,
        iconInitial: 'TT',
        iconColor: 'water'
      });

      // regularUser is not assigned to this team
      const result = await teamServiceModule.isTeamMember(team._id, regularUser._id);
      expect(result).toBe(false);
    });
  });
});