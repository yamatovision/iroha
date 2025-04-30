# クライアント管理機能 実装ガイド

## 概要

クライアント管理機能は、美容サロン向けに顧客情報を一元管理し、四柱推命に基づいた相性診断や施術提案を行うための機能です。このドキュメントでは、フロントエンドとバックエンドの実装方針、データフロー、および実装上の注意点について説明します。

## 実装の優先順位

クライアント管理機能の実装は以下の優先順位で進めることを推奨します：

1. **基本CRUD機能**: クライアント情報の閲覧・登録・編集・削除（Phase 1）
2. **四柱推命連携**: 生年月日・時間の登録と命式計算（Phase 1）
3. **相性診断機能**: クライアントとスタイリストの相性計算（Phase 2）
4. **メモ管理機能**: クライアントに対するメモの追加・管理（Phase 2）
5. **チャット連携**: クライアント専用のAIチャット機能（Phase 3）
6. **データインポート/エクスポート**: 外部システムとのデータ連携（Phase 3）

## フロントエンド実装

### 1. コンポーネント構成

クライアント管理画面は以下のコンポーネントで構成されます：

```
ClientManagement/
├── index.tsx                    # メインコンポーネント
├── ClientList/                  # クライアント一覧
│   ├── ClientCard.tsx           # クライアントカード
│   ├── ClientFilter.tsx         # フィルターUI
│   └── ClientListPagination.tsx # ページネーション
├── ClientDetail/                # クライアント詳細
│   ├── ClientDetailModal.tsx    # 詳細モーダル
│   ├── ClientInfo.tsx           # 基本情報表示
│   ├── ClientSajuInfo.tsx       # 四柱推命情報表示
│   └── CompatibilitySection.tsx # 相性情報表示
├── ClientForm/                  # クライアント登録/編集
│   ├── ClientBasicForm.tsx      # 基本情報フォーム
│   ├── ClientSajuForm.tsx       # 四柱推命情報フォーム
│   └── ClientCustomFieldsForm.tsx # カスタムフィールドフォーム
├── ClientNotes/                 # クライアントメモ
│   ├── NoteList.tsx             # メモ一覧
│   └── NoteForm.tsx             # メモ入力フォーム
└── ClientImport/                # データインポート
    ├── ImportForm.tsx           # インポート設定フォーム
    ├── CsvMappingForm.tsx       # CSV項目マッピング
    └── ImportProgress.tsx       # インポート進捗表示
```

### 2. 状態管理

クライアント管理画面の状態管理は以下のアプローチを推奨します：

#### 2.1 状態管理設計

1. **React Context**: クライアント一覧データと選択中クライアント情報を管理
2. **ローカルステート**: フィルター条件、ページネーション、モーダル表示状態などのUI状態
3. **React Query / SWR**: サーバーデータのフェッチと状態管理（キャッシュ対応）

#### 2.2 ClientContext（推奨実装）

```tsx
// ClientContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { clientApi } from '../services/client.service';
import { IClient, ClientListResponse } from '../types';

// コンテキストの型定義
type ClientContextType = {
  clients: IClient[];
  selectedClient: IClient | null;
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    total: number;
    limit: number;
    pages: number;
  };
  filter: {
    search: string;
    filter: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  // アクション
  loadClients: (params?: any) => void;
  selectClient: (client: IClient | null) => void;
  createClient: (clientData: Partial<IClient>) => Promise<IClient>;
  updateClient: (clientId: string, clientData: Partial<IClient>) => Promise<IClient>;
  deleteClient: (clientId: string) => Promise<void>;
  setFilter: (filter: Partial<typeof initialState.filter>) => void;
  setPage: (page: number) => void;
};

// 初期状態
const initialState = {
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    total: 0,
    limit: 20,
    pages: 0
  },
  filter: {
    search: '',
    filter: 'all',
    sortBy: 'name',
    sortOrder: 'asc' as const
  }
};

// コンテキスト作成
const ClientContext = createContext<ClientContextType | undefined>(undefined);

// リデューサー
function clientReducer(state: any, action: any) {
  switch (action.type) {
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload, loading: false, error: null };
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SELECT_CLIENT':
      return { ...state, selectedClient: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    case 'SET_PAGE':
      return { ...state, pagination: { ...state.pagination, page: action.payload } };
    default:
      return state;
  }
}

// プロバイダーコンポーネント
export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(clientReducer, initialState);
  const queryClient = useQueryClient();

  // クライアント一覧取得
  const { data, error, isLoading } = useQuery(
    ['clients', state.pagination.page, state.filter],
    () => clientApi.getClients({
      page: state.pagination.page,
      limit: state.pagination.limit,
      search: state.filter.search,
      filter: state.filter.filter,
      sortBy: state.filter.sortBy,
      sortOrder: state.filter.sortOrder
    }),
    {
      keepPreviousData: true,
      onSuccess: (data: ClientListResponse) => {
        dispatch({ type: 'SET_CLIENTS', payload: data.clients });
        dispatch({ type: 'SET_PAGINATION', payload: data.pagination });
      }
    }
  );

  // ミューテーション定義
  const createMutation = useMutation(clientApi.createClient, {
    onSuccess: () => {
      queryClient.invalidateQueries('clients');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<IClient> }) => 
      clientApi.updateClient(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
      }
    }
  );

  const deleteMutation = useMutation(clientApi.deleteClient, {
    onSuccess: () => {
      queryClient.invalidateQueries('clients');
    }
  });

  // エラーと読み込み状態の更新
  useEffect(() => {
    if (isLoading) {
      dispatch({ type: 'SET_LOADING' });
    }
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error });
    }
  }, [isLoading, error]);

  // コンテキスト値
  const contextValue: ClientContextType = {
    ...state,
    loadClients: () => queryClient.invalidateQueries('clients'),
    selectClient: (client) => dispatch({ type: 'SELECT_CLIENT', payload: client }),
    createClient: (clientData) => createMutation.mutateAsync(clientData),
    updateClient: (clientId, clientData) => 
      updateMutation.mutateAsync({ id: clientId, data: clientData }),
    deleteClient: (clientId) => deleteMutation.mutateAsync(clientId),
    setFilter: (filter) => dispatch({ type: 'SET_FILTER', payload: filter }),
    setPage: (page) => dispatch({ type: 'SET_PAGE', payload: page })
  };

  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
};

// フック
export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
};
```

