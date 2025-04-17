import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.tsx'
import errorLogger from './utils/error-logger'

// グローバル未処理エラーハンドラーの設定
window.addEventListener('error', (event) => {
  // エラーイベントからエラー情報を抽出
  errorLogger.logUnhandledException(event.error || event.message);
  
  // イベントのデフォルト動作を防止しない（ブラウザのコンソールにもエラーを表示）
  return false;
});

// 未処理のPromiseエラーハンドラーの設定
window.addEventListener('unhandledrejection', (event) => {
  // Promiseエラーからエラー情報を抽出
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
  
  errorLogger.logUnhandledException(error, 'Unhandled Promise Rejection');
  
  // イベントのデフォルト動作を防止しない
  return false;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
