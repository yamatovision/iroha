# 請求・支払い管理 実装ガイド

このガイドは組織オーナー（Owner）向けの請求・支払い管理機能の実装について説明します。このページでは、プラン情報の表示、APIトークン使用状況の確認、追加チャージの購入、支払い方法の管理、請求書履歴の確認などを行うことができます。

## 1. 必要なAPIエンドポイント

現在の型定義ファイル（`shared/index.ts`）に、必要なAPIエンドポイントと型定義が追加されています。主なエンドポイントは以下の通りです：

### 1.1 プラン情報取得

```typescript
// プラン情報取得API
GET /api/v1/billing/plan

// レスポンス例
{
  "subscription": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0a7",
    "status": "active",
    "billingCycle": "monthly",
    "nextBillingDate": "2025-05-01T00:00:00.000Z",
    "currentPeriodStart": "2025-04-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-04-30T23:59:59.999Z"
  },
  "plan": {
    "_id": "60a7b3c5e4b0a7b3c5e4b0a8",
    "name": "プロフェッショナル",
    "price": 18000,
    "description": "最大10名のスタイリストまで登録可能なプラン",
    "features": [
      "最大スタイリスト数：10名",
      "クライアント数：無制限",
      "カレンダー連携：利用可能",
      "データエクスポート：毎日"
    ],
    "maxStylists": 10,
    "maxClients": null,
    "maxTokensPerMonth": 5000000
  },
  "monthlyPrice": 18000,
  "yearlyPrice": 181440,
  "tokenUsage": {
    "currentUsage": 3250000,
    "planLimit": 5000000,
    "additionalTokens": 2000000,
    "utilizationPercentage": 65,
    "estimatedConversationsLeft": 2000
  }
}
```

### 1.2 APIトークン使用状況取得

```typescript
// トークン使用状況取得API
GET /api/v1/billing/token-usage

// レスポンス例
{
  "currentPeriod": {
    "start": "2025-04-01T00:00:00.000Z",
    "end": "2025-04-30T23:59:59.999Z"
  },
  "usage": {
    "totalTokens": 3250000,
    "planLimit": 5000000,
    "additionalTokens": 2000000,
    "utilizationPercentage": 65,
    "estimatedConversationsLeft": 2000
  },
  "dailyUsage": [
    {
      "date": "2025-04-01",
      "tokens": 120000
    },
    {
      "date": "2025-04-02",
      "tokens": 150000
    },
    // ...その他の日付データ
  ],
  "userBreakdown": [
    {
      "userId": "60a7b3c5e4b0a7b3c5e4b0a9",
      "userName": "鈴木 太郎",
      "tokens": 1200000,
      "percentage": 36.92
    },
    // ...その他のユーザーデータ
  ],
  "trendData": {
    "previousMonthUsage": 3100000,
    "monthOverMonthChange": 4.8,
    "averageDailyUsage": 110000
  }
}
```

### 1.3 追加トークン購入

```typescript
// トークン購入API
POST /api/v1/billing/purchase-tokens

// リクエスト例
{
  "chargeType": "standard", // または "premium"
  "paymentMethodId": "60a7b3c5e4b0a7b3c5e4b0aa" // 任意、指定しない場合はデフォルト支払い方法を使用
}

// レスポンス例
{
  "success": true,
  "message": "トークンチャージが完了しました",
  "tokenCharge": {
    "tokenAmount": 1000000,
    "price": 980,
    "expirationDate": "2025-04-30T23:59:59.999Z",
    "remainingTokens": 1000000
  },
  "invoiceId": "60a7b3c5e4b0a7b3c5e4b0ab"
}
```

### 1.4 支払い方法の管理

```typescript
// 支払い方法一覧取得API
GET /api/v1/billing/payment-methods

// 支払い方法追加API
POST /api/v1/billing/payment-methods
// リクエスト例
{
  "cardHolder": "鈴木 太郎",
  "cardNumber": "4242424242424242",
  "expiryMonth": 12,
  "expiryYear": 2026,
  "cvc": "123",
  "isDefault": true
}

// 支払い方法削除API
DELETE /api/v1/billing/payment-methods/{methodId}

// デフォルト支払い方法設定API
POST /api/v1/billing/payment-methods/{methodId}/default
```

