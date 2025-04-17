import { SAJU, USER, Gender, ISajuProfile, ExtendedLocation, TimezoneAdjustmentInfo } from '@shared/index';
import apiService from './api.service';
// axios は必要なくなったので削除
import dayPillarService from './day-pillar.service';

// 地理座標インターフェース
export interface GeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

interface SajuProfileData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthplaceCoordinates?: GeoCoordinates;
  localTimeOffset?: number;
  gender: Gender;
  timeZone?: string;
  extendedLocation?: ExtendedLocation;
}

// 注: 実際の型定義はshared/index.tsからimportされる ISajuProfile を使用

export class SajuProfileService {
  // 利用可能な都市のリストを取得
  async getAvailableCities(): Promise<string[]> {
    try {
      console.log('都市リスト取得開始 - apiServiceを使用');
      // 本番環境でのベースURL問題を解決するためapiServiceを使用
      const response = await apiService.get(SAJU.GET_AVAILABLE_CITIES);
      console.log('都市リスト取得成功:', response.data);
      return response.data.cities || [];
    } catch (error) {
      console.error('都市リスト取得エラー:', error);
      // エラー時のフォールバックリスト
      console.log('デフォルトの都市リストを使用します');
      return ['東京', '大阪', '名古屋', '札幌', '福岡', 'ソウル', '北京', 'ニューヨーク', 'ロンドン', 'パリ'];
    }
  }
  
  // 都市名から座標情報を取得
  async getCityCoordinates(cityName: string): Promise<GeoCoordinates | null> {
    if (!cityName || cityName.trim().length < 2) {
      console.warn('City name is too short for coordinate lookup');
      return null;
    }
    
    try {
      console.log(`座標取得開始: "${cityName}"`);
      const encodedCityName = encodeURIComponent(cityName.trim());
      // 本番環境でのベースURL問題を解決するためapiServiceを使用
      const response = await apiService.get(SAJU.GET_CITY_COORDINATES(encodedCityName));
      console.log(`"${cityName}"の座標取得成功:`, response.data);
      
      if (response.data && response.data.coordinates) {
        // 座標の範囲を検証
        const { longitude, latitude } = response.data.coordinates;
        
        // 経度: -180 to 180, 緯度: -90 to 90
        if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
          return response.data.coordinates;
        } else {
          console.error('Invalid coordinates received:', response.data.coordinates);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`"${cityName}"の座標取得エラー:`, error);
      return null;
    }
  }
  
  // 地方時オフセットを計算
  async calculateLocalTimeOffset(coordinates: GeoCoordinates): Promise<number> {
    try {
      // 座標の範囲を検証
      if (!coordinates || 
          coordinates.longitude < -180 || coordinates.longitude > 180 || 
          coordinates.latitude < -90 || coordinates.latitude > 90) {
        console.error('Invalid coordinates for local time calculation:', coordinates);
        throw new Error('Invalid coordinates');
      }
      
      console.log('地方時オフセット計算開始:', coordinates);
      // 本番環境でのベースURL問題を解決するためapiServiceを使用
      const response = await apiService.post(SAJU.CALCULATE_LOCAL_TIME_OFFSET, { coordinates });
      
      if (response.data && typeof response.data.offsetMinutes === 'number') {
        console.log(`地方時オフセット計算結果: ${response.data.offsetMinutes}分`);
        return response.data.offsetMinutes;
      } else {
        console.error('Invalid offset minutes in response:', response.data);
        return 0; // デフォルトとして0分（オフセットなし）を返す
      }
    } catch (error) {
      console.error('地方時オフセット計算エラー:', error);
      // エラー時は0分（オフセットなし）を返す
      return 0;
    }
  }