### 3. APIサービス

```tsx
// services/client.service.ts
import { CLIENT } from '../../../shared';
import { apiService } from './api.service';
import { 
  IClient, 
  ClientListRequest, 
  ClientListResponse, 
  CreateClientRequest,
  UpdateClientRequest,
  ClientDetailResponse
} from '../types';

export const clientApi = {
  // クライアント一覧取得
  getClients: async (params: ClientListRequest): Promise<ClientListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `${CLIENT.LIST}?${queryParams.toString()}`;
    return apiService.get(url);
  },
  
  // クライアント詳細取得
  getClientDetail: async (clientId: string): Promise<ClientDetailResponse> => {
    return apiService.get(CLIENT.DETAIL(clientId));
  },
  
  // クライアント作成
  createClient: async (clientData: CreateClientRequest): Promise<IClient> => {
    return apiService.post(CLIENT.CREATE, clientData);
  },
  
  // クライアント更新
  updateClient: async (clientId: string, clientData: UpdateClientRequest): Promise<IClient> => {
    return apiService.put(CLIENT.UPDATE(clientId), clientData);
  },
  
  // クライアント削除
  deleteClient: async (clientId: string): Promise<void> => {
    return apiService.delete(CLIENT.DELETE(clientId));
  },
  
  // 四柱推命情報更新
  updateClientSaju: async (clientId: string, sajuData: any): Promise<any> => {
    return apiService.put(CLIENT.UPDATE_SAJU(clientId), sajuData);
  },
  
  // 相性情報取得
  getCompatibility: async (clientId: string, stylistIds?: string[]): Promise<any> => {
    const queryParams = stylistIds ? `?stylistIds=${stylistIds.join(',')}` : '';
    return apiService.get(`${CLIENT.GET_COMPATIBILITY(clientId)}${queryParams}`);
  },
  
  // その他必要なAPI関数
};
```

### 4. クライアント一覧画面

```tsx
// ClientManagement/index.tsx
import React, { useState } from 'react';
import { ClientProvider } from './ClientContext';
import ClientList from './ClientList';
import ClientDetailModal from './ClientDetail/ClientDetailModal';
import ClientFormModal from './ClientForm/ClientFormModal';
import ImportModal from './ClientImport/ImportModal';

const ClientManagement: React.FC = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  return (
    <ClientProvider>
      <div className="client-management">
        <div className="top-bar">
          <h1 className="page-title">クライアント管理</h1>
          <div className="top-actions">
            <button 
              className="btn btn-outline" 
              onClick={() => setImportModalOpen(true)}
            >
              <i className="material-icons">cloud_upload</i>
              インポート
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => setCreateModalOpen(true)}
            >
              <i className="material-icons">add</i>
              新規クライアント
            </button>
          </div>
        </div>
        
        <ClientList />
        
        {/* モーダル */}
        <ClientDetailModal />
        <ClientFormModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setCreateModalOpen(false)} 
        />
        <ImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => setImportModalOpen(false)} 
        />
      </div>
    </ClientProvider>
  );
};

export default ClientManagement;
```

### 5. パフォーマンス最適化

1. **仮想スクロール**:
   - クライアント一覧表示に `react-window` または `react-virtualized` を使用して、大量のカードでもスムーズに表示
   - ClientCardコンポーネントのメモ化（React.memo）でレンダリングパフォーマンスを向上

2. **遅延読み込み**:
   - インポートモーダル、詳細モーダルなどは使用時に動的インポートで読み込む
   ```tsx
   const ClientDetailModal = React.lazy(() => import('./ClientDetail/ClientDetailModal'));
   ```

3. **キャッシュ戦略**:
   - React Queryのキャッシュ設定を最適化
   - ユーザーが頻繁に閲覧するクライアントデータは積極的にキャッシュ

4. **API通信の最適化**:
   - クライアント一覧は必要最小限のデータのみ取得
   - 詳細データは詳細表示時に取得
   - 変更頻度の低いデータ（四柱推命情報など）はキャッシュの有効期限を長く設定

## バックエンド実装

### 1. モデル設計

