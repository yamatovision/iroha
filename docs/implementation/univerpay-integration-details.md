# Univerpay 決済連携 詳細実装ガイド

## 目次

1. [概要](#概要)
2. [トランザクショントークン管理](#トランザクショントークン管理)
3. [課金処理](#課金処理)
4. [定期課金（サブスクリプション）](#定期課金サブスクリプション)
5. [Webhook連携](#webhook連携)
6. [3Dセキュア認証](#3dセキュア認証)
7. [テスト環境](#テスト環境)
8. [実装例](#実装例)
9. [実装状況（2025/5/1更新）](#実装状況)

## 概要

本ドキュメントでは、美姫命アプリケーションのSuperAdmin向け課金・プラン管理機能におけるUniverpay決済サービスとの詳細な連携方法を記述します。基本的な実装ガイドについては、[univerpay-integration.md](./univerpay-integration.md)を参照してください。

## トランザクショントークン管理

### トークンタイプと用途

| トークンタイプ | 用途 | 有効期限 | 特徴 |
|------------|------|-------|------|
| one_time | 単発課金 | 5分 | 1回のみ使用可能 |
| subscription | 定期課金 | 5分 | 自動継続課金に使用 |
| recurring | 再利用課金 | 無期限 | 任意のタイミングで再利用可能 |

### トランザクショントークン生成APIリクエスト

```
POST https://api.univapay.com/tokens
```

**ヘッダー**:
```
Authorization: Bearer {secret}.{jwt}
Content-type: application/json
```

**リクエストボディ（クレジットカード）**:
```json
{
  "payment_type": "card",
  "email": "customer@example.com",
  "type": "recurring",
  "data": {
    "cardholder": "TARO YAMADA",
    "card_number": "4000020000000000",
    "exp_month": "12",
    "exp_year": "2034",
    "cvv": "123",
    "phone_number": {
      "country_code": "81",
      "local_number": "0312345678"
    }
  }
}
```

**レスポンス**:
```json
{
  "id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
  "store_id": "11edf541-c42d-653c-8c3d-dfe0a55f95c0",
  "email": "customer@example.com",
  "payment_type": "card",
  "active": true,
  "mode": "test",
  "type": "recurring",
  "usage_limit": null,
  "confirmed": null,
  "metadata": {},
  "created_on": "2024-06-25T03:58:49.321896Z",
  "updated_on": "2024-06-25T03:58:49.321896Z",
  "last_used_on": null,
  "data": {
    "card": {
      "cardholder": "TARO YAMADA",
      "exp_month": 12,
      "exp_year": 2034,
      "card_bin": "400002",
      "last_four": "0000",
      "brand": "visa",
      "card_type": "credit",
      "country": "US",
      "category": null,
      "issuer": "RIVER VALLEY CREDIT UNION",
      "sub_brand": "none"
    }
  }
}
```

### 重要なポイント

- カード情報を直接扱う場合は**PCI DSS準拠**が必要
- 非準拠の場合は、Univerpayが提供するウィジェットかSDKを使用する必要がある
- トークンには**メタデータ**を設定できる（組織ID、ユーザーID等）
- `recurring`トークンの場合、使用権限レベルに応じて`usage_limit`の指定が必要な場合がある

## 課金処理

### 課金（Charge）作成APIリクエスト

```
POST https://api.univapay.com/charges
```

**ヘッダー**:
```
Authorization: Bearer {secret}.{jwt}
Content-type: application/json
```

**リクエストボディ**:
```json
{
  "transaction_token_id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
  "amount": 1000,
  "currency": "JPY",
  "metadata": {
    "organization_id": "org_12345",
    "invoice_id": "inv_67890",
    "order_id": 12345
  }
}
```

**レスポンス**:
```json
{
  "id": "11ef32c2-4010-a312-aaff-4b63e4d5f92d",
  "store_id": "11edf541-c42d-653c-8c3d-dfe0a55f95c0",
  "transaction_token_id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
  "transaction_token_type": "recurring",
  "subscription_id": null,
  "merchant_transaction_id": null,
  "requested_amount": 1000,
  "requested_currency": "JPY",
  "requested_amount_formatted": 1000,
  "charged_amount": null,
  "charged_currency": null,
  "charged_amount_formatted": null,
  "only_direct_currency": false,
  "status": "pending",
  "error": null,
  "metadata": {
    "organization_id": "org_12345",
    "invoice_id": "inv_67890",
    "order_id": 12345
  },
  "mode": "test",
  "created_on": "2024-06-25T07:12:15.16452Z"
}
```

### 課金ステータス

| ステータス | 説明 |
|----------|------|
| pending | 初期状態、処理中 |
| awaiting | 追加処理待ち（ユーザー操作等） |
| authorized | 与信確保済み（オーソリ） |
| successful | 処理成功、課金完了 |
| failed | 課金失敗（与信不足等） |
| error | 処理エラー発生 |
| canceled | キャンセル済み |

### オーソリとキャプチャ

クレジットカード決済で**オーソリ**（与信確保）のみを行う場合：

```json
{
  "transaction_token_id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
  "amount": 1000,
  "currency": "JPY",
  "capture": false,
  "capture_at": "2024-07-01T00:00:00Z" // オプション：自動キャプチャ日時
}
```

**キャプチャ**（売上確定）処理：

```
POST https://api.univapay.com/stores/{storeId}/charges/{id}/capture
```

```json
{
  "amount": 1000,
  "currency": "JPY"
}
```

## 定期課金（サブスクリプション）

### サブスクリプション作成APIリクエスト

```
POST https://api.univapay.com/stores/{storeId}/subscriptions
```

**ヘッダー**:
```
Authorization: Bearer {secret}.{jwt}
Content-type: application/json
```

**リクエストボディ**:
```json
{
  "transaction_token_id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
  "amount": 9800,
  "currency": "JPY",
  "period": "month",
  "initial_amount": 500, // オプション
  "start_date": "2024-07-01", // オプション
  "metadata": {
    "organization_id": "org_12345",
    "plan_id": "plan_standard"
  }
}
```

**レスポンス**:
```json
{
  "id": "11ef32ff-7a19-1236-8e2c-0242ac130003",
  "store_id": "11edf541-c42d-653c-8c3d-dfe0a55f95c0",
  "transaction_token_id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
  "amount": 9800,
  "currency": "JPY",
  "period": "month",
  "initial_amount": 500,
  "start_date": "2024-07-01",
  "status": "active",
  "metadata": {
    "organization_id": "org_12345",
    "plan_id": "plan_standard"
  },
  "created_on": "2024-06-25T07:30:00.000000Z"
}
```

### サブスクリプション管理

- **サブスクリプション取得**: `GET /stores/{storeId}/subscriptions/{id}`
- **サブスクリプション一覧**: `GET /stores/{storeId}/subscriptions`
- **サブスクリプションキャンセル**: `DELETE /stores/{storeId}/subscriptions/{id}`

## Webhook連携

Webhookを利用することで、課金ステータスの変更をリアルタイムで検知できます。

### 主要なWebhookイベント

| イベント名 | 説明 |
|----------|------|
| CHARGE_FINISHED | 課金処理が完了（成功・失敗問わず） |
| CHARGE_AUTHORIZED | 課金がオーソリ済み |
| SUBSCRIPTION_PAYMENT | サブスクリプションの課金発生 |
| SUBSCRIPTION_COMPLETED | サブスクリプション処理完了 |
| SUBSCRIPTION_FAILED | サブスクリプション課金失敗 |
| SUBSCRIPTION_CANCELED | サブスクリプションがキャンセル |

### Webhook処理の実装例

```javascript
// Express.jsでのWebhook処理例
app.post('/webhook/univerpay', (req, res) => {
  const signature = req.headers['univapay-signature'];
  const payload = req.body;
  
  // 署名を検証
  if (!verifySignature(payload, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // イベントタイプに応じた処理
  const eventType = payload.type;
  const eventData = payload.data;
  
  switch (eventType) {
    case 'CHARGE_FINISHED':
      if (eventData.status === 'successful') {
        // 課金成功時の処理
        handleSuccessfulCharge(eventData);
      } else {
        // 課金失敗時の処理
        handleFailedCharge(eventData);
      }
      break;
      
    case 'SUBSCRIPTION_PAYMENT':
      // サブスクリプション課金時の処理
      handleSubscriptionPayment(eventData);
      break;
      
    // 他のイベント処理...
  }
  
  // Webhookには常に200 OKを返す
  res.status(200).send('OK');
});
```

## 3Dセキュア認証

高額決済や不正防止のために3Dセキュア認証を実装することができます。

### 3Dセキュア認証フロー

1. **トランザクショントークン作成時**に3Dセキュア認証を有効化
   ```json
   {
     "payment_type": "card",
     "type": "recurring",
     "email": "customer@example.com",
     "data": {
       "cardholder": "TARO YAMADA",
       "card_number": "4000020000000000",
       "exp_month": "12",
       "exp_year": "2034",
       "cvv": "123",
       "three_ds": {
         "enabled": true,
         "redirect_endpoint": "https://example.com/3ds-complete"
       }
     }
   }
   ```

2. **課金作成時**に3Dセキュアモードを指定
   ```json
   {
     "transaction_token_id": "11ef32a7-3a71-8662-803f-1bc27702eeec",
     "amount": 1000,
     "currency": "JPY",
     "three_ds": {
       "mode": "normal", // normal, require, force, skip
       "redirect_endpoint": "https://example.com/3ds-complete"
     }
   }
   ```

3. **課金ステータスのポーリング**
   - ステータスが`awaiting`になるまでポーリング
   - `awaiting`の場合、3Dセキュア認証が必要

4. **イシュアトークンの取得**
   ```
   GET /stores/{storeId}/charges/{chargeId}/three_ds/issuer_token
   ```

5. **認証画面のリダイレクト**
   - 取得したイシュアトークンを使用してユーザーをリダイレクト
   - 認証完了後、指定したエンドポイントにリダイレクト

6. **認証結果の確認**
   - 課金ステータスをポーリングし、`successful`または`failed`を確認

## テスト環境

### テストカード番号

| カード番号 | 結果 |
|----------|------|
| 4000020000000000 | 課金・返金成功 |
| 4111111111111111 | 課金失敗 |
| 4242424242424242 | 課金成功、返金失敗 |
| 4012888888881881 | 課金成功、取り消し失敗 |

### テスト環境と本番環境の切り替え

- テスト環境のアプリトークンでリクエストするとモードは自動的に`test`になる
- 本番環境のアプリトークンでリクエストするとモードは自動的に`live`になる
- テスト環境のトランザクションは**実際の課金は発生しない**
- 環境の混在を避けるため、異なる環境の通信は明確に分ける

## 実装例

### 課金フロー実装例

```typescript
// サブスクリプション作成フロー
async function createSubscription(
  organizationId: string,
  planId: string,
  paymentInfo: PaymentInfo
): Promise<string> {
  try {
    // 1. トランザクショントークンの生成
    const tokenResponse = await univerpayService.createTransactionToken({
      payment_type: "card",
      type: "recurring",
      email: paymentInfo.email,
      data: {
        cardholder: paymentInfo.cardholderName,
        card_number: paymentInfo.cardNumber,
        exp_month: paymentInfo.expMonth,
        exp_year: paymentInfo.expYear,
        cvv: paymentInfo.cvv
      }
    });
    
    // 2. プラン情報の取得
    const plan = await planService.getPlanById(planId);
    
    // 3. サブスクリプションの作成
    const subscriptionResponse = await univerpayService.createSubscription(
      tokenResponse.id,
      {
        amount: plan.price,
        currency: "JPY",
        period: "month",
        metadata: {
          organization_id: organizationId,
          plan_id: planId
        }
      }
    );
    
    // 4. サブスクリプション情報をデータベースに保存
    await subscriptionService.saveSubscriptionInfo({
      organizationId,
      planId,
      subscriptionId: subscriptionResponse.id,
      status: subscriptionResponse.status,
      startDate: new Date(subscriptionResponse.start_date),
      nextBillingDate: calculateNextBillingDate(subscriptionResponse)
    });
    
    return subscriptionResponse.id;
  } catch (error) {
    console.error('サブスクリプション作成エラー:', error);
    throw error;
  }
}

// 次回請求日の計算
function calculateNextBillingDate(subscription: any): Date {
  const startDate = new Date(subscription.start_date);
  const now = new Date();
  
  // 開始日が未来の場合はそのまま返す
  if (startDate > now) {
    return startDate;
  }
  
  // 期間に応じて次回請求日を計算
  const nextDate = new Date(startDate);
  
  switch (subscription.period) {
    case 'month':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'year':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    // その他の期間...
  }
  
  return nextDate;
}
```

### Webhook処理実装例

```typescript
// app.ts（Express.jsアプリケーション）
app.post('/webhook/univerpay', async (req, res) => {
  try {
    const signature = req.headers['univapay-signature'] as string;
    const payload = req.body;
    
    // 署名検証
    if (!univerpayService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // イベント処理
    await webhookController.processWebhookEvent(payload);
    
    // 成功レスポンス（常に200を返す）
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook処理エラー:', error);
    // エラーが発生してもWebhookには成功レスポンスを返す
    return res.status(200).json({ received: true });
  }
});

// webhook-controller.ts
export class WebhookController {
  private subscriptionService: SubscriptionService;
  private organizationService: OrganizationService;
  private notificationService: NotificationService;
  
  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.organizationService = new OrganizationService();
    this.notificationService = new NotificationService();
  }
  
  async processWebhookEvent(eventPayload: any): Promise<void> {
    const eventType = eventPayload.type;
    const eventData = eventPayload.data;
    const metadata = eventData.metadata || {};
    
    // メタデータから組織IDを取得
    const organizationId = metadata.organization_id;
    
    switch (eventType) {
      case 'CHARGE_FINISHED':
        await this.handleChargeFinished(eventData, organizationId);
        break;
      
      case 'SUBSCRIPTION_PAYMENT':
        await this.handleSubscriptionPayment(eventData, organizationId);
        break;
      
      case 'SUBSCRIPTION_FAILED':
        await this.handleSubscriptionFailed(eventData, organizationId);
        break;
      
      case 'SUBSCRIPTION_CANCELED':
        await this.handleSubscriptionCanceled(eventData, organizationId);
        break;
      
      default:
        console.log(`未処理のイベントタイプ: ${eventType}`);
    }
  }
  
  private async handleChargeFinished(eventData: any, organizationId: string): Promise<void> {
    if (eventData.status === 'successful') {
      // 支払い成功の処理
      if (organizationId) {
        await this.organizationService.updatePaymentStatus(organizationId, 'success');
        await this.notificationService.sendPaymentSuccessNotification(organizationId);
      }
    } else {
      // 支払い失敗の処理
      if (organizationId) {
        await this.organizationService.updatePaymentStatus(organizationId, 'failed');
        await this.notificationService.sendPaymentFailureNotification(organizationId);
      }
    }
  }
  
  private async handleSubscriptionPayment(eventData: any, organizationId: string): Promise<void> {
    // サブスクリプション支払い成功の処理
    if (organizationId) {
      const subscriptionId = eventData.subscription_id;
      await this.subscriptionService.updateSubscriptionStatus(subscriptionId, 'active');
      await this.subscriptionService.updateNextBillingDate(subscriptionId);
    }
  }
  
  private async handleSubscriptionFailed(eventData: any, organizationId: string): Promise<void> {
    // サブスクリプション支払い失敗の処理
    if (organizationId) {
      const subscriptionId = eventData.subscription_id;
      await this.subscriptionService.updateSubscriptionStatus(subscriptionId, 'failed');
      await this.notificationService.sendSubscriptionFailureNotification(organizationId);
      
      // 失敗回数に応じた処理
      const failCount = await this.subscriptionService.incrementFailureCount(organizationId);
      if (failCount >= 3) {
        // 3回以上失敗した場合はアクセスを停止
        await this.organizationService.suspendOrganization(organizationId, '支払い失敗');
      }
    }
  }
  
  private async handleSubscriptionCanceled(eventData: any, organizationId: string): Promise<void> {
    // サブスクリプションキャンセルの処理
    if (organizationId) {
      const subscriptionId = eventData.subscription_id;
      await this.subscriptionService.updateSubscriptionStatus(subscriptionId, 'canceled');
      await this.notificationService.sendSubscriptionCanceledNotification(organizationId);
    }
  }
}
```

これらの実装例を参考に、美姫命アプリケーションのスーパー管理者向け課金・プラン管理機能にUniverpay決済連携を組み込んでください。実際の実装では、アプリケーションの要件や既存のコード構造に合わせて調整する必要があります。

## 実装状況

### 現在の実装状況（2025/5/1更新）

#### バックエンド実装

- ✅ **Univerpay連携サービス**（univerpay.service.ts）
  - トランザクショントークン生成機能
  - サブスクリプション管理機能（作成・取得・更新・停止）
  - 支払い状態確認機能

- ✅ **Webhook処理コントローラ**（payment-webhook.controller.ts）
  - サブスクリプションイベント処理
  - 課金処理イベント処理
  - HMAC-SHA256署名検証

- ✅ **関連サービス実装**
  - サブスクリプション管理サービス
  - 請求書管理サービス
  - 組織管理サービス
  - 通知サービス
  - 監査ログサービス

#### 環境設定

- ✅ 環境変数の設定
  - `UNIVERPAY_APP_TOKEN`: JWTトークン
  - `UNIVERPAY_SECRET`: シークレットキー
  - `UNIVERPAY_MODE`: 実行モード（test/production）
  - `UNIVERPAY_WEBHOOK_SECRET`: Webhook検証用シークレット

#### 残りの実装タスク

- ⬜ **フロントエンド実装**
  - カード情報入力フォーム
  - Univerpayウィジェット連携
  - 支払い状態表示

- ⬜ **3Dセキュア認証対応**（オプション）
  - 認証フロー実装
  - リダイレクト処理

- ⬜ **詳細テスト**
  - Webhook受信テスト
  - サブスクリプションライフサイクルテスト
  - エラー処理テスト

### 次のステップ

1. フロントエンド側のカード情報入力フォームを実装
2. テスト環境での決済フローテスト
3. Webhook受信と処理の詳細テスト
4. 本番環境移行準備とセキュリティレビュー

### 注意点

- 本番環境への移行前に、セキュリティ面の最終チェックを行う
- Webhook URLの設定と検証キーの管理を厳格に行う
- PCI DSS対応のため、カード情報はトークン化して処理する
- テスト環境と本番環境の設定を明確に分離する