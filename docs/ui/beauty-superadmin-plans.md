# 課金・プラン管理と収益シミュレーション UI設計書

## 概要

この文書は美姫命アプリケーションのSuperAdmin向け課金・プラン管理および収益シミュレーション機能のUIについて定義します。収益シミュレーション、プラン設定、および請求管理機能のユーザーインターフェース設計を詳細に記述します。

## 1. 画面構成

### 1.1 メイン画面構成

課金・プラン管理画面は、以下の3つのタブで構成されます：

1. **収益シミュレーションタブ**: トークン使用量と収益のシミュレーション画面
2. **プラン設定タブ**: サービスのプラン作成・編集・管理画面
3. **請求管理タブ**: 各組織の請求書管理画面

### 1.2 全体レイアウト

```
+-----------------------------------------------------+
| ヘッダー（美姫命 スーパー管理者）                    |
+-----------------------------------------------------+
|        |                                            |
| サイド |  タイトル（課金・プラン管理）               |
| バー   |  +----------------------------------------+|
|        |  | 収益シミュレーション | プラン設定 | 請求管理 ||
|        |  +----------------------------------------+|
|        |  |                                        ||
|        |  |  コンテンツエリア                      ||
|        |  |                                        ||
|        |  |                                        ||
|        |  |                                        ||
|        |  |                                        ||
|        |  |                                        ||
|        |  |                                        ||
+-----------------------------------------------------+
```

## 2. プラン設定タブ

### 2.1 プラン一覧

#### 構成要素

- タイトル「プラン一覧」
- 新規プラン作成ボタン
- プランカードのグリッド表示

#### プランカード

各プランは以下の情報を含むカード形式で表示：

- プランヘッダー部分
  - プラン名（左）
  - 月額料金（右）
- プランボディ部分
  - プラン説明
  - 機能リスト（チェックマーク付きリスト形式）
  - 現在の利用組織数
  - アクションボタン（編集、削除）

### 2.2 プランモーダル（作成・編集）

#### 構成要素

- モーダルヘッダー：「新規プラン作成」または「○○プラン編集」
- フォームフィールド：
  - プラン名（必須）
  - 月額料金（必須）
  - 請求サイクル（月額・年額）
  - プラン説明
  - 最大スタイリスト数（無制限の場合は空欄）
  - 最大クライアント数（無制限の場合は空欄）
  - 機能一覧（追加・削除可能なリスト）
- フッターボタン：「キャンセル」「保存」

#### バリデーション

- プラン名：必須、1〜50文字
- 月額料金：必須、0以上の整数
- プラン説明：500文字以内
- 最大スタイリスト数：任意、0以上の整数または空（無制限）
- 最大クライアント数：任意、0以上の整数または空（無制限）

## 3. 請求管理タブ

### 3.1 請求書一覧

#### 構成要素

- タイトル「請求書一覧」
- フィルター：
  - プラン選択ドロップダウン
  - ステータス選択ドロップダウン
  - 支払い状態フィルター（追加）：「すべて」「支払い待ち」「支払い遅延」「支払い済み」
- 新規請求書作成ボタン
- 支払い状態サマリーカード（追加）
- 一括操作セクション（追加）
- 請求書テーブル
- ページネーションコントロール

#### 支払い状態サマリーカード

支払い状況のサマリーを表示するカードセクション：

```html
<div class="summary-cards">
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">warning</span></div>
    <div class="card-content">
      <div class="card-label">支払い遅延</div>
      <div class="card-value">3</div>
    </div>
    <div class="card-indicator-warning">自動停止候補</div>
  </div>
  
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">hourglass_top</span></div>
    <div class="card-content">
      <div class="card-label">支払い待ち</div>
      <div class="card-value">5</div>
    </div>
  </div>
  
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">block</span></div>
    <div class="card-content">
      <div class="card-label">停止中</div>
      <div class="card-value">2</div>
    </div>
  </div>
</div>
```

#### 一括操作セクション

支払い関連の一括操作機能を提供するセクション：

```html
<div class="bulk-action">
  <div class="bulk-checkbox">
    <input type="checkbox" id="selectAllOverdue">
    <label for="selectAllOverdue">すべての支払い遅延を選択</label>
  </div>
  
  <select class="bulk-select">
    <option value="">一括操作を選択...</option>
    <option value="remind">催促メール送信</option>
    <option value="suspend">即時停止</option>
    <option value="extend">支払期限延長</option>
  </select>
  
  <button class="action-button">
    <span class="material-icons">play_arrow</span>
    実行
  </button>
</div>
```

#### 請求書テーブル

テーブルは以下のカラムで構成：

- 請求書番号
- 組織名
- プラン
- 金額
- 発行日
- 支払期限
- ステータス（バッジ表示）
- 組織状態（バッジ表示）（追加）
- 操作（請求書表示ボタン、アクションメニュー）

