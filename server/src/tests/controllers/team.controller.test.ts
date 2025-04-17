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

describe('Team Controller Tests', () => {
  let app: express.Application;
  let adminUser: any;
  let regularUser: any;
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

    // Create a team with adminUser as admin
    team = await Team.create({
      name: 'Test Team',
      description: 'A team for testing',
      adminId: adminUser._id,
      iconInitial: 'TT',
      iconColor: 'water'
    });

    // Set team for users
    await User.findByIdAndUpdate(adminUser._id, { teamId: team._id });
  });

  describe('POST /api/v1/teams', () => {
    it('should create a new team', async () => {
      const teamData = {
        name: 'New Team',
        description: 'A new test team',
        iconInitial: 'NT',
        iconColor: 'fire'
      };

      const response = await request(app)
        .post('/api/v1/teams')
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(teamData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(teamData.name);
      expect(response.body.data.description).toBe(teamData.description);
      expect(response.body.data.iconInitial).toBe(teamData.iconInitial);
      expect(response.body.data.iconColor).toBe(teamData.iconColor);

      // Verify user is now admin of the team
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.teamId?.toString()).toBe(response.body.data._id);
    });

    it('should fail to create team with invalid data', async () => {
      const invalidData = {
        // Missing required name field
        description: 'Invalid team data',
        iconInitial: 'IT',
        iconColor: 'earth'
      };

      const response = await request(app)
        .post('/api/v1/teams')
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/teams', () => {
    it('should get user\'s team', async () => {
      const response = await request(app)
        .get('/api/v1/teams')
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id).toBe(team._id.toString());
      expect(response.body.data[0].name).toBe(team.name);
    });

    it('should return empty array when user has no team', async () => {
      const response = await request(app)
        .get('/api/v1/teams')
        .set('Authorization', `Bearer ${regularUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/teams/:teamId', () => {
    it('should get a specific team by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/teams/${team._id}`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(team._id.toString());
      expect(response.body.data.name).toBe(team.name);
      expect(response.body.data.description).toBe(team.description);
    });

    it('should return 404 for non-existent team', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/teams/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminUser._id}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/teams/:teamId', () => {
    it('should update team when user is admin', async () => {
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description',
        iconInitial: 'UT',
        iconColor: 'metal'
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}`)
        .set('Authorization', `Bearer ${adminUser._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.iconInitial).toBe(updateData.iconInitial);
      expect(response.body.data.iconColor).toBe(updateData.iconColor);
    });

    it('should fail to update team when user is not admin', async () => {
      // Make regularUser a member of the team
      await User.findByIdAndUpdate(regularUser._id, { teamId: team._id });

      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/v1/teams/${team._id}`)
        .set('Authorization', `Bearer ${regularUser._id}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
