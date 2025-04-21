# チーム機能と友達機能リファクタリング計画

## 現状の問題点

1. **単一チーム所属制限**:
   - 現在のデータモデルでは、ユーザーは1つのチームにしか所属できない（User.teamId が単一値）
   - 複数チームへの所属をサポートするデータモデルが必要

2. **友達機能の欠如**:
   - 現在、ユーザー間の友達関係を管理する機能が存在しない
   - 相性診断や相互プロフィール閲覧などの友達間機能をサポートするモデルが必要

3. **チーム作成・参加フロー**:
   - 現在のUIは単純にチーム一覧と管理機能のみを提供
   - 友達リストからのメンバー追加機能が実装されていない
   - 招待リンクを通じた登録・チーム参加・友達追加の統合フローがない

4. **データ構造の一貫性**:
   - Team モデルと User モデルの間でメンバーシップが User.teamId で管理されており、多対多関係をサポートしていない
   - 友達関係を管理するデータモデルがない

## リファクタリング目標

1. **複数チーム所属モデル**:
   - ユーザーが複数のチームに所属できるデータモデルに変更
   - チーム作成とメンバーシップ管理の分離

2. **友達機能の実装**:
   - ユーザー間の友達関係を管理するデータモデル
   - 友達検索、リクエスト送信・承認機能
   - 友達間の相性診断機能
   - 友達リストの表示とプロフィール閲覧機能

3. **統合フローの実装**:
   - 友達リストからチームメンバー追加機能
   - 招待リンクを通じた統合登録フロー
   - チームメンバー間の自動友達関係確立

4. **魅力的なUX**:
   - モックアップのデザインを反映した友達リスト、チームハブなどのUI
   - 直感的な招待・承認フロー

## 参考モックアップ

実装の参考とするモックアップファイル：

1. **友達リスト**：`/mockups/friends-list.html`
   - 友達一覧、友達検索、申請管理のUI設計
   - 友達操作（プロフィール表示、相性診断、削除）

2. **チームハブ**：`/mockups/team-hub.html`
   - チーム一覧と概要表示
   - チーム作成ボタンとチーム切り替え

3. **チームダッシュボード**：`/mockups/team-dashboard.html`
   - チーム詳細、メンバー一覧、運勢ランキング
   - チーム管理機能へのアクセス

4. **招待・参加フロー**：
   - `/mockups/app-invitation.html` - アプリ招待画面
   - `/mockups/team-no-membership.html` - チーム未参加時の表示

5. **相性診断関連**：
   - 現在の実装である `/team/{teamId}/aisyou` の処理方法を継続利用
   - 友達間の相性診断でも同様のエンドポイントと表示方法を活用
   - 必要に応じて相性スコア計算と表示の改善を検討

## 五行属性の考慮

五行属性（木・火・土・金・水）は、友達機能とチーム機能において重要な要素です。現在のシステムでの実装と友達機能への適用について検討します。

### 現在の五行属性実装

1. **データ保存**:
   - `User` モデルの `elementAttribute` フィールドに直接保存されている
   - 選択肢: 'wood', 'fire', 'earth', 'metal', 'water'

2. **視覚的表現**:
   - 各属性に対応した色とアイコンで表現
   - 色: 木(緑), 火(赤), 土(オレンジ), 金(黄/金), 水(青)
   - アイコン: 木(Park), 火(Whatshot), 土(Public), 金(Diamond), 水(WaterDrop)

3. **使用場面**:
   - チームメンバー一覧表示
   - メンバーカルテ生成
   - 相性診断の基礎データ

### 友達機能への五行属性の適用

1. **データモデル設計**:
   - 五行属性は引き続き `User` モデルに保持し、`Friendship` モデルには保存しない
   - 友達リスト取得時に `User` から五行属性を取得

2. **最適化された友達取得**:
   ```typescript
   // 最適化された友達一覧取得メソッド
   export const getFriends = async (userId: string) => {
     // 1回のアグリゲーションクエリで全データを取得
     const friends = await Friendship.aggregate([
       {
         $match: {
           $or: [
             { userId1: new mongoose.Types.ObjectId(userId), status: 'accepted' },
             { userId2: new mongoose.Types.ObjectId(userId), status: 'accepted' }
           ]
         }
       },
       {
         // friendIdフィールドを計算（自分以外のユーザーID）
         $addFields: {
           friendId: {
             $cond: [
               { $eq: ['$userId1', new mongoose.Types.ObjectId(userId)] },
               '$userId2',
               '$userId1'
             ]
           }
         }
       },
       {
         // 友達のユーザー情報を結合
         $lookup: {
           from: 'users',
           localField: 'friendId',
           foreignField: '_id',
           as: 'friendInfo'
         }
       },
       { $unwind: '$friendInfo' },
       {
         $project: {
           friendship: '$_id',
           userId: '$friendId',
           displayName: '$friendInfo.displayName',
           email: '$friendInfo.email',
           elementAttribute: '$friendInfo.elementAttribute',
           acceptedAt: '$acceptedAt',
           createdAt: 1
         }
       }
     ]);
     
     return friends;
   };
   ```

3. **友達一覧表示**:
   - チームメンバー表示と同様のスタイルとコンポーネントを再利用
   - 五行属性に基づいたアバター背景色、チップ表示
   - 属性ごとのカラーマッピングは一貫して利用

4. **フロントエンド実装**:
   ```jsx
   // 友達リスト内での五行属性表示
   const elementLabels = {
     water: { name: '水', bg: 'var(--element-water-bg)', color: 'var(--element-water-dark)' },
     wood: { name: '木', bg: 'var(--element-wood-bg)', color: 'var(--element-wood-dark)' },
     fire: { name: '火', bg: 'var(--element-fire-bg)', color: 'var(--element-fire-dark)' },
     earth: { name: '土', bg: 'var(--element-earth-bg)', color: 'var(--element-earth-dark)' },
     metal: { name: '金', bg: 'var(--element-metal-bg)', color: 'var(--element-metal-dark)' }
   };
   
   // 友達アバター表示例
   <Avatar 
     sx={{ 
       bgcolor: friend.elementAttribute ? 
         elementLabels[friend.elementAttribute].bg : 'grey.300',
       color: friend.elementAttribute ? 
         elementLabels[friend.elementAttribute].color : 'text.primary'
     }}
   >
     {friend.displayName?.charAt(0) || '?'}  
   </Avatar>
   ```

このアプローチにより、データの冗長性を避けつつ、チームメンバー表示と友達表示で一貫性のある五行属性の視覚表現を実現します。

## チーム目標連携

複数チーム所属をサポートする場合、チーム目標とそのアドバイスの表示方法も見直す必要があります。

### TeamGoalモデルの現状

現在のTeamGoalモデルは以下の構造になっています：

