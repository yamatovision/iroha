import React, { useState, useEffect } from 'react';
import teamService from '../../services/team.service';
import friendService from '../../services/friend.service';
import sajuProfileService from '../../services/saju-profile.service';
import { 
  Box, 
  Modal, 
  Typography, 
  Button, 
  TextField, 
  IconButton, 
  Tabs, 
  Tab,
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  CircularProgress, 
  Paper
} from '@mui/material';
import { useTeam } from '../../contexts/TeamContext';
import { 
  Close as CloseIcon, 
  Search as SearchIcon, 
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

interface TeamMemberAddModalProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

/**
 * チームメンバー追加モーダル
 * 友達リストからメンバーを選択して追加したり、メールアドレスで招待できる
 */
const TeamMemberAddModal: React.FC<TeamMemberAddModalProps> = ({
  teamId,
  open,
  onClose,
  onMemberAdded
}) => {
  // TeamContextからrefreshTeamsを取得
  const { refreshTeams } = useTeam();
  
  // タブの状態
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // 友達選択関連の状態
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendRole, setFriendRole] = useState<string>('');
  
  // メール招待関連の状態
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  // 友達リスト取得
  useEffect(() => {
    if (!open) return;
    
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const friendsData = await friendService.getFriends();
        
        // 既にチームメンバーになっている友達を除外
        const teamMembers = await teamService.getTeamMembers(teamId);
        const teamMemberIds = teamMembers.map((member: any) => member.userId);
        
        const availableFriends = friendsData.filter((friend: any) => 
          !teamMemberIds.includes(friend.userId)
        );
        
        setFriends(availableFriends);
        setError(null);
      } catch (err) {
        console.error('友達リストの取得に失敗しました', err);
        setError('友達リストの取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriends();
  }, [open, teamId]);
  
  // 友達からメンバー追加処理
  const handleAddFriendAsMember = async () => {
    if (!selectedFriend || !friendRole) {
      return;
    }
    
    try {
      setLoading(true);
      await teamService.addMemberFromFriend(teamId, selectedFriend, friendRole);
      
      // TeamContextのリフレッシュ関数を呼び出し
      await refreshTeams();
      
      // 成功処理
      onMemberAdded();
      handleClose();
      setError(null);
    } catch (err) {
      console.error(`Failed to add friend as team member: ${selectedFriend}`, err);
      setError('メンバーの追加に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  // メールでメンバー追加処理
  const handleAddMemberByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;

    try {
      setLoading(true);
      await teamService.addTeamMember(teamId, {
        email,
        role,
        password: password || undefined,
        displayName: displayName || undefined
      });

      // TeamContextのリフレッシュ関数を呼び出し
      await refreshTeams();

      // 成功処理
      onMemberAdded();
      handleClose();
      setError(null);
    } catch (err) {
      console.error(`Failed to add member by email to team ${teamId}:`, err);
      setError('メンバーの追加に失敗しました。メールアドレスが既に存在するか、入力情報が正しくありません。');
    } finally {
      setLoading(false);
    }
  };
  
  // タブ切り替え処理
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // モーダルを閉じる際にステートをリセット
  const handleClose = () => {
    setSelectedFriend(null);
    setFriendRole('');
    setEmail('');
    setRole('');
    setPassword('');
    setDisplayName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="team-member-add-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 600 },
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* ヘッダー */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" id="team-member-add-modal-title">
            メンバーを追加
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* タブナビゲーション */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="友達から選択" />
          <Tab label="メールで招待" />
        </Tabs>
        
        {/* コンテンツエリア */}
        <Box sx={{ overflow: 'auto', flexGrow: 1, p: 0 }}>
          {/* エラーメッセージ表示 */}
          {error && (
            <Paper 
              sx={{ 
                mx: 3,
                mt: 2,
                p: 2, 
                bgcolor: 'error.light', 
                color: 'error.dark',
                borderRadius: 2
              }}
            >
              {error}
            </Paper>
          )}
          
          {/* 友達選択タブ */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              {loading && !selectedFriend ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : friends.length > 0 ? (
                <>
                  <Typography sx={{ mb: 2 }}>
                    友達リストからチームメンバーとして追加したい人を選んでください
                  </Typography>
                  
                  {/* 友達リスト */}
                  <List sx={{ 
                    mb: 3, 
                    maxHeight: '300px', 
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}>
                    {friends.map((friend) => (
                      <Paper 
                        key={friend.userId} 
                        elevation={0}
                        sx={{ 
                          mb: '1px',
                          border: selectedFriend === friend.userId ? 
                            '2px solid var(--primary-color)' : 'none',
                          borderRadius: 0,
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          },
                          bgcolor: selectedFriend === friend.userId ? 
                            'rgba(103, 58, 183, 0.08)' : 'transparent'
                        }}
                        onClick={() => setSelectedFriend(friend.userId)}
                      >
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: friend.elementAttribute ? 
                                  sajuProfileService.getElementBackground(friend.elementAttribute) : 'grey.300',
                                color: friend.elementAttribute ? 
                                  sajuProfileService.getElementColor(friend.elementAttribute) : 'text.primary'
                              }}
                            >
                              {friend.displayName ? friend.displayName.charAt(0) : '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={<Typography fontWeight={selectedFriend === friend.userId ? 'bold' : 'normal'}>{friend.displayName}</Typography>} 
                            secondary={
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {friend.elementAttribute && (
                                  <Box component="span" sx={{ 
                                    px: 1, 
                                    py: 0.3, 
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    bgcolor: friend.elementAttribute ? 
                                      sajuProfileService.getElementBackground(friend.elementAttribute) : '#e0e0e0',
                                    color: 'black',
                                  }}>
                                    {sajuProfileService.translateElementToJapanese(friend.elementAttribute)}
                                  </Box>
                                )}
                                <Typography variant="body2" component="span">
                                  {friend.email || ''}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                  
                  {/* 役割入力フォーム */}
                  {selectedFriend && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                        チーム内の役割
                      </Typography>
                      <TextField
                        label="役割（必須）"
                        fullWidth
                        value={friendRole}
                        onChange={(e) => setFriendRole(e.target.value)}
                        placeholder="エンジニア、デザイナー、マネージャーなど"
                        helperText="チーム内での役割を入力してください"
                        required
                      />
                      
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!friendRole.trim() || loading}
                        onClick={handleAddFriendAsMember}
                        startIcon={<PersonAddIcon />}
                        sx={{ mt: 3 }}
                      >
                        チームに追加
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography color="text.secondary" paragraph>
                    追加可能な友達がいません。
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    まだ友達がいないか、すべての友達が既にチームメンバーになっています。
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveTab(1)}
                    sx={{ mt: 2 }}
                  >
                    メールで招待する
                  </Button>
                </Box>
              )}
            </Box>
          )}
          
          {/* メール招待タブ */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ mb: 2 }}>
                メールアドレスでチームメンバーを招待できます
              </Typography>
              
              <form onSubmit={handleAddMemberByEmail}>
                <TextField
                  label="メールアドレス（必須）"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  label="チーム内の役割（必須）"
                  fullWidth
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="エンジニア、デザイナー、マネージャーなど"
                  required
                  sx={{ mb: 2 }}
                />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  未登録ユーザー用の追加情報（オプション）
                </Typography>
                
                <TextField
                  label="表示名"
                  fullWidth
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="未入力の場合はメールアドレスから自動生成"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  label="初期パスワード"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="未登録ユーザー用の初期パスワード"
                  helperText="既存ユーザーの場合は不要です"
                  sx={{ mb: 2 }}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!email.trim() || !role.trim() || loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'メールで招待'}
                </Button>
              </form>
            </Box>
          )}
        </Box>
        
        {/* フッター */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}>
          <Button onClick={handleClose} color="inherit">
            閉じる
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TeamMemberAddModal;