# 課金・プラン管理 実装ガイド

## 概要

この文書は美姫命アプリケーションのSuperAdmin向け課金・プラン管理機能の実装ガイドラインを提供します。フロントエンドとバックエンドの実装方針、優先順位、注意点などを詳細に記述します。

## 1. 実装アプローチ

### 1.1 フロントエンド実装方針

- **技術スタック**: React, TypeScript, Material-UI
- **アーキテクチャ**: コンポーネントベース + カスタムフック
- **状態管理**: React Context + useState/useReducer
- **データフェッチング**: Axios + カスタムフック
- **フォーム管理**: React Hook Form

### 1.2 バックエンド実装方針

- **技術スタック**: Node.js, Express, MongoDB
- **アーキテクチャ**: MVC パターン + サービス層
- **データモデル**: Mongoose スキーマ
- **API設計**: RESTful API
- **認証**: JWT認証

### 1.3 部分的に段階的な実装アプローチ

1. 基本的なプラン管理機能（CRUD操作）
2. 請求書表示機能（読み取り専用）
3. 高度な請求書管理機能（ステータス変更、PDF生成など）
4. UI/UX改善とエッジケース対応

## 2. フロントエンド実装ガイド

### 2.1 コンポーネント構造

```
src/
└── components/
    └── SuperAdmin/
        └── Plans/
            ├── index.tsx                 # メインページコンポーネント
            ├── PlansTab.tsx              # プラン設定タブ
            ├── PlanCard.tsx              # プランカードコンポーネント
            ├── PlanFormModal.tsx         # プラン作成・編集モーダル
            ├── FeatureListEditor.tsx     # 機能一覧エディタ
            ├── InvoicesTab.tsx           # 請求管理タブ
            ├── InvoiceTable.tsx          # 請求書テーブル
            ├── InvoiceFilters.tsx        # 請求書フィルター
            ├── InvoiceDetailModal.tsx    # 請求書詳細モーダル
            └── InvoiceItemsTable.tsx     # 請求書項目テーブル
```

### 2.2 カスタムフック

```typescript
// src/hooks/useAdminPlanApi.ts
import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../shared';
import { PricePlan } from '../types';

export const useAdminPlanApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getPlans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN_PLANS);
      return response.data.plans;
    } catch (err) {
      setError('プランの取得に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const createPlan = async (planData: Omit<PricePlan, '_id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post(API_PATHS.ADMIN_PLANS, planData);
      return response.data;
    } catch (err) {
      setError('プランの作成に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePlan = async (planId: string, planData: Partial<PricePlan>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.put(API_PATHS.ADMIN_PLAN_DETAIL(planId), planData);
      return response.data;
    } catch (err) {
      setError('プランの更新に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deletePlan = async (planId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.delete(API_PATHS.ADMIN_PLAN_DETAIL(planId));
      return response.data;
    } catch (err) {
      setError('プランの削除に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    error,
    getPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
};

// 同様に請求書APIのためのカスタムフックも実装
```

### 2.3 主要コンポーネント実装例

#### メインページコンポーネント

```tsx
// src/components/SuperAdmin/Plans/index.tsx
import React, { useState } from 'react';
import PlansTab from './PlansTab';
import InvoicesTab from './InvoicesTab';

const SuperAdminPlansPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'invoices'>('plans');
  
  return (
    <div className="main-content">
      <div className="page-title">
        <h1>課金・プラン管理</h1>
      </div>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'plans' ? 'active' : ''}`} 
          onClick={() => setActiveTab('plans')}
        >
          プラン設定
        </div>
        <div 
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`} 
          onClick={() => setActiveTab('invoices')}
        >
          請求管理
        </div>
      </div>
      
      <div className="tab-content active">
        {activeTab === 'plans' ? <PlansTab /> : <InvoicesTab />}
      </div>
    </div>
  );
};

export default SuperAdminPlansPage;
```

#### プラン作成・編集モーダル

