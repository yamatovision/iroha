# 「スタイリスト管理」UI設計と状態管理

## 概要

美姫命アプリのスタイリスト管理画面のUI設計と状態管理の詳細設計です。このドキュメントでは、コンポーネント構成、状態管理、データフロー、およびユーザーインタラクションについて説明します。

## コンポーネント構成とレイアウト

### 主要コンポーネント

1. **StylistManagementPage**:
   - 全体のページコンテナ
   - レイアウト管理とデータ取得ロジックを担当

2. **StylistSearchBar**:
   - スタイリスト検索フォーム
   - フィルタリングオプション

3. **StylistCardGrid**:
   - スタイリストカードのグリッドコンテナ
   - レスポンシブレイアウト管理

4. **StylistCard**:
   - 個別のスタイリスト情報表示カード
   - 基本情報表示と操作ボタン

5. **StylistModal**:
   - スタイリスト追加/編集用モーダル
   - フォーム入力と検証

6. **SajuProfileModal**:
   - 四柱推命プロファイル表示用モーダル
   - 四柱推命情報の詳細表示

7. **Pagination**:
   - ページネーションコントロール
   - ページ切り替え機能

### コンポーネント階層

```
StylistManagementPage
│
├── Header
│   └── StylistSearchBar
│
├── StylistCardGrid
│   ├── StylistCard (複数)
│   │   ├── StylistCardHeader
│   │   ├── StylistCardBody
│   │   └── StylistCardFooter
│   │
│   └── EmptyState (スタイリストがない場合)
│
├── Pagination
│
├── StylistModal (追加/編集用)
│   ├── StylistForm
│   │   ├── AvatarUpload
│   │   └── FormFields
│   │
│   └── ModalFooter
│
└── SajuProfileModal (四柱推命情報表示用)
    ├── ProfileHeader
    ├── ElementBalance
    ├── TabPanel
    │   ├── PillarTab
    │   ├── CombinationTab
    │   ├── TenGodTab
    │   └── CharacteristicsTab
    │
    └── ModalFooter
```

## 状態管理方法

### グローバル状態 (React Context)

1. **AuthContext**:
   - 認証情報、管理者権限状態
   - 現在のユーザー情報

2. **NotificationContext**:
   - 操作結果の通知表示
   - エラーメッセージ管理

### ローカル状態 (useState/useReducer)

1. **StylistManagementPage**:
   ```typescript
   // スタイリスト一覧データ
   const [stylists, setStylists] = useState<IStylist[]>([]);
   
   // ローディング状態
   const [loading, setLoading] = useState<boolean>(true);
   
   // エラー状態
   const [error, setError] = useState<string | null>(null);
   
   // ページネーション状態
   const [pagination, setPagination] = useState({
     currentPage: 1,
     totalPages: 1,
     totalItems: 0
   });
   
   // 検索フィルタ状態
   const [filters, setFilters] = useState({
     searchTerm: '',
     hasSajuProfile: null
   });
   
   // モーダル表示状態
   const [modalState, setModalState] = useState({
     isAddModalOpen: false,
     isEditModalOpen: false,
     isSajuModalOpen: false,
     selectedStylist: null
   });
   ```

2. **StylistForm**:
   ```typescript
   // フォーム入力値
   const [formData, setFormData] = useState({
     displayName: '',
     email: '',
     password: '',
     jobTitle: '',
     profileImage: ''
   });
   
   // 入力検証エラー
   const [formErrors, setFormErrors] = useState({
     displayName: '',
     email: '',
     password: ''
   });
   
   // 送信中状態
   const [submitting, setSubmitting] = useState(false);
   ```

## データロードと更新フロー

### データロードフロー

