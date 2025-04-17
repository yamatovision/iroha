import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Avatar, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Person } from '@mui/icons-material';
import api from '../../services/api.service';
import { TEAM } from '../../../../shared';

// スタイル設定
const SelectorContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ChipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

// チームメンバーの型定義
interface TeamMember {
  id: string;
  displayName: string;
  jobTitle?: string;
  elementAttribute?: string;
}

// コンポーネントのプロパティ
interface MemberSelectorProps {
  onMemberSelect: (memberId: string) => void;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ onMemberSelect }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // チームメンバーの取得
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const authUserResponse = await api.get(`${TEAM.LIST_TEAMS}`);
        const teams = authUserResponse.data.teams || [];
        
        if (teams.length === 0) {
          setError('所属チームがありません。チームに参加してから相性相談を利用してください。');
          setLoading(false);
          return;
        }
        
        const teamId = teams[0].id;
        const response = await api.get(`${TEAM.GET_TEAM_MEMBERS(teamId)}`);
        
        if (!response.data.members || response.data.members.length === 0) {
          setError('チームメンバーが見つかりません。');
          setMembers([]);
        } else {
          // 自分自身を除外
          const filteredMembers = response.data.members.filter(
            (member: any) => member.id !== (authUserResponse.data.user?.id)
          );
          
          if (filteredMembers.length === 0) {
            setError('相談可能なチームメンバーがいません。他のメンバーをチームに招待してください。');
          } else {
            setMembers(filteredMembers.map((m: any) => ({
              id: m.id,
              displayName: m.displayName,
              jobTitle: m.jobTitle,
              elementAttribute: m.elementAttribute
            })));
          }
        }
      } catch (error) {
        console.error('Fetch team members error:', error);
        setError('チームメンバーの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, []);

  // メンバー選択ハンドラー
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    onMemberSelect(memberId);
  };

  // 五行属性に基づいた色を返す
  const getElementColor = (element?: string) => {
    switch (element) {
      case 'wood': return '#4caf50';
      case 'fire': return '#f44336';
      case 'earth': return '#ff9800';
      case 'metal': return '#9e9e9e';
      case 'water': return '#2196f3';
      default: return undefined;
    }
  };

  if (loading) {
    return (
      <SelectorContainer sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={24} />
      </SelectorContainer>
    );
  }

  if (error) {
    return (
      <SelectorContainer>
        <Alert severity="info">{error}</Alert>
      </SelectorContainer>
    );
  }

  return (
    <SelectorContainer>
      <Typography variant="subtitle2" color="primary.dark">
        相談したいメンバーを選択
      </Typography>
      
      <ChipContainer>
        {members.map((member) => (
          <Chip
            key={member.id}
            label={member.displayName}
            onClick={() => handleMemberSelect(member.id)}
            avatar={
              <Avatar sx={{ bgcolor: getElementColor(member.elementAttribute) }}>
                <Person />
              </Avatar>
            }
            variant={selectedMemberId === member.id ? 'filled' : 'outlined'}
            color={selectedMemberId === member.id ? 'primary' : 'default'}
            clickable
            sx={{ '& .MuiChip-label': { fontWeight: 500 } }}
          />
        ))}
      </ChipContainer>
    </SelectorContainer>
  );
};

export default MemberSelector;