# ローディング画面実装計画書

## 概要

本文書は「DailyFortuneNative2」アプリケーションにおけるAI関連機能のローディング画面実装計画について詳述するものです。ユーザーエクスペリエンスを向上させるため、ClaudeAI APIリクエスト中にローディング画面を表示し、運勢に関する豆知識や興味深い情報をユーザーに提供します。

## 1. 実装対象の機能とファイル

### 1.1 運勢生成・表示機能
- **該当ファイル**: 
  - `/client/src/pages/Fortune/index.tsx` (メイン運勢ページ)
  - `/client/src/components/fortune/FortuneLoadingScreen.tsx` (既存のローディングコンポーネント)
- **APIエンドポイント**: `FORTUNE.UPDATE_FORTUNE`, `FORTUNE.GET_DAILY_FORTUNE`
- **サービス**: `fortuneService.generateFortune()`, `fortuneService.getDailyFortune()`
- **所要時間**: 約5-15秒 (AI生成処理を含む)
- **既存実装状況**: `FortuneLoadingScreen`コンポーネントは既に実装されており、`tips`、`animation`、`quotes`モードを持っています。

### 1.2 チームコンテキスト運勢機能
- **該当ファイル**:
  - `/client/src/pages/Team/Advice.tsx`
  - `/client/src/components/fortune/TeamContextFortuneCard.tsx`
- **APIエンドポイント**: `FORTUNE.GET_TEAM_CONTEXT_FORTUNE`
- **サービス**: `fortuneService.getTeamContextFortune()`
- **所要時間**: 約10-15秒 (AI生成処理を含む)
- **現状の実装**: 簡易的な`CircularProgress`のみが表示されており、エンハンスが必要

### 1.3 メンバーカルテ生成・表示機能
- **該当ファイル**:
  - `/client/src/components/team/MemberCardView.tsx`
  - `/client/src/components/team/TeamMembersList.tsx`
- **APIエンドポイント**: `TEAM.GET_MEMBER_CARD`
- **サービス**: `teamService.getMemberCard()`
- **所要時間**: 約5-20秒 (初回生成時はAI処理を含むため長時間)
- **現状の実装**: シンプルな`CircularProgress`とテキストメッセージのみ。ポーリング機構は実装済み。

### 1.4 ハーモニーコンパス生成
- **該当ファイル**:
  - `/client/src/components/profile/HarmonyCompass.tsx`
  - `/client/src/pages/Profile/index.tsx`
- **APIエンドポイント**: `USER.GET_PROFILE`
- **サービス**: ハーモニーコンパスは`HarmonyCompass`コンポーネントで表示
- **所要時間**: ユーザープロファイル取得時に含まれるため、単独での時間は短い (約2-3秒)
- **現状の実装**: 単純なローディング表示

### 1.5 チーム相性分析 (友達/チームメンバー相性)
- **該当ファイル**:
  - `/client/src/pages/Team/Aisyou.tsx`
  - `/client/src/components/friend/CompatibilityModal.tsx`
- **APIエンドポイント**: `FRIENDS.COMPATIBILITY`, `TEAM.GET_TEAM_COMPATIBILITY`
- **サービス**: `friendService.getCompatibilityScore()`, `teamService.getTeamCompatibility()`
- **所要時間**: 約5-8秒 (リアルタイム生成の場合)
- **現状の実装**: `CircularProgress`コンポーネントのみ

### 1.6 AIアドバイス生成 (チャット)
- **該当ファイル**:
  - `/client/src/pages/Chat/index.tsx`
  - `/client/src/components/chat/ChatContainer.tsx`
- **APIエンドポイント**: `CHAT.SEND_MESSAGE`
- **サービス**: `chatService.sendMessage()`
- **所要時間**: 可変 (5-30秒、ストリーミングベース)
- **現状の実装**: ストリーミングベースのため、アニメーション表示が既にされている。この機能は除外します。

## 2. 実装方針

### 2.1 共通コンポーネント設計

現在の `FortuneLoadingScreen` コンポーネントをベースに、以下の改善を行います：

