# 四柱推命プロフィール拡張計画: 格局と用神の実装

## 概要

本ドキュメントでは、DailyFortuneアプリケーションの四柱推命プロフィール機能に「格局」と「用神」を追加するための実装計画を詳述します。格局と用神はそれぞれ四柱推命における重要な概念であり、これらを追加することでユーザーにより詳細で有用な四柱推命情報を提供することができます。

## 背景と目的

現在のDailyFortuneアプリケーションでは、四柱推命の基本要素（四柱、十神関係など）は実装されていますが、格局（性格タイプ）と用神（運気を高めるための要素）は実装されていません。これらを追加することで以下のメリットがあります：

1. より詳細な性格分析を提供
2. ユーザーの運気を高めるための具体的なアドバイスを提供
3. 四柱推命の情報価値を高め、アプリケーションの差別化要素となる

## 参照ドキュメント

本実装計画は以下の既存ドキュメントを参照しています：

1. [格局算出アルゴリズム](/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/saju_kakukyoku_algorithm.md) - 格局を判定するためのアルゴリズム詳細
2. [用神算出アルゴリズム](/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/saju_yojin_algorithm.md) - 用神を特定するためのアルゴリズム詳細

## 技術的アプローチ

### 1. データモデルの拡張

既存の`IUser`インターフェース（および`ISajuProfile`互換インターフェース）に格局と用神の情報を追加します。

```typescript
// shared/index.ts に追加
export interface IKakukyoku {
  type: string;               // 例: '従旺格', '建禄格'など
  category: 'special' | 'normal'; // 特別格局か普通格局か
  strength: 'strong' | 'weak'; // 身強か身弱か
  description?: string;       // 格局の説明
}

export interface IYojin {
  tenGod: string;             // 十神表記: 例 '比肩', '食神'
  element: Element;           // 五行表記: 例 'wood', 'fire'
  description?: string;       // 用神の説明
  supportElements?: Element[]; // 用神をサポートする五行
}

// IUserインターフェースを拡張
export interface IUser {
  // 既存のフィールド...
  
  // 新規追加フィールド
  kakukyoku?: IKakukyoku;
  yojin?: IYojin;
}

// ISajuProfileインターフェースも同様に拡張（後方互換性のため）
export interface ISajuProfile {
  // 既存のフィールド...
  
  // 新規追加フィールド
  kakukyoku?: IKakukyoku;
  yojin?: IYojin;
}
```

### 2. SajuEngineの拡張

SajuEngineに格局判定と用神計算の機能を追加します。

#### 2.1 新規モジュールの作成

```
sajuengine_package/src/
  ├── kakukyokuCalculator.ts   // 格局判定ロジック
  ├── yojinCalculator.ts       // 用神計算ロジック
  └── SajuEngine.ts            // 既存ファイル（拡張）
```

#### 2.2 格局判定モジュールの実装

```typescript
// kakukyokuCalculator.ts
import { FourPillars, IKakukyoku } from './types';
import * as tenGodCalculator from './tenGodCalculator';

/**
 * 格局判定の主要関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @returns 格局情報
 */
export function determineKakukyoku(
  fourPillars: FourPillars,
  tenGods: Record<string, string>
): IKakukyoku {
  // 1. 身強・身弱の判定
  const isStrong = determineStrength(fourPillars, tenGods);
  
  // 2. 特別格局か普通格局かの判定
  const isSpecial = isSpecialKakukyoku(fourPillars, tenGods);
  
  // 3. 具体的な格局タイプの判定
  let kakukyokuType = '';
  let description = '';
  
  if (isSpecial) {
    // 特別格局の判定
    const result = determineSpecialKakukyoku(fourPillars, tenGods, isStrong);
    kakukyokuType = result.type;
    description = result.description;
  } else {
    // 普通格局の判定
    const result = determineNormalKakukyoku(fourPillars, tenGods, isStrong);
    kakukyokuType = result.type;
    description = result.description;
  }
  
  return {
    type: kakukyokuType,
    category: isSpecial ? 'special' : 'normal',
    strength: isStrong ? 'strong' : 'weak',
    description: description
  };
}

// その他の必要な補助関数...
```

