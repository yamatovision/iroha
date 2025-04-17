import mongoose from 'mongoose';
import { Compatibility, ICompatibilityDocument } from '../../models/Compatibility';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import claudeAI from '../../utils/claude-ai';

/**
 * 高度な四柱推命相性診断サービスクラス
 * 五行相生相克だけでなく、陰陽、身強身弱、日支関係、用神喜神、日干干合を考慮した複合的な相性診断を提供
 */
class EnhancedCompatibilityService {
  // 陽の気の天干
  private readonly YANG_GANS = ['甲', '丙', '戊', '庚', '壬'];
  
  // 陰の気の天干
  private readonly YIN_GANS = ['乙', '丁', '己', '辛', '癸'];
  
  // 三合会局の組み合わせ
  private readonly SANGOKAIGYO_GROUPS = [
    ['寅', '午', '戌'], // 火局
    ['亥', '卯', '未'], // 木局
    ['申', '子', '辰'], // 水局
    ['巳', '酉', '丑']  // 金局
  ];
  
  // 支合の組み合わせ
  private readonly SHIGOU_PAIRS = [
    ['子', '丑'],
    ['寅', '亥'],
    ['卯', '戌'],
    ['辰', '酉'],
    ['巳', '申'],
    ['午', '未']
  ];
  
  // 支沖の組み合わせ
  private readonly SHICHU_PAIRS = [
    ['子', '午'],
    ['丑', '未'],
    ['寅', '申'],
    ['卯', '酉'],
    ['辰', '戌'],
    ['巳', '亥']
  ];
  
  // 干合の組み合わせ
  private readonly GANGOU_PAIRS = [
    ['甲', '乙'],
    ['丙', '丁'],
    ['戊', '己'],
    ['庚', '辛'],
    ['壬', '癸']
  ];
  
