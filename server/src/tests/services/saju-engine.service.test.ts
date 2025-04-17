import { SajuEngineService } from '../../services/saju-engine.service';
import { ValidationError } from '../../utils';

// SajuEngineをモック
jest.mock('saju-engine', () => {
  return {
    SajuEngine: jest.fn().mockImplementation(() => {
      return {
        calculate: jest.fn().mockImplementation((birthDate, birthHour, gender, location) => {
          return {
            fourPillars: {
              yearPillar: { stem: '甲', branch: '子', hiddenStems: [] },
              monthPillar: { stem: '乙', branch: '丑', hiddenStems: [] },
              dayPillar: { stem: '丙', branch: '寅', hiddenStems: [] },
              hourPillar: { stem: '丁', branch: '卯', hiddenStems: [] }
            },
            tenGods: { year: '偏印', month: '正印', day: '比肩', hour: '劫財' },
            elementProfile: {
              mainElement: 'fire',
              secondaryElement: 'wood',
              yinYang: '陽'
            },
            lunarDate: undefined, // undefinedに変更
            processedDateTime: {
              originalDate: birthDate,
              simpleDate: { year: 1990, month: 1, day: 15, hour: 13, minute: 30 },
              adjustedDate: { year: 1990, month: 1, day: 15, hour: 13, minute: 30 },
              lunarDate: undefined, // undefinedに変更
              solarTermPeriod: { name: '大寒', index: 23 }
            }
          };
        }),
        getCurrentSaju: jest.fn().mockImplementation(() => {
          return {
            fourPillars: {
              yearPillar: { stem: '庚', branch: '寅', hiddenStems: [] },
              monthPillar: { stem: '辛', branch: '卯', hiddenStems: [] },
              dayPillar: { stem: '壬', branch: '辰', hiddenStems: [] },
              hourPillar: { stem: '癸', branch: '巳', hiddenStems: [] }
            }
          };
        })
      };
    })
  };
});