1. **汎用AIローディングコンポーネント**
   - 名称: `AILoadingScreen` 
   - 場所: `/client/src/components/common/AILoadingScreen.tsx`
   - 機能: 
     - 複数のローディングタイプの表示（デフォルトはtips表示のみ）
     - ローディング時間の予測と進捗表示
     - カスタマイズ可能な豆知識カテゴリ
     - シンプルな表示モードのサポート

2. **豆知識データベースの拡充と構造化**
   - 場所: `/client/src/data/tips-database.ts`
   - カテゴリ別の構造化:
     - 四柱推命 (`fortune`)
     - 五行関連 (`elements`)
     - 相性情報 (`compatibility`)
     - チーム運勢 (`team`)
     - カルテ関連 (`membercard`)
     - 全般 (`general`)
   - 30-50項目のヒントを用意

3. **使用場所別のカスタマイズ**
   - 機能別に最適なメッセージとデザインを提供
   - コンテキスト情報を表示（例：「チーム運勢を計算中...」）
   - モバイル最適化されたレイアウト
   - 長時間処理（メンバーカルテ生成など）向けの進捗表示と予測時間

### 2.2 コンポーネントインターフェース設計

```typescript
interface AILoadingScreenProps {
  // 基本設定
  isLoading: boolean;  // ローディング状態
  loadingText?: string; // メインローディングテキスト
  onComplete?: () => void; // ローディング完了時のコールバック
  
  // 表示設定
  type?: 'tips' | 'simple'; // 表示タイプ
  category?: 'fortune' | 'elements' | 'compatibility' | 'team' | 'membercard' | 'general'; // 豆知識カテゴリ
  customTips?: string[]; // カスタム豆知識（指定する場合はこちらを優先）
  
  // 進捗表示設定
  showProgress?: boolean; // 進捗バーの表示
  estimatedTime?: number; // 予想所要時間（秒）
  simulateProgress?: boolean; // 進捗シミュレーション
  pollingActive?: boolean; // ポーリング中かどうか（メンバーカルテ生成など）
  
  // スタイル設定
  variant?: 'card' | 'overlay' | 'inline'; // 表示スタイル
  sx?: SxProps; // MUI sx props
}
```

### 2.3 新コンポーネント実装

```tsx
// AILoadingScreen.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { tipsByCategory } from '../../data/tips-database';

const AILoadingScreen: React.FC<AILoadingScreenProps> = ({
  isLoading,
  loadingText = "読み込み中...",
  onComplete,
  type = 'tips',
  category = 'general',
  customTips,
  showProgress = true,
  estimatedTime = 10,
  simulateProgress = true,
  pollingActive = false,
  variant = 'card',
  sx,
}) => {
  // 実装詳細
  // ...

  return (
    // コンポーネントのレンダリング
    // ...
  );
};

export default AILoadingScreen;
```

## 3. 機能別の実装計画

### 3.1 運勢生成・表示機能

1. **既存の`FortuneLoadingScreen`を改修**
   - `AILoadingScreen`コンポーネントに移行
   - デフォルト表示を「tips」モードに
   - 運勢関連のヒントを表示

2. **実装箇所**
   ```tsx
   // /client/src/pages/Fortune/index.tsx の修正
   
   {loading ? (
     <AILoadingScreen 
       isLoading={loading}
       loadingText={refreshing ? "運勢情報を生成中..." : "運勢データを読み込み中..."}
       type="tips"
       category="fortune"
       estimatedTime={refreshing ? 15 : 8}
     />
   ) : (
     // 運勢コンテンツ表示
   )}
   ```

### 3.2 チームコンテキスト運勢機能

1. **チームアドバイスページの改修**
   ```tsx
   // /client/src/pages/Team/Advice.tsx の修正
   
   {loading ? (
     <AILoadingScreen 
       isLoading={loading}
       loadingText="チーム運勢を分析中..."
       type="tips"
       category="team"
       estimatedTime={12}
       variant="overlay"
     />
   ) : (
     // チーム運勢コンテンツ表示
   )}
   ```

### 3.3 メンバーカルテ生成・表示機能