#### 2.3 用神計算モジュールの実装

```typescript
// yojinCalculator.ts
import { FourPillars, IKakukyoku, IYojin, Element } from './types';
import * as tenGodCalculator from './tenGodCalculator';

/**
 * 用神計算の主要関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @param kakukyoku 格局情報
 * @returns 用神情報
 */
export function determineYojin(
  fourPillars: FourPillars,
  tenGods: Record<string, string>,
  kakukyoku: IKakukyoku
): IYojin {
  // 1. 身強・身弱に基づいて用神候補を特定
  const yojinCandidates = getYojinCandidates(kakukyoku.strength);
  
  // 2. 通変星の数を数える
  const tenGodCounts = countTenGods(fourPillars, tenGods);
  
  // 3. 最適な用神を選定
  const selectedYojin = selectOptimalYojin(yojinCandidates, tenGodCounts, kakukyoku);
  
  // 4. 用神の五行属性を特定
  const element = convertTenGodToElement(selectedYojin, fourPillars.dayPillar.stem);
  
  // 5. 用神の説明文を生成
  const description = generateYojinDescription(selectedYojin, element, kakukyoku);
  
  // 6. 用神をサポートする五行を特定
  const supportElements = getSupportingElements(element);
  
  return {
    tenGod: selectedYojin,
    element: element,
    description: description,
    supportElements: supportElements
  };
}

// その他の必要な補助関数...
```

#### 2.4 SajuEngineへの統合

```typescript
// SajuEngine.ts の拡張部分
import { determineKakukyoku } from './kakukyokuCalculator';
import { determineYojin } from './yojinCalculator';

// calculate メソッド内の処理を拡張
calculate(
  birthDate: Date, 
  birthHour: number, 
  gender?: 'M' | 'F',
  location?: string | { longitude: number, latitude: number } | ExtendedLocation
): SajuResult {
  // 既存の処理...
  
  // 格局の計算
  const kakukyoku = determineKakukyoku(fourPillars, tenGods);
  
  // 用神の計算
  const yojin = determineYojin(fourPillars, tenGods, kakukyoku);
  
  // 結果オブジェクトに追加
  return {
    fourPillars,
    lunarDate: processedDateTime.lunarDate || undefined,
    tenGods,
    elementProfile,
    processedDateTime,
    twelveFortunes,
    twelveSpiritKillers,
    hiddenStems,
    kakukyoku, // 新規追加
    yojin,     // 新規追加
    location: locationInfo,
    timezoneInfo
  };
}
```

### 3. バックエンド拡張

#### 3.1 モデルの更新

```typescript
// server/src/models/User.ts の拡張
import { Schema, model } from 'mongoose';

const KakukyokuSchema = new Schema({
  type: { type: String, required: true },
  category: { type: String, enum: ['special', 'normal'], required: true },
  strength: { type: String, enum: ['strong', 'weak'], required: true },
  description: { type: String }
});

const YojinSchema = new Schema({
  tenGod: { type: String, required: true },
  element: { type: String, enum: ['wood', 'fire', 'earth', 'metal', 'water'], required: true },
  description: { type: String },
  supportElements: [{ type: String, enum: ['wood', 'fire', 'earth', 'metal', 'water'] }]
});

// 既存のUserSchemaに追加
const UserSchema = new Schema({
  // 既存のフィールド...
  
  // 新規追加フィールド
  kakukyoku: { type: KakukyokuSchema },
  yojin: { type: YojinSchema }
});
```

#### 3.2 sajuプロファイル計算サービスの更新

```typescript
// server/src/services/saju-engine.service.ts の更新
calculateSajuProfile(user: IUser): Promise<IUser> {
  // 既存の処理...
  
  // SajuEngineで計算（格局と用神が追加されたバージョン）
  const sajuResult = sajuEngine.calculate(
    new Date(user.birthDate),
    birthHour,
    user.gender,
    location
  );
  
  // 計算結果をユーザーモデルに反映（格局と用神を含む）
  user.fourPillars = {
    // 既存のマッピング...
  };
  
  // 新規追加項目
  user.kakukyoku = sajuResult.kakukyoku;
  user.yojin = sajuResult.yojin;
  
  // ユーザー情報を保存
  return user.save();
}
```

