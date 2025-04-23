# ローディング画面実装計画書（リファクタリング版）

## 概要

本文書は「DailyFortuneNative2」アプリケーションにおけるAI関連機能のローディング画面実装計画について詳述するものです。ユーザーエクスペリエンスを向上させるため、ClaudeAI APIリクエスト中にローディング画面を表示し、運勢に関する豆知識や興味深い情報をユーザーに提供します。さらに、背景画面が透けて見える半透明オーバーレイ方式を採用し、コンテキストの維持と視覚的な洗練さを両立させます。本リファクタリング版では単一責任の原則と最小限のコードで最大限の効果を発揮することを目指します。

## 1. 実装対象の機能とファイル

### 1.1 運勢生成・表示機能
- **該当ファイル**: 
  - `/client/src/pages/Fortune/index.tsx` (メイン運勢ページ)
  - `/client/src/components/fortune/FortuneLoadingScreen.tsx` (既存のローディングコンポーネント)
- **APIエンドポイント**: `FORTUNE.UPDATE_FORTUNE`, `FORTUNE.GET_DAILY_FORTUNE`
- **サービス**: `fortuneService.generateFortune()`, `fortuneService.getDailyFortune()`
- **所要時間**: 約5-15秒 (AI生成処理を含む)
- **既存実装状況**: FortuneLoadingScreenは確認できませんでした。各ページで個別に実装されています。

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

## 2. リファクタリング方針

### 2.1 現状分析とリファクタリングの必要性

現在の計画では、2つの別々のコンポーネント：
1. `TransparentLoadingOverlay` - 背景透過型オーバーレイ
2. `AILoadingScreen` - 豆知識表示型ローディング

を作成する予定でしたが、これらは以下の問題点があります：

- **重複コード**: 両方のコンポーネントで同様のローディング表示ロジックを実装
- **責任の分散**: ローディング表示という単一の責任が複数のコンポーネントに分散
- **選択の複雑さ**: 開発者がどちらのコンポーネントを使うべきか判断が必要
- **メンテナンスの負担**: 2つのコンポーネントを別々に維持する必要がある

また、既存の`NetworkStatusOverlay`コンポーネントと構造や機能が類似しており、知見を活用できる余地があります。

### 2.2 統合コンポーネントの設計

リファクタリング後は、1つの統合されたコンポーネントに責任を集約します：

- **名称**: `LoadingOverlay`
- **場所**: `/client/src/components/common/LoadingOverlay.tsx`
- **原則**: 
  - 単一責任 - ローディング状態の表示のみを担当
  - 柔軟性 - 様々な表示オプションと機能を1つのコンポーネントで提供
  - 再利用性 - アプリケーション全体で一貫して使用できる設計

### 2.3 コンポーネントインターフェース設計

```typescript
interface LoadingOverlayProps {
  // 必須
  isLoading: boolean;
  
  // 表示方法の制御
  variant?: 'transparent' | 'opaque';
  opacity?: number;
  blurEffect?: boolean;
  
  // 表示コンテンツの制御
  contentType?: 'simple' | 'tips' | 'quotes';
  message?: string;
  category?: TipCategory; // 'fortune' | 'elements' | 'compatibility' | 'team' | 'membercard' | 'general'
  
  // 進捗表示
  showProgress?: boolean;
  estimatedTime?: number;
  simulateProgress?: boolean;
  
  // その他
  zIndex?: number;
  children?: React.ReactNode;
  
  // イベントハンドラ
  onComplete?: () => void;
}
```

### 2.4 データ管理の改善

豆知識データも責任分離の原則に基づいてリファクタリングします：

```
/client/src/data/tips/
  ├── index.ts           # メインエクスポート
  ├── fortune-tips.ts    # 運勢関連のヒント
  ├── element-tips.ts    # 五行関連のヒント
  ├── compatibility-tips.ts  # 相性関連のヒント
  ├── team-tips.ts       # チーム関連のヒント
  ├── membercard-tips.ts # カルテ関連のヒント
  └── general-tips.ts    # 一般的なヒント
```

これにより：
- ファイルが小さく管理しやすくなる
- カテゴリ毎に独立して追加・編集できる
- 関心の分離が明確になる
- 将来的な拡張が容易になる

## 3. 統合コンポーネントの実装