### 1.5 請求書管理

```typescript
// 請求書一覧取得API
GET /api/v1/billing/invoices?status=all&page=1&limit=10

// 請求書詳細取得API
GET /api/v1/billing/invoices/{invoiceId}

// 請求書ダウンロードAPI
GET /api/v1/billing/invoices/{invoiceId}/pdf
```

### 1.6 プラン変更

```typescript
// プラン変更API
PUT /api/v1/billing/plan

// リクエスト例
{
  "planId": "60a7b3c5e4b0a7b3c5e4b0a8",
  "billingCycle": "yearly",
  "startImmediately": false
}

// レスポンス例
{
  "success": true,
  "message": "プランが変更されました。次回請求時から適用されます。",
  "effectiveDate": "2025-05-01T00:00:00.000Z",
  "newPlan": {
    "name": "プロフェッショナル (年間)",
    "price": 181440
  }
}
```

## 2. コンポーネント構成

請求・支払い管理機能は、以下のコンポーネントで構成されます：

```
components/
  billing/
    BillingPage.tsx                 # メインコンポーネント
    PlanOverview.tsx                # プラン概要表示コンポーネント
    TokenUsageDisplay.tsx           # トークン使用状況表示コンポーネント
    PlanDetails.tsx                 # プラン詳細表示コンポーネント
    TokenPurchaseModal.tsx          # トークン購入モーダル
    PlanChangeModal.tsx             # プラン変更モーダル
    PaymentMethodList.tsx           # 支払い方法一覧表示コンポーネント
    PaymentMethodForm.tsx           # 支払い方法追加フォーム
    InvoiceList.tsx                 # 請求書一覧表示コンポーネント
    InvoiceDetailModal.tsx          # 請求書詳細表示モーダル
```

## 3. 状態管理

請求・支払い管理機能の状態は、以下のような構造で管理します：

```typescript
// BillingPageの状態
interface BillingState {
  currentPlan: {
    subscription: {
      _id: string;
      status: SubscriptionStatus;
      billingCycle: BillingCycle;
      nextBillingDate: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
    };
    plan: {
      _id: string;
      name: string;
      price: number;
      description: string;
      features: string[];
      maxStylists: number | null;
      maxClients: number | null;
      maxTokensPerMonth: number;
    };
    monthlyPrice: number;
    yearlyPrice: number;
    tokenUsage: {
      currentUsage: number;
      planLimit: number;
      additionalTokens: number;
      utilizationPercentage: number;
      estimatedConversationsLeft: number;
    };
  } | null;
  isLoading: boolean;
  error: string | null;
  
  // モーダル表示状態
  isTokenPurchaseModalOpen: boolean;
  isPlanChangeModalOpen: boolean;
  isPaymentMethodModalOpen: boolean;
  isInvoiceDetailModalOpen: boolean;
  
  // 選択中の請求書ID（詳細表示用）
  selectedInvoiceId: string | null;
}
```

## 4. データフロー

請求・支払い管理機能の基本的なデータフローは以下の通りです：

1. ページ読み込み時に、現在のプラン情報を取得
2. プラン情報を表示（概要、API使用状況、詳細情報）
3. 支払い方法一覧を取得して表示
4. 請求書履歴を取得して表示
5. ユーザーのアクション（トークン購入、プラン変更など）に応じて該当APIを呼び出し
6. API呼び出し後、必要に応じて画面の情報を更新

## 5. 主要な実装ポイント

### 5.1 プラン概要・トークン使用状況表示

