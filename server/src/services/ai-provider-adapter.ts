/**
 * AI Provider Adapter
 * 
 * ClaudeとOpenAIの両方をサポートするためのアダプター
 * 環境変数に基づいてどちらを使用するかを自動的に切り替える
 */

import { ChatMessage, generateChatResponse as generateChatResponseWithClaude, generateHarmonyCompass as generateHarmonyCompassWithClaude, generateLuckyItemsWithClaude } from './claude-ai';
import { generateChatResponse as generateChatResponseWithOpenAI, generateHarmonyCompass as generateHarmonyCompassWithOpenAI, generateLuckyItemsWithOpenAI } from './openai-ai';
import { FortuneScoreResult } from '../types';

// 環境変数からどのAIプロバイダーを使うか決定
const useOpenAI = process.env.USE_OPENAI_API === 'true';

// 使用するAIプロバイダーの情報をログ出力
console.log(`=== AI Provider Adapter initialized ===`);
console.log(`Using ${useOpenAI ? 'OpenAI' : 'Claude'} as AI provider`);
console.log(`Model: ${useOpenAI ? process.env.OPENAI_MODEL || 'gpt-4o (default)' : process.env.CLAUDE_API_MODEL || 'claude-3-7-sonnet-20250219 (default)'}`);
console.log(`API Key: ${useOpenAI ? (process.env.OPENAI_API_KEY ? '設定済み' : '未設定') : (process.env.ANTHROPIC_API_KEY ? '設定済み' : '未設定')}`);
console.log(`=== AI Provider Configuration End ===`);

/**
 * チャットレスポンスを生成する
 * 環境変数に基づいて適切なAIプロバイダーを使用
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  context: Record<string, any>,
  modelType: string = 'standard'
): Promise<string> {
  try {
    if (useOpenAI) {
      // OpenAIを使用
      const openaiModelType = modelType === 'sonnet' || modelType === 'standard' ? 'standard' : 'turbo';
      return await generateChatResponseWithOpenAI(messages, context, openaiModelType);
    } else {
      // Claudeを使用
      const claudeModelType = modelType === 'standard' ? 'sonnet' : (modelType as 'sonnet' | 'haiku');
      return await generateChatResponseWithClaude(messages, context, claudeModelType);
    }
  } catch (error) {
    console.error(`Error in AI Provider Adapter - generateChatResponse: ${error}`);
    return '申し訳ありません。AIレスポンスの生成中にエラーが発生しました。もう一度お試しください。';
  }
}

/**
 * 調和のコンパスを生成する
 * 環境変数に基づいて適切なAIプロバイダーを使用
 */
export async function generateHarmonyCompass(userData: Record<string, any>): Promise<{
  content: string;
}> {
  try {
    if (useOpenAI) {
      // OpenAIを使用
      return await generateHarmonyCompassWithOpenAI(userData);
    } else {
      // Claudeを使用
      return await generateHarmonyCompassWithClaude(userData);
    }
  } catch (error) {
    console.error(`Error in AI Provider Adapter - generateHarmonyCompass: ${error}`);
    return {
      content: '申し訳ありません。調和のコンパスの生成中にエラーが発生しました。'
    };
  }
}

/**
 * ラッキーアイテムを生成する
 * 環境変数に基づいて適切なAIプロバイダーを使用
 */
export async function generateLuckyItems(
  userData: {
    user: Record<string, any>,
    fortuneDetails?: FortuneScoreResult
  },
  dayStem: string,
  dayBranch: string
): Promise<{ color: string; item: string; drink: string }> {
  try {
    if (useOpenAI) {
      // OpenAIを使用
      return await generateLuckyItemsWithOpenAI(userData, dayStem, dayBranch);
    } else {
      // Claudeを使用
      return await generateLuckyItemsWithClaude(userData, dayStem, dayBranch);
    }
  } catch (error) {
    console.error(`Error in AI Provider Adapter - generateLuckyItems: ${error}`);
    // デフォルト値を返す
    return {
      color: '青色の服やアクセサリー',
      item: '新鮮な果物',
      drink: '緑茶'
    };
  }
}

// その他の必要なAI関連機能も同様にアダプター化
// 例えば、ストリーミングAPIなど

export { ChatMessage } from './claude-ai';