```tsx
// LoadingOverlay.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress, useTheme, alpha } from '@mui/material';
import { tipsByCategory, TipCategory } from '../../data/tips';

interface LoadingOverlayProps {
  // ロード状態（必須）
  isLoading: boolean;
  
  // 表示設定
  variant?: 'transparent' | 'opaque';
  contentType?: 'simple' | 'tips' | 'quotes';
  message?: string;
  category?: TipCategory;
  
  // 透過設定
  opacity?: number;
  blurEffect?: boolean;
  
  // 進捗表示
  showProgress?: boolean;
  estimatedTime?: number;
  simulateProgress?: boolean;
  
  // その他
  zIndex?: number;
  children?: React.ReactNode;
  onComplete?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  variant = 'transparent',
  contentType = 'simple',
  message = 'Loading...',
  category = 'general',
  opacity = 0.7,
  blurEffect = true,
  showProgress = false,
  estimatedTime = 10,
  simulateProgress = true,
  zIndex = 1000,
  children,
  onComplete
}) => {
  const theme = useTheme();
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // 現在のカテゴリーのヒント配列を取得
  const tips = useMemo(() => tipsByCategory[category], [category]);
  
  // 豆知識を一定間隔で切り替え
  useEffect(() => {
    if (!isLoading || contentType !== 'tips') return;
    
    const intervalId = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);
    
    return () => clearInterval(intervalId);
  }, [isLoading, contentType, tips]);
  
  // 進捗バーのシミュレーション
  useEffect(() => {
    if (!isLoading || !showProgress || !simulateProgress) {
      setProgress(0);
      return;
    }
    
    const interval = (estimatedTime * 1000) / 100;
    let currentProgress = 0;
    
    const intervalId = setInterval(() => {
      currentProgress += 1;
      if (currentProgress >= 100) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
      setProgress(currentProgress);
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [isLoading, showProgress, estimatedTime, simulateProgress, onComplete]);
  
  // ローディング中でなければ子要素のみ表示
  if (!isLoading) {
    return <>{children}</>;
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* 子要素を表示 */}
      {variant === 'transparent' && children}
      
      {/* オーバーレイ */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: zIndex,
          backgroundColor: variant === 'transparent' 
            ? alpha(theme.palette.background.default, opacity)
            : theme.palette.background.default,
          backdropFilter: blurEffect && variant === 'transparent' ? 'blur(4px)' : 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {/* ローディングコンテンツ */}
        <Box
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, variant === 'transparent' ? 0.8 : 1),
            borderRadius: '16px',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows[4],
            maxWidth: '90%',
            width: contentType === 'simple' ? 'auto' : '400px',
            minWidth: contentType === 'simple' ? '200px' : '300px',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* ローディングインジケータ */}
          <CircularProgress size={56} thickness={4} color="primary" />
          
          {/* メッセージ表示 */}
          {contentType === 'simple' && message && (
            <Typography 
              variant="h6" 
              sx={{ mt: 2, fontWeight: 'medium', textAlign: 'center' }}
            >
              {message}
            </Typography>
          )}
          
          {/* 豆知識表示 */}
          {contentType === 'tips' && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                豆知識
              </Typography>
              <Box sx={{ 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Typography variant="body2" color="text.secondary">
                  {tips[tipIndex]}
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* 進捗バー */}
          {showProgress && (
            <Box 
              sx={{ 
                width: '100%', 
                mt: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
              }}
            >
              <Box sx={{ width: '90%', height: '4px', bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: '2px' }}>
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: `${progress}%`, 
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '2px',
                    transition: 'width 0.3s ease-in-out'
                  }} 
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 1 }}>
                {progress}% 完了
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(LoadingOverlay);
```

## 4. データ管理の実装

```tsx
// /client/src/data/tips/index.ts
import { fortuneTips } from './fortune-tips';
import { elementTips } from './element-tips';
import { compatibilityTips } from './compatibility-tips';
import { teamTips } from './team-tips';
import { membercardTips } from './membercard-tips';
import { generalTips } from './general-tips';

export const tipsByCategory = {
  fortune: fortuneTips,
  elements: elementTips,
  compatibility: compatibilityTips,
  team: teamTips,
  membercard: membercardTips,
  general: generalTips,
};

export type TipCategory = keyof typeof tipsByCategory;
```

例として、1つのヒントファイル：