  // 干支の五行マッピング
  private readonly GAN_TO_ELEMENT = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  };
  
  private readonly ZHI_TO_ELEMENT = {
    '寅': '木', '卯': '木',
    '巳': '火', '午': '火',
    '辰': '土', '戌': '土', '丑': '土', '未': '土',
    '申': '金', '酉': '金',
    '子': '水', '亥': '水'
  };
  
  // 相生（生じる）関係
  private readonly GENERATES = {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木'
  };
  
  // 相克（克す）関係
  private readonly RESTRICTS = {
    '木': '土',
    '土': '水',
    '水': '火',
    '火': '金',
    '金': '木'
  };
  
  // 五行の日本語マッピング
  private readonly ELEMENT_JP_MAP = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水'
  };
  
  // 関係性タイプの日本語表現
  private readonly RELATIONSHIP_TYPE_JP = {
    'idealPartner': '理想的パートナー',
    'goodCooperation': '良好な協力関係',
    'stableRelationship': '安定した関係',
    'stimulatingRelationship': '刺激的な関係',
    'cautionRelationship': '要注意の関係',
    'generalRelationship': '一般的な関係'
  };
  
  /**
   * 陰陽バランスの相性を評価する
   * @param person1DayGan ユーザー1の日干
   * @param person2DayGan ユーザー2の日干
   * @returns 陰陽バランスの評価スコア (0-100)
   */
  private evaluateYinYangBalance(person1DayGan: string, person2DayGan: string): number {
    const isPerson1Yang = this.YANG_GANS.includes(person1DayGan);
    const isPerson2Yang = this.YANG_GANS.includes(person2DayGan);
    
    // 陰陽が異なる場合は高いスコア、同じ場合は低いスコア
    if (isPerson1Yang !== isPerson2Yang) {
      return 100; // 最高スコア
    } else {
      return 50; // 中間スコア
    }
  }
  
  /**
   * 身強弱のバランスを評価する
   * @param person1IsStrong ユーザー1が身強かどうか
   * @param person2IsStrong ユーザー2が身強かどうか
   * @returns 身強弱バランスの評価スコア (0-100)
   */
  private evaluateStrengthBalance(person1IsStrong: boolean, person2IsStrong: boolean): number {
    // 一方が強く一方が弱い場合は高いスコア
    if (person1IsStrong !== person2IsStrong) {
      return 100;
    } 
    // 同士の場合は中間スコア
    else {
      return 70;
    }
  }
  
  /**
   * 日支の関係を評価する
   * @param person1DayBranch ユーザー1の日支
   * @param person2DayBranch ユーザー2の日支
   * @returns 日支関係の評価スコアと関係タイプ
   */
  private evaluateDayBranchRelationship(person1DayBranch: string, person2DayBranch: string): {
    score: number,
    relationship: string
  } {
    // 三合会局かチェック
    for (const group of this.SANGOKAIGYO_GROUPS) {
      if (group.includes(person1DayBranch) && group.includes(person2DayBranch) && person1DayBranch !== person2DayBranch) {
        return { score: 100, relationship: '三合会局' };
      }
    }
    
    // 支合かチェック
    for (const pair of this.SHIGOU_PAIRS) {
      if ((pair[0] === person1DayBranch && pair[1] === person2DayBranch) ||
          (pair[1] === person1DayBranch && pair[0] === person2DayBranch)) {
        return { score: 85, relationship: '支合' };
      }
    }
    
    // 支沖かチェック
    for (const pair of this.SHICHU_PAIRS) {
      if ((pair[0] === person1DayBranch && pair[1] === person2DayBranch) ||
          (pair[1] === person1DayBranch && pair[0] === person2DayBranch)) {
        return { score: 60, relationship: '支沖' };
      }
    }
    
    // どの関係にもない場合
    return { score: 50, relationship: '通常' };
  }
  
  /**
   * 用神・喜神にあたる五行の評価
   * @param personDayGan ユーザーの日干
   * @param otherPersonPillars 相手の四柱情報
   * @returns 用神・喜神の評価スコア (0-100)
   */
  private evaluateUsefulGods(
    personDayGan: string, 
    otherPersonPillars: { gan: string, zhi: string }[]
  ): number {
    // 型アサーションでTypeScriptエラーを回避
    const dayGanElement = this.GAN_TO_ELEMENT[personDayGan as keyof typeof this.GAN_TO_ELEMENT];
    
    if (!dayGanElement) return 50; // 日干の五行が不明な場合は中間スコア
    
    // 用神（生じる五行）
    const youjin = this.GENERATES[dayGanElement as keyof typeof this.GENERATES];
    // 喜神（克される五行）
    const kijin = this.RESTRICTS[dayGanElement as keyof typeof this.RESTRICTS];
    
    let youjinCount = 0;
    let kijinCount = 0;
    
    // 相手の四柱に含まれる五行をカウント
    for (const pillar of otherPersonPillars) {
      const ganElement = this.GAN_TO_ELEMENT[pillar.gan as keyof typeof this.GAN_TO_ELEMENT];
      const zhiElement = this.ZHI_TO_ELEMENT[pillar.zhi as keyof typeof this.ZHI_TO_ELEMENT];
      
      if (ganElement === youjin) youjinCount++;
      if (zhiElement === youjin) youjinCount++;
      
      if (ganElement === kijin) kijinCount++;
      if (zhiElement === kijin) kijinCount++;
    }
    
    // 用神と喜神の数に基づいてスコア計算
    const totalCount = youjinCount + kijinCount;
    const maxPossibleCount = 8; // 四柱で最大8つの干支
    
    return Math.min(100, (totalCount / maxPossibleCount) * 100);
  }
  
  /**
   * 日干の干合を評価する
   * @param person1DayGan ユーザー1の日干
   * @param person2DayGan ユーザー2の日干
   * @returns 日干干合の評価スコアと干合かどうか
   */
  private evaluateDayGanCombination(person1DayGan: string, person2DayGan: string): {
    score: number,
    isGangou: boolean
  } {
    // 干合かチェック
    for (const pair of this.GANGOU_PAIRS) {
      if ((pair[0] === person1DayGan && pair[1] === person2DayGan) ||
          (pair[1] === person1DayGan && pair[0] === person2DayGan)) {
        return { score: 100, isGangou: true };
      }
    }
    
    // 干合でない場合
    return { score: 50, isGangou: false };
  }
  
  /**
   * 四柱推命データからピラーオブジェクトを生成
   * @param fourPillars 四柱データ
   * @returns ピラーの配列
   */
  private createPillarsFromFourPillars(fourPillars: any): { gan: string, zhi: string }[] {
    if (!fourPillars) return [];
    
    const pillars: { gan: string, zhi: string }[] = [];
    
    // 年柱
    if (fourPillars.year?.heavenlyStem && fourPillars.year?.earthlyBranch) {
      pillars.push({
        gan: fourPillars.year.heavenlyStem,
        zhi: fourPillars.year.earthlyBranch
      });
    }
    
    // 月柱
    if (fourPillars.month?.heavenlyStem && fourPillars.month?.earthlyBranch) {
      pillars.push({
        gan: fourPillars.month.heavenlyStem,
        zhi: fourPillars.month.earthlyBranch
      });
    }
    
    // 日柱
    if (fourPillars.day?.heavenlyStem && fourPillars.day?.earthlyBranch) {
      pillars.push({
        gan: fourPillars.day.heavenlyStem,
        zhi: fourPillars.day.earthlyBranch
      });
    }
    
    // 時柱
    if (fourPillars.hour?.heavenlyStem && fourPillars.hour?.earthlyBranch) {
      pillars.push({
        gan: fourPillars.hour.heavenlyStem,
        zhi: fourPillars.hour.earthlyBranch
      });
    }
    
    return pillars;
  }
  
  /**
   * 総合的な相性スコアを計算
   * @param user1 ユーザー1のデータ
   * @param user2 ユーザー2のデータ
   * @returns 総合評価スコアと詳細
   */
  private calculateCompatibilityScore(user1: any, user2: any): {
    totalScore: number,
    details: {
      yinYangBalance: number,
      strengthBalance: number,
      dayBranchRelationship: { score: number, relationship: string },
      usefulGods: number,
      dayGanCombination: { score: number, isGangou: boolean }
    },
    relationshipType: string
  } {
    console.log('ユーザー1四柱:', JSON.stringify(user1.fourPillars));
    console.log('ユーザー2四柱:', JSON.stringify(user2.fourPillars));
    
    // 日干・日支の取得
    const user1DayGan = user1.fourPillars?.day?.heavenlyStem || '';
    const user1DayZhi = user1.fourPillars?.day?.earthlyBranch || '';
    const user2DayGan = user2.fourPillars?.day?.heavenlyStem || '';
    const user2DayZhi = user2.fourPillars?.day?.earthlyBranch || '';
    
    console.log('日干日支:', {
      user1: { dayGan: user1DayGan, dayZhi: user1DayZhi },
      user2: { dayGan: user2DayGan, dayZhi: user2DayZhi }
    });
    
    // 身強弱の判定（kakukyoku.strengthから取得）
    const user1IsStrong = user1.kakukyoku?.strength === 'strong';
    const user2IsStrong = user2.kakukyoku?.strength === 'strong';
    
    console.log('身強弱:', {
      user1: { 
        kakukyoku: user1.kakukyoku?.strength, 
        isStrong: user1IsStrong 
      },
      user2: { 
        kakukyoku: user2.kakukyoku?.strength, 
        isStrong: user2IsStrong 
      }
    });
    
    // ピラーデータの生成
    const user1Pillars = this.createPillarsFromFourPillars(user1.fourPillars);
    const user2Pillars = this.createPillarsFromFourPillars(user2.fourPillars);
    
    // 評価の実行
    const yinYangBalance = this.evaluateYinYangBalance(user1DayGan, user2DayGan);
    const strengthBalance = this.evaluateStrengthBalance(user1IsStrong, user2IsStrong);
    const dayBranchRelationship = this.evaluateDayBranchRelationship(user1DayZhi, user2DayZhi);
    
    let usefulGods = 50; // デフォルト値
    if (user1Pillars.length > 0 && user2Pillars.length > 0) {
      const usefulGods1 = this.evaluateUsefulGods(user1DayGan, user2Pillars);
      const usefulGods2 = this.evaluateUsefulGods(user2DayGan, user1Pillars);
      usefulGods = (usefulGods1 + usefulGods2) / 2; // 両者の平均
    }
    
    const dayGanCombination = this.evaluateDayGanCombination(user1DayGan, user2DayGan);
    
    // 重み付け総合スコア計算
    const totalScore = 
      yinYangBalance * 0.2 +
      strengthBalance * 0.2 +
      dayBranchRelationship.score * 0.25 +
      usefulGods * 0.2 +
      dayGanCombination.score * 0.15;
    
    const roundedScore = Math.round(totalScore);
    
    // 関係性タイプの判定
    let relationshipType = this.determineRelationshipType({
      totalScore: roundedScore,
      details: {
        yinYangBalance,
        strengthBalance,
        dayBranchRelationship,
        usefulGods,
        dayGanCombination
      }
    });
    
    return {
      totalScore: roundedScore,
      details: {
        yinYangBalance,
        strengthBalance,
        dayBranchRelationship,
        usefulGods,
        dayGanCombination
      },
      relationshipType
    };
  }
  
  /**
   * 関係性タイプを判定する
   * @param compatibilityResult 相性評価結果
   * @returns 関係性タイプの英語表記
   */
  private determineRelationshipType(
    compatibilityResult: {
      totalScore: number,
      details: {
        yinYangBalance: number,
        strengthBalance: number,
        dayBranchRelationship: { score: number, relationship: string },
        usefulGods: number,
        dayGanCombination: { score: number, isGangou: boolean }
      }
    }
  ): string {
    const { totalScore, details } = compatibilityResult;
    
    // 理想的パートナー
    if (totalScore >= 90 && 
        details.dayGanCombination.isGangou && 
        details.dayBranchRelationship.relationship === '三合会局' && 
        details.yinYangBalance >= 80) {
      return 'idealPartner';
    }
    
    // 良好な協力関係
    if (totalScore >= 80 && 
        details.usefulGods >= 80 && 
        details.strengthBalance >= 80) {
      return 'goodCooperation';
    }
    
    // 安定した関係
    if (totalScore >= 70 && 
        details.dayBranchRelationship.relationship === '支合' && 
        details.yinYangBalance >= 70) {
      return 'stableRelationship';
    }
    
    // 刺激的な関係
    if (totalScore >= 60 && 
        details.dayBranchRelationship.relationship === '支沖' && 
        details.usefulGods >= 50) {
      return 'stimulatingRelationship';
    }
    
    // 要注意の関係
    if (totalScore < 60 && 
        details.yinYangBalance < 60 && 
        details.strengthBalance < 60 && 
        details.usefulGods < 50) {
      return 'cautionRelationship';
    }
    
    // その他の関係
    return 'generalRelationship';
  }
  
  /**
   * 相性の詳細説明を生成
   * @param user1DisplayName ユーザー1の表示名
   * @param user2DisplayName ユーザー2の表示名
   * @param user1Element ユーザー1の五行属性
   * @param user2Element ユーザー2の五行属性
   * @param compatibilityDetails 相性評価詳細
   * @returns 詳細説明
   */
  private async generateDetailDescription(
    user1DisplayName: string,
    user2DisplayName: string,
    user1Element: string,
    user2Element: string,
    compatibilityDetails: {
      totalScore: number,
      details: {
        yinYangBalance: number,
        strengthBalance: number,
        dayBranchRelationship: { score: number, relationship: string },
        usefulGods: number,
        dayGanCombination: { score: number, isGangou: boolean }
      },
      relationshipType: string
    }
  ): Promise<string> {
    // Claude AI APIに送信するプロンプト
    const prompt = `
    あなたは四柱推命と五行相性の専門家です。以下の情報から二人の相性について詳細な説明を生成してください。

    # ユーザー情報
    - ユーザー1: ${user1DisplayName} (五行属性: ${this.ELEMENT_JP_MAP[user1Element as keyof typeof this.ELEMENT_JP_MAP]})
    - ユーザー2: ${user2DisplayName} (五行属性: ${this.ELEMENT_JP_MAP[user2Element as keyof typeof this.ELEMENT_JP_MAP]})
    
    # 四柱推命相性診断結果
    - 総合スコア: ${compatibilityDetails.totalScore}/100点
    - 関係性タイプ: ${this.RELATIONSHIP_TYPE_JP[compatibilityDetails.relationshipType as keyof typeof this.RELATIONSHIP_TYPE_JP]}
    
    ## 診断詳細
    1. 陰陽バランス評価 (${compatibilityDetails.details.yinYangBalance}/100点)
       - 陽の気: 甲、丙、戊、庚、壬
       - 陰の気: 乙、丁、己、辛、癸
       - 陰陽が異なる場合は良い相性、同質の場合は衝突の可能性あり
    
    2. 身強弱バランス評価 (${compatibilityDetails.details.strengthBalance}/100点)
       - 身強: 命式に自らの五行が多く、エネルギーが外向きの人
       - 身弱: 命式に自らの五行が少なく、エネルギーが内向きの人
       - 身強弱が異なる場合は相補的、同質の場合は穏やかな関係
    
    3. 日支関係評価 (${compatibilityDetails.details.dayBranchRelationship.score}/100点)
       - 関係性: ${compatibilityDetails.details.dayBranchRelationship.relationship}
       - 三合会局（最良・相互補完的）、支合（安定・調和的）、支沖（刺激的・緊張感）
    
    4. 用神・喜神評価 (${compatibilityDetails.details.usefulGods}/100点)
       - 用神: 自分の日干から生まれる五行（相手が持つと良い）
       - 喜神: 自分の日干を克する五行（相手が持つと良い）
    
    5. 日干干合評価 (${compatibilityDetails.details.dayGanCombination.score}/100点)
       - 干合の有無: ${compatibilityDetails.details.dayGanCombination.isGangou ? 'あり' : 'なし'}
       - 干合の組み合わせ: 甲乙、丙丁、戊己、庚辛、壬癸
       - 干合があると強い結びつきがある

    以下の内容を含む相性分析レポートを作成してください。全部で800文字程度に収めてください：
    
    1. 【相性概要】この二人の相性の総合的な概要と特徴（200文字程度）
    
    2. 【詳細分析】五行相性や四柱推命の観点からの詳細な分析（200文字程度）
    
    3. 【チーム内での関係】チーム内でこの二人がどのように機能するかの洞察（200文字程度）
    
    4. 【協力のポイント】二人が効果的に協力するための具体的なアドバイス3点（各40字程度）
    
    レポートは明確に「【相性概要】」「【詳細分析】」「【チーム内での関係】」「【協力のポイント】」の4つのセクションで構成し、
    読みやすい日本語で記述してください。
    `;

    try {
      // Claude AI APIを使用して相性の詳細説明を生成
      const response = await claudeAI.callClaudeAI(prompt);
      return response || this.generateDefaultResponse(user1DisplayName, user2DisplayName, user1Element, user2Element, compatibilityDetails);
    } catch (error) {
      console.error('AI応答の取得に失敗しました:', error);
      return this.generateDefaultResponse(user1DisplayName, user2DisplayName, user1Element, user2Element, compatibilityDetails);
    }
  }

  // デフォルトレスポンスの生成メソッドを追加
  private generateDefaultResponse(
    user1DisplayName: string,
    user2DisplayName: string,
    user1Element: string,
    user2Element: string,
    compatibilityDetails: any
  ): string {
    return `【相性概要】
${user1DisplayName}(${this.ELEMENT_JP_MAP[user1Element as keyof typeof this.ELEMENT_JP_MAP]})と${user2DisplayName}(${this.ELEMENT_JP_MAP[user2Element as keyof typeof this.ELEMENT_JP_MAP]})は${this.RELATIONSHIP_TYPE_JP[compatibilityDetails.relationshipType as keyof typeof this.RELATIONSHIP_TYPE_JP]}の関係にあります。総合相性スコアは${compatibilityDetails.totalScore}点です。

【詳細分析】
陰陽バランスは${compatibilityDetails.details.yinYangBalance}点、身強弱バランスは${compatibilityDetails.details.strengthBalance}点、日支関係は${compatibilityDetails.details.dayBranchRelationship.relationship}で${compatibilityDetails.details.dayBranchRelationship.score}点、用神・喜神の相性は${compatibilityDetails.details.usefulGods}点、日干の関係は${compatibilityDetails.details.dayGanCombination.isGangou ? '干合あり' : '干合なし'}で${compatibilityDetails.details.dayGanCombination.score}点です。

【チーム内での関係】
二人はそれぞれの特性を理解し、互いの強みを活かすことでチームに貢献できます。${user1DisplayName}の${this.ELEMENT_JP_MAP[user1Element as keyof typeof this.ELEMENT_JP_MAP]}の特性と${user2DisplayName}の${this.ELEMENT_JP_MAP[user2Element as keyof typeof this.ELEMENT_JP_MAP]}の特性を組み合わせることで、より効果的な協力が可能です。

【協力のポイント】
・定期的な情報共有を心がける
・互いの違いを尊重し、補完関係を築く
・共通の目標に向けて役割分担を明確にする`;
  }
  
  /**
   * 2人のユーザー間の相性情報を取得または生成
   * @param user1Id ユーザー1のID
   * @param user2Id ユーザー2のID
   * @returns 相性情報
   */
  async getOrCreateEnhancedCompatibility(user1Id: string, user2Id: string): Promise<ICompatibilityDocument> {
    try {
      console.log(`相性診断開始: ユーザー1=${user1Id}, ユーザー2=${user2Id}`);
      
      // 既存の相性データを検索（ユーザーIDの順序を考慮）
      let compatibility = await Compatibility.findOne({
        $or: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      });
      
      // 相性データが存在する場合はそれを返す
      if (compatibility) {
        console.log('既存の相性データを返します:', compatibility._id);
        return compatibility;
      }
      
      // 小さい方のIDが先に来るようにソート（文字列比較）
      const [smallerId, largerId] = user1Id < user2Id 
        ? [user1Id, user2Id] 
        : [user2Id, user1Id];
      
      console.log('ユーザー情報を取得中...');
      
      // ユーザー情報を取得
      const [user1, user2] = await Promise.all([
        User.findById(user1Id),
        User.findById(user2Id)
      ]);
      
      if (!user1 || !user2) {
        throw new Error('ユーザーが見つかりません');
      }
      
      console.log(`ユーザー情報: user1=${user1.displayName}, user2=${user2.displayName}`);
      console.log(`五行属性: user1=${user1.elementAttribute}, user2=${user2.elementAttribute}`);
      
      if (!user1.elementAttribute || !user2.elementAttribute) {
        throw new Error('ユーザーの五行属性が設定されていません');
      }
      
      // 四柱データが存在するか確認
      if (!user1.fourPillars || !user1.fourPillars.day || !user1.fourPillars.day.heavenlyStem) {
        throw new Error(`ユーザー1(${user1.displayName})の四柱データが不完全です`);
      }
      
      if (!user2.fourPillars || !user2.fourPillars.day || !user2.fourPillars.day.heavenlyStem) {
        throw new Error(`ユーザー2(${user2.displayName})の四柱データが不完全です`);
      }
    
    try {
      // 相性の詳細計算
      const compatibilityDetails = this.calculateCompatibilityScore(user1, user2);
      
      // 相性の詳細説明を生成
      const detailDescription = await this.generateDetailDescription(
        user1.displayName,
        user2.displayName,
        user1.elementAttribute,
        user2.elementAttribute,
        compatibilityDetails
      );
      
      // 関係性タイプを日本語に変換
      const relationshipTypeJP = this.RELATIONSHIP_TYPE_JP[compatibilityDetails.relationshipType as keyof typeof this.RELATIONSHIP_TYPE_JP];
      
      console.log('相性データを作成中...');
      
      // 相性データを作成
      compatibility = await Compatibility.create({
        user1Id: smallerId,
        user2Id: largerId,
        compatibilityScore: compatibilityDetails.totalScore,
        relationship: 'enhanced', // 拡張相性計算であることを示す
        relationshipType: relationshipTypeJP,
        user1Element: user1.elementAttribute,
        user2Element: user2.elementAttribute,
        detailDescription,
        teamInsight: "", // 廃止（詳細説明に含める）
        collaborationTips: [], // 廃止（詳細説明に含める）
        enhancedDetails: {
          yinYangBalance: compatibilityDetails.details.yinYangBalance,
          strengthBalance: compatibilityDetails.details.strengthBalance,
          dayBranchRelationship: compatibilityDetails.details.dayBranchRelationship,
          usefulGods: compatibilityDetails.details.usefulGods,
          dayGanCombination: compatibilityDetails.details.dayGanCombination,
          relationshipType: compatibilityDetails.relationshipType
        }
      });
      
      console.log('相性データ作成完了:', compatibility._id);
      return compatibility;
    } catch (error) {
      console.error('相性データ作成エラー:', error);
      throw error;
    }
  } catch (error) {
    console.error('拡張相性計算エラー:', error);
    throw error;
  }
  }
  
  /**
   * チーム内の全メンバー間の相性を取得または生成
   * @param teamId チームID
   * @returns チームメンバー間の相性情報一覧
   */
  async getTeamEnhancedCompatibilities(teamId: string): Promise<ICompatibilityDocument[]> {
    // チームの存在確認
    const teamExists = await Team.exists({ _id: teamId });
    if (!teamExists) {
      throw new Error('チームが見つかりません');
    }

    // User.teamIdを使用してチームメンバーを取得
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
        const compatibility = await this.getOrCreateEnhancedCompatibility(
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
  async getTeamMemberEnhancedCompatibility(teamId: string, userId1: string, userId2: string): Promise<ICompatibilityDocument> {
    // チームの存在確認
    const teamExists = await Team.exists({ _id: teamId });
    if (!teamExists) {
      throw new Error('チームが見つかりません');
    }
    
    // 指定されたチームに所属しているユーザーを確認
    const [user1InTeam, user2InTeam] = await Promise.all([
      User.exists({ _id: userId1, teamId: teamId }),
      User.exists({ _id: userId2, teamId: teamId })
    ]);
    
    if (!user1InTeam || !user2InTeam) {
      throw new Error(`指定されたユーザーはチームのメンバーではありません (userId1: ${userId1}, userId2: ${userId2})`);
    }
    
    // 相性情報を取得または生成
    return this.getOrCreateEnhancedCompatibility(userId1, userId2);
  }
}

export const enhancedCompatibilityService = new EnhancedCompatibilityService();