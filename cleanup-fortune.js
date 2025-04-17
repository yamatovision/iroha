/**
 * 運勢更新テスト用のクリーンアップスクリプト
 * 
 * このスクリプトは、運勢更新テスト時にデータをクリーンアップするために使用します。
 * 運勢更新ログ、バッチジョブログをクリアし、運勢更新時間を設定します。
 * ※注意: テスト環境でのみ使用してください
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// データベース接続情報
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'dailyfortune'; // 修正：正しいデータベース名

// コマンドライン引数の取得
const args = process.argv.slice(2);
const action = args[0] || 'help';
const timeValue = args[1];

async function cleanupFortune() {
  console.log('運勢更新テスト用のクリーンアップを実行します...');
  console.log('※注意: テスト環境でのみ使用してください\n');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('MongoDBに接続しました');
    
    const db = client.db(dbName);
    
    switch (action) {
      case 'batchlogs':
        // バッチジョブログのクリーンアップ
        console.log('\nバッチジョブログをクリアしています...');
        const batchResult = await db.collection('batchjoblogs').deleteMany({});
        console.log(`${batchResult.deletedCount}件のバッチジョブログを削除しました`);
        break;
      
      case 'fortunelogs':
        // 運勢更新ログのクリーンアップ
        console.log('\n運勢更新ログをクリアしています...');
        const fortuneResult = await db.collection('dailyfortuneupdatelogs').deleteMany({});
        console.log(`${fortuneResult.deletedCount}件の運勢更新ログを削除しました`);
        break;
      
      case 'settime':
        // 運勢更新時間の設定
        if (!timeValue) {
          console.error('時間を指定してください。例: node cleanup-fortune.js settime 03:00');
          break;
        }
        
        // 時間形式の検証
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(timeValue)) {
          console.error('無効な時間形式です。例: 03:00');
          break;
        }
        
        console.log(`\n運勢更新時間を ${timeValue} に設定しています...`);
        
        // 既存の設定を確認
        const existingSetting = await db.collection('systemsettings').findOne({ key: 'fortuneUpdateTime' });
        
        if (existingSetting) {
          // 既存の設定を更新
          await db.collection('systemsettings').updateOne(
            { key: 'fortuneUpdateTime' },
            { 
              $set: { 
                value: timeValue,
                description: '毎日の運勢更新実行時間',
                updatedAt: new Date()
              }
            }
          );
          console.log('運勢更新時間の設定を更新しました');
        } else {
          // 新しい設定を作成
          await db.collection('systemsettings').insertOne({
            key: 'fortuneUpdateTime',
            value: timeValue,
            description: '毎日の運勢更新実行時間',
            updatedAt: new Date(),
            updatedBy: 'cleanup-script'
          });
          console.log('運勢更新時間の設定を新規作成しました');
        }
        break;
      
      case 'all':
        // すべての操作を実行
        console.log('\nすべてのクリーンアップ操作を実行します...');
        
        // バッチジョブログのクリーンアップ
        console.log('\nバッチジョブログをクリアしています...');
        const batchResults = await db.collection('batchjoblogs').deleteMany({});
        console.log(`${batchResults.deletedCount}件のバッチジョブログを削除しました`);
        
        // 運勢更新ログのクリーンアップ
        console.log('\n運勢更新ログをクリアしています...');
        const fortuneResults = await db.collection('dailyfortuneupdatelogs').deleteMany({});
        console.log(`${fortuneResults.deletedCount}件の運勢更新ログを削除しました`);
        
        // 運勢更新時間の設定（引数で指定されている場合のみ）
        if (timeValue) {
          // 時間形式の検証
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(timeValue)) {
            console.error('無効な時間形式です。例: 03:00');
            break;
          }
          
          console.log(`\n運勢更新時間を ${timeValue} に設定しています...`);
          
          // 既存の設定を確認
          const existingSetting = await db.collection('systemsettings').findOne({ key: 'fortuneUpdateTime' });
          
          if (existingSetting) {
            // 既存の設定を更新
            await db.collection('systemsettings').updateOne(
              { key: 'fortuneUpdateTime' },
              { 
                $set: { 
                  value: timeValue,
                  description: '毎日の運勢更新実行時間',
                  updatedAt: new Date()
                }
              }
            );
            console.log('運勢更新時間の設定を更新しました');
          } else {
            // 新しい設定を作成
            await db.collection('systemsettings').insertOne({
              key: 'fortuneUpdateTime',
              value: timeValue,
              description: '毎日の運勢更新実行時間',
              updatedAt: new Date(),
              updatedBy: 'cleanup-script'
            });
            console.log('運勢更新時間の設定を新規作成しました');
          }
        }
        break;
      
      case 'help':
      default:
        console.log('使用方法:');
        console.log('  node cleanup-fortune.js [コマンド] [オプション]');
        console.log('\nコマンド:');
        console.log('  batchlogs     - バッチジョブログをクリア');
        console.log('  fortunelogs   - 運勢更新ログをクリア');
        console.log('  settime HH:MM - 運勢更新時間を設定（例: settime 03:00）');
        console.log('  all [HH:MM]   - すべての操作を実行（オプションで時間指定可能）');
        console.log('  help          - このヘルプを表示');
        console.log('\n例:');
        console.log('  node cleanup-fortune.js all 03:15  - ログをクリアして時間を03:15に設定');
        console.log('  node cleanup-fortune.js settime 04:30 - 時間を04:30に設定');
        break;
    }
    
    console.log('\n操作が完了しました');
    
  } catch (err) {
    console.error('エラーが発生しました:', err);
  } finally {
    await client.close();
    console.log('\nMongoDBの接続を閉じました');
  }
}

// スクリプトを実行
cleanupFortune().catch(console.error);