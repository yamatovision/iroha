# 管理者ダッシュボード実装ガイド

## 概要

管理者ダッシュボードは美容サロン全体の運営状況をひと目で把握するためのページです。本ガイドでは、ダッシュボードの実装に関する詳細な手順と注意点を説明します。

## 実装方針

### フロントエンド

1. React + Material UIを使用したシンプルで直感的なUI
2. Chart.jsを使用したデータ可視化
3. コンポーネントベースの設計でメンテナンス性を向上
4. レスポンシブデザインでモバイル/タブレット対応

### バックエンド

1. APIエンドポイントを通じて必要なデータを提供
2. MongoDB集計パイプラインを活用した効率的なデータ集計
3. キャッシュ戦略で繰り返しリクエストのパフォーマンスを最適化
4. 権限ベースのアクセス制御

## コンポーネント構成

ダッシュボードは以下のコンポーネントで構成されます：

1. **DashboardStats**: 基本統計情報（予約数、クライアント数など）の表示
2. **TokenUsageChart**: トークン使用状況のグラフ表示
3. **TokenUsageSummary**: 月間使用量サマリーの表示
4. **UnassignedAppointments**: 未担当予約リストの表示

```
Dashboard
├── DashboardStats
├── TokenUsageSection
│   ├── TokenUsageChart
│   └── TokenUsageSummary
└── UnassignedAppointments
```

## 実装手順

### 1. フロントエンド実装

#### 1.1 ダッシュボードコンテナコンポーネント

```tsx
// src/pages/Dashboard/index.tsx
import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import DashboardStats from '../../components/dashboard/DashboardStats';
import TokenUsageSection from '../../components/dashboard/TokenUsageSection';
import UnassignedAppointments from '../../components/dashboard/UnassignedAppointments';
import { DashboardStats as DashboardStatsType, TokenUsageStats, UnassignedAppointment } from '../../types';
import { fetchDashboardStats, fetchTokenUsage, fetchUnassignedAppointments } from '../../services/api.service';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageStats | null>(null);
  const [unassignedAppointments, setUnassignedAppointments] = useState<UnassignedAppointment[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 並列でデータ取得を行う
        const [statsRes, tokenUsageRes, appointmentsRes] = await Promise.all([
          fetchDashboardStats(),
          fetchTokenUsage(),
          fetchUnassignedAppointments()
        ]);
        
        setStats(statsRes.data);
        setTokenUsage(tokenUsageRes.data);
        setUnassignedAppointments(appointmentsRes.data.appointments);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // オプション: 定期的な自動更新
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000); // 5分ごとに更新
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">ダッシュボード</Typography>
        <Typography variant="body2" color="textSecondary">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </Typography>
      </Box>

      {stats && <DashboardStats stats={stats} />}
      
      {tokenUsage && <TokenUsageSection tokenUsage={tokenUsage} />}
      
      <UnassignedAppointments 
        appointments={unassignedAppointments} 
        onAssignStylist={handleAssignStylist} 
      />
    </Box>
  );

  async function handleAssignStylist(appointmentId: string, stylistId: string) {
    try {
      await assignStylistToAppointment(appointmentId, stylistId);
      // 割り当て後にデータを再取得
      const res = await fetchUnassignedAppointments();
      setUnassignedAppointments(res.data.appointments);
    } catch (error) {
      console.error('Failed to assign stylist:', error);
    }
  }
};

export default Dashboard;
```

#### 1.2 APIサービス関数

```typescript
// src/services/api.service.ts
import { API_PATHS } from '../types';
import axios from 'axios';
import { DashboardStats, TokenUsageStats, UnassignedAppointment } from '../types';

export const fetchDashboardStats = async () => {
  const response = await axios.get(API_PATHS.ADMIN.DASHBOARD.STATS);
  return response.data;
};

export const fetchTokenUsage = async (period = 'current_month') => {
  const response = await axios.get(API_PATHS.ADMIN.DASHBOARD.TOKEN_USAGE, {
    params: { period }
  });
  return response.data;
};

export const fetchUnassignedAppointments = async (date?: string) => {
  const params = date ? { date } : {};
  const response = await axios.get(API_PATHS.ADMIN.DASHBOARD.UNASSIGNED_APPOINTMENTS, {
    params
  });
  return response.data;
};

export const assignStylistToAppointment = async (appointmentId: string, stylistId: string) => {
  const response = await axios.post(
    API_PATHS.ADMIN.DASHBOARD.ASSIGN_STYLIST.replace(':appointmentId', appointmentId),
    { stylistId }
  );
  return response.data;
};
```

