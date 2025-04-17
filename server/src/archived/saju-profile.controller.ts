// @ts-nocheck
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SajuProfileService } from '../services/saju-profile.service';
import { SajuEngineService } from '../services/saju-engine.service';
import { handleError, ValidationError, AuthenticationError, NotFoundError } from '../utils';

/**
 * 四柱推命プロフィールを作成するコントローラー
 */
export const createSajuProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }

    const { birthDate, birthTime, birthPlace, gender, birthplaceCoordinates, localTimeOffset } = req.body;
    
    // リクエストのデバッグログ
    console.log('=== 四柱推命プロフィール作成リクエスト ===');
    console.log('ユーザーID:', req.user.uid);
    console.log('リクエストボディ:', JSON.stringify({
      birthDate,
      birthTime,
      birthPlace,
      gender,
      birthplaceCoordinates,
      localTimeOffset
    }, null, 2));
    
    // 入力検証
    if (!birthDate || !birthTime || !birthPlace || !gender) {
      throw new ValidationError('生年月日、出生時間、出生地、性別は必須です');
    }
    
    // 日付変換
    const parsedBirthDate = new Date(birthDate);
    if (isNaN(parsedBirthDate.getTime())) {
      throw new ValidationError('無効な生年月日フォーマットです');
    }
    
    console.log('パース済み日付:', parsedBirthDate.toISOString());
    
    const sajuProfileService = new SajuProfileService();
    const profile = await sajuProfileService.createProfile(
      req.user.uid,
      parsedBirthDate,
      birthTime,
      birthPlace,
      gender
    );
    
    // 結果のデバッグログ
    console.log('=== 四柱推命計算結果 ===');
    console.log('プロフィールID:', profile._id);
    console.log('五行属性:', profile.elementAttribute);
    console.log('日主:', profile.dayMaster);
    console.log('四柱:', JSON.stringify({
      年柱: {
        天干: profile.pillars.year.heavenlyStem,
        地支: profile.pillars.year.earthlyBranch
      },
      月柱: {
        天干: profile.pillars.month.heavenlyStem,
        地支: profile.pillars.month.earthlyBranch
      },
      日柱: {
        天干: profile.pillars.day.heavenlyStem,
        地支: profile.pillars.day.earthlyBranch
      },
      時柱: {
        天干: profile.pillars.time.heavenlyStem,
        地支: profile.pillars.time.earthlyBranch
      }
    }, null, 2));
    
    return res.status(201).json({
      message: '四柱推命プロフィールが作成されました',
      profile
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 自分の四柱推命プロフィールを取得するコントローラー
 */
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }

    console.log('=== 四柱推命プロフィール取得リクエスト ===');
    console.log('ユーザーID:', req.user.uid);

    const sajuProfileService = new SajuProfileService();
    const profile = await sajuProfileService.getProfileByUserId(req.user.uid);
    
    console.log('=== 四柱推命プロフィール取得結果 ===');
    console.log('プロフィールID:', profile._id);
    console.log('五行属性:', profile.elementAttribute);
    console.log('四柱例:', `年柱: ${profile.pillars.year.heavenlyStem}${profile.pillars.year.earthlyBranch}`);
    
    return res.status(200).json(profile);
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return handleError(error, res);
  }
};

/**
 * 自分の四柱推命プロフィール編集用の詳細データを取得するコントローラー
 */
export const getMyProfileDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }

    console.log('=== 四柱推命プロフィール詳細データ取得リクエスト ===');
    console.log('ユーザーID:', req.user.uid);

    const sajuProfileService = new SajuProfileService();
    const profile = await sajuProfileService.getProfileByUserId(req.user.uid);
    
    // MongoDB SajuProfile モデルから編集用の詳細データを取得・変換
    const profileDetails = {
      birthDate: profile.birthdate ? new Date(profile.birthdate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      birthTime: profile.birthtime || "12:00",
      birthPlace: profile.birthplace || "東京都",
      gender: profile.gender || "M", // ISajuProfileの型定義とスキーマに追加したgenderフィールド
      birthplaceCoordinates: profile.birthplaceCoordinates,
      localTimeOffset: profile.localTimeOffset
    };
    
    console.log('=== 四柱推命プロフィール詳細データ ===');
    console.log(JSON.stringify(profileDetails, null, 2));
    
    return res.status(200).json(profileDetails);
  } catch (error) {
    console.error('プロフィール詳細データ取得エラー:', error);
    return handleError(error, res);
  }
};

