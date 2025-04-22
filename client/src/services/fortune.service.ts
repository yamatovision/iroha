import apiService from './api.service';
import { FORTUNE, IFortune } from '../../../shared';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import storageService from './storage/storage-factory';
import { StorageKeys } from './storage/storage.interface';

class FortuneService {
  private cachedFortune: IFortune | null = null;
  private cacheExpiration: Date | null = null;
  private readonly CACHE_DURATION_MS = 3600000; // 1時間
  private lastCheckedDate: string | null = null; // YYYY-MM-DD形式で日付を保存

  /**
   * 今日の運勢を取得する
   * @param date オプションの日付 (YYYY-MM-DD形式)
   * @returns 運勢データ
   */
  async getDailyFortune(date?: string): Promise<IFortune> {
    // 日付指定がない場合はキャッシュチェック
    if (!date) {
      this.checkAndClearCache();
      
      // キャッシュが有効かどうかを確認
      const now = new Date();
      if (this.cachedFortune && this.cacheExpiration && now < this.cacheExpiration) {
        console.log('キャッシュから運勢データを取得');
        return this.cachedFortune;
      }
    }

    // 日付パラメータとタイムゾーン情報を追加
    const tzInfo = this.getTimezoneInfo();
    const params = {
      ...(date ? { date } : {}),
      timezone: tzInfo.timezone,
      tzOffset: tzInfo.offset
    };

    try {
      const response = await apiService.get<IFortune>(FORTUNE.GET_DAILY_FORTUNE, { params });
      
      // キャッシュを更新（日付指定がない場合）
      if (!date) {
        this.cachedFortune = response.data;
        this.setAdaptiveCacheExpiration();
      }
      
      // 四柱推命属性情報が取得できたかを確認
      if (response.data && response.data.dayPillar) {
        console.log('運勢データが正常に取得されました:', {
          dayPillar: response.data.dayPillar,
          score: response.data.score
        });
      } else {
        console.warn('運勢データに四柱推命情報が含まれていません');
        throw new Error('四柱推命情報が不足しています');
      }
      
      return response.data;
    } catch (error) {
      console.error('運勢データの取得に失敗しました', error);
      throw error;
    }
  }

  /**
   * キャッシュを無効化して最新の運勢データを取得する
   * サーバーサイドでの運勢生成を強制的に行う
   */
  async refreshDailyFortune(): Promise<IFortune> {
    // キャッシュを確実に無効化
    this.cachedFortune = null;
    this.cacheExpiration = null;
    
    // 最新の日付をセット
    this.lastCheckedDate = this.getCurrentDateString();
    
    // 四柱推命情報更新後の運勢更新は、サーバーサイドで生成
    try {
      // タイムゾーン情報を取得
      const tzInfo = this.getTimezoneInfo();
      
      // 運勢更新APIを呼び出して最新データを生成（存在する場合は上書き）
      const response = await apiService.post(FORTUNE.UPDATE_FORTUNE, {
        forceUpdate: true,
        timezone: tzInfo.timezone,
        tzOffset: tzInfo.offset
      });
      
      if (response.status === 201 || response.status === 200) {
        console.log('サーバーサイドで運勢が更新されました:', response.data);
        this.cachedFortune = response.data;
        this.setAdaptiveCacheExpiration();
        return response.data;
      }
    } catch (error) {
      console.warn('サーバーサイドでの運勢更新に失敗しました:', error);
      // エラーをそのまま上位に伝播させる
      throw error;
    }
    
    // 通常の運勢取得（エラー時のフォールバックは呼び出し側で処理）
    return this.getDailyFortune();
  }
  
  /**
   * 運勢データを手動で生成する
   * 四柱推命プロフィールが必要
   */
  async generateFortune(): Promise<IFortune> {
    try {
      // タイムゾーン情報を取得
      const tzInfo = this.getTimezoneInfo();
      
      // 最新の日付をセット
      this.lastCheckedDate = this.getCurrentDateString();
      
      // キャッシュを無効化
      this.cachedFortune = null;
      this.cacheExpiration = null;
      
      const response = await apiService.post(FORTUNE.UPDATE_FORTUNE, {
        timezone: tzInfo.timezone,
        tzOffset: tzInfo.offset
      });
      
      // キャッシュを更新
      this.cachedFortune = response.data;
      this.setAdaptiveCacheExpiration();
      
      return response.data;
    } catch (error) {
      console.error('運勢データの生成に失敗しました', error);
      throw error;
    }
  }

  /**
   * ユーザーの運勢を取得する
   * @param userId ユーザーID
   * @returns 運勢データ
   */
  async getUserFortune(userId: string): Promise<IFortune> {
    try {
      const response = await apiService.get<IFortune>(FORTUNE.GET_USER_FORTUNE(userId));
      return response.data;
    } catch (error) {
      console.error(`ユーザー(${userId})の運勢取得に失敗しました`, error);
      throw error;
    }
  }

