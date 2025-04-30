import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, TextField, Button, 
  List, ListItem, ListItemAvatar, ListItemText, 
  Avatar, IconButton, Paper, Divider, Chip,
  CircularProgress, Modal
} from '@mui/material';
import ProfileModal from '../../components/profile/ProfileModal';
import CompatibilityModal from '../../components/friend/CompatibilityModal';
import { 
  Search as SearchIcon,
  Add as AddIcon, 
  MoreVert as MoreVertIcon, 
  Check as CheckIcon, 
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  Park as ParkIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Landscape as LandscapeIcon,
  Star as StarIcon,
  WaterDrop as WaterDropIcon,
  AutoGraph as AutoGraphIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import friendService from '../../services/friend.service';
import apiService from '../../services/api.service';
import sajuProfileService from '../../services/saju-profile.service';
import Layout from '../../components/layout/Layout';

/**
 * 友達リスト画面
 */
const FriendList: React.FC = () => {
  console.log('FriendList コンポーネントがレンダリングされました');
  
  // ステート管理
  const { userProfile } = useAuth();
  console.log('認証状態:', { 
    userProfile: userProfile ? '認証済み' : '未認証',
    userProfileData: userProfile
  });
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 検索関連の状態
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  
  // モーダル管理の状態
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  
  // 招待リンク状態
  const [inviteLink, setInviteLink] = useState<string>('');
  const [inviteLinkLoading, setInviteLinkLoading] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');

  // 五行属性の色とラベルマッピング
  const elementLabels: Record<string, { name: string, bg: string, color: string }> = {
    water: { name: '水', bg: 'var(--water-bg, #e6e6e6)', color: 'var(--water-color, #000000)' },
    wood: { name: '木', bg: 'var(--wood-bg, #e6f2ff)', color: 'var(--wood-color, #0000ff)' },
    fire: { name: '火', bg: 'var(--fire-bg, #ffe6e6)', color: 'var(--fire-color, #ff0000)' },
    earth: { name: '土', bg: 'var(--earth-bg, #ffffcc)', color: 'var(--earth-color, #ffff00)' },
    metal: { name: '金', bg: 'var(--metal-bg, #f9f9f9)', color: 'var(--metal-color, #ffffff)' }
  };

  // 初期データ読み込み
  useEffect(() => {
    if (!userProfile) {
      console.log('認証されていないため、データ取得をスキップします');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('友達データの取得を開始します - ユーザーID:', userProfile.id);
        
        // 試験的にAPIリクエストをひとつずつ実行
        console.log('友達一覧を取得中...');
        const friendsData = await friendService.getFriends();
        console.log('友達リクエストを取得中...');
        const requestsData = await friendService.getFriendRequests();
        console.log('送信済みリクエストを取得中...');
        const sentRequestsData = await friendService.getSentRequests();
        
        console.log('取得完了 - データ構造:', { 
          friends: friendsData, 
          friendsType: typeof friendsData,
          friendsIsArray: Array.isArray(friendsData),
          requestsType: typeof requestsData,
          sentRequestsType: typeof sentRequestsData
        });
        
        setFriends(Array.isArray(friendsData) ? friendsData : []);
        setRequests(Array.isArray(requestsData) ? requestsData : []);
        setSentRequests(Array.isArray(sentRequestsData) ? sentRequestsData : []);
        setError(null);
      } catch (err) {
        console.error('友達データの取得に失敗しました:', err);
        setError('データの読み込み中にエラーが発生しました。後でもう一度お試しください。');
        // エラー発生時は空の配列を設定
        setFriends([]);
        setRequests([]);
        setSentRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  // タブの切り替え処理
  const handleTabChange = async (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // リクエストタブに切り替えた場合、最新データを取得
    if (newValue === 1) {
      try {
        // 友達関連データを更新
        const updatedRequests = await friendService.getFriendRequests();
        const updatedSentRequests = await friendService.getSentRequests();
        
        setRequests(updatedRequests);
        setSentRequests(updatedSentRequests);
      } catch (err) {
        console.error('リクエストデータの更新に失敗しました:', err);
      }
    }
  };

  // 友達検索処理
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      const results = await friendService.searchUsers(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
      setShowSearchModal(true);
    } catch (err) {
      console.error('ユーザー検索に失敗しました:', err);
      setError('ユーザー検索中にエラーが発生しました。後でもう一度お試しください。');
    } finally {
      setSearchLoading(false);
    }
  };

  // 成功通知用の状態
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 友達申請送信処理
  const handleSendRequest = async (userId: string) => {
    try {
      if (!userId) {
        throw new Error('送信先ユーザーIDが指定されていません');
      }
      
      setLoading(true);
      // userId引数を確実に渡す
      await friendService.sendFriendRequest(userId);
      
      // 送信済みリクエスト更新
      const updatedSentRequests = await friendService.getSentRequests();
      setSentRequests(updatedSentRequests);
      
      // 検索結果からユーザーを削除（UX向上のため）
      setSearchResults(searchResults.filter(user => user.id !== userId));
      
      // モーダルを閉じる
      setShowSearchModal(false);
      
      // 成功メッセージを表示
      setSuccessMessage('友達申請を送信しました！');
      // 3秒後にメッセージを消去
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // リクエストタブに切り替える
      if (activeTab !== 1) {
        setActiveTab(1);
      }
    } catch (err: any) {
      console.error('友達申請の送信に失敗しました:', err);
      
      // 既に申請済みの場合は特別なメッセージとして処理
      if (err.name === 'AlreadySentRequest' || (err.response?.data?.error && err.response.data.error.includes('既に友達申請を送信済み'))) {
        // エラーではなく情報通知として表示
        setSuccessMessage('この相手には既に友達申請を送信済みです');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // 送信済みリクエスト一覧を強制的に更新
        const updatedSentRequests = await friendService.getSentRequests();
        setSentRequests(updatedSentRequests);
        
        // モーダルを閉じる
        setShowSearchModal(false);
        
        // リクエストタブに自動的に切り替え
        if (activeTab !== 1) {
          setActiveTab(1);
        }
      } else {
        setError('友達申請の送信に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  // 友達申請承認処理
  const handleAcceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await friendService.acceptFriendRequest(requestId);
      console.log('友達申請承認レスポンス:', response);
      
      // API キャッシュをクリア
      await apiService.clearCache('/api/v1/friends/requests');
      await apiService.clearCache('/api/v1/friends');
      
      // リスト更新 (キャッシュをバイパスするオプションを指定)
      console.log('友達リクエスト更新前の件数:', requests.length);
      const [updatedRequests, updatedFriends] = await Promise.all([
        friendService.getFriendRequests(true), // キャッシュバイパスフラグを追加
        friendService.getFriends(true)        // キャッシュバイパスフラグを追加
      ]);
      
      console.log('友達リクエスト更新後のデータ:', updatedRequests);
      console.log('友達リクエスト更新後の件数:', updatedRequests.length);
      console.log('友達リスト更新後の件数:', updatedFriends.length);
      
      // 受信リクエストからこの承認したリクエストを除外する追加処理
      const filteredRequests = updatedRequests.filter((req: any) => req._id !== requestId);
      console.log('フィルター後のリクエスト件数:', filteredRequests.length);
      
      setRequests(filteredRequests);
      setFriends(updatedFriends);
      
      // 成功メッセージを表示
      setSuccessMessage('友達申請を承認しました！');
      // 3秒後にメッセージを消去
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('友達申請の承認に失敗しました:', err);
      setError('友達申請の承認に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 友達申請拒否処理
  const handleRejectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await friendService.rejectFriendRequest(requestId);
      
      // リクエストリスト更新
      const updatedRequests = await friendService.getFriendRequests();
      setRequests(updatedRequests);
      
      // 成功メッセージを表示
      setSuccessMessage('友達申請を拒否しました');
      // 3秒後にメッセージを消去
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('友達申請の拒否に失敗しました:', err);
      setError('友達申請の拒否に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 友達削除処理
  const handleRemoveFriend = async (friendshipId: string) => {
    if (!window.confirm('この友達を削除してもよろしいですか？')) {
      return;
    }
    
    try {
      setLoading(true);
      await friendService.removeFriend(friendshipId);
      
      // 友達リスト更新
      const updatedFriends = await friendService.getFriends();
      setFriends(updatedFriends);
      
      // 成功メッセージを表示
      setSuccessMessage('友達を削除しました');
      // 3秒後にメッセージを消去
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('友達の削除に失敗しました:', err);
      setError('友達の削除に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 相性診断モーダルを開く（拡張相性診断モードのみ使用）
  const handleOpenCompatibilityModal = (friend: any) => {
    setSelectedFriend(friend);
    setShowCompatibilityModal(true);
  };

  // 相性診断をモーダルで表示
  const handleViewCompatibility = () => {
    if (!selectedFriend) return;
    setShowCompatibilityModal(true);
  };

  // プロフィール表示（モーダル）
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  // プロフィール表示
  const handleViewProfile = (userId: string) => {
    setSelectedProfileUserId(userId);
    setShowProfileModal(true);
  };

  // 招待リンクをクリップボードにコピー
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('招待リンクをクリップボードにコピーしました');
  };

  // 友達を探すモーダル表示
  const handleOpenSearchModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setShowSearchModal(true);
  };

  // アプリ招待モーダル表示
  const handleOpenInviteModal = () => {
    // モーダルを開くだけで、リンク生成はボタンクリック時に行う
    setInviteEmail('');
    setInviteLink('');
    setEmailError('');
    setShowInviteModal(true);
  };
  
  // 招待リンク生成
  const handleGenerateInviteLink = async () => {
    // メールアドレスの検証
    if (!inviteEmail) {
      setEmailError('メールアドレスを入力してください');
      return;
    }
    
    // 基本的なメールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setEmailError('有効なメールアドレスを入力してください');
      return;
    }
    
    setEmailError('');
    
    try {
      setInviteLinkLoading(true);
      
      // APIを呼び出して招待リンクを生成
      const invitation = await friendService.createFriendInvitation(inviteEmail);
      if (invitation && invitation.url) {
        setInviteLink(invitation.url);
      } else {
        console.error('招待リンクの生成に失敗しました');
      }
    } catch (error) {
      console.error('招待リンクの取得に失敗しました:', error);
      setEmailError('招待リンクの生成に失敗しました。もう一度お試しください。');
    } finally {
      setInviteLinkLoading(false);
    }
  };

  // 常に何かしら表示するようにする
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress sx={{ mb: 2 }}/>
        <Typography>データを読み込み中...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          ユーザー認証状態: {userProfile ? '認証済み' : '未認証'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* 成功メッセージ通知 */}
      {successMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            width: { xs: '90%', sm: '400px' },
            maxWidth: '600px',
            borderRadius: 2,
            bgcolor: 'success.main',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <CheckIcon sx={{ mr: 1 }} />
          <Typography fontWeight="bold">{successMessage}</Typography>
        </Box>
      )}
      
      <Box sx={{ 
        p: 2,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        {/* エラーメッセージ表示 */}
        {error && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: 'error.light', 
              color: 'error.dark',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Typography>{error}</Typography>
          </Paper>
        )}
        
        {/* アクションバー */}
        <Box sx={{ 
          display: 'flex', 
          mb: 3, 
          gap: 1.5
        }}>
          <Paper sx={{ 
            flex: 1, 
            p: 1.5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f9f9f9' },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onClick={handleOpenSearchModal}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'primary.light', 
                mb: 1, 
                width: 40, 
                height: 40 
              }}
            >
              <AddIcon />
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              友達を探す
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            flex: 1, 
            p: 1.5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f9f9f9' },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onClick={handleOpenInviteModal}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'primary.light', 
                mb: 1, 
                width: 40, 
                height: 40 
              }}
            >
              <ContentCopyIcon />
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              アプリに招待
            </Typography>
          </Paper>
        </Box>
        
        {/* タブナビゲーション */}
        <Box sx={{ 
          borderBottom: '1px solid #ddd',
          mb: 2,
          display: 'flex'
        }}>
          <Box 
            sx={{ 
              flex: 1,
              py: 1.5,
              textAlign: 'center',
              fontWeight: activeTab === 0 ? 'bold' : 'normal',
              color: activeTab === 0 ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 0 ? '2px solid' : 'none',
              borderColor: 'primary.main',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab(0)}
          >
            <Typography sx={{ fontWeight: 'inherit' }}>友達</Typography>
          </Box>
          <Box 
            sx={{ 
              flex: 1,
              py: 1.5,
              textAlign: 'center',
              fontWeight: activeTab === 1 ? 'bold' : 'normal',
              color: activeTab === 1 ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 1 ? '2px solid' : 'none',
              borderColor: 'primary.main',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab(1)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontWeight: 'inherit' }}>リクエスト</Typography>
              {(requests.length > 0 || sentRequests.length > 0) && (
                <Box sx={{ 
                  ml: 1, 
                  bgcolor: 'error.main', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 18, 
                  height: 18, 
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {requests.length + sentRequests.length}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* 友達リスト */}
        {activeTab === 0 && (
          <Box>
            {friends.length > 0 ? (
              <List sx={{ p: 0 }}>
                {friends.map((friend) => (
                  <Paper 
                    key={friend.userId} 
                    elevation={0}
                    sx={{ 
                      mb: 2, 
                      overflow: 'hidden',
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <ListItem sx={{ p: 2 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 50,
                            height: 50,
                            fontSize: '1.5rem',
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
                        primary={friend.displayName}
                        primaryTypographyProps={{ 
                          sx: { fontWeight: 'bold', mb: 0.5 } 
                        }}
                        secondaryTypographyProps={{
                          component: 'div' // Change the default <p> to <div>
                        }}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {friend.elementAttribute && (
                              <Box component="span" sx={{ 
                                px: 1.5, 
                                py: 0.5, 
                                borderRadius: 10,
                                bgcolor: friend.elementAttribute ? sajuProfileService.getElementBackground(friend.elementAttribute) : '#000000',
                                color: '#000000',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                mr: 1,
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}>
                                {friend.elementAttribute === 'wood' && <ParkIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                                {friend.elementAttribute === 'fire' && <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                                {friend.elementAttribute === 'earth' && <LandscapeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                                {friend.elementAttribute === 'metal' && <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                                {friend.elementAttribute === 'water' && <WaterDropIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                                {sajuProfileService.translateElementToJapanese(friend.elementAttribute)}
                              </Box>
                            )}
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {friend.acceptedAt ? new Date(friend.acceptedAt).toLocaleDateString() : ''}に追加
                            </Typography>
                          </Box>
                        }
                        sx={{ ml: 1 }}
                      />
                    </ListItem>
                    <Divider />
                    <Box sx={{ position: 'relative' }}>
                      {/* 削除ボタンを右上に配置 */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -50,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: 'text.secondary',
                          p: 0.5,
                          zIndex: 1,
                          '&:hover': { color: 'error.light' }
                        }}
                        onClick={() => handleRemoveFriend(friend.friendship)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Box>
                      
                      {/* メインの2つのボタン */}
                      <Box sx={{ display: 'flex', p: 0 }}>
                        <Box
                          sx={{ 
                            flex: 1, 
                            py: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.03)' }
                          }}
                          onClick={() => handleViewProfile(friend.userId)}
                        >
                          <PersonIcon sx={{ mb: 0.5, color: 'info.main' }} />
                          <Typography variant="caption">プロフィール</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box
                          sx={{ 
                            flex: 1, 
                            py: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: '#9c27b0', // 紫色に変更（高度な分析のイメージに合わせて）
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.03)' }
                          }}
                          onClick={() => handleOpenCompatibilityModal(friend)}
                        >
                          <AutoGraphIcon sx={{ mb: 0.5 }} />
                          <Typography variant="caption">詳細相性</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 10, 
                px: 2,
                color: 'text.secondary',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>まだ友達がいません</Typography>
                <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
                  友達を追加して、相性診断を楽しみましょう
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleOpenSearchModal}
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 5, px: 3 }}
                >
                  友達を探す
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* リクエストタブ */}
        {activeTab === 1 && (
          <Box>
            {/* 統合されたリクエスト表示 */}
            <Box>
              {/* 受信したリクエスト表示 */}
              {requests.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', pl: 1, color: 'text.secondary' }}>
                    受信リクエスト
                  </Typography>
                  <List sx={{ p: 0, mb: 3 }}>
                    {requests.map((request) => (
                      <Paper 
                        key={request._id} 
                        elevation={0}
                        sx={{ 
                          mb: 2, 
                          overflow: 'hidden',
                          borderRadius: 2,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <ListItem sx={{ p: 2 }}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                width: 50,
                                height: 50,
                                fontSize: '1.5rem',
                                bgcolor: request.userId1.elementAttribute ? 
                                  sajuProfileService.getElementBackground(request.userId1.elementAttribute) : 'grey.300',
                                color: request.userId1.elementAttribute ? 
                                  sajuProfileService.getElementColor(request.userId1.elementAttribute) : 'text.primary'
                              }}
                            >
                              {request.userId1.displayName ? request.userId1.displayName.charAt(0) : '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={request.userId1.displayName}
                            primaryTypographyProps={{ 
                              sx: { fontWeight: 'bold', mb: 0.5 } 
                            }}
                            secondary={`${new Date(request.createdAt).toLocaleDateString()}にリクエスト`}
                            secondaryTypographyProps={{
                              component: 'div',
                              sx: { fontSize: '0.8rem' }
                            }}
                            sx={{ ml: 1 }}
                          />
                        </ListItem>
                        <Divider />
                        <Box sx={{ display: 'flex', p: 1, gap: 1 }}>
                          <Button 
                            fullWidth
                            color="primary" 
                            variant="contained"
                            startIcon={<CheckIcon />}
                            sx={{ 
                              py: 1,
                              borderRadius: 2,
                            }}
                            onClick={() => handleAcceptRequest(request._id)}
                          >
                            承認
                          </Button>
                          <Button 
                            fullWidth
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            sx={{ 
                              py: 1,
                              borderRadius: 2,
                              color: 'text.secondary',
                              borderColor: 'divider'
                            }}
                            onClick={() => handleRejectRequest(request._id)}
                          >
                            拒否
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </List>
                </>
              )}
              
              {/* 送信したリクエスト表示 */}
              {sentRequests.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', pl: 1, color: 'text.secondary' }}>
                    申請中
                  </Typography>
                  <List sx={{ p: 0, mb: 3 }}>
                    {sentRequests.map((request) => (
                      <Paper 
                        key={request._id} 
                        elevation={0}
                        sx={{ 
                          mb: 2, 
                          overflow: 'hidden',
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          opacity: 0.9,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <ListItem sx={{ p: 2 }}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                width: 50,
                                height: 50,
                                fontSize: '1.5rem',
                                bgcolor: 'white',
                                color: request.userId2.elementAttribute ? 
                                  sajuProfileService.getElementColor(request.userId2.elementAttribute) : 'primary.main'
                              }}
                            >
                              {request.userId2.displayName ? request.userId2.displayName.charAt(0) : '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={request.userId2.displayName}
                            primaryTypographyProps={{ 
                              sx: { fontWeight: 'bold', mb: 0.5, color: 'white' } 
                            }}
                            secondary="承認待ち"
                            secondaryTypographyProps={{
                              sx: { 
                                color: 'white', 
                                opacity: 0.9, 
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                mt: 0.5,
                                '&::before': {
                                  content: '""',
                                  display: 'inline-block',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'white',
                                  mr: 1
                                }
                              }
                            }}
                            sx={{ ml: 1 }}
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                </>
              )}
              
              {/* リクエストがない場合 */}
              {requests.length === 0 && sentRequests.length === 0 && (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 10, 
                  px: 2,
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    リクエストはありません
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
                    友達申請を送信したり、他のユーザーからリクエストが届くとここに表示されます
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleOpenSearchModal}
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 5, px: 3 }}
                  >
                    友達を探す
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* 友達を探すモーダル */}
        <Modal
          open={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          aria-labelledby="search-modal-title"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: 500 },
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            p: 3
          }}>
            <Typography 
              id="search-modal-title" 
              variant="h6" 
              component="h2" 
              sx={{ 
                mb: 3, 
                fontWeight: 'bold',
                color: 'primary.dark'
              }}
            >
              友達を探す
            </Typography>
            
            <Box sx={{ display: 'flex', mb: 3 }}>
              <TextField
                autoFocus
                placeholder="ユーザー名またはメールアドレス"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ 
                  mr: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Button 
                variant="contained" 
                onClick={handleSearch}
                disabled={searchLoading || !searchQuery.trim()}
                sx={{ 
                  minWidth: 50,
                  borderRadius: 2
                }}
              >
                {searchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
              </Button>
            </Box>
            
            {showSearchResults && (
              <Box 
                sx={{ 
                  maxHeight: 300, 
                  overflow: 'auto', 
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {searchResults.length > 0 ? (
                  <List>
                    {searchResults.map((user) => (
                      <ListItem
                        key={user.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}
                        secondaryAction={
                          /* 友達状態に応じてボタンの表示を変更 */
                          user.friendshipStatus === 'none' ? (
                            // 未申請状態
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                console.log('送信先ユーザーID:', user.id, user._id);
                                handleSendRequest(user.id || user._id);
                              }}
                              sx={{ 
                                borderRadius: 4,
                                px: 2
                              }}
                            >
                              友達申請
                            </Button>
                          ) : user.friendshipStatus === 'pending' ? (
                            // 申請済み状態
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              disabled
                              sx={{ 
                                borderRadius: 4,
                                px: 2
                              }}
                            >
                              申請済み
                            </Button>
                          ) : (
                            // 既に友達状態
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              disabled
                              sx={{ 
                                borderRadius: 4,
                                px: 2
                              }}
                            >
                              友達追加済み
                            </Button>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: user.elementAttribute ? 
                                sajuProfileService.getElementBackground(user.elementAttribute) : 'grey.300',
                              color: user.elementAttribute ? 
                                sajuProfileService.getElementColor(user.elementAttribute) : 'text.primary'
                            }}
                          >
                            {user.displayName ? user.displayName.charAt(0) : '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={<Typography sx={{ fontWeight: 'bold' }}>{user.displayName}</Typography>} 
                          secondary={user.email}
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 4, 
                    color: 'text.secondary'
                  }}>
                    <Typography>検索結果がありません</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      別のユーザー名やメールアドレスで試してみてください
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined"
                onClick={() => setShowSearchModal(false)}
                sx={{ 
                  borderRadius: 4,
                  px: 3
                }}
              >
                閉じる
              </Button>
            </Box>
          </Box>
        </Modal>
        
        {/* アプリ招待モーダル */}
        <Modal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          aria-labelledby="invite-modal-title"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: 500 },
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            p: 3
          }}>
            <Typography 
              id="invite-modal-title" 
              variant="h6" 
              component="h2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                color: 'primary.dark'
              }}
            >
              友達をDailyFortuneに招待
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              友達のメールアドレスを入力して、招待リンクを生成できます。招待された友達はあなたとの相性を確認できます。
            </Typography>
            
            {/* メールアドレス入力フォーム */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="友達のメールアドレス"
                placeholder="例: friend@example.com"
                variant="outlined"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                disabled={inviteLinkLoading}
                sx={{ mb: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleGenerateInviteLink}
                disabled={inviteLinkLoading || !inviteEmail}
                startIcon={inviteLinkLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ borderRadius: 2, mb: 3 }}
              >
                {inviteLinkLoading ? '生成中...' : '招待リンクを生成'}
              </Button>
            </Box>
            
            {/* 生成された招待リンク表示 */}
            {inviteLink && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  生成された招待リンク:
                </Typography>
                <Box sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      flex: 1, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: 'text.secondary'
                    }}
                  >
                    {inviteLink}
                  </Typography>
                  <IconButton 
                    onClick={handleCopyInviteLink} 
                    color="primary"
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.main'
                      }
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={() => setShowInviteModal(false)}
                sx={{ 
                  borderRadius: 4,
                  px: 3
                }}
              >
                閉じる
              </Button>
            </Box>
          </Box>
        </Modal>
        
        {/* プロフィール表示モーダル */}
        {showProfileModal && (
          <ProfileModal
            open={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userId={selectedProfileUserId}
          />
        )}

        {/* 相性診断モーダル */}
        {selectedFriend && (
          <CompatibilityModal
            open={showCompatibilityModal}
            onClose={() => setShowCompatibilityModal(false)}
            friendId={selectedFriend.userId}
            friendData={selectedFriend}
            useEnhancedAlgorithm={true}
          />
        )}
      </Box>
    </>
  );
};

export default FriendList;