#### 1.3 TokenUsageSection コンポーネント

```tsx
// src/components/dashboard/TokenUsageSection.tsx
import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { TokenUsageStats } from '../../types';
import TokenUsageChart from './TokenUsageChart';
import TokenUsageSummary from './TokenUsageSummary';
import { useAuth } from '../../contexts/AuthContext';

interface TokenUsageSectionProps {
  tokenUsage: TokenUsageStats;
}

const TokenUsageSection: React.FC<TokenUsageSectionProps> = ({ tokenUsage }) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">GPT-4oトークン使用状況</Typography>
              <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <option value="current_month">今月</option>
                <option value="last_month">先月</option>
                <option value="last_3_months">過去3ヶ月</option>
              </select>
            </Box>
            <TokenUsageChart dailyUsage={tokenUsage.dailyUsage} dailyTarget={tokenUsage.dailyTarget} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>月間使用量サマリー</Typography>
            <TokenUsageSummary currentPeriod={tokenUsage.currentPeriod} />
            
            {isOwner && (
              <Button 
                fullWidth 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2, bgcolor: '#f8bbd0', color: '#c2185b', '&:hover': { bgcolor: '#f48fb1' } }}
              >
                プランアップグレード
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TokenUsageSection;
```

#### 1.4 TokenUsageChart コンポーネント

```tsx
// src/components/dashboard/TokenUsageChart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface TokenUsageChartProps {
  dailyUsage: { date: string; tokenCount: number }[];
  dailyTarget: number;
}

const TokenUsageChart: React.FC<TokenUsageChartProps> = ({ dailyUsage, dailyTarget }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // 既存のChartインスタンスがあれば破棄
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dailyUsage.map(item => item.date),
            datasets: [
              {
                label: 'トークン使用量',
                data: dailyUsage.map(item => item.tokenCount),
                backgroundColor: '#ec407a',
                borderColor: '#ec407a',
                borderWidth: 1
              },
              {
                label: '日割り目安',
                data: Array(dailyUsage.length).fill(dailyTarget),
                type: 'line',
                backgroundColor: 'transparent',
                borderColor: '#26a69a',
                borderWidth: 2,
                pointBackgroundColor: '#26a69a',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'トークン数'
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.raw.toLocaleString() + ' トークン';
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [dailyUsage, dailyTarget]);

  return (
    <div style={{ height: '250px' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default TokenUsageChart;
```

#### 1.5 TokenUsageSummary コンポーネント

```tsx
// src/components/dashboard/TokenUsageSummary.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface TokenUsageSummaryProps {
  currentPeriod: {
    usedTokens: number;
    totalTokens: number;
    usagePercentage: number;
    remainingTokens: number;
    planLimit: number;
    renewalDate: string;
  };
}

const TokenUsageSummary: React.FC<TokenUsageSummaryProps> = ({ currentPeriod }) => {
  const {
    usedTokens,
    totalTokens,
    usagePercentage,
    remainingTokens,
    planLimit,
    renewalDate
  } = currentPeriod;

  // 警告レベルの決定（80%以上で警告、95%以上で危険）
  const getBarColor = () => {
    if (usagePercentage >= 95) return '#f44336'; // 赤（危険）
    if (usagePercentage >= 80) return '#ff9800'; // オレンジ（警告）
    return '#ec407a'; // ピンク（通常）
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" fontWeight={500} color="text.secondary">使用量</Typography>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {usedTokens.toLocaleString()} / {totalTokens.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: 8, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              width: `${usagePercentage}%`, 
              height: '100%', 
              bgcolor: getBarColor(), 
              borderRadius: 1 
            }} 
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
          残り {remainingTokens.toLocaleString()} トークン
        </Typography>
      </Box>

      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">プラン上限</Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {planLimit.toLocaleString()} トークン/月
        </Typography>
      </Box>

      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">更新日</Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {new Date(renewalDate).toLocaleDateString('ja-JP')}
        </Typography>
      </Box>
    </Box>
  );
};

export default TokenUsageSummary;
```

### 2. バックエンド実装

#### 2.1 統計情報のコントローラー

