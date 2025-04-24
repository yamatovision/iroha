const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB接続情報
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune';

// モデルスキーマをゆるく定義
const userSchema = new mongoose.Schema({}, { strict: false });
const compatibilitySchema = new mongoose.Schema({}, { strict: false });
const friendshipSchema = new mongoose.Schema({}, { strict: false });

// ObjectIdからmongoose.Types.ObjectId型の値を作成する関数
const toObjectId = (id) => {
  if (!id) {
    throw new Error('IDがnullまたはundefinedです');
  }
  
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  
  if (typeof id === 'string') {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else {
      throw new Error(`不正なObjectId形式: ${id}`);
    }
  }
  
  throw new Error(`不正なID型: ${typeof id}`);
};

// 拡張相性計算のシミュレーション関数
async function calculateAndSaveEnhancedCompatibility(user1, user2, friendship) {
  try {
    console.log(`拡張相性計算をシミュレーション: user1=${user1.displayName}, user2=${user2.displayName}`);
    
    // ユーザーIDの文字列化を確実に行う
    const user1IdStr = typeof user1._id === 'string' ? user1._id : user1._id.toString();
    const user2IdStr = typeof user2._id === 'string' ? user2._id : user2._id.toString();
    
    // ObjectIdへの変換
    const user1ObjectId = toObjectId(user1IdStr);
    const user2ObjectId = toObjectId(user2IdStr);
    
    console.log(`ObjectId変換後: user1=${user1ObjectId}, user2=${user2ObjectId}`);
    
    // 小さい方のIDが先に来るようにソート
    const [smallerId, largerId] = user1ObjectId.toString() < user2ObjectId.toString() 
      ? [user1ObjectId, user2ObjectId] 
      : [user2ObjectId, user1ObjectId];
      
    console.log(`ソート後のID順序: smallerId=${smallerId}, largerId=${largerId}`);
    
    // 既存の相性データを検索 - Compatibility モデルを使用
    const Compatibility = mongoose.model('Compatibility', compatibilitySchema);
    
    console.log('既存の相性データを検索中...');
    let compatibility = await Compatibility.findOne({
      user1Id: smallerId,
      user2Id: largerId
    });
    
    if (compatibility) {
      console.log('既存の相性データを見つけました:', compatibility._id);
      return compatibility;
    }
    
    // それでも見つからない場合は、$orクエリで両方向を試す
    console.log('バックアップ検索を実行中...');
    compatibility = await Compatibility.findOne({
      $or: [
        { user1Id: user1ObjectId, user2Id: user2ObjectId },
        { user1Id: user2ObjectId, user2Id: user1ObjectId }
      ]
    });
    
    if (compatibility) {
      console.log('バックアップ検索で相性データを見つけました:', compatibility._id);
      return compatibility;
    }
    
    console.log('既存の相性データが見つかりませんでした。新規作成が必要です。');
    
    // ここで実際の実装では新しい相性データを作成しますが、
    // テストなので作成は行わず、相性データが見つからなかったことを示すだけにします
    
    return null;
  } catch (error) {
    console.error('拡張相性計算エラー:', error);
    throw error;
  }
}

// 友達の相性診断テスト
async function testFriendshipCompatibility() {
  try {
    console.log(`MongoDB接続: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');
    
    // モデルの定義
    const User = mongoose.model('User', userSchema);
    const Friendship = mongoose.model('Friendship', friendshipSchema);
    
    // 特定のユーザーを検索（メールアドレスから）
    const userEmail = 'shiraishi.tatsuya@mikoto.co.jp';
    console.log(`ユーザー検索: ${userEmail}`);
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.error(`ユーザー ${userEmail} が見つかりません`);
      await mongoose.connection.close();
      return;
    }
    
    console.log(`ユーザーを見つけました: ${user.displayName} (${user._id})`);
    
    // このユーザーの友達を検索
    console.log('友達関係を検索中...');
    const friendships = await Friendship.find({
      $or: [
        { userId1: user._id, status: 'accepted' },
        { userId2: user._id, status: 'accepted' }
      ]
    });
    
    console.log(`友達関係が ${friendships.length} 件見つかりました`);
    
    if (friendships.length === 0) {
      console.log('友達関係が見つからないため、テストを中止します');
      await mongoose.connection.close();
      return;
    }
    
    // 友達のIDリストを作成
    const friendIds = friendships.map(f => 
      f.userId1.toString() === user._id.toString() ? f.userId2 : f.userId1
    );
    
    // 友達の詳細情報を取得
    const friends = await User.find({
      _id: { $in: friendIds }
    });
    
    console.log(`友達のユーザーが ${friends.length} 名見つかりました`);
    
    // レノンというユーザーを探す
    const renonUser = friends.find(f => f.displayName && f.displayName.includes('レノン'));
    
    // 友達の中にレノンがいなければ、最初の友達を使用
    const friendUser = renonUser || friends[0];
    
    if (!friendUser) {
      console.log('友達ユーザーが見つからないため、テストを中止します');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`テスト対象の友達: ${friendUser.displayName} (${friendUser._id})`);
    
    // 友達関係を取得
    const friendship = friendships.find(f => 
      (f.userId1.toString() === user._id.toString() && f.userId2.toString() === friendUser._id.toString()) ||
      (f.userId1.toString() === friendUser._id.toString() && f.userId2.toString() === user._id.toString())
    );
    
    if (!friendship) {
      console.log('友達関係が見つかりません。これは想定外の状態です。');
    } else {
      console.log(`友達関係ID: ${friendship._id}`);
      
      if (friendship.compatibilityScore) {
        console.log(`既存の相性スコア: ${friendship.compatibilityScore}`);
      }
      
      if (friendship.enhancedDetails) {
        console.log('拡張相性データが存在します');
      } else {
        console.log('拡張相性データが存在しません');
      }
    }
    
    // 拡張相性の検索シミュレーション
    console.log('\n拡張相性診断の検索シミュレーションを実行します...');
    const compatibilityResult = await calculateAndSaveEnhancedCompatibility(
      user, 
      friendUser, 
      friendship
    );
    
    if (compatibilityResult) {
      console.log('相性診断結果:');
      console.log(` - ID: ${compatibilityResult._id}`);
      console.log(` - スコア: ${compatibilityResult.compatibilityScore}`);
      console.log(` - user1Id: ${compatibilityResult.user1Id}`);
      console.log(` - user2Id: ${compatibilityResult.user2Id}`);
      
      // enhancedDetailsの存在確認
      if (compatibilityResult.enhancedDetails) {
        console.log('拡張相性詳細情報が存在します');
      } else {
        console.log('拡張相性詳細情報が存在しません');
      }
    } else {
      console.log('相性診断データが見つからず、新規作成が必要です');
    }
    
    // データベース接続を閉じる
    await mongoose.connection.close();
    console.log('MongoDB接続を閉じました');
    
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
    
    // データベース接続を閉じる
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB接続を閉じました');
    }
  }
}

// テストの実行
testFriendshipCompatibility();