```tsx
// PlanOverview.tsx
import React from 'react';
import { Card, Typography, Grid } from '@mui/material';
import { CurrentPlanResponse } from '../../shared';

interface PlanOverviewProps {
  planData: CurrentPlanResponse;
}

const PlanOverview: React.FC<PlanOverviewProps> = ({ planData }) => {
  const { subscription, plan, tokenUsage } = planData;
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card className="summary-card">
          <div className="summary-title">現在のプラン</div>
          <div className="summary-value">{plan.name}</div>
          <div className="summary-label">次回更新日: {new Date(subscription.nextBillingDate).toLocaleDateString('ja-JP')}</div>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card className="summary-card">
          <div className="summary-title">月額料金</div>
          <div className="summary-value">¥{plan.price.toLocaleString()}</div>
          <div className="summary-label">税込 (¥{Math.floor(plan.price * 1.1).toLocaleString()})</div>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card className="summary-card">
          <div className="summary-title">次回請求日</div>
          <div className="summary-value">{new Date(subscription.nextBillingDate).toLocaleDateString('ja-JP')}</div>
          <div className="summary-label">自動更新</div>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card className="summary-card">
          <div className="summary-title">APIトークン使用状況</div>
          <div className="summary-value">
            {Math.floor(tokenUsage.currentUsage / 1000).toLocaleString()} / {Math.floor(tokenUsage.planLimit / 1000).toLocaleString()}
          </div>
          <div className="progress">
            <div 
              className="determinate" 
              style={{ width: `${tokenUsage.utilizationPercentage}%` }}
            ></div>
          </div>
          <div className="summary-label">今月の使用率: {tokenUsage.utilizationPercentage}%</div>
          {tokenUsage.additionalTokens > 0 && (
            <>
              <div className="token-info">
                追加チャージ: <span className="token-value">{(tokenUsage.additionalTokens / 1000000).toLocaleString()}</span> トークン
              </div>
              <div className="token-info">
                残り約 <span className="token-value">{tokenUsage.estimatedConversationsLeft.toLocaleString()}</span> 会話分
              </div>
            </>
          )}
        </Card>
      </Grid>
    </Grid>
  );
};

export default PlanOverview;
```

### 5.2 トークン購入モーダル

```tsx
// TokenPurchaseModal.tsx
import React, { useState } from 'react';
import { 
  Modal, ModalHeader, ModalContent, ModalFooter,
  Button, Card, CardContent, Typography, Radio
} from '@mui/material';
import { billingService } from '../../services/billing.service';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 購入成功時にプラン情報を再取得するためのコールバック
}

const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({ 
  isOpen, onClose, onSuccess 
}) => {
  const [selectedType, setSelectedType] = useState<'standard' | 'premium'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await billingService.purchaseTokens({
        chargeType: selectedType
      });
      
      // 成功時の処理
      onSuccess();
      onClose();
    } catch (err) {
      setError('トークン購入に失敗しました。後でもう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>APIトークンチャージ購入</ModalHeader>
        
        <div className="token-purchase-content">
          <p>現在のAPIトークン残量に追加チャージすることができます。チャージしたトークンは今月末まで有効です。</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="purchase-options">
            <Card 
              className={`purchase-option ${selectedType === 'standard' ? 'selected' : ''}`}
              onClick={() => setSelectedType('standard')}
            >
              <CardContent>
                <div className="option-header">
                  <Radio checked={selectedType === 'standard'} />
                  <Typography variant="h6">スタンダードチャージ</Typography>
                </div>
                <Typography variant="h4" className="price">¥980</Typography>
                <Typography variant="h6" className="token-amount">1,000,000トークン</Typography>
                <ul className="benefits">
                  <li>約1,000回分の通常チャット</li>
                  <li>即時チャージ反映</li>
                  <li>今月末まで有効</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card 
              className={`purchase-option premium ${selectedType === 'premium' ? 'selected' : ''}`}
              onClick={() => setSelectedType('premium')}
            >
              <CardContent>
                <div className="option-header">
                  <Radio checked={selectedType === 'premium'} />
                  <Typography variant="h6">プレミアムチャージ</Typography>
                  <span className="badge">お得</span>
                </div>
                <Typography variant="h4" className="price">¥8,000</Typography>
                <Typography variant="h6" className="token-amount">10,000,000トークン</Typography>
                <ul className="benefits">
                  <li>約10,000回分の通常チャット</li>
                  <li>即時チャージ反映</li>
                  <li>今月末まで有効</li>
                  <li><strong>18%お得</strong>（1トークンあたり）</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="note">
            <p>※チャージ購入したトークンは、プラン上限に追加されます（今月のみ有効、翌月への繰り越しはできません）</p>
            <p>※購入後すぐに利用可能です。料金は請求書に自動的に追加されます。</p>
          </div>
        </div>
        
        <ModalFooter>
          <Button onClick={onClose} disabled={isSubmitting}>キャンセル</Button>
          <Button 
            color="primary" 
            variant="contained" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '処理中...' : '購入する'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TokenPurchaseModal;
```

