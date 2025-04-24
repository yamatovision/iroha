# チーム機能と友達機能の拡張相性診断実装比較

## 1. データの流れの違い

### チーム機能の実装

1. `enhancedCompatibilityController`の`getMemberEnhancedCompatibility`メソッドがAPIリクエストを処理
2. コントローラーは`enhancedCompatibilityService.getTeamMemberEnhancedCompatibility`を呼び出す
3. `getTeamMemberEnhancedCompatibility`は`getOrCreateEnhancedCompatibility`を呼び出す
4. サービス層で作成された`Compatibility`オブジェクトには、`enhancedDetails`に以下の情報が設定される：
   ```javascript
   enhancedDetails: {
     yinYangBalance: compatibilityDetails.details.yinYangBalance,
     strengthBalance: compatibilityDetails.details.strengthBalance,
     dayBranchRelationship: compatibilityDetails.details.dayBranchRelationship,
     usefulGods: compatibilityDetails.details.usefulGods,
     dayGanCombination: compatibilityDetails.details.dayGanCombination,
     relationshipType: compatibilityDetails.relationshipType
   }
   ```
5. コントローラーはこのオブジェクトを直接レスポンスとして返す（加工せずそのまま）
6. フロントエンドはこのレスポンスを使って表示する

### 友達機能の実装

1. `friendshipController`の`getEnhancedCompatibility`メソッドがAPIリクエストを処理
2. コントローラーは`friendshipService.getCompatibilityScore(userId, id, true)`を呼び出す
3. `getCompatibilityScore`は動的インポートを使用して`enhancedCompatibilityService`を読み込み
   ```javascript
   const { enhancedCompatibilityService } = await import('../team/enhanced-compatibility.service');
   ```
4. その後`enhancedCompatibilityService.getOrCreateEnhancedCompatibility`を呼び出す
5. オブジェクトが`friendshipService`に返されると、`Friendship`モデルに情報を保存する際に以下のように処理：
   ```javascript
   friendship.enhancedDetails = {
     yinYangBalance: compatibilityDoc.enhancedDetails.yinYangBalance,
     strengthBalance: compatibilityDoc.enhancedDetails.strengthBalance,
     dayBranchRelationship: {
       score: compatibilityDoc.enhancedDetails.dayBranchRelationship?.score || 50,
       relationship: compatibilityDoc.enhancedDetails.dayBranchRelationship?.relationship || '通常'
     },
     usefulGods: compatibilityDoc.enhancedDetails.usefulGods,
     dayGanCombination: {
       score: compatibilityDoc.enhancedDetails.dayGanCombination?.score || 50,
       isGangou: compatibilityDoc.enhancedDetails.dayGanCombination?.isGangou || false
     },
     relationshipType: compatibilityDoc.enhancedDetails.relationshipType
   };
   ```
6. レスポンス作成時にも同様の処理を行うが、友達側では**空のオブジェクト（{}`）がクライアントに返されている**

## 2. 問題の原因

問題の原因は友達機能側で以下のような違いがあることです：

1. **データの保存方法**: チーム機能ではサービス層で直接`Compatibility`モデルにデータを格納しており、深い階層のオブジェクトもそのまま保存されます。一方、友達機能では`Friendship`モデルに保存する際に構造を再構築しています。

2. **返却方法**: チーム機能ではデータベースから取得した`enhancedDetails`をそのまま返却しています。友達機能では`friendship.service.ts`内でデータを取得した後、別のレスポンスオブジェクトを生成しています。

3. **オプショナルチェーンの扱い**: 友達機能では`dayBranchRelationship?.score || 50`のように値がない場合のデフォルト値を設定していますが、オブジェクト自体は空でレスポンスに含まれています。

## 3. 解決策

1. チーム機能と同じ方法でデータを処理するよう統一

2. 友達機能側のレスポンス構築部分をチーム機能と同様にする：
   ```javascript
   enhancedDetails: compatibilityDoc.enhancedDetails
   ```
   
   または、以下のように明示的にデフォルト値を設定：
   ```javascript
   enhancedDetails: compatibilityDoc.enhancedDetails ? {
     yinYangBalance: compatibilityDoc.enhancedDetails.yinYangBalance,
     strengthBalance: compatibilityDoc.enhancedDetails.strengthBalance,
     dayBranchRelationship: {
       score: compatibilityDoc.enhancedDetails.dayBranchRelationship?.score || 50,
       relationship: compatibilityDoc.enhancedDetails.dayBranchRelationship?.relationship || '通常'
     },
     usefulGods: compatibilityDoc.enhancedDetails.usefulGods,
     dayGanCombination: {
       score: compatibilityDoc.enhancedDetails.dayGanCombination?.score || 50,
       isGangou: compatibilityDoc.enhancedDetails.dayGanCombination?.isGangou || false
     },
     relationshipType: compatibilityDoc.enhancedDetails.relationshipType
   } : {
     // デフォルト値を設定
     yinYangBalance: 50,
     strengthBalance: 50,
     dayBranchRelationship: {
       score: 50,
       relationship: '通常'
     },
     usefulGods: 50,
     dayGanCombination: {
       score: 50,
       isGangou: false
     },
     relationshipType: 'generalRelationship'
   }
   ```

3. API呼び出し時の型変換の一貫性を保つ：チーム機能と友達機能の両方で同じ型変換処理を行うよう統一する

## 実装方針

1. チームの実装を参考に、友達機能側のコードを修正する
2. データの流れを統一し、同じ方法でオブジェクトを構築・返却する
3. 空のオブジェクトが返された場合のデフォルト値を常に設定する
4. フロントエンド側の表示は現状のままとし、バックエンド側の一貫性を確保する