```typescript
// TeamGoalモデル
interface ITeamGoal {
  _id: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId; // 参照先のチーム
  content: string;                 // 目標内容（5-500文字）
  deadline?: Date;                 // 期限（オプション）
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed'; // 状態
  progress: number;                // 進捗率（0-100）
  collaborators?: mongoose.Types.ObjectId[]; // 関連するメンバー（オプション）
  createdAt: Date;
  updatedAt: Date;
}
```

### 課題と解決策

1. **複数チーム所属時の表示問題**:
   - 現在は `/fortune` ページにチーム目標アドバイスが統合されているが、複数チーム所属時に複雑化する
   - 解決策: `/fortune` からチーム目標アドバイス部分を分離し、別画面（`/team/{teamId}/advice`）に移動

2. **チーム目標アドバイスの生成**:
   - 現状: ユーザーの五行属性、日柱の属性、運勢タイプ、チーム役割を元にアドバイスを生成
   - 変更点: 複数チームに所属する場合、選択中のチームに応じてアドバイスを生成・表示

3. **データモデルの関連**:
   - TeamGoalとTeamMembershipの間に明示的な関連は不要
   - TeamMembershipモデルは参照元のチームの最新目標を間接的に参照できる設計

### 実装方針

1. **UIの分離**:
   ```jsx
   // 現状と変更後の比較
   // 変更前: Fortuneページにチーム目標アドバイスを含める
   <FortuneDetails fortune={fortune} includeTeamGoalAdvice={true} />
   
   // 変更後: チーム目標アドバイスを分離
   <FortuneDetails fortune={fortune} /> // 個人運勢のみ
   <TeamAdvice teamId={selectedTeamId} /> // チーム専用画面に移動
   ```

2. **チーム目標アドバイス取得の最適化**:
   ```typescript
   // チーム目標アドバイス取得ロジック
   export const getTeamAdvice = async (userId: string, teamId: string) => {
     // チームメンバーシップの確認
     const membership = await TeamMembership.findOne({ 
       userId, 
       teamId 
     });
     
     if (!membership) {
       throw new Error('このチームのメンバーではありません');
     }
     
     // 最新のチーム目標を取得
     const teamGoal = await TeamGoal.findOne({
       teamId
     }).sort({ createdAt: -1 });
     
     // ユーザーの運勢データ取得
     const fortune = await DailyFortune.findOne({
       userId,
       date: { 
         $gte: new Date(new Date().setHours(0, 0, 0, 0)),
         $lt: new Date(new Date().setHours(23, 59, 59, 999))
       }
     });
     
     // チーム目標アドバイスの生成
     const advice = await generateTeamGoalAdvice(
       fortune.element,
       fortune.dayPillar,
       teamGoal,
       membership.role
     );
     
     return {
       teamGoal,
       advice,
       membership
     };
   };
   ```

3. **チームコンテキスト変更時の動的更新**:
   - チームセレクター選択時にチーム目標アドバイスを動的に更新
   - キャッシュ戦略を適用して不要なAPIリクエストを最小化

### チーム切り替え機能の最適化

現在のシステムではチーム切り替えの基本機能はあるものの、複数チーム所属を効率的にサポートするためには以下の改善が必要です：

1. **グローバルチームコンテキストの導入**:
   ```typescript
   // TeamContext.tsx - 新規作成
   interface TeamContextType {
     teams: ITeam[];
     activeTeamId: string | null;
     setActiveTeamId: (teamId: string) => Promise<void>;
     activeTeam: ITeam | null;
     isLoading: boolean;
     refreshTeams: () => Promise<void>;
   }

   export const TeamContext = createContext<TeamContextType>({
     teams: [],
     activeTeamId: null,
     setActiveTeamId: async () => {},
     activeTeam: null,
     isLoading: false,
     refreshTeams: async () => {}
   });

   export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const [teams, setTeams] = useState<ITeam[]>([]);
     const [activeTeamId, setActiveTeamIdState] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState<boolean>(true);
     const { currentUser } = useAuth();
     const storageService = useStorageService();

     // ユーザーの所属チーム一覧を取得
     const fetchTeams = async () => {
       if (!currentUser) return;
       
       try {
         setIsLoading(true);
         // 複数チームメンバーシップ対応後はこの呼び出しが変更
         const userTeams = await teamService.getUserTeams();
         setTeams(userTeams);
         
         // アクティブチームが未設定か、所属チームに存在しない場合は最初のチームをアクティブに
         if (!activeTeamId || !userTeams.some(team => team.id === activeTeamId)) {
           const defaultTeamId = userTeams.length > 0 ? userTeams[0].id : null;
           if (defaultTeamId) {
             await setActiveTeamId(defaultTeamId);
           }
         }
       } catch (error) {
         console.error('チーム一覧取得エラー:', error);
       } finally {
         setIsLoading(false);
       }
     };

     // アクティブチームIDの設定と永続化
     const setActiveTeamId = async (teamId: string) => {
       try {
         await storageService.set('activeTeamId', teamId);
         setActiveTeamIdState(teamId);
         console.log(`アクティブチームIDを設定: ${teamId}`);
       } catch (error) {
         console.error('アクティブチームID保存エラー:', error);
       }
     };

     // 初期化
     useEffect(() => {
       const initialize = async () => {
         try {
           // 保存されたアクティブチームIDの読み込み
           const savedTeamId = await storageService.get('activeTeamId');
           if (savedTeamId) {
             setActiveTeamIdState(savedTeamId);
           }
           
           await fetchTeams();
         } catch (error) {
           console.error('TeamContext初期化エラー:', error);
         }
       };
       
       initialize();
     }, [currentUser?.uid]);

     // アクティブチームの計算
     const activeTeam = useMemo(() => {
       return teams.find(team => team.id === activeTeamId) || null;
     }, [teams, activeTeamId]);

     const value = {
       teams,
       activeTeamId,
       setActiveTeamId,
       activeTeam,
       isLoading,
       refreshTeams: fetchTeams
     };

     return (
       <TeamContext.Provider value={value}>
         {children}
       </TeamContext.Provider>
     );
   };
   ```

2. **チームデータのキャッシュ戦略**:
   ```typescript
   // team.service.ts内のキャッシュ機能拡張
   export class TeamService {
     private teamDataCache: Map<string, { data: any, expiration: Date }> = new Map();
     private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5分
     
     // キャッシュ機能を持つチームデータ取得メソッド
     async getTeamDataWithCache(teamId: string, endpoint: string): Promise<any> {
       const cacheKey = `${endpoint}:${teamId}`;
       const cachedData = this.teamDataCache.get(cacheKey);
       
       // 有効なキャッシュが存在する場合はそれを返す
       if (cachedData && cachedData.expiration > new Date()) {
         console.log(`キャッシュから${endpoint}データを取得:`, teamId);
         return cachedData.data;
       }
       
       // APIから新しいデータを取得
       try {
         const response = await apiService.get(endpoint);
         const data = response.data;
         
         // キャッシュに保存
         const expiration = new Date(new Date().getTime() + this.CACHE_DURATION_MS);
         this.teamDataCache.set(cacheKey, { data, expiration });
         
         return data;
       } catch (error) {
         console.error(`チーム(${teamId})の${endpoint}データ取得に失敗:`, error);
         throw error;
       }
     }
     
     // チームIDが変更されたときにキャッシュを更新する
     invalidateTeamCache(teamId: string): void {
       // 指定チームに関連するすべてのキャッシュを削除
       for (const [key] of this.teamDataCache) {
         if (key.includes(`:${teamId}`)) {
           this.teamDataCache.delete(key);
         }
       }
     }
   }
   ```