```tsx
// /client/src/data/tips/fortune-tips.ts
export const fortuneTips = [
  "四柱推命では、生年月日時から「天干」と「地支」を導き出します。",
  "五行説では、「木・火・土・金・水」の五つの要素でバランスを考えます。",
  "「運勢」という言葉は、「運」と「勢い」の組み合わせに由来します。",
  "日本の占いは、中国から伝わった陰陽五行説を元にしています。",
  "運命の流れを表す「大運」は、人生全体を方向づける重要な要素です。",
  "「日柱」は、あなたの性格や運勢の中心となる重要な柱です。",
  "金の陰は、真実を見極める力に優れています。",
  "水の陽は、優れた知性と柔軟性を持つ特徴があります。",
  "命式のバランスは、健康や人間関係にも影響を与えます。",
  "縁の深い人同士は、命式の相性にも特徴が現れます。",
  // 追加ヒントをここに追加...
];
```

## 5. 機能別の実装計画（リファクタリング版）

### 5.1 運勢生成・表示機能

```tsx
// /client/src/pages/Fortune/index.tsx の修正

{loading ? (
  <LoadingOverlay 
    isLoading={loading}
    variant="transparent"
    contentType={refreshing ? "tips" : "simple"}
    message={refreshing ? "運勢情報を生成中..." : "運勢データを読み込み中..."}
    category="fortune"
    showProgress={refreshing}
    estimatedTime={refreshing ? 15 : 8}
  >
    <FortuneContent /> {/* 背景として表示される通常コンテンツ */}
  </LoadingOverlay>
) : (
  <FortuneContent />
)}
```

### 5.2 チームコンテキスト運勢機能

```tsx
// /client/src/pages/Team/Advice.tsx の修正

{loading ? (
  <LoadingOverlay 
    isLoading={loading}
    variant="transparent"
    contentType="tips"
    message="チーム運勢を分析中..."
    category="team"
    opacity={0.75}
    showProgress={true}
    estimatedTime={12}
  >
    {teamData && <TeamContextFortuneCard fortune={teamData} />}
  </LoadingOverlay>
) : (
  <TeamContextFortuneCard fortune={teamData} />
)}
```

### 5.3 メンバーカルテ生成・表示機能

```tsx
// /client/src/components/team/MemberCardView.tsx の修正

const renderContent = () => {
  if (loading && !generating) {
    return (
      <LoadingOverlay 
        isLoading={loading}
        variant="transparent"
        contentType="simple"
        message="カルテ情報を読み込み中..."
        opacity={0.7}
      >
        {memberCard && <MemberCardContent data={memberCard} />}
      </LoadingOverlay>
    );
  }
  
  if (generating) {
    return (
      <LoadingOverlay 
        isLoading={true}
        variant="opaque"
        contentType="tips"
        message="カルテを生成中です"
        category="membercard"
        showProgress={true}
        estimatedTime={20}
        simulateProgress={false}
      />
    );
  }
  
  // 以下は既存のコード
}
```

### 5.4 ハーモニーコンパス生成

```tsx
// /client/src/components/profile/HarmonyCompass.tsx の修正

if (loading) {
  return (
    <LoadingOverlay 
      isLoading={loading}
      variant="transparent"
      contentType="simple"
      message="調和コンパスを生成中..."
      opacity={0.6}
      blurEffect={true}
    >
      {compassData && <CompassContent data={compassData} />}
    </LoadingOverlay>
  );
}
```

### 5.5 チーム相性分析

```tsx
// /client/src/pages/Team/Aisyou.tsx の修正

<DialogContent dividers>
  {dialogLoading ? (
    <LoadingOverlay 
      isLoading={dialogLoading}
      variant="transparent"
      contentType="tips"
      message="相性分析を実行中..."
      category="compatibility"
      opacity={0.7}
      showProgress={true}
      estimatedTime={8}
    >
      {compatibility && <CompatibilityContent data={compatibility} />}
    </LoadingOverlay>
  ) : (compatibility ? (
    <CompatibilityContent data={compatibility} />
  ) : (
    // エラーメッセージ
  ))}
</DialogContent>
```

## 6. リファクタリングのメリット

1. **コード量の削減**: 
   - 2つのコンポーネント → 1つのコンポーネントに統合
   - 重複するロジックを排除
   - 推定コード削減量: 約30%

