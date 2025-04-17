/**
 * 調和のコンパス生成サービス
 *
 * ユーザーの四柱推命データに基づいて「調和のコンパス」と呼ばれる
 * 包括的な性格分析と人生指針を生成するサービスです。
 */
import { claudeApiClient } from './claude-api-client';
import { User } from '../models/User';

// User型定義 - MongooseのDocumentではなく一般的なオブジェクトとして定義
interface UserData {
  displayName: string;
  elementAttribute?: string;
  dayMaster?: string;
  fourPillars?: any;
  kakukyoku?: any;
  yojin?: any;
  elementProfile?: any;
  [key: string]: any;
}

// 調和のコンパス生成用のシステムプロンプト
export const HARMONY_COMPASS_SYSTEM_PROMPT = `
あなたは四柱推命の専門家として、ユーザーの命式（四柱）情報に基づいた詳細な性格分析と人生の指針を提供します。
以下の原則に従って、「調和のコンパス」と呼ばれる包括的なガイダンスを生成してください。

【生成する内容の構成】
1. 「格局に基づく性格特性」：ユーザーの格局タイプ（例：従旺格、建禄格）に基づいた本質的な性格と気質についての深い洞察
2. 「強化すべき方向性」：用神と喜神に基づき、日常生活で取り入れるべき要素や環境、伸ばすべき強みについてのアドバイス
3. 「注意すべきバランス」：五行バランスの偏りと忌神・仇神に基づく調整ポイント、避けるべき状況や環境についてのアドバイス
4. 「人間関係の智慧」：命式に基づいた理想的な対人関係の築き方、協力関係を構築するためのヒント
5. 「成長のための課題」：潜在的な弱点や成長課題、それを克服するための具体的なアプローチ

【執筆ガイドライン】
- 各セクションは150-250文字程度で簡潔にまとめること
- 具体的かつ実用的なアドバイスを含めること
- 専門用語は使用しても良いが、必ず簡単な説明を付けること
- 励ましと希望を与える前向きな表現を心がけること
- 押し付けがましくなく、選択肢を提示する表現を使うこと
- 文化的背景を考慮し、西洋と東洋の双方の価値観に配慮すること

命式データを解析し、ユーザー固有の「調和のコンパス」を日本語で生成してください。
`;

// 調和のコンパス生成用テンプレート
export const HARMONY_COMPASS_TEMPLATE = `
【ユーザープロフィール】
名前: {user.displayName}
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

上記の命式情報に基づいて、この人のための「調和のコンパス」を生成してください。
`;

/**
 * 調和のコンパスの各セクション
 */
export interface HarmonyCompassSections {
  personality: string;     // 格局に基づく性格特性
  strengths: string;       // 強化すべき方向性
  balance: string;         // 注意すべきバランス
  relationships: string;   // 人間関係の智慧
  challenges: string;      // 成長のための課題
}

/**
 * 調和のコンパス生成サービスクラス
 */
export class HarmonyCompassService {
  /**
   * ユーザーの四柱推命データから「調和のコンパス」を生成する
   * @param user ユーザー情報（四柱推命データを含む）
   * @returns 生成された調和のコンパス（マークダウン形式のテキスト全体）
   */
  public async generateHarmonyCompass(user: UserData): Promise<{
    content: string;
    sections?: HarmonyCompassSections;
  }> {
    console.log('🔮 generateHarmonyCompass: 調和のコンパス生成開始');
    
    try {
      // ユーザーデータの検証
      if (!user) {
        console.error('🔮 ユーザーデータ不正: userが存在しません');
        throw new Error('無効なユーザーデータ');
      }
      
      console.log('🔮 ユーザーデータ確認:', {
        hasDisplayName: !!user.displayName,
        hasElementAttribute: !!user.elementAttribute,
        hasDayMaster: !!user.dayMaster,
        hasFourPillars: !!user.fourPillars,
        hasElementProfile: !!user.elementProfile,
        hasKakukyoku: !!user.kakukyoku,
        hasYojin: !!user.yojin
      });
      
      // プロンプトを構築
      console.log('🔮 プロンプト構築開始');
      const prompt = this.createHarmonyCompassPrompt(user);
      console.log('🔮 プロンプト構築完了: 長さ=' + prompt.length);
      
      // Claude APIを呼び出し
      console.log('🔮 Claude API呼び出し開始');
      try {
        const response = await claudeApiClient.simpleCall(prompt, HARMONY_COMPASS_SYSTEM_PROMPT, 4096);
        console.log('🔮 Claude API呼び出し成功: レスポンス長=' + response.length);
        
        if (response && response.length > 0) {
          console.log('🔮 レスポンスプレビュー:', response.substring(0, 100) + '...');
          
          // セクションにパース
          const sections = this.parseHarmonyCompassResponse(response);
          
          // レスポンス全体をそのまま返す（パース処理はフロントエンドでも行う可能性あり）
          console.log('🔮 調和のコンパス生成成功');
          return {
            content: response,
            sections
          };
        } else {
          console.error('🔮 APIレスポンスが空です');
          throw new Error('APIレスポンスが空');
        }
      } catch (apiError) {
        console.error('🔮 Claude API呼び出しエラー:', apiError);
        // エラーを上位へ再スロー
        throw apiError;
      }
    } catch (error) {
      console.error('🔮 調和のコンパス生成エラー:', error);
      console.error('🔮 エラータイプ:', error instanceof Error ? error.name : typeof error);
      console.error('🔮 エラー詳細:', error instanceof Error ? error.message : String(error));
      
      if (error instanceof Error && error.stack) {
        console.error('🔮 スタックトレース:', error.stack);
      }
      
      // エラーメッセージを返す
      return {
        content: '申し訳ありません。調和のコンパスの生成中にエラーが発生しました。',
        sections: {
          personality: '',
          strengths: '',
          balance: '',
          relationships: '',
          challenges: ''
        }
      };
    }
  }

