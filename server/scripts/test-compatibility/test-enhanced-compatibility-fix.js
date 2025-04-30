const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB接続情報
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune';

// APIエンドポイントの設定
const API_URL = 'http://localhost:3000'; // ローカル開発環境のURL

// JWTトークンをここに設定
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2Y4N2U4NmE3ZDgzZmI5OTVkZTBlZTYiLCJlbWFpbCI6InNoaXJhaXNoaS50YXRzdXlhQG1pa290by5jby5qcCIsInJvbGUiOiJTdXBlckFkbWluIiwiaWF0IjoxNzQ1NTI4OTUxLCJleHAiOjE3NDU1Mjk4NTF9.0dDGCdkWpNESq_6GntimlHqXgWLexkKiK5mVzZjEKTs';

// テスト実行設定
const testEnhancedFix = async () => {
  try {
    // 1. MongoDB接続
    console.log(`MongoDB接続: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');

    // 2. モデルスキーマをゆるく定義
    const userSchema = new mongoose.Schema({}, { strict: false });
    const compatibilitySchema = new mongoose.Schema({}, { strict: false });
    const friendshipSchema = new mongoose.Schema({}, { strict: false });
    
    // 3. モデルの定義
    const User = mongoose.model('User', userSchema);
    const Compatibility = mongoose.model('Compatibility', compatibilitySchema);
    const Friendship = mongoose.model('Friendship', friendshipSchema);
    
    // 4. JWT情報の解析（指定された場合）
    let userId = null;
    if (JWT_TOKEN) {
      try {
        const payload = JWT_TOKEN.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        userId = decoded.id || decoded.userId || decoded.sub;
        console.log(`JWT解析: ユーザーID=${userId}`);
      } catch (error) {
        console.error('JWT解析エラー:', error);
      }
    }
    
    // 5. テスト対象ユーザーの検索
    let testUser;
    if (userId) {
      testUser = await User.findById(userId);
      if (testUser) {
        console.log(`JWT認証済みユーザー: ${testUser.displayName} (${testUser._id})`);
      }
    }
    
    // JWTユーザーが見つからない場合は、テスト用のユーザーを検索
    if (!testUser) {
      console.log('テスト用ユーザーを検索...');
      testUser = await User.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
      
      if (!testUser) {
        console.error('テスト用ユーザーが見つかりません');
        await mongoose.connection.close();
        return;
      }
      
      console.log(`テスト用ユーザー: ${testUser.displayName} (${testUser._id})`);
    }
    
    // 6. 友達関係の検索
    console.log('友達関係を検索...');
    const friendships = await Friendship.find({
      $or: [
        { userId1: testUser._id, status: 'accepted' },
        { userId2: testUser._id, status: 'accepted' }
      ]
    });
    
    console.log(`友達関係が ${friendships.length} 件見つかりました`);
    
    if (friendships.length === 0) {
      console.log('友達関係が見つからないためテストを中止します');
      await mongoose.connection.close();
      return;
    }
    
    // 7. 友達ユーザーの取得
    const friendIds = friendships.map(f => 
      f.userId1.toString() === testUser._id.toString() ? f.userId2 : f.userId1
    );
    
    // 友達の詳細情報を取得
    const friends = await User.find({
      _id: { $in: friendIds }
    });
    
    // レノンというユーザーを優先的に探す
    const friendUser = friends.find(f => f.displayName && f.displayName.includes('レノン')) || friends[0];
    
    if (!friendUser) {
      console.log('友達ユーザーが見つからないためテストを中止します');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`テスト対象の友達: ${friendUser.displayName} (${friendUser._id})`);
    
    // 8. 友達関係を取得
    const friendship = friendships.find(f => 
      (f.userId1.toString() === testUser._id.toString() && f.userId2.toString() === friendUser._id.toString()) ||
      (f.userId1.toString() === friendUser._id.toString() && f.userId2.toString() === testUser._id.toString())
    );
    
    // 9. 既存の相性データをチェック
    console.log('\n=== 修正前の相性データの確認 ===');
    console.log('Compatibilityモデルから相性データを検索...');
    
    // IDの順序をソート
    const [smallerId, largerId] = testUser._id.toString() < friendUser._id.toString() 
      ? [testUser._id, friendUser._id] 
      : [friendUser._id, testUser._id];
    
    // 既存の相性データを検索
    let existingCompatibility = await Compatibility.findOne({
      user1Id: smallerId,
      user2Id: largerId
    });
    
    if (existingCompatibility) {
      console.log('既存の相性データが見つかりました:');
      console.log('ID:', existingCompatibility._id);
      console.log('スコア:', existingCompatibility.compatibilityScore);
      console.log('ユーザー1ID:', existingCompatibility.user1Id);
      console.log('ユーザー2ID:', existingCompatibility.user2Id);
      console.log('拡張詳細情報:', existingCompatibility.enhancedDetails ? '存在します' : '存在しません');
    } else {
      // バックアップ検索
      existingCompatibility = await Compatibility.findOne({
        $or: [
          { user1Id: testUser._id, user2Id: friendUser._id },
          { user1Id: friendUser._id, user2Id: testUser._id }
        ]
      });
      
      if (existingCompatibility) {
        console.log('バックアップ検索で相性データが見つかりました:');
        console.log('ID:', existingCompatibility._id);
        console.log('スコア:', existingCompatibility.compatibilityScore);
        console.log('ユーザー1ID:', existingCompatibility.user1Id);
        console.log('ユーザー2ID:', existingCompatibility.user2Id);
        console.log('拡張詳細情報:', existingCompatibility.enhancedDetails ? '存在します' : '存在しません');
      } else {
        console.log('相性データが見つかりませんでした');
      }
    }
    
    // 10. APIチェック（JWTトークンがある場合のみ）
    if (JWT_TOKEN) {
      console.log('\n=== APIを通じた相性診断のテスト ===');
      try {
        const config = {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` }
        };
        
        // API呼び出し前の状態を保存
        const beforeApiCall = new Date();
        console.log(`API呼び出し前のタイムスタンプ: ${beforeApiCall.toISOString()}`);
        
        // 拡張相性診断APIを呼び出す
        console.log(`拡張相性診断API呼び出し: GET ${API_URL}/api/v1/friends/${friendUser._id}/enhanced-compatibility`);
        const response = await axios.get(
          `${API_URL}/api/v1/friends/${friendUser._id}/enhanced-compatibility`,
          config
        );
        
        console.log('API応答ステータス:', response.status);
        console.log('API応答データ:');
        console.log('- スコア:', response.data.compatibility?.score);
        console.log('- 関係タイプ:', response.data.compatibility?.relationshipType);
        console.log('- 拡張詳細情報:', response.data.compatibility?.enhancedDetails ? '存在します' : '存在しません');
        
        // 11. API呼び出し後の相性データを再チェック
        console.log('\n=== API呼び出し後の相性データの確認 ===');
        
        // DB内の相性データを再検索
        const afterApiCompatibility = await Compatibility.findOne({
          user1Id: smallerId,
          user2Id: largerId
        });
        
        if (afterApiCompatibility) {
          console.log('API呼び出し後の相性データ:');
          console.log('ID:', afterApiCompatibility._id);
          console.log('更新日時:', afterApiCompatibility.updatedAt);
          console.log('スコア:', afterApiCompatibility.compatibilityScore);
        
          // API呼び出し前と同じデータか確認
          if (existingCompatibility && existingCompatibility._id.toString() === afterApiCompatibility._id.toString()) {
            console.log('\nデータ比較結果: 同じデータが維持されています（問題は修正されています！）');
            
            // 更新日時をチェック
            const wasUpdated = new Date(afterApiCompatibility.updatedAt) > beforeApiCall;
            console.log('データ更新:', wasUpdated ? '更新されました（問題あり）' : '更新されていません（正常）');
          } else {
            console.log('\nデータ比較結果: 新しいデータが作成されています（問題は修正されていません）');
          }
        } else {
          console.log('API呼び出し後も相性データが見つかりませんでした');
        }
      } catch (error) {
        console.error('API呼び出しエラー:', error.message);
        if (error.response) {
          console.error('エラー詳細:', error.response.data);
        }
      }
    } else {
      console.log('\nJWTトークンが指定されていないため、APIテストをスキップします');
      console.log('有効なJWTトークンを設定して再実行すると、完全なテストが実行できます');
    }
    
    // 12. 結論
    console.log('\n=== テスト結果のまとめ ===');
    if (existingCompatibility) {
      console.log('相性データはデータベースに存在します');
      console.log('スキーマと実装がうまく機能していれば、APIを呼び出しても新しいデータは作成されないはずです');
    } else {
      console.log('相性データがデータベースに存在しないため、APIを呼び出すと新しいデータが作成されるはずです');
    }
    
    // MongoDB接続を閉じる
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
    
  } catch (error) {
    console.error('\nテスト実行中にエラーが発生しました:', error);
    
    // データベース接続を閉じる
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB接続を閉じました');
    }
  }
};

// 実行方法の説明
console.log(`
====================================
  拡張相性診断修正検証ツール
====================================

このツールは拡張相性診断の改善が正しく機能しているかテストします。

テスト内容:
1. MongoDB内の既存の相性データを検索
2. 現在の実装でAPIを呼び出した際に新しいデータが作成されるか確認
3. API呼び出し前後のデータを比較して、既存データが維持されているか検証

APIテストを実行するには:
- スクリプト内の JWT_TOKEN 変数に有効なJWTトークンを設定してください
- サーバーが起動していることを確認してください (npm run dev)

テスト結果の解釈:
- 「同じデータが維持されています」と表示されれば修正は成功です
- 「新しいデータが作成されています」と表示されれば修正は失敗です
`);

// テスト実行
testEnhancedFix();