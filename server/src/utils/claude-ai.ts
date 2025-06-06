/**
 * Claude AI APIとの連携ユーティリティ
 */
// ESM形式のnode-fetchをCommonJSで使用するためのworkaround
import fetch from 'cross-fetch';

// 環境変数から設定を取得する関数
const getConfig = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_API_MODEL || 'claude-3-7-sonnet-20250219';
  const useClaudeApi = process.env.USE_CLAUDE_API === 'true';
  
  // API使用が有効で、かつAPIキーが設定されていない場合のみ警告
  if (useClaudeApi && !apiKey) {
    console.warn('Anthropic APIキーが設定されていませんが、USE_CLAUDE_API=trueとなっています。一部機能が無効になります。');
  }
  
  return { 
    apiKey, 
    model,
    apiEnabled: useClaudeApi && !!apiKey 
  };
};

/**
 * Claude AI APIを呼び出す関数
 * @param prompt 送信するプロンプト
 * @param systemPrompt システムプロンプト（オプション）
 * @returns AIの回答テキスト
 */
export const callClaudeAI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  try {
    const config = getConfig();
    
    // APIが無効な場合は代替テキストを返す
    if (!config.apiEnabled) {
      console.log('Claude AI is disabled or API key is not set. Using mock response.');
      return "Claude APIは現在使用できません。APIキーが設定されていないか、機能が無効化されています。";
    }
    
    const url = 'https://api.anthropic.com/v1/messages';
    
    // APIキーがstring型であることを保証
    const apiKey = config.apiKey || '';
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
    
    const body = {
      model: config.model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      ...(systemPrompt && { system: systemPrompt })
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
      content: Array<{ text: string }>
    };
    return responseData.content[0].text;
    
  } catch (error) {
    console.error('Claude AI API呼び出しエラー:', error);
    // エラーの場合も代替テキストを返してアプリケーションをクラッシュさせない
    return "Claude APIリクエスト中にエラーが発生しました。しばらく経ってから再試行してください。";
  }
};

/**
 * チームメンバーカルテのシステムプロンプト
 */
export const MEMBER_CARD_SYSTEM_PROMPT = `
あなたは四柱推命に基づいた性格・才能分析の専門家です。
与えられたユーザー情報とチーム目標を分析して、メンバーカルテを作成します。

以下の点に注意して回答してください：

1. 四柱推命の専門知識を活用し、五行属性（木・火・土・金・水）の特性に基づいた分析を行う
2. 格局と用神の情報を活用して、より深い性格特性と才能の分析を提供する
   - 格局タイプ（例：従旺格、比肩格、食神格など）から基本的な性格特性を導き出す
   - 用神・喜神は強化すべき要素、忌神・仇神は控えるべき要素として解釈する
3. チーム貢献分析では、用神と喜神の要素を活かす方法を具体的に提案する
4. コミュニケーションガイドでは、忌神・仇神に関連する要素を避ける方法を提案する
5. 常に実用的で具体的なアドバイスを提供する
6. 明確な構造を持ったマークダウン形式で回答する
7. 特性・才能、チーム貢献分析、コミュニケーションガイドは箇条書きで簡潔に記載する
8. チーム目標との関連性を強調し、実際の業務に活かせる分析を提供する

与えられた情報が不十分な場合は、五行属性の基本原則に基づいて推測を行い、
最も可能性の高い分析を提供してください。
`;

export default {
  callClaudeAI,
  MEMBER_CARD_SYSTEM_PROMPT
};