#### アクションメニュー

各請求書の操作メニュー：

- 詳細表示
- ダウンロード
- 再送信
- 支払い催促（支払い遅延の場合のみ）
- 組織を停止（支払い遅延の場合のみ）（追加）
- アクセス復元（組織停止中の場合のみ）（追加）

### 3.2 請求書詳細モーダル

#### 構成要素

- モーダルヘッダー：「請求書詳細」
- 詳細情報：
  - 請求書番号
  - 組織情報
  - ステータス
  - 発行日、支払期限、支払日
  - 請求項目テーブル
  - 合計金額
  - 備考
- 組織状態セクション（追加）：
  ```html
  <div class="section-header">組織状態</div>
  <div class="status-section">
    <div class="status-display">
      <span class="status-badge status-suspended">停止中</span>
      <span class="status-date">2025/04/25から</span>
    </div>
    <button class="action-button success">
      <span class="material-icons">check_circle</span>
      アクセス復元
    </button>
  </div>
  ```
- 支払い状態セクション（追加）：
  ```html
  <div class="section-header">支払い状態</div>
  <div class="status-section">
    <div class="status-display">
      <span class="status-badge status-past-due">支払い遅延</span>
      <span class="status-date">15日経過</span>
    </div>
    <button class="action-button warning">
      <span class="material-icons">email</span>
      催促メール送信
    </button>
  </div>
  <div class="status-info">
    <span class="material-icons">info</span>
    最終支払い失敗: カード決済拒否 (2025/04/15)
  </div>
  ```
- フッターボタン：「閉じる」「ステータス変更」

### 3.3 支払い催促メール送信モーダル（追加）

#### 構成要素

- モーダルヘッダー：「支払い催促メール送信」
- 組織情報表示
- メールテンプレート選択ドロップダウン
- 追加メッセージ入力エリア（オプション）
- CCメールアドレス入力フィールド（オプション）
- プレビューボタン
- メールプレビューエリア
- フッターボタン：「キャンセル」「送信」

### 3.4 組織アクセス停止モーダル（追加）

#### 構成要素

- モーダルヘッダー：「組織アクセス停止」
- 警告メッセージ：「この操作により、サロン『XXX』のすべてのユーザーがサービスにアクセスできなくなります。」
- 停止理由入力フィールド
- オーナー通知オプション（チェックボックス）
- フッターボタン：「キャンセル」「停止する」

### 3.5 アクセス復元モーダル（追加）

#### 構成要素

- モーダルヘッダー：「組織アクセス復元」
- 組織情報表示
- 復元理由入力フィールド（オプション）
- 支払い状態リセットオプション（チェックボックス）
- 支払期限延長オプション（チェックボックス）
  - 延長日数入力フィールド（表示/非表示切替）
- オーナー通知オプション（チェックボックス）
- フッターボタン：「キャンセル」「復元する」

## 4. 状態管理設計

### 4.1 ページレベルの状態

```typescript
// プラン設定タブの状態
interface PlanState {
  plans: PricePlan[];
  isLoading: boolean;
  error: string | null;
  selectedPlan: PricePlan | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
}

// 請求管理タブの状態
interface InvoiceState {
  invoices: Invoice[];
  totalCount: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    planId: string | null;
    status: string | null;
    paymentStatus: string | null; // 追加: 支払い状態フィルター
    organizationStatus: string | null; // 追加: 組織状態フィルター
  };
  selectedInvoice: Invoice | null;
  isModalOpen: boolean;
  paymentSummary: { // 追加: 支払い状態サマリー
    overdue: number;
    pending: number;
    suspended: number;
  };
  // 追加: 各モーダルの状態
  paymentReminderModal: {
    isOpen: boolean;
    organizationId: string | null;
    invoiceId: string | null;
  };
  suspendModal: {
    isOpen: boolean;
    organizationId: string | null;
  };
  restoreModal: {
    isOpen: boolean;
    organizationId: string | null;
  };
}
```

### 4.2 グローバル状態とローカル状態の区分

- **グローバル状態**（Context経由で管理）
  - プラン一覧データ
  - 認証情報
  - 通知メッセージ

- **ローカル状態**（コンポーネント内で管理）
  - UI表示状態（モーダル表示、アクティブタブなど）
  - フォーム入力値
  - ページングやフィルター情報

### 4.3 主要コンポーネントと状態フロー

```
SuperAdminPlansPage
├─ TabComponent (アクティブタブ状態管理)
│  ├─ PlansTab (プラン一覧表示、モーダル状態管理)
│  │  ├─ PlanCard (個別プラン表示)
│  │  └─ PlanModal (プラン編集フォーム状態管理)
│  └─ InvoicesTab (請求書一覧、フィルター状態管理)
│     ├─ InvoiceTable (テーブル表示)
│     ├─ InvoiceDetailModal (詳細表示)
│     └─ PaginationControls (ページ状態管理)
└─ NotificationComponent (通知表示)
```