### 5.3 支払い方法の管理

```tsx
// PaymentMethodList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, IconButton, Button } from '@mui/material';
import { Edit, Delete, CreditCard } from '@mui/icons-material';
import { billingService } from '../../services/billing.service';
import { IPaymentMethod } from '../../shared';

interface PaymentMethodListProps {
  onAddClick: () => void; // 支払い方法追加モーダルを開くためのコールバック
}

const PaymentMethodList: React.FC<PaymentMethodListProps> = ({ onAddClick }) => {
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 支払い方法一覧を取得
  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await billingService.getPaymentMethods();
      setPaymentMethods(response.paymentMethods);
      setError(null);
    } catch (err) {
      setError('支払い方法の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 支払い方法を削除
  const handleDelete = async (methodId: string) => {
    if (!window.confirm('この支払い方法を削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await billingService.deletePaymentMethod(methodId);
      // 削除後に一覧を再取得
      fetchPaymentMethods();
    } catch (err) {
      setError('支払い方法の削除に失敗しました');
    }
  };
  
  // デフォルト支払い方法に設定
  const handleSetDefault = async (methodId: string) => {
    try {
      await billingService.setDefaultPaymentMethod(methodId);
      // 設定後に一覧を再取得
      fetchPaymentMethods();
    } catch (err) {
      setError('デフォルト支払い方法の設定に失敗しました');
    }
  };
  
  useEffect(() => {
    fetchPaymentMethods();
  }, []);
  
  if (isLoading) {
    return <div>読み込み中...</div>;
  }
  
  return (
    <Card>
      <CardContent>
        <div className="card-header">
          <Typography variant="h6">支払い方法</Typography>
          <Button onClick={onAddClick}>
            <i className="material-icons left">add</i>
            支払い方法の追加
          </Button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {paymentMethods.length === 0 ? (
          <div className="empty-state">
            登録されている支払い方法はありません。「支払い方法の追加」から登録してください。
          </div>
        ) : (
          paymentMethods.map(method => (
            <div key={method._id} className="payment-method">
              <CreditCard className="card-logo" />
              <div className="payment-method-info">
                <div className="card-name">
                  {method.brand} •••• {method.last4}
                  {method.isDefault && <span className="default-badge">デフォルト</span>}
                </div>
                <div className="card-expiry">
                  有効期限: {method.expiryMonth}/{String(method.expiryYear).slice(-2)}
                </div>
              </div>
              <div className="payment-method-actions">
                {!method.isDefault && (
                  <Button 
                    className="action-btn"
                    onClick={() => handleSetDefault(method._id)}
                  >
                    デフォルトに設定
                  </Button>
                )}
                <IconButton 
                  className="action-btn" 
                  onClick={() => handleDelete(method._id)}
                >
                  <Delete />
                </IconButton>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodList;
```

### 5.4 請求書一覧の表示