```typescript
// src/controllers/admin/dashboard.controller.ts
import { Request, Response } from 'express';
import { User, Appointment, Client } from '../../models';
import TokenUsageLog from '../../models/TokenUsageLog';
import TokenChargePurchase from '../../models/TokenChargePurchase';
import { isAdmin, isOwner } from '../../utils/role-helpers';

/**
 * ダッシュボード基本統計情報を取得
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    // 本日の日付範囲を取得
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // 今週の開始日を取得
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // 並列でクエリを実行
    const [
      todayAppointments,
      clientsCount,
      stylistsCount,
      weeklyCompletedServices
    ] = await Promise.all([
      // 本日の予約数
      Appointment.countDocuments({
        organizationId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
      }),
      
      // 全クライアント数
      Client.countDocuments({ organizationId }),
      
      // スタイリスト数
      User.countDocuments({ organizationId, active: true }),
      
      // 今週の施術完了数
      Appointment.countDocuments({
        organizationId,
        startTime: { $gte: startOfWeek, $lte: endOfDay },
        status: 'completed'
      })
    ]);

    return res.json({
      success: true,
      data: {
        todayAppointments,
        clientsCount,
        stylistsCount,
        weeklyCompletedServices
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ダッシュボード統計情報の取得に失敗しました'
      }
    });
  }
};

/**
 * トークン使用状況を取得
 */
export const getTokenUsage = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const period = req.query.period as string || 'current_month';
    
    // 期間の開始日と終了日を計算
    const today = new Date();
    let startDate: Date;
    let endDate = new Date();
    
    switch (period) {
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_3_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'current_month':
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }
    
    // 組織のプラン情報を取得
    const organization = await Organization.findById(organizationId).populate('subscription');
    if (!organization || !organization.subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '組織またはサブスクリプション情報が見つかりません'
        }
      });
    }
    
    const { subscription } = organization;
    
    // 基本プラン上限を取得
    const planLimit = subscription.monthlyTokenLimit;
    
    // 追加チャージの合計を取得
    const additionalTokens = await TokenChargePurchase.aggregate([
      {
        $match: {
          organizationId,
          purchaseDate: { $gte: startDate, $lte: endDate },
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$remainingTokens' }
        }
      }
    ]);
    
    const additionalTokenAmount = additionalTokens.length > 0 ? additionalTokens[0].totalTokens : 0;
    
    // 月内の使用済みトークン数を取得
    const usedTokensResult = await TokenUsageLog.aggregate([
      {
        $match: {
          organizationId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' }
        }
      }
    ]);
    
    const usedTokens = usedTokensResult.length > 0 ? usedTokensResult[0].totalTokens : 0;
    
    // 日別の使用状況を取得
    const dailyUsage = await TokenUsageLog.aggregate([
      {
        $match: {
          organizationId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          tokenCount: { $sum: '$totalTokens' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          tokenCount: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    // 計算
    const totalTokens = planLimit + additionalTokenAmount;
    const remainingTokens = totalTokens - usedTokens;
    const usagePercentage = (usedTokens / totalTokens) * 100;
    
    // 月の日数で日割り目安を計算
    const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    const dailyTarget = Math.floor(planLimit / daysInMonth);
    
    return res.json({
      success: true,
      data: {
        currentPeriod: {
          usedTokens,
          totalTokens,
          usagePercentage,
          remainingTokens,
          planLimit,
          renewalDate: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()
        },
        dailyUsage,
        dailyTarget
      }
    });
  } catch (error) {
    console.error('Error fetching token usage:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'トークン使用状況の取得に失敗しました'
      }
    });
  }
};

/**
 * 未担当予約の一覧を取得
 */
export const getUnassignedAppointments = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const dateParam = req.query.date as string;
    
    // 日付パラメータがあれば利用、なければ本日の日付を使用
    let targetDate;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
    }
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // 未担当予約を取得（stylistIdがnullまたは未設定）
    const appointments = await Appointment.find({
      organizationId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      $or: [{ stylistId: null }, { stylistId: { $exists: false } }]
    }).populate('clientId');
    
    // APIレスポンス用にデータを整形
    const formattedAppointments = appointments.map(appointment => {
      const client = appointment.clientId;
      return {
        id: appointment._id,
        clientId: client._id,
        clientName: client.name,
        serviceType: appointment.serviceType,
        timeSlot: {
          start: appointment.startTime.toISOString(),
          end: appointment.endTime.toISOString()
        },
        elementType: client.elementType || 'wood', // デフォルト値を設定
        assigned: false
      };
    });
    
    return res.json({
      success: true,
      data: {
        appointments: formattedAppointments
      }
    });
  } catch (error) {
    console.error('Error fetching unassigned appointments:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '未担当予約の取得に失敗しました'
      }
    });
  }
};

/**
 * 予約にスタイリストを割り当て
 */
export const assignStylist = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { stylistId } = req.body;
    const organizationId = req.user.organizationId;
    
    if (!stylistId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'スタイリストIDが必要です'
        }
      });
    }
    
    // 予約が存在し、同じ組織に属しているか確認
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      organizationId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '予約が見つかりません'
        }
      });
    }
    
    // スタイリストが存在し、同じ組織に属しているか確認
    const stylist = await User.findOne({
      _id: stylistId,
      organizationId,
      active: true
    });
    
    if (!stylist) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'スタイリストが見つかりません'
        }
      });
    }
    
    // 予約を更新
    appointment.stylistId = stylistId;
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.user._id;
    await appointment.save();
    
    return res.json({
      success: true,
      data: {
        appointmentId: appointment._id,
        stylistId: stylist._id,
        stylistName: stylist.name,
        updatedAt: appointment.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error assigning stylist:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'スタイリストの割り当てに失敗しました'
      }
    });
  }
};
```