3. **一貫したチーム選択UIコンポーネント**:
   ```typescript
   // TeamSelectorコンポーネントの改善
   const TeamSelector: React.FC = () => {
     const { teams, activeTeamId, setActiveTeamId, refreshTeams } = useContext(TeamContext);
     const [loading, setLoading] = useState(false);
     
     const handleTeamChange = async (teamId: string) => {
       if (teamId === activeTeamId) return;
       
       setLoading(true);
       try {
         await setActiveTeamId(teamId);
         // チーム変更を通知するイベントを発火
         window.dispatchEvent(new CustomEvent('team-context-changed', { detail: { teamId } }));
       } catch (error) {
         console.error('チーム変更エラー:', error);
       } finally {
         setLoading(false);
       }
     };
     
     return (
       <div className="team-selector">
         <label>チーム選択:</label>
         <select 
           value={activeTeamId || ''} 
           onChange={(e) => handleTeamChange(e.target.value)}
           disabled={loading || teams.length === 0}
         >
           {teams.length === 0 && (
             <option value="">チームなし</option>
           )}
           {teams.map(team => (
             <option key={team.id} value={team.id}>
               {team.name}
             </option>
           ))}
         </select>
         {loading && <span className="loading-indicator">読込中...</span>}
       </div>
     );
   };
   ```

4. **チーム変更イベントリスナー**:
   ```typescript
   // 各ページでのチーム変更リスナー実装
   useEffect(() => {
     // チーム変更イベントのリスナー
     const handleTeamChange = (e: CustomEvent) => {
       const { teamId } = e.detail;
       console.log('チームコンテキスト変更を検知:', teamId);
       
       // 必要なデータを再取得
       fetchTeamSpecificData(teamId);
     };
     
     // イベントリスナーの追加
     window.addEventListener('team-context-changed', handleTeamChange as EventListener);
     
     // クリーンアップ
     return () => {
       window.removeEventListener('team-context-changed', handleTeamChange as EventListener);
     };
   }, []);
   ```

これらの改善により、複数チームに所属した場合でも一貫したチーム選択体験と効率的なデータ更新が可能になります。チーム切り替え時のデータフローが最適化され、UXの向上とAPI呼び出しの削減が実現します。

## APIエンドポイント定義

サービス層の実装に加えて、必要なREST APIエンドポイントを明確に定義します。これにより、フロントエンドとバックエンドの連携がスムーズになります。

### 1. 友達関連エンドポイント

```typescript
// shared/index.ts - APIエンドポイント定義
export const FRIENDS = {
  SEARCH: '/api/v1/friends/search', // 友達検索
  GET_ALL: '/api/v1/friends', // 友達一覧取得
  GET_REQUESTS: '/api/v1/friends/requests', // 受信した友達リクエスト
  GET_SENT_REQUESTS: '/api/v1/friends/sent-requests', // 送信した友達リクエスト
  SEND_REQUEST: '/api/v1/friends/request', // 友達リクエスト送信
  ACCEPT_REQUEST: (id: string) => `/api/v1/friends/requests/${id}/accept`, // リクエスト承認
  REJECT_REQUEST: (id: string) => `/api/v1/friends/requests/${id}/reject`, // リクエスト拒否
  REMOVE: (id: string) => `/api/v1/friends/${id}`, // 友達関係削除
  COMPATIBILITY: (id: string) => `/api/v1/friends/${id}/compatibility`, // 相性スコア
}
```

### 2. チームメンバーシップエンドポイント

```typescript
// shared/index.ts - 更新版チームAPIエンドポイント
export const TEAMS = {
  // 既存のエンドポイント
  GET_ALL: '/api/v1/teams',
  GET_BY_ID: (id: string) => `/api/v1/teams/${id}`,
  CREATE: '/api/v1/teams',
  UPDATE: (id: string) => `/api/v1/teams/${id}`,
  DELETE: (id: string) => `/api/v1/teams/${id}`,
  
  // 新規エンドポイント
  GET_USER_TEAMS: '/api/v1/user/teams', // ユーザーの所属チーム一覧
  GET_MEMBERSHIPS: (teamId: string) => `/api/v1/teams/${teamId}/members`, // チームメンバー一覧
  ADD_MEMBER: (teamId: string) => `/api/v1/teams/${teamId}/members`, // メンバー追加
  ADD_MEMBER_FROM_FRIEND: (teamId: string) => `/api/v1/teams/${teamId}/members/friend`, // 友達をメンバーに追加
  UPDATE_MEMBER: (teamId: string, userId: string) => `/api/v1/teams/${teamId}/members/${userId}`, // メンバー情報更新
  REMOVE_MEMBER: (teamId: string, userId: string) => `/api/v1/teams/${teamId}/members/${userId}`, // メンバー削除
}
```

### 3. 招待管理エンドポイント

```typescript
// shared/index.ts - 招待関連エンドポイント
export const INVITATION = {
  CREATE: '/api/v1/invitations', // 招待作成
  GET_BY_CODE: (code: string) => `/api/v1/invitations/${code}`, // 招待コードで取得
  ACCEPT: (code: string) => `/api/v1/invitations/${code}/accept`, // 招待承諾
  REJECT: (code: string) => `/api/v1/invitations/${code}/reject`, // 招待拒否
  CANCEL: (id: string) => `/api/v1/invitations/${id}/cancel`, // 招待取り消し
  GET_PENDING: '/api/v1/invitations/pending', // 保留中の招待一覧
}
```

### 4. チーム目標エンドポイント

```typescript
// shared/index.ts - チーム目標API
export const TEAM_GOALS = {
  GET: (teamId: string) => `/api/v1/teams/${teamId}/goals`, // チーム目標一覧
  GET_LATEST: (teamId: string) => `/api/v1/teams/${teamId}/goals/latest`, // 最新のチーム目標
  CREATE: (teamId: string) => `/api/v1/teams/${teamId}/goals`, // チーム目標作成
  UPDATE: (teamId: string, goalId: string) => `/api/v1/teams/${teamId}/goals/${goalId}`, // 更新
  DELETE: (teamId: string, goalId: string) => `/api/v1/teams/${teamId}/goals/${goalId}`, // 削除
  GET_ADVICE: (teamId: string) => `/api/v1/teams/${teamId}/goals/advice`, // チーム目標アドバイス取得
}
```

