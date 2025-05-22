import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SajuProfileModal from '../profile/SajuProfileModal';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from './LoadingIndicator';
import fortuneService from '../../services/fortune.service';
import apiService from '../../services/api.service';

interface RequireSajuProfileProps {
  children: React.ReactNode;
}

/**
 * 四柱推命プロフィールが必要なページをラップするコンポーネント
 * プロフィールが存在しない場合、入力モーダルを表示します
 */
const RequireSajuProfile: React.FC<RequireSajuProfileProps> = ({ children }) => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [waitingForFortune, setWaitingForFortune] = useState(false);
  
  // プロフィールが存在するかを判定する関数
  const hasSajuProfile = () => {
    if (!userProfile) return false;
    
    // 四柱推命情報の検証を厳格化
    const hasFourPillars = userProfile.fourPillars && 
      Object.keys(userProfile.fourPillars).length > 0 &&
      userProfile.fourPillars.day?.heavenlyStem &&
      userProfile.fourPillars.year?.heavenlyStem &&
      userProfile.fourPillars.month?.heavenlyStem;
    
    // 必要な基本情報が存在するかを確認
    const hasBasicInfo = 
      userProfile.birthDate && 
      userProfile.birthTime && 
      userProfile.birthPlace && 
      userProfile.gender;
    
    // 四柱推命の属性情報が存在するか確認
    const hasElementInfo = userProfile.elementAttribute && userProfile.elementAttribute.length > 0;
    
    const isValid = hasFourPillars && hasBasicInfo && hasElementInfo;
    
    if (isValid && userProfile.fourPillars) {
      console.log('✅ 四柱推命プロフィール検証完了: すべての必要情報が存在します', {
        pillars: Object.keys(userProfile.fourPillars),
        hasDayPillar: !!userProfile.fourPillars.day?.heavenlyStem,
        hasYearPillar: !!userProfile.fourPillars.year?.heavenlyStem,
        hasMonthPillar: !!userProfile.fourPillars.month?.heavenlyStem,
        elements: userProfile.elementAttribute
      });
    } else {
      console.warn('⚠️ 四柱推命プロフィールが不完全です', {
        hasFourPillars,
        hasBasicInfo,
        hasElementInfo,
        dayPillar: userProfile.fourPillars?.day?.heavenlyStem || 'なし',
        yearPillar: userProfile.fourPillars?.year?.heavenlyStem || 'なし',
        monthPillar: userProfile.fourPillars?.month?.heavenlyStem || 'なし'
      });
    }
    
    return isValid;
  };
  
  useEffect(() => {
    // すでにチェック済みの場合は何もしない（重要）
    if (profileChecked) return;
    
    // 認証ロード完了時のみチェックを実行
    if (!loading) {
      // ユーザープロフィールのロード完了後に四柱推命情報をチェック
      if (userProfile) {
        if (!hasSajuProfile()) {
          console.log('四柱推命プロフィールが見つかりません。入力モーダルを表示します。');
          setShowProfileModal(true);
          setProfileChecked(true);
        } else {
          console.log('四柱推命プロフィールが存在します。続行します。');
          setProfileChecked(true);
        }
      } else {
        // ユーザープロフィールがない場合（ロードは完了しているが取得できていない）
        console.log('ユーザープロフィールがありません。認証中の可能性があります。');
      }
    }
  }, [userProfile, loading, profileChecked]);
  
  // 運勢データの遅延取得を行う効果
  useEffect(() => {
    // 運勢データの生成待ち状態の場合
    if (waitingForFortune) {
      const fetchFortuneWithDelay = async () => {
        try {
          console.log('🔄 運勢データの生成を待機中...');
          // サーバー側での処理完了を待つために長めに待機（10秒）
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          // API キャッシュを強制的にクリア
          try {
            console.log('🧹 APIキャッシュをクリアします...');
            await apiService.clearCache('/api/v1/users/profile');
            await apiService.clearCache('/api/v1/fortune/dashboard');
            await apiService.clearCache('/api/v1/fortune/daily');
          } catch (cacheError) {
            console.error('❌ キャッシュクリア中にエラーが発生しました:', cacheError);
          }
          
          // 最終的に運勢ページに移動
          console.log('🔀 運勢ページに遷移します');
          setWaitingForFortune(false);
          navigate('/fortune');
        } catch (error) {
          console.error('❌ 運勢データの取得処理で例外が発生しました:', error);
          // エラーでも運勢ページに移動（ページ側でエラー処理を行う）
          setWaitingForFortune(false);
          navigate('/fortune');
        }
      };
      
      fetchFortuneWithDelay();
    }
  }, [waitingForFortune, navigate]);
  
  // ロード中の表示
  if ((loading && !profileChecked) || waitingForFortune) {
    return <LoadingIndicator 
      message={waitingForFortune ? "運勢データを生成中..." : "プロフィール情報を確認中..."} 
      size="medium" 
    />;
  }
  
  const handleProfileComplete = () => {
    console.log('四柱推命プロフィールが正常に登録されました。');
    setShowProfileModal(false);
    setProfileChecked(true);
    
    // 運勢データの生成待ち状態に移行
    setWaitingForFortune(true);
  };
  
  const handleModalClose = () => {
    console.log('ユーザーが四柱推命プロフィール入力をスキップしました。');
    setShowProfileModal(false);
    
    // プロフィール入力がスキップされた場合も運勢ページにリダイレクト
    navigate('/fortune');
  };
  
  return (
    <>
      {children}
      
      <SajuProfileModal 
        open={showProfileModal} 
        onClose={handleModalClose}
        onComplete={handleProfileComplete}
        isRequired={true} // オンボーディング時は必須モードに設定
      />
    </>
  );
};

export default RequireSajuProfile;