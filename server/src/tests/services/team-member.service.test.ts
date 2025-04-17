// @ts-nocheck
import mongoose from 'mongoose';
import * as teamMemberServiceModule from '../../services/team/team-member.service';
import * as teamServiceModule from '../../services/team/team.service';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import { Types } from 'mongoose';

describe('TeamMemberService Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let newMemberUser: any;
  let team: any;

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

    newMemberUser = await User.create({
      _id: new Types.ObjectId(),
      uid: 'new-member-uid',
      email: 'newmember@example.com',
      password: 'password12345',
      displayName: 'New Member',
      role: 'User',
      elementAttribute: 'water'
    });

    // Create a team with adminUser as admin
    const orgId = new Types.ObjectId();
    team = await Team.create({
      name: 'Test Team',
      description: 'A team for testing',
      adminId: adminUser._id,
      organizationId: orgId,
      iconInitial: 'TT',
      iconColor: 'water'
    });

    // Make adminUser a member of the team
    await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });
  });

  describe('getTeamMembers', () => {
    it('should get all members of a team', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      const members = await teamMemberServiceModule.getTeamMembers(team._id, adminUser._id);
      expect(members).toHaveLength(2);
      expect(members.some(member => member._id && member._id.toString() === adminUser._id.toString())).toBeTruthy();
      expect(members.some(member => member._id && member._id.toString() === regularUser._id.toString())).toBeTruthy();
    });

    it('should return only the admin if no other members', async () => {
      const members = await teamMemberServiceModule.getTeamMembers(team._id, adminUser._id);
      expect(members).toHaveLength(1);
      // @ts-ignore - Test assumption
      expect(members[0]._id.toString()).toBe(adminUser._id.toString());
    });
  });

  describe('addMember', () => {
    it('should add a member to the team when admin requests', async () => {
      const result = await teamMemberServiceModule.addMember(
        team._id, 
        adminUser._id, 
        newMemberUser.email,
        'engineer'
      );

      // Verify user was added to the team
      const updatedUser = await User.findById(newMemberUser._id);
      expect(updatedUser?.teamId?.toString()).toBe(team._id.toString());
      expect(updatedUser?.teamRole).toBe('engineer');

      // Verify team members list includes the new member
      const members = await teamMemberServiceModule.getTeamMembers(team._id, adminUser._id);
      // @ts-ignore - Test assumption
      expect(members.some(member => member._id && member._id.toString() === newMemberUser._id.toString())).toBeTruthy();
    });

    it('should fail to add member when requester is not admin', async () => {
      await expect(teamMemberServiceModule.addMember(
        team._id, 
        regularUser._id, 
        newMemberUser.email,
        'engineer'
      )).rejects.toThrow(/チームメンバーの追加は管理者のみ可能です/);

      // Verify user was not added to the team
      const updatedUser = await User.findById(newMemberUser._id);
      expect(updatedUser?.teamId).toBeUndefined();
    });

    it('should fail to add member who is already on another team', async () => {
      // Add newMemberUser to another team
      const orgId = new Types.ObjectId();
      const anotherTeam = await Team.create({
        name: 'Another Team',
        description: 'Another team for testing',
        adminId: regularUser._id,
        organizationId: orgId,
        iconInitial: 'AT',
        iconColor: 'fire'
      });
      // @ts-ignore - Test assumption
      await User.findByIdAndUpdate(newMemberUser._id, { teamId: anotherTeam._id });

      await expect(teamMemberServiceModule.addMember(
        team._id, 
        adminUser._id, 
        newMemberUser.email,
        'engineer'
      )).rejects.toThrow(/このユーザーは既に別のチームに所属しています/);

      // Verify user's team didn't change
      const updatedUser = await User.findById(newMemberUser._id);
      if (anotherTeam._id && updatedUser?.teamId) {
        expect(updatedUser.teamId.toString()).toBe(anotherTeam._id.toString());
      }
    });
  });

  describe('updateMemberRole', () => {
    it('should update a member\'s role when admin requests', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      await teamMemberServiceModule.updateMemberRole(
        team._id,
        adminUser._id,
        regularUser._id,
        'product-manager'
      );

      // Verify role was updated
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.teamRole).toBe('product-manager');
    });

    it('should fail to update role when requester is not admin', async () => {
      // Add newMemberUser to the team
      await User.findByIdAndUpdate(newMemberUser._id, { teamId: team._id, teamRole: 'designer' });

      await expect(teamMemberServiceModule.updateMemberRole(
        team._id,
        regularUser._id, // Not an admin
        newMemberUser._id,
        'product-manager'
      )).rejects.toThrow(/チームメンバーの役割変更は管理者のみ可能です/);

      // Verify role was not updated
      const updatedUser = await User.findById(newMemberUser._id);
      expect(updatedUser?.teamRole).toBe('designer');
    });

    it('should fail to update role for a user not on the team', async () => {
      await expect(teamMemberServiceModule.updateMemberRole(
        team._id,
        adminUser._id,
        newMemberUser._id, // Not a team member
        'product-manager'
      )).rejects.toThrow(/指定されたユーザーはこのチームのメンバーではありません/);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the team when admin requests', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      await teamMemberServiceModule.removeMember(
        team._id, 
        adminUser._id, 
        regularUser._id
      );

      // Verify user was removed from the team
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.teamId).toBeUndefined();
      expect(updatedUser?.teamRole).toBeUndefined();

      // Verify team members list doesn't include the removed member
      const members = await teamMemberServiceModule.getTeamMembers(
        team._id, 
        adminUser._id
      );
      expect(members.every(member => !member._id || member._id.toString() !== regularUser._id.toString())).toBeTruthy();
    });

    it('should fail to remove admin from their own team', async () => {
      await expect(teamMemberServiceModule.removeMember(
        team._id, 
        adminUser._id, 
        adminUser._id
      )).rejects.toThrow(/チーム管理者をメンバーから削除することはできません/);

      // Verify admin is still in the team
      const updatedUser = await User.findById(adminUser._id);
      expect(updatedUser?.teamId?.toString()).toBe(team._id.toString());
    });
  });
});