## 5. データフローと状態更新

### 5.1 プラン管理データフロー

1. **一覧読み込み**
   ```
   ページロード → API呼び出し → 状態更新 → UI表示
   ```

2. **プラン作成フロー**
   ```
   作成ボタンクリック → モーダル表示 → フォーム入力 → 保存ボタンクリック → 
   バリデーション → API呼び出し → 状態更新 → モーダル閉じる → UI更新
   ```

3. **プラン編集フロー**
   ```
   編集ボタンクリック → プラン情報取得 → モーダル表示 → 
   フォーム入力 → 保存ボタンクリック → バリデーション → 
   API呼び出し → 状態更新 → モーダル閉じる → UI更新
   ```

4. **プラン削除フロー**
   ```
   削除ボタンクリック → 確認ダイアログ表示 → 確認 → 
   API呼び出し → 状態更新 → UI更新
   ```

### 5.2 請求書管理データフロー

1. **一覧読み込み**
   ```
   ページロード → API呼び出し → 状態更新 → UI表示
   ```

2. **フィルタリング**
   ```
   フィルター変更 → 状態更新 → API呼び出し → 状態更新 → UI更新
   ```

3. **請求書詳細表示**
   ```
   詳細ボタンクリック → 詳細情報取得 → モーダル表示
   ```

4. **ステータス更新フロー**
   ```
   ステータス変更ボタンクリック → ステータス選択 → API呼び出し → 
   状態更新 → UI更新
   ```

5. **支払い催促メール送信フロー**（追加）
   ```
   催促ボタンクリック → 組織情報取得 → モーダル表示 → 
   メッセージ入力 → 送信ボタンクリック → API呼び出し → 
   成功通知表示 → モーダル閉じる
   ```

6. **組織アクセス停止フロー**（追加）
   ```
   停止ボタンクリック → 組織情報取得 → モーダル表示 → 
   停止理由入力 → 確認ボタンクリック → API呼び出し → 
   状態更新 → UI更新 → モーダル閉じる
   ```

7. **アクセス復元フロー**（追加）
   ```
   復元ボタンクリック → 組織情報取得 → モーダル表示 → 
   オプション選択 → 確認ボタンクリック → API呼び出し → 
   状態更新 → UI更新 → モーダル閉じる
   ```

8. **一括処理フロー**（追加）
   ```
   対象選択 → 処理選択 → 実行ボタンクリック → 確認ダイアログ表示 → 
   確認 → API呼び出し → 状態更新 → UI更新
   ```

## 6. エラー処理

### 6.1 エラー表示方法

- API呼び出しエラー → 通知コンポーネントでトースト表示
- フォームバリデーションエラー → フィールド直下に赤字でエラーメッセージ表示
- 致命的エラー → 全画面エラーメッセージ表示

### 6.2 エラーリカバリー

- 読み込みエラー → 再試行ボタン表示
- 保存エラー → エラーメッセージ表示し、フォームは維持
- ネットワークエラー → オフラインアイコン表示と自動再接続

## 7. レスポンシブデザイン対応

プラン管理画面はデスクトップ利用を前提としますが、以下のレスポンシブ対応を行います：

### 7.1 ブレークポイント

- デスクトップ: 1200px以上
- タブレット: 768px〜1199px
- モバイル: 767px以下

### 7.2 レスポンシブ対応ポイント

- **デスクトップ**: フル機能表示
- **タブレット**:
  - プランカードは2列グリッド
  - フォームフィールドは縦配置
  - テーブルはスクロール可能
- **モバイル**:
  - プランカードは1列グリッド
  - フォームはシンプル化
  - テーブルはカード表示に切り替え

## 8. アクセシビリティ対応

- 色のみに依存しない情報伝達（アイコンとテキスト併用）
- キーボード操作の完全サポート
- スクリーンリーダー対応（適切なARIAラベル設定）
- 十分なコントラスト比の確保

## 9. パフォーマンス考慮事項

- 仮想スクロールによる大量データ対応
- 必要に応じた遅延読み込み
- 状態更新の最適化（不要な再レンダリングの防止）
- モーダル表示時のデータ事前読み込み

## 10. コンポーネント設計

### 10.1 コンポーネント階層図

