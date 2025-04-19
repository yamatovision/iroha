/**
 * SimplifiedTimeZoneManager.ts
 * シンプル化された時差管理クラス
 * 都道府県（または「海外」）を選択するだけで時差調整値を取得できる
 */
/**
 * 場所データの型定義
 */
export interface LocationData {
    name: string;
    adjustment: number;
}
/**
 * シンプル化されたタイムゾーン管理クラス
 * 都道府県および海外の時差調整値を提供
 */
export declare class SimplifiedTimeZoneManager {
    private locations;
    private static instance;
    /**
     * コンストラクタ
     * @param locationsData 場所と時差調整値のデータ
     */
    constructor(locationsData?: LocationData[]);
    /**
     * シングルトンインスタンス取得
     * @returns SimplifiedTimeZoneManagerのインスタンス
     */
    static getInstance(): SimplifiedTimeZoneManager;
    /**
     * 場所データの初期化
     * @param customData カスタムの場所データ（省略可）
     */
    private initializeLocations;
    /**
     * デフォルトの都道府県・海外データ
     * @returns 場所と時差調整値のデータ配列
     */
    private getDefaultLocations;
    /**
     * 場所名から時差調整値を取得
     * @param locationName 場所名（都道府県名または「海外」）
     * @returns 時差調整値（分）、見つからない場合は0
     */
    getAdjustmentMinutes(locationName: string): number;
    /**
     * 利用可能な全ての場所を取得
     * @returns 場所名のリスト
     */
    getAllLocations(): string[];
    /**
     * 特定の地域（日本、海外など）の場所のみを取得
     * @param region 地域（例: "日本", "海外"）
     * @returns 指定した地域の場所名リスト
     */
    getLocationsByRegion(region: string): string[];
    /**
     * 場所名から日本語の説明テキストを生成
     * @param locationName 場所名
     * @returns 説明テキスト
     */
    getLocationDescription(locationName: string): string;
    /**
     * すべての場所情報を取得（調整値付き）
     * @returns 場所情報の配列（名前、調整値、説明、海外フラグ）
     */
    getAllLocationsWithInfo(): Array<{
        name: string;
        adjustment: number;
        description: string;
        isOverseas: boolean;
    }>;
    /**
     * カテゴリ別の場所リストを取得
     * @returns カテゴリ別の場所名リスト
     */
    getLocationCategories(): {
        prefectures: string[];
        overseas: string[];
    };
    /**
     * JSONファイルからの場所データ読み込み
     * @param jsonPath JSONファイルのパス
     * @returns 場所データの配列
     */
    static loadFromJsonFile(jsonPath: string): LocationData[];
    /**
     * サーバーサイドでJSONファイルから初期化
     * @param jsonPath JSONファイルのパス
     * @returns SimplifiedTimeZoneManagerのインスタンス
     */
    static createFromJsonFile(jsonPath: string): SimplifiedTimeZoneManager;
}
