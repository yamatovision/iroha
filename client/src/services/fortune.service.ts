import apiService from './api.service';
import { FORTUNE, IFortune } from '../../../shared';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

class FortuneService {
  private cachedFortune: IFortune | null = null;
  private cacheExpiration: Date | null = null;
  private readonly CACHE_DURATION_MS = 3600000; // 1時間

  /**
   * 今日の運勢を取得する
   * @param date オプションの日付 (YYYY-MM-DD形式)
   * @returns 運勢データ
   */
  async getDailyFortune(date?: string): Promise<IFortune> {
    // キャッシュが有効かどうかを確認
    const now = new Date();
    if (this.cachedFortune && this.cacheExpiration && now < this.cacheExpiration && !date) {
      console.log('キャッシュから運勢データを取得');
      return this.cachedFortune;
    }

    // 日付パラメータがある場合は追加
    const params = date ? { date } : {};

    try {
      const response = await apiService.get<IFortune>(FORTUNE.GET_DAILY_FORTUNE, { params });
      
      // キャッシュを更新
      if (!date) {
        this.cachedFortune = response.data;
        this.cacheExpiration = new Date(now.getTime() + this.CACHE_DURATION_MS);
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
    
    // 四柱推命情報更新後の運勢更新は、サーバーサイドで生成
    try {
      // 運勢更新APIを呼び出して最新データを生成（存在する場合は上書き）
      const response = await apiService.post(FORTUNE.UPDATE_FORTUNE, {
        forceUpdate: true
      });
      
      if (response.status === 201 || response.status === 200) {
        console.log('サーバーサイドで運勢が更新されました:', response.data);
        this.cachedFortune = response.data;
        this.cacheExpiration = new Date(new Date().getTime() + this.CACHE_DURATION_MS);
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
      const response = await apiService.post(FORTUNE.UPDATE_FORTUNE);
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
      const response = await apiService.get(FORTUNE.GET_TEAM_FORTUNE_RANKING(teamId));
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
    try {
      // 日付パラメータがある場合は追加
      const params = date ? { date } : {};
      
      const response = await apiService.get(FORTUNE.GET_TEAM_CONTEXT_FORTUNE(teamId), { params });
      return response.data;
    } catch (error) {
      console.error(`チーム(${teamId})のコンテキスト運勢取得に失敗しました`, error);
      throw error;
    }
  }
  
  /**
   * 運勢ダッシュボード情報を取得する
   * @param teamId オプションのチームID
   * @returns 運勢ダッシュボード情報
   */
  async getFortuneDashboard(teamId?: string): Promise<any> {
    // キャッシュは無効化
    this.cachedFortune = null;
    this.cacheExpiration = null;
    
    try {
      console.log('💫 運勢ダッシュボード取得開始：', FORTUNE.GET_FORTUNE_DASHBOARD(teamId));
      const startTime = Date.now();
      const response = await apiService.get(FORTUNE.GET_FORTUNE_DASHBOARD(teamId));
      console.log(`💫 運勢ダッシュボード取得完了 (${Date.now() - startTime}ms)：`, JSON.stringify(response.data, null, 2));
      
      // レスポンスの内容を検証
      if (!response.data || !response.data.personalFortune) {
        console.error('💫 運勢ダッシュボードのレスポンスに期待されるデータがありません', response.data);
      } else {
        console.log('💫 personalFortune ID:', response.data.personalFortune.id);
        console.log('💫 personalFortune Date:', response.data.personalFortune.date);
        console.log('💫 personalFortune Advice (先頭100文字):', 
          response.data.personalFortune.advice ? response.data.personalFortune.advice.substring(0, 100) + '...' : 'undefined');
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
   * 五行属性に基づいた色情報を取得する
   * @param element 五行属性名（heavenlyStem の値）
   * @returns 色情報
   */
  getElementColors(element: string): { main: string, light: string, bg: string, dark: string } {
    if (element.includes('木') || element === '甲' || element === '乙') {
      return {
        main: 'var(--wood-color)',
        light: 'var(--wood-light)',
        bg: 'var(--wood-bg)',
        dark: 'var(--wood-dark)'
      };
    } else if (element.includes('火') || element === '丙' || element === '丁') {
      return {
        main: 'var(--fire-color)',
        light: 'var(--fire-light)',
        bg: 'var(--fire-bg)',
        dark: 'var(--fire-dark)'
      };
    } else if (element.includes('土') || element === '戊' || element === '己') {
      return {
        main: 'var(--earth-color)',
        light: 'var(--earth-light)',
        bg: 'var(--earth-bg)',
        dark: 'var(--earth-dark)'
      };
    } else if (element.includes('金') || element === '庚' || element === '辛') {
      return {
        main: 'var(--metal-color)',
        light: 'var(--metal-light)',
        bg: 'var(--metal-bg)',
        dark: 'var(--metal-dark)'
      };
    } else if (element.includes('水') || element === '壬' || element === '癸') {
      return {
        main: 'var(--water-color)',
        light: 'var(--water-light)',
        bg: 'var(--water-bg)',
        dark: 'var(--water-dark)'
      };
    }
    
    // デフォルト値（水）
    return {
      main: 'var(--water-color)',
      light: 'var(--water-light)',
      bg: 'var(--water-bg)',
      dark: 'var(--water-dark)'
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