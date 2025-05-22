import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../../index';
import { User } from '../../models/User';
import { Organization } from '../../models/Organization';
import { connectToDatabase, disconnectFromDatabase } from '../utils/test-database';
import { createSuperAdminToken, createTestSuperAdmin } from '../utils/test-auth';

describe('SuperAdmin Organization API', () => {
  let superAdminToken: string;
  let testOrganization: any;
  let testOrganizationOwner: any;

  beforeAll(async () => {
    // 環境変数の確認（run-superadmin-tests.shスクリプトで設定されるはず）
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
      console.warn('警告: JWT環境変数が設定されていません。テストが失敗する可能性があります。');
      console.warn('run-superadmin-tests.shスクリプトを使用するか、環境変数を手動で設定してください。');
    }
    
    // 環境変数を一貫して設定
    const TEST_SECRET = 'dailyfortune_test_secret_key';
    process.env.JWT_ACCESS_SECRET = TEST_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.NODE_ENV = 'test';
    
    // データベースに接続
    await connectToDatabase();

    // 環境変数の確認
    console.log("環境変数設定状況:", {
      JWT_SECRET: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 5)}...` : 'なし',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? `${process.env.JWT_ACCESS_SECRET.substring(0, 5)}...` : 'なし',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? `${process.env.JWT_REFRESH_SECRET.substring(0, 5)}...` : 'なし',
      NODE_ENV: process.env.NODE_ENV
    });

    // テスト用データユーティリティをインポート
    const { setupTestData } = require('../utils/test-data');
    
    // テスト用データを作成
    console.log('テスト用データをセットアップします...');
    const testData = await setupTestData();
    
    // スーパー管理者情報を確認
    const superAdmin = testData.superAdmin;
    console.log("スーパー管理者情報:", {
      id: superAdmin._id ? superAdmin._id.toString() : 'undefined',
      email: superAdmin.email,
      role: superAdmin.role,
      isActive: superAdmin.isActive
    });
    
    // スーパー管理者用のトークンを生成
    superAdminToken = await createSuperAdminToken(superAdmin);
    console.log("スーパー管理者トークン生成完了:", { 
      tokenLength: superAdminToken.length,
      tokenSample: superAdmin.email
    });
    
    // トークンの検証
    const { JwtService } = require('../../services/jwt.service');
    const verification = JwtService.verifyAccessToken(superAdminToken);
    console.log("トークン検証結果:", {
      valid: verification.valid,
      sub: verification.payload?.sub,
      role: verification.payload?.role,
      errorMsg: verification.error ? verification.error.message : null
    });

    // テスト用データを設定
    testOrganization = testData.organization;
    testOrganizationOwner = testData.owner;
    
    console.log("テスト用データ確認完了:", {
      owner: {
        id: testOrganizationOwner._id ? testOrganizationOwner._id.toString() : 'undefined',
        email: testOrganizationOwner.email,
      },
      organization: {
        id: testOrganization._id ? testOrganization._id.toString() : 'undefined',
        name: testOrganization.name
      }
    });
  });

  afterAll(async () => {
    // テストで作成した特定のテストデータのみをクリーンアップ
    await User.deleteMany({ 
      email: { 
        $in: [
          'test-owner@example.com', 
          'test-admin@example.com', 
          'new-owner@example.com', 
          'other-org-user@example.com'
        ] 
      } 
    });
    
    await Organization.deleteMany({ 
      name: { 
        $in: [
          'Test Organization',
          'New Test Organization',
          'Organization Without Owner',
          'Other Organization',
          /Batch Test Org/,
          /Batch Trial Org/
        ] 
      } 
    });

    // データベース接続を切断
    await disconnectFromDatabase();
  });

  describe('GET /api/v1/superadmin/organizations', () => {
    it('should return a list of organizations', async () => {
      // テスト前のトークン情報を出力
      console.log('リクエスト前のトークン情報:', {
        tokenLength: superAdminToken.length,
        tokenPrefix: superAdminToken.substring(0, 20) + '...',
      });
      
      const response = await request(app)
        .get('/api/v1/superadmin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      // レスポンスの詳細を出力
      console.log('API応答結果:', {
        status: response.status,
        body: response.body,
        headers: response.headers
      });

      expect(response.status).toBe(200);
      expect(response.body.organizations).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(Array.isArray(response.body.organizations)).toBe(true);
      expect(response.body.organizations.length).toBeGreaterThan(0);
    });

    it('should filter organizations by status', async () => {
      const response = await request(app)
        .get('/api/v1/superadmin/organizations?status=active')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.organizations).toBeDefined();
      expect(Array.isArray(response.body.organizations)).toBe(true);
      
      // すべてのorganizationのstatusが'active'であることを確認
      response.body.organizations.forEach((org: any) => {
        expect(org.status).toBe('active');
      });
    });

    it('should search organizations by name', async () => {
      const response = await request(app)
        .get('/api/v1/superadmin/organizations?search=Test Organization')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.organizations).toBeDefined();
      expect(Array.isArray(response.body.organizations)).toBe(true);
      expect(response.body.organizations.length).toBeGreaterThan(0);
      
      // 検索結果に'Test Organization'が含まれていることを確認
      const foundOrg = response.body.organizations.find((org: any) => 
        org.name === 'Test Organization'
      );
      expect(foundOrg).toBeDefined();
    });
  });

  describe('GET /api/v1/superadmin/organizations/:organizationId', () => {
    it('should return organization details', async () => {
      const response = await request(app)
        .get(`/api/v1/superadmin/organizations/${testOrganization._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(testOrganization._id.toString());
      expect(response.body.name).toBe(testOrganization.name);
      expect(response.body.status).toBe(testOrganization.status);
      expect(response.body.owner).toBeDefined();
      expect(response.body.owner._id.toString()).toBe(testOrganizationOwner._id.toString());
    });

    it('should return 404 for non-existent organization', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/superadmin/organizations/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid organization ID', async () => {
      const response = await request(app)
        .get('/api/v1/superadmin/organizations/invalid-id')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/superadmin/organizations', () => {
    it('should create a new organization', async () => {
      const newOrganizationData = {
        name: 'New Test Organization',
        initialOwner: {
          name: 'New Owner',
          email: 'new-owner@example.com',
          password: 'password123'
        },
        trialDays: 14
      };

      const response = await request(app)
        .post('/api/v1/superadmin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newOrganizationData);

      expect(response.status).toBe(201);
      expect(response.body.organization).toBeDefined();
      expect(response.body.owner).toBeDefined();
      expect(response.body.organization.name).toBe(newOrganizationData.name);
      expect(response.body.owner.email).toBe(newOrganizationData.initialOwner.email);
      expect(response.body.owner.role).toBe('Owner');

      // 後のテストのためにIDを保存
      const newOrgId = response.body.organization._id;

      // データベースに実際に組織が存在することを確認
      const createdOrg = await Organization.findById(newOrgId);
      expect(createdOrg).toBeDefined();
      expect(createdOrg?.name).toBe(newOrganizationData.name);
      expect(createdOrg?.status).toBe('trial');

      // データベースに実際にユーザーが存在することを確認
      const createdOwner = await User.findOne({ email: newOrganizationData.initialOwner.email });
      expect(createdOwner).toBeDefined();
      expect(createdOwner?.role).toBe('Owner');
      expect(createdOwner?.organizationId.toString()).toBe(newOrgId.toString());
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Organization'
        // initialOwnerが欠けている
      };

      const response = await request(app)
        .post('/api/v1/superadmin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateEmailData = {
        name: 'Duplicate Email Org',
        initialOwner: {
          name: 'Another Owner',
          email: 'test-owner@example.com', // 既存のメールアドレス
          password: 'password123'
        }
      };

      const response = await request(app)
        .post('/api/v1/superadmin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(duplicateEmailData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/v1/superadmin/organizations/:organizationId', () => {
    it('should update organization information', async () => {
      const updateData = {
        name: 'Updated Organization Name',
        contactInfo: {
          email: 'updated-contact@example.com',
          phone: 'Updated Company'
        }
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(testOrganization._id.toString());
      expect(response.body.name).toBe(updateData.name);

      // データベースで実際に更新されたことを確認
      const updatedOrg = await Organization.findById(testOrganization._id);
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg?.name).toBe(updateData.name);
      expect(updatedOrg?.billingInfo.contactEmail).toBe(updateData.contactInfo.email);
      expect(updatedOrg?.billingInfo.companyName).toBe(updateData.contactInfo.phone);
    });

    it('should return 400 for missing name field', async () => {
      const incompleteData = {
        // nameが欠けている
        contactInfo: {
          email: 'incomplete@example.com'
        }
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should return 404 for non-existent organization', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Non-existent Organization'
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/v1/superadmin/organizations/:organizationId/status', () => {
    it('should update organization status', async () => {
      const statusUpdateData = {
        status: 'suspended',
        reason: 'Test suspension',
        notifyOwner: false
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(statusUpdateData);

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(testOrganization._id.toString());
      expect(response.body.previousStatus).toBe('active');
      expect(response.body.status).toBe(statusUpdateData.status);

      // データベースで実際に更新されたことを確認
      const updatedOrg = await Organization.findById(testOrganization._id);
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg?.status).toBe(statusUpdateData.status);
    });

    it('should return 400 for invalid status', async () => {
      const invalidStatusData = {
        status: 'invalid-status',
        reason: 'Invalid status test'
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidStatusData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/superadmin/organizations/:organizationId/extend-trial', () => {
    // まずテスト用組織のステータスをtrialに変更
    beforeEach(async () => {
      await Organization.updateOne(
        { _id: testOrganization._id },
        { 
          status: 'trial',
          'subscriptionPlan.trialEndsAt': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      );
    });

    it('should extend organization trial period', async () => {
      const extendTrialData = {
        days: 14,
        reason: 'Test extension',
        notifyOwner: false
      };

      const response = await request(app)
        .post(`/api/v1/superadmin/organizations/${testOrganization._id}/extend-trial`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(extendTrialData);

      expect(response.status).toBe(200);
      expect(response.body.organization._id.toString()).toBe(testOrganization._id.toString());
      expect(response.body.trial).toBeDefined();
      expect(response.body.trial.extensionDays).toBe(extendTrialData.days);

      // データベースで実際に更新されたことを確認
      const updatedOrg = await Organization.findById(testOrganization._id);
      expect(updatedOrg).toBeDefined();
      
      // 日付の検証はタイムゾーンなどの影響でトリッキーなため、
      // 単純に更新前より後の日付になっていることを確認
      const previousDate = new Date(response.body.trial.previousEndDate);
      const newDate = new Date(response.body.trial.newEndDate);
      expect(newDate.getTime()).toBeGreaterThan(previousDate.getTime());
      
      // およそ14日（厳密には13.9〜14.1日）延長されていることを確認
      const dayDiff = (newDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(dayDiff).toBeCloseTo(14, 0);
    });

    it('should return 400 for invalid extension days', async () => {
      const invalidDaysData = {
        days: 0, // 0日は無効
        reason: 'Invalid days test'
      };

      const response = await request(app)
        .post(`/api/v1/superadmin/organizations/${testOrganization._id}/extend-trial`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidDaysData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/superadmin/organizations/:organizationId/owner', () => {
    it('should return organization owner information', async () => {
      const response = await request(app)
        .get(`/api/v1/superadmin/organizations/${testOrganization._id}/owner`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(testOrganizationOwner._id.toString());
      expect(response.body.name).toBe(testOrganizationOwner.displayName);
      expect(response.body.email).toBe(testOrganizationOwner.email);
      expect(response.body.role).toBe('Owner');
      expect(response.body.organizationId.toString()).toBe(testOrganization._id.toString());
    });

    it('should return 404 for organization without owner', async () => {
      // オーナーを持たない組織を作成
      const orgWithoutOwner = new Organization({
        name: 'Organization Without Owner',
        status: 'active',
        subscriptionPlan: {
          type: 'active',
          isActive: true,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      await orgWithoutOwner.save();

      const response = await request(app)
        .get(`/api/v1/superadmin/organizations/${orgWithoutOwner._id}/owner`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/v1/superadmin/organizations/:organizationId/owner', () => {
    let adminUser: any;

    // テスト用の管理者ユーザーを作成
    beforeEach(async () => {
      adminUser = new User({
        email: 'test-admin@example.com',
        password: 'password123',
        displayName: 'Test Admin',
        role: 'Admin',
        organizationId: testOrganization._id,
        isActive: true,
        plan: 'standard'
      });
      await adminUser.save();
    });

    it('should change organization owner', async () => {
      const changeOwnerData = {
        userId: adminUser._id,
        notifyPreviousOwner: false,
        notifyNewOwner: false
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}/owner`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(changeOwnerData);

      expect(response.status).toBe(200);
      expect(response.body.organization._id.toString()).toBe(testOrganization._id.toString());
      expect(response.body.newOwner._id.toString()).toBe(adminUser._id.toString());
      expect(response.body.previousOwner._id.toString()).toBe(testOrganizationOwner._id.toString());
      expect(response.body.newOwner.previousRole).toBe('Admin');
      expect(response.body.previousOwner.newRole).toBe('Admin');

      // データベースで実際に更新されたことを確認
      const updatedOrg = await Organization.findById(testOrganization._id);
      expect(updatedOrg).toBeDefined();
      expect(updatedOrg?.ownerId.toString()).toBe(adminUser._id.toString());

      // 前のオーナーのロールが変更されていることを確認
      const previousOwner = await User.findById(testOrganizationOwner._id);
      expect(previousOwner).toBeDefined();
      expect(previousOwner?.role).toBe('Admin');

      // 新しいオーナーのロールが変更されていることを確認
      const newOwner = await User.findById(adminUser._id);
      expect(newOwner).toBeDefined();
      expect(newOwner?.role).toBe('Owner');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const changeOwnerData = {
        userId: nonExistentId,
        notifyPreviousOwner: false,
        notifyNewOwner: false
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}/owner`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(changeOwnerData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for user from different organization', async () => {
      // 別の組織のユーザーを作成
      const otherOrg = new Organization({
        name: 'Other Organization',
        status: 'active'
      });
      await otherOrg.save();

      const otherOrgUser = new User({
        email: 'other-org-user@example.com',
        password: 'password123',
        displayName: 'Other Org User',
        role: 'Admin',
        organizationId: otherOrg._id,
        isActive: true
      });
      await otherOrgUser.save();

      const changeOwnerData = {
        userId: otherOrgUser._id,
        notifyPreviousOwner: false,
        notifyNewOwner: false
      };

      const response = await request(app)
        .put(`/api/v1/superadmin/organizations/${testOrganization._id}/owner`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(changeOwnerData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/v1/superadmin/batch/organizations/status', () => {
    let batchTestOrgs: any[] = [];
    
    // テスト用の複数組織を作成
    beforeEach(async () => {
      // 既存のバッチテスト用組織をクリーンアップ
      await Organization.deleteMany({ name: /Batch Test Org/ });
      
      // 3つのテスト用組織を作成
      const orgs = [];
      for (let i = 0; i < 3; i++) {
        const org = new Organization({
          name: `Batch Test Org ${i + 1}`,
          status: 'trial',
          subscriptionPlan: {
            type: 'trial',
            isActive: true,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        orgs.push(org);
      }
      batchTestOrgs = await Organization.insertMany(orgs);
    });

    it('should update multiple organizations status', async () => {
      const batchStatusData = {
        organizationIds: batchTestOrgs.map(org => org._id.toString()),
        status: 'active',
        reason: 'Batch activation',
        notifyOwners: false
      };

      const response = await request(app)
        .put('/api/v1/superadmin/batch/organizations/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(batchStatusData);

      expect(response.status).toBe(200);
      expect(response.body.updatedCount).toBe(batchTestOrgs.length);
      expect(response.body.organizations).toHaveLength(batchTestOrgs.length);
      
      // すべての組織のステータスが更新されていることを確認
      for (const org of response.body.organizations) {
        expect(org.previousStatus).toBe('trial');
        expect(org.status).toBe('active');
      }

      // データベースで実際に更新されたことを確認
      const updatedOrgs = await Organization.find({ 
        _id: { $in: batchTestOrgs.map(org => org._id) } 
      });
      
      for (const org of updatedOrgs) {
        expect(org.status).toBe('active');
      }
    });

    it('should return 400 for empty organization IDs array', async () => {
      const emptyIdsData = {
        organizationIds: [],
        status: 'active',
        reason: 'Empty test'
      };

      const response = await request(app)
        .put('/api/v1/superadmin/batch/organizations/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(emptyIdsData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid status', async () => {
      const invalidStatusData = {
        organizationIds: batchTestOrgs.map(org => org._id.toString()),
        status: 'invalid-status',
        reason: 'Invalid status test'
      };

      const response = await request(app)
        .put('/api/v1/superadmin/batch/organizations/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidStatusData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/superadmin/batch/organizations/extend-trial', () => {
    let batchTestOrgs: any[] = [];
    
    // テスト用の複数組織を作成
    beforeEach(async () => {
      // 既存のバッチテスト用組織をクリーンアップ
      await Organization.deleteMany({ name: /Batch Trial Org/ });
      
      // 3つのテスト用組織を作成（トライアル状態）
      const orgs = [];
      for (let i = 0; i < 3; i++) {
        const org = new Organization({
          name: `Batch Trial Org ${i + 1}`,
          status: 'trial',
          subscriptionPlan: {
            type: 'trial',
            isActive: true,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
        orgs.push(org);
      }
      batchTestOrgs = await Organization.insertMany(orgs);
    });

    it('should extend trial period for multiple organizations', async () => {
      const batchExtendData = {
        organizationIds: batchTestOrgs.map(org => org._id.toString()),
        days: 14,
        reason: 'Batch trial extension',
        notifyOwners: false
      };

      const response = await request(app)
        .post('/api/v1/superadmin/batch/organizations/extend-trial')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(batchExtendData);

      expect(response.status).toBe(200);
      expect(response.body.updatedCount).toBe(batchTestOrgs.length);
      expect(response.body.organizations).toHaveLength(batchTestOrgs.length);
      
      // すべての組織のトライアル期間が延長されていることを確認
      for (const org of response.body.organizations) {
        expect(org.trial).toBeDefined();
        expect(org.trial.previousEndDate).toBeDefined();
        expect(org.trial.newEndDate).toBeDefined();
        
        const previousDate = new Date(org.trial.previousEndDate);
        const newDate = new Date(org.trial.newEndDate);
        expect(newDate.getTime()).toBeGreaterThan(previousDate.getTime());
      }

      // データベースで実際に更新されたことを確認
      const updatedOrgs = await Organization.find({ 
        _id: { $in: batchTestOrgs.map(org => org._id) } 
      });
      
      for (const org of updatedOrgs) {
        // トライアル終了日が更新されていることを確認
        const originalEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const extendedEndDate = org.subscriptionPlan.trialEndsAt;
        
        // extendedEndDateが存在することを確認
        expect(extendedEndDate).toBeDefined();
        
        // 約14日（厳密には13〜15日の範囲）延長されていることを確認
        const dayDiff = Math.round((extendedEndDate!.getTime() - originalEndDate.getTime()) / (24 * 60 * 60 * 1000));
        expect(dayDiff).toBeGreaterThanOrEqual(13);
        expect(dayDiff).toBeLessThanOrEqual(15);
      }
    });

    it('should return 400 for empty organization IDs array', async () => {
      const emptyIdsData = {
        organizationIds: [],
        days: 14,
        reason: 'Empty test'
      };

      const response = await request(app)
        .post('/api/v1/superadmin/batch/organizations/extend-trial')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(emptyIdsData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid days value', async () => {
      const invalidDaysData = {
        organizationIds: batchTestOrgs.map(org => org._id.toString()),
        days: 0,
        reason: 'Invalid days test'
      };

      const response = await request(app)
        .post('/api/v1/superadmin/batch/organizations/extend-trial')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidDaysData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Authorization Tests', () => {
    let regularUserToken: string;

    beforeAll(async () => {
      // 一般ユーザーを作成してトークンを取得
      // 既存ユーザーがあれば利用、なければ新規作成
      let regularUser = await User.findOne({ email: 'regular-user@example.com' });
      
      if (!regularUser) {
        regularUser = new User({
          email: 'regular-user@example.com',
          password: 'password123',
          displayName: 'Regular User',
          role: 'User',
          isActive: true
        });
        await regularUser.save();
      }

      // JWTトークンを直接生成（APIを経由しない）
      const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dailyfortune_access_token_secret_dev';
      
      const tokenPayload = {
        sub: (regularUser._id as mongoose.Types.ObjectId).toString(),
        email: regularUser.email,
        role: regularUser.role,
        displayName: regularUser.displayName
      };
      
      regularUserToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    });

    it('should return 403 for non-superadmin user', async () => {
      // SuperAdmin専用エンドポイントへのアクセスを試みる
      const response = await request(app)
        .get('/api/v1/superadmin/organizations')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBeDefined();
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/superadmin/organizations');

      expect(response.status).toBe(401);
      expect(response.body.message).toBeDefined();
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/superadmin/organizations')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBeDefined();
    });
  });
});