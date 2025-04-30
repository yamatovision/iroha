# 美容クライアントチャット UI設計書

## 概要

美容クライアントチャットは、美容師が特定のクライアント（お客様）に対して、四柱推命情報に基づいたパーソナライズされた美容アドバイスを提供するためのチャットインターフェースです。このドキュメントでは、UIの設計詳細と実装ガイドラインを提供します。

## 画面構成

美容クライアントチャットのUIは以下の主要セクションで構成されます：

### 1. ヘッダーセクション
- クライアント情報表示
- 戻るボタン
- メニューアクションボタン

### 2. メッセージリストセクション
- チャット履歴表示
- 提案カード表示（スタイリング、カラーなど）

### 3. 入力セクション
- テキスト入力フィールド
- 音声入力ボタン
- 送信ボタン

### 4. クライアント情報サイドパネル（オプション）
- 四柱推命情報の要約
- 訪問履歴
- メモ

## デザイン仕様

### カラースキーム

```
プライマリカラー: #e091e4 (パステルパープル)
プライマリライト: #f8c0fb (薄いピンク)
プライマリダーク: #c26ac7 (濃いパープル)
背景色: #f8f8f8 (薄いグレー)
テキスト（プライマリ）: rgba(0, 0, 0, 0.87)
テキスト（セカンダリ）: rgba(0, 0, 0, 0.54)
白: #ffffff
グレー100: #f5f5f5
グレー200: #eeeeee
グレー300: #e0e0e0
グレー800: #424242
黒: #212121
```

### タイポグラフィ

```
フォントファミリー: 'Roboto', sans-serif
ヘッダータイトル: 1.2rem, font-weight: 500
メッセージテキスト: 0.95rem, line-height: 1.5
提案カードタイトル: 0.9rem, font-weight: 500
提案カード内容: 0.85rem
タイムスタンプ: 0.7rem
入力フィールド: 0.95rem
```

### 境界と間隔

```
ボーダーラジウス: 8px
ボックスシャドウ: 0 2px 4px rgba(0,0,0,0.1)
メッセージ間隔: 24px
セクション間パディング: 16px
```

## コンポーネント詳細

### 1. ヘッダーコンポーネント

ヘッダーは固定位置で表示され、以下の要素で構成されます：

```jsx
<div className="header">
  <div className="header-left">
    <div className="header-back">
      <span className="material-icons">arrow_back</span>
    </div>
    <img src="client-avatar.jpg" alt="Client" className="client-avatar" />
    <div className="header-title">クライアント名</div>
  </div>
  <div className="header-right">
    <span className="material-icons header-icon">more_vert</span>
  </div>
</div>
```

**スタイル仕様**:
- 背景：linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)
- 高さ：60px
- アバター：円形、36px × 36px、白枠2px
- アイコン色：白

### 2. メッセージリストコンポーネント

メッセージリストはスクロール可能な領域で、異なるメッセージタイプが表示されます。

#### 2.1 ユーザーメッセージ（美容師からの質問・コメント）

```jsx
<div className="user-message">
  <div className="user-bubble">
    クライアントに似合うヘアスタイルを教えてください
  </div>
  <div className="message-time">14:25</div>
</div>
```

**スタイル仕様**:
- 位置：右寄せ（align-self: flex-end）
- 背景：linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)
- テキスト色：白
- ボーダーラジウス：18px, border-top-right-radius: 4px（吹き出し形状）
- 最大幅：画面の75%（小さいデバイスでは85%）

#### 2.2 AI応答メッセージ