  /**
   * チームのメンバー運勢ランキングを取得する
   * @param teamId チームID
   * @returns チームメンバーの運勢ランキング
   */
  async getTeamFortuneRanking(teamId: string): Promise<any> {
    try {
      // apiServiceを使うが、フォースリフレッシュとキャッシュスキップで確実に最新データを取得
      console.log(`チーム運勢ランキング取得 (キャッシュなし): teamId=${teamId}`);
      
      // キャッシュをクリア
      await apiService.clearCache(FORTUNE.GET_TEAM_FORTUNE_RANKING(teamId));
      
      // タイムスタンプ付きのクエリパラメータを追加
      const timestamp = new Date().getTime();
      
      // apiServiceを使ってデータ取得（リフレッシュフラグを強制指定）
      // タイムスタンプをクエリパラメータに追加してキャッシュバスティング
      const response = await apiService.get(
        FORTUNE.GET_TEAM_FORTUNE_RANKING(teamId),
        { params: { _cb: timestamp } }, // キャッシュバスティング用のパラメータ
        { 
          skipCache: true,
          forceRefresh: true
        }
      );
      
      // レスポンスデータのログ
      console.log(`チーム運勢ランキング取得成功: チームID=${teamId}`, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`チーム(${teamId})の運勢ランキング取得に失敗しました`, error);
      throw error;
    }
  }
  
  /**
   * チームコンテキスト運勢を取得する
   * @param teamId チームID
   * @param date オプションの日付 (YYYY-MM-DD形式)
   * @returns チームコンテキスト運勢データ
   */
  async getTeamContextFortune(teamId: string, date?: string): Promise<any> {
    const endpoint = FORTUNE.GET_TEAM_CONTEXT_FORTUNE(teamId);
    console.log(`[FortuneService] 📡 チームコンテキスト運勢APIリクエスト: ${endpoint}`);
    const start = Date.now();
    
    try {
      // 日付パラメータがある場合は追加
      const params = date ? { date } : {};
      
      // タイムゾーン情報を追加
      const tzInfo = this.getTimezoneInfo();
      Object.assign(params, {
        timezone: tzInfo.timezone,
        tzOffset: tzInfo.offset
      });
      
      console.log(`[FortuneService] 📡 APIパラメータ: ${JSON.stringify(params)}`);
      
      // キャッシュが原因の可能性があるためキャッシュをスキップするオプションを追加
      const response = await apiService.get(endpoint, { params }, {
        skipCache: true,
        forceRefresh: true
      });
      
      const elapsed = Date.now() - start;
      
      // レスポンスの詳細をログに出力（デバッグ用）
      console.log(`[FortuneService] 📩 レスポンス詳細:`, JSON.stringify(response.data).substring(0, 300) + '...');
      
      // 結果に新規生成フラグがあるかチェック
      const isNewlyGenerated = response.data.isNewlyGenerated || false;
      console.log(`[FortuneService] 📩 APIレスポンス受信 (${elapsed}ms): ${isNewlyGenerated ? '🆕 新規生成' : '✅ 既存データ'}`);
      
      return response.data;
    } catch (error: any) {
      const elapsed = Date.now() - start;
      console.error(`[FortuneService] ❌ チーム(${teamId})のコンテキスト運勢取得に失敗しました (${elapsed}ms)`, error);
      
      // 404エラーの場合は、機能が未実装であることを示す
      if (error.response && error.response.status === 404) {
        if (error.response.data && error.response.data.code === 'FEATURE_NOT_IMPLEMENTED') {
          // 未実装機能に対して空のデータを返す
          console.log(`[FortuneService] ⚠️ 未実装機能: 'FEATURE_NOT_IMPLEMENTED'`);
          return {
            success: false,
            message: 'チームコンテキスト運勢機能は現在実装中です',
            teamContextFortune: null
          };
        }
      }
      
      // その他のエラーは通常通りスロー
      throw error;
    }
  }
  
