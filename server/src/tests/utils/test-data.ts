import { User } from '../../models/User';
import { Organization } from '../../models/Organization';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * テスト用データをセットアップします
 * @returns テスト用データオブジェクト（SuperAdmin, Owner, Organization）
 */
export const setupTestData = async () => {
  // テスト用のデータをクリア
  console.log('テスト用データをクリア中...');
  await User.deleteOne({ email: 'superadmin_test@example.com' });
  await User.deleteOne({ email: 'test-owner@example.com' });
  await Organization.deleteOne({ name: 'Test Organization' });
  
  console.log('テスト用データを作成中...');
  
  // テスト用SuperAdminを作成
  const hashedPassword = await bcrypt.hash('test123456', 10);
  
  const superAdmin = new User({
    email: 'superadmin_test@example.com',
    password: hashedPassword,
    displayName: 'Test SuperAdmin',
    role: 'SuperAdmin',
    isActive: true,
    plan: 'elite'
  });
  await superAdmin.save();
  
  // テスト用オーナーを作成
  const owner = new User({
    email: 'test-owner@example.com',
    password: hashedPassword,
    displayName: 'Test Owner',
    role: 'Owner',
    isActive: true,
    plan: 'standard'
  });
  await owner.save();
  
  // テスト用組織を作成
  const testOrg = new Organization({
    name: 'Test Organization',
    ownerId: owner._id,
    status: 'active',
    billingInfo: {
      contactName: 'Test Contact',
      contactEmail: 'contact@example.com',
      companyName: 'Test Company'
    },
    subscriptionPlan: {
      type: 'active',
      isActive: true,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  await testOrg.save();
  
  // オーナーユーザーに組織IDを紐付け
  owner.organizationId = testOrg._id;
  await owner.save();
  
  console.log('テストデータ作成完了:');
  console.log('- SuperAdmin:', {
    id: superAdmin._id.toString(),
    email: superAdmin.email,
    role: superAdmin.role
  });
  console.log('- Owner:', {
    id: owner._id.toString(),
    email: owner.email,
    role: owner.role,
    organizationId: owner.organizationId.toString()
  });
  console.log('- Organization:', {
    id: testOrg._id.toString(),
    name: testOrg.name,
    ownerId: testOrg.ownerId.toString()
  });
  
  return {
    superAdmin,
    owner,
    organization: testOrg
  };
};

/**
 * テスト用データを検証します
 * @returns テスト用データオブジェクト（SuperAdmin, Owner, Organization）
 */
export const verifyTestData = async () => {
  const superAdmin = await User.findOne({ email: 'superadmin_test@example.com' });
  const owner = await User.findOne({ email: 'test-owner@example.com' });
  const organization = await Organization.findOne({ name: 'Test Organization' });
  
  if (!superAdmin) {
    console.log('テスト用SuperAdminが見つかりません');
  } else {
    console.log('SuperAdmin確認:', {
      id: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role
    });
  }
  
  if (!owner) {
    console.log('テスト用オーナーが見つかりません');
  } else {
    console.log('オーナー確認:', {
      id: owner._id.toString(),
      email: owner.email,
      organizationId: owner.organizationId ? owner.organizationId.toString() : 'undefined'
    });
  }
  
  if (!organization) {
    console.log('テスト用組織が見つかりません');
  } else {
    console.log('組織確認:', {
      id: organization._id.toString(),
      name: organization.name,
      ownerId: organization.ownerId ? organization.ownerId.toString() : 'undefined'
    });
  }
  
  return {
    superAdmin,
    owner,
    organization
  };
};