```jsx
<div className="ai-response">
  <p>クライアントの四柱推命情報と五行バランスを分析すると、「木」の気が強く、「火」の気がやや弱い傾向にあります。このバランスを考慮すると以下のようなヘアスタイルがおすすめです。</p>
  
  <div className="style-suggestion">
    <div className="suggestion-title">
      <span className="material-icons suggestion-icon">content_cut</span>
      おすすめヘアスタイル
    </div>
    <div className="suggestion-content">
      <p><strong>カット：</strong> ミディアムレイヤー（鎖骨ラインで、表面に軽さを出すレイヤー）</p>
      <p><strong>特徴：</strong> 前髪は長めのサイドパート、顔まわりは小顔効果のある流し前髪</p>
      <p><strong>スタイリング：</strong> 乾かすだけで決まる簡単スタイル</p>
    </div>
  </div>
  
  <p>このスタイルは、木の気質を持つクライアントの活発なエネルギーと相性が良く、また火の要素を強調することで五行のバランスを整えます。</p>
</div>
```

**スタイル仕様**:
- 位置：左寄せ
- 背景：透明（枠なし）
- テキスト色：var(--text-primary)
- 段落間マージン：16px

#### 2.3 スタイル提案カード

```jsx
<div className="style-suggestion">
  <div className="suggestion-title">
    <span className="material-icons suggestion-icon">auto_awesome</span>
    おすすめカラー
  </div>
  <div className="suggestion-content">
    <p><strong>ベースカラー：</strong> 明るめの温かみのあるカラー（アプリコットブラウン、ハニーゴールド）</p>
    <p><strong>ハイライト：</strong> キャラメルやコッパーのハイライトを入れることで、さらに火の気を強調</p>
    <p><strong>理由：</strong> 火の気を補うことで、クライアントの持つ木のエネルギーとバランスが取れます</p>
  </div>
</div>
```

**スタイル仕様**:
- 背景：var(--gray-100)
- 左ボーダー：3px solid var(--primary-light)
- ボーダーラジウス：var(--border-radius)
- タイトル色：var(--primary-dark)
- アイコン色：var(--primary)
- マージン：12px 0 16px 0

#### 2.4 チェックリスト

```jsx
<ul className="check-list">
  <li>パーマ持続性を高めるために、施術前のトリートメントがおすすめです</li>
  <li>ホームケアには木製ブラシの使用が五行バランスに効果的です</li>
  <li>洗い流さないトリートメントを毛先に使うことで、まとまりやすくなります</li>
</ul>
```

**スタイル仕様**:
- リスト形式：list-style: none
- チェックマーク：before疑似要素で「✓」を表示
- チェックマーク色：var(--primary)
- 項目間マージン：12px

### 3. 入力フォームコンポーネント

```jsx
<div className="input-container">
  <div className="input-wrapper">
    <textarea className="input-field" placeholder="メッセージを入力..." rows="1"></textarea>
    <div className="input-actions">
      <button className="mic-btn">
        <span className="material-icons">mic</span>
      </button>
      <button className="send-btn">
        <span className="material-icons">send</span>
      </button>
    </div>
  </div>
</div>
```

**スタイル仕様**:
- 位置：画面下部に固定
- 背景：白
- 入力フィールド：ボーダーラジウス 24px、パディング 12px
- 送信ボタン：円形、背景色 var(--primary)、アイコン色 白
- マイクボタン：円形、背景色 透明、アイコン色 var(--text-secondary)
- アクティブ状態のマイクボタン：背景色 #f44336（赤）、アイコン色 白

### 4. クライアント情報サイドパネル

