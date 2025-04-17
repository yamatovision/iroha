/**
 * タイムゾーンAPIのテスト用シンプルサーバー
 */
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8090;

// CORS設定
app.use(cors());
app.use(express.json());

// タイムゾーン情報を取得するエンドポイント
app.get('/api/v1/day-pillars/timezone-info', (req, res) => {
  const { location } = req.query;
  
  if (!location) {
    return res.status(400).json({ error: '位置情報（都市名または座標）は必須です' });
  }
  
  // シンプルなテスト実装
  let locationStr = location;
  
  // シンプルなテスト実装（実際の値はSajuEngineのロジックによって計算）
  let result = {
    useInternationalMode: true,
    politicalTimeZone: 'Asia/Tokyo',
    isDST: false,
    timeZoneOffsetMinutes: 540,
    timeZoneOffsetSeconds: 540 * 60,
    location: {
      name: locationStr.includes('{') ? 'Custom Location' : locationStr,
      coordinates: { longitude: 139.6917, latitude: 35.6895 },
      timeZone: 'Asia/Tokyo'
    }
  };
  
  // 都市名に応じてデータを調整
  if (locationStr === 'New York') {
    result.politicalTimeZone = 'America/New_York';
    result.timeZoneOffsetMinutes = -300;
    result.location.coordinates = { longitude: -74.0060, latitude: 40.7128 };
  } else if (locationStr === 'London') {
    result.politicalTimeZone = 'Europe/London';
    result.timeZoneOffsetMinutes = 60;
    result.isDST = true;
    result.location.coordinates = { longitude: -0.1278, latitude: 51.5074 };
  } else if (locationStr === 'Sydney') {
    result.politicalTimeZone = 'Australia/Sydney';
    result.timeZoneOffsetMinutes = 600;
    result.location.coordinates = { longitude: 151.2093, latitude: -33.8688 };
  } else if (locationStr === 'Paris') {
    result.politicalTimeZone = 'Europe/Paris';
    result.timeZoneOffsetMinutes = 120;
    result.isDST = true;
    result.location.coordinates = { longitude: 2.3522, latitude: 48.8566 };
  }
  
  // 座標オブジェクトとして渡された場合
  if (locationStr.includes('{') && locationStr.includes('longitude')) {
    try {
      const parsedLocation = JSON.parse(locationStr);
      if (parsedLocation.longitude && parsedLocation.latitude) {
        result.location.coordinates = {
          longitude: Number(parsedLocation.longitude),
          latitude: Number(parsedLocation.latitude)
        };
      }
    } catch (e) {
      // パースエラーは無視
    }
  }
  
  return res.status(200).json(result);
});

// 利用可能な都市リストを取得するエンドポイント
app.get('/api/v1/day-pillars/available-cities', (req, res) => {
  // テスト用の簡易実装
  const cities = [
    'Tokyo', 'Osaka', 'Nagoya', 'Fukuoka', 'Sapporo', 
    'New York', 'London', 'Paris', 'Berlin', 'Rome', 
    'Sydney', 'Melbourne', 'Beijing', 'Shanghai', 'Hong Kong', 
    'Seoul', 'Singapore', 'Bangkok', 'Dubai', 'Mumbai',
    'Cairo', 'Cape Town', 'Moscow', 'Istanbul', 'Rio de Janeiro',
    'Mexico City', 'Buenos Aires', 'Toronto', 'Vancouver', 'Chicago'
  ];
  
  return res.status(200).json({
    count: cities.length,
    cities
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`テストサーバーが起動しました: http://localhost:${PORT}`);
});