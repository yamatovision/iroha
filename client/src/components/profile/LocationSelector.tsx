import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Box, 
  Typography, 
  Tooltip, 
  Chip,
  CircularProgress 
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import dayPillarService, { LocationInfo, LocationCategories } from '../../services/day-pillar.service';

interface LocationSelectorProps {
  value: string | null;
  onChange: (location: string | null, locationInfo?: LocationInfo) => void;
  error?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange, error }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [categories, setCategories] = useState<LocationCategories | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);

  // API から場所情報を取得
  useEffect(() => {
    const fetchLocations = async () => {
      console.log('LocationSelector: 場所情報の取得を開始します');
      setLoading(true);
      try {
        // API呼び出し
        console.log('LocationSelector: dayPillarService.getLocationsWithInfo()を呼び出します');
        const response = await dayPillarService.getLocationsWithInfo();
        
        // レスポンスの詳細ログ
        console.log('LocationSelector: APIレスポンス全体:', response);
        console.log('LocationSelector: locations配列:', response.locations);
        console.log('LocationSelector: categories:', response.categories);
        console.log('LocationSelector: citiesリスト:', response.cities);
        console.log('LocationSelector: 件数:', response.count);
        
        if (response.locations && response.locations.length > 0) {
          console.log(`LocationSelector: ${response.locations.length}件の場所情報をセットします`);
          setLocations(response.locations);
        } else {
          console.warn('LocationSelector: locationsが空またはundefinedです');
        }
        
        if (response.categories) {
          console.log('LocationSelector: カテゴリ情報をセットします:', response.categories);
          setCategories(response.categories);
        } else {
          console.warn('LocationSelector: categoriesがundefinedです');
        }
        
        // 現在選択されている場所の詳細情報を設定
        if (value && response.locations) {
          console.log(`LocationSelector: 現在選択中の場所「${value}」の詳細情報を探しています`);
          const locationInfo = response.locations.find(loc => loc.name === value);
          if (locationInfo) {
            console.log('LocationSelector: 選択中の場所の詳細情報:', locationInfo);
            setSelectedLocation(locationInfo);
          } else {
            console.warn(`LocationSelector: 選択中の場所「${value}」の詳細情報が見つかりませんでした`);
          }
        }
      } catch (error) {
        console.error('LocationSelector: 場所情報の取得に失敗しました:', error);
      } finally {
        setLoading(false);
        console.log('LocationSelector: 場所情報の取得が完了しました');
        // 最終的な状態のログ - 注意：stateは非同期更新のため、ここでは更新前の値が表示される
        console.log('LocationSelector: 最終的な状態 - locations:', locations);
        console.log('LocationSelector: 最終的な状態 - categories:', categories);
      }
    };
    
    fetchLocations();
    
    // コンポーネントのマウント時（初回レンダリング時）のみAPIを呼び出す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 場所選択時の処理
  const handleLocationChange = (_: React.SyntheticEvent, newValue: string | null) => {
    console.log('LocationSelector: handleLocationChange - 選択された値:', newValue);
    console.log('LocationSelector: handleLocationChange - 現在のlocations:', locations);
    
    if (newValue) {
      const locationInfo = locations.find(loc => loc.name === newValue);
      console.log('LocationSelector: handleLocationChange - 見つかった場所情報:', locationInfo);
      
      if (locationInfo) {
        setSelectedLocation(locationInfo);
        onChange(newValue, locationInfo);
      } else {
        console.warn(`LocationSelector: "${newValue}"の場所情報が見つかりません。ダミーデータを使用します。`);
        // APIからデータを取得できていない場合のフォールバック
        const dummyInfo: LocationInfo = {
          name: newValue,
          adjustment: newValue === '海外' ? 0 : 19, // 東京都のデフォルト値
          description: newValue === '海外' ? '海外の場合は現地時間をそのまま入力してください' : `${newValue}: +19分`,
          isOverseas: newValue === '海外'
        };
        setSelectedLocation(dummyInfo);
        onChange(newValue, dummyInfo);
      }
    } else {
      setSelectedLocation(null);
      onChange(null);
    }
  };

  // 場所をカテゴリでグループ化
  const groupByCategory = (option: string) => {
    if (!categories) return '';
    
    if (categories.prefectures.includes(option)) {
      return '都道府県';
    } else if (categories.overseas.includes(option)) {
      return '海外';
    }
    return '';
  };

  // 表示オプションをカスタマイズ
  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: string) => {
    const locationInfo = locations.find(loc => loc.name === option);
    const isOverseas = locationInfo?.isOverseas;
    
    return (
      <li {...props}>
        <LocationOnIcon 
          fontSize="small" 
          sx={{ 
            mr: 1, 
            color: isOverseas ? 'info.main' : 'primary.light' 
          }} 
        />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2">{option}</Typography>
          {locationInfo && (
            <Typography variant="caption" color="text.secondary">
              {locationInfo.description}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  // コンポーネントの状態をレンダリング前に確認
  useEffect(() => {
    console.log('LocationSelector: レンダリング前の状態 - locations:', locations);
    console.log('LocationSelector: レンダリング前の状態 - loading:', loading);
    console.log('LocationSelector: 現在の選択値:', value);
  });

  // valueがnullまたはundefinedの場合の処理
  useEffect(() => {
    // API取得後、valueが未設定なら「東京都」をデフォルト値として通知
    if (!loading && locations.length > 0 && !value) {
      console.log('LocationSelector: 初期値を「東京都」に設定します');
      handleLocationChange({} as React.SyntheticEvent<Element, Event>, '東京都');
    }
  }, [loading, locations, value]);
  
  // 選択値の正規化（nullやundefinedの場合は空文字に）
  const normalizedValue = value || '';
  
  // 選択肢リストを構築（APIデータがない場合はデフォルト値を使用）
  const defaultOptions = ['東京都', '大阪府', '愛知県', '福岡県', '北海道', '海外'];
  const options = locations.length > 0 
    ? locations.map(loc => loc.name) 
    : defaultOptions;
  
  console.log('LocationSelector: 選択肢リスト:', options);

  return (
    <Box>
      <Autocomplete
        options={options}
        value={normalizedValue}
        onChange={handleLocationChange}
        loading={loading}
        groupBy={groupByCategory}
        noOptionsText="選択肢がありません"
        loadingText="読み込み中..."
        renderOption={renderOption}
        isOptionEqualToValue={(option, value) => option === value}
        disablePortal
        forcePopupIcon
        renderInput={(params) => (
          <TextField
            {...params}
            label="出生地"
            error={!!error}
            helperText={error || "出生地を選択してください"}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <LocationOnIcon color="action" sx={{ ml: 0.5, mr: -0.5 }} />
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      
      {selectedLocation && (
        <Box sx={{ mt: 1 }}>
          {selectedLocation.isOverseas ? (
            <Tooltip title="海外の場合は現地時間をそのまま入力してください。時差調整は行われません。">
              <Chip
                icon={<LocationOnIcon />}
                label="海外：現地時間をそのまま入力"
                color="info"
                variant="outlined"
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="日本国内の場所は経度に基づく時差調整が適用されます">
              <Chip
                icon={<LocationOnIcon />}
                label={`地方時調整: ${selectedLocation.adjustment >= 0 ? '+' : ''}${selectedLocation.adjustment}分`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LocationSelector;