```jsx
<div className="client-info-panel">
  <div className="client-info-header">
    <h2>クライアント情報</h2>
  </div>
  
  <div className="saju-summary">
    <h3>四柱推命情報</h3>
    <div className="element-balance">
      <div className="element-item" style={{ flex: clientData.elementProfile.wood }}>木</div>
      <div className="element-item" style={{ flex: clientData.elementProfile.fire }}>火</div>
      <div className="element-item" style={{ flex: clientData.elementProfile.earth }}>土</div>
      <div className="element-item" style={{ flex: clientData.elementProfile.metal }}>金</div>
      <div className="element-item" style={{ flex: clientData.elementProfile.water }}>水</div>
    </div>
    <p><strong>主要五行:</strong> {clientData.elementProfile.mainElement}</p>
    <p><strong>格局:</strong> {clientData.kakukyoku?.type}</p>
    <p><strong>用神:</strong> {clientData.yojin?.tenGod} ({clientData.yojin?.element})</p>
  </div>
  
  <div className="today-energy">
    <h3>今日の日柱エネルギー</h3>
    <p>{dayPillar.energyDescription}</p>
  </div>
  
  <div className="visit-history">
    <h3>来店履歴</h3>
    <ul className="history-list">
      {visitHistory.map(visit => (
        <li key={visit.date}>
          <div className="visit-date">{formatDate(visit.date)}</div>
          <div className="visit-service">{visit.serviceType}</div>
          {visit.notes && <div className="visit-note">{visit.notes}</div>}
        </li>
      ))}
    </ul>
  </div>
</div>
```

**スタイル仕様**:
- 位置：画面右側（デスクトップ）または隠れパネル（モバイル）
- 幅：280px（デスクトップ）、100%（モバイル）
- 背景：白
- ボーダー：左側 1px solid var(--gray-300)
- セクション間マージン：24px
- 五行バランス：色付きのフレックスアイテム（木=緑、火=赤、土=黄、金=白、水=青）

## レスポンシブデザイン

### モバイル（〜600px）

- クライアント情報サイドパネルは非表示（アイコンタップで表示）
- メッセージの最大幅を85%に拡大
- 入力エリアのパディングを縮小
- ヘッダーコンポーネントの高さとパディングを調整

### タブレット（601px〜960px）

- デフォルトで標準レイアウト
- 画面サイズに応じてメッセージの最大幅を調整
- クライアント情報サイドパネルはオプションで表示/非表示

### デスクトップ（961px〜）

- クライアント情報サイドパネルはデフォルトで表示
- 全体的なパディングとマージンを拡大
- より広いメッセージリスト表示領域

## アニメーションとトランジション

### 1. メッセージ表示アニメーション

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease forwards;
}
```

### 2. ストリーミングレスポンス表示

AI応答が文字単位でストリーミング表示される場合の視覚効果：

```jsx
// 擬似コード
const [streamingText, setStreamingText] = useState('');

// 新しいチャンクが到着するたびに更新
useEffect(() => {
  if (newChunk) {
    setStreamingText(prev => prev + newChunk);
  }
}, [newChunk]);

return (
  <div className="ai-response">
    <p>{streamingText}</p>
  </div>
);
```

### 3. 入力フィールドの高さ自動調整

```javascript
const textarea = document.querySelector('.input-field');
textarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  
  // 最大高さを制限
  if (this.scrollHeight > 100) {
    this.style.overflowY = 'auto';
  } else {
    this.style.overflowY = 'hidden';
  }
});
```

### 4. マイク状態のトランジション

```css
.mic-btn {
  transition: background-color 0.3s ease, color 0.3s ease;
}

.mic-btn.active {
  background-color: #f44336;
  color: white;
}
```

## 状態管理と表示ロジック

### 1. チャット読み込み状態

```jsx
// 読み込み中の状態表示
{isLoading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
    <CircularProgress size={24} />
  </Box>
)}

// 初期メッセージ表示
{messages.length === 0 && !isLoading && (
  <div className="empty-chat-message">
    <p>クライアント情報に基づいた美容提案ができます。メッセージを送信してください。</p>
  </div>
)}
```

### 2. メッセージ送信状態

```jsx
// 送信中の表示
{isSending && (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
)}

// 送信ボタンの状態
<button 
  className="send-btn" 
  disabled={isLoading || isSending || !message.trim()}
>
  <span className="material-icons">send</span>
