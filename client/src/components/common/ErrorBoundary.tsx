import React, { Component, ErrorInfo } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { isNativePlatform } from '../../services/storage/platform-detector';
import { App } from '@capacitor/app';
import errorLogger from '../../utils/error-logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * アプリ全体のエラーハンドリングを行うエラーバウンダリ
 * 予期せぬエラーが発生した場合にアプリ全体がクラッシュするのを防ぎ、
 * ユーザーフレンドリーなエラー画面を表示します
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * 子コンポーネントでエラーが発生した場合に呼び出される
   * 新しい状態を返してエラー表示を有効にする
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラー状態を更新
    return {
      hasError: true,
      error: error,
      errorInfo: null
    };
  }

  /**
   * エラーとスタックトレース情報をキャッチする
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラー情報を詳細に記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo
    });

    // エラーロガーにエラー情報を記録
    errorLogger.logError(error, errorInfo.componentStack || undefined, {
      source: 'error_boundary',
      location: window.location.pathname
    });

    // 開発環境でのみコンソールに詳細なスタックトレースを表示
    if (process.env.NODE_ENV === 'development') {
      console.error('エラー詳細:', error);
      console.error('コンポーネントスタック:', errorInfo.componentStack);
    }
  }

  /**
   * アプリをリロードする
   */
  handleReload = (): void => {
    if (isNativePlatform()) {
      // ネイティブアプリの場合はアプリを再起動
      App.exitApp();
    } else {
      // ウェブの場合はページをリロード
      window.location.reload();
    }
  };

  /**
   * ホーム画面に戻る
   */
  handleNavigateHome = (): void => {
    window.location.href = '/';
  };

  render() {
    // エラーが発生していなければ通常の子コンポーネントをレンダリング
    if (!this.state.hasError) {
      return this.props.children;
    }

    // エラーが発生した場合はフォールバックUIを表示
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 3,
          backgroundColor: '#f5f5f5'
        }}
      >
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              backgroundColor: 'error.main',
              padding: 2,
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom>
              予期しないエラーが発生しました
            </Typography>
          </Box>
          
          <CardContent>
            <Typography variant="body1" paragraph>
              申し訳ありませんが、アプリで問題が発生しました。以下のオプションをお試しください：
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              {/* 開発環境でのみエラーメッセージを表示 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  <strong>エラー：</strong> {this.state.error.toString()}
                </>
              )}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              問題が解決しない場合は、アプリを再起動してください。
            </Typography>
          </CardContent>
          
          <CardActions sx={{ padding: 2, justifyContent: 'space-around' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
            >
              再読み込み
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={this.handleNavigateHome}
            >
              ホームへ戻る
            </Button>
          </CardActions>
        </Card>
      </Box>
    );
  }
}

export default ErrorBoundary;