  /**
   * 運勢ダッシュボード情報を取得する
   * @param teamId オプションのチームID
   * @returns 運勢ダッシュボード情報
   */
  async getFortuneDashboard(teamId?: string): Promise<any> {
    try {
      // 日付変更チェック（更新が必要ならキャッシュをクリア）
      const wasUpdated = await this.checkDateChange();
      if (!wasUpdated) {
        // 手動でキャッシュクリアを試行
        this.checkAndClearCache();
      }
      
      // タイムゾーン情報を取得
      const tzInfo = this.getTimezoneInfo();
      
      console.log('💫 運勢ダッシュボード取得開始：', FORTUNE.GET_FORTUNE_DASHBOARD(teamId));
      const startTime = Date.now();
      
      // タイムゾーン情報をクエリパラメータに含める
      const params = {
        timezone: tzInfo.timezone,
        tzOffset: tzInfo.offset
      };
      
      const response = await apiService.get(FORTUNE.GET_FORTUNE_DASHBOARD(teamId), { params });
      console.log(`💫 運勢ダッシュボード取得完了 (${Date.now() - startTime}ms)：`, JSON.stringify(response.data, null, 2));
      
      // レスポンスの内容を検証
      if (!response.data || !response.data.personalFortune) {
        console.error('💫 運勢ダッシュボードのレスポンスに期待されるデータがありません', response.data);
      } else {
        console.log('💫 personalFortune ID:', response.data.personalFortune.id);
        console.log('💫 personalFortune Date:', response.data.personalFortune.date);
        console.log('💫 personalFortune Advice (先頭100文字):', 
          response.data.personalFortune.advice ? response.data.personalFortune.advice.substring(0, 100) + '...' : 'undefined');
        
        // 個人運勢データはキャッシュする
        if (response.data.personalFortune) {
          this.cachedFortune = response.data.personalFortune;
          this.setAdaptiveCacheExpiration();
          this.lastCheckedDate = this.getCurrentDateString();
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('💫 運勢ダッシュボードの取得に失敗しました', error);
      throw error;
    }
  }

  /**
   * 日付を「yyyy年M月d日 (E)」の形式で整形する
   * @param date 日付オブジェクトまたは日付文字列
   * @returns 整形された日付文字列
   */
  formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'yyyy年M月d日 (E)', { locale: ja });
  }
  
