import { Request, Response } from 'express';
import { AuthRequest, UserRole } from '../middleware/auth.middleware';
import { SajuEngineService } from '../services/saju-engine.service';
import { handleError, ValidationError, AuthenticationError } from '../utils';
import { ExtendedLocation } from '../types';

/**
 * 現在の日柱情報を取得するコントローラー
 */
export const getTodayDayPillar = async (req: Request, res: Response) => {
  try {
    const sajuEngineService = new SajuEngineService();
    const dayPillar = sajuEngineService.getCurrentDayPillar();
    
    return res.status(200).json(dayPillar);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 特定の日付の日柱情報を取得するコントローラー
 */
export const getDayPillarByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      throw new ValidationError('日付は必須です');
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('無効な日付フォーマットです');
    }
    
    const sajuEngineService = new SajuEngineService();
    const dayPillar = sajuEngineService.getDayPillarByDate(parsedDate);
    
    return res.status(200).json(dayPillar);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 日付範囲の日柱情報を取得するコントローラー
 * 管理者用機能
 */
export const getDayPillarRange = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    // 管理者権限チェック
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ValidationError('管理者権限が必要です');
    }
    
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new ValidationError('開始日と終了日は必須です');
    }
    
    const parsedStartDate = new Date(startDate as string);
    const parsedEndDate = new Date(endDate as string);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new ValidationError('無効な日付フォーマットです');
    }
    
    // 日付範囲のチェック
    if (parsedEndDate < parsedStartDate) {
      throw new ValidationError('終了日は開始日より後である必要があります');
    }
    
    // 範囲が広すぎないかチェック（例：最大30日まで）
    const dayDifference = Math.ceil((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDifference > 30) {
      throw new ValidationError('日付範囲は最大30日までです');
    }
    
    const sajuEngineService = new SajuEngineService();
    
    // 指定された日付範囲の日柱情報を取得
    const dayPillars = [];
    let currentDate = new Date(parsedStartDate);
    
    while (currentDate <= parsedEndDate) {
      dayPillars.push(sajuEngineService.getDayPillarByDate(new Date(currentDate)));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return res.status(200).json({
      count: dayPillars.length,
      dayPillars
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * タイムゾーン情報を取得するコントローラー（簡略版）
 */
export const getTimezoneInfo = async (req: Request, res: Response) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      throw new ValidationError('位置情報（都道府県名または「海外」）は必須です');
    }
    
    // 文字列に強制変換
    const locationName = Array.isArray(location) ? String(location[0]) : String(location);
    
    // SajuEngineServiceを初期化
    const sajuEngineService = new SajuEngineService({
      useInternationalMode: true
    });
    
    // SimplifiedTimeZoneManagerを使用して調整値を取得
    const result = sajuEngineService.getTimezoneInfo(locationName);
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 利用可能な出生地リスト（都道府県と海外）を取得するコントローラー
 */
export const getAvailableCities = async (req: Request, res: Response) => {
  try {
    // SajuEngineServiceを初期化
    const sajuEngineService = new SajuEngineService({
      useInternationalMode: true
    });
    
    // SimplifiedTimeZoneManagerを使用して場所情報を取得
    const locationsWithInfo = sajuEngineService.getAllLocationsWithInfo();
    const categories = sajuEngineService.getLocationCategories();
    
    // クライアント側の互換性を維持するため、既存のcitiesも返す
    const cities = sajuEngineService.getAvailableCities();
    
    console.log('デバッグ: 利用可能な都道府県', {
      locationsWithInfoLength: locationsWithInfo.length,
      locationsWithInfoSample: locationsWithInfo.slice(0, 3),
      categories,
      citiesLength: cities.length,
      citiesSample: cities.slice(0, 3)
    });
    
    // ハードコードされた都道府県リスト（緊急対応）
    if (!locationsWithInfo || locationsWithInfo.length === 0) {
      console.log('デバッグ: locationsWithInfoが空のため、ハードコードされたデータを使用します');
      const prefectures = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
      ];
      
      const adjustments: Record<string, number> = {
        '北海道': 25, '青森県': 23, '岩手県': 21, '宮城県': 20, '秋田県': 19, '山形県': 19,
        '福島県': 18, '茨城県': 19, '栃木県': 19, '群馬県': 18, '埼玉県': 19, '千葉県': 19,
        '東京都': 19, '神奈川県': 19, '新潟県': 17, '富山県': 15, '石川県': 14, '福井県': 13,
        '山梨県': 17, '長野県': 16, '岐阜県': 12, '静岡県': 15, '愛知県': 8, '三重県': 6,
        '滋賀県': 4, '京都府': 3, '大阪府': 2, '兵庫県': 1, '奈良県': 3, '和歌山県': 0,
        '鳥取県': -3, '島根県': -6, '岡山県': -4, '広島県': -8, '山口県': -12, '徳島県': -1,
        '香川県': -2, '愛媛県': -7, '高知県': -5, '福岡県': -18, '佐賀県': -20, '長崎県': -21,
        '熊本県': -19, '大分県': -16, '宮崎県': -14, '鹿児島県': -19, '沖縄県': -31, '海外': 0
      };
      
      const hardcodedLocations = [...prefectures, '海外'].map(locationName => {
        const adjustment = adjustments[locationName] || 0;
        const isOverseas = locationName === '海外';
        const description = isOverseas 
          ? '海外の場合は現地時間をそのまま入力してください' 
          : `${locationName}: ${adjustment >= 0 ? '+' : ''}${adjustment}分`;
        
        return {
          name: locationName,
          adjustment,
          description,
          isOverseas
        };
      });
      
      return res.status(200).json({
        count: hardcodedLocations.length,
        cities, // 互換性のために維持
        locations: hardcodedLocations,
        categories: {
          prefectures,
          overseas: ['海外']
        }
      });
    }
    
    return res.status(200).json({
      count: locationsWithInfo.length,
      cities, // 互換性のために維持
      locations: locationsWithInfo,
      categories
    });
  } catch (error) {
    console.error('getAvailableCities エラー:', error);
    return handleError(error, res);
  }
};