### 4. フロントエンド実装

#### 4.1 SajuProfileCardコンポーネントの拡張

```tsx
// client/src/components/profile/SajuProfileCard.tsx の拡張

// 格局セクションを追加
const renderKakukyokuSection = () => {
  if (!profile.kakukyoku) return null;
  
  const { type, strength, description } = profile.kakukyoku;
  
  return (
    <>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: '1.1rem', 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          pb: 1,
          mb: 2,
          color: 'primary.main'
        }}
      >
        格局（気質タイプ）
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'rgba(250, 245, 255, 0.5)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {type}
          </Typography>
          <Chip 
            size="small"
            label={strength === 'strong' ? '極身強' : '極身弱'} 
            color={strength === 'strong' ? 'success' : 'info'}
            sx={{ ml: 2 }}
          />
        </Box>
        <Typography variant="body2">
          {description || '格局は人生の気質タイプを表します。詳細な説明は近日公開予定です。'}
        </Typography>
      </Paper>
    </>
  );
};

// 用神セクションを追加
const renderYojinSection = () => {
  if (!profile.yojin) return null;
  
  const { tenGod, element, description, supportElements } = profile.yojin;
  const elementJp = sajuProfileService.translateElementToJapanese(element);
  
  return (
    <>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: '1.1rem', 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          pb: 1,
          mb: 2,
          color: 'primary.main'
        }}
      >
        用神（運気を高める要素）
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'rgba(250, 245, 255, 0.5)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {tenGod}（{elementJp}）
          </Typography>
          <Box 
            sx={{
              ml: 2,
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: getElementBgVar(element),
              color: getElementColorVar(element),
            }}
          >
            <Icon sx={{ fontSize: '0.875rem' }}>{getElementIconName(element)}</Icon>
          </Box>
        </Box>
        <Typography variant="body2" paragraph>
          {description || '用神はあなたの運気を高めるために必要な五行要素です。'}
        </Typography>
        
        {supportElements && supportElements.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              サポート要素:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {supportElements.map((el, idx) => (
                <Chip
                  key={idx}
                  size="small"
                  label={sajuProfileService.translateElementToJapanese(el)}
                  sx={{
                    backgroundColor: sajuProfileService.getElementBackground(el),
                    color: sajuProfileService.getElementColor(el),
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </>
  );
};

// レンダリング部分に追加
return (
  <Card elevation={3} sx={{ /* 既存のスタイル */ }}>
    <CardContent>
      {/* 既存のセクション */}
      
      {/* 格局セクション */}
      {renderKakukyokuSection()}
      
      {/* 用神セクション */}
      {renderYojinSection()}
      
      {/* 既存のセクション */}
    </CardContent>
  </Card>
);
```

### 5. 実装計画とタイムライン

1. **準備フェーズ (1-2日)**
   - 必要なモジュールとクラスの設計
   - データモデルの拡張設計

2. **バックエンド実装 (3-5日)**
   - 格局判定アルゴリズムの実装
   - 用神計算アルゴリズムの実装
   - SajuEngineへの統合
   - データベースモデルの更新

3. **フロントエンド実装 (2-3日)**
   - SajuProfileCardの拡張
   - 新規表示要素のデザイン実装

4. **テストとバグ修正 (2-3日)**
   - 各種パターンでの格局判定テスト
   - 用神計算の正確性検証
   - UIの表示テスト

5. **デプロイと監視 (1-2日)**
   - 機能のリリース
   - パフォーマンス監視
   - ユーザーフィードバックの収集

## 実装上の考慮点

### 格局の表現方法について

格局は、ユーザーにとって理解しやすい形で表現することが重要です。具体的には：