1. **メンバーカルテビュー改修**
   ```tsx
   // /client/src/components/team/MemberCardView.tsx の修正
   
   const renderContent = () => {
     if (loading && !generating) {
       return (
         <AILoadingScreen 
           isLoading={loading}
           loadingText="カルテ情報を読み込み中..."
           type="tips"
           category="membercard"
           estimatedTime={3}
           variant={isDialog ? 'inline' : 'card'}
         />
       );
     }
     
     if (generating) {
       return (
         <AILoadingScreen 
           isLoading={true}
           loadingText="カルテを生成中です"
           type="tips"
           category="membercard"
           estimatedTime={20}
           pollingActive={true}
           variant={isDialog ? 'inline' : 'card'}
           simulateProgress={false}
         />
       );
     }
     
     // 以下は既存のコード
   }
   ```

### 3.4 ハーモニーコンパス生成

1. **プロファイル詳細ローディング表示の実装**
   ```tsx
   // /client/src/components/profile/HarmonyCompass.tsx の修正
   
   if (loading) {
     return (
       <AILoadingScreen 
         isLoading={loading}
         loadingText="調和コンパスを生成中..."
         type="tips"
         category="elements"
         estimatedTime={5}
         variant="inline"
       />
     );
   }
   ```

### 3.5 チーム相性分析

1. **相性詳細モーダルの改修**
   ```tsx
   // /client/src/pages/Team/Aisyou.tsx の修正
   
   <DialogContent dividers>
     {dialogLoading ? (
       <AILoadingScreen 
         isLoading={dialogLoading}
         loadingText="相性分析を実行中..."
         type="tips"
         category="compatibility"
         estimatedTime={8}
         variant="inline"
       />
     ) : compatibility ? (
       // 相性詳細表示
     ) : (
       // エラーメッセージ
     )}
   </DialogContent>
   ```

## 4. 豆知識データベースの実装

新規ファイル `/client/src/data/tips-database.ts` に以下のように実装します：

```typescript
// 四柱推命関連のヒント
export const fortuneTips = [
  // 既存の10件
  "四柱推命では、生年月日時から「天干」と「地支」を導き出します。",
  "五行説では、「木・火・土・金・水」の五つの要素でバランスを考えます。",
  // 追加20件...
];

// 五行関連のヒント
export const elementTips = [
  "「木」の特性は成長と柔軟性です。新しいアイデアや創造性に関連します。",
  "「火」は変化と情熱を表します。コミュニケーションやリーダーシップに関わります。",
  // 追加20件...
];

// 相性関連のヒント
export const compatibilityTips = [
  "五行の相生関係は「木→火→土→金→水→木」と循環します。",
  "相互補完的な五行を持つ人々は効果的なチームを形成できます。",
  // 追加20件...
];

// チーム運勢関連のヒント
export const teamTips = [
  "チーム内で五行バランスが取れていると、多様な視点が生まれます。",
  "リーダーの日柱の性質は、チーム全体の方向性に影響を与えることがあります。",
  // 追加20件...
];

// メンバーカルテ関連のヒント
export const membercardTips = [
  "メンバーカルテは、個人の五行特性を元にした強みと課題を示します。",
  "カルテの情報を活用することで、チーム内での最適な役割分担ができます。",
  "四柱推命の結果は、自己理解と他者理解を深めるツールとして活用できます。",
  "カルテの内容は定期的に更新されます。個人の成長に合わせて変化する点に注目しましょう。",
  "メンバーカルテは絶対的な性格診断ではなく、ひとつの視点として活用するのが理想的です。",
  // 追加15件...
];

// 一般的なヒント
export const generalTips = [
  "自分の特性を理解することで、長所を活かした選択ができるようになります。",
  "定期的に運勢をチェックすることで、その日に適した活動を選べます。",
  // 追加10件...
];

// カテゴリ別にエクスポート
export const tipsByCategory = {
  fortune: fortuneTips,
  elements: elementTips,
  compatibility: compatibilityTips,
  team: teamTips,
  membercard: membercardTips,
  general: generalTips,
};
```

## 5. 実装工程