</button>
```

### 3. 提案カード表示ロジック

```jsx
// AI応答内の特定パターンを検出して構造化表示に変換
function formatAIResponse(text) {
  // スタイル提案パターンを検出（例: 「# おすすめヘアスタイル」）
  const styleMatch = text.match(/#+\s+おすすめヘアスタイル[\s\S]*?(?=#+|$)/);
  if (styleMatch) {
    return (
      <>
        <p>{text.substring(0, styleMatch.index)}</p>
        <StyleSuggestionCard 
          title="おすすめヘアスタイル" 
          icon="content_cut"
          content={styleMatch[0].replace(/#+\s+おすすめヘアスタイル/, '').trim()}
        />
        <p>{text.substring(styleMatch.index + styleMatch[0].length)}</p>
      </>
    );
  }
  
  // 他の提案パターンの検出と処理
  // ...
  
  return <p>{text}</p>;
}
```

## アクセシビリティ対応

### 1. コントラストと可読性

- テキストとコンテナ間の十分なコントラスト比（WCAG AA準拠）
- 最小フォントサイズは14px以上に設定
- ボタンやアクションアイテムの適切なサイズ（タッチターゲットは44px×44px以上）

### 2. キーボードナビゲーション

```jsx
<textarea 
  className="input-field" 
  placeholder="メッセージを入力..." 
  rows="1"
  onKeyDown={(e) => {
    // Enterキーのみ送信、Shift+Enterで改行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }}
></textarea>
```

### 3. スクリーンリーダー対応

```jsx
<button 
  className="mic-btn"
  aria-label="音声入力"
  aria-pressed={isRecording}
  onClick={toggleVoiceRecording}
>
  <span className="material-icons" aria-hidden="true">
    {isRecording ? 'stop' : 'mic'}
  </span>
</button>
```

## インタラクション設計

### 1. 基本フロー

1. ユーザーがクライアントを選択
2. チャット画面が初期化され、コンテキストがロード
3. 美容師がメッセージを入力または音声入力を使用
4. 送信ボタンをクリックしてAIに送信
5. 送信中は入力フィールド無効化＆インジケータ表示
6. AI応答がストリーミングまたは一括表示
7. 応答が完了したら入力フィールドを再度有効化

### 2. 音声入力フロー

1. マイクボタンをタップしてアクティブ化
2. 赤色に変化し、アイコンが「stop」に変更
3. 音声入力中はリアルタイムでテキスト表示
4. 再度タップまたは自動停止（無音検出・タイムアウト）
5. 入力フィールドに変換テキストを表示

### 3. エラー処理

```jsx
try {
  // メッセージ送信処理
} catch (error) {
  // エラー表示
  setError(error.message || 'メッセージの送信に失敗しました');
  
  // エラー表示コンポーネント
  {error && (
    <div className="error-message">
      <span className="material-icons error-icon">error</span>
      <p>{error}</p>
      <button 
        className="retry-button" 
        onClick={() => handleSendMessage(lastMessage)}
      >
        再試行
      </button>
    </div>
  )}
}
```

## 実装ガイドライン

### 1. CSSアプローチ

クライアントチャットUIでは、以下の2つのアプローチを併用することを推奨します：

1. **MUIコンポーネントベース**:
   - Box、Typography、Buttonなどの基本コンポーネントを使用
   - sx属性を使った直感的なスタイリング

2. **カスタムCSSモジュール**:
   - 「*.module.css」ファイルを使用した独自スタイル
   - 複雑なスタイルとアニメーションは分離して管理

### 2. コンポーネント分割

効率的なコンポーネント分割を行います：

```
ChatContainer（メインコンテナ）
├── ChatHeader（ヘッダー）
├── ChatMessageList（メッセージリスト）
│   ├── UserMessage（ユーザーメッセージ）
│   └── AiResponse（AI応答）
│       ├── StyleSuggestionCard（スタイル提案）
│       └── CheckList（チェックリスト）
├── ChatInput（入力フォーム）
│   ├── VoiceRecordButton（音声録音ボタン）
│   └── SendButton（送信ボタン）
└── ClientInfoPanel（クライアント情報パネル）
    ├── ElementBalance（五行バランス表示）
    ├── DayPillarInfo（日柱情報）
    └── VisitHistory（来店履歴）
```

### 3. スマートコンポーネント実装

主要機能をカプセル化したスマートコンポーネントの例：

```jsx
// ChatContainer.tsx - メインコンテナ
const ChatContainer: React.FC<ChatContainerProps> = ({ clientId, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  
  // 初期化時にクライアント情報とチャット履歴を読み込み
  useEffect(() => {
    const loadClientChat = async () => {
      try {
        setIsLoading(true);
        const { clientChatHistory, contextData } = await beautyChatService.getClientChatHistory(clientId);
        setMessages(clientChatHistory.messages);
        setClientContext(contextData);
      } catch (error) {
        console.error('チャット読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClientChat();
  }, [clientId]);
  
  // メッセージ送信処理
  const handleSendMessage = async (message: string) => {
    // メッセージ送信処理
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ChatHeader clientName={clientContext?.clientProfile?.name || ''} onBack={onBack} />
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <ChatMessageList 
            messages={messages} 
            isLoading={isLoading} 
          />
          
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isLoading} 
          />
        </Box>
        
        {clientContext && (
          <ClientInfoPanel 
            clientContext={clientContext} 
            sx={{ display: { xs: 'none', md: 'block' } }} 
          />
        )}
      </Box>
    </Box>
  );
};
```

## 実装チェックリスト

1. [  ] ヘッダーセクション
   - [  ] クライアント情報表示
   - [  ] 戻るボタン機能
   - [  ] メニューオプション

2. [  ] メッセージリスト
   - [  ] チャット初期読み込み
   - [  ] ユーザーメッセージ表示
   - [  ] AI応答表示
   - [  ] スタイル提案カードの構造化表示
   - [  ] オートスクロール実装

3. [  ] 入力セクション
   - [  ] テキスト入力フィールド
   - [  ] 自動高さ調整
   - [  ] 送信ボタン状態管理
   - [  ] 音声入力機能

4. [  ] クライアント情報パネル
   - [  ] 四柱推命情報表示
   - [  ] 五行バランス視覚化
   - [  ] 本日の日柱情報
   - [  ] 来店履歴表示

5. [  ] レスポンシブデザイン
   - [  ] モバイル対応レイアウト
   - [  ] タブレット対応レイアウト
   - [  ] デスクトップ対応レイアウト

6. [  ] アニメーションとトランジション
   - [  ] メッセージ表示アニメーション
   - [  ] 入力状態のフィードバック
   - [  ] ストリーミングレスポンス表示

7. [  ] エラー処理
   - [  ] ネットワークエラー処理
   - [  ] 再試行機能
   - [  ] ユーザーフィードバック

8. [  ] アクセシビリティ
   - [  ] コントラスト確認
   - [  ] キーボードナビゲーション
   - [  ] スクリーンリーダー対応

## 技術的考慮事項

### 1. パフォーマンス最適化

- メッセージリストのレンダリング最適化（React.memo、仮想化）
- 画像の遅延読み込み
- コンポーネントの条件付きレンダリング

### 2. ストリーミングレスポンス

- SSE（Server-Sent Events）を活用したストリーミング
- レスポンス表示の段階的更新
- デバウンスによるUI更新の最適化

### 3. オフライン対応

- ローカルストレージを活用した履歴キャッシュ
- オフライン時のUI表示
- 再接続時の同期処理

## まとめ

美容クライアントチャットのUI設計は、美容師とAIの対話を通じて、クライアントに最適なヘアスタイルや美容アドバイスを提供するための専用インターフェースです。四柱推命情報を活用した独自の提案機能と、使いやすいチャットインターフェースを組み合わせることで、美容師の業務をサポートします。

実装においては、モダンなUIライブラリを活用しつつも、カスタマイズされた美しいデザインを実現し、モバイルファーストかつレスポンシブな対応を行います。アクセシビリティと使いやすさを重視し、すべてのユーザーが効果的に利用できるインターフェースを提供します。