```
SuperAdminPlansPage（ページコンポーネント）
├─ Header（ヘッダーコンポーネント）
├─ Sidebar（サイドバーコンポーネント）
├─ PageTitle（タイトルコンポーネント）
├─ TabComponent（タブコンポーネント）
│  ├─ PlansTab（プラン設定タブコンポーネント）
│  │  ├─ ActionButton（新規作成ボタンコンポーネント）
│  │  ├─ PlansGrid（プラン一覧グリッドコンポーネント）
│  │  │  └─ PlanCard（プランカードコンポーネント）
│  │  └─ PlanFormModal（プラン編集モーダルコンポーネント）
│  │     ├─ TextInput（テキスト入力コンポーネント）
│  │     ├─ NumberInput（数値入力コンポーネント）
│  │     ├─ TextArea（テキストエリアコンポーネント）
│  │     ├─ FeatureList（機能リストコンポーネント）
│  │     └─ ModalFooter（モーダルフッターコンポーネント）
│  └─ InvoicesTab（請求管理タブコンポーネント）
│     ├─ FilterControls（フィルターコントロールコンポーネント）
│     ├─ PaymentStatusSummary（支払い状態サマリーコンポーネント）（追加）
│     ├─ BulkActionControls（一括操作コントロールコンポーネント）（追加）
│     ├─ ActionButton（新規作成ボタンコンポーネント）
│     ├─ InvoiceTable（請求書テーブルコンポーネント）
│     │  ├─ StatusBadge（ステータスバッジコンポーネント）
│     │  ├─ OrganizationStatusBadge（組織状態バッジコンポーネント）（追加）
│     │  ├─ PaymentStatusBadge（支払い状態バッジコンポーネント）（追加）
│     │  ├─ ActionMenu（アクションメニューコンポーネント）
│     │  └─ ActionButton（アクションボタンコンポーネント）
│     ├─ Pagination（ページネーションコンポーネント）
│     ├─ InvoiceDetailModal（請求書詳細モーダルコンポーネント）
│     │  ├─ OrganizationStatusSection（組織状態セクションコンポーネント）（追加）
│     │  └─ PaymentStatusSection（支払い状態セクションコンポーネント）（追加）
│     ├─ PaymentReminderModal（支払い催促モーダルコンポーネント）（追加）
│     ├─ OrganizationSuspendModal（組織停止モーダルコンポーネント）（追加）
│     └─ AccessRestoreModal（アクセス復元モーダルコンポーネント）（追加）
└─ Notification（通知コンポーネント）
```

### 10.2 各コンポーネントの責任範囲

- **SuperAdminPlansPage**: 全体のレイアウト管理、グローバル状態管理
- **TabComponent**: タブ切り替え管理
- **PlansTab**: プラン一覧表示と操作管理
- **InvoicesTab**: 請求書一覧表示と操作管理
- **PlanFormModal**: プラン作成・編集フォーム管理
- **InvoiceDetailModal**: 請求書詳細表示と操作管理
- **PaymentStatusSummary**: 支払い状態サマリーカードの表示（追加）
- **BulkActionControls**: 一括操作コントロールの表示と操作管理（追加）
- **OrganizationStatusBadge**: 組織状態を視覚的に表示（追加）
- **PaymentStatusBadge**: 支払い状態を視覚的に表示（追加）
- **PaymentReminderModal**: 支払い催促メール送信フォーム管理（追加）
- **OrganizationSuspendModal**: 組織停止フォーム管理（追加）
- **AccessRestoreModal**: アクセス復元フォーム管理（追加）

### 10.3 支払い状態関連の新規コンポーネント（追加）

#### PaymentStatusBadge

```tsx
// src/components/SuperAdmin/common/PaymentStatusBadge.tsx
import React from 'react';
import { PaymentStatus } from '../../../types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  daysOverdue?: number;
  compact?: boolean;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  daysOverdue,
  compact = false
}) => {
  let statusText = '';
  let statusIcon = '';
  let statusClass = '';
  
  switch (status) {
    case 'success':
      statusText = '支払い済み';
      statusIcon = 'check_circle';
      statusClass = 'status-success';
      break;
    case 'pending':
      statusText = '支払い待ち';
      statusIcon = 'hourglass_top';
      statusClass = 'status-pending';
      break;
    case 'failed':
      statusText = '支払い遅延';
      statusIcon = 'error_outline';
      statusClass = 'status-failed';
      break;
    default:
      statusText = status;
      statusIcon = 'help_outline';
      statusClass = 'status-unknown';
  }
  
  // 遅延日数の表示
  const overdueText = daysOverdue && daysOverdue > 0 
    ? compact ? ` (${daysOverdue}日)` : ` (${daysOverdue}日経過)` 
    : '';
  
  return (
    <span className={`payment-status-badge ${statusClass}`}>
      <span className="material-icons">{statusIcon}</span>
      <span className="status-text">{statusText}{overdueText}</span>
    </span>
  );
};

export default PaymentStatusBadge;
```

#### OrganizationStatusBadge