```tsx
// src/components/SuperAdmin/Plans/PlanFormModal.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { PricePlan } from '../../../types';
import { useAdminPlanApi } from '../../../hooks/useAdminPlanApi';
import FeatureListEditor from './FeatureListEditor';

interface PlanFormModalProps {
  plan: PricePlan | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: () => void;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({
  plan,
  mode,
  onClose,
  onSave
}) => {
  const { createPlan, updatePlan } = useAdminPlanApi();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: plan ? {
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: plan.features,
      maxStylists: plan.maxStylists,
      maxClients: plan.maxClients,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder
    } : {
      name: '',
      price: 0,
      description: '',
      features: [],
      maxStylists: null,
      maxClients: null,
      isActive: true,
      displayOrder: 0
    }
  });
  
  const onSubmit = async (data: any) => {
    try {
      if (mode === 'create') {
        await createPlan(data);
      } else if (plan) {
        await updatePlan(plan._id, data);
      }
      onSave();
    } catch (err) {
      console.error('保存に失敗しました', err);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {mode === 'create' ? '新規プラン作成' : `${plan?.name}プラン編集`}
          </div>
          <div className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">
                プラン名 <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'プラン名は必須です' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="form-input"
                    placeholder="例：ベーシックプラン"
                  />
                )}
              />
              {errors.name && (
                <div className="error-message">{errors.name.message}</div>
              )}
            </div>
            
            {/* 他のフォームフィールド... */}
            
            <div className="form-group">
              <label className="form-label">機能一覧</label>
              <Controller
                name="features"
                control={control}
                render={({ field }) => (
                  <FeatureListEditor
                    features={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanFormModal;
```

## 3. バックエンド実装ガイド

### 3.1 ファイル構造

```
server/
└── src/
    ├── controllers/
    │   └── admin/
    │       ├── plans.controller.ts       # プラン管理コントローラー
    │       └── invoices.controller.ts    # 請求書管理コントローラー
    ├── models/
    │   ├── PricePlan.ts                  # プランモデル
    │   ├── Subscription.ts               # サブスクリプションモデル
    │   └── Invoice.ts                    # 請求書モデル
    ├── services/
    │   ├── plan.service.ts               # プラン管理サービス
    │   └── invoice.service.ts            # 請求書管理サービス
    ├── routes/
    │   └── admin.routes.ts               # 管理者ルート
    └── utils/
        ├── pdf-generator.ts              # PDF生成ユーティリティ
        └── email-sender.ts               # メール送信ユーティリティ
```

### 3.2 モデル定義

```typescript
// src/models/PricePlan.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPricePlan extends Document {
  name: string;
  price: number;
  description: string;
  features: string[];
  maxStylists: number | null;
  maxClients: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PricePlanSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    features: { type: [String], default: [] },
    maxStylists: { type: Number, default: null },
    maxClients: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPricePlan>('PricePlan', PricePlanSchema);

// 同様に他のモデルも定義
```

### 3.3 コントローラー実装

```typescript
// src/controllers/admin/plans.controller.ts
import { Request, Response } from 'express';
import PlanService from '../../services/plan.service';
import { handleError } from '../../utils/error-handler';

export default class PlansController {
  private planService = new PlanService();
  
  public getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const plans = await this.planService.getPlans(includeInactive);
      
      res.status(200).json({ plans });
    } catch (error) {
      handleError(res, error);
    }
  };
  
  public getPlanById = async (req: Request, res: Response): Promise<void> => {
    try {
      const planId = req.params.id;
      const plan = await this.planService.getPlanById(planId);
      
      if (!plan) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'プランが見つかりません'
          }
        });
        return;
      }
      
      res.status(200).json(plan);
    } catch (error) {
      handleError(res, error);
    }
  };
  
  public createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const planData = req.body;
      const createdPlan = await this.planService.createPlan(planData);
      
      res.status(201).json({
        _id: createdPlan._id,
        name: createdPlan.name,
        price: createdPlan.price,
        createdAt: createdPlan.createdAt
      });
    } catch (error) {
      handleError(res, error);
    }
  };
  
  public updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const planId = req.params.id;
      const planData = req.body;
      const updatedPlan = await this.planService.updatePlan(planId, planData);
      
      if (!updatedPlan) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'プランが見つかりません'
          }
        });
        return;
      }
      
      res.status(200).json({
        _id: updatedPlan._id,
        name: updatedPlan.name,
        price: updatedPlan.price,
        updatedAt: updatedPlan.updatedAt
      });
    } catch (error) {
      handleError(res, error);
    }
  };
  
  public deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const planId = req.params.id;
      const result = await this.planService.deletePlan(planId);
      
      if (!result) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'プランが見つかりません'
          }
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'プランが正常に削除されました'
      });
    } catch (error) {
      handleError(res, error);
    }
  };
}
```

### 3.4 サービス実装