```typescript
// models/Client.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IClient, Gender, Element } from '../../shared';

// ガンシ柱スキーマ
const GanShiPillarSchema = new Schema({
  gan: { type: String, required: true },
  shi: { type: String, required: true },
  element: { type: String, enum: Object.values(Element), required: true }
});

// 四柱推命柱スキーマ
const FourPillarsSchema = new Schema({
  year: { type: GanShiPillarSchema },
  month: { type: GanShiPillarSchema },
  day: { type: GanShiPillarSchema },
  hour: { type: GanShiPillarSchema }
});

// 格局情報スキーマ
const KakukyokuSchema = new Schema({
  type: { type: String },
  category: { type: String, enum: ['special', 'normal'] },
  strength: { type: String, enum: ['strong', 'weak', 'neutral'] },
  description: { type: String }
});

// 用神情報スキーマ
const YojinSchema = new Schema({
  tenGod: { type: String },
  element: { type: String },
  description: { type: String },
  supportElements: { type: [String] },
  kijin: {
    tenGod: { type: String },
    element: { type: String },
    description: { type: String }
  },
  kijin2: {
    tenGod: { type: String },
    element: { type: String },
    description: { type: String }
  },
  kyujin: {
    tenGod: { type: String },
    element: { type: String },
    description: { type: String }
  }
});

// 五行バランススキーマ
const ElementProfileSchema = new Schema({
  wood: { type: Number, default: 0 },
  fire: { type: Number, default: 0 },
  earth: { type: Number, default: 0 },
  metal: { type: Number, default: 0 },
  water: { type: Number, default: 0 }
});

// クライアントスキーマ
export const ClientSchema = new Schema({
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    index: true
  },
  nameReading: { type: String },
  gender: { 
    type: String, 
    enum: Object.values(Gender) 
  },
  birthdate: { 
    type: Date,
    index: true
  },
  birthtime: { type: String },
  birthPlace: { type: String },
  phone: { 
    type: String,
    index: true 
  },
  email: { 
    type: String,
    index: true
  },
  address: { type: String },
  memo: { type: String },
  
  // カスタムフィールド
  customFields: { type: Schema.Types.Mixed },
  
  // 外部システム連携情報
  externalSources: { type: Map, of: String },
  
  // 四柱推命情報
  birthplaceCoordinates: {
    longitude: { type: Number },
    latitude: { type: Number }
  },
  localTimeOffset: { type: Number },
  timeZone: { type: String },
  elementAttribute: { 
    type: String, 
    enum: Object.values(Element) 
  },
  fourPillars: { type: FourPillarsSchema },
  elementProfile: { type: ElementProfileSchema },
  kakukyoku: { type: KakukyokuSchema },
  yojin: { type: YojinSchema },
  personalityDescription: { type: String },
  
  // 内部管理用
  isFavorite: { type: Boolean, default: false },
  hasCompleteSajuProfile: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  lastVisitDate: { 
    type: Date,
    index: true 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// バーチャルフィールド
ClientSchema.virtual('age').get(function() {
  if (!this.birthdate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// 検索用インデックス
ClientSchema.index({ name: 'text', nameReading: 'text', phone: 'text', email: 'text' });

// クライアントとスタイリストの相性モデル
export const ClientStylistCompatibilitySchema = new Schema({
  clientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true,
    index: true
  },
  stylistId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  overallScore: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  calculatedAt: { type: Date, default: Date.now },
  calculationVersion: { type: String }
});

// クライアントノートモデル
export const ClientNoteSchema = new Schema({
  clientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true,
    index: true
  },
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  authorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { type: String, required: true },
  noteType: { 
    type: String, 
    enum: ['general', 'preference', 'treatment', 'follow_up'],
    default: 'general'
  },
  isPrivate: { type: Boolean, default: false },
  isRemoved: { type: Boolean, default: false }
}, { timestamps: true });

// クライアントチャットモデル
export const ClientChatSchema = new Schema({
  clientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true,
    index: true
  },
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  messages: [{
    role: { 
      type: String, 
      enum: ['stylist', 'assistant'], 
      required: true 
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    stylistId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    contextItems: [{
      type: { type: String, required: true },
      refId: { type: String },
      data: { type: Schema.Types.Mixed }
    }]
  }],
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 複合インデックス
ClientStylistCompatibilitySchema.index({ clientId: 1, stylistId: 1 }, { unique: true });
ClientNoteSchema.index({ clientId: 1, createdAt: -1 });
ClientChatSchema.index({ clientId: 1, lastMessageAt: -1 });

// モデル定義
export const Client = mongoose.model<IClient & Document>('Client', ClientSchema);
export const ClientStylistCompatibility = mongoose.model('ClientStylistCompatibility', ClientStylistCompatibilitySchema);
export const ClientNote = mongoose.model('ClientNote', ClientNoteSchema);
export const ClientChat = mongoose.model('ClientChat', ClientChatSchema);
```

### 2. コントローラー設計