```tsx
// src/components/SuperAdmin/common/OrganizationStatusBadge.tsx
import React from 'react';
import { OrganizationStatus } from '../../../types';

interface OrganizationStatusBadgeProps {
  status: OrganizationStatus;
  suspendedAt?: string;
  compact?: boolean;
}

const OrganizationStatusBadge: React.FC<OrganizationStatusBadgeProps> = ({
  status,
  suspendedAt,
  compact = false
}) => {
  let statusText = '';
  let statusIcon = '';
  let statusClass = '';
  
  switch (status) {
    case 'active':
      statusText = 'アクティブ';
      statusIcon = 'check_circle';
      statusClass = 'status-active';
      break;
    case 'trial':
      statusText = 'トライアル';
      statusIcon = 'star';
      statusClass = 'status-trial';
      break;
    case 'suspended':
      statusText = '停止中';
      statusIcon = 'block';
      statusClass = 'status-suspended';
      break;
    case 'deleted':
      statusText = '削除済み';
      statusIcon = 'delete';
      statusClass = 'status-deleted';
      break;
    default:
      statusText = status;
      statusIcon = 'help_outline';
      statusClass = 'status-unknown';
  }
  
  // 停止日時の表示
  const suspendedText = suspendedAt && status === 'suspended' && !compact
    ? ` (${new Date(suspendedAt).toLocaleDateString()}から)` 
    : '';
  
  return (
    <span className={`org-status-badge ${statusClass}`}>
      <span className="material-icons">{statusIcon}</span>
      <span className="status-text">{statusText}{suspendedText}</span>
    </span>
  );
};

export default OrganizationStatusBadge;
```

#### PaymentStatusSummary

```tsx
// src/components/SuperAdmin/Plans/PaymentStatusSummary.tsx
import React from 'react';

interface PaymentSummaryItem {
  label: string;
  count: number;
  icon: string;
  indicatorText?: string;
  indicatorType?: 'warning' | 'info' | 'success';
}

interface PaymentStatusSummaryProps {
  items: PaymentSummaryItem[];
}

const PaymentStatusSummary: React.FC<PaymentStatusSummaryProps> = ({ items }) => {
  return (
    <div className="summary-cards">
      {items.map((item, index) => (
        <div key={index} className="summary-card">
          <div className="card-icon">
            <span className="material-icons">{item.icon}</span>
          </div>
          <div className="card-content">
            <div className="card-label">{item.label}</div>
            <div className="card-value">{item.count}</div>
          </div>
          {item.indicatorText && (
            <div className={`card-indicator-${item.indicatorType || 'info'}`}>
              {item.indicatorText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaymentStatusSummary;
```

## 11. React実装例

### 11.1 プラン設定タブコンポーネント

```tsx
// src/components/SuperAdmin/Plans/PlansTab.tsx
import React, { useState, useEffect } from 'react';
import { useAdminPlanApi } from '../../../hooks/useAdminPlanApi';
import PlanCard from './PlanCard';
import PlanFormModal from './PlanFormModal';
import ActionButton from '../../common/ActionButton';
import LoadingIndicator from '../../common/LoadingIndicator';
import ErrorMessage from '../../common/ErrorMessage';
import { PricePlan } from '../../../types';

const PlansTab: React.FC = () => {
  const [plans, setPlans] = useState<PricePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricePlan | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const { getPlans, deletePlan } = useAdminPlanApi();
  
  useEffect(() => {
    loadPlans();
  }, []);
  
  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getPlans();
      setPlans(result);
    } catch (err) {
      setError('プランの読み込みに失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  const handleEditPlan = (plan: PricePlan) => {
    setSelectedPlan(plan);
    setModalMode('edit');
    setIsModalOpen(true);
  };
  
  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('このプランを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await deletePlan(planId);
      loadPlans();
    } catch (err) {
      setError('プランの削除に失敗しました');
      console.error(err);
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  const handlePlanSaved = () => {
    loadPlans();
    setIsModalOpen(false);
  };
  
  if (isLoading && plans.length === 0) {
    return <LoadingIndicator />;
  }
  
  if (error && plans.length === 0) {
    return <ErrorMessage message={error} onRetry={loadPlans} />;
  }
  
  return (
    <div className="plans-container">
      <div className="plans-header">
        <h2>プラン一覧</h2>
        <ActionButton onClick={handleCreatePlan} icon="add">
          新規プラン作成
        </ActionButton>
      </div>
      
      <div className="plans-grid">
        {plans.map(plan => (
          <PlanCard
            key={plan._id}
            plan={plan}
            onEdit={() => handleEditPlan(plan)}
            onDelete={() => handleDeletePlan(plan._id)}
          />
        ))}
      </div>
      
      {isModalOpen && (
        <PlanFormModal
          plan={selectedPlan}
          mode={modalMode}
          onClose={handleModalClose}
          onSave={handlePlanSaved}
        />
      )}
    </div>
  );
};

export default PlansTab;
```

### 11.2 請求書テーブルコンポーネント