1. **初期データロード**:
   ```typescript
   useEffect(() => {
     const fetchStylists = async () => {
       try {
         setLoading(true);
         const response = await fetch(
           `/api/v1/users?createdBy=${currentUser._id}&role=User&page=${pagination.currentPage}`
         );
         
         if (!response.ok) {
           throw new Error('スタイリスト情報の取得に失敗しました');
         }
         
         const data = await response.json();
         
         // 四柱推命情報の有無を判定してフラグを追加
         const stylistsWithSajuStatus = data.stylists.map(stylist => ({
           ...stylist,
           hasSajuProfile: !!(stylist.birthDate && stylist.birthTime && stylist.birthPlace)
         }));
         
         setStylists(stylistsWithSajuStatus);
         setPagination({
           currentPage: data.currentPage,
           totalPages: data.totalPages,
           totalItems: data.total
         });
       } catch (error) {
         setError(error.message);
       } finally {
         setLoading(false);
       }
     };
     
     fetchStylists();
   }, [currentUser._id, pagination.currentPage, filters]);
   ```

2. **検索・フィルタリング**:
   ```typescript
   const handleSearch = (searchTerm: string) => {
     setFilters(prev => ({ ...prev, searchTerm }));
     // ページを1に戻す
     setPagination(prev => ({ ...prev, currentPage: 1 }));
   };
   
   const handleFilterChange = (hasSajuProfile: boolean | null) => {
     setFilters(prev => ({ ...prev, hasSajuProfile }));
     // ページを1に戻す
     setPagination(prev => ({ ...prev, currentPage: 1 }));
   };
   ```

### データ更新フロー

1. **スタイリスト追加**:
   ```typescript
   const handleAddStylist = async (formData) => {
     try {
       setSubmitting(true);
       
       const response = await fetch('/api/v1/users', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           ...formData,
           role: 'User',
           createdBy: currentUser._id
         })
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'スタイリストの追加に失敗しました');
       }
       
       const newStylist = await response.json();
       
       // 状態を更新
       setStylists(prev => [...prev, {
         ...newStylist,
         hasSajuProfile: false // 新規追加時は四柱推命情報なし
       }]);
       
       // モーダルを閉じる
       setModalState(prev => ({ ...prev, isAddModalOpen: false }));
       
       // 成功通知
       showNotification('スタイリストを追加しました', 'success');
     } catch (error) {
       showNotification(error.message, 'error');
     } finally {
       setSubmitting(false);
     }
   };
   ```