  // ユーザープロフィール変換ユーティリティメソッド
  private convertProfileData(userProfile: any): ISajuProfile {
    // サーバーからのelementProfileを適切に処理
    // サーバーからの値があればそれを使用し、なければデフォルト値を使用
    console.log('サーバーから受け取ったelementProfile:', userProfile.elementProfile);
    
    // サーバーからのelementProfileオブジェクトをログに出力して内容を確認
    if (userProfile.elementProfile) {
      console.log('サーバーからのelementProfile詳細:', {
        wood: userProfile.elementProfile.wood,
        fire: userProfile.elementProfile.fire,
        earth: userProfile.elementProfile.earth,
        metal: userProfile.elementProfile.metal,
        water: userProfile.elementProfile.water
      });
    }
    
    // elementProfileの有効性をチェック
    let validElementProfile = false;
    if (userProfile.elementProfile) {
      const elemValues = [
        userProfile.elementProfile.wood,
        userProfile.elementProfile.fire,
        userProfile.elementProfile.earth,
        userProfile.elementProfile.metal,
        userProfile.elementProfile.water
      ];
      
      // 少なくとも一つの値が数値で、かつ20以外であれば有効とみなす
      validElementProfile = elemValues.some(val => 
        typeof val === 'number' && !isNaN(val) && val !== 20
      );
      
      console.log('elementProfileは有効か:', validElementProfile);
    }
    
    return {
      userId: userProfile.id,
      birthplace: userProfile.birthPlace || '',
      birthplaceCoordinates: userProfile.birthplaceCoordinates,
      localTimeOffset: userProfile.localTimeOffset,
      mainElement: userProfile.elementAttribute || '',
      fourPillars: userProfile.fourPillars || {
        year: { heavenlyStem: '', earthlyBranch: '', heavenlyStemTenGod: '', earthlyBranchTenGod: '', hiddenStems: [] },
        month: { heavenlyStem: '', earthlyBranch: '', heavenlyStemTenGod: '', earthlyBranchTenGod: '', hiddenStems: [] },
        day: { heavenlyStem: '', earthlyBranch: '', heavenlyStemTenGod: '', earthlyBranchTenGod: '', hiddenStems: [] },
        hour: { heavenlyStem: '', earthlyBranch: '', heavenlyStemTenGod: '', earthlyBranchTenGod: '', hiddenStems: [] }
      },
      // 有効なelementProfileがある場合はそれを使用し、なければデフォルト値を使用
      elementProfile: validElementProfile ? userProfile.elementProfile : {
        wood: 0,  // デフォルトは0（データがない場合）
        fire: 0,
        earth: 0,
        metal: 0,
        water: 0
      },
      // 格局情報を追加
      kakukyoku: userProfile.kakukyoku,
      // 用神情報を詳細に追加（喜神・忌神・仇神を含む）
      yojin: userProfile.yojin ? {
        tenGod: userProfile.yojin.tenGod || '',
        element: userProfile.yojin.element || '',
        description: userProfile.yojin.description || '',
        supportElements: userProfile.yojin.supportElements || [],
        kijin: userProfile.yojin.kijin,
        kijin2: userProfile.yojin.kijin2,
        kyujin: userProfile.yojin.kyujin
      } : undefined,
      personalityDescription: userProfile.personalityDescription || '',
      careerAptitude: userProfile.careerAptitude || '',
      createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : new Date(),
      updatedAt: userProfile.updatedAt ? new Date(userProfile.updatedAt) : new Date()
    };
  }
  
  /**
   * タイムゾーン情報を取得
   * @param location 場所情報（都市名または拡張ロケーション情報）
   */
  async getTimezoneInfo(location: string | ExtendedLocation): Promise<TimezoneAdjustmentInfo> {
    try {
      return await dayPillarService.getTimezoneInfo(location);
    } catch (error) {
      console.error('タイムゾーン情報取得エラー:', error);
      return {};
    }
  }

  async createProfile(profileData: SajuProfileData): Promise<ISajuProfile> {
    try {
      // デバッグ情報の追加
      console.group('📊 プロフィール作成API呼び出し');
      console.log('送信データ:', JSON.stringify(profileData, null, 2));
      
      try {
        console.log('🔍 デバッグ: USER 定数を検証', USER);
        console.log('🔍 CALCULATE_SAJU 値:', USER.CALCULATE_SAJU);
        console.log('🔍 現在のブラウザURL:', window.location.href);
      } catch (debugErr) {
        console.error('デバッグ情報収集エラー:', debugErr);
      }
      
      // Step 1: まず生年月日情報を保存
      console.log(`API呼び出し: PUT ${USER.SET_BIRTH_INFO}`);
      console.log('リクエストデータ:', profileData);
      
      // 例外を個別に捕捉して詳細ログを出力
      let birthInfoResponse;
      try {
        birthInfoResponse = await apiService.put(USER.SET_BIRTH_INFO, profileData);
        console.log('生年月日情報の保存成功 ✅');
        console.log('レスポンス:', birthInfoResponse.data);
      } catch (birthInfoError) {
        console.error('生年月日情報の保存失敗 ❌:', birthInfoError);
        console.error('リクエスト詳細:', {
          endpoint: USER.SET_BIRTH_INFO,
          method: 'PUT',
          data: profileData,
          error: birthInfoError
        });
        throw birthInfoError;
      }
      
      console.log('ステップ2へ進みます');
      
      // 緊急対処: ハードコードされたパスを使用
      console.warn('🚨 緊急対処: ハードコードされたパスを使用します');
      const backupPath = '/api/v1/users/calculate-saju';
      
      // Step 2: 四柱推命情報を計算 (バックアップパス)
      console.log(`API呼び出し (バックアップパス): POST ${backupPath}`);
      try {
        const sajuResponse = await apiService.post(backupPath, {});
        console.log('四柱推命計算成功 (バックアップパス) ✅');
        console.log('レスポンス:', sajuResponse.data);
      } catch (sajuError) {
        console.error('四柱推命計算失敗 (バックアップパス) ❌:', sajuError);
      }
      
      // Step 3: 最新のユーザープロフィール情報を取得
      console.log(`API呼び出し: GET ${USER.GET_PROFILE}`);
      const userProfileResponse = await apiService.get(USER.GET_PROFILE);
      console.log('ユーザープロフィール取得成功 ✅');
      console.log('レスポンス:', userProfileResponse.data);
      
      // 変換して返す
      return this.convertProfileData(userProfileResponse.data);
    } catch (error) {
      console.error('四柱推命プロフィール作成エラー:', error);
      console.groupEnd();
      throw error;
    }
  }
  