### 5. APIコントローラ実装
バックエンド側では、これらのエンドポイントに対応する以下のコントローラを実装します：

1. **FriendshipController**: 友達関連の全APIエンドポイントを処理
2. **TeamMembershipController**: チームメンバーシップ管理の専用コントローラ
3. **InvitationController**: 招待管理の専用コントローラ
4. **TeamGoalController**: チーム目標専用コントローラ

これらのコントローラは対応するサービス層を利用し、必要なバリデーションとエラーハンドリングを行います。

## データモデル変更

### 1. Friendship（新規）モデル
```typescript
interface IFriendship {
  _id: mongoose.Types.ObjectId;
  userId1: mongoose.Types.ObjectId;
  userId2: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected'; // 承認状態
  requesterId: mongoose.Types.ObjectId; // リクエスト送信者
  compatibilityScore?: number; // 相性スコア（オプション - 表示時に計算可能）
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date; // 承認日
}

const friendshipSchema = new Schema<IFriendshipDocument>({
  userId1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  compatibilityScore: {
    type: Number,
    required: false
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 複合ユニーク制約 (userId1とuserId2のペアは一意)
friendshipSchema.index({ 
  userId1: 1, 
  userId2: 1 
}, { 
  unique: true 
});
```

### 2. TeamMembership（新規）モデル
```typescript
interface ITeamMembership {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  role: string;
  isAdmin: boolean;
  joinedAt: Date;
}

const teamMembershipSchema = new Schema<ITeamMembershipDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  role: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 複合ユニーク制約 (同一ユーザーが同一チームに複数回所属することはできない)
teamMembershipSchema.index({ userId: 1, teamId: 1 }, { unique: true });
```

### 3. User モデル変更
```typescript
// teamId フィールドの削除:
// teamId: {
//   type: Schema.Types.ObjectId,
//   ref: 'Team'
// },

// 代わりにGetterメソッドを追加
userSchema.methods.getTeams = async function() {
  const memberships = await TeamMembership.find({ userId: this._id });
  return memberships;
};

// 友達関係取得メソッドを追加
userSchema.methods.getFriends = async function() {
  const friendships = await Friendship.find({
    $or: [
      { userId1: this._id, status: 'accepted' },
      { userId2: this._id, status: 'accepted' }
    ]
  });
  
  return friendships.map(friendship => {
    const friendId = friendship.userId1.equals(this._id) ? 
      friendship.userId2 : friendship.userId1;
    return {
      friendshipId: friendship._id,
      friendId,
      createdAt: friendship.createdAt,
      acceptedAt: friendship.acceptedAt
    };
  });
};

// 友達リクエスト取得メソッド
userSchema.methods.getFriendRequests = async function() {
  return await Friendship.find({
    userId2: this._id,
    status: 'pending'
  }).populate('userId1', 'displayName email elementAttribute');
};

// 送信済みリクエスト取得メソッド
userSchema.methods.getSentRequests = async function() {
  return await Friendship.find({
    userId1: this._id,
    requesterId: this._id,
    status: 'pending'
  }).populate('userId2', 'displayName email elementAttribute');
};
```

### 4. Team モデル変更
```typescript
// adminId に加え、チーム作成者を記録
creatorId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true
},

// 管理者の配列追加（複数管理者をサポート）
administrators: [{
  type: Schema.Types.ObjectId,
  ref: 'User'
}],

// 招待コード（チーム招待用の一意のコード）
inviteCode: {
  type: String,
  unique: true,
  default: () => crypto.randomBytes(8).toString('hex')
}
```

### 5. InvitationLink（新規）モデル - 統合招待機能用
```typescript
interface IInvitationLink {
  _id: mongoose.Types.ObjectId;
  code: string; // 一意の招待コード
  teamId?: mongoose.Types.ObjectId; // チーム招待の場合、対象チームID
  inviterId: mongoose.Types.ObjectId; // 招待者ID
  email: string; // 招待先メールアドレス
  type: 'team' | 'friend'; // 招待タイプ（チーム招待 or 友達招待）
  role?: string; // チーム招待の場合の役割
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date; // 有効期限（例：7日間）
  createdAt: Date;
}

const invitationLinkSchema = new Schema<IInvitationLinkDocument>({
  code: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  },
  inviterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['team', 'friend'],
    required: true
  },
  role: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日間有効
  }
}, {
  timestamps: true
});
```

## サービス層変更