```typescript
// controllers/client.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Client, ClientStylistCompatibility, ClientNote, ClientChat } from '../models/Client';
import { sajuEngine } from '../services/saju-engine.service';
import { compatibilityService } from '../services/compatibility.service';
import { auditLogService } from '../services/audit-log.service';

export const clientController = {
  // クライアント一覧取得
  getClients: async (req: AuthRequest, res: Response) => {
    try {
      const { organizationId } = req.user!;
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        filter = 'all',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;
      
      // クエリ構築
      const query: any = { organizationId };
      
      // 検索条件
      if (search) {
        query.$text = { $search: search };
      }
      
      // フィルター条件
      if (filter === 'no_birthday') {
        query.hasCompleteSajuProfile = false;
      } else if (filter === 'recent_visit') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.lastVisitDate = { $gte: thirtyDaysAgo };
      } else if (filter === 'favorite') {
        query.isFavorite = true;
      }
      
      // ソート条件
      const sortOptions: any = {};
      if (sortBy === 'name') {
        sortOptions.name = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'last_visit') {
        sortOptions.lastVisitDate = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'created_at') {
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
      }
      
      // ページネーション
      const skip = (Number(page) - 1) * Number(limit);
      
      // クエリ実行
      const [clients, total] = await Promise.all([
        Client.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .select('id name gender phone email birthdate hasCompleteSajuProfile isFavorite lastVisitDate elementAttribute'),
        
        Client.countDocuments(query)
      ]);
      
      // フィルター別のカウント取得
      const counts = {
        all: await Client.countDocuments({ organizationId }),
        no_birthday: await Client.countDocuments({ 
          organizationId, 
          hasCompleteSajuProfile: false 
        }),
        recent_visit: await Client.countDocuments({ 
          organizationId,
          lastVisitDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        favorite: await Client.countDocuments({ 
          organizationId, 
          isFavorite: true 
        })
      };
      
      // レスポンス
      res.json({
        clients,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        },
        counts
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ 
        error: { 
          code: 'FETCH_CLIENTS_ERROR', 
          message: 'クライアント一覧の取得中にエラーが発生しました' 
        } 
      });
    }
  },
  
  // クライアント詳細取得
  getClientDetail: async (req: AuthRequest, res: Response) => {
    try {
      const { organizationId } = req.user!;
      const { clientId } = req.params;
      
      // クライアント情報取得
      const client = await Client.findOne({ 
        _id: clientId, 
        organizationId 
      });
      
      if (!client) {
        return res.status(404).json({ 
          error: { 
            code: 'CLIENT_NOT_FOUND', 
            message: '指定されたクライアントが見つかりません' 
          } 
        });
      }
      
      // スタイリストとの相性情報取得
      const compatibilities = await ClientStylistCompatibility.find({
        clientId,
        organizationId
      })
      .sort({ overallScore: -1 })
      .limit(5)
      .populate('stylistId', 'id displayName elementAttribute');
      
      // 最近の来店履歴取得（仮実装）
      const recentVisits = []; // 実際の来店履歴APIの実装に置き換える
      
      // レスポンス
      res.json({
        client,
        stylistCompatibility: compatibilities.map(comp => ({
          stylistId: comp.stylistId,
          stylistName: (comp.stylistId as any).displayName,
          overallScore: comp.overallScore
        })),
        recentVisits
      });
    } catch (error) {
      console.error('Error fetching client details:', error);
      res.status(500).json({ 
        error: { 
          code: 'FETCH_CLIENT_DETAIL_ERROR', 
          message: 'クライアント詳細の取得中にエラーが発生しました' 
        } 
      });
    }
  },
  
  // クライアント作成
  createClient: async (req: AuthRequest, res: Response) => {
    try {
      const { organizationId, _id: userId } = req.user!;
      const clientData = req.body;
      
      // サニタイズ
      const newClient = new Client({
        ...clientData,
        organizationId,
        createdBy: userId,
        updatedBy: userId,
        hasCompleteSajuProfile: !!(clientData.birthdate && clientData.gender)
      });
      
      // 四柱推命情報計算（生年月日と時間が提供されている場合）
      if (clientData.birthdate && clientData.gender) {
        const sajuData = await sajuEngine.calculateSaju({
          birthdate: new Date(clientData.birthdate),
          birthtime: clientData.birthtime,
          birthPlace: clientData.birthPlace,
          gender: clientData.gender
        });
        
        // 四柱推命データ設定
        Object.assign(newClient, {
          elementAttribute: sajuData.mainElement,
          fourPillars: sajuData.fourPillars,
          elementProfile: sajuData.elementProfile,
          kakukyoku: sajuData.kakukyoku,
          yojin: sajuData.yojin,
          personalityDescription: sajuData.personalityDescription
        });
      }
      
      // 保存
      await newClient.save();
      
      // 監査ログ記録
      await auditLogService.logAction({
        userId,
        organizationId, 
        action: 'client_create',
        targetId: newClient._id,
        details: { clientName: newClient.name }
      });
      
      // 四柱推命データがある場合、スタイリストとの相性を計算
      if (newClient.hasCompleteSajuProfile) {
        compatibilityService.scheduleCompatibilityCalculation(newClient._id);
      }
      
      res.status(201).json({
        id: newClient._id,
        name: newClient.name,
        message: 'クライアントが正常に作成されました',
        hasCompleteSajuProfile: newClient.hasCompleteSajuProfile
      });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ 
        error: { 
          code: 'CREATE_CLIENT_ERROR', 
          message: 'クライアント作成中にエラーが発生しました' 
        } 
      });
    }
  },
  
  // 以下、他のコントローラーメソッド
  // updateClient, deleteClient, updateClientSaju, 
  // getCompatibility, recalculateCompatibility, など
};
```

### 3. ルート設定

```typescript
// routes/client.routes.ts
import express from 'express';
import { clientController } from '../controllers/client.controller';
import { clientNoteController } from '../controllers/client-note.controller';
import { clientChatController } from '../controllers/client-chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { validateClient } from '../middleware/validators/client.validator';

const router = express.Router();

// 基本CRUD操作
router.get('/', authenticate, clientController.getClients);
router.get('/:clientId', authenticate, clientController.getClientDetail);
router.post('/', authenticate, validateClient, clientController.createClient);
router.put('/:clientId', authenticate, validateClient, clientController.updateClient);
router.delete('/:clientId', authenticate, checkRole(['admin', 'owner']), clientController.deleteClient);

// 四柱推命関連
router.put('/:clientId/saju', authenticate, clientController.updateClientSaju);
router.get('/:clientId/compatibility', authenticate, clientController.getCompatibility);
router.post('/:clientId/compatibility/recalculate', authenticate, clientController.recalculateCompatibility);

// メモ管理
router.get('/:clientId/notes', authenticate, clientNoteController.getClientNotes);
router.post('/:clientId/notes', authenticate, clientNoteController.createClientNote);
router.put('/:clientId/notes/:noteId', authenticate, clientNoteController.updateClientNote);
router.delete('/:clientId/notes/:noteId', authenticate, clientNoteController.deleteClientNote);

// チャット関連
router.get('/:clientId/chat', authenticate, clientChatController.getClientChatHistory);
router.post('/:clientId/chat', authenticate, clientChatController.sendClientChatMessage);

// データインポート/エクスポート
router.post('/import', authenticate, checkRole(['admin', 'owner']), clientController.importClients);
router.post('/export', authenticate, checkRole(['admin', 'owner']), clientController.exportClients);

export default router;
```

### 4. サービス層