```tsx
// src/components/SuperAdmin/Plans/InvoiceTable.tsx
import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import ActionMenu from '../../common/ActionMenu';
import { Invoice } from '../../../types';

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewDetails: (invoice: Invoice) => void;
  onDownload: (invoiceId: string) => void;
  onResend: (invoiceId: string) => void;
  onRemind: (invoiceId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onViewDetails,
  onDownload,
  onResend,
  onRemind,
  onViewInvoice
}) => {
  return (
    <table className="invoices-table">
      <thead>
        <tr>
          <th>請求書番号</th>
          <th>組織名</th>
          <th>プラン</th>
          <th>金額</th>
          <th>発行日</th>
          <th>支払期限</th>
          <th>ステータス</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map(invoice => (
          <tr key={invoice._id}>
            <td>{invoice.invoiceNumber}</td>
            <td>{invoice.organization.name}</td>
            <td>{invoice.subscription.plan.name}</td>
            <td>¥{invoice.amount.toLocaleString()}</td>
            <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
            <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
            <td>
              <StatusBadge status={invoice.status} />
            </td>
            <td>
              <div className="action-buttons">
                <button 
                  className="receipt-button" 
                  title="請求書表示"
                  onClick={() => onViewInvoice(invoice._id)}
                >
                  <span className="material-icons">receipt</span>
                </button>
                
                <ActionMenu>
                  <ActionMenu.Item 
                    icon="visibility" 
                    onClick={() => onViewDetails(invoice)}
                  >
                    詳細を表示
                  </ActionMenu.Item>
                  
                  <ActionMenu.Item 
                    icon="download" 
                    onClick={() => onDownload(invoice._id)}
                  >
                    ダウンロード
                  </ActionMenu.Item>
                  
                  <ActionMenu.Item 
                    icon="send" 
                    onClick={() => onResend(invoice._id)}
                  >
                    再送信
                  </ActionMenu.Item>
                  
                  {invoice.status === 'past_due' && (
                    <ActionMenu.Item 
                      icon="notification_important" 
                      onClick={() => onRemind(invoice._id)}
                    >
                      支払い催促
                    </ActionMenu.Item>
                  )}
                </ActionMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InvoiceTable;
```

## 12. 実装ガイドラインと注意点

### 12.1 コンポーネント実装時の注意点

- コンポーネントの責任範囲を明確に区分し、単一責任の原則に従う
- プレゼンテーションとロジックの分離を意識する
- カスタムフックを活用してAPIロジックを分離する
- メモ化を適切に使用してパフォーマンスを最適化する
- エラーハンドリングとローディング状態の処理を丁寧に行う

### 12.2 状態管理の注意点

- 不必要なグローバル状態は避け、必要な場所でローカル状態を使用する
- Context APIを使用して関連するコンポーネント間で状態を共有する
- フォーム状態の管理にはReact Hook Formなどのライブラリを検討する
- 状態更新は浅いコピーではなく、イミュータブルに行う

### 12.3 パフォーマンス最適化

- 大量のデータを扱うテーブルでは仮想化を検討する
- 大きなコンポーネントの遅延読み込みを行う
- 余計な再レンダリングを避けるためのメモ化を活用する
- 重たい計算を伴うコンポーネントにはuseMemoとuseCallbackを使用する

## 13. テスト戦略

### 13.1 単体テスト

- 個々のコンポーネントの機能テスト
- カスタムフックのテスト
- ユーティリティ関数のテスト

### 13.2 統合テスト

- タブ切り替えなど複数コンポーネントの連携テスト
- APIとのデータフローテスト
- フォーム送信からの状態更新テスト

### 13.3 E2Eテスト

- プラン作成から表示までの一連のフロー
- 請求書管理の一連のフロー
- エラー状態やエッジケースの検証

## 14. 進捗とリリース計画

### 14.1 フェーズ分割

1. **Phase 1**: プラン設定タブの実装
2. **Phase 2**: 請求管理タブの実装（読み取り機能のみ）
3. **Phase 3**: 請求管理タブの完全実装（すべてのアクション）
4. **Phase 4**: UI改善とエッジケース対応

### 14.2 優先実装項目

1. プラン一覧表示（最優先）
2. プラン作成・編集機能
3. 請求書一覧表示
4. 請求書詳細表示
5. 請求書操作機能（ステータス変更など）

## 15. 収益シミュレーションタブ

### 15.1 概要

収益シミュレーションタブは、GPT-4oトークン使用量データと収益予測を統合的に表示・管理するためのタブです。このタブでは、API使用状況の確認と様々なパラメータに基づく収益シミュレーションを行うことができます。

### 15.2 画面構成

#### 構成要素

- タイトル「収益シミュレーション」
- API使用量サマリーカード
- トークン消費量グラフ（月次・日次）
- シミュレーションパラメータ調整セクション
- 収益予測テーブル
- シミュレーション結果グラフ

