/**
 * ラッキーアイテム生成サービス
 *
 * ユーザーの四柱推命データに基づいて、その日に適したラッキーアイテム（色、食べ物、飲み物）を
 * 生成するサービスです。Claude AIを使用して、命式データから個人に最適化されたアイテムを提案します。
 */
import { FortuneScoreResult } from '../types';
import { claudeApiClient } from './claude-api-client';
import { User } from '../models/User';

// User型定義 - MongooseのDocumentではなく一般的なオブジェクトとして定義
interface UserData {
  displayName: string;
  gender?: string;
  elementAttribute?: string;
  dayMaster?: string;
  fourPillars?: any;
  kakukyoku?: any;
  yojin?: any;
  elementProfile?: any;
  [key: string]: any;
}

// ラッキーアイテム生成用のシステムプロンプト
export const LUCKY_ITEMS_SYSTEM_PROMPT = `
あなたは四柱推命の専門家として、ユーザーの四柱命式、格局、用神、および五行バランスを総合的に考慮した今日のラッキーアイテムを提案します。

【ユーザー情報】
性別: {GENDER}

【命式情報】
年柱: {YEAR_STEM}{YEAR_BRANCH}
月柱: {MONTH_STEM}{MONTH_BRANCH}
日柱: {DAY_STEM}{DAY_BRANCH}
時柱: {HOUR_STEM}{HOUR_BRANCH}

格局: {KAKUKYOKU_TYPE}（{KAKUKYOKU_STRENGTH}）
用神: {YOJIN_TENGOD}（{YOJIN_ELEMENT}）
忌神: {KIJIN_TENGOD}（{KIJIN_ELEMENT}）

【五行バランス】
木: {WOOD_PERCENT}%
火: {FIRE_PERCENT}%
土: {EARTH_PERCENT}%
金: {METAL_PERCENT}%
水: {WATER_PERCENT}%

【今日の情報】
今日の日柱: {TODAY_STEM}{TODAY_BRANCH}

【回答形式】
必ず以下の3行のフォーマットで回答してください。各行は必ず「ラッキーファッション: 」「ラッキーフード: 」「ラッキードリンク: 」から始めてください。

ラッキーファッション: [具体的なファッションアイテム、色、スタイルなど]
ラッキーフード: [具体的な食べ物、料理、メニューなど]
ラッキードリンク: [具体的な飲み物、ドリンクなど]

【重要】
- 必ず指定された3行のフォーマットを守ってください
- 余分な説明や追加情報は入れないでください
- 各アイテムの説明は具体的かつ簡潔にしてください
- 用神を強化し、忌神を避けるアイテムを提案してください
- 不足している五行を補うアイテムも考慮してください
- 命式全体と今日の日柱との関係を考慮してください
`;

/**
 * ラッキーアイテムのインターフェース
 */
export interface LuckyItems {
  color: string;    // ラッキーファッション・色
  item: string;     // ラッキーフード
  drink: string;    // ラッキードリンク
}

/**
 * ラッキーアイテム生成サービスクラス
 */
