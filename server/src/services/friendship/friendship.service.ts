import mongoose from 'mongoose';
import { User, Friendship } from '../../models';
import { NotFoundError, BadRequestError } from '../../utils/error-handler';

/**
 * 友達検索 - ユーザーの検索と一覧取得
 * @param query 検索クエリ (メールアドレスまたは表示名)
 * @param currentUserId 現在のユーザーID
 * @returns 検索結果ユーザーリスト
 */
export const searchUsersByQuery = async (query: string, currentUserId: string) => {
  // 検索クエリが空の場合はエラー
  if (!query.trim()) {
    throw new BadRequestError('検索クエリを入力してください');
  }

  // ユーザーの検索 (メールアドレス、表示名で検索)
  const users = await User.find({
    $and: [
      { _id: { $ne: currentUserId } }, // 自分自身を除外
      {
        $or: [
          { email: new RegExp(query, 'i') },
          { displayName: new RegExp(query, 'i') }
        ]
      }
    ]
  }).select('displayName email elementAttribute').limit(20);

  // 友達関係のステータスを追加
  const userIds = users.map(user => {
    const userIdStr = user._id ? (typeof user._id === 'string' ? user._id : user._id.toString()) : '';
    return userIdStr;
  }).filter(id => id !== '');
  
  // 既存の友達関係を取得
  const existingFriendships = await Friendship.find({
    $or: [
      { userId1: currentUserId, userId2: { $in: userIds } },
      { userId2: currentUserId, userId1: { $in: userIds } }
    ]
  });

  // ユーザー情報に友達関係のステータスを追加して返す
  return users.map(user => {
    // 型安全にIDを文字列化
    const userIdStr = user._id ? (typeof user._id === 'string' ? user._id : user._id.toString()) : '';
    const friendship = existingFriendships.find(f => 
      (f.userId1.toString() === currentUserId && f.userId2.toString() === userIdStr) ||
      (f.userId2.toString() === currentUserId && f.userId1.toString() === userIdStr)
    );

    return {
      _id: userIdStr,
      displayName: user.displayName,
      email: user.email,
      elementAttribute: user.elementAttribute,
      friendship: friendship ? {
        id: friendship._id,
        status: friendship.status,
        requesterId: friendship.requesterId
      } : null
    };
  });
};

/**
 * 友達一覧の取得
 * @param userId ユーザーID
 * @returns 友達リスト
 */
export const getFriendsList = async (userId: string) => {
  // 友達関係を検索
  const friendships = await Friendship.find({
    $or: [
      { userId1: userId, status: 'accepted' },
      { userId2: userId, status: 'accepted' }
    ]
  });

  // 友達のIDを取得
  const friendIds = friendships.map(friendship => 
    friendship.userId1.toString() === userId ? 
      friendship.userId2 : friendship.userId1
  );

  // 友達の詳細情報を取得
  const friends = await User.find({
    _id: { $in: friendIds }
  }).select('displayName email elementAttribute');

  // 友達リストを整形して返す
  return friends.map(friend => {
    // 型安全にIDを文字列化
    const friendIdStr = friend._id ? (typeof friend._id === 'string' ? friend._id : friend._id.toString()) : '';
    const friendship = friendships.find(f => 
      f.userId1.toString() === friendIdStr || 
      f.userId2.toString() === friendIdStr
    );
    
    if (!friendship) {
      // 友達関係が見つからない場合、基本情報のみ返す
      return {
        userId: friendIdStr,
        displayName: friend.displayName,
        email: friend.email,
        elementAttribute: friend.elementAttribute
      };
    }
    
    return {
      friendship: friendship._id,
      userId: friendIdStr,
      displayName: friend.displayName,
      email: friend.email,
      elementAttribute: friend.elementAttribute,
      acceptedAt: friendship.acceptedAt,
      createdAt: friendship.createdAt
    };
  });
};

