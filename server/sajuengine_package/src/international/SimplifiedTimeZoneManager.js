"use strict";
/**
 * SimplifiedTimeZoneManager.ts
 * シンプル化された時差管理クラス
 * 都道府県（または「海外」）を選択するだけで時差調整値を取得できる
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplifiedTimeZoneManager = void 0;
const fs_1 = __importDefault(require("fs"));
/**
 * シンプル化されたタイムゾーン管理クラス
 * 都道府県および海外の時差調整値を提供
 */
class SimplifiedTimeZoneManager {
    /**
     * コンストラクタ
     * @param locationsData 場所と時差調整値のデータ
     */
    constructor(locationsData) {
        this.locations = new Map();
        this.initializeLocations(locationsData);
    }
    /**
     * シングルトンインスタンス取得
     * @returns SimplifiedTimeZoneManagerのインスタンス
     */
    static getInstance() {
        if (!SimplifiedTimeZoneManager.instance) {
            SimplifiedTimeZoneManager.instance = new SimplifiedTimeZoneManager();
        }
        return SimplifiedTimeZoneManager.instance;
    }
    /**
     * 場所データの初期化
     * @param customData カスタムの場所データ（省略可）
     */
    initializeLocations(customData) {
        // デフォルトデータの設定またはカスタムデータの利用
        const data = customData || this.getDefaultLocations();
        // Mapにデータを設定
        data.forEach(loc => {
            this.locations.set(loc.name, loc.adjustment);
        });
    }
    /**
     * デフォルトの都道府県・海外データ
     * @returns 場所と時差調整値のデータ配列
     */
    getDefaultLocations() {
        return [
            { "name": "北海道", "adjustment": 25 },
            { "name": "青森県", "adjustment": 23 },
            { "name": "岩手県", "adjustment": 21 },
            { "name": "宮城県", "adjustment": 20 },
            { "name": "秋田県", "adjustment": 19 },
            { "name": "山形県", "adjustment": 19 },
            { "name": "福島県", "adjustment": 18 },
            { "name": "茨城県", "adjustment": 19 },
            { "name": "栃木県", "adjustment": 19 },
            { "name": "群馬県", "adjustment": 18 },
            { "name": "埼玉県", "adjustment": 19 },
            { "name": "千葉県", "adjustment": 19 },
            { "name": "東京都", "adjustment": 19 },
            { "name": "神奈川県", "adjustment": 19 },
            { "name": "新潟県", "adjustment": 17 },
            { "name": "富山県", "adjustment": 15 },
            { "name": "石川県", "adjustment": 14 },
            { "name": "福井県", "adjustment": 13 },
            { "name": "山梨県", "adjustment": 17 },
            { "name": "長野県", "adjustment": 16 },
            { "name": "岐阜県", "adjustment": 12 },
            { "name": "静岡県", "adjustment": 15 },
            { "name": "愛知県", "adjustment": 8 },
            { "name": "三重県", "adjustment": 6 },
            { "name": "滋賀県", "adjustment": 4 },
            { "name": "京都府", "adjustment": 3 },
            { "name": "大阪府", "adjustment": 2 },
            { "name": "兵庫県", "adjustment": 1 },
            { "name": "奈良県", "adjustment": 3 },
            { "name": "和歌山県", "adjustment": 0 },
            { "name": "鳥取県", "adjustment": -3 },
            { "name": "島根県", "adjustment": -6 },
            { "name": "岡山県", "adjustment": -4 },
            { "name": "広島県", "adjustment": -8 },
            { "name": "山口県", "adjustment": -12 },
            { "name": "徳島県", "adjustment": -1 },
            { "name": "香川県", "adjustment": -2 },
            { "name": "愛媛県", "adjustment": -7 },
            { "name": "高知県", "adjustment": -5 },
            { "name": "福岡県", "adjustment": -18 },
            { "name": "佐賀県", "adjustment": -20 },
            { "name": "長崎県", "adjustment": -21 },
            { "name": "熊本県", "adjustment": -19 },
            { "name": "大分県", "adjustment": -16 },
            { "name": "宮崎県", "adjustment": -14 },
            { "name": "鹿児島県", "adjustment": -19 },
            { "name": "沖縄県", "adjustment": -31 },
            { "name": "海外", "adjustment": 0 }
        ];
    }
    /**
     * 場所名から時差調整値を取得
     * @param locationName 場所名（都道府県名または「海外」）
     * @returns 時差調整値（分）、見つからない場合は0
     */
    getAdjustmentMinutes(locationName) {
        return this.locations.get(locationName) || 0;
    }
    /**
     * 利用可能な全ての場所を取得
     * @returns 場所名のリスト
     */
    getAllLocations() {
        return Array.from(this.locations.keys());
    }
    /**
     * 特定の地域（日本、海外など）の場所のみを取得
     * @param region 地域（例: "日本", "海外"）
     * @returns 指定した地域の場所名リスト
     */
    getLocationsByRegion(region) {
        // 「海外」は特別扱い
        if (region === "海外") {
            return ["海外"];
        }
        // それ以外（日本の都道府県）
        if (region === "日本") {
            return this.getAllLocations().filter(loc => loc !== "海外");
        }
        return [];
    }
    /**
     * 場所名から日本語の説明テキストを生成
     * @param locationName 場所名
     * @returns 説明テキスト
     */
    getLocationDescription(locationName) {
        const adjustment = this.getAdjustmentMinutes(locationName);
        if (locationName === "海外") {
            return "海外の場合は現地時間をそのまま入力してください";
        }
        const sign = adjustment >= 0 ? "+" : "";
        return `${locationName}: ${sign}${adjustment}分`;
    }
    /**
     * すべての場所情報を取得（調整値付き）
     * @returns 場所情報の配列（名前、調整値、説明、海外フラグ）
     */
    getAllLocationsWithInfo() {
        return Array.from(this.locations.keys()).map(locationName => {
            const adjustment = this.getAdjustmentMinutes(locationName);
            const description = this.getLocationDescription(locationName);
            const isOverseas = locationName === '海外';
            return {
                name: locationName,
                adjustment,
                description,
                isOverseas
            };
        });
    }
    /**
     * カテゴリ別の場所リストを取得
     * @returns カテゴリ別の場所名リスト
     */
    getLocationCategories() {
        return {
            prefectures: this.getLocationsByRegion('日本'),
            overseas: this.getLocationsByRegion('海外')
        };
    }
    /**
     * JSONファイルからの場所データ読み込み
     * @param jsonPath JSONファイルのパス
     * @returns 場所データの配列
     */
    static loadFromJsonFile(jsonPath) {
        try {
            const jsonData = fs_1.default.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(jsonData);
            if (parsed && Array.isArray(parsed.locations)) {
                return parsed.locations;
            }
            return [];
        }
        catch (error) {
            console.error('場所データの読み込みに失敗しました:', error);
            return [];
        }
    }
    /**
     * サーバーサイドでJSONファイルから初期化
     * @param jsonPath JSONファイルのパス
     * @returns SimplifiedTimeZoneManagerのインスタンス
     */
    static createFromJsonFile(jsonPath) {
        const data = SimplifiedTimeZoneManager.loadFromJsonFile(jsonPath);
        return new SimplifiedTimeZoneManager(data);
    }
}
exports.SimplifiedTimeZoneManager = SimplifiedTimeZoneManager;
//# sourceMappingURL=SimplifiedTimeZoneManager.js.map