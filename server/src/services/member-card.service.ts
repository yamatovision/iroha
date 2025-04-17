/**
 * チームメンバーカルテ生成サービス
 *
 * ユーザーの四柱推命データに基づいて、チーム内での役割、強み、コミュニケーションスタイル、
 * 協力方法などを分析したカルテを生成するサービスです。
 */
import { claudeApiClient } from './claude-api-client';
import { User } from '../models/User';

// User型定義 - MongooseのDocumentではなく一般的なオブジェクトとして定義
interface UserData {
  displayName: string;
  elementAttribute?: string;
  dayMaster?: string;
  jobTitle?: string;
  fourPillars?: any;
  kakukyoku?: any;
  yojin?: any;
  elementProfile?: any;
  [key: string]: any;
}

// チームメンバーカルテ生成用のシステムプロンプト
export const MEMBER_CARD_SYSTEM_PROMPT = `
あなたは四柱推命に基づいたチームメンバー分析の専門家です。ユーザーの命式情報から、チーム内での最適な役割、
貢献方法、コミュニケーションスタイルなどを分析し、「チームメンバーカルテ」を生成してください。

【生成する内容の構成】
## 基本プロファイル
- ユーザーの五行属性（木・火・土・金・水）の意味とその人の性質への影響
- 格局タイプ（例：従旺格、建禄格）がもたらす基本的な気質や傾向

## 特性と才能
- 命式から読み取れる主要な特性と得意分野
- 四柱から導き出される潜在的な才能

## 用神と喜神に基づく強み
- 用神の要素から導かれる強み
- 喜神の要素を活かせる場面

## チーム貢献分析
- チーム内で最も価値を発揮できる場面と貢献方法
- 他メンバーとの相互作用における長所

## 最適な役割と貢献方法
- プロジェクト内で担当すると効果的な役割
- 成果を最大化するための適切な業務分担の提案

## 強化すべき領域と避けるべき領域
- 仇神や忌神に関連する回避すべき状況や役割
- さらなる成長のために強化するとよい能力

## コミュニケーションガイド
- 効果的なフィードバックの受け方と伝え方
- コミュニケーションスタイルの特徴と他者との接し方のコツ

## 将来の成長ポテンシャル
- 命式が示す長期的な成長方向性
- キャリアパスの提案

【執筆ガイドライン】
- マークダウン形式で記述し、各セクションは見出しを明確に
- 具体的かつ実用的なアドバイスを含める
- 専門用語は使用しても良いが、必ず簡単な説明を付ける
- 前向きで建設的な表現を使用する
- 簡潔かつ読みやすい文章で、各セクション200-300字程度に
- チーム協力の文脈で実践できる具体的な提案を含める

命式データを解析し、このメンバーの「チームメンバーカルテ」を日本語で生成してください。
`;

// チームメンバーカルテ生成用テンプレート
export const MEMBER_CARD_TEMPLATE = `
【メンバープロフィール】
名前: {user.displayName}
役割: {user.jobTitle}
五行: {user.elementAttribute}
日主: {user.dayMaster}

【格局情報】
格局タイプ: {user.kakukyoku.type}
カテゴリ: {user.kakukyoku.category}
身強弱: {user.kakukyoku.strength}

【用神情報】
用神: {user.yojin.tenGod}（{user.yojin.element}）
喜神: {user.yojin.kijin.tenGod}（{user.yojin.kijin.element}）
忌神: {user.yojin.kijin2.tenGod}（{user.yojin.kijin2.element}）
仇神: {user.yojin.kyujin.tenGod}（{user.yojin.kyujin.element}）

【五行バランス】
木: {user.elementProfile.wood}
火: {user.elementProfile.fire}
土: {user.elementProfile.earth}
金: {user.elementProfile.metal}
水: {user.elementProfile.water}

【四柱情報】
年柱: {user.fourPillars.year.heavenlyStem}{user.fourPillars.year.earthlyBranch}
月柱: {user.fourPillars.month.heavenlyStem}{user.fourPillars.month.earthlyBranch}
日柱: {user.fourPillars.day.heavenlyStem}{user.fourPillars.day.earthlyBranch}
時柱: {user.fourPillars.hour.heavenlyStem}{user.fourPillars.hour.earthlyBranch}

【チーム情報】
チーム名: {team.name}
メンバー数: {team.size}

上記の情報に基づいて、このメンバーのチーム内での最適な役割、強み、コミュニケーションスタイル、成長方向性などを分析した「チームメンバーカルテ」を生成してください。各セクションはマークダウン形式の見出しを使用し、具体的で実用的なアドバイスを含めてください。
`;