```typescript
// services/compatibility.service.ts
import { ClientStylistCompatibility, Client } from '../models/Client';
import { User } from '../models/User';
import { calculateEnhancedCompatibility } from './enhanced-compatibility.service';

export const compatibilityService = {
  // 相性計算スケジュール（バックグラウンド実行）
  scheduleCompatibilityCalculation: async (clientId: string) => {
    // バックグラウンドジョブ登録（実際の実装はキューシステムを使用）
    setTimeout(() => {
      compatibilityService.calculateAllCompatibilities(clientId)
        .catch(err => console.error('Error calculating compatibility:', err));
    }, 0);
  },
  
  // すべてのスタイリストとの相性計算
  calculateAllCompatibilities: async (clientId: string) => {
    try {
      // クライアント情報取得
      const client = await Client.findById(clientId);
      if (!client || !client.hasCompleteSajuProfile) return;
      
      // 組織のスタイリスト一覧取得
      const stylists = await User.find({ 
        organizationId: client.organizationId,
        role: { $in: ['user', 'admin', 'owner'] }  // スタイリストロールを持つユーザー
      });
      
      // 各スタイリストとの相性計算
      const results = await Promise.all(
        stylists.map(stylist => 
          compatibilityService.calculateCompatibility(client, stylist)
        )
      );
      
      return results.filter(Boolean);  // nullを除外
    } catch (error) {
      console.error('Error calculating all compatibilities:', error);
      throw error;
    }
  },
  
  // 単一スタイリストとの相性計算
  calculateCompatibility: async (client: any, stylist: any) => {
    try {
      // スタイリストに四柱推命情報がなければスキップ
      if (!stylist.elementAttribute || !stylist.fourPillars) {
        return null;
      }
      
      // 拡張相性アルゴリズムを使用
      const compatibilityResult = calculateEnhancedCompatibility(
        {
          elementAttribute: client.elementAttribute,
          elementProfile: client.elementProfile,
          fourPillars: client.fourPillars,
          yojin: client.yojin
        },
        {
          elementAttribute: stylist.elementAttribute,
          elementProfile: stylist.elementProfile,
          fourPillars: stylist.fourPillars,
          yojin: stylist.yojin
        }
      );
      
      // 相性データ保存または更新
      const compatibility = await ClientStylistCompatibility.findOneAndUpdate(
        { 
          clientId: client._id, 
          stylistId: stylist._id,
          organizationId: client.organizationId
        },
        {
          overallScore: compatibilityResult.overallScore,
          calculatedAt: new Date(),
          calculationVersion: '1.0'  // アルゴリズムバージョン
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );
      
      return compatibility;
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return null;
    }
  }
};
```

### 5. バリデーション

```typescript
// middleware/validators/client.validator.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// クライアント基本情報バリデーションスキーマ
const clientSchema = Joi.object({
  name: Joi.string().required().max(100).messages({
    'string.empty': '名前は必須です',
    'string.max': '名前は100文字以内で入力してください'
  }),
  nameReading: Joi.string().allow('').max(100),
  gender: Joi.string().valid('male', 'female', 'other', 'unknown'),
  birthdate: Joi.date().iso().allow(null),
  birthtime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').messages({
    'string.pattern.base': '時間はHH:MM形式で入力してください'
  }),
  birthPlace: Joi.string().allow('').max(100),
  phone: Joi.string().allow('').max(20),
  email: Joi.string().email().allow('').max(100).messages({
    'string.email': '有効なメールアドレスを入力してください'
  }),
  address: Joi.string().allow('').max(200),
  memo: Joi.string().allow('').max(1000),
  customFields: Joi.object(),
  externalSources: Joi.object(),
  isFavorite: Joi.boolean()
});

// 四柱推命情報バリデーションスキーマ
const sajuUpdateSchema = Joi.object({
  birthdate: Joi.date().iso().required().messages({
    'date.base': '生年月日は有効な日付を入力してください',
    'any.required': '生年月日は必須です'
  }),
  birthtime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').messages({
    'string.pattern.base': '時間はHH:MM形式で入力してください'
  }),
  birthPlace: Joi.string().allow('').max(100),
  gender: Joi.string().valid('male', 'female', 'other', 'unknown').required().messages({
    'any.required': '性別は必須です'
  }),
  birthplaceCoordinates: Joi.object({
    longitude: Joi.number().min(-180).max(180),
    latitude: Joi.number().min(-90).max(90)
  }).allow(null),
  timeZone: Joi.string().allow('')
});

// クライアントバリデーション
export const validateClient = (req: Request, res: Response, next: NextFunction) => {
  const { error } = clientSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'クライアント情報に不正な値が含まれています',
        details: errorDetails
      }
    });
  }
  
  next();
};

// 四柱推命情報バリデーション
export const validateSajuUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { error } = sajuUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: '四柱推命情報に不正な値が含まれています',
        details: errorDetails
      }
    });
  }
  
  next();
};
```

## データ移行戦略

### 1. 基本移行ステップ

1. **新規DBコレクション作成**:
   - `clients`、`client_stylist_compatibilities`、`client_notes`、`client_chats` コレクションを作成

2. **組織設定**:
   - 各サロンごとに組織レコードがあることを確認
   - 組織IDをクライアントデータに関連付ける

3. **段階的移行**:
   - Phase 1: 基本情報のみ移行
   - Phase 2: 四柱推命情報の移行と計算
   - Phase 3: メモや履歴などの移行

### 2. データインポート機能実装

