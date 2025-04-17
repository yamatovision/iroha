import mongoose from 'mongoose';
import { Compatibility, ICompatibilityDocument } from '../../models/Compatibility';
import { User } from '../../models/User';
import { Team, ITeamDocument } from '../../models/Team';
import claudeAI from '../../utils/claude-ai';

/**
 * 五行相性の関係マッピング
 */
const ELEMENT_RELATIONSHIP_MAP = {
  // 相生関係（生む）: A は B を生む
  mutual_generation: {
    wood: 'fire',    // 木は火を生む
    fire: 'earth',   // 火は土を生む
    earth: 'metal',  // 土は金を生む
    metal: 'water',  // 金は水を生む
    water: 'wood'    // 水は木を生む
  },
  // 相克関係（抑える）: A は B を抑える
  mutual_restriction: {
    wood: 'earth',   // 木は土を抑える
    earth: 'water',  // 土は水を抑える
    water: 'fire',   // 水は火を抑える
    fire: 'metal',   // 火は金を抑える
    metal: 'wood'    // 金は木を抑える
  }
};

/**
 * 五行属性の日本語マッピング
 */
const ELEMENT_JP_MAP = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水'
};

/**
 * 相性サービスクラス
 */
class CompatibilityService {
  /**
   * ユーザー間の相性関係を判定
   * @param element1 ユーザー1の五行属性
   * @param element2 ユーザー2の五行属性
   * @returns 相性関係タイプ
   */
  determineRelationship(element1: string, element2: string): 'mutual_generation' | 'mutual_restriction' | 'neutral' {
    // 型アサーションを使って型エラーを回避
    const el1 = element1 as keyof typeof ELEMENT_RELATIONSHIP_MAP.mutual_generation;
    const el2 = element2 as keyof typeof ELEMENT_RELATIONSHIP_MAP.mutual_generation;
    
    // element1がelement2を生む関係かチェック
    if (ELEMENT_RELATIONSHIP_MAP.mutual_generation[el1] === element2) {
      return 'mutual_generation';
    }
    // element2がelement1を生む関係かチェック
    if (ELEMENT_RELATIONSHIP_MAP.mutual_generation[el2] === element1) {
      return 'mutual_generation';
    }
    // element1がelement2を抑える関係かチェック
    if (ELEMENT_RELATIONSHIP_MAP.mutual_restriction[el1] === element2) {
      return 'mutual_restriction';
    }
    // element2がelement1を抑える関係かチェック
    if (ELEMENT_RELATIONSHIP_MAP.mutual_restriction[el2] === element1) {
      return 'mutual_restriction';
    }
    // どちらでもなければ中立
    return 'neutral';
  }

  /**
   * 相性スコアを計算
   * @param relationship 相性関係タイプ
   * @returns 相性スコア (0-100)
   */
  calculateCompatibilityScore(relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral'): number {
    switch (relationship) {
      case 'mutual_generation':
        // 相生関係は高いスコア (70-90)
        return 70 + Math.floor(Math.random() * 21);
      case 'mutual_restriction':
        // 相克関係は低いスコア (30-60)
        return 30 + Math.floor(Math.random() * 31);
      case 'neutral':
        // 中立関係は中間スコア (50-75)
        return 50 + Math.floor(Math.random() * 26);
    }
  }