  // 更新メソッド
  async updateProfile(profileData: SajuProfileData): Promise<ISajuProfile> {
    try {
      console.group('📊 プロフィール更新API呼び出し');
      console.log('送信データ:', JSON.stringify(profileData, null, 2));
      
      // Step 1: まず生年月日情報を更新
      console.log(`API呼び出し: PUT ${USER.SET_BIRTH_INFO}`);
      console.log('リクエストデータ:', profileData);
      
      let birthInfoResponse;
      try {
        birthInfoResponse = await apiService.put(USER.SET_BIRTH_INFO, profileData);
        console.log('生年月日情報の更新成功 ✅');
        console.log('レスポンス:', birthInfoResponse.data);
      } catch (birthInfoError) {
        console.error('生年月日情報の更新失敗 ❌:', birthInfoError);
        console.error('リクエスト詳細:', {
          endpoint: USER.SET_BIRTH_INFO,
          method: 'PUT',
          data: profileData,
          error: birthInfoError
        });
        throw birthInfoError;
      }
      
      // 緊急対処: ハードコードされたパスを使用
      console.warn('🚨 緊急対処: ハードコードされたパスを使用します');
      const backupPath = '/api/v1/users/calculate-saju';
      
      // Step 2: 四柱推命情報を再計算 (バックアップパス)
      console.log(`API呼び出し (バックアップパス): POST ${backupPath}`);
      try {
        const sajuResponse = await apiService.post(backupPath, {});
        console.log('四柱推命再計算成功 (バックアップパス) ✅');
        console.log('レスポンス:', sajuResponse.data);
      } catch (sajuError) {
        console.error('四柱推命再計算失敗 (バックアップパス) ❌:', sajuError);
      }
      
      // Step 3: 最新のユーザープロフィール情報を取得
      console.log(`API呼び出し: GET ${USER.GET_PROFILE}`);
      const userProfileResponse = await apiService.get(USER.GET_PROFILE);
      console.log('ユーザープロフィール取得成功 ✅');
      console.log('レスポンス:', userProfileResponse.data);
      
      // 変換して返す
      return this.convertProfileData(userProfileResponse.data);
    } catch (error) {
      console.error('四柱推命プロフィール更新エラー:', error);
      console.groupEnd();
      throw error;
    }
  }
  
  // 特定ユーザーのプロフィールを取得
  async getUserProfile(userId: string): Promise<ISajuProfile> {
    try {
      console.group('📊 ユーザープロフィール取得API呼び出し');
      console.log('取得対象ユーザーID:', userId);
      
      // ユーザーAPIを使用して取得
      const response = await apiService.get(USER.GET_USER(userId));
      console.log('ユーザープロフィール取得成功 ✅');
      
      // Userモデルからサーバーレスポンスをクライアント側モデルに変換
      const userProfile = response.data;
      
      // ユーザーデータを四柱推命プロフィール形式に変換
      const profile = this.convertProfileData(userProfile);
      
      console.log('プロフィール取得完了');
      console.groupEnd();
      
      return profile;
    } catch (error) {
      console.error(`ユーザー(${userId})の四柱推命プロフィール取得エラー:`, error);
      console.groupEnd();
      throw error;
    }
  }