```typescript
// services/import.service.ts
import { Client } from '../models/Client';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import axios from 'axios';

export const importService = {
  // CSVインポート
  importFromCsv: async (csvContent: string, organizationId: string, userId: string, options: any) => {
    const results = {
      totalProcessed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[]
    };
    
    // CSVパース
    const csvRows: any[] = [];
    await new Promise((resolve, reject) => {
      const stream = Readable.from([csvContent]);
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          csvRows.push(row);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve(null);
        });
    });
    
    // 各行を処理
    for (let i = 0; i < csvRows.length; i++) {
      try {
        const row = csvRows[i];
        results.totalProcessed++;
        
        // 必須フィールドチェック
        if (!row.name) {
          results.errors.push({
            row: i + 1,
            message: '名前は必須です'
          });
          results.skipped++;
          continue;
        }
        
        // 既存クライアントチェック
        let existingClient = null;
        if (row.email) {
          existingClient = await Client.findOne({ 
            organizationId, 
            email: row.email 
          });
        }
        
        if (!existingClient && row.phone) {
          existingClient = await Client.findOne({ 
            organizationId, 
            phone: row.phone 
          });
        }
        
        // クライアントデータ準備
        const clientData = {
          name: row.name,
          nameReading: row.nameReading || '',
          gender: row.gender || 'unknown',
          birthdate: row.birthdate ? new Date(row.birthdate) : null,
          birthtime: row.birthtime || '',
          birthPlace: row.birthPlace || '',
          phone: row.phone || '',
          email: row.email || '',
          address: row.address || '',
          memo: row.memo || '',
          organizationId,
          hasCompleteSajuProfile: !!(row.birthdate && row.gender && row.gender !== 'unknown'),
          updatedBy: userId
        };
        
        // 既存クライアント更新または新規作成
        if (existingClient && options.updateExisting) {
          await Client.updateOne(
            { _id: existingClient._id },
            { $set: clientData }
          );
          results.updated++;
        } else if (!existingClient) {
          const newClient = new Client({
            ...clientData,
            createdBy: userId
          });
          await newClient.save();
          results.imported++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.errors.push({
          row: i + 1,
          message: '処理中にエラーが発生しました'
        });
        results.skipped++;
      }
    }
    
    return results;
  },
  
  // ホットペッパービューティーからインポート
  importFromHotpepper: async (apiKey: string, organizationId: string, userId: string, options: any) => {
    // ホットペッパーAPI呼び出し実装
    // 実際のAPIドキュメントに基づいて実装
    try {
      const results = {
        totalProcessed: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [] as any[]
      };
      
      // APIからデータ取得（仮実装）
      const response = await axios.get(`https://beauty.hotpepper.jp/api/client/list`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      const clients = response.data.clients || [];
      
      // 各クライアントを処理
      for (const hpClient of clients) {
        results.totalProcessed++;
        
        // 既存クライアントチェック
        let existingClient = await Client.findOne({ 
          organizationId,
          'externalSources.hotpepper': hpClient.id
        });
        
        if (!existingClient && hpClient.email) {
          existingClient = await Client.findOne({ 
            organizationId, 
            email: hpClient.email 
          });
        }
        
        // クライアントデータ準備
        const clientData = {
          name: hpClient.name,
          nameReading: hpClient.name_kana || '',
          gender: mapHotpepperGender(hpClient.gender),
          phone: hpClient.phone || '',
          email: hpClient.email || '',
          memo: hpClient.memo || '',
          organizationId,
          externalSources: {
            hotpepper: hpClient.id
          },
          updatedBy: userId
        };
        
        // 既存クライアント更新または新規作成
        if (existingClient && options.updateExisting) {
          await Client.updateOne(
            { _id: existingClient._id },
            { 
              $set: clientData,
              $setOnInsert: { createdBy: userId }
            }
          );
          results.updated++;
        } else if (!existingClient) {
          const newClient = new Client({
            ...clientData,
            createdBy: userId
          });
          await newClient.save();
          results.imported++;
        } else {
          results.skipped++;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error importing from Hotpepper:', error);
      throw new Error('ホットペッパーからのインポート中にエラーが発生しました');
    }
  }
};

// ホットペッパー性別マッピング
function mapHotpepperGender(hpGender: string): string {
  switch (hpGender) {
    case 'male': return 'male';
    case 'female': return 'female';
    default: return 'unknown';
  }
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// __tests__/services/compatibility.service.test.ts
import { compatibilityService } from '../../services/compatibility.service';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { ClientStylistCompatibility } from '../../models/Client';
import mongoose from 'mongoose';

// モックの設定
jest.mock('../../models/Client');
jest.mock('../../models/User');
jest.mock('../../services/enhanced-compatibility.service');

describe('Compatibility Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('calculateCompatibility returns null if stylist has no saju data', async () => {
    // スタイリストのモック（四柱推命データなし）
    const stylist = {
      _id: new mongoose.Types.ObjectId(),
      displayName: 'Test Stylist'
    };
    
    // クライアントのモック
    const client = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Client',
      elementAttribute: 'wood',
      elementProfile: { wood: 30, fire: 20, earth: 20, metal: 15, water: 15 },
      fourPillars: {}
    };
    
    const result = await compatibilityService.calculateCompatibility(client, stylist);
    expect(result).toBeNull();
  });
  
  test('calculateCompatibility returns compatibility data for valid inputs', async () => {
    // スタイリストのモック（四柱推命データあり）
    const stylist = {
      _id: new mongoose.Types.ObjectId(),
      displayName: 'Test Stylist',
      elementAttribute: 'fire',
      elementProfile: { wood: 15, fire: 30, earth: 20, metal: 20, water: 15 },
      fourPillars: {}
    };
    
    // クライアントのモック
    const client = {
      _id: new mongoose.Types.ObjectId(),
      organizationId: new mongoose.Types.ObjectId(),
      name: 'Test Client',
      elementAttribute: 'wood',
      elementProfile: { wood: 30, fire: 20, earth: 20, metal: 15, water: 15 },
      fourPillars: {}
    };
    
    // calculateEnhancedCompatibilityのモック
    require('../../services/enhanced-compatibility.service').calculateEnhancedCompatibility.mockReturnValue({
      overallScore: 85
    });
    
    // findOneAndUpdateのモック
    const compatibilityMock = {
      _id: new mongoose.Types.ObjectId(),
      clientId: client._id,
      stylistId: stylist._id,
      overallScore: 85
    };
    (ClientStylistCompatibility.findOneAndUpdate as jest.Mock).mockResolvedValue(compatibilityMock);
    
    const result = await compatibilityService.calculateCompatibility(client, stylist);
    
    expect(result).toBe(compatibilityMock);
    expect(ClientStylistCompatibility.findOneAndUpdate).toHaveBeenCalledWith(
      { 
        clientId: client._id, 
        stylistId: stylist._id,
        organizationId: client.organizationId
      },
      expect.objectContaining({
        overallScore: 85
      }),
      expect.any(Object)
    );
  });
  
  // 他のテストケース
});
```

### 2. 統合テスト

```typescript
// __tests__/controllers/client.controller.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Client } from '../../models/Client';
import { generateToken } from '../../services/auth.service';

