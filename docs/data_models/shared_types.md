# shared/index.ts への追加すべき型定義

以下は、美姫命アプリケーションのフロントエンドとバックエンド間で共有すべき型定義の実装です。`shared/index.ts`に追加することで、クライアントとサーバー間で型の一貫性を確保できます。

```typescript
// ========== 階層化ロール関連 ==========

// 4階層ユーザーロール
export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  OWNER = 'Owner',
  ADMIN = 'Admin',
  USER = 'User'
}

// 組織モデル
export interface IOrganization {
  id: string;
  name: string;
  ownerId: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  websiteUrl?: string;
  businessHours?: {
    start: string;
    end: string;
    dayOfWeek: number;
  }[];
  description?: string;
  planId?: string;
  subscriptionPlan: {
    type: 'none' | 'active' | 'trial' | 'cancelled';
    isActive: boolean;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ユーザーモデル（既存モデルの拡張）
export interface IUserExtended extends IUser {
  role: UserRole;
  organizationId?: string;
  jobTitle?: string;
  phoneNumber?: string;
}

// ========== 美容クライアント関連 ==========

// クライアント性別
export enum ClientGender {
  MALE = 'M',
  FEMALE = 'F'
}

// クライアントメモタイプ
export enum ClientNoteType {
  GENERAL = 'general',       // 一般メモ
  PREFERENCE = 'preference', // 好み・嗜好
  TREATMENT = 'treatment',   // 施術関連
  FOLLOW_UP = 'follow_up'    // フォローアップ
}

// 時間帯区分
export enum TimeSlot {
  MORNING = 'morning',       // 午前 (00:00-12:00)
  AFTERNOON = 'afternoon',   // 午後 (12:00-17:00)
  EVENING = 'evening'        // 夕方以降 (17:00-24:00)
}

// 施術タイプ
export enum TreatmentType {
  CUT = 'cut',               // カット
  COLOR = 'color',           // カラー
  PERM = 'perm',             // パーマ
  STRAIGHT = 'straight',     // 縮毛矯正
  TREATMENT = 'treatment',   // トリートメント
  SPA = 'spa',               // ヘッドスパ
  STYLING = 'styling',       // スタイリング
  EXTENSION = 'extension',   // エクステンション
  OTHER = 'other'            // その他
}

// 予約ステータス
export enum AppointmentStatus {
  CONFIRMED = 'confirmed',  // 確定
  PENDING = 'pending',      // 保留中
  CANCELLED = 'cancelled',  // キャンセル済み
  COMPLETED = 'completed',  // 完了
  NO_SHOW = 'no_show'       // 無断キャンセル
}

// クライアントベース情報インターフェース
export interface IClientBase {
  id: string;
  organizationId: string;
  name: string;
  nameReading?: string;
  gender?: ClientGender;
  birthdate?: Date;
  birthtime?: string;
  birthPlace?: string;
  phone?: string;
  email?: string;
  address?: string;
  memo?: string;
  isFavorite: boolean;
  hasCompleteSajuProfile: boolean;
  lastVisitDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// クライアント四柱推命情報インターフェース
export interface IClientSaju {
  birthplaceCoordinates?: {
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;
  timeZone?: string;
  elementAttribute?: Element;
  fourPillars?: {
    year: {
      gan: string;
      shi: string;
      element: string;
    };
    month: {
      gan: string;
      shi: string;
      element: string;
    };
    day: {
      gan: string;
      shi: string;
      element: string;
    };
    hour: {
      gan: string;
      shi: string;
      element: string;
    };
  };
  elementProfile?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  kakukyoku?: {
    type: string;
    category: 'special' | 'normal';
    strength: 'strong' | 'weak' | 'neutral';
    description?: string;
  };
  yojin?: {
    tenGod: string;
    element: string;
    description?: string;
    supportElements?: string[];
  };
  personalityDescription?: string;
}

// クライアント完全情報インターフェース
export interface IClient extends IClientBase, IClientSaju {
  customFields?: Record<string, any>;
  externalSources?: {
    [sourceKey: string]: string;
  };
}

// クライアントメモインターフェース
export interface IClientNote {
  id: string;
  clientId: string;
  organizationId: string;
  authorId: string;
  authorName?: string;
  content: string;
  noteType: ClientNoteType;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  isRemoved: boolean;
}

// 予約インターフェース
export interface IAppointment {
  id: string;
  organizationId: string;
  clientId: string;
  stylistId: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  services: TreatmentType[];
  status: AppointmentStatus;
  notes?: string;
  source?: string;
  timeSlot: TimeSlot;
  externalIds?: {
    calendarEventId?: string;
    hotpepperBookingId?: string;
    otherSystemId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// クライアント-スタイリスト相性インターフェース
export interface IClientStylistCompatibility {
  id: string;
  clientId: string;
  stylistId: string;
  organizationId: string;
  overallScore: number;
  elementRelation: ElementRelation;
  details?: {
    wood: { score: number; factor: string; };
    fire: { score: number; factor: string; };
    earth: { score: number; factor: string; };
    metal: { score: number; factor: string; };
    water: { score: number; factor: string; };
  };
  calculatedAt: Date;
  calculationVersion: string;
}

// ========== クライアントチャット関連 ==========

// 送信者タイプ
export enum ChatSenderType {
  STYLIST = 'stylist',
  ASSISTANT = 'assistant'
}

// クライアントチャットメッセージインターフェース
export interface IClientChatMessage {
  id?: string;
  sender: ChatSenderType;
  senderId?: string;
  content: string;
  timestamp: Date;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  additionalContext?: {
    visitPurpose?: string;
    clientConcerns?: string[];
    seasonalEvent?: string;
    hairCondition?: string;
    dayPillar?: {
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
      energyDescription: string;
    };
  };
}

// クライアントチャットインターフェース
export interface IBeautyClientChat {
  id: string;
  organizationId: string;
  clientId: string;
  lastMessageAt: Date;
  tokenCount: number;
  aiModel: string;
  contextData: {
    sajuProfile?: {
      fourPillars: {
        yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
        monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
        dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
        hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
      };
      kakukyoku?: {
        type: string;
        category: string;
        strength: string;
        description: string;
      };
      yojin?: {
        tenGod: string;
        element: string;
        description: string;
        supportElements: string[];
      };
      elementProfile: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        mainElement: string;
        secondaryElement?: string;
      };
    };
    clientProfile?: {
      name: string;
      gender: ClientGender;
      birthdate: string;
      birthtime?: string;
      preferences?: string[];
      hairType?: string;
      skinTone?: string;
    };
    visitHistory?: Array<{
      date: string;
      serviceType: string;
      stylistId: string;
      stylistName: string;
      notes?: string;
    }>;
    additionalNotes?: string[];
  };
  messages: IClientChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// クライアントチャット送信リクエスト
export interface SendClientChatRequest {
  message: string;
  includeContext?: boolean;
}

// クライアントチャットレスポンス
export interface ClientChatResponse {
  chatId: string;
  message: IClientChatMessage;
  remainingTokens?: number;
}

// ========== サポートチケット関連 ==========

// チケットステータス
export enum TicketStatus {
  PENDING = 'pending',   // 未回答
  ANSWERED = 'answered'  // 回答済み
}

// 送信者タイプ
export enum TicketSenderType {
  SALON = 'salon',         // サロンスタッフ
  SUPERADMIN = 'superadmin' // スーパー管理者
}

// サポートチケットインターフェース
export interface ISupportTicket {
  id: string;
  ticketNumber: string;
  organizationId: string;
  creatorId: string;
  title: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

// チケットメッセージインターフェース
export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderId: string | 'superadmin';
  senderType: TicketSenderType;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

// ========== 課金・プラン関連 ==========

// 課金サイクル
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// サブスクリプションステータス
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  SUSPENDED = 'suspended'
}

// 請求書ステータス
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled'
}

// トークンチャージタイプ
export enum TokenChargeType {
  STANDARD = 'standard',  // 標準チャージ (100万トークン)
  PREMIUM = 'premium'     // プレミアムチャージ (1000万トークン)
}

// プランインターフェース
export interface IPricePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  features: {
    maxUsers: number;
    maxClients: number;
    allowedFeatures: string[];
    maxTokensPerMonth: number;
  };
  additionalTokenPrice: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// サブスクリプションインターフェース
export interface ISubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  billingCycle: BillingCycle;
  nextBillingDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// APIパス追加

// 美容クライアント関連APIパス
export const BEAUTY_CLIENT = {
  LIST: `${API_BASE_PATH}/beauty-clients`,
  DETAIL: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}`,
  CREATE: `${API_BASE_PATH}/beauty-clients`,
  UPDATE: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}`,
  DELETE: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}`,
  
  // メモ関連
  GET_NOTES: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/notes`,
  CREATE_NOTE: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/notes`,
  UPDATE_NOTE: (clientId: string, noteId: string) => 
    `${API_BASE_PATH}/beauty-clients/${clientId}/notes/${noteId}`,
  DELETE_NOTE: (clientId: string, noteId: string) => 
    `${API_BASE_PATH}/beauty-clients/${clientId}/notes/${noteId}`,
  
  // チャット関連
  GET_CHAT: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/chat`,
  SEND_CHAT: (clientId: string) => `${API_BASE_PATH}/beauty-clients/${clientId}/chat`,
  
  // 予約関連
  GET_APPOINTMENTS: `${API_BASE_PATH}/beauty-appointments`,
  GET_DAILY_APPOINTMENTS: (date?: string) => 
    date ? `${API_BASE_PATH}/beauty-appointments/daily?date=${date}` 
         : `${API_BASE_PATH}/beauty-appointments/daily`,
  CREATE_APPOINTMENT: `${API_BASE_PATH}/beauty-appointments`,
  UPDATE_APPOINTMENT: (appointmentId: string) => 
    `${API_BASE_PATH}/beauty-appointments/${appointmentId}`,
  CANCEL_APPOINTMENT: (appointmentId: string) => 
    `${API_BASE_PATH}/beauty-appointments/${appointmentId}/cancel`,
};

// サポート関連APIパス
export const BEAUTY_SUPPORT = {
  TICKETS: `${API_BASE_PATH}/support/tickets`,
  TICKET_DETAIL: (id: string) => `${API_BASE_PATH}/support/tickets/${id}`,
  TICKET_REPLY: (id: string) => `${API_BASE_PATH}/support/tickets/${id}/reply`,
};

// 組織管理関連APIパス
export const ORGANIZATION = {
  DETAIL: `${API_BASE_PATH}/organization`,
  UPDATE: `${API_BASE_PATH}/organization`,
  STYLISTS: `${API_BASE_PATH}/organization/stylists`,
  ADD_STYLIST: `${API_BASE_PATH}/organization/stylists`,
  UPDATE_STYLIST: (stylistId: string) => `${API_BASE_PATH}/organization/stylists/${stylistId}`,
  DELETE_STYLIST: (stylistId: string) => `${API_BASE_PATH}/organization/stylists/${stylistId}`,
};

// 課金関連APIパス
export const BEAUTY_BILLING = {
  GET_CURRENT_PLAN: `${API_BASE_PATH}/billing/plan`,
  CHANGE_PLAN: `${API_BASE_PATH}/billing/plan`,
  INVOICES: `${API_BASE_PATH}/billing/invoices`,
  INVOICE_DETAIL: (invoiceId: string) => `${API_BASE_PATH}/billing/invoices/${invoiceId}`,
  TOKEN_USAGE: `${API_BASE_PATH}/billing/token-usage`,
  PURCHASE_TOKENS: `${API_BASE_PATH}/billing/purchase-tokens`,
};

// SuperAdmin関連APIパス
export const SUPER_ADMIN = {
  ORGANIZATIONS: `${API_BASE_PATH}/super-admin/organizations`,
  ORGANIZATION_DETAIL: (orgId: string) => `${API_BASE_PATH}/super-admin/organizations/${orgId}`,
  PLANS: `${API_BASE_PATH}/super-admin/plans`,
  PLAN_DETAIL: (planId: string) => `${API_BASE_PATH}/super-admin/plans/${planId}`,
  SUPPORT_TICKETS: `${API_BASE_PATH}/super-admin/support/tickets`,
  TICKET_DETAIL: (ticketId: string) => `${API_BASE_PATH}/super-admin/support/tickets/${ticketId}`,
  TICKET_REPLY: (ticketId: string) => `${API_BASE_PATH}/super-admin/support/tickets/${ticketId}/reply`,
  REVENUE_STATS: `${API_BASE_PATH}/super-admin/revenue/stats`,
  API_USAGE_STATS: `${API_BASE_PATH}/super-admin/api/usage-stats`,
};
```

## 注意事項

上記の型定義を実際に `shared/index.ts` に追加する際は、以下の点に注意してください：

1. **既存の型定義との競合を避ける**:
   - 既存の型と重複するフィールドや型名が存在する場合は、適切に調整してください。
   - 特に、`IUser` インターフェースは既に存在するため、拡張する形で実装しています。

2. **バックエンドとの同期**:
   - 型定義を `shared/index.ts` に追加した後は、バックエンド側の `server/src/types/index.ts` にも同様の変更を手動で反映させてください。
   - これは「単一の真実源」の概念を維持するために重要です。

3. **APIパスの命名規則**:
   - 新しく追加するAPIパスは、機能領域ごとにプレフィックスを付けて管理します。
   - 既存のAPIパスと競合しないように注意してください。

4. **既存の列挙型との統合**:
   - 既存の列挙型（`Element`、`ElementRelation`など）と互換性を保つように実装してください。
   - 必要に応じて、既存の列挙型を拡張するか参照してください。