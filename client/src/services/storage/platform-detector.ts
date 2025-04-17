/**
 * アプリケーションの実行環境を検出するヘルパー関数
 */

/**
 * プラットフォームの種類を表す列挙型
 */
export enum PlatformType {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  ELECTRON = 'electron',
  UNKNOWN = 'unknown'
}

/**
 * Capacitorが利用可能かどうかを検出します
 * @returns Capacitorが利用可能な場合はtrue
 */
export function isCapacitorAvailable(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined';
}

/**
 * 現在のプラットフォームを検出します
 * @returns 検出されたプラットフォームの種類
 */
export function detectPlatform(): PlatformType {
  if (!isCapacitorAvailable()) {
    return PlatformType.WEB;
  }

  const capacitor = (window as any).Capacitor;
  
  if (!capacitor.isNativePlatform()) {
    return PlatformType.WEB;
  }
  
  const platform = capacitor.getPlatform();
  
  switch (platform) {
    case 'android':
      return PlatformType.ANDROID;
    case 'ios':
      return PlatformType.IOS;
    case 'electron':
      return PlatformType.ELECTRON;
    default:
      return PlatformType.UNKNOWN;
  }
}

/**
 * 現在の環境がネイティブプラットフォームかどうかを判定します
 * @returns ネイティブプラットフォームの場合はtrue
 */
export function isNativePlatform(): boolean {
  const platform = detectPlatform();
  return platform === PlatformType.ANDROID || 
         platform === PlatformType.IOS ||
         platform === PlatformType.ELECTRON;
}

/**
 * プラットフォーム情報を文字列として取得します
 * @returns プラットフォーム情報を含む文字列
 */
export function getPlatformInfo(): string {
  const platform = detectPlatform();
  const isNative = isNativePlatform();
  
  return `Platform: ${platform}, isNative: ${isNative}, Capacitor: ${isCapacitorAvailable()}`;
}