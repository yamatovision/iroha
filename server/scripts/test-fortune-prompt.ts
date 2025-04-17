import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Team } from '../src/models/Team';
import { TeamGoal } from '../src/models/TeamGoal';
import { DayPillar } from '../src/models/DayPillar';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * チームコンテキスト運勢生成に使用されるプロンプトを生成して確認するテスト
 */
async function testGeneratePrompt() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB接続成功');

    // テストデータ
    const userId = '67f87e86a7d83fb995de0ee6'; // shiraishi.tatsuya@mikoto.co.jp
    const teamId = '67f71bb9b24269b1a55c6afb'; // 白石team

    // データ取得
    const user = await User.findById(userId);
    const team = await Team.findById(teamId);
    const teamGoal = await TeamGoal.findOne({ teamId });
    
    // 今日の日柱を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayPillar = await DayPillar.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!user || !team || !dayPillar) {
      console.error('必要なデータが取得できません');
      if (!user) console.error('- ユーザーが見つかりません');
      if (!team) console.error('- チームが見つかりません');
      if (!dayPillar) console.error('- 日柱が見つかりません');
      return;
    }

    console.log('==== データ確認 ====');
    console.log('ユーザーID:', userId);
    console.log('チームID:', teamId);
    console.log('チーム目標:', teamGoal ? teamGoal.content : '未設定');
    console.log('目標期限:', teamGoal?.deadline ? new Date(teamGoal.deadline).toISOString() : '未設定');
    console.log('進捗状況:', teamGoal?.progress || 0, '%');
    console.log('日柱:', dayPillar.heavenlyStem, dayPillar.earthlyBranch);

    // プロンプト作成（fortune.service.tsのプロンプトと同じもの）
    const fortuneScore = 85; // ダミースコア
    
    const prompt = `
あなたは四柱推命に基づいてチーム運勢アドバイスを作成する専門家です。
以下の情報に基づいて、チームコンテキストに特化した運勢アドバイスを作成してください。

## ユーザー情報
- ユーザー名: ${user.displayName}
- 役職/役割: ${user.teamRole || user.jobTitle || "一般社員"}
- 五行属性: ${user.elementAttribute || "不明"}

## チーム情報
- チーム名: ${team.name}
- チーム目標: ${teamGoal?.content || "目標未設定"}
- 目標期限: ${teamGoal?.deadline ? new Date(teamGoal.deadline).toLocaleDateString() : "期限未設定"}
- チーム進捗率: ${teamGoal?.progress || 0}%

## 日柱情報
- 天干: ${dayPillar.heavenlyStem}
- 地支: ${dayPillar.earthlyBranch}
- 運勢スコア: ${fortuneScore}/100

## 出力形式
- チームにおける今日の運勢: 150-200文字の具体的なアドバイス
- チーム協力のためのヒント: 3つの短いポイント（各30-50文字程度）

特に以下の点を必ず含めてください：
1. チーム目標を具体的に参照したアドバイス
2. ユーザーの役割に応じた視点からのアドバイス
3. 日柱の五行特性とチーム全体の相性を考慮したアドバイス

出力形式はJSON形式にしてください。
{
  "teamContextAdvice": "チームにおける今日の運勢の詳細文",
  "collaborationTips": ["ヒント1", "ヒント2", "ヒント3"]
}
    `;

    console.log('\n==== 実際のプロンプト ====');
    console.log(prompt);

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
testGeneratePrompt().catch(console.error);