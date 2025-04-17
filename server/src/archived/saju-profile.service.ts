// @ts-nocheck
import { SajuProfile } from '../models';
import { SajuEngineService } from './saju-engine.service';
import { ValidationError, NotFoundError } from '../utils';
import mongoose from 'mongoose';

/**
 * 四柱推命プロフィールサービス
 * ユーザーの四柱推命プロフィールを管理するサービス
 */
export class SajuProfileService {
  private sajuEngineService: SajuEngineService;

  constructor() {
    this.sajuEngineService = new SajuEngineService();
  }

  /**
   * 新しい四柱推命プロフィールを作成
   * @param userId ユーザーID
   * @param birthDate 生年月日
   * @param birthTime 出生時間 (HH:MM形式)
   * @param birthPlace 出生地
   * @param gender 性別 ('M'=男性, 'F'=女性)
   * @returns 作成されたプロフィール
   */
  async createProfile(userId: string, birthDate: Date, birthTime: string, birthPlace: string, gender: string) {
    // 入力検証
    if (!userId || !birthDate || !birthTime || !birthPlace || !gender) {
      throw new ValidationError('すべての入力フィールドは必須です');
    }

    console.log('\x1b[36m%s\x1b[0m', '======== 四柱推命プロフィール生成ログ ========');
    console.log('\x1b[36m%s\x1b[0m', '【入力データ】');
    console.log('\x1b[36m%s\x1b[0m', `ユーザーID: ${userId}`);
    console.log('\x1b[36m%s\x1b[0m', `生年月日: ${birthDate.toISOString()}`);
    console.log('\x1b[36m%s\x1b[0m', `出生時間: ${birthTime}`);
    console.log('\x1b[36m%s\x1b[0m', `出生地: ${birthPlace}`);
    console.log('\x1b[36m%s\x1b[0m', `性別: ${gender}`); 

    // birthTimeの形式チェック (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(birthTime)) {
      throw new ValidationError('出生時間は HH:MM 形式で入力してください');
    }

    // 既存プロフィールチェック
    const existingProfile = await SajuProfile.findOne({ userId: userId });
    if (existingProfile) {
      console.log('既存プロフィールが見つかりました:', existingProfile._id);
      throw new ValidationError('既に四柱推命プロフィールが存在します');
    }

    // 出生時間を時間と分に分解
    const [hours, minutes] = birthTime.split(':').map(Number);
    console.log('パース済み時間:', hours, '時', minutes, '分');

    console.log('SajuEngine計算開始...');
    // SajuEngineで四柱推命計算
    const result = this.sajuEngineService.calculateSajuProfile(
      birthDate,
      hours,
      minutes,
      gender,
      birthPlace
    );
    console.log('SajuEngine計算完了');

