import { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { App } from '@capacitor/app';
import { isNativePlatform } from '../../services/storage/platform-detector';

/**
 * アプリ終了処理コンポーネント
 * Android端末でのバックボタン処理を管理します
 */
const AppExitHandler: React.FC = () => {
  const [showExitToast, setShowExitToast] = useState(false);
  const [lastBackPress, setLastBackPress] = useState(0);
  const backPressThreshold = 2000; // 2秒

  useEffect(() => {
    if (!isNativePlatform()) return;
    
    // ルート画面パス
    const rootPaths = ['/', '/fortune', '/chat', '/team', '/profile'];
    
    const handleBackButton = () => {
      const currentPath = window.location.pathname;
      
      // ルート画面かどうかを確認
      const isRootScreen = rootPaths.some(path => 
        path === currentPath || (path !== '/' && currentPath.startsWith(path))
      );
      
      if (isRootScreen) {
        // ルート画面での処理（終了確認）
        const now = Date.now();
        if (now - lastBackPress < backPressThreshold) {
          // 短時間に2回バックボタンが押された場合はアプリを終了
          App.exitApp();
        } else {
          // 最初のバックボタン押下時
          setLastBackPress(now);
          setShowExitToast(true);
          return false; // デフォルト動作をキャンセル
        }
      }
      
      // 非ルート画面では通常の戻る動作
      return true;
    };

    // バックボタンイベントのリスニング
    const listenerPromise = App.addListener('backButton', handleBackButton);
    
    return () => {
      // コンポーネント解除時にリスナーを削除
      listenerPromise.then(listener => listener.remove());
    };
  }, [lastBackPress]);

  // トースト非表示処理
  const handleCloseToast = () => {
    setShowExitToast(false);
  };

  // ネイティブ環境でなければ何も表示しない
  if (!isNativePlatform()) {
    return null;
  }

  return (
    <Snackbar
      open={showExitToast}
      autoHideDuration={backPressThreshold}
      onClose={handleCloseToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleCloseToast} 
        severity="info" 
        sx={{ 
          width: '100%',
          borderRadius: '20px',
        }}
      >
        もう一度戻るボタンを押すと終了します
      </Alert>
    </Snackbar>
  );
};

export default AppExitHandler;