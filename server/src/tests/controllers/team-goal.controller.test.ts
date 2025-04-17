// @ts-nocheck - Test file with test doubles
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { Team } from '../../models/Team';
import { TeamGoal } from '../../models/TeamGoal';
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

describe('Team Goal Controller Tests', () => {
  let app: express.Application;
  let adminUser: any;
  let regularUser: any;
  let team: any;
  let teamGoal: any;

  beforeAll(async () => {
    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/teams', teamRoutes);
  });

  beforeEach(async () => {
    // Clear collections
    await Team.deleteMany({});
    await TeamGoal.deleteMany({});
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

    // Create a team with adminUser as admin
    team = await Team.create({
      name: 'Test Team',
      description: 'A team for testing',
      adminId: adminUser._id,
      iconInitial: 'TT',
      iconColor: 'water'
    });

    // Make users members of the team
    await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });
    await User.findByIdAndUpdate(regularUser._id, { teamId: team._id, teamRole: 'engineer' });

    // Create a team goal
    teamGoal = await TeamGoal.create({
      teamId: team._id,
      content: 'Test team goal',
      deadline: new Date('2025-12-31'),
      status: 'not_started',
      progress: 0,
      collaborators: [adminUser._id]
    });
  });

  describe('GET /api/v1/teams/:teamId/goal', () => {
    it('should get the team goal', async () => {
      const response = await request(app)
        .get(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(teamGoal._id.toString());
      expect(response.body.data.content).toBe(teamGoal.content);
      expect(response.body.data.status).toBe(teamGoal.status);
    });

    it('should return 404 if team has no goal', async () => {
      // Remove the goal
      await TeamGoal.deleteMany({});

      const response = await request(app)
        .get(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent team', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/teams/${nonExistentId}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/teams/:teamId/goal', () => {
    it('should create a new team goal', async () => {
      // Delete existing goal first
      await TeamGoal.deleteMany({});

      const goalData = {
        content: 'New team goal',
        deadline: '2025-12-31',
        status: 'not_started',
        progress: 0,
        collaborators: [adminUser._id.toString(), regularUser._id.toString()]
      };

      const response = await request(app)
        .post(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(goalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(goalData.content);
      expect(response.body.data.status).toBe(goalData.status);
      expect(response.body.data.collaborators).toHaveLength(2);
    });

    it('should update existing goal if one exists', async () => {
      const updatedGoalData = {
        content: 'Updated team goal',
        deadline: '2026-06-30',
        status: 'in_progress',
        progress: 25,
        collaborators: [adminUser._id.toString()]
      };

      const response = await request(app)
        .post(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(updatedGoalData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updatedGoalData.content);
      expect(response.body.data.status).toBe(updatedGoalData.status);
      expect(response.body.data.progress).toBe(updatedGoalData.progress);

      // Verify there's still only one goal
      const goalsCount = await TeamGoal.countDocuments();
      expect(goalsCount).toBe(1);
    });

    it('should fail to create goal when requester is not admin', async () => {
      // Delete existing goal
      await TeamGoal.deleteMany({});

      const goalData = {
        content: 'Unauthorized goal',
        deadline: '2025-12-31',
        status: 'not_started',
        progress: 0,
        collaborators: [regularUser._id.toString()]
      };

      const response = await request(app)
        .post(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(goalData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Verify no goal was created
      const goalsCount = await TeamGoal.countDocuments();
      expect(goalsCount).toBe(0);
    });
  });

  describe('PUT /api/v1/teams/:teamId/goal', () => {
    it('should update the team goal when admin requests', async () => {
      const updateData = {
        content: 'Updated goal content',
        status: 'in_progress',
        progress: 30,
        deadline: '2026-01-15',
        collaborators: [adminUser._id.toString(), regularUser._id.toString()]
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.progress).toBe(updateData.progress);
      expect(response.body.data.collaborators).toHaveLength(2);
    });

    it('should allow collaborator to update progress and status', async () => {
      // Add regularUser as a collaborator
      await TeamGoal.findByIdAndUpdate(teamGoal._id, {
        $push: { collaborators: regularUser._id }
      });

      const updateData = {
        progress: 50,
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(updateData.progress);
      expect(response.body.data.status).toBe(updateData.status);
      // Content should remain unchanged
      expect(response.body.data.content).toBe(teamGoal.content);
    });

    it('should fail when user is not admin or collaborator', async () => {
      const updateData = {
        progress: 75,
        content: 'Unauthorized update'
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid progress value', async () => {
      const invalidData = {
        progress: 120 // Over 100%
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if goal does not exist', async () => {
      // Remove the goal
      await TeamGoal.deleteMany({});

      const updateData = {
        progress: 50
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}/goal`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
