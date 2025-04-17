// @ts-nocheck - Test file with test doubles
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import teamRoutes from '../../routes/team.routes';
import { authenticate as authMiddleware } from '../../middleware/auth.middleware';

// Mock auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (req.headers.authorization) {
      const userId = req.headers.authorization.split(' ')[1];
      req.user = { uid: 'test-uid', _id: userId };
    }
    next();
  })
}));

describe('Team Member Controller Tests', () => {
  let app: express.Application;
  let adminUser: any;
  let regularUser: any;
  let newMemberUser: any;
  let team: any;

  beforeAll(async () => {
    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/teams', teamRoutes);
  });

  beforeEach(async () => {
    // Clear collections
    await Team.deleteMany({});
    await User.deleteMany({});

    // Create test users
    adminUser = await User.create({
      uid: 'admin-uid',
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'user',
      elementAttribute: 'wood'
    });

    regularUser = await User.create({
      uid: 'regular-uid',
      email: 'user@example.com',
      displayName: 'Regular User',
      role: 'user',
      elementAttribute: 'fire'
    });

    newMemberUser = await User.create({
      uid: 'new-member-uid',
      email: 'newmember@example.com',
      displayName: 'New Member',
      role: 'user',
      elementAttribute: 'water'
    });

    // Create a team with adminUser as admin
    team = await Team.create({
      name: 'Test Team',
      description: 'A team for testing',
      adminId: adminUser._id,
      iconInitial: 'TT',
      iconColor: 'water'
    });

    // Make adminUser a member of the team
    await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });
  });

  describe('GET /api/v1/teams/:teamId/members', () => {
    it('should get team members', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      const response = await request(app)
        .get(`/api/v1/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Admin and regularUser
      
      // Check that both users are included
      const memberIds = response.body.data.map((m: any) => m._id);
      expect(memberIds).toContain(adminUser._id.toString());
      expect(memberIds).toContain(regularUser._id.toString());

      // Check that teamRole is included
      const regularUserData = response.body.data.find((m: any) => m._id === regularUser._id.toString());
      expect(regularUserData.teamRole).toBe('designer');
    });

    it('should return 404 for non-existent team', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/teams/${nonExistentId}/members`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/teams/:teamId/members', () => {
    it('should add a new member to the team', async () => {
      const memberData = {
        userId: newMemberUser._id,
        teamRole: 'engineer'
      };

      const response = await request(app)
        .post(`/api/v1/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(memberData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify user was added to team
      const updatedUser = await User.findById(newMemberUser._id);
      expect(updatedUser?.teamId?.toString()).toBe(team._id.toString());
      expect(updatedUser?.teamRole).toBe('engineer');
    });

    it('should fail to add member when requester is not admin', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      const memberData = {
        userId: newMemberUser._id,
        teamRole: 'engineer'
      };

      const response = await request(app)
        .post(`/api/v1/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(memberData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Verify user was not added
      const updatedUser = await User.findById(newMemberUser._id);
      expect(updatedUser?.teamId).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const memberData = {
        userId: nonExistentId,
        teamRole: 'engineer'
      };

      const response = await request(app)
        .post(`/api/v1/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(memberData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/teams/:teamId/members/:userId/role', () => {
    it('should update a member\'s role', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      const newRole = 'product-manager';

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/members/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send({ teamRole: newRole });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify role was updated
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.teamRole).toBe(newRole);
    });

    it('should fail to update role when requester is not admin', async () => {
      // Add both users to team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });
      await User.findByIdAndUpdate(newMemberUser._id, { teamId: team._id, teamRole: 'engineer' });

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/members/${newMemberUser._id}/role`)
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send({ teamRole: 'product-manager' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Verify role was not updated
      const user = await User.findById(newMemberUser._id);
      expect(user?.teamRole).toBe('engineer');
    });
  });

  describe('DELETE /api/v1/teams/:teamId/members/:userId', () => {
    it('should remove a member from the team', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      const response = await request(app)
        .delete(`/api/v1/teams/${team._id}/members/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user was removed
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.teamId).toBeUndefined();
      expect(updatedUser?.teamRole).toBeUndefined();
    });

    it('should allow user to remove themselves', async () => {
      // Add regularUser to the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'designer' });

      const response = await request(app)
        .delete(`/api/v1/teams/${team._id}/members/${regularUser._id}`)
        .set('Authorization', `Bearer ${regularUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user was removed
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.teamId).toBeUndefined();
    });

    it('should prevent admin from removing themselves', async () => {
      const response = await request(app)
        .delete(`/api/v1/teams/${team._id}/members/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Verify admin was not removed
      const updatedAdmin = await User.findById(adminUser._id);
      expect(updatedAdmin?.teamId?.toString()).toBe(team._id.toString());
    });
  });
});
