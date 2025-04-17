// ストレージサービスの型定義とインターフェース
export * from './storage.interface';

// ストレージサービスの実装
export * from './capacitor-storage.service';
export * from './web-storage.service';

// プラットフォーム検出ユーティリティ
export * from './platform-detector';

// ストレージサービスのファクトリ
export * from './storage-factory';

// デフォルトのストレージサービスを提供
import storageService from './storage-factory';
export default storageService;