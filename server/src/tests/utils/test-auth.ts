import { User } from '../../models/User';
import jwt from 'jsonwebtoken';

/**
 * テスト用のスーパー管理者ユーザーを取得または作成します
 * @returns 取得または作成されたスーパー管理者ユーザー
 */
export const createTestSuperAdmin = async () => {
  try {
    // テスト専用のSuperAdminユーザーを使用
    let superAdmin = await User.findOne({ 
      email: 'superadmin_test@example.com', 
      role: 'SuperAdmin' 
    });
    
    // 検索結果を詳細にログ出力
    console.log('Existing SuperAdmin search result:', superAdmin ? {
      id: superAdmin._id ? superAdmin._id.toString() : null,
      email: superAdmin.email,
      role: superAdmin.role,
      plan: superAdmin.plan,
      isActive: superAdmin.isActive
    } : 'Not found');
    
    // どのSuperAdminも見つからない場合、新しく作成
    if (!superAdmin) {
      superAdmin = new User({
        email: 'test-superadmin@example.com',
        password: 'password123',
        displayName: 'Test SuperAdmin',
        role: 'SuperAdmin',
        isActive: true,
        plan: 'elite',
        organizationId: undefined
      });
      
      await superAdmin.save();
      console.log('Created new test SuperAdmin:', {
        id: superAdmin._id ? superAdmin._id.toString() : null,
        role: superAdmin.role
      });
    } else {
      console.log('Using existing SuperAdmin:', superAdmin.email);
      
      // 念のため正しいステータスを確保（非アクティブの場合のみ更新）
      if (!superAdmin.isActive) {
        superAdmin.isActive = true;
        await superAdmin.save();
        console.log('Updated existing SuperAdmin to ensure active status');
      }
    }
    
    // 最終的なユーザー情報を表示
    console.log('Final SuperAdmin user info:', {
      id: superAdmin._id ? superAdmin._id.toString() : null,
      email: superAdmin.email,
      role: superAdmin.role,
      plan: superAdmin.plan,
      isActive: superAdmin.isActive
    });
    
    return superAdmin;
  } catch (error) {
    console.error('Failed to get or create SuperAdmin:', error);
    throw error;
  }
};

/**
 * スーパー管理者用のJWTトークンを生成します
 * @param superAdmin スーパー管理者ユーザー
 * @returns 生成されたJWTトークン
 */
export const createSuperAdminToken = async (superAdmin: any) => {
  try {
    // テスト用の固定キーを使用（テスト環境での一貫性を確保）
    const JWT_SECRET = 'dailyfortune_test_secret_key';
    
    // JWTサービスを直接使用（アプリケーションコードと一貫性を保つため）
    const { JwtService } = require('../../services/jwt.service');
    
    // 環境変数の検証
    console.log('JWT環境設定:', {
      current_access_secret: process.env.JWT_ACCESS_SECRET ? process.env.JWT_ACCESS_SECRET.substring(0, 5) + '...' : '未設定',
      using_secret: JWT_SECRET.substring(0, 5) + '...',
      auth_method: 'direct JWT signing'
    });
    
    // 環境変数を一時的に設定（トークン生成・検証のみに影響）
    const originalSecret = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = JWT_SECRET;
    
    const tokenPayload = {
      sub: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
      displayName: superAdmin.displayName,
      plan: superAdmin.plan
    };
    
    // 直接JWTを使用してトークンを生成
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    
    // 検証のためJWTサービスを使用
    const verification = JwtService.verifyAccessToken(token);
    if (verification.valid) {
      console.log('トークン検証成功:', {
        sub: verification.payload.sub,
        role: verification.payload.role
      });
    } else {
      console.error('トークン検証失敗:', verification.error);
    }
    
    // 環境変数を元に戻す
    if (originalSecret) {
      process.env.JWT_ACCESS_SECRET = originalSecret;
    } else {
      delete process.env.JWT_ACCESS_SECRET;
    }
    
    return token;
  } catch (error) {
    console.error('Failed to create SuperAdmin token:', error);
    throw error;
  }
};

/**
 * テスト用のオーナーユーザーを作成します
 * @param organizationId 組織ID
 * @returns 作成されたオーナーユーザー
 */
export const createTestOwner = async (organizationId: string) => {
  try {
    // 既存のテスト用オーナーを削除
    await User.deleteOne({ email: 'test-owner@example.com' });
    
    // 新しいオーナーを作成
    const owner = new User({
      email: 'test-owner@example.com',
      password: 'password123',
      displayName: 'Test Owner',
      role: 'Owner',
      organizationId,
      isActive: true,
      plan: 'standard'
    });
    
    await owner.save();
    return owner;
  } catch (error) {
    console.error('Failed to create test Owner:', error);
    throw error;
  }
};

/**
 * オーナー用のJWTトークンを生成します
 * @param owner オーナーユーザー
 * @returns 生成されたJWTトークン
 */
export const createOwnerToken = async (owner: any) => {
  try {
    const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dailyfortune_test_secret_key';
    
    const tokenPayload = {
      sub: owner._id.toString(),
      email: owner.email,
      role: owner.role,
      organizationId: owner.organizationId?.toString(),
      displayName: owner.displayName,
      plan: owner.plan
    };
    
    return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
  } catch (error) {
    console.error('Failed to create Owner token:', error);
    throw error;
  }
};