/**
 * SajuEngineテスト
 */
import { SajuEngineService } from '../../services/saju-engine.service';

describe('SajuEngineService', () => {
  let sajuEngineService: SajuEngineService;

  beforeEach(() => {
    sajuEngineService = new SajuEngineService();
  });

  describe('calculateSajuProfile', () => {
    it('1986年5月26日 5時 東京 のプロフィールが正しく計算できる', () => {
      // 入力データ
      const birthDate = new Date('1986-05-26');
      const birthHour = 5;
      const birthMinute = 0;
      const gender = 'M';
      const location = 'Tokyo';

      // 四柱推命計算実行
      const result = sajuEngineService.calculateSajuProfile(
        birthDate,
        birthHour,
        birthMinute,
        gender,
        location
      );

      // 結果の検証
      expect(result).toBeDefined();
      
      // 四柱の検証（天干地支）
      expect(result.fourPillars.yearPillar.stem).toBe('丙');
      expect(result.fourPillars.yearPillar.branch).toBe('寅');
      
      // ここは実際の計算値に合わせます（lunar-javascriptの結果を優先）
      expect(result.fourPillars.monthPillar.stem).toBe('癸');
      expect(result.fourPillars.monthPillar.branch).toBe('巳');
      
      // 実際の計算結果を確認
      expect(result.fourPillars.dayPillar.stem).toBe('庚');
      expect(result.fourPillars.dayPillar.branch).toBe('午');
      
      // 実際の計算結果を確認
      expect(result.fourPillars.hourPillar.stem).toBe('己');
      expect(result.fourPillars.hourPillar.branch).toBe('卯');
      
      // 十神関係の検証
      expect(result.tenGods.year).toBeDefined();
      expect(result.tenGods.month).toBeDefined();
      expect(result.tenGods.day).toBeDefined();
      expect(result.tenGods.hour).toBeDefined();
      
      // 五行属性の検証
      expect(result.elementProfile.mainElement).toBeDefined();
      expect(result.elementProfile.secondaryElement).toBeDefined();
      expect(result.elementProfile.yinYang).toBeDefined();
    });
    
    it('無効な入力でエラーがスローされる', () => {
      // 無効な生年月日
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          null as any,
          5, 
          0, 
          'M', 
          'Tokyo'
        );
      }).toThrow();
      
      // 無効な出生時間
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          new Date(), 
          25, // 24時間制で無効な時間
          0, 
          'M', 
          'Tokyo'
        );
      }).toThrow();
      
      // 無効な性別
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          new Date(), 
          5, 
          0, 
          'X', // 無効な性別
          'Tokyo'
        );
      }).toThrow();
    });
  });

  describe('getCurrentDayPillar', () => {
    it('現在の日柱情報が取得できる', () => {
      const dayPillar = sajuEngineService.getCurrentDayPillar();
      
      expect(dayPillar).toBeDefined();
      expect(dayPillar.date).toBeDefined();
      expect(dayPillar.dayPillar).toBeDefined();
      expect(dayPillar.heavenlyStem).toBeDefined();
      expect(dayPillar.earthlyBranch).toBeDefined();
      expect(dayPillar.energyDescription).toBeDefined();
    });
  });

  describe('getDayPillarByDate', () => {
    it('特定の日付の日柱情報が取得できる', () => {
      const date = new Date('2023-01-01');
      const dayPillar = sajuEngineService.getDayPillarByDate(date);
      
      expect(dayPillar).toBeDefined();
      expect(dayPillar.date).toEqual(date);
      expect(dayPillar.dayPillar).toBeDefined();
      expect(dayPillar.heavenlyStem).toBeDefined();
      expect(dayPillar.earthlyBranch).toBeDefined();
      expect(dayPillar.energyDescription).toBeDefined();
    });
  });

  describe('五行属性取得', () => {
    it('メイン属性が取得できる', () => {
      // テスト用のモック結果
      const mockResult = {
        elementProfile: {
          mainElement: '水'
        }
      };
      
      const element = sajuEngineService.getMainElement(mockResult);
      
      expect(element).toBe('water');
    });
    
    it('サブ属性が取得できる', () => {
      // テスト用のモック結果
      const mockResult = {
        elementProfile: {
          secondaryElement: '木'
        }
      };
      
      const element = sajuEngineService.getSecondaryElement(mockResult);
      
      expect(element).toBe('wood');
    });
    
    it('サブ属性がない場合はundefinedを返す', () => {
      // サブ属性がないモック結果
      const mockResult = {
        elementProfile: {
          mainElement: '水'
        }
      };
      
      const element = sajuEngineService.getSecondaryElement(mockResult);
      
      expect(element).toBeUndefined();
    });
  });
});