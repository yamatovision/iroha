/**
 * モデルドキュメント生成スクリプト
 * 
 * 使用方法:
 * npx ts-node scripts/generateModelDocs.ts
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// ドキュメント出力先のパス
const OUTPUT_PATH = path.join(__dirname, '../docs/models.md');

// モデルファイルの取得とドキュメント生成
async function generateModelDocs() {
  // モデルディレクトリのパス
  const modelsDir = path.join(__dirname, '../src/models');
  
  // モデルファイルの一覧取得（index.tsを除く）
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts');
  
  // ドキュメントのヘッダー
  let docs = `# DailyFortune モデル定義ドキュメント\n\n`;
  docs += `このドキュメントは自動生成されています。直接編集しないでください。\n\n`;
  docs += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
  docs += `## 目次\n\n`;
  
  // 目次の生成
  modelFiles.forEach(file => {
    const modelName = file.replace('.ts', '');
    docs += `- [${modelName}](#${modelName.toLowerCase()})\n`;
  });
  
  docs += `\n`;
  
  // 各モデルのドキュメント生成
  for (const file of modelFiles) {
    const modelName = file.replace('.ts', '');
    const modelPath = path.join(modelsDir, file);
    
    // ファイルの内容を読み込み
    const content = fs.readFileSync(modelPath, 'utf-8');
    
    // インターフェースとスキーマの情報を抽出
    const interfaceMatch = content.match(/export interface I([a-zA-Z]+) {([\s\S]*?)}/);
    const schemaMatch = content.match(/const ([a-zA-Z]+)Schema = new Schema<[^>]+>\(([\s\S]*?)\n\s*\}\s*,\s*\{/);
    
    if (interfaceMatch && schemaMatch) {
      const interfaceContent = interfaceMatch[2].trim();
      const schemaContent = schemaMatch[2].trim();
      
      // モデルセクションの追加
      docs += `## ${modelName}\n\n`;
      
      // 型定義の追加
      docs += `### 型定義\n\n`;
      docs += '```typescript\n';
      docs += `interface I${modelName} {\n${interfaceContent}\n}\n`;
      docs += '```\n\n';
      
      // スキーマ定義の追加
      docs += `### スキーマ定義\n\n`;
      docs += '```typescript\n';
      docs += `const ${modelName.toLowerCase()}Schema = new Schema({\n${schemaContent}\n});\n`;
      docs += '```\n\n';
      
      // インデックス情報の抽出
      const indexMatches = content.match(/([a-zA-Z]+)Schema\.index\(\{([^}]+)\}[^;]*\);/g);
      
      if (indexMatches && indexMatches.length > 0) {
        docs += `### インデックス\n\n`;
        
        indexMatches.forEach(indexMatch => {
          docs += `- \`${indexMatch.trim()}\`\n`;
        });
        
        docs += '\n';
      }
      
      // メソッド情報の抽出
      const methodMatches = content.match(/([a-zA-Z]+)Schema\.(methods|pre|post)\.[a-zA-Z]+ = [^;]+;/g) || [];
      const staticMatches = content.match(/([a-zA-Z]+)Schema\.statics\.[a-zA-Z]+ = [^;]+;/g) || [];
      const hookMatches = content.match(/([a-zA-Z]+)Schema\.(pre|post)\([^)]+\),[^;]+\);/g) || [];
      
      const allMethods = [...methodMatches, ...staticMatches, ...hookMatches];
      
      if (allMethods.length > 0) {
        docs += `### メソッドとフック\n\n`;
        
        allMethods.forEach(methodMatch => {
          docs += `- \`${methodMatch.trim()}\`\n`;
        });
        
        docs += '\n';
      }
      
      // 区切り線
      docs += `---\n\n`;
    } else {
      docs += `## ${modelName}\n\n`;
      docs += `モデル情報を抽出できませんでした。ファイルを確認してください。\n\n`;
      docs += `---\n\n`;
    }
  }
  
  // ドキュメントの保存
  fs.writeFileSync(OUTPUT_PATH, docs);
  console.log(`モデルドキュメントを生成しました: ${OUTPUT_PATH}`);
}

// スクリプトの実行
generateModelDocs()
  .catch(err => {
    console.error('ドキュメント生成中にエラーが発生しました:', err);
    process.exit(1);
  });