2. **単一責任の徹底**: 
   - ローディング表示という明確な単一の責任を持つ
   - 表示方法(variant)と表示内容(contentType)を分離

3. **保守性の向上**:
   - 1つのコンポーネントのみのメンテナンスが必要
   - 機能追加や変更が1箇所で完結

4. **一貫性の向上**:
   - アプリケーション全体で統一されたローディングUX
   - コンポーネント選択の混乱がなくなる

5. **拡張性の向上**:
   - 新しい表示バリエーションやオプションを容易に追加可能
   - 豆知識データの管理が容易になる

6. **テストの容易さ**:
   - 単一コンポーネントのみのテストで済む
   - テストケースの網羅性が向上

## 7. 実装工程（リファクタリング版）

### 7.1 フェーズ1: 基本コンポーネント作成（3時間）
1. `LoadingOverlay`コンポーネントの作成
2. 豆知識データベースの構造化と実装
3. 基本的なアニメーションとスタイル実装

### 7.2 フェーズ2: 各機能への統合（3時間）
1. 運勢ページへの統合
2. チームコンテキスト運勢ページへの統合
3. メンバーカルテビューへの統合
4. ハーモニーコンパスとチーム相性分析への統合
5. テスト実行と動作確認

### 7.3 フェーズ3: パフォーマンス最適化とテスト（2時間）
1. メモ化とパフォーマンス最適化
2. モバイル環境でのテスト
3. コードレビューと微調整

## 8. パフォーマンス最適化

1. **リソース最適化**
   - `React.memo`による不要な再レンダリングの防止
   - `useMemo`によるメモ化の活用
   - レンダリングの最適化（条件付きレンダリングの早期リターン）

2. **モバイル対応**
   - タッチ対応のインタラクション
   - ネイティブのinsetプロパティを使用したセーフエリア対応
   - モバイル向けスタイル調整（フォントサイズ、余白など）

3. **レスポンシブ設計**
   - 画面サイズに応じたコンテンツサイズの調整
   - 異なるデバイスでの見栄えの最適化

4. **アクセシビリティ対応**
   - 適切なARIAロールとプロパティの設定
   - キーボードナビゲーションのサポート

## 9. 最終成果物

1. **作成ファイル**
   - `/client/src/components/common/LoadingOverlay.tsx`
   - `/client/src/data/tips/index.ts`
   - `/client/src/data/tips/fortune-tips.ts`（他のカテゴリファイルも同様）

2. **修正ファイル**
   - `/client/src/pages/Fortune/index.tsx`
   - `/client/src/pages/Team/Advice.tsx`
   - `/client/src/components/team/MemberCardView.tsx`
   - `/client/src/components/profile/HarmonyCompass.tsx`
   - `/client/src/pages/Team/Aisyou.tsx`
   - `/client/src/components/friend/CompatibilityModal.tsx`

## 10. ローディング画面の表示場所まとめ

| 機能 | ファイル | API呼び出し | 予想時間 | 実装設定 | 優先度 |
|-----|---------|------------|---------|---------|------|
| 運勢生成 | `/client/src/pages/Fortune/index.tsx` | `fortuneService.generateFortune()` | 15秒 | transparent + tips | 高 |
| 運勢取得 | `/client/src/pages/Fortune/index.tsx` | `fortuneService.getDailyFortune()` | 5秒 | transparent + simple | 高 |
| チームコンテキスト運勢 | `/client/src/pages/Team/Advice.tsx` | `fortuneService.getTeamContextFortune()` | 12秒 | transparent + tips | 高 |
| メンバーカルテ生成 | `/client/src/components/team/MemberCardView.tsx` | `teamService.getMemberCard()` | 20秒 | opaque + tips | 高 |
| メンバーカルテ表示 | `/client/src/components/team/MemberCardView.tsx` | `teamService.getMemberCard()` | 3秒 | transparent + simple | 高 |
| ハーモニーコンパス表示 | `/client/src/components/profile/HarmonyCompass.tsx` | User Profile内 | 5秒 | transparent + simple | 中 |
| 相性分析表示 | `/client/src/pages/Team/Aisyou.tsx` | `friendService.getCompatibilityScore()` | 8秒 | transparent + tips | 中 |
| AIチャット | `/client/src/pages/Chat/index.tsx` | `chatService.sendMessage()` | 変動 | 対象外 | 対象外 |