import React from 'react';
import { Grid, Paper, Box, Typography, Icon } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import TimerIcon from '@mui/icons-material/Timer';
import BlockIcon from '@mui/icons-material/Block';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtext?: string;
  subtextIcon?: React.ReactNode;
  subtextColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  bgColor,
  subtext,
  subtextIcon,
  subtextColor
}) => (
  <Paper
    elevation={1}
    sx={{
      p: 2,
      borderRadius: 2,
      backgroundColor: 'white',
      height: '100%',
    }}
  >
    <Box display="flex" alignItems="center" mb={1.5}>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: bgColor,
          mr: 1.5,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={500}>
          {value}
        </Typography>
      </Box>
    </Box>
    {subtext && (
      <Typography
        variant="caption"
        sx={{ display: 'flex', alignItems: 'center', color: subtextColor }}
      >
        {subtextIcon}
        {subtext}
      </Typography>
    )}
  </Paper>
);

interface StatisticsCardsProps {
  activeOrganizations: number;
  activeGrowth?: number;
  trialOrganizations: number;
  expiringTrials?: number;
  suspendedOrganizations: number;
  suspenedMessage?: string;
  totalStylists: number;
  stylistsGrowth?: number;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  activeOrganizations,
  activeGrowth,
  trialOrganizations,
  expiringTrials,
  suspendedOrganizations,
  suspenedMessage = '支払い未完了',
  totalStylists,
  stylistsGrowth,
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="アクティブな組織"
          value={activeOrganizations}
          icon={<BusinessIcon sx={{ color: '#43a047' }} />}
          color="#43a047"
          bgColor="#e8f5e9"
          subtext={
            activeGrowth
              ? `先月比 +${activeGrowth} (${(
                  (activeGrowth / (activeOrganizations - activeGrowth)) *
                  100
                ).toFixed(1)}%)`
              : undefined
          }
          subtextIcon={
            activeGrowth ? (
              <TrendingUpIcon
                sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }}
              />
            ) : undefined
          }
          subtextColor="#43a047"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="トライアル中"
          value={trialOrganizations}
          icon={<TimerIcon sx={{ color: '#ffb300' }} />}
          color="#ffb300"
          bgColor="#fff8e1"
          subtext={
            expiringTrials
              ? `${expiringTrials}件が7日以内に期限切れ`
              : undefined
          }
          subtextIcon={
            expiringTrials ? (
              <NotificationsIcon
                sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }}
              />
            ) : undefined
          }
          subtextColor="#ffb300"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="停止中"
          value={suspendedOrganizations}
          icon={<BlockIcon sx={{ color: '#e53935' }} />}
          color="#e53935"
          bgColor="#ffebee"
          subtext={suspenedMessage}
          subtextIcon={
            <PriorityHighIcon
              sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }}
            />
          }
          subtextColor="#e53935"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="スタイリスト総数"
          value={totalStylists}
          icon={<SupervisorAccountIcon sx={{ color: '#1e88e5' }} />}
          color="#1e88e5"
          bgColor="#e3f2fd"
          subtext={
            stylistsGrowth
              ? `先月比 +${stylistsGrowth} (${(
                  (stylistsGrowth / (totalStylists - stylistsGrowth)) *
                  100
                ).toFixed(1)}%)`
              : undefined
          }
          subtextIcon={
            stylistsGrowth ? (
              <TrendingUpIcon
                sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }}
              />
            ) : undefined
          }
          subtextColor="#1e88e5"
        />
      </Grid>
    </Grid>
  );
};

export default StatisticsCards;