2. **スタイリスト更新**:
   ```typescript
   const handleUpdateStylist = async (stylistId, formData) => {
     try {
       setSubmitting(true);
       
       const response = await fetch(`/api/v1/users/${stylistId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(formData)
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'スタイリストの更新に失敗しました');
       }
       
       const updatedStylist = await response.json();
       
       // 状態を更新
       setStylists(prev => prev.map(stylist => 
         stylist._id === stylistId 
           ? { 
               ...updatedStylist, 
               hasSajuProfile: !!(stylist.birthDate && stylist.birthTime && stylist.birthPlace)
             }
           : stylist
       ));
       
       // モーダルを閉じる
       setModalState(prev => ({ ...prev, isEditModalOpen: false, selectedStylist: null }));
       
       // 成功通知
       showNotification('スタイリスト情報を更新しました', 'success');
     } catch (error) {
       showNotification(error.message, 'error');
     } finally {
       setSubmitting(false);
     }
   };
   ```

3. **スタイリスト削除**:
   ```typescript
   const handleDeleteStylist = async (stylistId) => {
     try {
       const confirmed = await showConfirmDialog(
         '削除確認', 
         'このスタイリストを削除してもよろしいですか？この操作は元に戻せません。'
       );
       
       if (!confirmed) return;
       
       const response = await fetch(`/api/v1/users/${stylistId}`, {
         method: 'DELETE'
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'スタイリストの削除に失敗しました');
       }
       
       // 状態を更新
       setStylists(prev => prev.filter(stylist => stylist._id !== stylistId));
       
       // 成功通知
       showNotification('スタイリストを削除しました', 'success');
     } catch (error) {
       showNotification(error.message, 'error');
     }
   };
   ```

## エラー処理フロー

1. **API呼び出しエラー**:
   ```typescript
   try {
     // API呼び出し処理
   } catch (error) {
     // エラー状態を更新
     setError(error.message);
     
     // 通知を表示
     showNotification(error.message, 'error');
     
     // エラーログ記録
     console.error('API Error:', error);
   } finally {
     // ローディング状態解除
     setLoading(false);
   }
   ```

2. **フォームバリデーションエラー**:
   ```typescript
   const validateForm = () => {
     const errors = {
       displayName: '',
       email: '',
       password: ''
     };
     
     // 名前検証
     if (!formData.displayName.trim()) {
       errors.displayName = '名前を入力してください';
     }
     
     // メールアドレス検証
     if (!formData.email || !formData.email.includes('@')) {
       errors.email = '有効なメールアドレスを入力してください';
     }
     
     // パスワード検証（新規追加時のみ）
     if (isNewStylist && (!formData.password || formData.password.length < 8)) {
       errors.password = 'パスワードは8文字以上で入力してください';
     }
     
     setFormErrors(errors);
     
     // エラーがなければtrue、あればfalseを返す
     return !Object.values(errors).some(error => !!error);
   };
   
   const handleSubmit = (e) => {
     e.preventDefault();
     
     if (!validateForm()) {
       // バリデーションエラーがある場合
       showNotification('入力内容に問題があります', 'error');
       return;
     }
     
     // 送信処理
     if (isNewStylist) {
       handleAddStylist(formData);
     } else {
       handleUpdateStylist(selectedStylist._id, formData);
     }
   };
   ```

## コンポーネント間のデータフロー詳細図

```
+------------------------+     ユーザー認証情報     +-------------------+
|                        |<-----------------------|                   |
|     AuthContext        |                        |  スタイリスト管理画面  |
|                        |----------------------->|                   |
+------------------------+     権限チェック        +-------------------+
           ^                                              |
           |                                              |
           | ユーザー情報                                    |
           |                                              V
+------------------------+     スタイリスト一覧取得   +-------------------+
|                        |<-----------------------|                   |
|      APIサービス         |                        |  スタイリストカード   |
|                        |----------------------->|     グリッド       |
+------------------------+     スタイリスト情報      +-------------------+
           |                                              |
           | CRUD操作                                      |
           V                                              V
+------------------------+     スタイリスト選択     +-------------------+
|                        |<-----------------------|                   |
|    スタイリスト編集       |                        |   スタイリスト      |
|      モーダル            |----------------------->|     カード        |
+------------------------+     更新後の情報        +-------------------+
           |                                              |
           | 四柱推命情報更新                               |
           V                                              V
+------------------------+     四柱推命情報表示    +-------------------+
|                        |<-----------------------|                   |
|    四柱推命プロファイル    |                        |   四柱推命表示     |
|       モーダル           |----------------------->|    ボタン         |
+------------------------+     詳細表示           +-------------------+
```

## 共有状態と局所状態の区別

### 共有状態（React Context）

1. **認証情報（AuthContext）**:
   - ログインユーザー情報
   - 権限情報
   - トークン管理

2. **通知管理（NotificationContext）**:
   - 成功/エラーメッセージ表示
   - 通知の表示制御

### 局所状態（コンポーネント内）

1. **StylistManagementPage**:
   - スタイリスト一覧データ
   - ページネーション状態
   - 検索/フィルタ条件
   - ローディング状態

2. **StylistModal**:
   - フォーム入力値
   - バリデーションエラー
   - 送信中状態

3. **SajuProfileModal**:
   - 表示タブ選択状態
   - 四柱推命詳細データ

## 状態の永続化

1. **検索条件とフィルタ**:
   - URLクエリパラメータを使用
   - ブラウザ履歴に保存

2. **ページネーション**:
   - URLクエリパラメータで現在のページを管理
   - ページ遷移後も状態を維持

3. **選択状態**:
   - セッションストレージに一時保存
   - ページリロード時に復元

## React Contextの実装例

```typescript
// StylistManagementContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { IStylist, IStylistFilter } from '../types';