1. 格局名（例：「従旺格」「建禄格」）を主要な表示として使用
2. 身強か身弱かの情報を補足的に表示（「極身強」「極身弱」など）
3. 格局の簡潔な説明文を提供し、ユーザーが自分の気質タイプを理解できるようにする

### 用神の表現方法について

用神は、専門家向けの十神表記と一般ユーザー向けの五行表記の両方を提供することが望ましいです：

1. 十神表記（例：「比肩」「食神」）と五行表記（例：「木」「火」）を並べて表示
2. わかりやすいアイコンや色を使って視覚的に強調
3. ユーザーが日常生活で用神を活用するための具体的なアドバイスを提供

### 既存の十神表示との統合

現在のコードベースですでに十神の表示機能が実装されています。新しい格局と用神の機能はこれと重複せず、補完する形で設計します：

1. 十神表示：各柱（年・月・日・時）の天干と地支の関係性を詳細に表示
2. 格局：四柱全体から導き出される気質タイプとして表示
3. 用神：四柱と格局から導き出される、運気を高めるための要素として表示

### 最後に

格局と用神の実装は、DailyFortuneアプリケーションの四柱推命機能を大幅に強化し、ユーザーにより深い洞察と具体的なアドバイスを提供することができます。正確な算出アルゴリズムと分かりやすいUI表示の両方に注力することで、ユーザー体験の質を高めることが重要です。

## 実装進捗状況 (2025-04-11 更新)

### 完了した作業

1. **SajuEngine拡張**
   - kakukyokuCalculator.ts - 格局判定ロジックの実装完了
   - yojinCalculator.ts - 用神計算ロジックの実装完了
   - SajuEngine.calculate() メソッドへの統合完了
   - エラー時の適切なフォールバック処理の実装完了

2. **データモデル**
   - Userモデルに格局と用神のスキーマが既に追加済み
   - サーバー側で格局と用神の計算結果を保存する処理が実装済み

3. **フロントエンド側**
   - SajuProfileCard.tsxに格局表示セクションが既に実装済み
   - SajuProfileCard.tsxに用神表示セクションを追加実装完了
   - saju-profile.serviceの変換メソッドに格局と用神の対応を追加完了

4. **テスト**
   - test-kakukyoku-yojin.jsテストスクリプト作成完了

### 次のステップ

1. **テスト実行** (推定時間: 1時間)
   ```bash
   # 格局と用神の計算テスト
   cd /Users/tatsuya/Desktop/システム開発/DailyFortune
   node server/scripts/test-kakukyoku-yojin.js
   ```

2. **バグ修正** (推定時間: 2-3時間)
   - テスト結果に基づき、必要に応じてバグ修正を行う
   - 特に格局判定条件の閾値や用神選定ロジックを調整する

3. **エンドツーエンドテスト** (推定時間: 2時間)
   - 実際のユーザーアカウントで四柱推命情報を再計算
   - プロフィール画面で格局と用神の情報が正しく表示されることを確認
   - 様々な誕生日パターンでテストし、結果の多様性を確認

4. **ドキュメント更新** (推定時間: 1時間)
   - kakukyoku_yojin_implementation_summary.md の内容を最終実装に合わせて更新
   - API仕様書に格局と用神の情報を追加

5. **リリース** (推定時間: 30分)
   - 開発環境でのファイナルチェック
   - 本番環境へのデプロイ準備

### 今後の拡張計画

1. **運勢生成への統合**
   - 用神情報に基づいた日々の運勢アドバイスの生成機能
   - 格局タイプに基づいたパーソナライズされた運勢コンテンツ

2. **UI/UX改善**
   - 格局と用神に関する説明コンテンツの充実
   - ビジュアル要素の強化（グラフィックやアイコン）

3. **月運・年運との連携**
   - 用神に基づいた月運・年運の詳細予測機能
   - 時期ごとの最適な行動指針の提案

状況に応じて、まずはテスト実行から始め、問題がなければ次のステップに進んでください。重要な点や質問がある場合は、チーム内で共有し対応方針を決定するようにしてください。