```tsx
// InvoiceList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Table, TableHead, 
  TableBody, TableRow, TableCell, Chip, IconButton,
  Pagination
} from '@mui/material';
import { Download, Visibility } from '@mui/icons-material';
import { billingService } from '../../services/billing.service';
import { InvoiceStatus } from '../../shared';

interface InvoiceListProps {
  onViewInvoice: (invoiceId: string) => void; // 請求書詳細を表示するためのコールバック
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onViewInvoice }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 10 });
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 請求書一覧を取得
  const fetchInvoices = async (page = 1, status = filter) => {
    try {
      setIsLoading(true);
      const response = await billingService.getInvoices({ 
        page, 
        limit: pagination.limit,
        status
      });
      setInvoices(response.invoices);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('請求書の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // フィルターの変更時
  const handleFilterChange = (newFilter: InvoiceStatus | 'all') => {
    setFilter(newFilter);
    fetchInvoices(1, newFilter);
  };
  
  // ページ変更時
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    fetchInvoices(page);
  };
  
  // 請求書ダウンロード
  const handleDownload = async (invoiceId: string) => {
    try {
      await billingService.downloadInvoice(invoiceId);
    } catch (err) {
      setError('請求書のダウンロードに失敗しました');
    }
  };
  
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  // 請求書ステータスに応じたバッジの色を設定
  const getStatusBadgeClass = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'status-badge status-paid';
      case 'pending': return 'status-badge status-pending';
      case 'past_due': return 'status-badge status-overdue';
      default: return 'status-badge';
    }
  };
  
  // 請求書ステータスの日本語表示
  const getStatusText = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return '支払い済み';
      case 'pending': return '未払い';
      case 'past_due': return '延滞中';
      case 'canceled': return 'キャンセル';
      default: return status;
    }
  };
  
  if (isLoading && invoices.length === 0) {
    return <div>読み込み中...</div>;
  }
  
  return (
    <Card>
      <CardContent>
        <div className="card-header">
          <Typography variant="h6">請求書履歴</Typography>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="payment-status-filter">
          <div 
            className={`filter-item ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            すべて
          </div>
          <div 
            className={`filter-item ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => handleFilterChange('paid')}
          >
            支払い済み
          </div>
          <div 
            className={`filter-item ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            未払い
          </div>
          <div 
            className={`filter-item ${filter === 'past_due' ? 'active' : ''}`}
            onClick={() => handleFilterChange('past_due')}
          >
            延滞中
          </div>
        </div>
        
        {invoices.length === 0 ? (
          <div className="empty-state">
            請求書がありません
          </div>
        ) : (
          <>
            <Table className="invoice-list">
              <TableHead>
                <TableRow>
                  <TableCell>請求書番号</TableCell>
                  <TableCell>発行日</TableCell>
                  <TableCell>請求金額</TableCell>
                  <TableCell>支払期限</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(invoice => (
                  <TableRow key={invoice._id}>
                    <TableCell>
                      <a 
                        href="#" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          onViewInvoice(invoice._id); 
                        }}
                      >
                        {invoice.invoiceNumber}
                      </a>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issueDate).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>¥{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      <span className={getStatusBadgeClass(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        className="action-btn"
                        onClick={() => onViewInvoice(invoice._id)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        className="action-btn"
                        onClick={() => handleDownload(invoice._id)}
                      >
                        <Download />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {pagination.pages > 1 && (
              <div className="pagination-container">
                <Pagination 
                  count={pagination.pages} 
                  page={pagination.page} 
                  onChange={handlePageChange}
                  color="primary"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
```

### 5.5 サービス実装

```typescript
// billing.service.ts
import { API_BASE_PATH, BILLING } from '../shared';
import { apiService } from './api.service';

export const billingService = {
  // 現在のプラン情報を取得
  async getCurrentPlan() {
    const response = await apiService.get(BILLING.GET_CURRENT_PLAN);
    return response.data;
  },
  
  // トークン使用状況を取得
  async getTokenUsage() {
    const response = await apiService.get(BILLING.GET_TOKEN_USAGE);
    return response.data;
  },
  
  // 追加トークンを購入
  async purchaseTokens(data) {
    const response = await apiService.post(BILLING.PURCHASE_TOKENS, data);
    return response.data;
  },
  
  // 支払い方法一覧を取得
  async getPaymentMethods() {
    const response = await apiService.get(BILLING.GET_PAYMENT_METHODS);
    return response.data;
  },
  
  // 支払い方法を追加
  async addPaymentMethod(data) {
    const response = await apiService.post(BILLING.ADD_PAYMENT_METHOD, data);
    return response.data;
  },
  
  // 支払い方法を削除
  async deletePaymentMethod(methodId) {
    const response = await apiService.delete(BILLING.DELETE_PAYMENT_METHOD(methodId));
    return response.data;
  },
  
  // デフォルト支払い方法を設定
  async setDefaultPaymentMethod(methodId) {
    const response = await apiService.post(BILLING.SET_DEFAULT_PAYMENT_METHOD(methodId));
    return response.data;
  },
  
  // 請求書一覧を取得
  async getInvoices(params) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `${BILLING.GET_INVOICES}?${queryParams.toString()}`;
    const response = await apiService.get(url);
    return response.data;
  },
  
  // 請求書詳細を取得
  async getInvoiceDetail(invoiceId) {
    const response = await apiService.get(BILLING.GET_INVOICE_DETAIL(invoiceId));
    return response.data;
  },
  
  // 請求書PDFをダウンロード
  async downloadInvoice(invoiceId) {
    const response = await apiService.get(BILLING.DOWNLOAD_INVOICE(invoiceId), {
      responseType: 'blob'
    });
    
    // ブラウザでダウンロードを開始
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  // プラン変更
  async changePlan(data) {
    const response = await apiService.put(BILLING.CHANGE_PLAN, data);
    return response.data;
  },
  
  // 課金サイクル変更
  async changeBillingCycle(data) {
    const response = await apiService.post(BILLING.CHANGE_BILLING_CYCLE, data);
    return response.data;
  }
};
```

## 6. メインコンポーネント実装

メイン画面は以下のようなレイアウトになります：

```tsx
// BillingPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Button } from '@mui/material';
import PlanOverview from './PlanOverview';
import PlanDetails from './PlanDetails';
import PaymentMethodList from './PaymentMethodList';
import InvoiceList from './InvoiceList';
import TokenPurchaseModal from './TokenPurchaseModal';
import PaymentMethodForm from './PaymentMethodForm';
import PlanChangeModal from './PlanChangeModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import { billingService } from '../../services/billing.service';

const BillingPage: React.FC = () => {
  // 状態管理
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // モーダル表示状態
  const [isTokenPurchaseModalOpen, setIsTokenPurchaseModalOpen] = useState(false);
  const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  // 現在のプラン情報を取得
  const fetchCurrentPlan = async () => {
    try {
      setIsLoading(true);
      const response = await billingService.getCurrentPlan();
      setCurrentPlan(response);
      setError(null);
    } catch (err) {
      setError('プラン情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 請求書詳細モーダルを表示
  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setIsInvoiceDetailModalOpen(true);
  };
  
  useEffect(() => {
    fetchCurrentPlan();
  }, []);
  
  if (isLoading) {
    return <div>読み込み中...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <Container className="main-content">
      <div className="header">
        <Typography variant="h5" className="page-title">請求・支払い管理</Typography>
      </div>
      
      {currentPlan && (
        <>
          {/* プラン概要 */}
          <PlanOverview planData={currentPlan} />
          
          {/* プラン詳細 */}
          <PlanDetails 
            planData={currentPlan}
            onPurchaseToken={() => setIsTokenPurchaseModalOpen(true)}
            onChangePlan={() => setIsPlanChangeModalOpen(true)}
          />
          
          {/* 支払い方法リスト */}
          <PaymentMethodList 
            onAddClick={() => setIsPaymentMethodModalOpen(true)}
          />
          
          {/* 請求書一覧 */}
          <InvoiceList 
            onViewInvoice={handleViewInvoice}
          />
          
          {/* モーダルコンポーネント */}
          <TokenPurchaseModal 
            isOpen={isTokenPurchaseModalOpen}
            onClose={() => setIsTokenPurchaseModalOpen(false)}
            onSuccess={fetchCurrentPlan}
          />
          
          <PlanChangeModal 
            isOpen={isPlanChangeModalOpen}
            onClose={() => setIsPlanChangeModalOpen(false)}
            currentPlan={currentPlan}
            onSuccess={fetchCurrentPlan}
          />
          
          <PaymentMethodForm 
            isOpen={isPaymentMethodModalOpen}
            onClose={() => setIsPaymentMethodModalOpen(false)}
            onSuccess={() => {
              // 支払い方法が追加されたら、modalを閉じる
              setIsPaymentMethodModalOpen(false);
            }}
          />
          
          {selectedInvoiceId && (
            <InvoiceDetailModal 
              isOpen={isInvoiceDetailModalOpen}
              onClose={() => {
                setIsInvoiceDetailModalOpen(false);
                setSelectedInvoiceId(null);
              }}
              invoiceId={selectedInvoiceId}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default BillingPage;
```

## 7. 主要なエッジケースと対処法

1. **トークン購入失敗時**
   - 決済サービスのエラーハンドリングを適切に行い、ユーザーフレンドリーなエラーメッセージを表示する
   - リトライ機能を提供する

2. **支払い方法の不足**
   - 支払い方法が登録されていない場合は、トークン購入時に支払い方法追加フォームを表示する
   - 支払い方法の追加がキャンセルされた場合は、トークン購入フローも中断する

3. **請求書の不正なステータス**
   - サーバーサイドで許可されていないステータス遷移が発生しないよう、適切なバリデーションを実装する
   - クライアントでもステータスに応じたUI表示を正しく制御する

4. **プラン変更の自動適用タイミング**
   - プラン変更が即時適用されるか、次回請求日から適用されるかを明確に表示する
   - プラン変更後の料金計算（日割り計算など）についても明確に表示する

5. **トークン使用量の突発的な増加**
   - 閾値（80%、95%など）に達した際に通知を表示
   - 異常な使用パターンを検出した場合は警告を表示
   - 使用量制限に達した場合のグレースフル・デグラデーションを実装

## 8. テスト戦略

1. **単体テスト**
   - 各コンポーネントの正常表示
   - フォームのバリデーション
   - エラー表示
   - モーダルの開閉

2. **統合テスト**
   - API呼び出しの成功/失敗
   - データの正しい表示
   - フィルタリングの動作
   - ページネーションの動作

3. **シナリオテスト**
   - プラン変更フロー
   - トークン購入フロー
   - 支払い方法追加/削除フロー
   - 請求書詳細表示フロー

## 9. モバイル対応

レスポンシブデザインに対応するため、以下の点に注意します：

1. グリッドレイアウトを活用し、画面サイズに応じて適切にカラム数を調整
2. モバイル画面ではカード表示を縦長レイアウトに最適化
3. テーブル表示をモバイル画面に適したカード形式に変更
4. タッチ操作に適したUI要素のサイズと間隔の確保

## 10. パフォーマンス最適化

1. 不要な再レンダリングを避けるためのメモ化（React.memo, useMemo, useCallback）
2. 大量のデータを扱う場合は仮想化リストの活用
3. 画像の遅延読み込み
4. APIデータのキャッシュ

## 11. セキュリティ考慮点

1. 支払い情報は直接クライアントに保存せず、トークン化して扱う
2. APIリクエストはすべて認証付きで行う
3. 支払い関連の操作は適切な権限チェックを行う
4. ロールベースのアクセス制御を徹底する（Ownerロールのみが請求・支払い管理にアクセス可能）

## 12. 実装優先順位

1. プラン概要・詳細表示機能
2. 請求書一覧表示機能
3. 支払い方法管理機能
4. トークン購入機能
5. プラン変更機能

この順序で実装を進めることで、必要最小限の機能からリリースし、段階的に機能を追加していくことができます。