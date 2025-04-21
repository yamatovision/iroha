import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import SajuProfileCard from '../../components/profile/SajuProfileCard';
import sajuProfileService from '../../services/saju-profile.service';
import { ISajuProfile } from '@shared/index';
import { useAuth } from '../../contexts/AuthContext';
import LoadingIndicator from '../../components/common/LoadingIndicator';

/**
 * 四柱推命プロフィール表示専用コンポーネント
 * 入力フォームは個人情報タブに移動し、このコンポーネントは表示のみを担当
 * 
 * @param {Object} props コンポーネントのプロパティ
 * @param {string} props.userId - 表示するユーザーID (省略時は現在ログイン中のユーザー)
 */
interface SajuProfileSectionProps {
  userId?: string;
}

const SajuProfileSection: React.FC<SajuProfileSectionProps> = ({ userId }) => {
  const { userProfile, loading: authLoading } = useAuth();
  // ユーザープロファイルのレスポンス型を定義
  type UserProfileResponse = {
    data?: any;
  };
  
  // ISajuProfileを拡張したローカル型を定義
  type ExtendedSajuProfile = ISajuProfile & { data?: any };
  
  const [profile, setProfile] = useState<ExtendedSajuProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      // 認証中やuserProfileとuserIdが両方ない場合は何もしない
      if (authLoading || (!userProfile && !userId)) return;
      
      setIsLoading(true);
      setLoadingStep('プロフィール情報を確認中...');
      
      try {
        // 他のユーザーのプロフィールを取得する場合
        if (userId && (!userProfile || userId !== userProfile.id)) {
          setLoadingStep('他ユーザーのプロフィール情報を取得中...');
          console.log('他ユーザーの四柱推命プロフィール取得:', userId);
          
          try {
            // USER.GET_USER(userId) APIを使用してユーザー情報を取得
            // 型アサーションを使用してAPIレスポンスを扱う
            const otherUserProfile: any = await sajuProfileService.getUserProfile(userId);
            // レスポンスから直接データを取得
            const userData = otherUserProfile?.data;
            
            if (!userData) {
              setError('ユーザーが見つかりませんでした');
              return;
            }
            
            if (userData.fourPillars || userData.elementAttribute) {
              // ISajuProfile形式に変換
              const convertedProfile: ExtendedSajuProfile = {
                userId: userData.id,
                birthplace: userData.birthPlace || '',
                birthplaceCoordinates: userData.birthplaceCoordinates,
                localTimeOffset: userData.localTimeOffset,
                mainElement: userData.elementAttribute ? userData.elementAttribute : 'wood' as any,
                fourPillars: {
                  year: { 
                    heavenlyStem: userData.fourPillars?.year?.heavenlyStem || '',
                    earthlyBranch: userData.fourPillars?.year?.earthlyBranch || '',
                  },
                  month: { 
                    heavenlyStem: userData.fourPillars?.month?.heavenlyStem || '',
                    earthlyBranch: userData.fourPillars?.month?.earthlyBranch || ''
                  },
                  day: { 
                    heavenlyStem: userData.fourPillars?.day?.heavenlyStem || '',
                    earthlyBranch: userData.fourPillars?.day?.earthlyBranch || ''
                  },
                  hour: { 
                    heavenlyStem: userData.fourPillars?.hour?.heavenlyStem || '',
                    earthlyBranch: userData.fourPillars?.hour?.earthlyBranch || ''
                  }
                },
                elementProfile: {
                  wood: userData.elementProfile?.wood || 20,
                  fire: userData.elementProfile?.fire || 20,
                  earth: userData.elementProfile?.earth || 20,
                  metal: userData.elementProfile?.metal || 20,
                  water: userData.elementProfile?.water || 20
                },
                kakukyoku: userData.kakukyoku,
                yojin: userData.yojin,
                personalityDescription: userData.personalityDescription || '',
                careerAptitude: userData.careerAptitude || '',
                createdAt: userData.createdAt || new Date(),
                updatedAt: userData.updatedAt || new Date()
              };
              
              setProfile(convertedProfile);
              setError('');
            } else {
              setProfile(null);
              setError('このユーザーには四柱推命プロフィールがありません');
            }
          } catch (apiErr: any) {
            console.error('他ユーザーのプロフィール取得に失敗:', apiErr);
            setError('ユーザープロフィールの取得に失敗しました');
          }
        }
        // 自分自身のプロフィールを表示する場合
        else if (userProfile) {
          console.log('自分の四柱推命プロフィール読み込み開始', { userProfile });
          
          // ユーザープロフィールに四柱推命情報が含まれているか確認
          if (userProfile.fourPillars || userProfile.elementAttribute) {
            setLoadingStep('四柱推命情報を処理中...');
            console.log('ユーザープロフィールに四柱推命情報があります');
            
            // ISajuProfile形式に変換
            const convertedProfile: ExtendedSajuProfile = {
              userId: userProfile.id,
              birthplace: userProfile.birthPlace || '',
              birthplaceCoordinates: userProfile.birthplaceCoordinates,
              localTimeOffset: userProfile.localTimeOffset,
              mainElement: userProfile.elementAttribute ? userProfile.elementAttribute : 'wood' as any,
              fourPillars: {
                year: { 
                  heavenlyStem: userProfile.fourPillars?.year?.heavenlyStem || '',
                  earthlyBranch: userProfile.fourPillars?.year?.earthlyBranch || '',
                },
                month: { 
                  heavenlyStem: userProfile.fourPillars?.month?.heavenlyStem || '',
                  earthlyBranch: userProfile.fourPillars?.month?.earthlyBranch || ''
                },
                day: { 
                  heavenlyStem: userProfile.fourPillars?.day?.heavenlyStem || '',
                  earthlyBranch: userProfile.fourPillars?.day?.earthlyBranch || ''
                },
                hour: { 
                  heavenlyStem: userProfile.fourPillars?.hour?.heavenlyStem || '',
                  earthlyBranch: userProfile.fourPillars?.hour?.earthlyBranch || ''
                }
              },
              elementProfile: {
                wood: userProfile.elementProfile?.wood || 20,
                fire: userProfile.elementProfile?.fire || 20,
                earth: userProfile.elementProfile?.earth || 20,
                metal: userProfile.elementProfile?.metal || 20,
                water: userProfile.elementProfile?.water || 20
              },
              kakukyoku: userProfile.kakukyoku,
              yojin: userProfile.yojin,
              personalityDescription: userProfile.personalityDescription || '',
              careerAptitude: userProfile.careerAptitude || '',
              createdAt: userProfile.createdAt || new Date(),
              updatedAt: userProfile.updatedAt || new Date()
            };
            
            setProfile(convertedProfile);
            setError('');
            return;
          }
          
          // ユーザープロフィールに四柱推命情報がない場合はAPIから取得
          try {
            setLoadingStep('APIからプロフィール情報を取得中...');
            console.log('APIから四柱推命プロフィールを取得します');
            const profileData = await sajuProfileService.getMyProfile();
            setProfile(profileData);
            setError('');
          } catch (apiErr: any) {
            console.log('APIからの取得に失敗:', apiErr);
            if (apiErr.response?.status === 404) {
              // Profile not found is expected for new users
              setProfile(null);
            } else {
              setError('四柱推命プロフィールの取得に失敗しました');
              console.error('Failed to load profile from API:', apiErr);
            }
          }
        }
      } catch (err: any) {
        console.error('プロフィールロード中のエラー:', err);
        setError('四柱推命プロフィールの処理中にエラーが発生しました');
      } finally {
        setIsLoading(false);
        setLoadingStep(null);
      }
    };

    loadProfile();
  }, [userProfile, userId, authLoading]);

  // 認証データまたはプロフィールデータロード中の表示
  if (authLoading || isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <LoadingIndicator size="medium" />
        {loadingStep && (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            {loadingStep}
          </Typography>
        )}
      </Box>
    );
  }

  // プロフィールが存在しない場合
  if (!profile) {
    // 他のユーザーのプロフィールを表示しようとしている場合
    if (userId && (!userProfile || userId !== userProfile.id)) {
      return (
        <Box sx={{ py: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            このユーザーには四柱推命プロフィールがまだ作成されていません。
          </Alert>
        </Box>
      );
    }
    
    // 自分のプロフィールがない場合
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          四柱推命プロフィールがまだ作成されていません。「個人情報」タブで生年月日情報を入力してください。
        </Alert>
        
        {/* 追加のトラブルシューティング情報を表示 */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">トラブルシューティング:</Typography>
          <Typography variant="body2">
            すでに生年月日情報を入力済みの場合は、「個人情報」タブで再度保存ボタンを押して四柱推命情報を更新してください。
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">四柱推命プロフィール</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <SajuProfileCard profile={profile} />
      
      {/* 自分のプロフィールの場合だけアドバイスを表示 */}
      {!userId || (userProfile && userId === userProfile.id) ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          四柱推命プロフィールを更新するには、「個人情報」タブで生年月日情報を編集してください。
        </Alert>
      ) : null}
    </Box>
  );
};

export default SajuProfileSection;