interface StylistManagementContextType {
  stylists: IStylist[];
  loading: boolean;
  error: string | null;
  filters: IStylistFilter;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  selectedStylist: IStylist | null;
  fetchStylists: () => Promise<void>;
  updateFilters: (newFilters: Partial<IStylistFilter>) => void;
  selectStylist: (stylist: IStylist | null) => void;
  addStylist: (stylistData: Partial<IStylist>) => Promise<void>;
  updateStylist: (stylistId: string, stylistData: Partial<IStylist>) => Promise<void>;
  deleteStylist: (stylistId: string) => Promise<void>;
}

const StylistManagementContext = createContext<StylistManagementContextType | undefined>(undefined);

export const StylistManagementProvider: React.FC = ({ children }) => {
  // 状態と関数の実装
  // ...
  
  return (
    <StylistManagementContext.Provider value={contextValue}>
      {children}
    </StylistManagementContext.Provider>
  );
};

export const useStylistManagement = () => {
  const context = useContext(StylistManagementContext);
  if (context === undefined) {
    throw new Error('useStylistManagement must be used within StylistManagementProvider');
  }
  return context;
};
```

## カスタムフックの実装例

```typescript
// useStylistForm.ts
import { useState } from 'react';
import { IStylist } from '../types';

export const useStylistForm = (initialData?: Partial<IStylist>) => {
  const [formData, setFormData] = useState({
    displayName: initialData?.displayName || '',
    email: initialData?.email || '',
    password: '',
    jobTitle: initialData?.jobTitle || '',
    profileImage: initialData?.profileImage || ''
  });
  
  const [formErrors, setFormErrors] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // エラーをクリア
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    // フォームバリデーションロジック
    // ...
    
    return isValid;
  };
  
  return {
    formData,
    formErrors,
    submitting,
    setSubmitting,
    handleChange,
    validateForm,
    resetForm: () => {
      setFormData({
        displayName: '',
        email: '',
        password: '',
        jobTitle: '',
        profileImage: ''
      });
      setFormErrors({
        displayName: '',
        email: '',
        password: ''
      });
    }
  };
};
```

## レスポンシブデザインの考慮点

1. **モバイル対応**:
   - スタイリストカードを1列表示に変更
   - 操作ボタンをタップしやすいサイズに調整
   - モーダルの幅をビューポートに適応

2. **タブレット対応**:
   - 2列グリッドレイアウトに変更
   - サイドバーを適切なサイズに調整

3. **デスクトップ対応**:
   - 3列以上のグリッドレイアウト
   - より多くの情報を同時に表示

4. **実装方法**:
   ```css
   /* スタイリストカードグリッド */
   .card-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
     gap: 24px;
   }
   
   /* レスポンシブ対応 */
   @media (max-width: 768px) {
     .card-grid {
       grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
     }
   }
   
   @media (max-width: 480px) {
     .card-grid {
       grid-template-columns: 1fr;
     }
   }
   ```

## アクセシビリティ対応

1. **キーボードナビゲーション**:
   - フォーカス可能な要素の適切なタブ順序
   - キーボードでの操作サポート

2. **スクリーンリーダー対応**:
   - 適切なARIA属性の使用
   - 意味のある代替テキストの提供

3. **カラーコントラスト**:
   - アクセシビリティガイドラインに準拠したカラーコントラスト
   - 視覚的な状態表示の補足情報提供

4. **実装例**:
   ```jsx
   <button
     className="saju-button"
     onClick={handleShowProfile}
     disabled={!hasSajuProfile}
     aria-label={hasSajuProfile ? "四柱推命情報を表示" : "四柱推命情報なし"}
   >
     <span className="material-icons" aria-hidden="true">psychology</span>
     {hasSajuProfile ? '四柱推命情報を表示' : '四柱推命情報なし'}
   </button>
   ```