### 1. friendship.service.ts（新規）
```typescript
// 友達関連API
export const searchUsersByQuery = async (query: string, currentUserId: string) => {
  // ユーザー検索 (メールアドレス、名前などに基づく)
  const users = await User.find({
    $and: [
      { _id: { $ne: currentUserId } }, // 自分自身を除外
      {
        $or: [
          { email: new RegExp(query, 'i') },
          { displayName: new RegExp(query, 'i') }
        ]
      }
    ]
  }).select('displayName email elementAttribute');
  
  return users;
};

// 友達申請送信
export const sendFriendRequest = async (currentUserId: string, targetUserId: string) => {
  // 既存の友達関係をチェック
  const existingFriendship = await Friendship.findOne({
    $or: [
      { userId1: currentUserId, userId2: targetUserId },
      { userId1: targetUserId, userId2: currentUserId }
    ]
  });
  
  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new Error('既に友達関係が存在します');
    } else if (existingFriendship.status === 'pending') {
      if (existingFriendship.requesterId.toString() === currentUserId) {
        throw new Error('既に友達申請を送信済みです');
      } else {
        // 相手からの申請が来ている場合は承認
        existingFriendship.status = 'accepted';
        existingFriendship.acceptedAt = new Date();
        await existingFriendship.save();
        return existingFriendship;
      }
    } else if (existingFriendship.status === 'rejected') {
      // 拒否された申請を再送信
      existingFriendship.status = 'pending';
      existingFriendship.requesterId = new mongoose.Types.ObjectId(currentUserId);
      await existingFriendship.save();
      return existingFriendship;
    }
  }
  
  // 新規友達関係作成
  const friendship = await Friendship.create({
    userId1: currentUserId, 
    userId2: targetUserId,
    status: 'pending',
    requesterId: currentUserId
  });
  
  return friendship;
};

// 友達申請承認
export const acceptFriendRequest = async (friendshipId: string, currentUserId: string) => {
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    userId2: currentUserId,
    status: 'pending'
  });
  
  if (!friendship) {
    throw new Error('友達申請が見つかりません');
  }
  
  friendship.status = 'accepted';
  friendship.acceptedAt = new Date();
  await friendship.save();
  
  return friendship;
};

// 友達申請拒否
export const rejectFriendRequest = async (friendshipId: string, currentUserId: string) => {
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    userId2: currentUserId,
    status: 'pending'
  });
  
  if (!friendship) {
    throw new Error('友達申請が見つかりません');
  }
  
  friendship.status = 'rejected';
  await friendship.save();
  
  return friendship;
};

// 友達関係削除
export const removeFriend = async (friendshipId: string, currentUserId: string) => {
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    $or: [
      { userId1: currentUserId },
      { userId2: currentUserId }
    ],
    status: 'accepted'
  });
  
  if (!friendship) {
    throw new Error('友達関係が見つかりません');
  }
  
  await Friendship.deleteOne({ _id: friendshipId });
  
  return { success: true };
};

// 友達一覧取得
export const getFriends = async (userId: string) => {
  const friendships = await Friendship.find({
    $or: [
      { userId1: userId, status: 'accepted' },
      { userId2: userId, status: 'accepted' }
    ]
  });
  
  // 友達のIDを取得
  const friendIds = friendships.map(friendship => 
    friendship.userId1.toString() === userId ? 
      friendship.userId2 : friendship.userId1
  );
  
  // 友達の詳細情報を取得
  const friends = await User.find({
    _id: { $in: friendIds }
  }).select('displayName email elementAttribute');
  
  return friends.map(friend => {
    const friendship = friendships.find(f => 
      f.userId1.toString() === friend._id.toString() || 
      f.userId2.toString() === friend._id.toString()
    );
    
    return {
      friendship: friendship._id,
      userId: friend._id,
      displayName: friend.displayName,
      email: friend.email,
      elementAttribute: friend.elementAttribute,
      acceptedAt: friendship.acceptedAt
    };
  });
};

// 相性スコア取得
export const getCompatibilityScore = async (userId1: string, userId2: string) => {
  // 相性スコア計算ロジック (四柱推命情報に基づく)
  // 実際には両ユーザーの四柱推命情報を取得して、スコアを計算
  
  const user1Profile = await SajuProfile.findOne({ userId: userId1 });
  const user2Profile = await SajuProfile.findOne({ userId: userId2 });
  
  if (!user1Profile || !user2Profile) {
    throw new Error('四柱推命プロフィールが見つかりません');
  }
  
  // ここで相性計算ロジックを実装（既存のロジックを利用）
  // 実装済みの相性スコア計算ロジックを呼び出す
  const compatibilityScore = await calculateCompatibilityScore(user1Profile, user2Profile);
  
  // 友達関係にスコアを保存（オプション）
  const friendship = await Friendship.findOne({
    $or: [
      { userId1: userId1, userId2: userId2, status: 'accepted' },
      { userId1: userId2, userId2: userId1, status: 'accepted' }
    ]
  });
  
  if (friendship) {
    friendship.compatibilityScore = compatibilityScore.score;
    await friendship.save();
  }
  
  return compatibilityScore;
};
```

### 2. team-member.service.ts（更新）
```typescript
// チームメンバー関連API（更新版）

// 友達からメンバーを追加
export const addMemberFromFriend = async (teamId: string, friendId: string, role: string, isAdmin = false) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 友達の存在確認
  const user = await User.findById(friendId);
  if (!user) {
    throw new NotFoundError('友達が見つかりません');
  }

  // 友達関係を確認
  const friendship = await Friendship.findOne({
    $or: [
      { userId1: teamId, userId2: friendId, status: 'accepted' },
      { userId1: friendId, userId2: teamId, status: 'accepted' }
    ]
  });

  if (!friendship) {
    throw new BadRequestError('友達関係が確認できませんでした');
  }

  // ユーザーがすでにメンバーでないか確認
  const existingMembership = await TeamMembership.findOne({
    teamId,
    userId: friendId
  });

  if (existingMembership) {
    // 既にメンバーの場合は役割だけ更新
    existingMembership.role = role || existingMembership.role;
    existingMembership.isAdmin = isAdmin;
    await existingMembership.save();
    return existingMembership;
  }

  // 新規メンバーシップ作成
  const membership = await TeamMembership.create({
    teamId,
    userId: friendId,
    role: role || '',
    isAdmin
  });

  return membership;
};

// メールで招待
export const inviteUserByEmail = async (teamId: string, email: string, role: string, inviterId: string) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  // 招待者の存在確認
  const inviter = await User.findById(inviterId);
  if (!inviter) {
    throw new NotFoundError('招待者情報が見つかりません');
  }

  // 既存ユーザーか確認
  const existingUser = await User.findOne({ email });

  // 招待リンク作成
  const invitation = await InvitationLink.create({
    teamId,
    inviterId,
    email,
    type: 'team',
    role,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日間有効
  });

  // メール送信ロジック（実際にはメール送信サービスを利用）
  // EmailService.sendTeamInvitation(email, invitation.code, inviter.displayName, team.name);

  return {
    invitationCode: invitation.code,
    existingUser: !!existingUser
  };
};

// チームメンバーの相互友達関係確立
export const establishTeamFriendships = async (teamId: string, newMemberId: string) => {
  // チームメンバー全員を取得（新メンバーを除く）
  const memberships = await TeamMembership.find({
    teamId,
    userId: { $ne: newMemberId }
  });

  const memberIds = memberships.map(m => m.userId);

  // 各メンバーと新メンバーの間に友達関係を作成
  const friendshipPromises = memberIds.map(async (memberId) => {
    // 既存の友達関係をチェック
    const existingFriendship = await Friendship.findOne({
      $or: [
        { userId1: memberId, userId2: newMemberId },
        { userId1: newMemberId, userId2: memberId }
      ]
    });

    // 既存の友達関係がなければ作成
    if (!existingFriendship) {
      return Friendship.create({
        userId1: memberId,
        userId2: newMemberId,
        status: 'accepted', // 自動承認
        requesterId: memberId, // チームオーナーをリクエスターとする
        acceptedAt: new Date()
      });
    }

    // 既存の友達関係がpendingなら承認
    if (existingFriendship.status === 'pending') {
      existingFriendship.status = 'accepted';
      existingFriendship.acceptedAt = new Date();
      return existingFriendship.save();
    }

    return existingFriendship;
  });

  await Promise.all(friendshipPromises);
  return { success: true, friendshipsCreated: friendshipPromises.length };
};
```