  // 自分のプロフィールを取得
  async getMyProfile(): Promise<ISajuProfile> {
    try {
      // ユーザープロフィールAPIを使用
      const response = await apiService.get(USER.GET_PROFILE);
      const userProfile = response.data;
      
      console.group('👤 ユーザープロフィール取得結果');
      console.log('完全なレスポンス:', userProfile);
      
      // 四柱推命情報の存在チェック
      console.log('四柱推命情報 (fourPillars):', userProfile.fourPillars);
      console.log('四柱推命情報 (pillars):', userProfile.pillars);
      console.log('属性情報:', userProfile.elementAttribute);
      console.log('生年月日:', userProfile.birthDate);
      console.log('出生時間:', userProfile.birthTime);
      console.log('出生地:', userProfile.birthPlace);
      console.groupEnd();
      
      // 四柱推命情報（fourPillarsまたはpillars）が含まれているか確認
      // データ名の多様性に対応（古いデータはpillarsかも）
      const hasFourPillars = userProfile.fourPillars || userProfile.pillars;
      if (!hasFourPillars) {
        console.log('四柱推命情報がまだ計算されていません');
        throw new Error('四柱推命情報がまだ計算されていません');
      }
      
      // pillarsという名前で保存されている場合はfourPillarsにマッピング
      if (userProfile.pillars && !userProfile.fourPillars) {
        userProfile.fourPillars = userProfile.pillars;
      }
      
      // hour/timeの互換性対応（時柱データが異なる名前で保存されている場合）
      if (userProfile.fourPillars) {
        // timeという名前で保存されている場合はhourにマッピング
        if (userProfile.fourPillars.time && !userProfile.fourPillars.hour) {
          userProfile.fourPillars.hour = userProfile.fourPillars.time;
        }
        // 逆に、hourという名前で保存されている場合はtimeにマッピング
        else if (userProfile.fourPillars.hour && !userProfile.fourPillars.time) {
          userProfile.fourPillars.time = userProfile.fourPillars.hour;
        }
      }
      
      // サーバーからのelementProfileを適切に処理
      console.log('My Profileで受け取ったelementProfile:', userProfile.elementProfile);
      
      // サーバーからのelementProfileオブジェクトをログに出力して内容を確認
      if (userProfile.elementProfile) {
        console.log('My ProfileのelementProfile詳細:', {
          wood: userProfile.elementProfile.wood,
          fire: userProfile.elementProfile.fire,
          earth: userProfile.elementProfile.earth,
          metal: userProfile.elementProfile.metal,
          water: userProfile.elementProfile.water
        });
      }
      
      // elementProfileの有効性をチェック
      let validElementProfile = false;
      if (userProfile.elementProfile) {
        const elemValues = [
          userProfile.elementProfile.wood,
          userProfile.elementProfile.fire,
          userProfile.elementProfile.earth,
          userProfile.elementProfile.metal,
          userProfile.elementProfile.water
        ];
        
        // 少なくとも一つの値が数値で、かつ20以外であれば有効とみなす
        validElementProfile = elemValues.some(val => 
          typeof val === 'number' && !isNaN(val) && val !== 20
        );
        
        console.log('My ProfileのelementProfileは有効か:', validElementProfile);
      }
      
      // サーバー側モデルからクライアント側モデルへの変換
      const sajuProfile: ISajuProfile = {
        userId: userProfile.id,
        birthplace: userProfile.birthPlace || '',
        birthplaceCoordinates: userProfile.birthplaceCoordinates,
        localTimeOffset: userProfile.localTimeOffset,
        mainElement: userProfile.elementAttribute || 'wood',
        // 有効なelementProfileがある場合はそれを使用し、なければデフォルト値を使用
        elementProfile: validElementProfile ? userProfile.elementProfile : {
          wood: 0,  // デフォルトは0（データがない場合）
          fire: 0,
          earth: 0,
          metal: 0,
          water: 0
        },
        fourPillars: userProfile.fourPillars || {
          year: { heavenlyStem: '', earthlyBranch: '' },
          month: { heavenlyStem: '', earthlyBranch: '' },
          day: { heavenlyStem: '', earthlyBranch: '' },
          hour: { heavenlyStem: '', earthlyBranch: '' }
        },
        // 格局と用神情報を追加（喜神・忌神・仇神を含む）
        kakukyoku: userProfile.kakukyoku,
        yojin: userProfile.yojin ? {
          tenGod: userProfile.yojin.tenGod || '',
          element: userProfile.yojin.element || '',
          description: userProfile.yojin.description || '',
          supportElements: userProfile.yojin.supportElements || [],
          kijin: userProfile.yojin.kijin,
          kijin2: userProfile.yojin.kijin2,
          kyujin: userProfile.yojin.kyujin
        } : undefined,
        personalityDescription: userProfile.personalityDescription || '',
        careerAptitude: userProfile.careerAptitude || '',
        createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : new Date(),
        updatedAt: userProfile.updatedAt ? new Date(userProfile.updatedAt) : new Date()
      };
      
      console.log('四柱推命プロフィール取得完了:', sajuProfile);
      return sajuProfile;
    } catch (error) {
      console.error('四柱推命プロフィール取得エラー:', error);
      throw error;
    }
  }
  