    // 計算結果のデバッグログ（詳細に表示）
    console.log('\x1b[36m%s\x1b[0m', '【四柱推命計算結果】');
    if (result.fourPillars) {
      console.log('\x1b[36m%s\x1b[0m', `年柱: ${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
      console.log('\x1b[36m%s\x1b[0m', `月柱: ${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
      console.log('\x1b[36m%s\x1b[0m', `日柱: ${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
      console.log('\x1b[36m%s\x1b[0m', `時柱: ${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);
    } else {
      console.log('\x1b[36m%s\x1b[0m', '四柱データなし（計算エラー）');
    }

    // SajuProfileモデルに合わせて結果を変換
    const profileData = this.transformSajuResult(result, userId);
    console.log('変換後のプロフィールデータ準備完了');
    
    // DB保存
    console.log('データベース保存開始...');
    const newProfile = new SajuProfile(profileData);
    await newProfile.save();
    console.log('データベース保存完了、ID:', newProfile._id);

    return newProfile;
  }

  /**
   * ユーザーIDによるプロフィール取得
   * @param userId ユーザーID
   * @returns 四柱推命プロフィール
   */
  async getProfileByUserId(userId: string) {
    if (!userId) {
      throw new ValidationError('ユーザーIDは必須です');
    }

    const profile = await SajuProfile.findOne({ userId: userId });
    
    if (!profile) {
      throw new NotFoundError('四柱推命プロフィールが見つかりません');
    }
    
    return profile;
  }

  /**
   * 四柱推命プロフィールの更新
   * @param userId ユーザーID
   * @param birthDate 生年月日
   * @param birthTime 出生時間 (HH:MM形式)
   * @param birthPlace 出生地
   * @param gender 性別 ('M'=男性, 'F'=女性)
   * @returns 更新されたプロフィール
   */
  async updateProfile(userId: string, birthDate: Date, birthTime: string, birthPlace: string, gender: string) {
    // 入力検証
    if (!userId || !birthDate || !birthTime || !birthPlace || !gender) {
      throw new ValidationError('すべての入力フィールドは必須です');
    }

    // birthTimeの形式チェック (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(birthTime)) {
      throw new ValidationError('出生時間は HH:MM 形式で入力してください');
    }

    // 既存プロフィール確認
    const existingProfile = await SajuProfile.findOne({ userId: userId });
    if (!existingProfile) {
      throw new NotFoundError('四柱推命プロフィールが見つかりません');
    }

    // 出生時間を時間と分に分解
    const [hours, minutes] = birthTime.split(':').map(Number);

    // SajuEngineで四柱推命計算
    const result = this.sajuEngineService.calculateSajuProfile(
      birthDate,
      hours,
      minutes,
      gender,
      birthPlace
    );

    // SajuProfileモデルに合わせて結果を変換
    const profileData = this.transformSajuResult(result, userId);
    
    // プロフィール更新
    const updatedProfile = await SajuProfile.findOneAndUpdate(
      { userId: userId },
      { $set: profileData },
      { new: true, runValidators: true }
    );
    
    if (!updatedProfile) {
      throw new NotFoundError('プロフィールの更新に失敗しました');
    }
    
    return updatedProfile;
  }

  /**
   * 指定された五行属性を持つユーザー一覧を取得
   * @param elementAttribute 五行属性
   * @param limit 取得件数上限
   * @returns ユーザー一覧
   */
  async getUsersByElement(elementAttribute: string, limit: number = 20) {
    if (!elementAttribute) {
      throw new ValidationError('五行属性は必須です');
    }
    
    // 有効な五行属性かチェック
    const validElements = ['wood', 'fire', 'earth', 'metal', 'water'];
    if (!validElements.includes(elementAttribute)) {
      throw new ValidationError('無効な五行属性です。wood, fire, earth, metal, water のいずれかを指定してください');
    }
    
    const profiles = await SajuProfile.find({ elementAttribute })
      .limit(limit)
      .populate('userId', 'displayName email')
      .sort({ createdAt: -1 });
    
    return profiles;
  }

  /**
   * sajuengineの結果をSajuProfileスキーマに変換するプライベートメソッド
   * @param result 四柱推命計算結果
   * @param userId ユーザーID
   * @returns SajuProfileモデル用データ
   */
  private transformSajuResult(result: any, userId: string) {
    if (!result || !result.fourPillars) {
      throw new ValidationError('四柱推命計算結果が不正です');
    }
    
    // 日柱の天干を日主として抽出
    const dayMaster = result.fourPillars.dayPillar.stem;
    
    // 五行属性を取得
    const elementAttribute = this.sajuEngineService.getMainElement(result);
    
    // 性格特性と職業適性の説明を生成
    const personalityDescription = this.generatePersonalityDescription(result);
    const careerDescription = this.generateCareerDescription(result);
    
    // SajuProfileモデルに合わせて変換
    return {
      userId: userId, // Firebase Auth UIDまたはMongoDBのObjectId
      birthdate: new Date(result.birthDate || new Date()),
      birthtime: result.birthHour ? `${Math.floor(result.birthHour)}:${Math.round((result.birthHour % 1) * 60).toString().padStart(2, '0')}` : "00:00",
      birthplace: result.location || "不明",  // 空文字列を防ぐためのデフォルト値
      gender: result.gender || "M", // 性別（デフォルトは男性）
      elementAttribute,
      dayMaster,
      pillars: {
        year: {
          heavenlyStem: result.fourPillars.yearPillar.stem,
          earthlyBranch: result.fourPillars.yearPillar.branch,
          heavenlyStemTenGod: result.tenGods?.year || "",
          earthlyBranchTenGod: result.fourPillars.yearPillar.branchTenGod || "",
          hiddenStems: result.fourPillars.yearPillar.hiddenStems || []
        },
        month: {
          heavenlyStem: result.fourPillars.monthPillar.stem,
          earthlyBranch: result.fourPillars.monthPillar.branch,
          heavenlyStemTenGod: result.tenGods?.month || "",
          earthlyBranchTenGod: result.fourPillars.monthPillar.branchTenGod || "",
          hiddenStems: result.fourPillars.monthPillar.hiddenStems || []
        },
        day: {
          heavenlyStem: result.fourPillars.dayPillar.stem,
          earthlyBranch: result.fourPillars.dayPillar.branch,
          heavenlyStemTenGod: result.tenGods?.day || "",
          earthlyBranchTenGod: result.fourPillars.dayPillar.branchTenGod || "",
          hiddenStems: result.fourPillars.dayPillar.hiddenStems || []
        },
        time: {
          heavenlyStem: result.fourPillars.hourPillar.stem,
          earthlyBranch: result.fourPillars.hourPillar.branch,
          heavenlyStemTenGod: result.tenGods?.hour || "",
          earthlyBranchTenGod: result.fourPillars.hourPillar.branchTenGod || "",
          hiddenStems: result.fourPillars.hourPillar.hiddenStems || []
        }
      },
      personalityDescription,
      careerDescription
    };
  }

  /**
   * 四柱推命結果から性格特性説明を生成
   * @param result 四柱推命計算結果
   * @returns 性格特性の説明文
   */
  private generatePersonalityDescription(result: any): string {
    // 主要な五行属性を取得
    const mainElement = this.sajuEngineService.getMainElement(result);
    const secondaryElement = this.sajuEngineService.getSecondaryElement(result);
    
    // 五行属性ごとの基本的な性格特性
    const elementPersonality: { [key: string]: string } = {
      'wood': '創造性と自己主張が強く、成長と発展を好みます。適応力があり、新しいアイデアや挑戦に積極的です。理想主義的で計画性があり、物事を順序立てて進める能力に優れています。時に頑固で自分の意見を押し通そうとする傾向もあります。',
      'fire': '情熱的でエネルギッシュ、社交的な性格です。明るく楽観的で、人々を鼓舞する力があります。直感力が強く、創造的な表現力に優れています。感情の起伏が激しく、落ち着きがないこともあります。',
      'earth': '安定性と信頼性を重視し、実用的で堅実な判断力を持ちます。忍耐強く、責任感が強い性格です。思いやりがあり、人間関係を大切にします。時に保守的すぎたり、変化を恐れる傾向があります。',
      'metal': '効率と精度を重視し、論理的で分析力に優れています。規律正しく、目標達成のための計画性があります。正義感が強く、高い基準を持っています。時に完璧主義で融通が利かないこともあります。',
      'water': '知的好奇心が強く、深い洞察力を持ちます。柔軟性と適応力に優れ、変化に対応する能力があります。直感的で創造的、そして人の感情を敏感に察知します。時に優柔不断で、集中力が散漫になることもあります。'
    };
    
    // 日柱天干（日主）の影響を記述
    const stemPersonality: { [key: string]: string } = {
      '甲': '積極的にリーダーシップを発揮し、目標に向かって直進する性格です。',
      '乙': '柔軟で調和を重んじ、周囲と協力しながら物事を進める傾向があります。',
      '丙': '明るく開放的で、人を惹きつける魅力と情熱を持っています。',
      '丁': '繊細で感受性が豊かな性格で、人の気持ちを理解する能力に優れています。',
      '戊': '誠実で信頼性が高く、実用的な判断力と責任感を持っています。',
      '己': '内省的で思慮深く、物事の本質を見抜く洞察力があります。',
      '庚': '規律を重んじ、効率と正確さを追求する傾向があります。',
      '辛': '審美眼に優れ、細部まで気を配る繊細さを持っています。',
      '壬': '知的好奇心が旺盛で、新しい知識や経験を求める冒険心があります。',
      '癸': '直感力と感受性に優れ、神秘的な魅力を持っています。'
    };
    
    // 基本となる説明文
    let description = `あなたの主要な五行属性は「${this.translateElementToJapanese(mainElement)}」です。${elementPersonality[mainElement]} `;
    
    // 補助的な五行属性がある場合
    if (secondaryElement) {
      description += `また、補助的な五行属性として「${this.translateElementToJapanese(secondaryElement)}」の影響も受けており、${elementPersonality[secondaryElement]} `;
    }
    
    // 日主（日柱天干）の影響
    const dayMaster = result.fourPillars.dayPillar.stem;
    if (dayMaster && stemPersonality[dayMaster]) {
      description += `日主は「${dayMaster}」であり、${stemPersonality[dayMaster]} `;
    }
    
    // 陰陽のバランス
    if (result.elementProfile && result.elementProfile.yinYang) {
      const yinYang = result.elementProfile.yinYang;
      if (yinYang === 'yang' || yinYang === '陽') {
        description += '全体として陽のエネルギーが強く、外向的で活動的な傾向があります。自己表現力が高く、積極的に行動する力があります。';
      } else if (yinYang === 'yin' || yinYang === '陰') {
        description += '全体として陰のエネルギーが強く、内向的で落ち着いた傾向があります。思慮深く、直感力と観察力に優れています。';
      } else {
        description += '陰陽のバランスが取れており、状況に応じて積極性と慎重さを使い分ける柔軟性があります。';
      }
    }
    
    return description;
  }

  /**
   * 四柱推命結果から職業適性説明を生成
   * @param result 四柱推命計算結果
   * @returns 職業適性の説明文
   */
  private generateCareerDescription(result: any): string {
    // 主要な五行属性を取得
    const mainElement = this.sajuEngineService.getMainElement(result);
    
    // 五行属性ごとの職業適性
    const elementCareer: { [key: string]: string } = {
      'wood': '創造性と成長を伴う職業に適性があります。教育者、コンサルタント、起業家、プロジェクトマネージャー、環境関連の仕事、法律家などが向いています。長期的なビジョンを持ち、物事を育て上げることに喜びを感じます。',
      'fire': '情熱とエネルギーを活かせる職業に適性があります。営業職、エンターテイナー、マーケター、広報担当、デザイナー、リーダーシップを発揮できる役職などが向いています。人前に立ち、自己表現することで力を発揮できます。',
      'earth': '安定性と実用性を重視する職業に適性があります。経理、不動産業、サポート職、カウンセラー、医療従事者、対人サービス業などが向いています。人を支え、安定した環境を作ることに満足を感じます。',
      'metal': '精度と効率を求められる職業に適性があります。エンジニア、会計士、プログラマー、編集者、品質管理、経営コンサルタントなどが向いています。目標達成と完璧さを追求することにやりがいを感じます。',
      'water': '知性と直感力を活かせる職業に適性があります。研究者、作家、アナリスト、心理学者、芸術家、哲学者などが向いています。深い洞察と創造的な思考で新しい知見をもたらすことに喜びを感じます。'
    };
    
    // 十神による天賦の才
    const tenGodTalent: { [key: string]: string } = {
      '正官': '規律と秩序を重んじる能力があり、管理職や行政職に適性があります。また、対人能力と協調性があり、チームワークを重視する職業でも力を発揮できます。',
      '偏官': '改革と革新の才能があり、起業家やクリエイターとして力を発揮できます。',
      '正印': '学術的な才能と教育能力があり、研究職や教育者として優れた素質があります。',
      '偏印': '芸術的感性と直感力に恵まれ、芸術家や創造的な職業に向いています。',
      '食神': '創造的な表現力があり、エンターテイメントや文化的な職業で才能を発揮できます。',
      '傷官': '批評眼と革新性があり、批評家やコンサルタントとして鋭い洞察を提供できます。',
      '正財': '安定した収入を得る才能があり、ビジネスや金融関連の職業に適性があります。',
      '偏財': '投機的な才能と冒険心があり、投資家や営業職として成功する素質があります。',
      '七殺': '競争力と決断力があり、リーダーシップを発揮する職業に向いています。'
    };
    
    // 基本となる説明文
    let description = `あなたの五行属性「${this.translateElementToJapanese(mainElement)}」に基づくと、${elementCareer[mainElement]} `;
    
    // 十神の影響（日柱天干の十神）
    const dayTenGod = result.tenGods?.day;
    if (dayTenGod && tenGodTalent[dayTenGod]) {
      description += `また、あなたの命式における「${dayTenGod}」の性質から、${tenGodTalent[dayTenGod]} `;
    }
    
    // 職業選択のアドバイス
    description += '職業選択においては、あなたの五行バランスを活かせる環境を選ぶことが重要です。';
    description += '理想的には、あなたの主要な五行特性を発揮でき、不足している五行を補える職場環境や役割が最適です。';
    description += '自分の強みを理解し、それを活かせる分野で専門性を高めることで、キャリアの充実と成功が期待できます。';
    
    return description;
  }

  /**
   * 五行属性を日本語に変換
   * @param element 五行属性（英語）
   * @returns 五行属性（日本語）
   */
  private translateElementToJapanese(element: string): string {
    const translations: { [key: string]: string } = {
      'wood': '木',
      'fire': '火',
      'earth': '土',
      'metal': '金',
      'water': '水'
    };
    
    return translations[element] || element;
  }
}