### 3. invitation.service.ts（新規）
```typescript
// 招待処理サービス
export const processInvitation = async (invitationCode: string, currentUserId?: string) => {
  // 招待コードを検証
  const invitation = await InvitationLink.findOne({
    code: invitationCode,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
  
  if (!invitation) {
    throw new NotFoundError('無効な招待コードか、期限切れです');
  }
  
  // 招待者情報
  const inviter = await User.findById(invitation.inviterId);
  if (!inviter) {
    throw new NotFoundError('招待者情報が見つかりません');
  }
  
  // 未ログインの場合、情報を返すのみ
  if (!currentUserId) {
    return {
      type: invitation.type,
      inviter: {
        id: inviter._id,
        displayName: inviter.displayName
      },
      email: invitation.email,
      team: invitation.teamId ? await Team.findById(invitation.teamId) : null,
      requiresRegistration: true
    };
  }
  
  // ログイン済みユーザーの処理
  const user = await User.findById(currentUserId);
  
  // 招待先メールと一致するか確認
  if (user.email !== invitation.email) {
    throw new BadRequestError('招待されたメールアドレスとログインユーザーが一致しません');
  }
  
  // 招待タイプに応じた処理
  if (invitation.type === 'friend') {
    // 友達関係の作成
    await Friendship.findOneAndUpdate(
      {
        $or: [
          { userId1: invitation.inviterId, userId2: currentUserId },
          { userId1: currentUserId, userId2: invitation.inviterId }
        ]
      },
      {
        userId1: invitation.inviterId,
        userId2: currentUserId,
        status: 'accepted',
        requesterId: invitation.inviterId,
        acceptedAt: new Date()
      },
      { upsert: true, new: true }
    );
  } else if (invitation.type === 'team') {
    // チームへの追加
    const team = await Team.findById(invitation.teamId);
    if (!team) {
      throw new NotFoundError('チームが見つかりません');
    }
    
    // チームメンバーシップ作成
    await TeamMembership.findOneAndUpdate(
      { teamId: invitation.teamId, userId: currentUserId },
      {
        teamId: invitation.teamId,
        userId: currentUserId,
        role: invitation.role || '',
        isAdmin: false,
        joinedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    // チームメンバー間の相互友達関係確立
    await establishTeamFriendships(invitation.teamId.toString(), currentUserId);
  }
  
  // 招待ステータス更新
  invitation.status = 'accepted';
  await invitation.save();
  
  return {
    success: true,
    type: invitation.type,
    team: invitation.teamId ? await Team.findById(invitation.teamId) : null
  };
};
```

## フロントエンド変更

### 1. 友達リスト画面（新規）
```typescript
// FriendList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Tabs, Tab, TextField, Button, 
  List, ListItem, ListItemAvatar, ListItemText, 
  Avatar, Badge, IconButton, Paper, Divider, Chip 
} from '@mui/material';
import { Search, Add, MoreVert, Check, Close } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import friendService from '../../services/friend.service';

const FriendList: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 友達リスト取得
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await friendService.getFriends();
        setFriends(data);
      } catch (error) {
        console.error('友達一覧の取得に失敗しました', error);
      }
    };
    
    const fetchRequests = async () => {
      try {
        const data = await friendService.getFriendRequests();
        setRequests(data);
      } catch (error) {
        console.error('友達リクエストの取得に失敗しました', error);
      }
    };
    
    const fetchSentRequests = async () => {
      try {
        const data = await friendService.getSentRequests();
        setSentRequests(data);
      } catch (error) {
        console.error('送信済みリクエストの取得に失敗しました', error);
      }
    };
    
    fetchFriends();
    fetchRequests();
    fetchSentRequests();
  }, [currentUser]);
  
  // 友達検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await friendService.searchUsers(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('ユーザー検索に失敗しました', error);
    }
  };
  
  // 友達申請送信
  const handleSendRequest = async (userId) => {
    try {
      await friendService.sendFriendRequest(userId);
      
      // 送信済みリクエスト更新
      const updatedSentRequests = await friendService.getSentRequests();
      setSentRequests(updatedSentRequests);
      
      // 検索結果から送信済みユーザーを除外
      setSearchResults(searchResults.filter(user => user._id !== userId));
    } catch (error) {
      console.error('友達申請の送信に失敗しました', error);
    }
  };
  
  // 友達申請承認
  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendService.acceptFriendRequest(friendshipId);
      
      // リスト更新
      const updatedRequests = await friendService.getFriendRequests();
      setRequests(updatedRequests);
      
      const updatedFriends = await friendService.getFriends();
      setFriends(updatedFriends);
    } catch (error) {
      console.error('友達申請の承認に失敗しました', error);
    }
  };
  
  // 友達申請拒否
  const handleRejectRequest = async (friendshipId) => {
    try {
      await friendService.rejectFriendRequest(friendshipId);
      
      // リスト更新
      const updatedRequests = await friendService.getFriendRequests();
      setRequests(updatedRequests);
    } catch (error) {
      console.error('友達申請の拒否に失敗しました', error);
    }
  };
  
  // 友達削除
  const handleRemoveFriend = async (friendshipId) => {
    if (!window.confirm('この友達を削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await friendService.removeFriend(friendshipId);
      
      // 友達リスト更新
      const updatedFriends = await friendService.getFriends();
      setFriends(updatedFriends);
    } catch (error) {
      console.error('友達の削除に失敗しました', error);
    }
  };
  
  // アプリ招待機能
  const handleInviteToApp = () => {
    // アプリ招待モーダル表示
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>友達</Typography>
      
      {/* 検索・アクションバー */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          placeholder="友達を検索"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mr: 1 }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSearch}
          sx={{ minWidth: 40, p: 1 }}
        >
          <Search />
        </Button>
      </Box>
      
      {/* アクションバー */}
      <Box sx={{ display: 'flex', mb: 3, gap: 1 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => setShowSearchResults(true)}
          startIcon={<Add />}
          sx={{ flex: 1 }}
        >
          友達を探す
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleInviteToApp}
          sx={{ flex: 1 }}
        >
          アプリに招待
        </Button>
      </Box>
      
      {/* 検索結果表示 */}
      {showSearchResults && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">検索結果</Typography>
            <IconButton onClick={() => setShowSearchResults(false)} size="small">
              <Close />
            </IconButton>
          </Box>
          
          {searchResults.length > 0 ? (
            <List>
              {searchResults.map((user) => (
                <ListItem
                  key={user._id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleSendRequest(user._id)}
                      startIcon={<Add />}
                    >
                      友達申請
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: user.elementAttribute ? 
                          `var(--element-${user.elementAttribute}-bg)` : 'grey.300' 
                      }}
                    >
                      {user.displayName ? user.displayName.charAt(0) : '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.displayName} 
                    secondary={user.email} 
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              検索結果がありません
            </Typography>
          )}
        </Paper>
      )}
      
      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="友達" />
          <Tab 
            label="リクエスト" 
            icon={requests.length > 0 ? <Badge color="error" badgeContent={requests.length} /> : null}
            iconPosition="end"
          />
        </Tabs>
      </Box>
      
      {/* 友達リスト */}
      {activeTab === 0 && (
        <Box sx={{ mt: 2 }}>
          {friends.length > 0 ? (
            <List>
              {friends.map((friend) => (
                <Paper key={friend.userId} sx={{ mb: 2, overflow: 'hidden' }}>
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end">
                        <MoreVert />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: friend.elementAttribute ? 
                            `var(--element-${friend.elementAttribute}-bg)` : 'grey.300',
                          color: friend.elementAttribute ? 
                            `var(--element-${friend.elementAttribute}-dark)` : 'grey.800'
                        }}
                      >
                        {friend.displayName ? friend.displayName.charAt(0) : '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={friend.displayName}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          {friend.elementAttribute && (
                            <Chip 
                              label={
                                friend.elementAttribute === 'wood' ? '木' :
                                friend.elementAttribute === 'fire' ? '火' :
                                friend.elementAttribute === 'earth' ? '土' :
                                friend.elementAttribute === 'metal' ? '金' :
                                friend.elementAttribute === 'water' ? '水' : ''
                              }
                              size="small"
                              sx={{ 
                                bgcolor: `var(--element-${friend.elementAttribute}-bg)`,
                                color: `var(--element-${friend.elementAttribute}-dark)`,
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {new Date(friend.acceptedAt).toLocaleDateString()}に追加
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                  <Box sx={{ display: 'flex', p: 1 }}>
                    <Button 
                      size="small" 
                      sx={{ flex: 1 }}
                      onClick={() => window.location.href = `/profile/${friend.userId}`}
                    >
                      プロフィール
                    </Button>
                    <Button 
                      size="small" 
                      color="primary" 
                      sx={{ flex: 1 }}
                      onClick={() => window.location.href = `/compatibility/${friend.userId}`}
                    >
                      相性を見る
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      sx={{ flex: 1 }}
                      onClick={() => handleRemoveFriend(friend.friendship)}
                    >
                      削除
                    </Button>
                  </Box>
                </Paper>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', p: 5, color: 'text.secondary' }}>
              <Typography gutterBottom>まだ友達がいません</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setShowSearchResults(true)}
                startIcon={<Add />}
                sx={{ mt: 2 }}
              >
                友達を探す
              </Button>
            </Box>
          )}
        </Box>
      )}
      
      {/* リクエストタブ */}
      {activeTab === 1 && (
        <Box sx={{ mt: 2 }}>
          {/* 受信したリクエスト */}
          {requests.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, pl: 2 }}>
                受信したリクエスト
              </Typography>
              <List>
                {requests.map((request) => (
                  <Paper key={request._id} sx={{ mb: 2 }}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: request.userId1.elementAttribute ? 
                              `var(--element-${request.userId1.elementAttribute}-bg)` : 'grey.300' 
                          }}
                        >
                          {request.userId1.displayName ? request.userId1.displayName.charAt(0) : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={request.userId1.displayName}
                        secondary={new Date(request.createdAt).toLocaleDateString()}
                      />
                    </ListItem>
                    <Divider />
                    <Box sx={{ display: 'flex', p: 1 }}>
                      <Button 
                        size="small" 
                        color="primary" 
                        variant="contained"
                        startIcon={<Check />}
                        sx={{ flex: 1, mr: 1 }}
                        onClick={() => handleAcceptRequest(request._id)}
                      >
                        承認
                      </Button>
                      <Button 
                        size="small" 
                        color="inherit"
                        variant="outlined"
                        startIcon={<Close />}
                        sx={{ flex: 1 }}
                        onClick={() => handleRejectRequest(request._id)}
                      >
                        拒否
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </List>
            </>
          )}
          
          {/* 送信したリクエスト */}
          {sentRequests.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, pl: 2, mt: 3 }}>
                送信したリクエスト
              </Typography>
              <List>
                {sentRequests.map((request) => (
                  <Paper key={request._id} sx={{ mb: 2, bgcolor: 'action.hover' }}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: request.userId2.elementAttribute ? 
                              `var(--element-${request.userId2.elementAttribute}-bg)` : 'grey.300' 
                          }}
                        >
                          {request.userId2.displayName ? request.userId2.displayName.charAt(0) : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={request.userId2.displayName}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Badge color="primary" variant="dot" sx={{ mr: 1 }} />
                              <Typography variant="body2" component="span" color="primary">
                                承認待ち
                              </Typography>
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            </>
          )}
          
          {/* リクエストなしの場合 */}
          {requests.length === 0 && sentRequests.length === 0 && (
            <Box sx={{ textAlign: 'center', p: 5, color: 'text.secondary' }}>
              <Typography>友達リクエストはありません</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FriendList;
```