describe('Client Controller Integration Tests', () => {
  let token: string;
  let organizationId: mongoose.Types.ObjectId;
  let userId: mongoose.Types.ObjectId;
  
  beforeAll(async () => {
    // テスト用DBセットアップ
    await mongoose.connect(process.env.TEST_MONGODB_URI || '');
    
    // テストユーザー作成
    organizationId = new mongoose.Types.ObjectId();
    userId = new mongoose.Types.ObjectId();
    
    // テスト用トークン発行
    token = generateToken({
      id: userId.toString(),
      email: 'test@example.com',
      role: 'admin',
      organizationId: organizationId.toString()
    });
  });
  
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // 各テスト前にコレクションをクリア
    await Client.deleteMany({});
  });
  
  describe('GET /api/v1/clients', () => {
    test('returns empty array when no clients exist', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.clients).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
    
    test('returns clients for organization', async () => {
      // テスト用クライアント作成
      const client1 = new Client({
        name: 'Test Client 1',
        organizationId,
        createdBy: userId,
        updatedBy: userId
      });
      await client1.save();
      
      const client2 = new Client({
        name: 'Test Client 2',
        organizationId,
        createdBy: userId,
        updatedBy: userId
      });
      await client2.save();
      
      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.clients.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });
    
    test('filters clients by search term', async () => {
      // テスト用クライアント作成
      const client1 = new Client({
        name: 'Tanaka Taro',
        organizationId,
        createdBy: userId,
        updatedBy: userId
      });
      await client1.save();
      
      const client2 = new Client({
        name: 'Suzuki Hanako',
        organizationId,
        createdBy: userId,
        updatedBy: userId
      });
      await client2.save();
      
      const response = await request(app)
        .get('/api/v1/clients?search=Tanaka')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.clients.length).toBe(1);
      expect(response.body.clients[0].name).toBe('Tanaka Taro');
    });
    
    // 他のテストケース
  });
  
  // 他のエンドポイントテスト
});
```

## パフォーマンス最適化とスケーラビリティ

### 1. インデックス戦略

クライアント管理機能では以下のフィールドにインデックスを作成します：

```javascript
// 主要インデックス
ClientSchema.index({ organizationId: 1 });  // 組織ID
ClientSchema.index({ name: 1 });            // 名前
ClientSchema.index({ phone: 1 });           // 電話番号
ClientSchema.index({ email: 1 });           // メールアドレス

// 複合インデックス
ClientSchema.index({ organizationId: 1, hasCompleteSajuProfile: 1 }); // 四柱推命データフィルタリング
ClientSchema.index({ organizationId: 1, lastVisitDate: -1 });         // 最近の来店フィルタリング
ClientSchema.index({ organizationId: 1, isFavorite: 1 });             // お気に入りフィルタリング

// 全文検索インデックス
ClientSchema.index({ name: 'text', nameReading: 'text', phone: 'text', email: 'text' });
```

### 2. キャッシュ戦略

```typescript
// services/cache.service.ts
import NodeCache from 'node-cache';

// キャッシュ設定
const cache = new NodeCache({
  stdTTL: 300,  // 5分
  checkperiod: 60  // 1分おきにTTLチェック
});

export const cacheService = {
  // キャッシュキー生成
  getKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  },
  
  // データ取得（キャッシュまたはDB）
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedData = cache.get<T>(key);
    if (cachedData !== undefined) {
      return cachedData;
    }
    
    const freshData = await fetchFn();
    cache.set(key, freshData, ttl);
    return freshData;
  },
  
  // キャッシュ無効化
  invalidate(key: string): void {
    cache.del(key);
  },
  
  // プレフィックスに基づくキャッシュ無効化
  invalidateByPrefix(prefix: string): void {
    const keys = cache.keys().filter(k => k.startsWith(`${prefix}:`));
    keys.forEach(k => cache.del(k));
  }
};
```

### 3. データベース接続最適化

```typescript
// config/database.ts
import mongoose from 'mongoose';

export const connectToDatabase = async (): Promise<void> => {
  const options: mongoose.ConnectOptions = {
    // コネクションプール設定
    minPoolSize: 5,
    maxPoolSize: 10,
    
    // タイムアウト設定
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    
    // 再接続設定
    autoIndex: process.env.NODE_ENV !== 'production'  // 本番環境では手動でインデックス作成
  };
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || '', options);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
  
  // 接続イベントハンドリング
  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Trying to reconnect...');
  });
  
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
};
```

## セキュリティ対策

### 1. アクセス制御

```typescript
// middleware/client-access.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Client } from '../models/Client';

// クライアントアクセス権限チェック
export const checkClientAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params;
    const { organizationId, role } = req.user!;
    
    // clientIdが不正な場合
    if (!clientId || !organizationId) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: '不正なリクエストです'
        }
      });
    }
    
    // クライアントの存在チェック
    const client = await Client.findById(clientId).select('organizationId');
    
    if (!client) {
      return res.status(404).json({
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: '指定されたクライアントが見つかりません'
        }
      });
    }
    
    // 組織IDチェック
    if (client.organizationId.toString() !== organizationId.toString()) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'このクライアントへのアクセス権限がありません'
        }
      });
    }
    
    // リクエストオブジェクトにクライアント情報を追加
    req.targetClient = client;
    
    next();
  } catch (error) {
    console.error('Error checking client access:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました'
      }
    });
  }
};
```

### 2. 入力サニタイズ

```typescript
// middleware/sanitize.middleware.ts
import { Request, Response, NextFunction } from 'express';
import sanitize from 'mongo-sanitize';
import xss from 'xss';