  // 四柱推命プロフィール編集用の詳細データを取得
  async getProfileDetails(): Promise<any> {
    try {
      // ユーザープロフィールからの詳細データ取得
      const response = await apiService.get(USER.GET_PROFILE);
      const userProfile = response.data;
      
      // タイムゾーン問題を解消するためにローカル日付文字列を使用
      const formatLocalDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // 日付が有効かチェック
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        console.log(`日付変換: ${dateStr} → ${year}-${month}-${day}`);
        return `${year}-${month}-${day}`;
      };
      
      // 編集用に必要なデータを抽出
      const profileDetails = {
        birthDate: userProfile.birthDate ? formatLocalDate(userProfile.birthDate) : '',
        birthTime: userProfile.birthTime || '',
        birthPlace: userProfile.birthPlace || '',
        gender: userProfile.gender || '',
        birthplaceCoordinates: userProfile.birthplaceCoordinates,
        localTimeOffset: userProfile.localTimeOffset
      };
      
      console.log('プロフィール詳細データ取得完了:', profileDetails);
      return profileDetails;
    } catch (error) {
      console.error('プロフィール詳細データ取得エラー:', error);
      return null;
    }
  }
  
  // 五行属性でユーザーを検索
  async getUsersByElement(element: string, limit: number = 20): Promise<ISajuProfile[]> {
    try {
      // ユーザーエンドポイントにリダイレクト
      const response = await apiService.get(`${USER.LIST_USERS}?elementAttribute=${element}&limit=${limit}`);
      const users = response.data.users || [];
      
      // 各ユーザーを四柱推命プロフィール形式に変換
      const profiles = users.map((user: any) => this.convertProfileData(user));
      
      return profiles;
    } catch (error) {
      console.error(`五行属性(${element})を持つユーザーのプロフィール取得エラー:`, error);
      throw error;
    }
  }

  // 五行属性から色を取得
  getElementColor(element: string): string {
    const elementColors = {
      wood: 'var(--wood-color, #0000ff)', // 青/緑色
      fire: 'var(--fire-color, #ff0000)', // 赤色
      earth: 'var(--earth-color, #ffff00)', // 黄色
      metal: 'var(--metal-color, #ffffff)', // 白色
      water: 'var(--water-color, #000000)', // 黒/紺色
    };
    return elementColors[element as keyof typeof elementColors] || 'var(--primary-color)';
  }

  // 五行属性から背景色を取得
  getElementBackground(element: string): string {
    const elementBackgrounds = {
      wood: 'var(--wood-bg, #e6f2ff)', // 青/緑色の薄い背景
      fire: 'var(--fire-bg, #ffe6e6)', // 赤色の薄い背景
      earth: 'var(--earth-bg, #ffffcc)', // 黄色の薄い背景
      metal: 'var(--metal-bg, #f9f9f9)', // 白色の薄い背景
      water: 'var(--water-bg, #e6e6e6)', // 黒/紺色の薄い背景
    };
    return elementBackgrounds[element as keyof typeof elementBackgrounds] || 'var(--background-color)';
  }

  // 五行属性からアイコンを取得
  getElementIcon(element: string): string {
    const elementIcons = {
      wood: 'park',
      fire: 'local_fire_department',
      earth: 'landscape',
      metal: 'star',
      water: 'water_drop',
    };
    return elementIcons[element as keyof typeof elementIcons] || 'psychology';
  }

  // 五行属性を日本語に変換
  translateElementToJapanese(element: string): string {
    const translations: Record<string, string> = {
      wood: '木',
      fire: '火',
      earth: '土',
      metal: '金',
      water: '水'
    };
    
    return translations[element] || element;
  }
}

export default new SajuProfileService();