  /**
   * 相性の詳細説明を生成
   * @param user1Element ユーザー1の五行属性
   * @param user2Element ユーザー2の五行属性
   * @param relationship 相性関係タイプ
   * @returns 詳細説明
   */
  async generateDetailDescription(
    user1DisplayName: string,
    user2DisplayName: string,
    user1Element: string,
    user2Element: string,
    relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral'
  ): Promise<{ detailDescription: string, teamInsight: string, collaborationTips: string[] }> {
    // Claude AI APIに送信するプロンプト
    const prompt = `
    あなたは四柱推命と五行相性の専門家です。以下の情報から二人の相性について詳細な説明を生成してください。

    ユーザー情報:
    - ユーザー1: ${user1DisplayName} (五行属性: ${ELEMENT_JP_MAP[user1Element as keyof typeof ELEMENT_JP_MAP]})
    - ユーザー2: ${user2DisplayName} (五行属性: ${ELEMENT_JP_MAP[user2Element as keyof typeof ELEMENT_JP_MAP]})
    - 相性関係: ${relationship === 'mutual_generation' ? '相生（互いを生かす関係）' : relationship === 'mutual_restriction' ? '相克（互いに抑制する関係）' : '中和（互いに干渉しない関係）'}

    以下の3つの情報を生成してください:

    1. detailDescription: 二人の五行相性の詳細な説明（性格の相性、コミュニケーションの取り方、協力する際のポイントなど）を300文字以内で簡潔にまとめてください。

    2. teamInsight: チーム内での二人の関係性について、どのようにして最大のパフォーマンスを発揮できるかの洞察を200文字以内で説明してください。

    3. collaborationTips: 二人が効果的に協力するための具体的なアドバイスを3つ挙げてください。それぞれ40文字以内の簡潔な文にしてください。

    応答は以下のJSON形式で返してください:
    {
      "detailDescription": "...",
      "teamInsight": "...",
      "collaborationTips": ["...", "...", "..."]
    }
    `;

    try {
      // Claude AI APIを使用して相性の詳細説明を生成
      const response = await claudeAI.callClaudeAI(prompt);
      
      // JSON形式の応答をパース
      let parsedResponse;
      try {
        // 応答テキストからJSONを抽出
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSONフォーマットの応答が見つかりませんでした');
        }
      } catch (parseError) {
        console.error('AI応答のパースに失敗しました:', parseError);
        
        // パースに失敗した場合はデフォルト応答を返す
        return {
          detailDescription: `${user1DisplayName}(${ELEMENT_JP_MAP[user1Element as keyof typeof ELEMENT_JP_MAP]})と${user2DisplayName}(${ELEMENT_JP_MAP[user2Element as keyof typeof ELEMENT_JP_MAP]})は${relationship === 'mutual_generation' ? '相生' : relationship === 'mutual_restriction' ? '相克' : '中和'}の関係にあります。この組み合わせでは、互いの長所を活かした協力が可能です。`,
          teamInsight: '二人はそれぞれの特性を理解し、互いの強みを活かすことでチームに貢献できます。',
          collaborationTips: [
            '定期的な情報共有を心がける',
            '互いの違いを尊重する',
            '共通の目標を明確にする'
          ]
        };
      }
      
      return {
        detailDescription: parsedResponse.detailDescription || '',
        teamInsight: parsedResponse.teamInsight || '',
        collaborationTips: parsedResponse.collaborationTips || []
      };
    } catch (error) {
      console.error('AI応答の取得に失敗しました:', error);
      
      // APIエラーの場合はデフォルト応答を返す
      return {
        detailDescription: `${user1DisplayName}(${ELEMENT_JP_MAP[user1Element as keyof typeof ELEMENT_JP_MAP]})と${user2DisplayName}(${ELEMENT_JP_MAP[user2Element as keyof typeof ELEMENT_JP_MAP]})は${relationship === 'mutual_generation' ? '相生' : relationship === 'mutual_restriction' ? '相克' : '中和'}の関係にあります。`,
        teamInsight: '二人はそれぞれの特性を活かした協力が可能です。',
        collaborationTips: [
          '定期的なコミュニケーションを取る',
          '互いの強みを認め合う',
          '共通目標を設定する'
        ]
      };
    }
  }

  /**
   * 2人のユーザー間の相性情報を取得または生成
   * @param user1Id ユーザー1のID
   * @param user2Id ユーザー2のID
   * @returns 相性情報
   */
  async getOrCreateCompatibility(user1Id: string, user2Id: string): Promise<ICompatibilityDocument> {
    // 既存の相性データを検索（ユーザーIDの順序を考慮）
    let compatibility = await Compatibility.findOne({
      $or: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id }
      ]
    });
    
    // 相性データが存在する場合はそれを返す
    if (compatibility) {
      return compatibility;
    }
    
    // 小さい方のIDが先に来るようにソート（文字列比較）
    const [smallerId, largerId] = user1Id < user2Id 
      ? [user1Id, user2Id] 
      : [user2Id, user1Id];
    
    // ユーザー情報を取得
    const [user1, user2] = await Promise.all([
      User.findById(user1Id),
      User.findById(user2Id)
    ]);
    
    if (!user1 || !user2) {
      throw new Error('ユーザーが見つかりません');
    }
    
    if (!user1.elementAttribute || !user2.elementAttribute) {
      throw new Error('ユーザーの五行属性が設定されていません');
    }
    
    // 相性関係を判定
    const relationship = this.determineRelationship(user1.elementAttribute, user2.elementAttribute);
    
    // 相性スコアを計算
    const compatibilityScore = this.calculateCompatibilityScore(relationship);
    
    // 相性の詳細説明を生成
    const { detailDescription, teamInsight, collaborationTips } = await this.generateDetailDescription(
      user1.displayName,
      user2.displayName,
      user1.elementAttribute,
      user2.elementAttribute,
      relationship
    );
    
    // 相性データを作成
    compatibility = await Compatibility.create({
      user1Id: smallerId,
      user2Id: largerId,
      compatibilityScore,
      relationship,
      relationshipType: relationship === 'mutual_generation' ? '相生' : relationship === 'mutual_restriction' ? '相克' : '中和',
      user1Element: user1.elementAttribute,
      user2Element: user2.elementAttribute,
      detailDescription,
      teamInsight,
      collaborationTips
    });
    
    return compatibility;
  }

  /**
   * チーム内の全メンバー間の相性を取得または生成
   * @param teamId チームID
   * @returns チームメンバー間の相性情報一覧
   */
  async getTeamCompatibilities(teamId: string): Promise<ICompatibilityDocument[]> {
    // チームの存在確認
    const teamExists = await Team.exists({ _id: teamId });
    if (!teamExists) {
      throw new Error('チームが見つかりません');
    }

    // User.teamIdを使用してチームメンバーを取得（標準化された方法）
    const members = await User.find({ teamId: teamId });
    if (!members || members.length === 0) {
      return [];
    }
    
    // TypeScriptのための型安全な方法でマッピング
    const memberIds = members.map(member => {
      if (member && member._id) {
        return typeof member._id.toString === 'function' ? member._id.toString() : String(member._id);
      }
      return '';
    }).filter(id => id !== '');
    
    // 全ての組み合わせの相性を取得または生成
    const compatibilities: ICompatibilityDocument[] = [];
    
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const compatibility = await this.getOrCreateCompatibility(
          memberIds[i],
          memberIds[j]
        );
        compatibilities.push(compatibility);
      }
    }
    
    return compatibilities;
  }

  /**
   * 特定のチームメンバー間の相性を取得
   * @param teamId チームID
   * @param userId1 ユーザー1ID
   * @param userId2 ユーザー2ID
   * @returns 2人のユーザー間の相性情報
   */
  async getTeamMemberCompatibility(teamId: string, userId1: string, userId2: string): Promise<ICompatibilityDocument> {
    // チームの存在確認
    const teamExists = await Team.exists({ _id: teamId });
    if (!teamExists) {
      throw new Error('チームが見つかりません');
    }
    
    // 指定されたチームに所属しているユーザーを確認
    // ユーザーデータのteamIdフィールドのみをチェック（最も効率的）
    const [user1InTeam, user2InTeam] = await Promise.all([
      User.exists({ _id: userId1, teamId: teamId }),
      User.exists({ _id: userId2, teamId: teamId })
    ]);
    
    console.log('チームID:', teamId);
    console.log('ユーザー1チームメンバー確認:', user1InTeam ? 'はい' : 'いいえ');
    console.log('ユーザー2チームメンバー確認:', user2InTeam ? 'はい' : 'いいえ');
    
    if (!user1InTeam || !user2InTeam) {
      throw new Error(`指定されたユーザーはチームのメンバーではありません (userId1: ${userId1}, userId2: ${userId2})`);
    }
    
    // 相性情報を取得または生成
    return this.getOrCreateCompatibility(userId1, userId2);
  }
}

export const compatibilityService = new CompatibilityService();