describe('SajuEngineService', () => {
  let sajuEngineService: SajuEngineService;

  beforeEach(() => {
    sajuEngineService = new SajuEngineService();
  });

  describe('calculateSajuProfile', () => {
    it('正しい生年月日と時間で四柱推命プロフィールを計算できる', () => {
      // 有効な入力データ
      const birthDate = new Date('1990-01-15');
      const birthHour = 13;
      const birthMinute = 30;
      const gender = 'M';
      const location = 'Tokyo, Japan';

      // 実行
      const result = sajuEngineService.calculateSajuProfile(
        birthDate,
        birthHour,
        birthMinute,
        gender,
        location
      );

      // 検証
      expect(result).toBeDefined();
      expect(result.fourPillars).toBeDefined();
      expect(result.fourPillars.yearPillar).toBeDefined();
      expect(result.fourPillars.monthPillar).toBeDefined();
      expect(result.fourPillars.dayPillar).toBeDefined();
      expect(result.fourPillars.hourPillar).toBeDefined();
      expect(result.elementProfile).toBeDefined();
    });

    it('birthDateがnullの場合にValidationErrorをスローする', () => {
      // 無効な入力データ
      const birthDate = null as any;
      const birthHour = 13;
      const birthMinute = 30;
      const gender = 'M';
      const location = 'Tokyo, Japan';

      // ValidationErrorがスローされることを検証
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow(ValidationError);
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow('生年月日は必須です');
    });

    it('birthHourが範囲外の場合にValidationErrorをスローする', () => {
      // 無効な入力データ
      const birthDate = new Date('1990-01-15');
      const birthHour = 24; // 無効な値（0-23の範囲外）
      const birthMinute = 30;
      const gender = 'M';
      const location = 'Tokyo, Japan';

      // ValidationErrorがスローされることを検証
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow(ValidationError);
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow('出生時間（時）は0-23の範囲で指定してください');
    });

    it('birthMinuteが範囲外の場合にValidationErrorをスローする', () => {
      // 無効な入力データ
      const birthDate = new Date('1990-01-15');
      const birthHour = 13;
      const birthMinute = 60; // 無効な値（0-59の範囲外）
      const gender = 'M';
      const location = 'Tokyo, Japan';

      // ValidationErrorがスローされることを検証
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow(ValidationError);
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow('出生時間（分）は0-59の範囲で指定してください');
    });

    it('genderが無効な場合にValidationErrorをスローする', () => {
      // 無効な入力データ
      const birthDate = new Date('1990-01-15');
      const birthHour = 13;
      const birthMinute = 30;
      const gender = 'X'; // 無効な値（M,Fのみ有効）
      const location = 'Tokyo, Japan';

      // ValidationErrorがスローされることを検証
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow(ValidationError);
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow('性別は"M"（男性）または"F"（女性）で指定してください');
    });

    it('locationが空の場合にValidationErrorをスローする', () => {
      // 無効な入力データ
      const birthDate = new Date('1990-01-15');
      const birthHour = 13;
      const birthMinute = 30;
      const gender = 'M';
      const location = ''; // 無効な値（空文字）

      // ValidationErrorがスローされることを検証
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow(ValidationError);
      expect(() => {
        sajuEngineService.calculateSajuProfile(
          birthDate,
          birthHour,
          birthMinute,
          gender,
          location
        );
      }).toThrow('出生地は必須です');
    });
  });

  describe('getCurrentDayPillar', () => {
    it('現在の日柱情報を取得できる', () => {
      // 実行
      const dayPillar = sajuEngineService.getCurrentDayPillar();

      // 検証
      expect(dayPillar).toBeDefined();
      expect(dayPillar.date).toBeDefined();
      expect(dayPillar.heavenlyStem).toBeDefined();
      expect(dayPillar.earthlyBranch).toBeDefined();
      expect(dayPillar.energyDescription).toBeDefined();
    });
  });

  describe('getDayPillarByDate', () => {
    it('指定された日付の日柱情報を取得できる', () => {
      // 実行
      const date = new Date();
      const dayPillar = sajuEngineService.getDayPillarByDate(date);

      // 検証
      expect(dayPillar).toBeDefined();
      expect(dayPillar.date).toEqual(date);
      expect(dayPillar.heavenlyStem).toBeDefined();
      expect(dayPillar.earthlyBranch).toBeDefined();
      expect(dayPillar.energyDescription).toBeDefined();
    });
  });

  describe('getMainElement', () => {
    it('五行属性（メイン）を正しく取得できる', () => {
      // テスト用のモックデータ
      const mockResult = {
        elementProfile: {
          mainElement: 'fire'
        }
      };

      // 実行
      const mainElement = sajuEngineService.getMainElement(mockResult);

      // 検証
      expect(mainElement).toEqual('fire');
    });

    it('五行属性が日本語の場合も正しく変換される', () => {
      // テスト用のモックデータ（日本語の五行）
      const mockResult = {
        elementProfile: {
          mainElement: '火'
        }
      };

      // 実行
      const mainElement = sajuEngineService.getMainElement(mockResult);

      // 検証
      expect(mainElement).toEqual('fire');
    });

    it('無効な結果オブジェクトの場合にValidationErrorをスローする', () => {
      // 無効なモックデータ
      const mockResult = {};

      // ValidationErrorがスローされることを検証
      expect(() => {
        sajuEngineService.getMainElement(mockResult);
      }).toThrow(ValidationError);
      expect(() => {
        sajuEngineService.getMainElement(mockResult);
      }).toThrow('五行属性の取得に失敗しました');
    });
  });

  describe('getSecondaryElement', () => {
    it('五行属性（サブ）を正しく取得できる', () => {
      // テスト用のモックデータ
      const mockResult = {
        elementProfile: {
          secondaryElement: 'water'
        }
      };

      // 実行
      const secondaryElement = sajuEngineService.getSecondaryElement(mockResult);

      // 検証
      expect(secondaryElement).toEqual('water');
    });

    it('副次的な五行属性がない場合はundefinedを返す', () => {
      // テスト用のモックデータ（副次的属性なし）
      const mockResult = {
        elementProfile: {}
      };

      // 実行
      const secondaryElement = sajuEngineService.getSecondaryElement(mockResult);

      // 検証
      expect(secondaryElement).toBeUndefined();
    });

    it('結果オブジェクトが無効な場合はundefinedを返す', () => {
      // 無効なモックデータ
      const mockResult = {};

      // 実行
      const secondaryElement = sajuEngineService.getSecondaryElement(mockResult);

      // 検証
      expect(secondaryElement).toBeUndefined();
    });
  });
});