/**
 * 友達申請の一覧取得 (受信)
 * @param userId ユーザーID
 * @returns 受信した友達申請一覧
 */
export const getFriendRequests = async (userId: string) => {
  // ユーザーが受信した友達申請を検索
  const requests = await Friendship.find({
    userId2: userId,
    status: 'pending'
  }).populate({
    path: 'userId1',
    select: 'displayName email elementAttribute'
  });

  return requests;
};

/**
 * 友達申請の一覧取得 (送信済み)
 * @param userId ユーザーID
 * @returns 送信した友達申請一覧
 */
export const getSentRequests = async (userId: string) => {
  // ユーザーが送信した友達申請を検索
  const requests = await Friendship.find({
    userId1: userId,
    requesterId: userId,
    status: 'pending'
  }).populate({
    path: 'userId2',
    select: 'displayName email elementAttribute'
  });

  return requests;
};

/**
 * 友達申請送信
 * @param currentUserId 送信元ユーザーID
 * @param targetUserId 送信先ユーザーID
 * @returns 作成/更新された友達関係
 */
export const sendFriendRequest = async (currentUserId: string, targetUserId: string) => {
  // 自分自身への申請はエラー
  if (currentUserId === targetUserId) {
    throw new BadRequestError('自分自身に友達申請を送ることはできません');
  }

  // 送信先ユーザーの存在確認
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new NotFoundError('送信先ユーザーが見つかりません');
  }

  // 既存の友達関係をチェック
  const existingFriendship = await Friendship.findOne({
    $or: [
      { userId1: currentUserId, userId2: targetUserId },
      { userId1: targetUserId, userId2: currentUserId }
    ]
  });

  if (existingFriendship) {
    // 既に友達関係がある場合
    if (existingFriendship.status === 'accepted') {
      throw new BadRequestError('既に友達関係が存在します');
    } 
    // 既に申請が送信済みの場合
    else if (existingFriendship.status === 'pending') {
      // 送信者が自分の場合
      if (existingFriendship.requesterId.toString() === currentUserId) {
        throw new BadRequestError('既に友達申請を送信済みです');
      } 
      // 相手からの申請がある場合は承認
      else {
        existingFriendship.status = 'accepted';
        existingFriendship.acceptedAt = new Date();
        await existingFriendship.save();
        return existingFriendship;
      }
    } 
    // 過去に拒否された申請を再送信
    else if (existingFriendship.status === 'rejected') {
      existingFriendship.status = 'pending';
      existingFriendship.requesterId = new mongoose.Types.ObjectId(currentUserId);
      await existingFriendship.save();
      return existingFriendship;
    }
  }

  // 新規友達関係の作成
  const friendship = await Friendship.create({
    userId1: currentUserId,
    userId2: targetUserId,
    status: 'pending',
    requesterId: currentUserId
  });

  return friendship;
};

/**
 * 友達申請の承認
 * @param friendshipId 友達関係ID
 * @param currentUserId 現在のユーザーID
 * @returns 更新された友達関係
 */
export const acceptFriendRequest = async (friendshipId: string, currentUserId: string) => {
  // 友達申請の存在確認
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    userId2: currentUserId,
    status: 'pending'
  });

  if (!friendship) {
    throw new NotFoundError('友達申請が見つかりません');
  }

  // 友達申請の承認
  friendship.status = 'accepted';
  friendship.acceptedAt = new Date();
  await friendship.save();

  return friendship;
};

/**
 * 友達申請の拒否
 * @param friendshipId 友達関係ID
 * @param currentUserId 現在のユーザーID
 * @returns 更新された友達関係
 */
export const rejectFriendRequest = async (friendshipId: string, currentUserId: string) => {
  // 友達申請の存在確認
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    userId2: currentUserId,
    status: 'pending'
  });

  if (!friendship) {
    throw new NotFoundError('友達申請が見つかりません');
  }

  // 友達申請の拒否
  friendship.status = 'rejected';
  await friendship.save();

  return friendship;
};

