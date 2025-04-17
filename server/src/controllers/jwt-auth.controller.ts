import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { JwtService } from '../services/jwt.service';

/**
 * JWT認証コントローラー
 * JWT認証に関連するエンドポイントの処理を実装
 */
export class JwtAuthController {
  /**
   * ユーザープロフィールを取得
   * @param req リクエスト
   * @param res レスポンス
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { user } = req as any;
      
      if (!user || !user.id) {
        res.status(401).json({ message: '認証が必要です' });
        return;
      }
      
      // データベースからユーザー情報を取得
      const userData = await User.findById(user.id).select('-password -refreshToken');
      
      if (!userData) {
        res.status(404).json({ message: 'ユーザーが見つかりません' });
        return;
      }
      
      // ユーザー情報を返す
      res.status(200).json(userData);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      res.status(500).json({ message: 'プロフィール取得中にエラーが発生しました' });
    }
  }
  /**
   * ユーザー登録
   * @param req リクエスト
   * @param res レスポンス
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, displayName } = req.body;

      // 必須フィールドのバリデーション
      if (!email || !password || !displayName) {
        res.status(400).json({ message: 'メール、パスワード、表示名は必須です' });
        return;
      }

      // 既存ユーザーの確認
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ message: 'このメールアドレスは既に登録されています' });
        return;
      }

      // 新規ユーザー作成
      const newUser = await User.create({
        email,
        password,
        displayName,
        role: 'User',
        plan: 'lite',
        isActive: true
      });

      // アクセストークンとリフレッシュトークンの生成
      const accessToken = JwtService.generateAccessToken(newUser);
      const refreshToken = JwtService.generateRefreshToken(newUser);

      // リフレッシュトークンをデータベースに保存
      newUser.refreshToken = refreshToken;
      newUser.lastLogin = new Date();
      await newUser.save();

      // レスポンスを返す
      res.status(201).json({
        message: 'ユーザー登録が完了しました',
        user: {
          id: newUser._id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      res.status(500).json({ message: 'ユーザー登録中にエラーが発生しました' });
    }
  }

  /**
   * ログイン処理
   * @param req リクエスト
   * @param res レスポンス
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      console.log('ログインリクエスト:', { email });

      // バリデーション
      if (!email || !password) {
        console.log('バリデーションエラー: メールアドレスまたはパスワードがありません');
        res.status(400).json({ message: 'メールアドレスとパスワードは必須です' });
        return;
      }

      // ユーザー検索（パスワードを含める）
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        console.log('認証エラー: ユーザーが見つかりません -', email);
        res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
        return;
      }

      console.log('ユーザー検索結果:', { 
        id: user._id, 
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });

      // パスワード照合
      try {
        // リクエストの詳細情報をログに出力（デバッグのみ、後で削除）
        if (req.body.clientInfo) {
          console.log('クライアント情報:', req.body.clientInfo);
        }
        
        console.log('ユーザーパスワード状態:', { 
          hasPassword: !!user.password, 
          passwordLength: user.password?.length || 0,
          passwordType: typeof user.password
        });
        
        const isPasswordValid = await user.comparePassword(password);
        console.log('パスワード検証結果:', isPasswordValid);
        
        if (!isPasswordValid) {
          console.log('認証エラー: パスワードが一致しません');
          res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
          return;
        }
      } catch (pwError: any) {
        console.error('パスワード検証中にエラーが発生しました:', pwError);
        console.error('エラー詳細:', pwError.stack);
        res.status(500).json({ 
          message: 'パスワード検証中にエラーが発生しました', 
          debug: process.env.NODE_ENV === 'development' ? pwError.message : undefined,
          stack: process.env.NODE_ENV === 'development' ? pwError.stack : undefined
        });
        return;
      }

      // アクセストークンとリフレッシュトークンの生成
      try {
        console.log('トークン生成中...');
        
        // 環境変数の存在確認ログ
        console.log('JWT環境変数確認:',
          'JWT_SECRET =', process.env.JWT_SECRET ? `設定済み(${process.env.JWT_SECRET.length}文字)` : '未設定',
          'JWT_ACCESS_SECRET =', process.env.JWT_ACCESS_SECRET ? `設定済み(${process.env.JWT_ACCESS_SECRET.length}文字)` : '未設定',
          'JWT_REFRESH_SECRET =', process.env.JWT_REFRESH_SECRET ? `設定済み(${process.env.JWT_REFRESH_SECRET.length}文字)` : '未設定'
        );
        
        const accessToken = JwtService.generateAccessToken(user);
        const refreshToken = JwtService.generateRefreshToken(user);
        console.log('トークン生成完了');
        
        // トークンの長さを確認
        console.log(`生成されたトークン情報: アクセストークン長=${accessToken.length}, リフレッシュトークン長=${refreshToken.length}`);

        // リフレッシュトークンをデータベースに保存
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        console.log('ユーザー情報更新完了');

        // レスポンスを返す
        console.log('ログイン成功');
        res.status(200).json({
          message: 'ログインに成功しました',
          user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            role: user.role
          },
          tokens: {
            accessToken,
            refreshToken
          }
        });
      } catch (tokenError: any) {
        console.error('トークン生成中にエラーが発生しました:', tokenError);
        // より詳細なエラー情報を記録
        console.error('エラーのスタックトレース:', tokenError.stack);
        console.error('JWT環境変数状態:', {
          JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
          JWT_ACCESS_SECRET_EXISTS: !!process.env.JWT_ACCESS_SECRET,
          JWT_REFRESH_SECRET_EXISTS: !!process.env.JWT_REFRESH_SECRET
        });
        
        res.status(500).json({ 
          message: 'トークン生成中にエラーが発生しました', 
          debug: process.env.NODE_ENV === 'development' ? tokenError.message : undefined 
        });
        return;
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      res.status(500).json({ 
        message: 'ログイン中にエラーが発生しました',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * トークンリフレッシュ処理
   * @param req リクエスト
   * @param res レスポンス
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'リフレッシュトークンが必要です' });
        return;
      }

      // リフレッシュトークンの検証
      const verification = JwtService.verifyRefreshToken(refreshToken);
      if (!verification.valid) {
        res.status(401).json({ message: '無効なリフレッシュトークンです' });
        return;
      }

      // リフレッシュトークンからユーザーIDを取得
      const userId = verification.payload?.sub;
      if (!userId) {
        res.status(401).json({ message: 'リフレッシュトークンからユーザーIDを取得できません' });
        return;
      }

      // データベースからユーザーとそのリフレッシュトークンを取得
      const user = await User.findById(userId).select('+refreshToken');
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ message: 'リフレッシュトークンが一致しません' });
        return;
      }

      // トークンバージョンの確認
      if (user.tokenVersion !== verification.payload.tokenVersion) {
        res.status(401).json({ message: 'トークンバージョンが一致しません（セキュリティ上の理由で無効化されました）' });
        return;
      }

      // 新しいアクセストークンとリフレッシュトークンを生成
      const newAccessToken = JwtService.generateAccessToken(user);
      const newRefreshToken = JwtService.generateRefreshToken(user);

      // リフレッシュトークンをデータベースに保存
      user.refreshToken = newRefreshToken;
      await user.save();

      // レスポンスを返す
      res.status(200).json({
        message: 'トークンを更新しました',
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      res.status(500).json({ message: 'トークンの更新中にエラーが発生しました' });
    }
  }

  /**
   * ログアウト処理
   * @param req リクエスト
   * @param res レスポンス
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'リフレッシュトークンが必要です' });
        return;
      }

      // ユーザーIDを取得
      const userId = JwtService.getUserIdFromToken(refreshToken);
      if (userId) {
        // リフレッシュトークンを無効化
        await User.findByIdAndUpdate(userId, {
          $unset: { refreshToken: 1 },
          $inc: { tokenVersion: 1 } // トークンバージョンをインクリメントして古いトークンを無効化
        });
      }

      res.status(200).json({ message: 'ログアウトしました' });
    } catch (error) {
      console.error('ログアウトエラー:', error);
      res.status(500).json({ message: 'ログアウト中にエラーが発生しました' });
    }
  }

  /**
   * JWT認証へのユーザー移行
   * @param req リクエスト
   * @param res レスポンス
   * @deprecated Firebase移行は完了しました。このメソッドは互換性のために維持されています。
   */
  static async migrateToJwt(req: Request, res: Response): Promise<void> {
    try {
      // 認証情報の確認
      const { user } = req as any;
      const { password } = req.body; // firebaseUid パラメータは不要になりました

      if (!user || !user.id) {
        res.status(401).json({ message: '認証が必要です' });
        return;
      }

      if (!password) {
        res.status(400).json({ message: '新しいパスワードが必要です' });
        return;
      }

      // ユーザーを検索
      const existingUser = await User.findById(user.id);

      if (!existingUser) {
        res.status(404).json({ message: 'ユーザーが見つかりません' });
        return;
      }

      // ユーザー情報を更新
      existingUser.password = password;
      existingUser.tokenVersion = 0; // 初期トークンバージョン

      // JWTトークンを生成
      const accessToken = JwtService.generateAccessToken(existingUser);
      const refreshToken = JwtService.generateRefreshToken(existingUser);
      existingUser.refreshToken = refreshToken;

      // 変更を保存
      await existingUser.save();

      // レスポンスを返す
      res.status(200).json({
        message: 'JWT認証への移行が完了しました',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          displayName: existingUser.displayName,
          role: existingUser.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('JWT認証移行エラー:', error);
      res.status(500).json({ message: 'JWT認証への移行中にエラーが発生しました' });
    }
  }
}