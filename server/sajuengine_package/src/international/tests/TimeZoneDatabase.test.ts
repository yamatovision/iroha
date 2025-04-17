/**
 * TimeZoneDatabase テスト
 */
import { TimeZoneDatabase } from '../TimeZoneDatabase';

describe('TimeZoneDatabase', () => {
  let database: TimeZoneDatabase;
  
  beforeEach(() => {
    database = new TimeZoneDatabase();
  });
  
  // 都市検索
  test('都市検索', () => {
    // 完全一致
    const tokyo = database.findCity('東京');
    expect(tokyo).toBeDefined();
    expect(tokyo?.name).toBe('東京');
    expect(tokyo?.country).toBe('日本');
    expect(tokyo?.timezone).toBe('Asia/Tokyo');
    expect(tokyo?.adjustmentMinutes).toBe(18);
    
    // 英語名による検索
    const nyByEnglish = database.findCity('New York');
    expect(nyByEnglish).toBeDefined();
    expect(nyByEnglish?.name).toBe('ニューヨーク');
    
    // 別表記による検索
    const tokyoByAlternative = database.findCity('Tokyo');
    expect(tokyoByAlternative).toBeDefined();
    expect(tokyoByAlternative?.name).toBe('東京');
    
    // 大文字・小文字を区別しない検索
    const londonByLowercase = database.findCity('london');
    expect(londonByLowercase).toBeDefined();
    expect(londonByLowercase?.name).toBe('ロンドン');
    
    // 部分一致
    const osakaByPartial = database.findCity('大阪市');
    expect(osakaByPartial).toBeDefined();
    expect(osakaByPartial?.name).toBe('大阪');
    
    // 見つからない場合
    const notFound = database.findCity('存在しない都市');
    expect(notFound).toBeUndefined();
    
    // 空文字列や未定義の場合
    expect(database.findCity('')).toBeUndefined();
    expect(database.findCity(undefined as any)).toBeUndefined();
  });
  
  // 最も近い都市検索
  test('最も近い都市検索', () => {
    // 東京に近い座標
    const nearTokyo = database.findNearestCity(139.7, 35.7);
    expect(nearTokyo?.name).toBe('東京');
    
    // 大阪に近い座標
    const nearOsaka = database.findNearestCity(135.5, 34.7);
    expect(nearOsaka?.name).toBe('大阪');
    
    // ニューヨークに近い座標
    const nearNY = database.findNearestCity(-74.0, 40.7);
    expect(nearNY?.name).toBe('ニューヨーク');
    
    // 極端な値（南極など）でもエラーにならない
    const extreme = database.findNearestCity(0, -90);
    expect(extreme).toBeDefined();
  });
  
  // スマート検索
  test('スマート検索', () => {
    // 都市名のみ
    const byCity = database.smartSearch('東京');
    expect(byCity.length).toBeGreaterThan(0);
    expect(byCity[0].name).toBe('東京');
    
    // 都市名と国名
    const byCityAndCountry = database.smartSearch('東京 日本');
    expect(byCityAndCountry.length).toBeGreaterThan(0);
    expect(byCityAndCountry[0].name).toBe('東京');
    
    // 部分的な一致
    const byPartial = database.smartSearch('ニューヨーク アメリカ');
    expect(byPartial.length).toBeGreaterThan(0);
    expect(byPartial[0].name).toBe('ニューヨーク');
    
    // 複数の結果
    const multipleResults = database.smartSearch('アメリカ');
    expect(multipleResults.length).toBeGreaterThan(1);
    // すべての結果がアメリカの都市か確認
    expect(multipleResults.every(city => city.country === 'アメリカ合衆国')).toBe(true);
    
    // 一致なし
    const noMatch = database.smartSearch('存在しない都市名');
    expect(noMatch.length).toBe(0);
    
    // 無効な入力
    expect(database.smartSearch('')).toHaveLength(0);
    expect(database.smartSearch('   ')).toHaveLength(0);
  });
  
  // 全都市取得
  test('全都市取得', () => {
    const allCities = database.getAllCities();
    expect(allCities.length).toBeGreaterThan(10); // 十分なデータがあることを確認
    
    // 返される配列がデータベースのコピーであることを確認
    const beforeLength = allCities.length;
    allCities.push({
      name: 'テスト都市',
      nameAlternatives: [],
      country: 'テスト国',
      timezone: 'UTC',
      coordinates: { longitude: 0, latitude: 0 }
    });
    
    // 元のデータベースは変更されていないはず
    const newAllCities = database.getAllCities();
    expect(newAllCities.length).toBe(beforeLength);
  });
  
  // 国ごとの都市リスト取得
  test('国ごとの都市リスト取得', () => {
    // 完全一致
    const japanCities = database.getCitiesByCountry('日本');
    expect(japanCities.length).toBeGreaterThan(0);
    expect(japanCities.every(city => city.country === '日本')).toBe(true);
    
    // 部分一致
    const usCities = database.getCitiesByCountry('アメリカ');
    expect(usCities.length).toBeGreaterThan(0);
    expect(usCities.every(city => city.country === 'アメリカ合衆国')).toBe(true);
    
    // 存在しない国
    const nonExistent = database.getCitiesByCountry('存在しない国');
    expect(nonExistent.length).toBe(0);
  });
  
  // タイムゾーンごとの都市リスト取得
  test('タイムゾーンごとの都市リスト取得', () => {
    // 東京タイムゾーンの都市
    const tokyoTzCities = database.getCitiesByTimezone('Asia/Tokyo');
    expect(tokyoTzCities.length).toBeGreaterThan(0);
    expect(tokyoTzCities.every(city => city.timezone === 'Asia/Tokyo')).toBe(true);
    
    // ニューヨークタイムゾーンの都市
    const nyTzCities = database.getCitiesByTimezone('America/New_York');
    expect(nyTzCities.length).toBeGreaterThan(0);
    expect(nyTzCities.every(city => city.timezone === 'America/New_York')).toBe(true);
    
    // 存在しないタイムゾーン
    const nonExistent = database.getCitiesByTimezone('存在しないタイムゾーン');
    expect(nonExistent.length).toBe(0);
  });
});