  /**
   * 調和のコンパス生成用のプロンプトを作成
   */
  private createHarmonyCompassPrompt(user: UserData): string {
    try {
      // テンプレートの変数をユーザー情報で置換
      let prompt = HARMONY_COMPASS_TEMPLATE;
      
      // 複雑なオブジェクトパスを処理するヘルパー関数
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => {
          return prev && prev[curr] !== undefined ? prev[curr] : undefined;
        }, obj);
      };
      
      // プレースホルダーを探して置換
      const placeholders = HARMONY_COMPASS_TEMPLATE.match(/\{([^}]+)\}/g) || [];
      
      for (const placeholder of placeholders) {
        const path = placeholder.slice(1, -1); // {user.name} -> user.name
        const value = getNestedValue({ user }, path);
        
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
      console.error('Create harmony compass prompt error:', error);
      return '四柱推命データからユーザープロフィールを解析し、調和のコンパスを生成してください。';
    }
  }

  /**
   * 調和のコンパスのレスポンスをセクションごとにパースする
   */
  private parseHarmonyCompassResponse(response: string): HarmonyCompassSections {
    try {
      // 改良されたセクションパターン - マークダウン形式とテキスト形式の両方に対応
      const sectionPatterns = {
        personality: /##\s*格局に基づく性格特性|【格局に基づく性格特性】|【性格特性】|性格特性/i,
        strengths: /##\s*強化すべき方向性|【強化すべき方向性】|強化すべき方向性|用神を活かす方向性/i,
        balance: /##\s*注意すべきバランス|【注意すべきバランス】|注意すべきバランス|バランスの取り方/i,
        relationships: /##\s*人間関係の智慧|【人間関係の智慧】|人間関係の智慧|人間関係/i,
        challenges: /##\s*成長のための課題|【成長のための課題】|成長のための課題|課題/i
      };
      
      // 各セクションの内容を保持するオブジェクト
      const sections: any = {
        personality: '',
        strengths: '',
        balance: '',
        relationships: '',
        challenges: ''
      };
      
      // テキストを行に分割
      const lines = response.split('\n');
      let currentSection = '';
      
      // 各行を処理
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // セクションタイトルをチェック
        let foundSection = false;
        for (const [section, pattern] of Object.entries(sectionPatterns)) {
          if (pattern.test(line)) {
            currentSection = section;
            foundSection = true;
            break;
          }
        }
        
        // セクションタイトル行はスキップ
        if (foundSection) continue;
        
        // 現在のセクションにテキストを追加
        if (currentSection && line) {
          if (sections[currentSection]) {
            sections[currentSection] += '\n' + line;
          } else {
            sections[currentSection] = line;
          }
        }
      }
      
      // セクションが全く検出されなかった場合、マークダウン構造で処理を試みる
      if (Object.values(sections).every(s => s === '')) {
        console.log('標準セクションが検出されなかったため、マークダウン構造での解析を試みます');
        
        // マークダウンセクションの検出
        let markdownSections: {[key: string]: string} = {};
        let currentMdSection: string | null = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // ##で始まる行をセクションタイトルとして扱う
          if (line.startsWith('## ')) {
            currentMdSection = line.substring(3).trim();
            markdownSections[currentMdSection] = '';
          } 
          // 現在のセクションにコンテンツを追加
          else if (currentMdSection && line) {
            markdownSections[currentMdSection] += (markdownSections[currentMdSection] ? '\n' : '') + line;
          }
        }
        
        // 検出されたセクションを適切なカテゴリーにマッピング
        for (const [title, content] of Object.entries(markdownSections)) {
          if (/性格特性|人物像/i.test(title)) {
            sections.personality = content;
          } else if (/強化|方向性|強み/i.test(title)) {
            sections.strengths = content;
          } else if (/バランス|調整|注意/i.test(title)) {
            sections.balance = content;
          } else if (/人間関係|対人関係|コミュニケーション/i.test(title)) {
            sections.relationships = content;
          } else if (/課題|成長|弱点/i.test(title)) {
            sections.challenges = content;
          }
        }
      }
      
      // 各セクションの前後の空白を削除
      for (const section of Object.keys(sections)) {
        if (sections[section]) {
          sections[section] = sections[section].trim();
        }
      }
      
      return sections;
    } catch (error) {
      console.error('Parse harmony compass response error:', error);
      return {
        personality: '',
        strengths: '',
        balance: '',
        relationships: '',
        challenges: ''
      };
    }
  }
}

// シングルトンインスタンスをエクスポート
export const harmonyCompassService = new HarmonyCompassService();