export class LuckyItemsService {
  /**
   * ラッキーアイテムを生成する
   * @param userData ユーザー情報と運勢詳細情報
   * @param dayStem 天干
   * @param dayBranch 地支
   * @returns 生成されたラッキーアイテム
   */
  public async generateLuckyItems(
    userData: {
      user: UserData,
      fortuneDetails?: FortuneScoreResult
    },
    dayStem: string,
    dayBranch: string
  ): Promise<LuckyItems> {
    console.log('🎯 generateLuckyItems: ラッキーアイテム生成開始');
    
    try {
      // ユーザーデータの検証
      if (!userData || !userData.user) {
        console.error('🎯 ユーザーデータ不正: userDataが存在しないか不完全です', userData);
        throw new Error('無効なユーザーデータ');
      }
      
      // プロンプトを構築 (運勢詳細情報も渡す)
      const prompt = this.buildLuckyItemsPrompt(userData.user, dayStem, dayBranch, userData.fortuneDetails);
      console.log('🎯 プロンプト構築完了: 長さ=' + prompt.length);
      
      // Claude APIを呼び出し
      try {
        const response = await claudeApiClient.simpleCall(prompt, LUCKY_ITEMS_SYSTEM_PROMPT, 1000);
        console.log('🎯 Claude API呼び出し成功: レスポンス長=' + response.length);
        
        if (response && response.length > 0) {
          console.log('🎯 レスポンスプレビュー:', response.substring(0, 100) + '...');
          
          // レスポンスをパース
          const luckyItems = this.parseLuckyItems(response);
          console.log('🎯 パース結果:', luckyItems);
          
          // パース結果の検証
          if (!luckyItems.color || !luckyItems.item || !luckyItems.drink) {
            console.error('🎯 パース結果が不完全です:', luckyItems);
            throw new Error('ラッキーアイテムのパースに失敗しました');
          }
          
          return luckyItems;
        } else {
          console.error('🎯 APIレスポンスが空です');
          throw new Error('APIレスポンスが空');
        }
      } catch (apiError) {
        console.error('🎯 Claude API呼び出しエラー:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('🎯 ラッキーアイテム生成エラー:', error);
      
      // エラー時はフォールバックアイテムを返す
      return this.getFallbackLuckyItems();
    }
  }
  
  /**
   * フォールバック用のラッキーアイテムを返す
   * APIエラー時のフォールバックとして使用
   */
  private getFallbackLuckyItems(): LuckyItems {
    return {
      color: '青色の服や小物',
      item: '季節の野菜や果物',
      drink: '緑茶またはハーブティー'
    };
  }

  /**
   * ラッキーアイテム生成用のプロンプトを構築する
   * @param user ユーザー情報
   * @param dayStem 天干
   * @param dayBranch 地支
   * @param fortuneDetails 運勢詳細情報（オプション）
   */
  private buildLuckyItemsPrompt(
    user: UserData, 
    dayStem: string, 
    dayBranch: string, 
    fortuneDetails?: FortuneScoreResult
  ): string {
    try {
      // 性別情報の取得とフォーマット変換（M/Fを「男性」/「女性」に変換）
      let formattedGender = user.gender || '未設定';
      if (formattedGender === 'M') {
        formattedGender = '男性';
      } else if (formattedGender === 'F') {
        formattedGender = '女性';
      }
      
      // テンプレートの変数をユーザー情報で置換
      let prompt = `
【ユーザー情報】
性別: ${formattedGender}

【命式情報】
年柱: ${user.fourPillars.year.heavenlyStem}${user.fourPillars.year.earthlyBranch}
月柱: ${user.fourPillars.month.heavenlyStem}${user.fourPillars.month.earthlyBranch}
日柱: ${user.fourPillars.day.heavenlyStem}${user.fourPillars.day.earthlyBranch}
時柱: ${user.fourPillars.hour.heavenlyStem}${user.fourPillars.hour.earthlyBranch}

格局: ${user.kakukyoku?.type || '未設定'}（${user.kakukyoku?.strength || '未設定'}）
用神: ${user.yojin?.tenGod || '未設定'}（${user.yojin?.element || '未設定'}）
忌神: ${user.yojin?.kijin2?.tenGod || '未設定'}（${user.yojin?.kijin2?.element || '未設定'}）

【五行バランス】
木: ${user.elementProfile?.wood || 0}%
火: ${user.elementProfile?.fire || 0}%
土: ${user.elementProfile?.earth || 0}%
金: ${user.elementProfile?.metal || 0}%
水: ${user.elementProfile?.water || 0}%
`;

      // 運勢詳細情報がある場合は追加
      if (fortuneDetails) {
        // 運勢スコアとタイプ
        prompt += `\n【運勢情報】
運勢スコア: ${fortuneDetails.score}/100
運勢タイプ: ${fortuneDetails.fortuneType || '普通'}
`;

        // 五行バランス状態
        if (fortuneDetails.balanceStatus) {
          prompt += `\n【五行バランス状態】`;
          for (const [element, status] of Object.entries(fortuneDetails.balanceStatus)) {
            const statusText = 
              status === 'deficient' ? '不足' : 
              status === 'excessive' ? '過剰' : 
              '均衡';
            prompt += `\n${element}: ${statusText}`;
          }
        }

        // 用神関係
        if (fortuneDetails.yojinRelation) {
          prompt += `\n\n【用神との関係】
日柱と用神の関係: ${fortuneDetails.yojinRelation}`;
          
          if (fortuneDetails.dayIsGeneratingYojin) {
            prompt += `\n日柱は用神を生成します。`;
          }
          if (fortuneDetails.dayIsControllingYojin) {
            prompt += `\n日柱は用神を抑制します。`;
          }
        }
      }

      prompt += `\n【今日の情報】
今日の日柱: ${dayStem}${dayBranch}

今日のあなたのラッキーアイテムを提案します。
`;

      return prompt;
    } catch (error) {
      console.error('Build lucky items prompt error:', error);
      return '四柱推命データから今日のラッキーアイテムを生成してください。';
    }
  }

  /**
   * ラッキーアイテムをパースする
   */
  private parseLuckyItems(text: string): LuckyItems {
    const lines = text.trim().split('\n');
    const result = {
      color: '',  // ラッキーファッション
      item: '',   // ラッキーフード
      drink: ''   // ラッキードリンク
    };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('ラッキーファッション:')) {
        result.color = trimmedLine.substring('ラッキーファッション:'.length).trim();
      } else if (trimmedLine.startsWith('ラッキーフード:')) {
        result.item = trimmedLine.substring('ラッキーフード:'.length).trim();
      } else if (trimmedLine.startsWith('ラッキードリンク:')) {
        result.drink = trimmedLine.substring('ラッキードリンク:'.length).trim();
      }
    }
    
    return result;
  }
}

// シングルトンインスタンスをエクスポート
export const luckyItemsService = new LuckyItemsService();