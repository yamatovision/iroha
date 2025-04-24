# 友達拡張相性診断機能の問題分析と修正レポート

## 1. 問題の概要

友達拡張相性診断機能において、レスポンスのenhancedDetailsが空の状態で返されています。具体的には：

```json
"enhancedDetails": {
  "dayBranchRelationship": {},
  "dayGanCombination": {}
}
```

陰陽バランス（yinYangBalance）、身強弱バランス（strengthBalance）、用神情報（usefulGods）などの値が欠損しています。

## 2. 発生原因の調査結果

### 2.1 データベース状態の確認

MongoDBの`friendships`コレクションを確認したところ：

```json
{
  "_id": ObjectId('6805f24e553e5f37092e6b5c'),
  "userId1": ObjectId('67f87e86a7d83fb995de0ee6'),
  "userId2": ObjectId('6803699aac7c6a58f9a207b0'),
  "status": 'accepted',
  "requesterId": ObjectId('67f87e86a7d83fb995de0ee6'),
  "createdAt": ISODate('2025-04-21T07:22:54.984Z'),
  "updatedAt": ISODate('2025-04-21T08:26:03.187Z'),
  "acceptedAt": ISODate('2025-04-21T08:16:15.119Z'),
  "compatibilityScore": 75
}
```

既存のFriendshipレコードには、`enhancedDetails`フィールドが存在していません。

一方、拡張相性を持つCompatibilityレコードを確認すると：

```json
"enhancedDetails": {
  "yinYangBalance": 50,
  "strengthBalance": 70,
  "dayBranchRelationship": { "score": 100, "relationship": "三合会局" },
  "usefulGods": 37.5,
  "dayGanCombination": { "score": 50, "isGangou": false },
  "relationshipType": "generalRelationship"
}
```

正しくenhancedDetails情報が含まれています。

### 2.2 友達機能とチーム機能の実装差異

チーム機能と友達機能の実装を比較した結果：

1. **データモデルの違い**
   - チーム機能：`Compatibility`モデルを使用
   - 友達機能：`Friendship`モデルを使用

2. **データフローの違い**
   - チーム機能：enhancedCompatibilityService.getTeamMemberEnhancedCompatibilityを直接呼び出し
   - 友達機能：動的インポート後にcalculateAndSaveEnhancedCompatibilityを経由して呼び出し

3. **保存方法の違い**
   - チーム機能：Compatibilityモデルに直接保存
   - 友達機能：FriendshipモデルのenhancedDetailsフィールドに保存しようとするが、保存されていない

### 2.3 保存の問題

コードを調査した結果、friendshipモデルにはenhancedDetailsフィールドが定義されているにもかかわらず、データが保存されていないことがわかりました。この問題は、以下の可能性があります：

1. データの保存方法（オブジェクトの深いネストや参照の問題）
2. スキーマ定義と実際のデータモデルの不一致
3. 以前のコード変更時、手続きに漏れがあった可能性

## 3. 修正アプローチ

### 3.1 コードレベルでの修正

1. 深いコピーによるオブジェクト構築
   ```javascript
   friendship.enhancedDetails = {
     yinYangBalance: compatibilityDoc.enhancedDetails.yinYangBalance,
     strengthBalance: compatibilityDoc.enhancedDetails.strengthBalance,
     dayBranchRelationship: {
       score: compatibilityDoc.enhancedDetails.dayBranchRelationship.score,
       relationship: compatibilityDoc.enhancedDetails.dayBranchRelationship.relationship
     },
     usefulGods: compatibilityDoc.enhancedDetails.usefulGods,
     dayGanCombination: {
       score: compatibilityDoc.enhancedDetails.dayGanCombination.score,
       isGangou: compatibilityDoc.enhancedDetails.dayGanCombination.isGangou
     },
     relationshipType: compatibilityDoc.enhancedDetails.relationshipType
   };
   ```

2. レスポンス作成時も同様に明示的な構造を作成
   ```javascript
   enhancedDetails: {
     yinYangBalance: compatibilityDoc.enhancedDetails.yinYangBalance,
     strengthBalance: compatibilityDoc.enhancedDetails.strengthBalance,
     dayBranchRelationship: {
       score: compatibilityDoc.enhancedDetails.dayBranchRelationship.score,
       relationship: compatibilityDoc.enhancedDetails.dayBranchRelationship.relationship
     },
     usefulGods: compatibilityDoc.enhancedDetails.usefulGods,
     dayGanCombination: {
       score: compatibilityDoc.enhancedDetails.dayGanCombination.score,
       isGangou: compatibilityDoc.enhancedDetails.dayGanCombination.isGangou
     },
     relationshipType: compatibilityDoc.enhancedDetails.relationshipType
   }
   ```