#### 2.2 ルート定義

```typescript
// src/routes/admin.routes.ts
import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasAdminRole } from '../middleware/role.middleware';
import { 
  getDashboardStats, 
  getTokenUsage, 
  getUnassignedAppointments,
  assignStylist
} from '../controllers/admin/dashboard.controller';

const router = express.Router();

// ダッシュボード関連ルート
router.get('/dashboard/stats', isAuthenticated, hasAdminRole, getDashboardStats);
router.get('/dashboard/token-usage', isAuthenticated, hasAdminRole, getTokenUsage);
router.get('/dashboard/unassigned-appointments', isAuthenticated, hasAdminRole, getUnassignedAppointments);
router.post('/appointments/:appointmentId/assign', isAuthenticated, hasAdminRole, assignStylist);

export default router;
```

## 重要なエッジケースと対処法

1. **初日・初月の処理**
   - 新規サロンの場合、使用履歴がない状態でダッシュボードを表示
   - 対策: データが存在しない場合のデフォルト値を設定（空の配列や0など）

2. **権限による表示制御**
   - Ownerのみが見るべき項目（プランアップグレードボタンなど）がある
   - 対策: フロントエンドで `useAuth` フックを使用してロールに基づき表示切り替え

3. **トークン制限超過時の挙動**
   - 使用量が100%を超えた場合のUI表示と機能制限
   - 対策: 使用率に応じた視覚的フィードバック（色変更など）とAPI側での制限処理

4. **大量データ時のパフォーマンス**
   - 多数の予約がある場合のパフォーマンス低下
   - 対策: ページネーション実装とクエリの最適化

## テスト戦略

1. **ユニットテスト**
   - 各コンポーネントの独立したテスト
   - 特にTokenUsageChartのレンダリングテスト

2. **統合テスト**
   - API呼び出しとデータ表示の連携テスト
   - モックAPIレスポンスを使用したテスト

3. **E2Eテスト**
   - 実際のユーザーフローに基づく一連の操作テスト
   - スタイリスト割り当て操作のテスト

## パフォーマンス最適化

1. **キャッシュ戦略**
   - ダッシュボード統計情報のサーバーサイドキャッシュ（5分間など）
   - クライアントサイドでのメモ化（React.useMemo, React.useCallback）

2. **バンドルサイズ最適化**
   - Chart.jsの部分的インポート
   - コード分割（React.lazy, import()）の活用

3. **APIレスポンス最適化**
   - MongoDBインデックスの適切な設定
   - 集計クエリの効率化（特にトークン使用量集計）

## 段階的リリース戦略

1. **フェーズ1**: 基本統計情報表示
   - 予約数、クライアント数などの基本情報表示
   - シンプルなカード形式UI

2. **フェーズ2**: トークン使用状況追加
   - グラフ表示とサマリー情報の追加
   - 使用率に応じた視覚的フィードバック

3. **フェーズ3**: 未担当予約管理
   - 未担当予約一覧と割り当て機能
   - 五行属性に基づく視覚的表示

## 追加検討事項

1. **カスタマイズ可能なダッシュボード**
   - 将来的な拡張として、ユーザーが表示項目を選択できる機能

2. **リアルタイム更新**
   - WebSocketを使用したリアルタイムデータ更新
   - 特に未担当予約の状態変化の即時反映

3. **モバイル最適化UI**
   - スマートフォン表示時の最適化レイアウト
   - タッチジェスチャー対応