/**
 * Claude AI APIとの連携サービス
 */
import fetch from 'cross-fetch';
import { callClaudeAI } from '../utils/claude-ai';

// チャット用のシステムプロンプト
const CHAT_SYSTEM_PROMPT = `
あなたは四柱推命に基づいた運勢予測と人間関係のアドバイスを提供する「デイリーフォーチュン」のAIアシスタントです。
ユーザーとの会話において、以下の原則を守ってください：

1. 四柱推命の専門知識を活用して、質問に対して具体的で実用的なアドバイスを提供する
2. 提供されたコンテキスト情報（ユーザーの四柱情報、日柱情報、目標情報など）を活用する
3. 話題の中心をユーザーの運勢、チームメンバーとの相性、チーム目標達成に関連する内容に保つ
4. 常に前向きで建設的なアドバイスを提供する
5. 専門用語を使う場合は簡潔な説明を付ける
6. 具体的な例を挙げて説明する
7. チャットモードに応じた適切な回答を提供する：
   - 個人運勢モード: その日の運勢と個人目標達成のためのアドバイス
   - チームメンバー相性モード: 特定のチームメンバーとの相性と効果的な協力方法
   - チーム目標モード: チーム全体の目標達成に向けたアドバイス

ユーザーからの質問や情報に基づいて、四柱推命の知恵を応用した実用的なアドバイスを提供してください。
`;

// チャットモード別のコンテキストテンプレート
const CONTEXT_TEMPLATES = {
  PERSONAL: `
【個人運勢相談モード】
ユーザー: {user.displayName}（{user.elementAttribute}の持ち主）
日柱情報: {dayPillar.heavenlyStem}{dayPillar.earthlyBranch}
運勢スコア: {fortuneScore}/100
個人目標: {userGoals}

このコンテキスト情報を参考に、ユーザーの質問に対して、その日の運勢と個人目標達成のためのアドバイスを提供してください。
`,

  TEAM_MEMBER: `
【チームメンバー相性相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
対象メンバー: {targetMember.displayName}（{targetMember.elementAttribute}の持ち主）
相性スコア: {compatibility.score}/100
関係性: {compatibility.relationship}

このコンテキスト情報を参考に、ユーザーの質問に対して、特定のチームメンバーとの相性と効果的な協力方法についてアドバイスを提供してください。
`,

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
 * チャットメッセージ形式のインターフェース
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * チャットレスポンスを生成する
 * @param messages チャットメッセージの履歴
 * @param context コンテキスト情報
 * @param modelType 使用するモデル（sonnet/haiku）
 * @returns AIの回答テキスト
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  context: Record<string, any>,
  modelType: 'sonnet' | 'haiku' = 'sonnet'
): Promise<string> {
  try {
    // コンテキスト情報からプロンプトを構築
    const contextPrompt = createContextPrompt(context);
    
    // メッセージ履歴の整形
    const formattedMessages = formatChatHistory(messages);
    
    // 最終プロンプトの構築
    const finalPrompt = `${contextPrompt}\n\n${formattedMessages}`;
    
    // トークン上限を調整（haikuはより短いレスポンスに）
    const maxTokens = modelType === 'haiku' ? 1500 : 4000;
    
    // Claude APIを呼び出し
    const response = await callClaudeAPI(finalPrompt, CHAT_SYSTEM_PROMPT, maxTokens);
    
    return response;
  } catch (error) {
    console.error('Generate chat response error:', error);
    return '申し訳ありません。AIレスポンスの生成中にエラーが発生しました。もう一度お試しください。';
  }
}

/**
 * コンテキスト情報からプロンプトを作成
 */
function createContextPrompt(context: Record<string, any>): string {
  try {
    // コンテキスト情報から適切なテンプレートを選択
    let template = '';
    
    if (context.targetMember) {
      // チームメンバー相性モード
      template = CONTEXT_TEMPLATES.TEAM_MEMBER;
    } else if (context.teamGoal) {
      // チーム目標モード
      template = CONTEXT_TEMPLATES.TEAM_GOAL;
    } else {
      // 個人運勢モード（デフォルト）
      template = CONTEXT_TEMPLATES.PERSONAL;
    }
    
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
        // 値が見つからない場合は空文字に置換
        prompt = prompt.replace(placeholder, '未設定');
      }
    }
    
    return prompt;
  } catch (error) {
    console.error('Create context prompt error:', error);
    return '四柱推命による運勢相談を行います。';
  }
}

/**
 * チャット履歴をテキスト形式に整形
 */
function formatChatHistory(messages: ChatMessage[]): string {
  return messages.map(msg => {
    const prefix = msg.role === 'user' ? 'ユーザー: ' : 'AI: ';
    return `${prefix}${msg.content}`;
  }).join('\n\n');
}

/**
 * Claude APIを呼び出す
 */
async function callClaudeAPI(prompt: string, systemPrompt: string, maxTokens: number): Promise<string> {
  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
  const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';

  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API Key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.');
  }

  try {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    };
    
    const body = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: systemPrompt
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json() as {
      content: Array<{ type: string, text: string }>
    };
    
    return responseData.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');
    
  } catch (error) {
    console.error('Claude API call error:', error);
    throw error;
  }
}