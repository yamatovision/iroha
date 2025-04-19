import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/hybrid-auth.middleware';
import { User } from '../models';
import { handleError, ValidationError, AuthenticationError, NotFoundError } from '../utils';
import { SajuEngineService } from '../services/saju-engine.service';
import { SajuResult } from 'saju-engine';
import { harmonyCompassService } from '../services/harmony-compass.service';

// 型定義を直接定義
interface IKakukyoku {
  type: string;
  category: 'special' | 'normal';
  strength: 'strong' | 'weak' | 'neutral';
  description?: string;
}

interface IYojin {
  tenGod: string;
  element: string;
  description?: string;
  supportElements?: string[];
  // 喜神情報（用神を助ける要素）
  kijin?: {
    tenGod: string;
    element: string;
    description?: string;
  };
  // 忌神情報（避けるべき要素）
  kijin2?: {
    tenGod: string;
    element: string;
    description?: string;
  };
  // 仇神情報（強く避けるべき要素）
  kyujin?: {
    tenGod: string;
    element: string;
    description?: string;
  };
}

/**
 * ユーザー関連のコントローラークラス
 */
export class UserController {
  private sajuEngineService: SajuEngineService;

  constructor() {
    this.sajuEngineService = new SajuEngineService();
  }
  
  /**
   * ユーザーのメールアドレスを更新する
   * 注意: Firebaseでのメールアドレス変更も必要なため、実装は複雑
   */
  updateEmail = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('認証されていません');
      }

      const { email } = req.body;
      
      // 入力検証
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new ValidationError('有効なメールアドレスを入力してください');
      }
      
      // Firebaseでのメールアドレス変更はクライアント側で行う必要がある
      // このエンドポイントではMongoDBのユーザー情報のみ更新
      
      const updateData = { email };
      
      // ユーザーを更新
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }
      
      return res.status(200).json({
        message: 'メールアドレスが更新されました',
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      return handleError(error, res);
    }
  };

  /**
   * ユーザープロフィールを取得する
   */
  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('認証されていません');
      }

      const user = await User.findById(req.user.id).exec();
      
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }
      
      return res.status(200).json({
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        jobTitle: user.jobTitle || '',
        goal: user.goal || '',
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        gender: user.gender,
        elementAttribute: user.elementAttribute,
        dayMaster: user.dayMaster,
        fourPillars: user.fourPillars,
        elementProfile: user.elementProfile,
        kakukyoku: user.kakukyoku,
        yojin: user.yojin,
        personalityDescription: user.personalityDescription,
        careerAptitude: user.careerAptitude,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      return handleError(error, res);
    }
  };

  /**
   * ユーザープロフィールを更新する
   * 基本情報と生年月日情報を統合した更新エンドポイント
   */
  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('認証されていません');
      }

      const { 
        // 基本情報
        displayName, 
        jobTitle, 
        goal,
        // 生年月日情報
        birthDate, 
        birthTime, 
        birthPlace, 
        gender,
        birthplaceCoordinates,
        localTimeOffset,
        // 更新オプション
        calculateSaju = false // 四柱推命情報を再計算するかどうかのフラグ
      } = req.body;
      
      // 入力検証
      if (displayName && (displayName.length < 2 || displayName.length > 50)) {
        throw new ValidationError('表示名は2文字以上50文字以下である必要があります');
      }
      
      if (goal && goal.length > 1000) {
        throw new ValidationError('目標は1000文字以下である必要があります');
      }

      // birthTimeの形式チェック (HH:MM) - 指定された場合のみ
      if (birthTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(birthTime)) {
          throw new ValidationError('出生時間は HH:MM 形式で入力してください');
        }
      }
      
      // 日付変換 - 指定された場合のみ
      let parsedBirthDate;
      if (birthDate) {
        parsedBirthDate = new Date(birthDate);
        if (isNaN(parsedBirthDate.getTime())) {
          throw new ValidationError('無効な生年月日フォーマットです');
        }
      }
      
      // 性別検証 - 指定された場合のみ
      if (gender && gender !== 'M' && gender !== 'F') {
        throw new ValidationError('性別は M または F で指定してください');
      }
      
      // 座標の検証（指定されている場合）
      if (birthplaceCoordinates) {
        const { longitude, latitude } = birthplaceCoordinates;
        if (typeof longitude !== 'number' || typeof latitude !== 'number' ||
            longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
          throw new ValidationError('無効な座標値です。経度: -180〜180、緯度: -90〜90の範囲で指定してください');
        }
      }
      
      // 座標または出生地が変更されたかどうかを確認
      const isLocationChanged = birthPlace || birthplaceCoordinates;
      
      // 更新データを準備
      const updateData: any = {};
      
      // 基本情報
      if (displayName) updateData.displayName = displayName;
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
      if (goal !== undefined) updateData.goal = goal;
      
      // 生年月日情報
      if (parsedBirthDate) updateData.birthDate = parsedBirthDate;
      if (birthTime) updateData.birthTime = birthTime;
      if (birthPlace) updateData.birthPlace = birthPlace;
      if (gender) updateData.gender = gender;
      
      // 座標と時差情報
      if (birthplaceCoordinates) updateData.birthplaceCoordinates = birthplaceCoordinates;
      if (localTimeOffset !== undefined) updateData.localTimeOffset = localTimeOffset;
      
      // 現在のユーザー情報を取得
      let user = await User.findById(req.user.id).exec();
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }
      
      // 座標の計算 - 出生地が変更されたが座標が指定されていない場合
      if (birthPlace && !birthplaceCoordinates) {
        try {
          const sajuEngineService = new SajuEngineService();
          const coordinates = sajuEngineService.getCityCoordinates(birthPlace);
          if (coordinates) {
            updateData.birthplaceCoordinates = coordinates;
            console.log(`都市名 "${birthPlace}" から座標を計算: `, coordinates);
            
            // 地方時オフセットも計算
            const offset = sajuEngineService.calculateLocalTimeOffset(coordinates);
            updateData.localTimeOffset = offset;
            console.log(`座標から地方時オフセットを計算: ${offset}分`);
          }
        } catch (error) {
          console.warn(`都市名 "${birthPlace}" からの座標計算に失敗しました:`, error);
          // 座標計算に失敗しても処理は続行
        }
      }
      
      // 更新するフィールドがあるかチェック
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('更新するフィールドが指定されていません');
      }
      
      // ユーザー情報を更新
      user = await User.findByIdAndUpdate(
        req.user.id, // uidではなくidを使用
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new NotFoundError('ユーザー更新に失敗しました');
      }
      
      // 四柱推命情報を計算する条件
      // 1. 明示的にcalculateSajuがtrueの場合
      // 2. 生年月日情報が変更され、かつ必要な情報がすべて揃っている場合
      const shouldCalculateSaju = 
        calculateSaju || 
        (isLocationChanged || birthDate || birthTime || gender) && 
        user.birthDate && user.birthTime && user.birthPlace && user.gender;
      
      // 四柱推命情報を計算
      if (shouldCalculateSaju && user.birthTime && user.birthDate && user.gender && user.birthPlace) {
        try {
          console.log('四柱推命情報を計算します...');
          const sajuEngineService = new SajuEngineService();
          
          // 時間と分に分解
          const [hours, minutes] = user.birthTime.split(':').map(Number);
          
          // 四柱推命を計算
          const result: SajuResult = sajuEngineService.calculateSajuProfile(
            user.birthDate as Date, // Type assertion to assure TypeScript
            hours,
            minutes,
            user.gender,
            user.birthPlace,
            user.birthplaceCoordinates
          );
          
          // 結果を変換してユーザーモデルに合わせる
          const sajuUpdateData = {
            elementAttribute: sajuEngineService.getMainElement(result),
            dayMaster: result.fourPillars.dayPillar.stem,
            fourPillars: {
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
              hour: {
                heavenlyStem: result.fourPillars.hourPillar.stem,
                earthlyBranch: result.fourPillars.hourPillar.branch,
                heavenlyStemTenGod: result.tenGods?.hour || "",
                earthlyBranchTenGod: result.fourPillars.hourPillar.branchTenGod || "",
                hiddenStems: result.fourPillars.hourPillar.hiddenStems || []
              }
            },
            personalityDescription: this.generatePersonalityDescription(result),
            careerAptitude: this.generateCareerDescription(result),
            // 五行バランス値の計算を追加
            elementProfile: (() => {
              // 四柱から五行バランスを計算
              // 型安全のためにanyにキャスト
              const elementProfile = result.elementProfile as any;
              if (elementProfile && 
                  typeof elementProfile.wood === 'number' &&
                  typeof elementProfile.fire === 'number' &&
                  typeof elementProfile.earth === 'number' &&
                  typeof elementProfile.metal === 'number' &&
                  typeof elementProfile.water === 'number') {
                return {
                  wood: elementProfile.wood,
                  fire: elementProfile.fire,
                  earth: elementProfile.earth,
                  metal: elementProfile.metal,
                  water: elementProfile.water
                };
              }
              
              // 計算されたバランスがない場合は、自分で計算
              const fourPillars = result.fourPillars;
              if (fourPillars) {
                try {
                  // SajuEngineのcalculateElementBalanceメソッドを直接呼び出す
                  const elementBalance = this.sajuEngineService.calculateElementBalance(fourPillars);
                  console.log('計算された五行バランス:', elementBalance);
                  return elementBalance;
                } catch (error) {
                  console.error('五行バランス計算エラー:', error);
                }
              }
              
              // どちらも失敗した場合のデフォルト値
              return {
                wood: 0,
                fire: 0,
                earth: 0,
                metal: 0,
                water: 0
              };
            })(),
            // 格局（気質タイプ）情報を追加
            kakukyoku: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku ? {
              type: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.type || '',
              category: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.category || 'normal',
              strength: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.strength || 'neutral',
              description: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.description || ''
            } : undefined,
            // 用神（運気を高める要素）情報を追加
            yojin: (result as SajuResult & { yojin?: IYojin }).yojin ? {
              tenGod: (result as SajuResult & { yojin?: IYojin }).yojin?.tenGod || '',
              element: (result as SajuResult & { yojin?: IYojin }).yojin?.element || '',
              description: (result as SajuResult & { yojin?: IYojin }).yojin?.description || '',
              supportElements: (result as SajuResult & { yojin?: IYojin }).yojin?.supportElements || []
            } : undefined
          };
          
          // elementProfileの処理
          if (result.elementProfile) {
            const ep = result.elementProfile as any;
            const profile = sajuUpdateData.elementProfile;
            
            if (typeof ep.wood === 'number') profile.wood = ep.wood;
            if (typeof ep.fire === 'number') profile.fire = ep.fire;
            if (typeof ep.earth === 'number') profile.earth = ep.earth;
            if (typeof ep.metal === 'number') profile.metal = ep.metal;
            if (typeof ep.water === 'number') profile.water = ep.water;
          }
          
          // 調和のコンパスを生成（Claude AI利用）
          console.log('🧭 調和のコンパス生成条件到達: ' + user._id);
          console.log('🧭 環境変数確認: ANTHROPIC_API_KEY=' + (process.env.ANTHROPIC_API_KEY ? '設定済み' : '未設定'), 'CLAUDE_API_MODEL=' + (process.env.CLAUDE_API_MODEL || '未設定'));
          
          try {
            // ユーザーデータを構築
            console.log('🧭 ユーザーデータ構築開始');
            const userData = {
              user: {
                displayName: user.displayName,
                elementAttribute: sajuUpdateData.elementAttribute,
                dayMaster: sajuUpdateData.dayMaster,
                fourPillars: sajuUpdateData.fourPillars,
                elementProfile: sajuUpdateData.elementProfile,
                kakukyoku: sajuUpdateData.kakukyoku,
                yojin: sajuUpdateData.yojin
              }
            };
            console.log('🧭 構築したユーザーデータ:', JSON.stringify(userData, null, 2).substring(0, 200) + '...');
            
            // 調和のコンパスを生成
            console.log('🧭 調和のコンパス生成開始...');
            try {
              const compassResult = await harmonyCompassService.generateHarmonyCompass(userData.user);
              console.log('🧭 調和のコンパス生成成功:', compassResult ? '結果あり' : '結果なし');
              
              if (compassResult && compassResult.content) {
                console.log('🧭 調和のコンパス内容:', compassResult.content.substring(0, 100) + '...');
                
                // careerAptitudeフィールドに保存（マークダウンフォーマットのまま全体を保存）
                sajuUpdateData.careerAptitude = compassResult.content;
                console.log('🧭 careerAptitudeに保存する内容のサイズ:', compassResult.content.length, '文字');
                
                // personalityDescriptionは非推奨になりますが、後方互換性のために維持
                // マークダウン形式のテキストから「格局に基づく性格特性」セクションを抽出
                if (compassResult.sections && compassResult.sections.personality) {
                  sajuUpdateData.personalityDescription = compassResult.sections.personality;
                  console.log('🧭 セクションから抽出したpersonalityDescription:', sajuUpdateData.personalityDescription.substring(0, 50) + '...');
                } else {
                  sajuUpdateData.personalityDescription = extractPersonalityDescription(compassResult.content);
                  console.log('🧭 テキストから抽出したpersonalityDescription:', sajuUpdateData.personalityDescription ? sajuUpdateData.personalityDescription.substring(0, 50) + '...' : '抽出なし');
                }
                
                console.log('🧭 調和のコンパス生成完了');
              } else {
                console.error('🧭 調和のコンパスレスポンスが空か不正:', compassResult);
                throw new Error('調和のコンパスレスポンスが空か不正');
              }
            } catch (compassError) {
              console.error('🧭 調和のコンパス生成エラー:', compassError);
              throw compassError; // 上位のエラーハンドリングに渡す
            }
            
            // 性格特性部分を抽出する補助関数
            function extractPersonalityDescription(content: string): string {
              console.log('🧭 personalityDescription抽出開始');
              if (!content) {
                console.log('🧭 コンテンツが空のため抽出できません');
                return '';
              }
              
              // マークダウン形式から性格特性セクションを抽出
              const personalityMatch = content.match(/##\s*格局に基づく性格特性[\s\S]*?(?=##|$)/i);
              if (personalityMatch && personalityMatch[0]) {
                console.log('🧭 性格特性セクションを検出');
                // セクションタイトルを除去し、テキストのみを返す
                const result = personalityMatch[0].replace(/##\s*格局に基づく性格特性/i, '').trim();
                console.log('🧭 抽出結果:', result.substring(0, 50) + '...');
                return result;
              }
              console.log('🧭 性格特性セクションが見つかりませんでした');
              return '';
            }
            
          } catch (compassError) {
            console.error('🧭 調和のコンパス生成エラー:', compassError);
            console.error('🧭 エラー詳細:', JSON.stringify(compassError, Object.getOwnPropertyNames(compassError), 2));
            
            console.log('🧭 フォールバック処理を開始: 従来のメソッドで生成');
            // エラー時は従来のメソッドで生成
            const personalityDescription = this.generatePersonalityDescription(result);
            const careerAptitude = this.generateCareerDescription(result);
            
            console.log('🧭 フォールバック: personalityDescription =', personalityDescription.substring(0, 50) + '...');
            console.log('🧭 フォールバック: careerAptitude =', careerAptitude.substring(0, 50) + '...');
            
            // フォールバック時も同じ順序で保存（personalityDescriptionは後方互換性のために維持）
            sajuUpdateData.careerAptitude = careerAptitude;
            sajuUpdateData.personalityDescription = personalityDescription;
            console.log('🧭 フォールバック処理完了');
          }

          // 四柱推命情報を更新
          user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: sajuUpdateData },
            { new: true, runValidators: true }
          ).exec();
          
          if (!user) {
            throw new Error('四柱推命情報の更新に失敗しました');
          }
        } catch (sajuError) {
          console.error('四柱推命計算エラー:', sajuError);
          // 四柱推命計算に失敗しても、基本情報の更新は有効なまま
        }
      }
      
      // userがnullでないことを再確認
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりませんでした');
      }

      // 全ての情報を含む完全なユーザー情報を返す
      return res.status(200).json({
        message: 'プロフィールが更新されました',
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        jobTitle: user.jobTitle || '',
        goal: user.goal || '',
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        gender: user.gender,
        birthplaceCoordinates: user.birthplaceCoordinates,
        localTimeOffset: user.localTimeOffset,
        elementAttribute: user.elementAttribute,
        dayMaster: user.dayMaster,
        fourPillars: user.fourPillars,
        elementProfile: user.elementProfile,
        kakukyoku: user.kakukyoku,
        yojin: user.yojin,
        personalityDescription: user.personalityDescription,
        careerAptitude: user.careerAptitude,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      return handleError(error, res);
    }
  };

  /**
   * 生年月日情報を更新する
   */
  updateBirthInfo = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('認証されていません');
      }

      const { 
        birthDate, 
        birthTime, 
        birthPlace, 
        gender,
        birthplaceCoordinates,
        localTimeOffset
      } = req.body;
      
      // 必須入力の検証
      if (!birthDate || !birthTime || !birthPlace || !gender) {
        throw new ValidationError('生年月日、出生時間、出生地、性別は必須です');
      }
      
      // birthTimeの形式チェック (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(birthTime)) {
        throw new ValidationError('出生時間は HH:MM 形式で入力してください');
      }
      
      // 日付変換
      const parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        throw new ValidationError('無効な生年月日フォーマットです');
      }
      
      // 性別検証
      if (gender !== 'M' && gender !== 'F') {
        throw new ValidationError('性別は M または F で指定してください');
      }
      
      // 座標の検証（指定されている場合）
      if (birthplaceCoordinates) {
        const { longitude, latitude } = birthplaceCoordinates;
        if (typeof longitude !== 'number' || typeof latitude !== 'number' ||
            longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
          throw new ValidationError('無効な座標値です。経度: -180〜180、緯度: -90〜90の範囲で指定してください');
        }
      }
      
      // 座標の取得（指定されていない場合は計算）
      let coordinates = birthplaceCoordinates;
      if (!coordinates) {
        coordinates = this.sajuEngineService.getCityCoordinates(birthPlace);
        console.log(`都市名 "${birthPlace}" から座標を計算: `, coordinates);
      }
      
      // 地方時オフセットの取得（指定されていない場合は計算）
      let offset = localTimeOffset;
      if (coordinates && offset === undefined) {
        offset = this.sajuEngineService.calculateLocalTimeOffset(coordinates);
        console.log(`座標から地方時オフセットを計算: ${offset}分`);
      }
      
      // 更新データを準備
      const updateData = {
        birthDate: parsedBirthDate,
        birthTime,
        birthPlace,
        gender,
        birthplaceCoordinates: coordinates,
        localTimeOffset: offset
      };
      
      console.log('生年月日情報の更新データ: ', updateData);
      
      // ユーザーを更新
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }
      
      return res.status(200).json({
        message: '生年月日情報が更新されました',
        birthInfo: {
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          birthPlace: user.birthPlace,
          gender: user.gender,
          birthplaceCoordinates: user.birthplaceCoordinates,
          localTimeOffset: user.localTimeOffset
        }
      });
    } catch (error) {
      return handleError(error, res);
    }
  };

  /**
   * 保存された生年月日情報から四柱推命を計算する
   */
  calculateSaju = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('認証されていません');
      }

      // ユーザー情報を取得
      const user = await User.findById(req.user.id).exec();
      
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }
      
      // 生年月日情報の有無を確認
      if (!user.birthDate || !user.birthTime || !user.birthPlace || !user.gender) {
        throw new ValidationError('四柱推命の計算には生年月日情報の登録が必要です');
      }
      
      // 出生時間を時間と分に分解
      const [hours, minutes] = user.birthTime.split(':').map(Number);
      
      console.log('四柱推命計算の入力データ: ', {
        birthDate: user.birthDate,
        hours,
        minutes,
        gender: user.gender,
        birthPlace: user.birthPlace,
        coordinates: user.birthplaceCoordinates
      });
      
      // 四柱推命を計算
      const result: SajuResult = this.sajuEngineService.calculateSajuProfile(
        user.birthDate,
        hours,
        minutes,
        user.gender,
        user.birthPlace,
        user.birthplaceCoordinates
      );
      
      console.log('四柱推命計算結果: ', {
        hasFourPillars: !!result.fourPillars,
        elementAttribute: this.sajuEngineService.getMainElement(result)
      });
      
      // 結果を変換してユーザーモデルに合わせる
      // 型定義を明示的に追加して型エラーを解消
      interface UpdateData {
        elementAttribute: string;
        dayMaster: string;
        fourPillars: {
          year: {
            heavenlyStem: string;
            earthlyBranch: string;
            heavenlyStemTenGod: string;
            earthlyBranchTenGod: string;
            hiddenStems: string[];
          };
          month: {
            heavenlyStem: string;
            earthlyBranch: string;
            heavenlyStemTenGod: string;
            earthlyBranchTenGod: string;
            hiddenStems: string[];
          };
          day: {
            heavenlyStem: string;
            earthlyBranch: string;
            heavenlyStemTenGod: string;
            earthlyBranchTenGod: string;
            hiddenStems: string[];
          };
          hour: {
            heavenlyStem: string;
            earthlyBranch: string;
            heavenlyStemTenGod: string;
            earthlyBranchTenGod: string;
            hiddenStems: string[];
          };
        };
        personalityDescription?: string;
        careerAptitude?: string;
        elementProfile?: {
          wood: number;
          fire: number;
          earth: number;
          metal: number;
          water: number;
        };
        // 格局（気質タイプ）情報
        kakukyoku?: {
          type: string;
          category: 'special' | 'normal';
          strength: 'strong' | 'weak' | 'neutral';
          description?: string;
        };
        // 用神（運気を高める要素）情報
        yojin?: {
          tenGod: string;
          element: string;
          description?: string;
          supportElements?: string[];
          // 喜神情報（用神を助ける要素）
          kijin?: {
            tenGod: string;
            element: string;
            description?: string;
          };
          // 2番目の喜神情報
          kijin2?: {
            tenGod: string;
            element: string;
            description?: string;
          };
          // 仇神情報（避けるべき要素）
          kyujin?: {
            tenGod: string;
            element: string;
            description?: string;
          };
        };
      }

      const updateData: UpdateData = {
        elementAttribute: this.sajuEngineService.getMainElement(result),
        dayMaster: result.fourPillars.dayPillar.stem,
        fourPillars: {
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
          hour: {
            heavenlyStem: result.fourPillars.hourPillar.stem,
            earthlyBranch: result.fourPillars.hourPillar.branch,
            heavenlyStemTenGod: result.tenGods?.hour || "",
            earthlyBranchTenGod: result.fourPillars.hourPillar.branchTenGod || "",
            hiddenStems: result.fourPillars.hourPillar.hiddenStems || []
          }
        },
        // 格局（気質タイプ）情報を追加
        kakukyoku: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku ? {
          type: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.type || '',
          category: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.category || 'normal',
          strength: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.strength || 'neutral',
          description: (result as SajuResult & { kakukyoku?: IKakukyoku }).kakukyoku?.description || ''
        } : undefined,
        // 用神（運気を高める要素）情報を追加（喜神・忌神・仇神を含む）
        yojin: (result as SajuResult & { yojin?: IYojin }).yojin ? {
          tenGod: (result as SajuResult & { yojin?: IYojin }).yojin?.tenGod || '',
          element: (result as SajuResult & { yojin?: IYojin }).yojin?.element || '',
          description: (result as SajuResult & { yojin?: IYojin }).yojin?.description || '',
          supportElements: (result as SajuResult & { yojin?: IYojin }).yojin?.supportElements || [],
          kijin: (result as SajuResult & { yojin?: IYojin }).yojin?.kijin || { 
            tenGod: '', 
            element: '',
            description: '' 
          },
          kijin2: (result as SajuResult & { yojin?: IYojin }).yojin?.kijin2 || { 
            tenGod: '', 
            element: '',
            description: '' 
          },
          kyujin: (result as SajuResult & { yojin?: IYojin }).yojin?.kyujin || { 
            tenGod: '', 
            element: '',
            description: '' 
          }
        } : undefined
      };
      
      // 調和のコンパスを生成（Claude AI利用）
      console.log('🧭 調和のコンパス生成条件到達: ' + user._id);
      console.log('🧭 環境変数確認: ANTHROPIC_API_KEY=' + (process.env.ANTHROPIC_API_KEY ? '設定済み' : '未設定'), 'CLAUDE_API_MODEL=' + (process.env.CLAUDE_API_MODEL || '未設定'));
      
      try {
        // ユーザーデータを構築
        console.log('🧭 ユーザーデータ構築開始');
        const userData = {
          user: {
            displayName: user.displayName,
            elementAttribute: updateData.elementAttribute,
            dayMaster: updateData.dayMaster,
            fourPillars: updateData.fourPillars,
            elementProfile: updateData.elementProfile,
            kakukyoku: updateData.kakukyoku,
            yojin: updateData.yojin
          }
        };
        console.log('🧭 構築したユーザーデータ:', JSON.stringify(userData, null, 2).substring(0, 200) + '...');
        
        // 調和のコンパスを生成
        console.log('🧭 調和のコンパス生成開始...');
        try {
          const compassResult = await harmonyCompassService.generateHarmonyCompass(userData.user);
          console.log('🧭 調和のコンパス生成成功:', compassResult ? '結果あり' : '結果なし');
          
          if (compassResult && compassResult.content) {
            console.log('🧭 調和のコンパス内容:', compassResult.content.substring(0, 100) + '...');
            
            // マークダウン形式のテキストからpersonalityDescriptionを抽出
            if (compassResult.sections && compassResult.sections.personality) {
              updateData.personalityDescription = compassResult.sections.personality;
              console.log('🧭 セクションから抽出したpersonalityDescription:', updateData.personalityDescription.substring(0, 50) + '...');
            } else {
              updateData.personalityDescription = extractPersonalityDescription(compassResult.content);
              console.log('🧭 テキストから抽出したpersonalityDescription:', updateData.personalityDescription ? updateData.personalityDescription.substring(0, 50) + '...' : '抽出なし');
            }
            
            // careerAptitudeフィールドに保存
            // テキストとして直接保存する方式に変更
            updateData.careerAptitude = compassResult.content;
            console.log('🧭 careerAptitudeに保存する内容のサイズ:', compassResult.content.length, '文字');
            
            console.log('🧭 調和のコンパス生成完了');
          } else {
            console.error('🧭 調和のコンパスレスポンスが空か不正:', compassResult);
            throw new Error('調和のコンパスレスポンスが空か不正');
          }
        } catch (compassError) {
          console.error('🧭 調和のコンパス生成エラー:', compassError);
          throw compassError; // 上位のエラーハンドリングに渡す
        }
        
        // 性格特性部分を抽出する補助関数
        function extractPersonalityDescription(content: string): string {
          console.log('🧭 personalityDescription抽出開始');
          if (!content) {
            console.log('🧭 コンテンツが空のため抽出できません');
            return '';
          }
          
          // マークダウン形式から性格特性セクションを抽出
          const personalityMatch = content.match(/##\s*格局に基づく性格特性[\s\S]*?(?=##|$)/i);
          if (personalityMatch && personalityMatch[0]) {
            console.log('🧭 性格特性セクションを検出');
            // セクションタイトルを除去し、テキストのみを返す
            const result = personalityMatch[0].replace(/##\s*格局に基づく性格特性/i, '').trim();
            console.log('🧭 抽出結果:', result.substring(0, 50) + '...');
            return result;
          }
          console.log('🧭 性格特性セクションが見つかりませんでした');
          return '';
        }
        
      } catch (compassError) {
        console.error('🧭 調和のコンパス生成エラー:', compassError);
        console.error('🧭 エラー詳細:', JSON.stringify(compassError, Object.getOwnPropertyNames(compassError), 2));
        
        console.log('🧭 フォールバック処理を開始: 従来のメソッドで生成');
        // エラー時は従来のメソッドで生成
        const personalityDescription = this.generatePersonalityDescription(result);
        const careerAptitude = this.generateCareerDescription(result);
        
        console.log('🧭 フォールバック: personalityDescription =', personalityDescription.substring(0, 50) + '...');
        console.log('🧭 フォールバック: careerAptitude =', careerAptitude.substring(0, 50) + '...');
        
        updateData.personalityDescription = personalityDescription;
        updateData.careerAptitude = careerAptitude;
        console.log('🧭 フォールバック処理完了');
      }
      
      // 五行バランス値の計算を追加
      updateData.elementProfile = (() => {
        // SajuEngineから返された結果にelementProfileが含まれている場合はそれを使用
        // 型安全のためにanyにキャスト
        const elementProfile = result.elementProfile as any;
        if (elementProfile && 
            typeof elementProfile.wood === 'number' &&
            typeof elementProfile.fire === 'number' &&
            typeof elementProfile.earth === 'number' &&
            typeof elementProfile.metal === 'number' &&
            typeof elementProfile.water === 'number') {
          
          console.log('SajuEngineから取得した五行バランス:', elementProfile);
          return {
            wood: elementProfile.wood,
            fire: elementProfile.fire,
            earth: elementProfile.earth,
            metal: elementProfile.metal,
            water: elementProfile.water
          };
        }
        
        // SajuEngineから適切な値が返されない場合は、コントローラー側で計算
        const fourPillars = result.fourPillars;
        if (fourPillars) {
          try {
            // SajuEngineのcalculateElementBalanceメソッドを直接呼び出す
            const elementBalance = this.sajuEngineService.calculateElementBalance(fourPillars);
            console.log('コントローラーで計算した五行バランス:', elementBalance);
            return elementBalance;
          } catch (error) {
            console.error('五行バランス計算エラー:', error);
          }
        }
        
        // どちらも失敗した場合のデフォルト値
        return {
          wood: 0,
          fire: 0,
          earth: 0,
          metal: 0,
          water: 0
        };
      })();
      
      // ユーザー情報を更新
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!updatedUser) {
        throw new Error('ユーザー更新に失敗しました');
      }
      
      return res.status(200).json({
        message: '四柱推命情報が計算・更新されました',
        sajuProfile: {
          elementAttribute: updatedUser.elementAttribute,
          dayMaster: updatedUser.dayMaster,
          fourPillars: updatedUser.fourPillars,
          elementProfile: updatedUser.elementProfile,
          kakukyoku: updatedUser.kakukyoku,
          yojin: updatedUser.yojin,
          personalityDescription: updatedUser.personalityDescription?.substring(0, 100) + '...',
          careerAptitude: updatedUser.careerAptitude?.substring(0, 100) + '...'
        }
      });
    } catch (error) {
      return handleError(error, res);
    }
  };

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