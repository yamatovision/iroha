import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Autocomplete, CircularProgress, Alert, Divider, Collapse, IconButton } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimezoneSelector from './TimezoneSelector';
import { ExtendedLocation, TimezoneAdjustmentInfo } from '@shared/index';
import dayPillarService from '../../services/day-pillar.service';

interface InternationalLocationFormProps {
  value: ExtendedLocation | null;
  onChange: (location: ExtendedLocation) => void;
  timezoneInfo?: TimezoneAdjustmentInfo;
  onTimezoneInfoChange?: (info: TimezoneAdjustmentInfo) => void;
}

const countries = [
  '日本', '韓国', '中国', '台湾', 'シンガポール', 'タイ', 'ベトナム', 'インドネシア',
  'インド', 'アメリカ', 'カナダ', 'イギリス', 'フランス', 'ドイツ', 'イタリア', 'スペイン',
  'ロシア', 'オーストラリア', 'ニュージーランド'
];

const InternationalLocationForm: React.FC<InternationalLocationFormProps> = ({ 
  value, 
  onChange, 
  timezoneInfo,
  onTimezoneInfoChange
}) => {
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 初期値がない場合はデフォルト値を設定
  const locationValue = value || {
    name: '',
    country: '日本',
    coordinates: { longitude: 139.6917, latitude: 35.6895 },
    timeZone: 'Asia/Tokyo'
  };
  
  // 都市リストの取得
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const cityList = await dayPillarService.getAvailableCities();
        setCities(cityList);
      } catch (error) {
        console.error('都市リストの取得に失敗しました:', error);
        // フォールバック都市リスト
        setCities(['東京', '大阪', '名古屋', '札幌', '福岡', 'ソウル', '北京', 'ニューヨーク', 'ロンドン', 'パリ', 'シドニー']);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, []);
  
  // 都市が選択されたときの処理
  const handleCitySelect = async (cityName: string | null) => {
    if (!cityName) return;
    
    try {
      // タイムゾーン情報を取得
      const tzInfo = await dayPillarService.getTimezoneInfo(cityName);
      
      if (tzInfo && tzInfo.politicalTimeZone) {
        // 座標情報があれば更新
        const newLocation = {
          ...locationValue,
          name: cityName,
          timeZone: tzInfo.politicalTimeZone
        };
        
        // 座標情報も更新
        if ('coordinates' in tzInfo && tzInfo.coordinates && 
            typeof tzInfo.coordinates === 'object' && 
            'longitude' in tzInfo.coordinates && 
            'latitude' in tzInfo.coordinates) {
          newLocation.coordinates = {
            longitude: Number(tzInfo.coordinates.longitude),
            latitude: Number(tzInfo.coordinates.latitude)
          };
        }
        
        onChange(newLocation);
        
        // タイムゾーン情報コールバックがあれば呼び出す
        if (onTimezoneInfoChange) {
          onTimezoneInfoChange(tzInfo);
        }
      }
    } catch (error) {
      console.error('タイムゾーン情報取得エラー:', error);
    }
  };
  
  // タイムゾーン変更時の処理
  const handleTimezoneChange = (timezone: string | null) => {
    onChange({
      ...locationValue,
      timeZone: timezone || undefined
    });
  };
  
  // 国変更時の処理
  const handleCountryChange = (country: string | null) => {
    onChange({
      ...locationValue,
      country: country || undefined
    });
  };
  
  // 座標変更時の処理
  const handleCoordinateChange = (type: 'longitude' | 'latitude', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    // 範囲チェック
    if (type === 'longitude' && (numValue < -180 || numValue > 180)) return;
    if (type === 'latitude' && (numValue < -90 || numValue > 90)) return;
    
    const newCoordinates = { ...locationValue.coordinates, [type]: numValue };
    onChange({
      ...locationValue,
      coordinates: newCoordinates
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={countries}
            value={locationValue.country || null}
            onChange={(_, newValue) => handleCountryChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="国"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <PublicIcon color="action" sx={{ ml: 0.5, mr: -0.5 }} />
                  ),
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={cities}
            value={locationValue.name || null}
            onChange={(_, newValue) => handleCitySelect(newValue)}
            loading={loadingCities}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                label="都市"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <LocationOnIcon color="action" sx={{ ml: 0.5, mr: -0.5 }} />
                  ),
                  endAdornment: (
                    <>
                      {loadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TimezoneSelector
            value={locationValue.timeZone || null}
            onChange={handleTimezoneChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Divider sx={{ flex: 1, mr: 1 }} />
            <IconButton 
              size="small" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{ color: 'text.secondary' }}
            >
              {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Divider sx={{ flex: 1, ml: 1 }} />
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Collapse in={showAdvanced}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="経度"
                  value={locationValue.coordinates.longitude.toString()}
                  onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                  type="number"
                  inputProps={{ step: 0.0001, min: -180, max: 180 }}
                  fullWidth
                  helperText="東経は正の値、西経は負の値（-180°〜180°）"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="緯度"
                  value={locationValue.coordinates.latitude.toString()}
                  onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                  type="number"
                  inputProps={{ step: 0.0001, min: -90, max: 90 }}
                  fullWidth
                  helperText="北緯は正の値、南緯は負の値（-90°〜90°）"
                />
              </Grid>
              
              {timezoneInfo && timezoneInfo.adjustmentDetails && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Box>
                      <strong>調整情報:</strong> 合計調整 {timezoneInfo.adjustmentDetails.totalAdjustmentMinutes}分
                      {timezoneInfo.isDST && " (サマータイム適用中)"}
                    </Box>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InternationalLocationForm;