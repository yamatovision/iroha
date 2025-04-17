import { User } from '../models';
import mongoose from 'mongoose';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils';

// 型定義
enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

interface UserListOptions {
  page: number;
  limit: number;
  role?: string;
  plan?: string;
  search?: string;
}

interface UserListResult {
  users: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role?: string;
  plan?: string;
  organizationId?: string;
  teamId?: string;
}

interface UserCreator {
  id: string;  // MongoDB ObjectID（文字列化）
  role: string;
}

export class UserService {
  /**
   * ユーザー一覧を取得する
   */
  async getUsers(options: UserListOptions): Promise<UserListResult> {
    const { page, limit, role, plan, search } = options;
    
    // フィルター条件を構築
    const filter = this.buildUserFilter(role, plan, search);
    
    // 総件数取得
    const totalUsers = await User.countDocuments(filter);
    
    // ユーザー一覧取得
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit)
      }
    };
  }

  /**
   * 新規ユーザーを作成する - Firebase不使用・JWT+MongoDB実装
   */
  async createUser(data: CreateUserData, creator: UserCreator): Promise<any> {
    // 入力検証
    if (!data.email || !data.password || !data.displayName) {
      throw new ValidationError('メールアドレス、パスワード、表示名は必須です');
    }
    
    // 権限チェック
    const isSuperAdmin = creator.role === UserRole.SUPER_ADMIN;
    const isAdmin = creator.role === UserRole.ADMIN;
    
    // SuperAdmin以外は一般ユーザーのみ作成可能
    if (!isSuperAdmin && data.role && data.role !== UserRole.USER) {
      throw new AuthorizationError('一般ユーザー以外の作成権限がありません');
    }
    
    // ロールとプランの設定
    const userRole = isSuperAdmin && data.role ? data.role : UserRole.USER;
    const userPlan = isSuperAdmin && data.plan ? data.plan : 'lite';
    
    try {
      // メールアドレスの重複チェック
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new ValidationError('このメールアドレスは既に使用されています');
      }
      
      // MongoDBにユーザー情報を保存（MongoDB ObjectIDを使用）
      const newUser = new User({
        _id: new mongoose.Types.ObjectId(), // MongoDBのObjectIDを自動生成
        email: data.email,
        password: data.password, // パスワードも保存（モデルのpre-saveフックで自動的にハッシュ化される）
        displayName: data.displayName,
        role: userRole,
        plan: userPlan,
        organizationId: data.organizationId || null,
        teamId: data.teamId || null,
        isActive: true,
        tokenVersion: 0 // JWT認証のためのトークンバージョン初期値
      });
      
      await newUser.save();
      
      return {
        id: newUser._id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        plan: newUser.plan,
        organizationId: newUser.organizationId,
        teamId: newUser.teamId,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      };
    } catch (error) {
      // エラーのハンドリング
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * ユーザー権限を変更する - Firebase不使用・JWTのみ対応
   */
  async updateUserRole(userId: string, role: string, updater: UserCreator): Promise<any> {
    // SuperAdmin権限チェック
    if (updater.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('ユーザー権限の変更にはSuperAdmin権限が必要です');
    }
    
    // 入力検証
    if (!role || !['SuperAdmin', 'Admin', 'User'].includes(role)) {
      throw new ValidationError('有効な権限を指定してください');
    }
    
    // ユーザー取得
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    // ユーザー権限更新 - 型アサーションで変換
    user.role = role as 'SuperAdmin' | 'Admin' | 'User';
    
    // JWT認証のためにトークンバージョンをインクリメント
    // これにより既存のトークンが無効化され、新しい権限が反映されたトークンの使用が強制される
    if (user.tokenVersion !== undefined) {
      user.tokenVersion += 1;
    } else {
      user.tokenVersion = 0;
    }
    
    await user.save();
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      updatedAt: user.updatedAt
    };
  }

  /**
   * ユーザープランを変更する
   */
  async updateUserPlan(userId: string, plan: string, updater: UserCreator): Promise<any> {
    // SuperAdmin権限チェック
    if (updater.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('ユーザープランの変更にはSuperAdmin権限が必要です');
    }
    
    // 入力検証
    if (!plan || !['elite', 'lite'].includes(plan)) {
      throw new ValidationError('有効なプランを指定してください');
    }
    
    // ユーザー取得
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    // ユーザープラン更新 - 型アサーションで変換
    user.plan = plan as 'elite' | 'lite';
    await user.save();
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      plan: user.plan,
      updatedAt: user.updatedAt
    };
  }

  /**
   * ユーザーを削除する - Firebase不使用・JWTのみ対応
   */
  async deleteUser(userId: string, deleter: UserCreator): Promise<{message: string, deletedUserId: string}> {
    // SuperAdmin権限チェック
    if (deleter.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('ユーザー削除にはSuperAdmin権限が必要です');
    }
    
    // ユーザー取得
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    // MongoDBユーザー削除
    await User.findByIdAndDelete(userId);
    console.log(`ユーザー削除成功: ${userId}`);
    
    return {
      message: 'ユーザーを削除しました',
      deletedUserId: userId
    };
  }

  /**
   * ユーザーフィルターを構築する（内部メソッド）
   */
  private buildUserFilter(role?: string, plan?: string, search?: string): any {
    const filter: any = {};
    
    // ロール条件
    if (role && ['SuperAdmin', 'Admin', 'User'].includes(role)) {
      filter.role = role;
    }
    
    // プラン条件
    if (plan && ['elite', 'lite'].includes(plan)) {
      filter.plan = plan;
    }
    
    // 検索条件
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter['$or'] = [
        { displayName: searchRegex },
        { email: searchRegex }
      ];
    }
    
    return filter;
  }
}