/**
 * 友達関係の削除
 * @param friendshipId 友達関係ID
 * @param currentUserId 現在のユーザーID
 * @returns 削除結果
 */
export const removeFriend = async (friendshipId: string, currentUserId: string) => {
  // 友達関係の存在確認
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    $or: [
      { userId1: currentUserId },
      { userId2: currentUserId }
    ],
    status: 'accepted'
  });

  if (!friendship) {
    throw new NotFoundError('友達関係が見つかりません');
  }

  // 友達関係の削除
  await Friendship.deleteOne({ _id: friendshipId });

  return { success: true, message: '友達関係を削除しました' };
};

/**
 * 相性スコアの計算と取得
 * @param userId1 ユーザー1のID
 * @param userId2 ユーザー2のID
 * @returns 相性スコアとデータ
 */
export const getCompatibilityScore = async (userId1: string, userId2: string) => {
  // ユーザーの存在確認
  const [user1, user2] = await Promise.all([
    User.findById(userId1),
    User.findById(userId2)
  ]);

  if (!user1 || !user2) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // 四柱推命プロフィールのチェック
  if (!user1.fourPillars || !user2.fourPillars) {
    throw new BadRequestError('四柱推命プロフィールが設定されていません');
  }

  // 既存の相性スコアをチェック
  const friendship = await Friendship.findOne({
    $or: [
      { userId1, userId2, status: 'accepted' },
      { userId1: userId2, userId2: userId1, status: 'accepted' }
    ]
  });

  if (friendship?.compatibilityScore) {
    // 既存のスコアがある場合はそれを返す
    return {
      score: friendship.compatibilityScore,
      friendship: friendship._id,
      // TODO: 相性の詳細データを追加
    };
  }

  // 相性スコア計算ロジック
  // NOTE: 実際にはCompatibilityサービスを呼び出す形になります
  // この部分は既存のTeam相性計算ロジックを再利用
  try {
    // 既存の相性計算サービスを呼び出し
    const compatibilityScore = await calculateCompatibilityScore(user1, user2);
    
    // 友達関係にスコアを保存（オプション）
    if (friendship) {
      friendship.compatibilityScore = compatibilityScore.score;
      await friendship.save();
    }
    
    return compatibilityScore;
    
  } catch (error) {
    console.error('相性スコア計算エラー:', error);
    throw new Error('相性スコアの計算に失敗しました');
  }
};

// 相性スコア計算のヘルパー関数
// NOTE: これは既存のチーム相性計算ロジックを再利用することを想定
const calculateCompatibilityScore = async (user1: any, user2: any) => {
  // 既存のTeam相性計算サービスをインポート
  const { compatibilityService } = await import('../team');
  
  // compatibilityServiceはすでにインスタンス化されているのでそのまま使用
  
  // 五行属性の関係性を確認
  const relationship = compatibilityService.determineRelationship(
    user1.elementAttribute || 'water',
    user2.elementAttribute || 'water'
  );
  
  // 相性スコアの計算
  const score = compatibilityService.calculateCompatibilityScore(relationship);
  
  // 詳細な説明を生成（非同期呼び出し）
  try {
    const details = await compatibilityService.generateDetailDescription(
      user1.displayName || '友達1',
      user2.displayName || '友達2',
      user1.elementAttribute || 'water',
      user2.elementAttribute || 'water', 
      relationship
    );
    
    return {
      score: score,
      details: details,
      description: details.detailDescription || '友達との相性です'
    };
  } catch (error) {
    console.warn('相性の詳細説明生成に失敗:', error);
    // エラーが発生した場合は基本情報のみ返す
    return {
      score: score,
      details: {},
      description: '友達との相性です'
    };
  }
};

// 友達サービスのエクスポート
export default {
  searchUsersByQuery,
  getFriendsList,
  getFriendRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getCompatibilityScore
};