```typescript
// src/services/plan.service.ts
import PricePlan, { IPricePlan } from '../models/PricePlan';
import Subscription from '../models/Subscription';
import { ValidationError } from '../utils/errors';

export default class PlanService {
  public async getPlans(includeInactive: boolean = false): Promise<IPricePlan[]> {
    const query = includeInactive ? {} : { isActive: true };
    return PricePlan.find(query).sort({ displayOrder: 1 });
  }
  
  public async getPlanById(planId: string): Promise<IPricePlan | null> {
    return PricePlan.findById(planId);
  }
  
  public async createPlan(planData: any): Promise<IPricePlan> {
    // 名前の重複チェック
    const existingPlan = await PricePlan.findOne({ name: planData.name });
    if (existingPlan) {
      throw new ValidationError('同名のプランが既に存在します');
    }
    
    // バリデーション
    this.validatePlanData(planData);
    
    // プラン作成
    const plan = new PricePlan(planData);
    return plan.save();
  }
  
  public async updatePlan(planId: string, planData: any): Promise<IPricePlan | null> {
    // 存在確認
    const plan = await PricePlan.findById(planId);
    if (!plan) {
      return null;
    }
    
    // 名前の重複チェック（変更する場合のみ）
    if (planData.name && planData.name !== plan.name) {
      const existingPlan = await PricePlan.findOne({ name: planData.name });
      if (existingPlan) {
        throw new ValidationError('同名のプランが既に存在します');
      }
    }
    
    // バリデーション
    this.validatePlanData(planData);
    
    // プラン更新
    Object.assign(plan, planData);
    return plan.save();
  }
  
  public async deletePlan(planId: string): Promise<boolean> {
    // 存在確認
    const plan = await PricePlan.findById(planId);
    if (!plan) {
      return false;
    }
    
    // 使用中チェック
    const subscriptionCount = await Subscription.countDocuments({ planId });
    if (subscriptionCount > 0) {
      throw new ValidationError('このプランは現在利用中のため削除できません');
    }
    
    // プラン削除
    await plan.remove();
    return true;
  }
  
  private validatePlanData(planData: any): void {
    // 名前のバリデーション
    if (planData.name !== undefined && (
      typeof planData.name !== 'string' || 
      planData.name.trim().length === 0 || 
      planData.name.length > 50
    )) {
      throw new ValidationError('プラン名は1〜50文字で入力してください');
    }
    
    // 料金のバリデーション
    if (planData.price !== undefined && (
      typeof planData.price !== 'number' || 
      planData.price < 0
    )) {
      throw new ValidationError('料金は0以上の数値で入力してください');
    }
    
    // その他のバリデーション...
  }
}
```

### 3.5 ルート設定

```typescript
// src/routes/admin.routes.ts
import { Router } from 'express';
import PlansController from '../controllers/admin/plans.controller';
import InvoicesController from '../controllers/admin/invoices.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();
const plansController = new PlansController();
const invoicesController = new InvoicesController();

// プラン管理ルート
router.get('/plans', authMiddleware, checkRole('super_admin'), plansController.getPlans);
router.get('/plans/:id', authMiddleware, checkRole('super_admin'), plansController.getPlanById);
router.post('/plans', authMiddleware, checkRole('super_admin'), plansController.createPlan);
router.put('/plans/:id', authMiddleware, checkRole('super_admin'), plansController.updatePlan);
router.delete('/plans/:id', authMiddleware, checkRole('super_admin'), plansController.deletePlan);

// 請求書管理ルート
router.get('/invoices', authMiddleware, checkRole('super_admin'), invoicesController.getInvoices);
router.get('/invoices/:id', authMiddleware, checkRole('super_admin'), invoicesController.getInvoiceById);
router.post('/invoices', authMiddleware, checkRole('super_admin'), invoicesController.createInvoice);
router.put('/invoices/:id/status', authMiddleware, checkRole('super_admin'), invoicesController.updateInvoiceStatus);
router.get('/invoices/:id/pdf', authMiddleware, checkRole('super_admin'), invoicesController.getInvoicePdf);
router.post('/invoices/:id/resend', authMiddleware, checkRole('super_admin'), invoicesController.resendInvoice);
router.post('/invoices/:id/remind', authMiddleware, checkRole('super_admin'), invoicesController.remindInvoice);

export default router;
```

## 4. 実装優先順位と段階的アプローチ

### 4.1 実装優先順位

1. **最優先（Phase 1）**
   - プラン一覧表示と基本CRUD操作
   - サイドバーメニューとタブ構造
   - 請求書一覧表示（読み取り専用）

2. **高優先度（Phase 2）**
   - 請求書詳細表示
   - 請求書フィルタリング
   - ページネーション実装

3. **中優先度（Phase 3）**
   - 請求書ステータス更新
   - 請求書PDF生成
   - 請求書メール送信

