/**
 * DateTimeProcessor国際対応版テスト
 */
import { DateTimeProcessor } from '../DateTimeProcessor';
import { TimeZoneUtils } from '../TimeZoneUtils';

describe('DateTimeProcessor国際対応版', () => {
  let processor: DateTimeProcessor;
  
  beforeEach(() => {
    processor = new DateTimeProcessor({
      useLocalTime: true,
      useDST: true,
      useHistoricalDST: true,
      useStandardTimeZone: true,
      useSecondsPrecision: true
    });
  });
  
  // 基本機能テスト
  test('基本的な日時処理', () => {
    const date = new Date(2000, 0, 1, 12, 30, 0); // 2000年1月1日12:30
    const result = processor.processDateTime(date, 12.5);
    
    // 基本データの確認
    expect(result.originalDate).toEqual(date);
    expect(result.simpleDate).toEqual({
      year: 2000,
      month: 1,
      day: 1,
      hour: 12,
      minute: 30,
      second: 0
    });
    
    // 調整済み日時
    expect(result.adjustedDate.year).toBe(2000);
    expect(result.adjustedDate.month).toBe(1);
    expect(result.adjustedDate.day).toBe(1);
    
    // タイムゾーン情報
    expect(result.politicalTimeZone).toBeDefined();
    expect(result.timeZoneOffsetMinutes).toBeDefined();
    expect(result.isDST).toBeDefined();
    
    // 調整詳細
    expect(result.adjustmentDetails).toBeDefined();
    expect(result.adjustmentDetails?.politicalTimeZoneAdjustment).toBeDefined();
    expect(result.adjustmentDetails?.longitudeBasedAdjustment).toBeDefined();
    expect(result.adjustmentDetails?.regionalAdjustment).toBeDefined();
    expect(result.adjustmentDetails?.dstAdjustment).toBeDefined();
  });
  
  // 都市名での検索
  test('都市名による地方時調整', () => {
    const date = new Date(2000, 0, 1, 12, 0, 0);
    
    // 東京: +18分の特殊調整
    const tokyoResult = processor.processDateTime(date, 12, '東京');
    expect(tokyoResult.adjustmentDetails?.regionalAdjustment).toBe(18);
    expect(tokyoResult.adjustedDate.hour).toBe(12);
    expect(tokyoResult.adjustedDate.minute).toBe(18);
    
    // ソウル: -32分の特殊調整
    const seoulResult = processor.processDateTime(date, 12, 'ソウル');
    expect(seoulResult.adjustmentDetails?.regionalAdjustment).toBe(-32);
    expect(seoulResult.adjustedDate.hour).toBe(11);
    expect(seoulResult.adjustedDate.minute).toBe(28);
    
    // ニューヨーク: 経度ベースの調整
    const nyResult = processor.processDateTime(date, 12, 'ニューヨーク');
    expect(nyResult.politicalTimeZone).toBe('America/New_York');
  });
  
  // 座標による地方時調整
  test('座標による地方時調整', () => {
    const date = new Date(2000, 0, 1, 12, 0, 0);
    
    // 東京の座標
    const tokyoCoords = { longitude: 139.6917, latitude: 35.6895 };
    const tokyoResult = processor.processDateTime(date, 12, tokyoCoords);
    expect(tokyoResult.adjustmentDetails?.regionalAdjustment).toBe(18);
    
    // 経度に基づく計算例（西経45度 ≈ -120分）
    const westCoords = { longitude: 90, latitude: 45 };
    const westResult = processor.processDateTime(date, 12, westCoords);
    expect(westResult.adjustmentDetails?.longitudeBasedAdjustment).toBe(-180);
  });
  
  // ExtendedLocationでの指定
  test('拡張ロケーション情報', () => {
    const date = new Date(2000, 0, 1, 12, 0, 0);
    
    // 明示的にタイムゾーンを指定
    const customLocation = {
      name: "カスタム都市",
      country: "カスタム国",
      coordinates: { longitude: 139.6917, latitude: 35.6895 },
      timeZone: "Asia/Tokyo"
    };
    
    const result = processor.processDateTime(date, 12, customLocation);
    expect(result.politicalTimeZone).toBe('Asia/Tokyo');
    expect(result.adjustmentDetails?.regionalAdjustment).toBe(18);
  });
  
  // 歴史的サマータイム
  test('日本の歴史的サマータイム', () => {
    // 1948年のサマータイム期間内
    const dstDate = new Date(1948, 5, 1, 12, 0, 0); // 1948年6月1日
    const dstResult = processor.processDateTime(dstDate, 12, '東京');
    
    expect(dstResult.isDST).toBe(true);
    expect(dstResult.adjustmentDetails?.dstAdjustment).toBe(-60); // -1時間
    
    // サマータイムが適用済み時刻を確認
    expect(dstResult.adjustedDate.hour).toBe(11); // 12時 - 1時間(DST)
    
    // サマータイム期間外
    const nonDstDate = new Date(1947, 5, 1, 12, 0, 0); // 1947年6月1日
    const nonDstResult = processor.processDateTime(nonDstDate, 12, '東京');
    
    expect(nonDstResult.isDST).toBe(false);
    expect(nonDstResult.adjustmentDetails?.dstAdjustment).toBe(0);
    expect(nonDstResult.adjustedDate.hour).toBe(12);
  });
  
  // オプション制御テスト
  test('オプションによる機能制御', () => {
    const date = new Date(2000, 0, 1, 12, 0, 0);
    const tokyoCoords = { longitude: 139.6917, latitude: 35.6895 };
    
    // すべての機能を無効化
    const minimalProcessor = new DateTimeProcessor({
      useLocalTime: false,
      useDST: false,
      useHistoricalDST: false,
      useStandardTimeZone: false,
      useSecondsPrecision: false
    });
    
    const minimalResult = minimalProcessor.processDateTime(date, 12, tokyoCoords);
    
    // 地方時調整無効時は調整なし
    expect(minimalResult.adjustmentDetails?.regionalAdjustment).toBe(0);
    expect(minimalResult.adjustmentDetails?.totalAdjustmentMinutes).toBe(0);
    expect(minimalResult.adjustedDate.hour).toBe(12);
    expect(minimalResult.adjustedDate.minute).toBe(0);
    
    // オプション更新
    minimalProcessor.updateOptions({ useLocalTime: true });
    const updatedResult = minimalProcessor.processDateTime(date, 12, tokyoCoords);
    
    // 地方時調整のみ有効化した場合
    expect(updatedResult.adjustmentDetails?.regionalAdjustment).toBe(18);
    expect(updatedResult.adjustedDate.minute).toBe(18);
  });
  
  // 秒の調整テスト
  test('秒単位の精度', () => {
    // 秒の丸め処理を確認
    const date1 = new Date(2000, 0, 1, 12, 30, 29); // 29秒 -> 切り捨て
    const result1 = processor.processDateTime(date1, 12.5);
    
    expect(result1.adjustedDate.second).toBe(0);
    expect(result1.adjustedDate.minute).toBe(30);
    
    const date2 = new Date(2000, 0, 1, 12, 30, 30); // 30秒 -> 切り上げ
    const result2 = processor.processDateTime(date2, 12.5);
    
    expect(result2.adjustedDate.second).toBe(0);
    expect(result2.adjustedDate.minute).toBe(31);
  });
  
  // 国際的な日付変更のテスト
  test('国際的なタイムゾーン変換', () => {
    // アメリカと日本の時差テスト（約14時間）
    const nyDate = new Date(2000, 0, 1, 12, 0, 0); // NYの正午
    
    // ニューヨークの正午を日本時間で計算
    const nyProcessor = new DateTimeProcessor({
      useLocalTime: true,
      useStandardTimeZone: true
    });
    
    const nyToJpResult = nyProcessor.processDateTime(nyDate, 12, 'ニューヨーク');
    
    // 政治的タイムゾーンを確認
    expect(nyToJpResult.politicalTimeZone).toBe('America/New_York');
    
    // 日本での計算（日付が変わる場合）
    const jpDate = new Date(2000, 0, 1, 12, 0, 0); // 日本の正午
    const jpToNyResult = processor.processDateTime(jpDate, 12, {
      coordinates: { longitude: -74.0060, latitude: 40.7128 },
      timeZone: 'America/New_York'
    });
    
    // タイムゾーンの確認
    expect(jpToNyResult.politicalTimeZone).toBe('America/New_York');
  });
  
  // 都市データの取得
  test('都市データ取得', () => {
    // 利用可能な都市リスト取得
    const cities = processor.getAvailableCities();
    expect(cities.length).toBeGreaterThan(10);
    expect(cities).toContain('東京');
    expect(cities).toContain('ニューヨーク');
    
    // 都市の座標取得
    const tokyoCoords = processor.getCityCoordinates('東京');
    expect(tokyoCoords).toBeDefined();
    expect(tokyoCoords?.longitude).toBeCloseTo(139.69, 1);
    expect(tokyoCoords?.latitude).toBeCloseTo(35.68, 1);
    
    // 英語名でも取得可能
    const nyCoords = processor.getCityCoordinates('New York');
    expect(nyCoords).toBeDefined();
    
    // 存在しない都市
    expect(processor.getCityCoordinates('存在しない都市')).toBeUndefined();
  });
});