#### API使用量サマリーカード

API使用量の主要指標を表示するカードセクション：

```html
<div class="api-summary-cards">
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">token</span></div>
    <div class="card-content">
      <div class="card-label">今月のトークン使用量</div>
      <div class="card-value">1,352,841</div>
    </div>
    <div class="card-trend trend-up">
      <span class="material-icons">trending_up</span>
      <span>+12%</span>
    </div>
  </div>
  
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">spa</span></div>
    <div class="card-content">
      <div class="card-label">アクティブサロン数</div>
      <div class="card-value">87</div>
    </div>
    <div class="card-trend trend-up">
      <span class="material-icons">trending_up</span>
      <span>+3</span>
    </div>
  </div>
  
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">group</span></div>
    <div class="card-content">
      <div class="card-label">アクティブユーザー数</div>
      <div class="card-value">356</div>
    </div>
    <div class="card-trend trend-up">
      <span class="material-icons">trending_up</span>
      <span>+9</span>
    </div>
  </div>
  
  <div class="summary-card">
    <div class="card-icon"><span class="material-icons">psychology</span></div>
    <div class="card-content">
      <div class="card-label">1ユーザーあたりトークン</div>
      <div class="card-value">3,800</div>
    </div>
    <div class="card-trend trend-up">
      <span class="material-icons">trending_up</span>
      <span>+5%</span>
    </div>
  </div>
</div>
```

#### シミュレーションパラメータセクション

シミュレーションのパラメータを調整するためのセクション：

```html
<div class="simulation-parameters">
  <h3>シミュレーションパラメータ</h3>
  
  <div class="parameter-grid">
    <div class="parameter-group">
      <label for="exchange-rate">為替レート (円/ドル)</label>
      <div class="input-with-controls">
        <button class="decrement">-</button>
        <input type="number" id="exchange-rate" value="155" min="100" max="200" step="1">
        <button class="increment">+</button>
      </div>
    </div>
    
    <div class="parameter-group">
      <label for="api-rate">API料金 ($/1Kトークン)</label>
      <div class="input-with-controls">
        <button class="decrement">-</button>
        <input type="number" id="api-rate" value="0.01" min="0.001" max="0.1" step="0.001">
        <button class="increment">+</button>
      </div>
    </div>
    
    <div class="parameter-group">
      <label for="session-size">平均セッションサイズ (トークン)</label>
      <div class="input-with-controls">
        <button class="decrement">-</button>
        <input type="number" id="session-size" value="3800" min="1000" max="10000" step="100">
        <button class="increment">+</button>
      </div>
    </div>
    
    <div class="parameter-group">
      <label for="profit-margin">目標利益率 (%)</label>
      <div class="input-with-controls">
        <button class="decrement">-</button>
        <input type="number" id="profit-margin" value="35" min="10" max="90" step="5">
        <button class="increment">+</button>
      </div>
    </div>
  </div>
  
  <div class="action-buttons">
    <button class="reset-button">デフォルト値に戻す</button>
    <button class="simulate-button">シミュレーション実行</button>
  </div>
</div>
```

#### シミュレーション結果テーブル

シミュレーション結果を表示するテーブル：

```html
<div class="simulation-results">
  <h3>収益シミュレーション結果</h3>
  
  <table class="results-table">
    <thead>
      <tr>
        <th>プラン</th>
        <th>月間ユーザー数</th>
        <th>セッション数/月</th>
        <th>トークン消費量</th>
        <th>API費用 (円)</th>
        <th>売上 (円)</th>
        <th>利益 (円)</th>
        <th>利益率 (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>フリープラン</td>
        <td>150</td>
        <td>450</td>
        <td>1,710,000</td>
        <td>265,050</td>
        <td>0</td>
        <td>-265,050</td>
        <td class="negative">-100%</td>
      </tr>
      <tr>
        <td>ベーシック</td>
        <td>120</td>
        <td>600</td>
        <td>2,280,000</td>
        <td>353,400</td>
        <td>597,600</td>
        <td>244,200</td>
        <td class="positive">40.9%</td>
      </tr>
      <tr>
        <td>プロフェッショナル</td>
        <td>80</td>
        <td>640</td>
        <td>2,432,000</td>
        <td>376,960</td>
        <td>798,400</td>
        <td>421,440</td>
        <td class="positive">52.8%</td>
      </tr>
      <tr>
        <td>エンタープライズ</td>
        <td>6</td>
        <td>120</td>
        <td>456,000</td>
        <td>70,680</td>
        <td>240,000</td>
        <td>169,320</td>
        <td class="positive">70.6%</td>
      </tr>
      <tr class="total-row">
        <td>合計</td>
        <td>356</td>
        <td>1,810</td>
        <td>6,878,000</td>
        <td>1,066,090</td>
        <td>1,636,000</td>
        <td>569,910</td>
        <td class="positive">34.8%</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 15.3 状態管理設計

収益シミュレーションタブの状態管理：

```typescript
// 収益シミュレーションタブの状態
interface RevenueSimulationState {
  tokenUsageStats: {
    currentMonth: number;
    previousMonth: number;
    trend: number;
    perUser: number;
    activeUsers: number;
    activeSalons: number;
  };
  simulationParams: {
    exchangeRate: number;
    apiRate: number;
    sessionSize: number;
    profitMargin: number;
  };
  simulationResults: SimulationResult[];
  graphData: {
    usageByDay: DataPoint[];
    usageByMonth: DataPoint[];
    revenueProjection: DataPoint[];
  };
  isLoading: boolean;
  error: string | null;
}