/**
 * チームメンバーカルテ生成サービスクラス
 */
export class MemberCardService {
  /**
   * チームメンバーカルテを生成する
   * @param user ユーザー情報（四柱推命データを含む）
   * @param team チーム情報
   * @returns 生成されたチームメンバーカルテ（マークダウン形式）
   */
  public async generateMemberCard(user: UserData, team: { name: string; size: number }): Promise<string> {
    console.log('🧩 generateMemberCard: チームメンバーカルテ生成開始');
    
    try {
      // ユーザーデータの検証
      if (!user) {
        console.error('🧩 ユーザーデータ不正: userが存在しません');
        throw new Error('無効なユーザーデータ');
      }
      
      console.log('🧩 ユーザーデータ確認:', {
        hasDisplayName: !!user.displayName,
        hasElementAttribute: !!user.elementAttribute,
        hasDayMaster: !!user.dayMaster,
        hasFourPillars: !!user.fourPillars,
        hasElementProfile: !!user.elementProfile,
        hasKakukyoku: !!user.kakukyoku,
        hasYojin: !!user.yojin
      });
      
      // プロンプトを構築
      console.log('🧩 プロンプト構築開始');
      const prompt = this.createMemberCardPrompt(user, team);
      console.log('🧩 プロンプト構築完了: 長さ=' + prompt.length);
      
      // Claude APIを呼び出し
      console.log('🧩 Claude API呼び出し開始');
      try {
        const response = await claudeApiClient.simpleCall(prompt, MEMBER_CARD_SYSTEM_PROMPT, 4096);
        console.log('🧩 Claude API呼び出し成功: レスポンス長=' + response.length);
        
        if (response && response.length > 0) {
          console.log('🧩 レスポンスプレビュー:', response.substring(0, 100) + '...');
          return response;
        } else {
          console.error('🧩 APIレスポンスが空です');
          throw new Error('APIレスポンスが空');
        }
      } catch (apiError) {
        console.error('🧩 Claude API呼び出しエラー:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('🧩 チームメンバーカルテ生成エラー:', error);
      
      // エラーメッセージを返す
      return '申し訳ありません。チームメンバーカルテの生成中にエラーが発生しました。';
    }
  }

  /**
   * チームメンバーカルテ生成用のプロンプトを作成
   */
  private createMemberCardPrompt(user: UserData, team: { name: string; size: number }): string {
    try {
      // テンプレートの変数をユーザー情報で置換
      let prompt = MEMBER_CARD_TEMPLATE;
      
      // 複雑なオブジェクトパスを処理するヘルパー関数
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => {
          return prev && prev[curr] !== undefined ? prev[curr] : undefined;
        }, obj);
      };
      
      // プレースホルダーを探して置換
      const placeholders = MEMBER_CARD_TEMPLATE.match(/\{([^}]+)\}/g) || [];
      
      for (const placeholder of placeholders) {
        const path = placeholder.slice(1, -1); // {user.name} -> user.name
        const value = getNestedValue({ user, team }, path);
        
        if (value !== undefined) {
          // 配列の場合は箇条書きに変換
          if (Array.isArray(value)) {
            const formattedValue = value.map(item => `- ${item}`).join('\n');
            prompt = prompt.replace(placeholder, formattedValue);
          } else {
            prompt = prompt.replace(placeholder, String(value));
          }
        } else {
          // 値が見つからない場合は「未設定」に置換
          prompt = prompt.replace(placeholder, '未設定');
        }
      }
      
      return prompt;
    } catch (error) {
      console.error('Create member card prompt error:', error);
      return '四柱推命データとチーム情報から、チームメンバーカルテを生成してください。';
    }
  }
}

// シングルトンインスタンスをエクスポート
export const memberCardService = new MemberCardService();