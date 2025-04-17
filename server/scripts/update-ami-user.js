const mongoose = require('mongoose');
require('dotenv').config();

async function addFourPillarsData() {
  try {
    await mongoose.connect('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
    
    console.log('あみユーザーに四柱推命データを追加します...');
    
    // あみユーザーを更新
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId('67f87e86a7d83fb995de0ee7') },
      { 
        $set: {
          fourPillars: {
            year: {
              heavenlyStem: '丁',
              earthlyBranch: '卯',
              heavenlyStemTenGod: '偏印',
              earthlyBranchTenGod: '食神',
              hiddenStems: ['乙']
            },
            month: {
              heavenlyStem: '丙',
              earthlyBranch: '午',
              heavenlyStemTenGod: '劫財',
              earthlyBranchTenGod: '偏印',
              hiddenStems: ['丁', '己']
            },
            day: {
              heavenlyStem: '丙',
              earthlyBranch: '申',
              heavenlyStemTenGod: '比肩',
              earthlyBranchTenGod: '傷官',
              hiddenStems: ['庚', '壬', '戊']
            },
            hour: {
              heavenlyStem: '甲',
              earthlyBranch: '戌',
              heavenlyStemTenGod: '食神',
              earthlyBranchTenGod: '正財',
              hiddenStems: ['戊', '辛', '丁']
            }
          },
          elementAttribute: 'fire',
          kakukyoku: {
            type: '従勢格',
            category: 'normal',
            strength: 'strong',
            description: 'あなたの格局（気質タイプ）は「従勢格」（身強）です。強い意志とリーダーシップを持ち、目標に向かって突き進む傾向があります。'
          }
        }
      }
    );
    
    console.log('更新結果:', result);
    
    // 更新されたユーザーを確認
    const user = await mongoose.connection.db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId('67f87e86a7d83fb995de0ee7')
    });
    
    if (user) {
      console.log('更新されたユーザー:', user.displayName);
      console.log('四柱データ:', user.fourPillars ? '追加済み' : '未追加');
      console.log('五行属性:', user.elementAttribute);
      console.log('格局:', user.kakukyoku ? user.kakukyoku.type : '未設定');
    } else {
      console.log('ユーザーが見つかりません');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

addFourPillarsData();