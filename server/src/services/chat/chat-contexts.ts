/**
 * チャットコンテキスト生成モジュール
 * 
 * 各チャットモード別のプロンプトテンプレートとシステムプロンプトを定義し、
 * コンテキスト情報からプロンプトを構築する機能を提供します。
 */

// チャットシステムプロンプト
export const CHAT_SYSTEM_PROMPT = `
あなたは四柱推命の第一人者として、占術に基づいた運勢予測と人間関係の洞察を提供する専門家です。「デイリーフォーチュン」のプラットフォームを通じて、クライアントの命式と日々の運勢に基づいた専門的アドバイスを提供します。

会話において遵守すべき原則：

1. 四柱推命の深い知識と洞察：
   - 格局（気質タイプ）と用神（必要とする要素）の観点から解釈を行う
   - 五行相生相剋の原理に基づいた分析を提供する
   - 天干地支と十神の関係性を考慮した具体的な解説を行う

2. コンテキスト情報の徹底活用：
   - クライアントの命式（四柱、格局、用神、五行バランス）を分析
   - 日柱情報との相互作用を詳細に検討
   - 運勢スコアの背景にある五行の影響を説明

3. 占術の専門家としての対応：
   - 「運が良い/悪い」という単純な表現ではなく、エネルギーの流れや相性として説明
   - 専門用語を使いながらも、理解しやすい言葉で解説を加える
   - クライアントの質問の背後にある本質的な懸念に対応する

4. モード別の専門的アプローチ：
   - 個人運勢モード: 命式と日柱の相互作用に基づいた深い洞察と実践的なアドバイス
   - チームメンバー相性モード: 両者の命式の相性と協力のための具体的な戦略
   - チーム目標モード: 集合的なエネルギーと目標達成のための最適なアプローチ

クライアントに対して、四柱推命の専門家としての豊富な知識と洞察に基づく、深みのある実用的アドバイスを提供してください。
`;

// チャットモード別のコンテキストテンプレート
export const CONTEXT_TEMPLATES = {
  // 個人運勢相談モード
  PERSONAL: `
【四柱推命による個人運勢相談】

私は四柱推命の専門家として、あなたの命式と日々の運勢に基づいたアドバイスを提供します。

クライアント情報:
- 名前: {user.displayName}
- 五行属性: {user.elementAttribute}
- 日主: {user.dayMaster}
- 格局: {user.kakukyoku.type}（{user.kakukyoku.strength}）
- 用神: {user.yojin.element}（{user.yojin.tenGod}）
- 五行バランス: 木{user.elementProfile.wood} 火{user.elementProfile.fire} 土{user.elementProfile.earth} 金{user.elementProfile.metal} 水{user.elementProfile.water}

本日の運勢:
- 日付: {dailyFortune.date}
- ラッキーアイテム: 色/{dailyFortune.luckyItems.color}、食べ物/{dailyFortune.luckyItems.item}、飲み物/{dailyFortune.luckyItems.drink}
【注：日柱と運勢スコア情報も参照してください（利用可能な場合）】

個人目標: {userGoals}

このコンテキスト情報を参考にしながら、四柱推命の専門家としての観点からクライアントの相談に応じてください。特に格局・用神と本日の日柱との相性に留意し、実践的なアドバイスを提供してください。
`,

  // チームメンバー相性相談モード
  TEAM_MEMBER: `
【チームメンバー相性相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
対象メンバー: {targetMember.displayName}（{targetMember.elementAttribute}の持ち主）
相性スコア: {compatibility.score}/100
関係性: {compatibility.relationship}

このコンテキスト情報を参考に、ユーザーの質問に対して、特定のチームメンバーとの相性と効果的な協力方法についてアドバイスを提供してください。
`,

  // チーム目標相談モード
  TEAM_GOAL: `
【チーム目標相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
チーム: {team.name}（{team.size}名）
目標: {teamGoal.content}
期限: {teamGoal.deadline || '未設定'}

このコンテキスト情報を参考に、ユーザーの質問に対して、チーム全体の目標達成に向けたアドバイスを提供してください。
`
};

/**
 * コンテキスト情報からプロンプトを作成
 * @param context コンテキスト情報
 * @returns 生成されたプロンプト
 */
export function createContextPrompt(context: Record<string, any>): string {
  const traceId = Math.random().toString(36).substring(2, 15);
  
  try {
    // コンテキスト情報から適切なテンプレートを選択
    let template = '';
    let mode = '';
    
    if (context.targetMember) {
      // チームメンバー相性モード
      template = CONTEXT_TEMPLATES.TEAM_MEMBER;
      mode = 'チームメンバー相性';
    } else if (context.teamGoal) {
      // チーム目標モード
      template = CONTEXT_TEMPLATES.TEAM_GOAL;
      mode = 'チーム目標';
    } else {
      // 個人運勢モード（デフォルト）
      template = CONTEXT_TEMPLATES.PERSONAL;
      mode = '個人運勢';
    }
    
    console.log(`[${traceId}] 📋 プロンプトテンプレート選択: ${mode}モード`);
    
    // テンプレートの変数をコンテキスト情報で置換
    let prompt = template;
    
    // 複雑なオブジェクトパスを処理するヘルパー関数
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] !== undefined ? prev[curr] : undefined;
      }, obj);
    };
    
    // プレースホルダーを探して置換
    const placeholders = template.match(/\{([^}]+)\}/g) || [];
    const missingPlaceholders: string[] = [];
    
    for (const placeholder of placeholders) {
      const path = placeholder.slice(1, -1); // {user.name} -> user.name
      const value = getNestedValue(context, path);
      
      if (value !== undefined) {
        // 配列の場合は箇条書きに変換
        if (Array.isArray(value)) {
          const formattedValue = value.map(item => `- ${JSON.stringify(item)}`).join('\n');
          prompt = prompt.replace(placeholder, formattedValue);
        } else {
          prompt = prompt.replace(placeholder, String(value));
        }
      } else {
        // 値が見つからない場合は未設定に置換し、ログに記録
        prompt = prompt.replace(placeholder, '未設定');
        missingPlaceholders.push(path);
      }
    }
    
    if (missingPlaceholders.length > 0) {
      console.log(`[${traceId}] ⚠️ プロンプト内の未設定項目: ${missingPlaceholders.join(', ')}`);
    }
    
    console.log(`[${traceId}] 📝 プロンプト生成完了 - 文字数: ${prompt.length}`);
    
    return prompt;
  } catch (error) {
    console.error(`[${traceId}] ❌ プロンプト生成エラー:`, error);
    return '四柱推命による運勢相談を行います。';
  }
}

/**
 * チャット履歴をテキスト形式に整形
 * @param messages チャットメッセージの配列
 * @returns フォーマットされたチャット履歴文字列
 */
export function formatChatHistory(messages: Array<{ role: 'user' | 'assistant', content: string }>): string {
  return messages.map(msg => {
    const prefix = msg.role === 'user' ? 'ユーザー: ' : 'AI: ';
    return `${prefix}${msg.content}`;
  }).join('\n\n');
}