/**
 * 指定されたユーザーの四柱推命プロフィールを取得するコントローラー
 * 注：アクセス制御が必要（チームメンバーやAdmin権限チェックなど）
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }

    const { userId } = req.params;
    
    if (!userId) {
      throw new ValidationError('ユーザーIDは必須です');
    }
    
    // TODO: アクセス権限チェック
    // 現状ではシンプルに実装していますが、実際のアプリケーションでは
    // チームメンバーであることや管理者権限のチェックが必要です
    
    const sajuProfileService = new SajuProfileService();
    const profile = await sajuProfileService.getProfileByUserId(userId);
    
    return res.status(200).json(profile);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 四柱推命プロフィールを更新するコントローラー
 */
export const updateSajuProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }

    const { birthDate, birthTime, birthPlace, gender } = req.body;
    
    // 入力検証
    if (!birthDate || !birthTime || !birthPlace || !gender) {
      throw new ValidationError('生年月日、出生時間、出生地、性別は必須です');
    }
    
    // 日付変換
    const parsedBirthDate = new Date(birthDate);
    if (isNaN(parsedBirthDate.getTime())) {
      throw new ValidationError('無効な生年月日フォーマットです');
    }
    
    const sajuProfileService = new SajuProfileService();
    const profile = await sajuProfileService.updateProfile(
      req.user.uid,
      parsedBirthDate,
      birthTime,
      birthPlace,
      gender
    );
    
    return res.status(200).json({
      message: '四柱推命プロフィールが更新されました',
      profile
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 特定の五行属性を持つユーザープロフィールを検索するコントローラー
 * 主にチーム編成やチーム分析で使用
 */
export const getUsersByElement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }

    const { element } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    if (!element) {
      throw new ValidationError('五行属性は必須です');
    }
    
    const sajuProfileService = new SajuProfileService();
    const profiles = await sajuProfileService.getUsersByElement(element, limit);
    
    return res.status(200).json({
      count: profiles.length,
      profiles
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 利用可能な都市のリストを取得するコントローラー
 * 出生地として指定可能な都市のリストを提供
 * 注: このエンドポイントは認証が不要です（フォーム入力時に使用するため）
 */
export const getAvailableCities = async (req: Request, res: Response) => {
  try {
    const sajuEngineService = new SajuEngineService();
    const cities = sajuEngineService.getAvailableCities();
    
    // Enable CORS for these public endpoints
    res.set('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      cities
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 都市名から座標情報を取得するコントローラー
 * 指定された都市の地理座標（経度・緯度）を提供
 * 注: このエンドポイントは認証が不要です（フォーム入力時に使用するため）
 */
export const getCityCoordinates = async (req: Request, res: Response) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName) {
      throw new ValidationError('都市名は必須です');
    }
    
    const sajuEngineService = new SajuEngineService();
    const coordinates = sajuEngineService.getCityCoordinates(decodeURIComponent(cityName));
    
    if (!coordinates) {
      throw new NotFoundError('指定された都市の座標が見つかりません');
    }
    
    // Enable CORS for these public endpoints
    res.set('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      cityName: decodeURIComponent(cityName),
      coordinates,
      success: true
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: error.message,
        success: false
      });
    }
    return handleError(error, res);
  }
};

/**
 * 座標から地方時オフセットを計算するコントローラー
 * 経度・緯度から地方時オフセット（分単位）を計算
 * 注: このエンドポイントは認証が不要です（フォーム入力時に使用するため）
 */
export const calculateLocalTimeOffset = async (req: Request, res: Response) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || typeof coordinates !== 'object') {
      throw new ValidationError('座標情報が無効です');
    }
    
    if (
      typeof coordinates.longitude !== 'number' || 
      typeof coordinates.latitude !== 'number' ||
      coordinates.longitude < -180 || 
      coordinates.longitude > 180 ||
      coordinates.latitude < -90 || 
      coordinates.latitude > 90
    ) {
      throw new ValidationError('無効な座標値です。経度: -180〜180、緯度: -90〜90の範囲で指定してください');
    }
    
    const sajuEngineService = new SajuEngineService();
    const offsetMinutes = sajuEngineService.calculateLocalTimeOffset(coordinates);
    
    // Enable CORS for these public endpoints
    res.set('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      coordinates,
      offsetMinutes,
      success: true
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        success: false
      });
    }
    return handleError(error, res);
  }
};