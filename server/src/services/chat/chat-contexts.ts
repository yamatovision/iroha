/**
 * チャットコンテキスト生成モジュール
 * 
 * 各チャットモード別のプロンプトテンプレートとシステムプロンプトを定義し、
 * コンテキスト情報からプロンプトを構築する機能を提供します。
 */

console.log('chat-contexts.ts が読み込まれました');

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
console.log('CONTEXT_TEMPLATES を定義します');
export const CONTEXT_TEMPLATES = {
  // 上位互換性のために大文字キーも追加（claude-ai.ts との衝突対策）
  PERSONAL: '個人運勢モード(大文字版)',
  TEAM_MEMBER: 'チームメンバーモード(大文字版)',
  TEAM_GOAL: 'チーム目標モード(大文字版)',
  // 個人運勢相談モード
  personal: `
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
  team_member: `
【チームメンバー相性相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
対象メンバー: {targetMember.displayName}（{targetMember.elementAttribute}の持ち主）
相性スコア: {compatibility.score}/100
関係性: {compatibility.relationship}

このコンテキスト情報を参考に、ユーザーの質問に対して、特定のチームメンバーとの相性と効果的な協力方法についてアドバイスを提供してください。
`,

  // チーム目標相談モード
  team_goal: `
【チーム目標相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
チーム: {team.name}（{team.size}名）
目標: {teamGoal.content}
期限: {teamGoal.deadline || '未設定'}

このコンテキスト情報を参考に、ユーザーの質問に対して、チーム全体の目標達成に向けたアドバイスを提供してください。
`,

  // 新しいコンテキストベースのテンプレート
  self: `
【個人情報コンテキスト】

私は四柱推命の専門家として、あなたの命式と個人情報に基づいたアドバイスを提供します。

クライアント情報:
- 名前: {user.displayName}
- 五行属性: {user.elementAttribute}
- 日主: {user.dayMaster}
- 格局: {user.kakukyoku.type}（{user.kakukyoku.strength}）
- 用神: {user.yojin.element}（{user.yojin.tenGod}）
- 五行バランス: 木{user.elementProfile.wood} 火{user.elementProfile.fire} 土{user.elementProfile.earth} 金{user.elementProfile.metal} 水{user.elementProfile.water}

このコンテキスト情報を参考にしながら、四柱推命の専門家としての観点からクライアントの相談に応じてください。特に格局・用神の特性を考慮して、実践的なアドバイスを提供してください。
`,

  fortune: `
【運勢情報コンテキスト】

私は四柱推命の専門家として、今日の運勢に基づいたアドバイスを提供します。

本日の運勢:
- 日付: {fortuneDate}
- 日柱情報: {dayPillar.heavenlyStem}{dayPillar.earthlyBranch}
- ラッキーアイテム: 色/{dailyFortune.luckyItems.color}、食べ物/{dailyFortune.luckyItems.item}、飲み物/{dailyFortune.luckyItems.drink}

このコンテキスト情報を参考にしながら、今日の運勢に関するアドバイスを提供してください。
`,

  friend: `
【友人関係コンテキスト】

私は四柱推命の専門家として、あなたと友人の相性に基づいたアドバイスを提供します。

相談者: {user.displayName}（{user.elementAttribute}の持ち主）
友人情報: 
{friends}

このコンテキスト情報を参考にしながら、お互いの相性や関係性についてのアドバイスを提供してください。
`,

  team: `
【チーム情報コンテキスト】

私は四柱推命の専門家として、チームの相性や協力関係に基づいたアドバイスを提供します。

相談者: {user.displayName}（{user.elementAttribute}の持ち主）
チーム情報:
- 名前: {team.name}
- メンバー数: {team.members.length}名
- メンバー: {team.members}

このコンテキスト情報を参考にしながら、チーム内の協力関係や相性についてのアドバイスを提供してください。
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
    console.log(`[${traceId}] chat-contexts.ts の createContextPrompt が呼ばれました`);
    console.log(`[${traceId}] CONTEXT_TEMPLATES の状態:`, {
      keys: Object.keys(CONTEXT_TEMPLATES),
      hasPersonal: CONTEXT_TEMPLATES.personal !== undefined,
      hasTeamMember: CONTEXT_TEMPLATES.team_member !== undefined,
      hasTeamGoal: CONTEXT_TEMPLATES.team_goal !== undefined,
      hasSelf: CONTEXT_TEMPLATES.self !== undefined,
      hasFortune: CONTEXT_TEMPLATES.fortune !== undefined,
      hasFriend: CONTEXT_TEMPLATES.friend !== undefined,
      hasTeam: CONTEXT_TEMPLATES.team !== undefined
    });
    
    console.log(`[${traceId}] 受信したコンテキスト情報キー:`, Object.keys(context));
    
    // コンテキスト情報から適切なテンプレートを選択
    let templates: string[] = [];
    let contextTypes: string[] = [];
    
    // 旧モードベースの判定（後方互換性）
    if (context.targetMember) {
      // チームメンバー相性モード
      templates.push(CONTEXT_TEMPLATES.team_member || '');
      contextTypes.push('team_member');
    } else if (context.teamGoal) {
      // チーム目標モード
      templates.push(CONTEXT_TEMPLATES.team_goal || '');
      contextTypes.push('team_goal');
    } else if (context.team && context.team.name) {
      // チームモード
      templates.push(CONTEXT_TEMPLATES.team || '');
      contextTypes.push('team');
    }
    
    // 新しいコンテキストベースの判定
    if (context.user && (context.user.kakukyoku || context.user.yojin)) {
      // 自分自身の詳細情報がある場合
      templates.push(CONTEXT_TEMPLATES.self || '');
      contextTypes.push('self');
    }
    
    if (context.dailyFortune) {
      // 運勢情報がある場合
      templates.push(CONTEXT_TEMPLATES.fortune || '');
      contextTypes.push('fortune');
    }
    
    if (context.friends && context.friends.length > 0) {
      // 友達情報がある場合
      templates.push(CONTEXT_TEMPLATES.friend || '');
      contextTypes.push('friend');
    }
    
    // テンプレートが選択されなかった場合はデフォルトの個人モード
    if (templates.length === 0) {
      templates.push(CONTEXT_TEMPLATES.personal || '');
      contextTypes.push('personal');
    }
    
    console.log(`[${traceId}] 📋 選択されたコンテキストタイプ: ${contextTypes.join(', ')}`);
    
    // 複数のテンプレートを結合
    let combinedTemplate = '';
    for (let i = 0; i < templates.length; i++) {
      if (templates[i] && templates[i].trim().length > 0) {
        combinedTemplate += `\n\n${templates[i]}`;
      }
    }
    
    // テンプレートがなければデフォルトのコンテキスト情報を提供
    if (!combinedTemplate.trim()) {
      combinedTemplate = `
【基本コンテキスト情報】
四柱推命の専門家として、以下の情報に基づいてアドバイスを提供します。
ユーザー: ${context.user?.displayName || '不明'}
本日の日付: ${new Date().toISOString().split('T')[0]}
      `;
    }
    
    // テンプレートの変数をコンテキスト情報で置換
    let prompt = combinedTemplate;
    
    // 複雑なオブジェクトパスを処理するヘルパー関数
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] !== undefined ? prev[curr] : undefined;
      }, obj);
    };
    
    // プレースホルダーを探して置換
    const placeholders = combinedTemplate.match(/\{([^}]+)\}/g) || [];
    const missingPlaceholders: string[] = [];
    
    for (const placeholder of placeholders) {
      const path = placeholder.slice(1, -1); // {user.name} -> user.name
      const value = getNestedValue(context, path);
      
      if (value !== undefined) {
        // 配列の場合は箇条書きに変換
        if (Array.isArray(value)) {
          const formattedValue = value.map(item => {
            if (typeof item === 'object') {
              // オブジェクトの場合は簡易JSONに変換
              return `- ${Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
            } else {
              return `- ${item}`;
            }
          }).join('\n');
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