### 5.1 フェーズ1: 基本コンポーネント作成（3時間）
1. `AILoadingScreen`コンポーネントの作成
2. 豆知識データベースの作成と実装
3. 基本的なアニメーションとスタイル実装

### 5.2 フェーズ2: 運勢機能実装（2時間）
1. 運勢ページのローディング画面を新コンポーネントに置き換え
2. チームコンテキスト運勢ページへの組み込み
3. テスト実行と動作確認

### 5.3 フェーズ3: メンバーカルテ機能実装（2時間）
1. メンバーカルテビューへの組み込み
2. ポーリング状態との連携実装
3. テスト実行と動作確認

### 5.4 フェーズ4: ハーモニーコンパス・相性分析実装（2時間）
1. プロファイル関連ページへの組み込み
2. 相性分析ページへの組み込み
3. テスト実行と動作確認

### 5.5 フェーズ5: 最終調整とテスト（1時間）
1. モバイル環境での総合テスト
2. パフォーマンス最適化
3. コードレビューと微調整

## 6. パフォーマンス最適化

1. **リソース最適化**
   - アニメーションはCSS主体に実装
   - 不要なre-renderを避ける（React.memo、useMemoの活用）
   - 軽量なSVGアイコンを使用

2. **モバイル対応**
   - タッチ対応のインタラクション
   - ネイティブのinsetプロパティを使用したセーフエリア対応
   - モバイル向けスタイル調整（フォントサイズ、余白など）

3. **オフライン対応**
   - オフライン時のフォールバック表示を実装
   - エラー発生時の適切なリカバリー

## 7. 最終成果物

1. **作成ファイル**
   - `/client/src/components/common/AILoadingScreen.tsx`
   - `/client/src/data/tips-database.ts`

2. **修正ファイル**
   - `/client/src/pages/Fortune/index.tsx`
   - `/client/src/pages/Team/Advice.tsx`
   - `/client/src/components/team/MemberCardView.tsx`
   - `/client/src/components/profile/HarmonyCompass.tsx`
   - `/client/src/pages/Team/Aisyou.tsx`
   - `/client/src/components/friend/CompatibilityModal.tsx`

## 8. テスト・検証計画

1. **機能テスト**
   - 各APIエンドポイントの呼び出しシナリオでのローディング表示確認
   - 進捗バーの表示と完了後の切り替わり確認
   - カテゴリ別のヒント表示確認
   - ポーリング状態での長時間ローディング表示確認（特にメンバーカルテ生成）

2. **デバイステスト**
   - iOS/Androidでの表示確認
   - 画面サイズ別のレイアウト確認
   - タッチ操作の確認

3. **エラー処理テスト**
   - ネットワークエラー時の表示確認
   - タイムアウト時の挙動確認
   - 途中キャンセル時の挙動確認

## 9. ローディング画面の表示場所まとめ

| 機能 | ファイル | API呼び出し | 予想時間 | 実装優先度 |
|-----|---------|------------|---------|----------|
| 運勢生成 | `/client/src/pages/Fortune/index.tsx` | `fortuneService.generateFortune()` | 15秒 | 高 |
| 運勢取得 | `/client/src/pages/Fortune/index.tsx` | `fortuneService.getDailyFortune()` | 5秒 | 高 |
| チームコンテキスト運勢 | `/client/src/pages/Team/Advice.tsx` | `fortuneService.getTeamContextFortune()` | 12秒 | 高 |
| メンバーカルテ生成 | `/client/src/components/team/MemberCardView.tsx` | `teamService.getMemberCard()` | 20秒 | 高 |
| メンバーカルテ表示 | `/client/src/components/team/MemberCardView.tsx` | `teamService.getMemberCard()` | 3秒 | 高 |
| ハーモニーコンパス表示 | `/client/src/components/profile/HarmonyCompass.tsx` | User Profile内 | 5秒 | 中 |
| 相性分析表示 | `/client/src/pages/Team/Aisyou.tsx` | `friendService.getCompatibilityScore()` | 8秒 | 中 |
| AIチャット | `/client/src/pages/Chat/index.tsx` | `chatService.sendMessage()` | 変動 | 対象外 |