### 3.2 データベースレベルでの修正

既存のデータに関しては以下の対応が必要です：

1. 既存のFriendshipレコードに対して、enhancedDetailsフィールドを追加・更新
2. 新規のFriendship作成時にenhancedDetailsが正しく保存されるようにモデル定義を確認

## 4. 今後の対応

1. FriendshipモデルのenhancedDetailsフィールドが正しく保存されるよう、スキーマ定義を再確認
2. 友達拡張相性診断APIが呼び出された際のデバッグログを強化し、データフローを追跡
3. 一度正しいデータが保存された後、レスポンスが正しく返されるか検証
4. 必要に応じて、既存の友達関係データに対してマイグレーションを実施

## 5. 学習ポイント

1. MongoDBのネストされたオブジェクト保存時の注意点
2. 同じサービスを異なるモデルで利用する際の実装パターン
3. データモデル間の整合性を保つための設計手法

このレポートは、2025年4月24日時点での調査・分析結果です。問題の詳細や修正アプローチは、さらなる調査により変更される可能性があります。


チーム機能の拡張相性（enhancedTeam）におけるenhan
  cedDetailsのデータ内容は以下のような構造と値を持
  っています：

  "enhancedDetails": {
    "yinYangBalance": 50,            //
  陰陽バランスの評価スコア（0-100）
    "strengthBalance": 70,           //
  身強弱バランスの評価スコア（0-100）
    "dayBranchRelationship": {       //
  日支関係の情報
      "score": 100,                  //
  日支関係の評価スコア（0-100）
      "relationship": "三合会局"      //
  関係の種類（三合会局、支合、支沖、通常など）
    },
    "usefulGods": 37.5,              //
  用神・喜神の評価スコア（0-100）
    "dayGanCombination": {           //
  日干干合の情報
      "score": 50,                   //
  日干干合の評価スコア（0-100）
      "isGangou": false              //
  干合があるかどうかのフラグ
    },
    "relationshipType": "generalRelationship"  //
  関係性のタイプ（理想的パートナー、良好な協力関係
  など）
  }

  これらのデータはユーザー間の四柱推命に基づく相性
  を表す様々な要素で、具体的には：

  1. 陰陽バランス (yinYangBalance)：
    - 四柱推命における「日干」の陰陽特性に基づくバ
  ランス
    - 陽の天干（甲・丙・戊・庚・壬）と陰の天干（乙
  ・丁・己・辛・癸）が互いに補完するかどうか
    - 異なる陰陽を持つ人同士は高いスコア、同じ陰陽
  の場合は中程度のスコア
  2. 身強弱バランス (strengthBalance)：
    -
  四柱推命の命式における「身強・身弱」のバランス
    - 一方が身強で他方が身弱の場合は高いスコア（相
  補的）
    - 両方が同じ強弱の場合は中程度のスコア
  3. 日支関係 (dayBranchRelationship)：
    - 四柱推命の「日支」（日柱の地支）間の関係
    - 三合会局（最良・相互補完的）、支合（安定・調
  和的）、支沖（刺激的・緊張感）など
    - 関係の種類によってスコアが変わる
  4. 用神・喜神評価 (usefulGods)：
    - 相手の命式に自分の「用神」（自分を助ける五行
  ）や「喜神」（自分に良い影響を与える五行）がどれ
  だけ含まれているか
    - 相手の命式に多ければ高いスコア
  5. 日干干合 (dayGanCombination)：
    - 互いの「日干」（四柱推命の中心要素）が「干合
  」（天干の組み合わせ）するかどうか
    -
  干合があれば高いスコア、なければ中程度のスコア
  6. 関係性タイプ (relationshipType)：
    - 上記の各要素を総合的に評価して決まる関係性の
  タイプ
    - 「理想的パートナー」「良好な協力関係」「安定
  した関係」「刺激的な関係」「要注意の関係」「一般
  的な関係」など

  このデータは enhancedCompatibilityService の
  getOrCreateEnhancedCompatibility
  メソッドによって計算され、チーム機能では
  Compatibility モデルに、友達機能では Friendship
  モデルの enhancedDetails
  フィールドに保存されるべきものです。

  現在の問題は、友達機能側では Friendship モデルの
  enhancedDetails
  フィールドに正しくデータが保存されていないため、A
  PI応答が空のオブジェクトになっている点です。
