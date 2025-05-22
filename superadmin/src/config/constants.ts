// API エンドポイント設定
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Univerpay 設定
export const UNIVERPAY_TEST_MODE = true; // 開発環境ではテストモードを使用

// 美姫命 カラーパレット
export const BEAUTY_COLORS = {
  primary: '#FF6B98',
  primaryLight: '#FFC0D0',
  primaryDark: '#CF4570',
  secondary: '#673AB7',
  secondaryLight: '#D1C4E9',
  secondaryDark: '#512DA8',
  success: '#66BB6A',
  error: '#F44336',
  warning: '#FFC107',
  info: '#90CAF9',
  background: '#FAFAFA',
  paper: '#FFFFFF',
  textPrimary: '#424242',
  textSecondary: '#757575',
};

// プラン設定
export const DEFAULT_PLANS = [
  {
    id: 'basic',
    name: 'ベーシック',
    price: 9800,
    tokenAllocation: 1000,
    features: [
      '月間1,000トークン',
      '最大5名のスタイリスト',
      '基本的な顧客管理',
      'メール・電話サポート',
    ],
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: 19800,
    tokenAllocation: 3000,
    features: [
      '月間3,000トークン',
      '最大15名のスタイリスト',
      '顧客管理（詳細プロファイル付き）',
      '予約管理システム',
      'メール・電話・チャットサポート',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアム',
    price: 39800,
    tokenAllocation: 8000,
    features: [
      '月間8,000トークン',
      '無制限のスタイリスト',
      '高度な顧客管理・分析',
      '予約管理システム（高度な機能付き）',
      '優先サポート（専任担当者）',
      'カスタムレポート',
    ],
  }
];