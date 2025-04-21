import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Modal,
  Paper,
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Alert,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ParkIcon from '@mui/icons-material/Park'; // 木
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'; // 火
import LandscapeIcon from '@mui/icons-material/Landscape'; // 土 
import StarIcon from '@mui/icons-material/Star'; // 金
import WaterDropIcon from '@mui/icons-material/WaterDrop'; // 水
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import sajuProfileService from '../../services/saju-profile.service';
import apiService from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

/**
 * 友達のプロフィール情報を表示するモーダル
 * 専用のエンドポイント(/api/v1/friends/{userId}/profile)からデータを取得
 */
const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, userId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId || !open) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // 専用の友達プロフィールAPIエンドポイントから情報を取得
        const response = await apiService.get(`/api/v1/friends/${userId}/profile`);
        console.log('友達プロフィール情報取得:', response.data);
        
        if (response.data && response.data.data) {
          // APIからのレスポンスをそのまま使用
          const profile = response.data.data;
          setProfileData(profile);
          console.log('プロフィールデータ:', profile);
        } else {
          setError('ユーザー情報が見つかりませんでした');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('プロフィール情報取得エラー:', err);
        setError('プロフィール情報の取得に失敗しました');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, open]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="profile-modal-title"
    >
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: 600 },
        maxHeight: '90vh',
        overflow: 'auto',
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {/* モーダルヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" id="profile-modal-title">友達プロフィール</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : !profileData ? (
          <Alert severity="info">友達情報が見つかりませんでした</Alert>
        ) : (
          <>
            {/* ユーザー基本情報 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  mr: 2 
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h6">{profileData.displayName || 'ユーザー名未設定'}</Typography>
                {profileData.elementAttribute && (
                  <Box component="span" sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: 10,
                    mt: 0.5,
                    bgcolor: () => sajuProfileService.getElementBackground(profileData.elementAttribute),
                    color: () => sajuProfileService.getElementColor(profileData.elementAttribute),
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {profileData.elementAttribute === 'wood' && <ParkIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                    {profileData.elementAttribute === 'fire' && <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                    {profileData.elementAttribute === 'earth' && <LandscapeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                    {profileData.elementAttribute === 'metal' && <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                    {profileData.elementAttribute === 'water' && <WaterDropIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem' }} />}
                    {sajuProfileService.translateElementToJapanese(profileData.elementAttribute)}
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* 四柱推命プロフィール情報 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>四柱推命情報</Typography>
              
              {/* 五行属性 (mainElementまたはelementAttributeから取得) */}
              {(profileData.mainElement || profileData.elementAttribute) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>五行属性</Typography>
                  <Box sx={{ 
                    display: 'inline-block',
                    px: 2, 
                    py: 1, 
                    borderRadius: 1,
                    bgcolor: sajuProfileService.getElementBackground(profileData.mainElement || profileData.elementAttribute),
                    color: sajuProfileService.getElementColor(profileData.mainElement || profileData.elementAttribute),
                    fontWeight: 'bold'
                  }}>
                    {(() => {
                      // 五行属性に応じたアイコンを表示
                      const element = profileData.mainElement || profileData.elementAttribute;
                      return (
                        <>
                          {element === 'wood' && <ParkIcon sx={{ mr: 1 }} />}
                          {element === 'fire' && <LocalFireDepartmentIcon sx={{ mr: 1 }} />}
                          {element === 'earth' && <LandscapeIcon sx={{ mr: 1 }} />}
                          {element === 'metal' && <StarIcon sx={{ mr: 1 }} />}
                          {element === 'water' && <WaterDropIcon sx={{ mr: 1 }} />}
                          {sajuProfileService.translateElementToJapanese(element)} 
                        </>
                      );
                    })()}
                  </Box>
                </Box>
              )}

              {/* 四柱情報 (存在する場合) */}
              {profileData.fourPillars && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" align="center" sx={{ color: 'text.secondary', mb: 1 }}>年柱</Typography>
                      <Typography align="center" sx={{ fontWeight: 'bold' }}>
                        {profileData.fourPillars.year?.heavenlyStem || '?'}{profileData.fourPillars.year?.earthlyBranch || '?'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" align="center" sx={{ color: 'text.secondary', mb: 1 }}>月柱</Typography>
                      <Typography align="center" sx={{ fontWeight: 'bold' }}>
                        {profileData.fourPillars.month?.heavenlyStem || '?'}{profileData.fourPillars.month?.earthlyBranch || '?'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" align="center" sx={{ color: 'text.secondary', mb: 1 }}>日柱</Typography>
                      <Typography align="center" sx={{ fontWeight: 'bold' }}>
                        {profileData.fourPillars.day?.heavenlyStem || '?'}{profileData.fourPillars.day?.earthlyBranch || '?'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" align="center" sx={{ color: 'text.secondary', mb: 1 }}>時柱</Typography>
                      <Typography align="center" sx={{ fontWeight: 'bold' }}>
                        {profileData.fourPillars.hour?.heavenlyStem || '?'}{profileData.fourPillars.hour?.earthlyBranch || '?'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* 格局(カクキョク)情報 */}
              {profileData.kakukyoku && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>格局</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {profileData.kakukyoku.type} ({profileData.kakukyoku.strength === 'strong' ? '身強' : 
                      profileData.kakukyoku.strength === 'weak' ? '身弱' : '中和'})
                  </Typography>
                  {profileData.kakukyoku.description && (
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {profileData.kakukyoku.description}
                    </Typography>
                  )}
                </Box>
              )}

              {/* 用神情報 */}
              {profileData.yojin && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>用神</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {profileData.yojin.tenGod}
                    {profileData.yojin.element && `（${sajuProfileService.translateElementToJapanese(profileData.yojin.element)}）`}
                  </Typography>
                  {profileData.yojin.description && (
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {profileData.yojin.description}
                    </Typography>
                  )}
                </Box>
              )}

              {/* 性格特性 */}
              {profileData.personalityDescription && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>性格特性</Typography>
                  <Typography variant="body2">
                    {profileData.personalityDescription}
                  </Typography>
                </Box>
              )}
              
              {/* 調和のコンパス（careerAptitude） */}
              {profileData.careerAptitude && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>調和のコンパス</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {profileData.careerAptitude}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              {/* 四柱推命情報がないことを示すメッセージ */}
              {!profileData.fourPillars && !profileData.kakukyoku && !profileData.yojin && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  詳細な四柱推命情報が表示できない場合があります。
                </Alert>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Modal>
  );
};

export default ProfileModal;