### 2. チームメンバー追加モーダル（更新）
```typescript
// TeamMemberAddModal.tsx（新規）
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Modal, Tabs, Tab, TextField, Button, 
  List, ListItem, ListItemAvatar, ListItemText, 
  Avatar, IconButton, Paper, CircularProgress 
} from '@mui/material';
import { Close, Search, ContentCopy, PersonAdd } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import friendService from '../../services/friend.service';
import teamService from '../../services/team.service';

interface TeamMemberAddModalProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

const TeamMemberAddModal: React.FC<TeamMemberAddModalProps> = ({
  teamId,
  open,
  onClose,
  onMemberAdded
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 招待関連の状態
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteResult, setShowInviteResult] = useState(false);
  
  // 友達選択関連の状態
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendRole, setFriendRole] = useState('');
  
  // 友達リスト取得
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await friendService.getFriends();
        
        // チームメンバーでない友達のみをフィルタリング
        const teamMembers = await teamService.getTeamMembers(teamId);
        const teamMemberIds = teamMembers.map(member => member.userId);
        
        const availableFriends = data.filter(friend => 
          !teamMemberIds.includes(friend.userId)
        );
        
        setFriends(availableFriends);
        setError(null);
      } catch (err) {
        console.error('友達リストの取得に失敗しました', err);
        setError('友達リストの取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchFriends();
    }
  }, [open, teamId]);
  
  // 友達リストからメンバー追加
  const handleAddFriendAsMember = async () => {
    if (!selectedFriend || !friendRole) {
      return;
    }
    
    try {
      setLoading(true);
      await teamService.addMemberFromFriend(teamId, selectedFriend, friendRole);
      
      // 成功後の処理
      onMemberAdded();
      onClose();
      setError(null);
      
      // 状態リセット
      setSelectedFriend(null);
      setFriendRole('');
    } catch (err) {
      console.error(`Failed to add friend as team member: ${selectedFriend}`, err);
      setError('メンバーの追加に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  // メールで招待
  const handleInviteByEmail = async () => {
    if (!email || !role) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await teamService.inviteUserByEmail(teamId, email, role, currentUser.uid);
      
      // 招待結果を表示
      setInviteCode(result.invitationCode);
      setInviteLink(`${window.location.origin}/invitation/${result.invitationCode}`);
      setShowInviteResult(true);
      setError(null);
    } catch (err) {
      console.error('Failed to send invitation', err);
      setError('招待の送信に失敗しました。メールアドレスを確認してください。');
    } finally {
      setLoading(false);
    }
  };
  
  // 招待リンクをクリップボードにコピー
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // コピー成功の通知を表示
  };
  
  // モーダルを閉じる際に状態をリセット
  const handleModalClose = () => {
    setActiveTab(0);
    setSelectedFriend(null);
    setFriendRole('');
    setEmail('');
    setRole('');
    setInviteCode('');
    setInviteLink('');
    setShowInviteResult(false);
    setError(null);
    onClose();
  };
  
  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      aria-labelledby="team-member-add-modal"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 500 },
        maxHeight: '80vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography id="team-member-add-modal" variant="h6">
            メンバーを追加
          </Typography>
          <IconButton onClick={handleModalClose} size="small">
            <Close />
          </IconButton>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="友達から選択" />
          <Tab label="招待を送信" />
        </Tabs>
        
        <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
          {error && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: 'error.light', 
                color: 'error.dark'
              }}
            >
              {error}
            </Paper>
          )}
          
          {/* 友達から選択タブ */}
          {activeTab === 0 && (
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : friends.length > 0 ? (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    友達を選択してチームに追加
                  </Typography>
                  <List>
                    {friends.map(friend => (
                      <Paper 
                        key={friend.userId} 
                        elevation={selectedFriend === friend.userId ? 3 : 1}
                        sx={{ 
                          mb: 2, 
                          borderRadius: 1,
                          border: selectedFriend === friend.userId ? 
                            '2px solid var(--primary-color)' : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedFriend(friend.userId)}
                      >
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: friend.elementAttribute ? 
                                  `var(--element-${friend.elementAttribute}-bg)` : 'grey.300',
                                color: friend.elementAttribute ? 
                                  `var(--element-${friend.elementAttribute}-dark)` : 'text.primary'
                              }}
                            >
                              {friend.displayName ? friend.displayName.charAt(0) : '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={friend.displayName} 
                            secondary={friend.email} 
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                  
                  {selectedFriend && (
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        label="役割（必須）"
                        fullWidth
                        value={friendRole}
                        onChange={(e) => setFriendRole(e.target.value)}
                        placeholder="エンジニア、デザイナー、マネージャーなど"
                        margin="normal"
                        required
                      />
                      
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={!friendRole.trim() || loading}
                        onClick={handleAddFriendAsMember}
                        startIcon={<PersonAdd />}
                        sx={{ mt: 2 }}
                      >
                        チームに追加
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Typography color="text.secondary" gutterBottom>
                    追加可能な友達がいません
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveTab(1)}
                    sx={{ mt: 2 }}
                  >
                    招待を送信する
                  </Button>
                </Box>
              )}
            </Box>
          )}
          
          {/* 招待送信タブ */}
          {activeTab === 1 && (
            <Box>
              {showInviteResult ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    招待を送信しました
                  </Typography>
                  
                  <Paper sx={{ p: 2, mt: 2, mb: 3, bgcolor: 'action.hover' }}>
                    <Typography variant="body2" gutterBottom>
                      以下のリンクを共有して招待することができます:
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mt: 1,
                      p: 1,
                      bgcolor: 'background.paper',
                      borderRadius: 1
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          flex: 1, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          mr: 1
                        }}
                      >
                        {inviteLink}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={handleCopyInviteLink}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  </Paper>
                  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowInviteResult(false);
                      setEmail('');
                      setRole('');
                    }}
                  >
                    別の招待を送信
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    メールアドレスで招待
                  </Typography>
                  
                  <TextField
                    label="メールアドレス（必須）"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                  />
                  
                  <TextField
                    label="役割（必須）"
                    fullWidth
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="エンジニア、デザイナー、マネージャーなど"
                    margin="normal"
                    required
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!email.trim() || !role.trim() || loading}
                    onClick={handleInviteByEmail}
                    sx={{ mt: 3 }}
                  >
                    招待を送信
                  </Button>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default TeamMemberAddModal;
```

