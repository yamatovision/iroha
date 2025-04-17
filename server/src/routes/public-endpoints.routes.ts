import { Router } from 'express';
import { Request, Response } from 'express';
import { SajuEngineService } from '../services/saju-engine.service';
import { handleError, ValidationError, NotFoundError } from '../utils';

/**
 * 公開APIルーター
 * 認証なしでアクセス可能なエンドポイントを提供
 */
const router = Router();

/**
 * @swagger
 * /api/v1/public/saju/available-cities:
 *   get:
 *     summary: 利用可能な都市のリストを取得
 *     description: 出生地として指定可能な都市のリストを取得します
 *     tags: [PublicAPI]
 *     responses:
 *       200:
 *         description: 利用可能な都市のリスト
 */
router.get('/saju/available-cities', async (req: Request, res: Response) => {
  try {
    const sajuEngineService = new SajuEngineService();
    const cities = sajuEngineService.getAvailableCities();
    
    return res.status(200).json({
      cities
    });
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @swagger
 * /api/v1/public/saju/city-coordinates/{cityName}:
 *   get:
 *     summary: 都市名から座標情報を取得
 *     description: 指定された都市名の地理座標（経度・緯度）を取得します
 *     tags: [PublicAPI]
 *     parameters:
 *       - in: path
 *         name: cityName
 *         required: true
 *         schema:
 *           type: string
 *         description: 都市名（URLエンコードが必要）
 *     responses:
 *       200:
 *         description: 都市の座標情報
 *       404:
 *         description: 指定された都市の座標が見つかりません
 */
router.get('/saju/city-coordinates/:cityName', async (req: Request, res: Response) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName) {
      throw new ValidationError('都市名は必須です');
    }
    
    // URLからデコード
    const decodedCityName = decodeURIComponent(cityName);
    console.log(`都市名座標検索: ${decodedCityName}`);
    
    const sajuEngineService = new SajuEngineService();
    const coordinates = sajuEngineService.getCityCoordinates(decodedCityName);
    
    // フォールバック実装により、常に座標を返す
    return res.status(200).json({
      cityName: decodedCityName,
      coordinates,
      success: true
    });
  } catch (error) {
    console.error('都市座標取得エラー:', error);
    return handleError(error, res);
  }
});

/**
 * @swagger
 * /api/v1/public/saju/local-time-offset:
 *   post:
 *     summary: 座標から地方時オフセットを計算
 *     description: 地理座標（経度・緯度）から地方時オフセット（分単位）を計算します
 *     tags: [PublicAPI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coordinates
 *             properties:
 *               coordinates:
 *                 type: object
 *                 required:
 *                   - longitude
 *                   - latitude
 *                 properties:
 *                   longitude:
 *                     type: number
 *                     description: 経度（-180〜180）
 *                   latitude:
 *                     type: number
 *                     description: 緯度（-90〜90）
 *     responses:
 *       200:
 *         description: 地方時オフセット情報
 *       400:
 *         description: 無効な座標値
 */
router.post('/saju/local-time-offset', async (req: Request, res: Response) => {
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
});

export default router;