4. **低優先度（Phase 4）**
   - UI/UX改善
   - アニメーションとトランジション
   - 高度なフィルタリングとソート機能

### 4.2 段階的実装計画

#### Phase 1 (1-2週間)

1. 基本的なページレイアウトとタブ構造の実装
2. プラン一覧表示（カード形式）
3. プラン作成・編集モーダル
4. プランの基本CRUD操作のAPI実装
5. 請求書一覧表示（読み取り専用）

#### Phase 2 (1-2週間)

1. 請求書詳細モーダル
2. 請求書フィルタリング機能
3. 請求書一覧のページネーション
4. プラン・請求書間の関連付け

#### Phase 3 (1-2週間)

1. 請求書ステータス更新機能
2. 請求書PDF生成
3. 請求書メール送信機能
4. 支払い催促機能

#### Phase 4 (1週間)

1. UI/UXの全体的な改善
2. エラー処理とユーザーフィードバックの強化
3. パフォーマンス最適化
4. アクセシビリティ対応

## 5. 注意点とエッジケース

### 5.1 データ整合性の確保

- **プラン削除時の依存関係チェック**: 使用中のプランは削除できないようにする
- **プラン更新時の既存契約への影響**: 既存契約は維持しつつ、新規契約のみ更新されるように設計
- **請求書ステータス更新の整合性**: 支払い済み → 未払いなど、不自然な状態遷移を防止

### 5.2 エッジケース対応

- **サブスクリプションなしの組織**: 適切なメッセージでハンドリング
- **無効なプランのサブスクリプション**: 警告表示と修正オプションの提供
- **同時編集の競合**: 楽観的ロックなどで対応

### 5.3 セキュリティ考慮事項

- **権限チェック**: すべてのAPIエンドポイントで適切な権限検証を実施
- **入力バリデーション**: すべてのユーザー入力を厳格に検証
- **監査ログ**: 重要な操作（プラン作成・変更、請求書ステータス変更など）のログ記録

## 6. パフォーマンス最適化

### 6.1 フロントエンド

- **遅延読み込み**: タブコンテンツの遅延読み込み
- **メモ化**: 不要な再レンダリングを防止
- **ページネーション**: 大量データの分割表示
- **ビルド最適化**: コード分割とツリーシェイキング

### 6.2 バックエンド

- **インデックス設計**: 適切なDB検索パフォーマンスのためのインデックス
- **クエリ最適化**: 必要な情報のみを取得するプロジェクション
- **キャッシュ**: 頻繁に使用されるデータのキャッシュ
- **バッチ処理**: 大量データ操作の効率的な処理

## 7. テスト戦略

### 7.1 フロントエンドテスト

- **単体テスト**: React Testing Library を使用したコンポーネントテスト
- **統合テスト**: ユーザーフローのシミュレーション
- **E2Eテスト**: Cypress を使用した実際のブラウザ環境でのテスト

### 7.2 バックエンドテスト

- **単体テスト**: Jest を使用したサービス層とユーティリティのテスト
- **統合テスト**: APIエンドポイントの機能テスト
- **DBインタラクションテスト**: モデルとデータベース操作のテスト

## 8. ドキュメント

### 8.1 コードドキュメント

- 主要関数とクラスの目的と使用法に関するコメント
- 複雑なロジックの説明コメント
- TypeScriptの型定義による自己ドキュメント化

### 8.2 APIドキュメント

- 各エンドポイントの詳細説明
- リクエスト・レスポンス形式のサンプル
- エラーケースとその処理方法

## 9. 運用考慮事項

### 9.1 デプロイ戦略

- 段階的なデプロイ（機能ごとの展開）
- ダウンタイムなしのデプロイ
- ロールバック計画

### 9.2 監視とアラート

- エラー率監視
- パフォーマンスメトリクス
- 異常なデータパターンの検出

## 10. まとめ

課金・プラン管理機能は美姫命アプリケーションのSuperAdmin向け機能の重要な部分です。本ドキュメントで概説した実装アプローチと優先順位に従って、段階的に機能を実装していくことで、効率的かつ堅牢なシステムを構築することが可能です。特にデータ整合性とセキュリティに注意を払いながら、シンプルで使いやすいUIを提供することが重要です。

### 実装のポイント

1. シンプルな設計を心がけ、複雑さを最小限に抑える
2. 段階的な実装により、早い段階で基本機能を提供する
3. データ整合性を常に意識し、不整合が生じないようにする
4. 適切なエラーハンドリングとユーザーフィードバックを提供する
5. コードの再利用性とメンテナンス性を高める