  /**
   * クライアント側のタイムゾーンを考慮した現在日付を取得
   * @returns YYYY-MM-DD形式の日付文字列
   */
  getCurrentDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD形式
  }
  
  /**
   * サーバー要求用のタイムゾーン情報を準備
   * @returns タイムゾーン情報
   */
  getTimezoneInfo(): { timezone: string, offset: number } {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    return { timezone, offset };
  }

  /**
   * 五行属性に基づいた色情報を取得する
   * @param element 五行属性名（heavenlyStem の値）
   * @returns 色情報
   */
  getElementColors(element: string): { main: string, light: string, bg: string, dark: string, textColor: string } {
    if (element.includes('木') || element === '甲' || element === '乙') {
      return {
        main: '#000000',
        light: '#4d4dff',
        bg: '#94b8eb',
        dark: '#0000b3',
        textColor: '#000000'
      };
    } else if (element.includes('火') || element === '丙' || element === '丁') {
      return {
        main: '#000000',
        light: '#ff4d4d',
        bg: '#e67373',
        dark: '#b30000',
        textColor: '#000000'
      };
    } else if (element.includes('土') || element === '戊' || element === '己') {
      return {
        main: '#000000',
        light: '#ffff66',
        bg: '#f2d06b',
        dark: '#b3b300',
        textColor: '#000000'
      };
    } else if (element.includes('金') || element === '庚' || element === '辛') {
      return {
        main: '#000000',
        light: '#ffffff',
        bg: '#ffffff',
        dark: '#e6e6e6',
        textColor: '#000000'
      };
    } else if (element.includes('水') || element === '壬' || element === '癸') {
      return {
        main: '#ffffff', // 水の場合は文字色を白に
        light: '#333333',
        bg: '#7d94a6',
        dark: '#000000',
        textColor: '#ffffff'
      };
    }
    
    // デフォルト値（水）
    return {
      main: '#ffffff',
      light: '#333333',
      bg: '#7d94a6',
      dark: '#000000',
      textColor: '#ffffff'
    };
  }

  /**
   * 天干から陰陽を取得する
   * @param stem 天干
   * @returns "陽" または "陰"
   */
  getStemPolarity(stem: string): '陽' | '陰' {
    const yangStems = ['甲', '丙', '戊', '庚', '壬'];
    return yangStems.includes(stem) ? '陽' : '陰';
  }

  /**
   * 天干から五行を取得する
   * @param stem 天干
   * @returns 五行名称（木、火、土、金、水）
   */
  getStemElement(stem: string): string {
    const elementMap: { [key: string]: string } = {
      '甲': '木', '乙': '木',
      '丙': '火', '丁': '火',
      '戊': '土', '己': '土',
      '庚': '金', '辛': '金',
      '壬': '水', '癸': '水'
    };
    
    return elementMap[stem] || '未知';
  }

  /**
   * 運勢スコアに基づいたスコア分類を取得する
   * @param score 運勢スコア（0-100）
   * @returns スコア分類("excellent" | "good" | "neutral" | "poor" | "bad")
   */
  getScoreCategory(score: number): "excellent" | "good" | "neutral" | "poor" | "bad" {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "neutral";
    if (score >= 20) return "poor";
    return "bad";
  }

  /**
   * キャッシュの有効性をチェックし、必要に応じてクリア
   * @returns キャッシュがクリアされたかどうか
   */
  checkAndClearCache(): boolean {
    const now = new Date();
    
    // 1. 日付が変わっていないか確認
    const currentDateStr = this.getCurrentDateString();
    const cachedDateStr = this.cachedFortune?.date 
      ? new Date(this.cachedFortune.date).toISOString().split('T')[0]
      : null;
    
    // 2. キャッシュの期限切れを確認
    const isCacheExpired = !this.cacheExpiration || now > this.cacheExpiration;
    
    // 3. 日付が変わっているか、キャッシュが期限切れならクリア
    if (cachedDateStr !== currentDateStr || isCacheExpired) {
      console.log('キャッシュをクリア: 日付変更または期限切れ', {
        currentDate: currentDateStr,
        cachedDate: cachedDateStr,
        isExpired: isCacheExpired
      });
      
      this.cachedFortune = null;
      this.cacheExpiration = null;
      return true;
    }
    
    return false;
  }

  /**
   * キャッシュ期限の適応的設定
   * 日付が変わるまでの時間に応じて期限を設定
   */
  setAdaptiveCacheExpiration(): void {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    // 日付が変わるまでの時間（ミリ秒）
    const timeUntilEndOfDay = endOfDay.getTime() - now.getTime();
    
    // 標準のキャッシュ期間か日付変更までの時間の短い方を採用
    const cacheTime = Math.min(this.CACHE_DURATION_MS, timeUntilEndOfDay);
    
    this.cacheExpiration = new Date(now.getTime() + cacheTime);
    console.log(`キャッシュ期限を設定: ${this.cacheExpiration.toISOString()}`);
  }

  /**
   * 日付が変わったかどうかを確認し、変わっていたら運勢データを更新する
   * @returns 更新が必要だった場合はtrue、そうでなければfalse
   */
  async checkDateChange(): Promise<boolean> {
    const today = new Date();
    const currentDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    // 初回実行時は前回のチェック日付を取得（プラットフォーム共通ストレージから）
    if (!this.lastCheckedDate) {
      try {
        // ストレージから前回チェック日を取得
        const storedDate = await storageService.get(StorageKeys.LAST_FORTUNE_CHECK_DATE);
        
        if (storedDate) {
          this.lastCheckedDate = storedDate;
          console.log('前回のチェック日を復元:', this.lastCheckedDate);
        } else {
          // 初回実行時は現在の日付を保存（通知なし）
          this.lastCheckedDate = currentDateStr;
          await storageService.set(StorageKeys.LAST_FORTUNE_CHECK_DATE, currentDateStr);
          console.log('初回実行: 日付をセット:', currentDateStr);
          return false;
        }
      } catch (e) {
        // ストレージアクセスエラー時は現在日付をセット
        this.lastCheckedDate = currentDateStr;
        console.warn('ストレージからの日付読み込みエラー:', e);
      }
    }
    
    // 日付が変わった場合
    if (this.lastCheckedDate !== currentDateStr) {
      console.log('日付が変更されました。運勢データを更新します:', currentDateStr);
      this.lastCheckedDate = currentDateStr;
      
      // 永続ストレージに最新の日付を保存
      try {
        await storageService.set(StorageKeys.LAST_FORTUNE_CHECK_DATE, currentDateStr);
      } catch (e) {
        console.warn('日付の保存に失敗:', e);
      }
      
      // キャッシュをクリア
      this.cachedFortune = null;
      this.cacheExpiration = null;
      
      return true;
    }
    
    return false;
  }

  /**
   * エラー発生時のモック運勢データを生成する
   * @returns モック運勢データ
   */
  generateMockFortune(): IFortune {
    const now = new Date();
    return {
      id: 'mock-fortune',
      userId: 'current-user',
      date: now,
      dayPillar: {
        heavenlyStem: '壬',
        earthlyBranch: '午',
      },
      score: 70,
      advice: `# 今日のあなたの運気

今日は様々な可能性に恵まれる一日です。特に午後からはコミュニケーション能力が高まり、新しい出会いや情報収集に適しています。

# 個人目標へのアドバイス

自分の目標に向かって少しずつ進むことを心がけましょう。小さな一歩でも、継続することで大きな進歩に繋がります。

# チーム目標へのアドバイス

チーム内での協力を意識し、お互いの強みを生かした取り組みが成功への鍵となります。`,
      luckyItems: {
        color: 'ブルー',
        item: 'ペン',
        drink: '緑茶',
      },
      createdAt: now,
      updatedAt: now,
    };
  }
}

export default new FortuneService();