/**
 * SimplifiedDateTimeProcessor.ts
 * 簡略化された日時処理クラス
 * 都道府県（または「海外」）を選択するだけで時差調整値を適用
 */
import { SimplifiedTimeZoneManager } from './SimplifiedTimeZoneManager';
/**
 * シンプルな日時データ型
 */
export interface SimpleDateTime {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
}
/**
 * 簡略化された処理済み日時データ
 */
export interface SimplifiedProcessedDateTime {
    originalDate: Date;
    simpleDate: SimpleDateTime;
    adjustedDate: SimpleDateTime;
    locationName: string;
    adjustment: number;
}
/**
 * 簡略化された日時処理クラス
 */
export declare class SimplifiedDateTimeProcessor {
    private timeZoneManager;
    private static instance;
    /**
     * コンストラクタ
     * @param timeZoneManager 時差管理クラス
     */
    constructor(timeZoneManager?: SimplifiedTimeZoneManager);
    /**
     * シングルトンインスタンス取得
     * @returns SimplifiedDateTimeProcessorのインスタンス
     */
    static getInstance(): SimplifiedDateTimeProcessor;
    /**
     * 日時を処理して四柱推命計算用の情報を取得（簡略化版）
     * @param date 日付オブジェクト
     * @param hourWithMinutes 時間（分を含む小数表現も可）
     * @param locationName 場所名（都道府県名または「海外」）
     * @returns 処理済み日時情報
     */
    processDateTime(date: Date, hourWithMinutes: number, locationName: string): SimplifiedProcessedDateTime;
    /**
     * Date型とhourWithMinutesからSimpleDateTimeを作成
     */
    private createSimpleDateTime;
    /**
     * 日時を調整（地方時調整）
     * @param dateTime シンプル日時
     * @param adjustmentMinutes 地方時調整（分単位）
     * @returns 調整済み日時
     */
    private adjustDateTime;
    /**
     * 全ての場所（都道府県と海外）の一覧を取得
     */
    getAllLocations(): string[];
    /**
     * 日本の都道府県のみの一覧を取得
     */
    getJapanesePrefectures(): string[];
    /**
     * 場所の説明文を取得（例: "東京都: +19分"）
     */
    getLocationDescription(locationName: string): string;
}