// MongoDBインジェクション防止
export const sanitizeMongo = (req: Request, res: Response, next: NextFunction) => {
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);
  next();
};

// XSS防止
export const sanitizeXss = (req: Request, res: Response, next: NextFunction) => {
  // 再帰的にオブジェクトのすべての文字列値をサニタイズ
  const sanitizeRecursive = (obj: any): any => {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return xss(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeRecursive(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = sanitizeRecursive(obj[key]);
        }
      }
      return result;
    }
    
    return obj;
  };
  
  req.body = sanitizeRecursive(req.body);
  next();
};
```

### 3. 個人情報保護

```typescript
// utils/pii-masking.ts
// 個人情報マスキングユーティリティ

// 電話番号のマスク処理
export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  
  // 数字以外の文字を削除
  const digits = phone.replace(/\D/g, '');
  
  // 短すぎる場合はそのまま返す
  if (digits.length < 6) return phone;
  
  // 後半部分をマスク
  const visiblePart = digits.substring(0, Math.min(4, digits.length - 3));
  const hiddenPart = '*'.repeat(digits.length - visiblePart.length - 1);
  const lastDigit = digits.substring(digits.length - 1);
  
  return `${visiblePart}${hiddenPart}${lastDigit}`;
};

// メールアドレスのマスク処理
export const maskEmail = (email: string): string => {
  if (!email) return '';
  
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const [username, domain] = parts;
  
  // ユーザー名をマスク
  let maskedUsername = username;
  if (username.length > 2) {
    maskedUsername = `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}`;
  }
  
  return `${maskedUsername}@${domain}`;
};

// 住所のマスク処理
export const maskAddress = (address: string): string => {
  if (!address) return '';
  
  // 都道府県と市区町村までを表示
  const matches = address.match(/^(.+?[都道府県])(.+?[市区町村])/);
  if (matches && matches.length >= 3) {
    return `${matches[1]}${matches[2]}...`;
  }
  
  // マッチしない場合、前半だけ表示
  if (address.length > 8) {
    return `${address.substring(0, 8)}...`;
  }
  
  return address;
};

// クライアントデータのマスク処理
export const maskClientPii = (client: any, shouldMask = true): any => {
  if (!shouldMask) return client;
  
  const masked = { ...client };
  
  if (masked.phone) masked.phone = maskPhone(masked.phone);
  if (masked.email) masked.email = maskEmail(masked.email);
  if (masked.address) masked.address = maskAddress(masked.address);
  
  return masked;
};
```

## エラーハンドリング

### 1. エラータイプの定義

```typescript
// types/error.types.ts
export enum ErrorCode {
  // クライアント関連
  CLIENT_NOT_FOUND = 'CLIENT_NOT_FOUND',
  CLIENT_ALREADY_EXISTS = 'CLIENT_ALREADY_EXISTS',
  INVALID_CLIENT_DATA = 'INVALID_CLIENT_DATA',
  CLIENT_ACCESS_DENIED = 'CLIENT_ACCESS_DENIED',
  
  // 相性計算関連
  COMPATIBILITY_ERROR = 'COMPATIBILITY_ERROR',
  INCOMPLETE_SAJU_PROFILE = 'INCOMPLETE_SAJU_PROFILE',
  
  // メモ関連
  NOTE_NOT_FOUND = 'NOTE_NOT_FOUND',
  NOTE_ACCESS_DENIED = 'NOTE_ACCESS_DENIED',
  
  // インポート関連
  IMPORT_FAILED = 'IMPORT_FAILED',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  
  // 認証関連
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // その他
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: any;
  
  constructor(code: ErrorCode, message: string, status: number = 500, details?: any) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = 'AppError';
  }
}
```

### 2. エラーハンドラーミドルウェア

```typescript
// middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/error.types';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  // AppErrorの場合
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }
  
  // MongoDBエラーの処理
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    const mongoErr = err as any;
    
    // 重複キーエラー
    if (mongoErr.code === 11000) {
      return res.status(409).json({
        error: {
          code: ErrorCode.CLIENT_ALREADY_EXISTS,
          message: 'クライアント情報が重複しています',
          details: mongoErr.keyValue
        }
      });
    }
    
    // その他のMongoDBエラー
    return res.status(500).json({
      error: {
        code: ErrorCode.SERVER_ERROR,
        message: 'データベースエラーが発生しました'
      }
    });
  }
  
  // バリデーションエラー
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'バリデーションエラーが発生しました',
        details: err.message
      }
    });
  }
  
  // その他のエラー（予期しないエラー）
  return res.status(500).json({
    error: {
      code: ErrorCode.SERVER_ERROR,
      message: '予期しないエラーが発生しました'
    }
  });
};
```

## 開発ロードマップ

クライアント管理機能の実装は以下のフェーズで進めることを推奨します：

### Phase 1（基本機能）
- クライアントモデル実装
- CRUD操作の基本API実装
- クライアント検索・フィルター機能実装
- 四柱推命情報の計算と保存
- 管理画面の基本UI実装

### Phase 2（拡張機能）
- 相性診断機能実装
- メモ管理機能実装
- クライアント詳細表示の拡張
- フィルターとソート機能の強化
- パフォーマンス最適化

### Phase 3（高度機能）
- データインポート/エクスポート機能
- 外部システム連携（ホットペッパー等）
- チャット機能連携
- アナリティクス機能追加
- 多言語対応

## 結論

クライアント管理機能は、美容サロン向けの四柱推命ベースの顧客管理システムの中核を担います。本実装ガイドで示した設計と実装方針に従うことで、パフォーマンスが高く、セキュアで、使いやすいクライアント管理機能を実現できます。

既存のユーザー管理システムや四柱推命エンジンとの連携を意識しながら、段階的に機能を実装していくことで、リスクを最小限に抑えつつ進めることができます。特に、相性診断機能やチャット機能との連携は、このアプリケーションの差別化ポイントとなる重要な機能です。