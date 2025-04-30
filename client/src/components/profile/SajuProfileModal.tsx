import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Paper,
  Alert
} from '@mui/material';
import SajuProfileForm from './SajuProfileForm';
import { useAuth } from '../../contexts/AuthContext';
import fortuneService from '../../services/fortune.service';
import apiService from '../../services/api.service';
import LoadingIndicator from '../common/LoadingIndicator';
import LoadingOverlay from '../common/LoadingOverlay';

interface SajuProfileModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  isRequired?: boolean; // 必須モード（オンボーディング時など）
}

const SajuProfileModal: React.FC<SajuProfileModalProps> = ({ open, onClose, onComplete, isRequired = false }) => {
  const { updateUserProfile, refreshUserProfile, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  const handleFormSubmit = async (profileData: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // ユーザープロフィールを更新
      setProcessingStep('プロフィール情報を更新中...');
      console.log('📝 四柱推命プロフィール更新開始:', { 
        birthDate: profileData.birthDate,
        birthPlace: profileData.birthPlace,
        hasCoordinates: !!profileData.birthplaceCoordinates
      });
      
      const updatedProfile = await updateUserProfile(profileData);
      console.log('✅ プロフィール更新完了:', updatedProfile ? '成功' : '失敗');
      
      // 最新のプロフィール情報で認証コンテキストを更新（重要: この完了を待つ）
      setProcessingStep('プロフィール情報を同期中...');
      const refreshedProfile = await refreshUserProfile();
      console.log('🔄 プロフィール情報の同期:', refreshedProfile ? '成功' : '失敗', {
        hasFourPillars: refreshedProfile?.fourPillars ? Object.keys(refreshedProfile.fourPillars).length > 0 : false,
        hasElementAttribute: !!refreshedProfile?.elementAttribute
      });
      
      if (!refreshedProfile) {
        throw new Error('プロフィール情報の同期に失敗しました');
      }
      
      // デイリーフォーチュンを強制的に更新（3回まで試行）
      try {
        setProcessingStep('運勢情報を更新中...');
        console.log('📊 四柱推命プロフィール更新により運勢情報を更新しています...');
        
        let attempts = 0;
        const maxAttempts = 3;
        let fortuneUpdateSuccess = false;
        let fortuneData = null;
        
        while (attempts < maxAttempts && !fortuneUpdateSuccess) {
          try {
            // 再試行ごとに少し待機時間を増やす
            if (attempts > 0) {
              await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
              console.log(`🔄 運勢データ更新を再試行... (${attempts + 1}/${maxAttempts})`);
            }
            
            fortuneData = await fortuneService.refreshDailyFortune();
            
            // 更新されたデータをログ出力
            if (fortuneData) {
              console.log('📋 更新された運勢データ:', {
                id: fortuneData.id,
                date: fortuneData.date,
                adviceLength: fortuneData.advice ? fortuneData.advice.length : 0,
                hasLuckyItems: !!fortuneData.luckyItems,
                score: fortuneData.score
              });
              
              // データの検証
              if (fortuneData.id && fortuneData.advice && fortuneData.advice.length > 0) {
                fortuneUpdateSuccess = true;
                console.log('✅ 運勢情報の更新に成功しました - 完全なデータを確認');
              } else {
                console.warn('⚠️ 運勢データが不完全です。再試行します', {
                  hasId: !!fortuneData.id,
                  hasAdvice: !!fortuneData.advice,
                  attempts: attempts + 1
                });
                attempts++;
              }
            } else {
              console.warn('⚠️ 運勢データの更新結果がnullです');
              attempts++;
            }
          } catch (retryError) {
            console.error(`❌ 運勢更新試行 ${attempts + 1} 失敗:`, retryError);
            attempts++;
          }
        }
        
        if (!fortuneUpdateSuccess) {
          console.warn('⚠️ 運勢データの完全な更新に失敗しましたが、処理を続行します');
        }
      } catch (fortuneError) {
        // フォーチュン更新に失敗してもプロフィール更新は成功とみなす
        console.warn('❌ 運勢情報の更新に失敗しましたが、プロフィール更新は成功しました:', fortuneError);
      }
      
      // サーバー側でプロフィール情報が確実に反映されるまで待機
      setProcessingStep('サーバー側で処理を完了しています...');
      console.log('🕒 サーバー側でプロフィール情報が確実に反映されるまで待機します');
      // サーバーログを確認した結果、処理に20秒近くかかる場合があるため、十分な待機時間を設定（25秒）
      console.log('⏳ 処理完了を待機中（最大25秒）...');
      await new Promise(resolve => setTimeout(resolve, 25000));
      
      // APIキャッシュを強制的にクリア
      try {
        await apiService.clearCache('/api/v1/users/profile');
        await apiService.clearCache('/api/v1/fortune/dashboard');
        await apiService.clearCache('/api/v1/fortune/daily');
        console.log('✅ APIキャッシュを強制的にクリアしました');
      } catch (cacheError) {
        console.error('❌ キャッシュクリア中にエラーが発生しました:', cacheError);
      }
      
      // 四柱推命プロフィールが確実に反映されたことを確認するため、もう一度プロフィールを取得
      setProcessingStep('プロフィール情報を最終確認しています...');
      const finalCheck = await refreshUserProfile();
      console.log('🔍 最終確認されたプロフィール:', {
        hasFourPillars: finalCheck?.fourPillars ? '✅' : '❌',
        hasElementAttribute: finalCheck?.elementAttribute ? '✅' : '❌'
      });
      
      // 完了処理
      setProcessingStep('完了！四柱推命プロフィールを登録しました');
      console.log('✅ 四柱推命プロフィール登録プロセスが完了しました');
      
      // ステートをリセット
      setTimeout(() => {
        setIsSubmitting(false);
        setProcessingStep(null);
        
        // 成功コールバックを直接呼び出し（完全に同期完了後に実行されることを保証）
        console.log('🔀 onComplete コールバックを実行します');
        onComplete();
      }, 1500); // 完了メッセージを少し表示してから次の画面に進む
    } catch (err) {
      console.error('❌ 四柱推命プロフィール登録エラー:', err);
      setError('プロフィール情報の登録に失敗しました。ネットワーク接続を確認してください。');
      setIsSubmitting(false);
      setProcessingStep(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isSubmitting || isRequired ? undefined : onClose} // 送信中または必須モードの場合は閉じられないように
      aria-labelledby="saju-profile-modal-title"
      disableEscapeKeyDown={isRequired} // 必須モードの場合はESCキーでも閉じられないように
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {isSubmitting ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <LoadingOverlay 
              isLoading={true}
              variant="transparent"
              contentType="tips"
              message={processingStep || "プロフィール情報を更新中..."}
              category="fortune"
              showProgress={true}
              estimatedTime={15}
            />
          </Box>
        ) : (
          <SajuProfileForm onSubmit={handleFormSubmit} isLoading={isSubmitting || authLoading} />
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