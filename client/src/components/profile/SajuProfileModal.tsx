import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Paper,
  CircularProgress
} from '@mui/material';
import SajuProfileForm from './SajuProfileForm';
import { useAuth } from '../../contexts/AuthContext';
import fortuneService from '../../services/fortune.service';

interface SajuProfileModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const SajuProfileModal: React.FC<SajuProfileModalProps> = ({ open, onClose, onComplete }) => {
  const { updateUserProfile, refreshUserProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (profileData: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // ユーザープロフィールを更新
      await updateUserProfile(profileData);
      
      // 最新のプロフィール情報で認証コンテキストを更新
      await refreshUserProfile();
      
      // デイリーフォーチュンを強制的に更新
      try {
        console.log('四柱推命プロフィール更新により運勢情報を更新しています...');
        await fortuneService.refreshDailyFortune();
        console.log('運勢情報の更新に成功しました');
      } catch (fortuneError) {
        // フォーチュン更新に失敗してもプロフィール更新は成功とみなす
        console.warn('運勢情報の更新に失敗しましたが、プロフィール更新は成功しました:', fortuneError);
      }
      
      // 成功コールバックを呼び出し
      onComplete();
    } catch (err) {
      console.error('四柱推命プロフィール登録エラー:', err);
      setError('プロフィール情報の登録に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isSubmitting ? undefined : onClose} // 送信中は閉じられないように
      aria-labelledby="saju-profile-modal-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          backgroundColor: 'white'
        }}
      >
        <Typography 
          id="saju-profile-modal-title" 
          variant="h5" 
          component="h2" 
          gutterBottom
          sx={{ 
            color: 'primary.main',
            textAlign: 'center',
            fontWeight: 600,
            mb: 3
          }}
        >
          四柱推命プロフィールの設定
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          パーソナライズされた運勢予測と的確なアドバイスを受け取るために、
          あなたの生年月日と出生時間、出生地の情報が必要です。
        </Typography>
        
        {error && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {isSubmitting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <SajuProfileForm onSubmit={handleFormSubmit} isLoading={isSubmitting} />
        )}
        
        {!isSubmitting && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 600, textAlign: 'center' }}>
              ※ 入力した情報は運勢やチーム相性の計算にのみ使用され、第三者に提供されることはありません。
              正確な運勢予報のためには、できるだけ正確な出生時間と出生地を入力してください。
            </Typography>
          </Box>
        )}
      </Paper>
    </Modal>
  );
};

export default SajuProfileModal;