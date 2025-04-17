import { User } from '../models';
import mongoose from 'mongoose';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils';

enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

interface RegisterUserData {
  displayName: string;
  id: string;
  email: string;
}

export class AuthService {
  /**
   * プロフィール情報を取得する
   */
  async getProfile(id: string): Promise<any> {
    if (!id) {
      throw new AuthenticationError('認証情報が無効です');
    }
    
    // データベースからユーザー情報を取得
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * ユーザー登録処理
   */
  async register(data: RegisterUserData): Promise<any> {
    // 入力検証
    if (!data.id || !data.displayName) {
      throw new ValidationError('ユーザーIDと表示名は必須です');
    }
    
    // ユーザー情報が既に存在するか確認
    const existingUser = await User.findById(data.id);
    
    if (existingUser) {
      throw new ValidationError('ユーザーは既に登録されています');
    }
    
    // 新規ユーザー情報をデータベースに保存
    const newUser = new User({
      _id: mongoose.Types.ObjectId.isValid(data.id) ? new mongoose.Types.ObjectId(data.id) : data.id,
      email: data.email,
      displayName: data.displayName,
      role: UserRole.USER,
      plan: 'lite',
      isActive: true
    });
    
    await newUser.save();
    
    return {
      id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
  }

  /**
   * パスワードリセットリクエスト処理 - JWT認証システム用
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new ValidationError('メールアドレスは必須です');
    }
    
    try {
      // ユーザーの存在確認
      const user = await User.findOne({ email });
      
      if (!user) {
        // セキュリティ上の理由から、ユーザーが存在しない場合でも成功を装う
        // これにより、メールアドレスの存在有無を調査する攻撃を防止
        console.log(`パスワードリセット要求: ${email} (ユーザーが存在しません)`);
        return;
      }
      
      // パスワードリセットトークンの発行とユーザーへの保存
      // 本来ならここでトークンを生成してデータベースに保存し、
      // メールシステムを使ってリセットリンクを送信する
      
      console.log(`パスワードリセット要求: ${email} (リセットリンクを送信済み)`);
      
      // 注意: ここでは実際にメールを送信していません
      // 実際のアプリケーションでは、メール送信サービスを統合する必要があります
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }
}