### 3. チームメンバーリスト更新（既存更新）
```typescript
// TeamMembersList.tsxの更新部分

// インポート部分に追加
import TeamMemberAddModal from './TeamMemberAddModal';

// TeamMembersListコンポーネント内に追加
const [showAddModal, setShowAddModal] = useState<boolean>(false);

// メンバー追加ボタン部分を変更
<div style={{
  // ... 既存のスタイル維持
  // ボタンクリックでフォーム表示ではなくモーダル表示に変更
}}
onClick={() => setShowAddModal(true)}
disabled={loading}
>
  {/* 既存の内容維持 */}
</div>

// 既存のメンバー追加フォームをコメントアウトし、代わりにモーダルを表示
{/* メンバー追加モーダル */}
<TeamMemberAddModal
  teamId={teamId}
  open={showAddModal}
  onClose={() => setShowAddModal(false)}
  onMemberAdded={() => {
    // メンバー一覧を再取得
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await teamService.getTeamMembers(teamId);
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch team members after adding: ${err}`);
        setError('メンバー一覧の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }}
/>
```

## 招待処理・友達機能フロー

1. **友達追加フロー**:
   - ユーザーが友達検索またはリンク共有から友達追加をリクエスト
   - 相互承認フローで友達関係確立
   - 友達間で相性診断・プロフィール閲覧可能

2. **チームメンバー追加フロー**:
   - 友達リストから選択してチームに追加（即時追加）
   - または招待リンクで未登録含めたユーザーを招待
   - 招待受諾時に自動的に相互友達関係を確立

3. **チームメンバー間の友達関係**:
   - チームに新規メンバーが加入すると、全メンバーと相互友達関係を自動確立
   - 承認不要で自動的に処理（チーム参加の承認が間接的な友達承認）

## マイグレーション戦略

1. **データモデルの作成**:
   - 新規モデル（Friendship, TeamMembership, InvitationLink）を作成
   - 既存のUser, Teamモデルを更新

2. **既存データの移行**:
   - ユーザーのteamId情報からTeamMembershipレコードを生成するマイグレーションスクリプト

3. **実装ステップ**:
   - フェーズ1: バックエンド更新（モデル、サービス層）
   - フェーズ2: UI/UX実装（友達リスト画面、チームメンバー追加UI更新）
   - フェーズ3: フローテスト（友達申請、招待、チームメンバー追加）

## 実装ステップ詳細

1. **バックエンドデータモデル実装**
   - 新規モデル作成
   - サービス層実装
   - APIエンドポイント実装

2. **友達機能UIの実装**
   - 友達リスト画面
   - 友達検索・申請機能
   - 相性表示機能

3. **チームメンバー追加UI更新**
   - 友達からメンバー選択機能
   - 招待リンク機能

4. **招待リンク処理フロー実装**
   - 招待リンク生成API
   - 招待受諾処理
   - 新規登録との連携

5. **テストとデバッグ**
   - 単体テスト
   - E2Eテスト
   - エッジケース対応