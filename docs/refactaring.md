  チームメンバーシップ管理リファクタリング計画書

  1. 現状分析

  現在のデータモデル

  1. User モデル:
    - teamId: ユーザーが所属するチームのID（主要なメンバー
  シップ管理に使用）
    - teamRole: チーム内での役割
  2. Team モデル:
    - members: メンバーの配列（定義されているが実際には使
  用されていない）
    - adminId: チーム管理者のユーザーID

  現在の実装状況

  1. メンバーシップの確認:
    - User.teamId の値のみで所属確認
    - Team.members は実質使用されていない
  2. メンバー管理操作:
    - 追加: User.teamId のみ更新
    - 削除: User.teamId のみ削除
    - 確認: User.teamId をもとに確認
  3. チーム情報取得:
    - メンバー一覧: User.find({ teamId: teamId }) で取得

  2. リファクタリングの目的

  1. データモデルの簡素化:
    - 冗長なデータ構造の削除
    - 一貫性のあるシンプルなモデルに統一
  2. メンテナンス性の向上:
    - データの不整合リスクの削減
    - コード理解のしやすさ向上
  3. パフォーマンスの最適化:
    - 不要なデータ同期処理の排除
    - データベース設計の最適化

  3. リファクタリング戦略

  第1フェーズ: Team.members フィールドの非推奨化

  1. コード修正:
    - Team モデルの members
  フィールドに非推奨コメントを追加
    - すべての実装で User.teamId を正式なソースとして扱う
    - getTeamMembers() 関数を User.teamId をベースに標準化
  2. 既存コードの調整:
    - team-member.service.ts 内の関数を User.teamId
  のみを操作するよう標準化
    - compatibility.service.ts 内のメンバー確認ロジックを
  User.teamId のみを使用するように修正

  第2フェーズ: メンバーシップ確認ロジックの標準化

  1. 共通関数の整理:
    - isTeamMember() 関数を User.teamId ベースに統一
    - 全ての権限チェックで標準関数を使用
  2. エラーハンドリングの改善:
    - 共通のエラーメッセージとレスポンス形式を定義
    - 権限チェック失敗時の一貫した対応を実装

  第3フェーズ: Team.members フィールドの削除

  1. モデル変更:
    - Team モデルから members フィールド定義を完全に削除
    - 関連する型定義を更新
  2. データクリーンアップ:
    - 既存のデータから不要になった members
  フィールドを削除するスクリプトの実行
    - データベースの最適化

  4. 修正が必要なファイルと変更点

  サーバーサイド

  1. /server/src/models/Team.ts:
    - members フィールド定義を削除
    - 関連する型定義を更新

  // 修正前
  export interface ITeam {
    name: string;
    adminId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    description?: string;
    iconInitial?: string;
    iconColor?: 'primary' | 'water' | 'wood' | 'fire' |
  'earth' | 'metal';
    members?: Array<{
      userId: mongoose.Types.ObjectId | string;
      role?: string;
      joinedAt?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }

  // 修正後
  export interface ITeam {
    name: string;
    adminId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    description?: string;
    iconInitial?: string;
    iconColor?: 'primary' | 'water' | 'wood' | 'fire' |
  'earth' | 'metal';
    createdAt: Date;
    updatedAt: Date;
  }

  2. /server/src/services/team/compatibility.service.ts:
    - メンバーシップ確認を User.teamId に統一

  async getTeamMemberCompatibility(teamId: string,
  userId1: string, userId2: string):
  Promise<ICompatibilityDocument> {
    // チームの存在確認
    const teamExists = await Team.exists({ _id: teamId });
    if (!teamExists) {
      throw new Error('チームが見つかりません');
    }

    // 指定されたチームに所属しているユーザーを確認
    const [user1InTeam, user2InTeam] = await Promise.all([
      User.exists({ _id: userId1, teamId: teamId }),
      User.exists({ _id: userId2, teamId: teamId })
    ]);

    console.log('チームID:', teamId);
    console.log('ユーザー1チームメンバー確認:',
  user1InTeam ? 'はい' : 'いいえ');
    console.log('ユーザー2チームメンバー確認:',
  user2InTeam ? 'はい' : 'いいえ');

    if (!user1InTeam || !user2InTeam) {
      throw new Error(`指定されたユーザーはチームのメンバ
  ーではありません (userId1: ${userId1}, userId2: 
  ${userId2})`);
    }

    // 相性情報を取得または生成
    return this.getOrCreateCompatibility(userId1,
  userId2);
  }

  3. /server/src/services/team/team.service.ts:
    - isTeamMember() 関数をユーザーの teamId
  のみを使用するように簡略化

  export const isTeamMember = async (teamId: string |
  mongoose.Types.ObjectId, userId: string |
  mongoose.Types.ObjectId): Promise<boolean> => {
    const teamIdStr = teamId.toString();
    const user = await User.findById(userId);

    if (!user || !user.teamId) {
      return false;
    }

    return user.teamId.toString() === teamIdStr;
  };

  4. /server/src/services/team/team-member.service.ts:
    - メンバー管理関数を User.teamId
  に基づくシンプルな実装に統一

  5. データ移行スクリプト

  既存のチームデータから不要な members
  フィールドを削除するスクリプトを作成します。

  // /server/scripts/cleanup-team-members.js
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');

  dotenv.config();

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('MongoDB 接続成功');

      // Team モデル定義
      const teamSchema = new mongoose.Schema({});
      const Team = mongoose.model('Team', teamSchema);

      // すべてのチームから members フィールドを削除
      const result = await Team.updateMany(
        {},
        { $unset: { members: 1 } }
      );

      console.log(`${result.modifiedCount} 
  件のチームデータを更新しました`);
      console.log('データクリーンアップが完了しました');

      mongoose.connection.close();
    })
    .catch(err => {
      console.error('MongoDB 接続エラー:', err);
      process.exit(1);
    });

  6. 実装手順

  1. 準備段階:
    - コードベースのバックアップを作成
    - テスト環境でリファクタリングを実施する計画を確認
  2. 第1フェーズ実施:
    - compatibility.service.ts
  のメンバーシップ確認ロジックを修正
    - isTeamMember() 関数を標準化
  3. 第2フェーズ実施:
    - team-member.service.ts の各関数を User.teamId
  ベースに統一
    - テスト環境で変更の動作確認
  4. 第3フェーズ実施:
    - Team モデルから members フィールド定義を削除
    - データクリーンアップスクリプトを実行
    - テストで全機能の正常動作を確認
  5. リリース:
    - 本番環境へのデプロイ前の最終チェック
    - スクリプトとコード変更を本番環境に適用

  7. リスク管理

  1. データ不整合のリスク:
    - 対策: バックアップを事前に取得、段階的な変更実施
  2. 既存機能の停止リスク:
    - 対策: 各フェーズで包括的なテストを実施
  3. エラーハンドリングの不備:
    - 対策: 周到なエラーチェックとロールバック手順の準備

  8. 期待される成果

  1. データモデルの簡素化:
    - Team モデルから冗長な members フィールドの削除
  2. パフォーマンスの向上:
    - データの二重管理や同期処理の必要性を排除
  3. メンテナンス性の向上:
    - コードの理解と将来的な拡張が容易に
  4. バグの減少:
    - データ不整合によるエラーの可能性を削減

  9. 追加検討点

  1. 複数チーム所属への拡張可能性:
    - 将来的に User モデルの teamId を配列に変更
    - 設計の柔軟性を確保
  2. チームロールの管理方法の改善:
    - チーム内での役割管理の最適化を検討

  このリファクタリング計画に基づき、段階的にチームメンバー
  シップ管理機能を最適化することで、コードの品質向上とメン
  テナンス性の改善が期待できます。
