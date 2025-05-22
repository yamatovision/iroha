# Univerpay 決済連携実装ガイド

## 概要

この文書は美姫命アプリケーションのSuperAdmin向け課金・プラン管理機能においてUniverpay決済サービスと連携するための実装ガイドです。

## 主要機能と実装フロー

### 1. トランザクショントークンの生成と管理

トランザクショントークンはUniverpayでの決済処理の基本単位です。課金や定期課金を行うには、まずトランザクショントークンを作成する必要があります。

#### トランザクショントークンの種類

1. **ワンタイムトークン (one_time)**
   - 1回のみ課金可能
   - 有効期限は5分間
   - 主に単発の決済に使用

2. **定期課金トークン (subscription)**
   - 定期的な課金スケジュールを設定可能
   - 初回金額、定期課金金額、開始日などを指定できる
   - 有効期限は5分間
   - キャンセルされるまで継続される

3. **リカーリングトークン (recurring)**
   - 任意のタイミングで再利用可能
   - 加盟店アカウントの権限により、無制限または制限付きで利用可能
   - クレジットカード情報をUniverpayのプラットフォームに安全に保管

#### トークン生成の実装

```javascript
// トランザクショントークン生成のサンプルコード
async function createTransactionToken(paymentInfo) {
  try {
    const response = await axios.post(
      'https://api.univapay.com/tokens',
      {
        payment_type: "card", // card, paidy, online, konbini, bank_transfer
        type: "recurring", // one_time, subscription, recurring
        email: paymentInfo.email,
        data: {
          cardholder: paymentInfo.cardholderName,
          card_number: paymentInfo.cardNumber,
          exp_month: paymentInfo.expMonth,
          exp_year: paymentInfo.expYear,
          cvv: paymentInfo.cvv,
          // 住所情報など必要に応じて追加
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${secret}.${jwt}`,
          'Content-type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('トランザクショントークン生成エラー:', error);
    throw error;
  }
}
```

### 2. 定期課金（サブスクリプション）の設定

サブスクリプションを設定することで、顧客に定期的に課金することができます。

#### 主な設定内容

- **課金間隔**: 月次、年次など
- **初回金額**: 初回の支払い金額（通常金額と異なる場合に設定）
- **定期課金金額**: 継続的な支払い金額
- **開始日**: サブスクリプションの開始日

#### 実装例（概要）

```javascript
// サブスクリプション作成のサンプルコード
async function createSubscription(tokenId, planDetails) {
  try {
    const response = await axios.post(
      `https://api.univapay.com/stores/${storeId}/subscriptions`,
      {
        transaction_token_id: tokenId,
        amount: planDetails.amount,
        currency: "JPY",
        period: planDetails.period, // "month", "year" など
        initial_amount: planDetails.initialAmount, // オプション
        start_date: planDetails.startDate // ISO-8601形式 (例: "2025-05-01")
      },
      {
        headers: {
          'Authorization': `Bearer ${secret}.${jwt}`,
          'Content-type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('サブスクリプション作成エラー:', error);
    throw error;
  }
}
```

### 3. Webhook設定による支払い状態の監視

Webhookを設定することで、支払い状態の変更（成功、失敗など）をリアルタイムで検知し、アプリケーション側で適切な処理を行うことができます。

#### 主なWebhookイベント

- **charge.completed**: 課金完了
- **charge.failed**: 課金失敗
- **subscription.created**: サブスクリプション作成
- **subscription.completed**: サブスクリプション完了
- **subscription.failed**: サブスクリプション失敗
- **subscription.canceled**: サブスクリプションキャンセル

#### Webhook処理の実装

```javascript
// Webhook処理のサンプルコード
app.post('/webhook/univapay', async (req, res) => {
  try {
    const eventType = req.body.type;
    const eventData = req.body.data;
    
    // Webhookの正当性検証（シグネチャ確認など）
    
    // イベントタイプに応じた処理
    switch (eventType) {
      case 'charge.completed':
        await handleChargeCompleted(eventData);
        break;
      case 'charge.failed':
        await handleChargeFailed(eventData);
        break;
      case 'subscription.failed':
        await handleSubscriptionFailed(eventData);
        break;
      // その他のイベント処理
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook処理エラー:', error);
    res.status(500).send('Error');
  }
});

// 課金完了時の処理
async function handleChargeCompleted(data) {
  // 支払い成功時のアプリケーション側の処理
  // 例: 支払い記録の更新、ユーザーアクセス権の付与など
}

// 課金失敗時の処理
async function handleChargeFailed(data) {
  // 支払い失敗時のアプリケーション側の処理
  // 例: 顧客への通知、アクセス制限など
}
```

### 4. 支払い状態管理と自動停止・復元

支払いの失敗や遅延に応じて、サービスへのアクセス制限と復元を自動的に管理します。

#### 実装ポイント

1. **支払い状態の監視**
   - Webhookでの支払い失敗検知
   - 定期的なバッチ処理による遅延チェック

2. **アクセス制御**
   - 支払い失敗時の組織アクセス停止
   - 支払い成功時のアクセス復元

3. **通知管理**
   - 支払い失敗時の管理者・利用者への通知
   - 催促メールの自動送信

## テスト環境と本番環境の切り替え

Univerpayでは、テスト環境と本番環境の切り替えがAPIトークンによって管理されています。

- **テストモード**: テスト用APIトークンを使用
- **本番モード**: 本番用APIトークンを使用

テスト環境ではテストカード番号を使用して支払いフローをテストできます。

## セキュリティ考慮事項

1. **PCI DSS準拠**
   - クレジットカード情報を直接扱う場合はPCI DSS準拠が必要
   - 非準拠の場合は、Univerpayが提供するウィジェットやSDKを使用する

2. **APIキーの管理**
   - シークレットキーとアプリトークンのセキュアな管理
   - 本番環境の認証情報は特に厳重に保護

3. **3Dセキュア認証**
   - 必要に応じて3Dセキュア認証を実装
   - リカーリングトークン使用時の高額決済でCVV再入力要求

## 実装優先順位

1. **基本決済機能**
   - トランザクショントークンの生成
   - 基本的な課金処理

2. **サブスクリプション管理**
   - 定期課金の設定
   - サブスクリプションのキャンセル処理

3. **Webhook連携**
   - 支払い状態変更の検知
   - アプリケーション側の状態管理

4. **支払い失敗時の対応**
   - 自動停止・復元機能
   - 催促メール送信

## 参考リソース

- Univerpay APIリファレンス: https://docs.univapay.com/docs/api/
- テストカード番号リスト: https://docs.univapay.com/docs/testing/