import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import SajuProfileCard from '../../components/profile/SajuProfileCard';
import sajuProfileService from '../../services/saju-profile.service';
import { ISajuProfile } from '@shared/index';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 四柱推命プロフィール表示専用コンポーネント
 * 入力フォームは個人情報タブに移動し、このコンポーネントは表示のみを担当
 */
const SajuProfileSection: React.FC = () => {
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState<ISajuProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile) return;
      
      setIsLoading(true);
      try {
        console.log('四柱推命プロフィール読み込み開始', { userProfile });
        
        // ユーザープロフィールに四柱推命情報が含まれているか確認
        if (userProfile && (userProfile.fourPillars || userProfile.elementAttribute)) {
          console.log('ユーザープロフィールに四柱推命情報があります');
          
          // ISajuProfile形式に変換
          const convertedProfile: ISajuProfile = {
            userId: userProfile.id,
            birthplace: userProfile.birthPlace || '',
            birthplaceCoordinates: userProfile.birthplaceCoordinates,
            localTimeOffset: userProfile.localTimeOffset,
            mainElement: userProfile.elementAttribute ? userProfile.elementAttribute : 'wood' as any,
            fourPillars: {
              year: { 
                heavenlyStem: userProfile.fourPillars?.year?.heavenlyStem || '',
                earthlyBranch: userProfile.fourPillars?.year?.earthlyBranch || '',
                // TypeScriptエラー修正: ISajuProfileに合わせて拡張プロパティは追加しない
                // heavenlyStemTenGod: userProfile.fourPillars?.year?.heavenlyStemTenGod || '',
                // earthlyBranchTenGod: userProfile.fourPillars?.year?.earthlyBranchTenGod || '',
                // hiddenStems: userProfile.fourPillars?.year?.hiddenStems || []
              },
              month: { 
                heavenlyStem: userProfile.fourPillars?.month?.heavenlyStem || '',
                earthlyBranch: userProfile.fourPillars?.month?.earthlyBranch || ''
                // TypeScriptエラー修正: ISajuProfileに合わせて拡張プロパティは追加しない
                // heavenlyStemTenGod: userProfile.fourPillars?.month?.heavenlyStemTenGod || '',
                // earthlyBranchTenGod: userProfile.fourPillars?.month?.earthlyBranchTenGod || '',
                // hiddenStems: userProfile.fourPillars?.month?.hiddenStems || []
              },
              day: { 
                heavenlyStem: userProfile.fourPillars?.day?.heavenlyStem || '',
                earthlyBranch: userProfile.fourPillars?.day?.earthlyBranch || ''
                // TypeScriptエラー修正: ISajuProfileに合わせて拡張プロパティは追加しない
                // heavenlyStemTenGod: userProfile.fourPillars?.day?.heavenlyStemTenGod || '',
                // earthlyBranchTenGod: userProfile.fourPillars?.day?.earthlyBranchTenGod || '',
                // hiddenStems: userProfile.fourPillars?.day?.hiddenStems || []
              },
              hour: { 
                heavenlyStem: userProfile.fourPillars?.hour?.heavenlyStem || '',
                earthlyBranch: userProfile.fourPillars?.hour?.earthlyBranch || ''
                // TypeScriptエラー修正: ISajuProfileに合わせて拡張プロパティは追加しない
                // heavenlyStemTenGod: userProfile.fourPillars?.hour?.heavenlyStemTenGod || '',
                // earthlyBranchTenGod: userProfile.fourPillars?.hour?.earthlyBranchTenGod || '',
                // hiddenStems: userProfile.fourPillars?.hour?.hiddenStems || []
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
      } catch (err: any) {
        console.error('プロフィールロード中のエラー:', err);
        setError('四柱推命プロフィールの処理中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userProfile]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // プロフィールが存在しない場合
  if (!profile) {
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
      
      <Alert severity="info" sx={{ mt: 2 }}>
        四柱推命プロフィールを更新するには、「個人情報」タブで生年月日情報を編集してください。
      </Alert>
    </Box>
  );
};

export default SajuProfileSection;