interface SimulationResult {
  plan: string;
  users: number;
  sessionsPerMonth: number;
  tokenConsumption: number;
  apiCost: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}
```

### 15.4 データフロー

1. **初期データ読み込み**
   ```
   ページロード → API使用量データ取得 → 状態更新 → UI表示
   ```

2. **シミュレーションパラメータ調整**
   ```
   パラメータ変更 → 状態更新 → UI更新（リアルタイム）
   ```

3. **シミュレーション実行**
   ```
   実行ボタンクリック → API呼び出し → 結果取得 → 状態更新 → UI更新
   ```

## 16. 支払い停止時のユーザー向け画面

### 16.1 アクセス停止エラーページ

組織が支払い停止によりアクセスを制限された場合に表示されるエラーページです。サロンのすべてのユーザーが認証後にこのページにリダイレクトされます。

#### 構成要素

- エラーアイコン（大）
- タイトル「アカウントが一時停止されています」
- 説明文：支払いに関する問題でサービスが停止されていることを説明
- 対処法のリスト
  - 組織のオーナーに連絡するよう促す
  - 支払い情報が更新されると自動的に復旧することを説明
- サポート問い合わせリンク

```html
<div class="access-suspended-page">
  <div class="error-icon">
    <span class="material-icons">block</span>
  </div>
  <h1 class="title">アカウントが一時停止されています</h1>
  <p class="description">
    お支払い情報に問題があるため、サービスへのアクセスが一時的に停止されています。
  </p>
  
  <div class="instructions">
    <p>サービスを再開するには、以下の手順に従ってください：</p>
    <ol>
      <li>管理者（オーナー）に連絡し、支払い情報を確認してください</li>
      <li>支払い情報が更新され次第、サービスは自動的に再開されます</li>
    </ol>
  </div>
  
  <div class="support-link">
    <a href="mailto:support@example.com" class="button">
      サポートに問い合わせる
    </a>
  </div>
</div>
```

### 16.2 支払い警告通知バナー

支払いが近々期限切れになる場合や、支払い処理に問題がある場合に、アプリ内の上部に表示される警告バナーです。

```html
<div class="payment-alert-banner">
  <div class="alert-icon">
    <span class="material-icons">warning</span>
  </div>
  <div class="alert-content">
    <div class="alert-title">支払い情報に問題があります</div>
    <div class="alert-message">
      お支払いが完了していないため、近日中にサービスが一時停止される可能性があります。
      <a href="/account/billing" class="alert-link">詳細を確認する</a>
    </div>
  </div>
  <button class="alert-dismiss">
    <span class="material-icons">close</span>
  </button>
</div>
```

## 17. まとめ

課金・プラン管理画面は、SuperAdminがサービスの料金プランを設定し、各組織の請求書を管理するための重要な管理画面です。UIはシンプルかつ直感的に設計し、日常的な運用業務がスムーズに行えるよう配慮しています。

収益シミュレーションタブを統合したことで、APIトークン使用量の分析と様々なパラメータに基づく収益予測が一画面で行えるようになりました。可変パラメータによるシミュレーションにより、異なるシナリオでの収益予測が可能です。

支払い状態管理機能を統合することで、未払い組織の管理と適切なアクセス制御が可能になります。特に、以下の点に重点を置いて設計されています：

1. **視覚的な支払い状態表示**: バッジやカードを使って状態を一目で確認可能
2. **効率的な操作フロー**: 支払い催促、アクセス停止、復元などの操作が簡単に実行可能
3. **一括処理機能**: 複数の組織に対する一括操作で運用効率を向上
4. **明確なフィードバック**: ユーザーへの通知と明確なエラーメッセージ
5. **柔軟な収益シミュレーション**: 為替レート、API料金、セッションサイズ、利益率などのパラメータ調整による柔軟な収益予測

これらの機能により、サービスの健全な収益管理とユーザー体験の向上を両立させることができます。また、収益シミュレーションタブの追加により、ビジネスの健全性を常に監視し、戦略的な意思決定をサポートする環境が整いました。