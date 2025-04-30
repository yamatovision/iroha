# 美姫命 - 予約・担当管理システム実装ガイド

このドキュメントは美姫命アプリケーションの予約・担当管理システムの実装方法について詳細に説明します。

## 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [バックエンド実装](#バックエンド実装)
4. [フロントエンド実装](#フロントエンド実装)
5. [統合テスト](#統合テスト)
6. [デプロイメント考慮事項](#デプロイメント考慮事項)

## 概要

予約・担当管理システムは、美容サロンのスタイリストとクライアントの予約を効率的に管理し、四柱推命に基づいた相性スコアを活用してスタイリストの割り当てを最適化するためのモジュールです。

### 主要機能

- 日付別クライアント予約の管理
- スタイリスト割り当て（相性スコアに基づく最適化）
- タイムスロット管理
- 外部カレンダー（Google/Apple）との同期
- 予約分析と統計

## アーキテクチャ

### システム構成図

```
クライアント層 (React)
    │
    ├── 予約ダッシュボード
    │   ├── 日付選択コンポーネント
    │   ├── タイムスロットグリッド
    │   ├── クライアントカード
    │   └── スタイリスト選択モーダル
    │
    ├── カレンダー同期コンポーネント
    │
    v
API層 (Express)
    │
    ├── 予約管理API
    │   ├── 予約CRUD操作
    │   ├── タイムスロット管理
    │   └── スタイリスト割り当て
    │
    ├── カレンダー同期API
    │
    ├── 相性計算サービス
    │
    v
データ層 (MongoDB)
    │
    ├── 予約コレクション
    ├── タイムスロットコレクション
    ├── カレンダー同期ログ
    └── クライアント-スタイリスト相性
```

### 技術スタック

- **フロントエンド**: React, TypeScript, Material UI
- **バックエンド**: Node.js, Express, TypeScript
- **データベース**: MongoDB
- **認証**: JWT
- **外部API**: Google Calendar API, Apple Calendar API
- **テスト**: Jest, React Testing Library

## バックエンド実装

### 1. モデル実装

まず、[データモデル設計](/docs/data_models/beauty-appointment-management.md)に基づいて以下のモデルを実装します。

#### 1.1 Appointment モデル

`server/src/models/Appointment.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { ITimeSlot } from './TimeSlot';
import { IClient } from './Client';

export interface IAppointment extends Document {
  client: mongoose.Types.ObjectId | IClient;
  stylist: mongoose.Types.ObjectId | IUser;
  timeSlot: mongoose.Types.ObjectId | ITimeSlot;
  service: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  compatibilityScore: number;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  externalCalendarId?: string;
  externalCalendarSource?: 'google' | 'apple' | null;
}

const AppointmentSchema: Schema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    stylist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // 初期段階では未割り当てが可能
    },
    timeSlot: {
      type: Schema.Types.ObjectId,
      ref: 'TimeSlot',
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    compatibilityScore: {
      type: Number,
      default: 0,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    externalCalendarId: {
      type: String,
      default: null,
    },
    externalCalendarSource: {
      type: String,
      enum: ['google', 'apple', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// インデックス作成
AppointmentSchema.index({ client: 1, timeSlot: 1 }, { unique: true });
AppointmentSchema.index({ stylist: 1, timeSlot: 1 });
AppointmentSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
```

#### 1.2 TimeSlot モデル

`server/src/models/TimeSlot.ts`も同様に実装します。

### 2. サービス実装

#### 2.1 予約管理サービス

`server/src/services/appointment.service.ts`

```typescript
import Appointment, { IAppointment } from '../models/Appointment';
import TimeSlot from '../models/TimeSlot';
import { calculateCompatibility } from './compatibility.service';
import mongoose from 'mongoose';

export class AppointmentService {
  // 予約の作成
  async createAppointment(appointmentData: Partial<IAppointment>): Promise<IAppointment> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // タイムスロットの存在確認と重複チェック
      const existingSlot = await TimeSlot.findById(appointmentData.timeSlot).session(session);
      if (!existingSlot) {
        throw new Error('指定されたタイムスロットが存在しません');
      }
      
      // 既存の予約との重複チェック
      const existingAppointment = await Appointment.findOne({
        timeSlot: appointmentData.timeSlot,
        status: 'scheduled'
      }).session(session);
      
      if (existingAppointment) {
        throw new Error('このタイムスロットは既に予約されています');
      }
      
      // スタイリストが指定されている場合は相性スコアを計算
      if (appointmentData.stylist && appointmentData.client) {
        appointmentData.compatibilityScore = await calculateCompatibility(
          appointmentData.client,
          appointmentData.stylist
        );
      }
      
      // 予約の作成
      const appointment = new Appointment(appointmentData);
      await appointment.save({ session });
      
      // トランザクションのコミット
      await session.commitTransaction();
      return appointment;
    } catch (error) {
      // エラー発生時はロールバック
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // その他のメソッド（予約の取得、更新、削除など）も実装
  // ...
}

export default new AppointmentService();
```

#### 2.2 スタイリスト推奨サービス

`server/src/services/stylist-recommendation.service.ts`

```typescript
import User from '../models/User';
import Client from '../models/Client';
import { calculateCompatibility } from './compatibility.service';

export class StylistRecommendationService {
  // 相性スコアに基づくスタイリスト推奨
  async getRecommendedStylists(
    clientId: string,
    organizationId: string
  ) {
    // クライアント情報の取得
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('クライアントが見つかりません');
    }
    
    // 対象組織のスタイリスト一覧を取得
    const stylists = await User.find({
      organizationId,
      role: { $in: ['STYLIST', 'ADMIN'] }, // スタイリストまたは管理者権限を持つユーザー
      isActive: true
    });
    
    // 各スタイリストとの相性スコアを計算
    const stylistsWithScore = await Promise.all(
      stylists.map(async (stylist) => {
        const compatibilityScore = await calculateCompatibility(client._id, stylist._id);
        return {
          stylist,
          compatibilityScore
        };
      })
    );
    
    // 相性スコアに基づいてソート（降順）
    return stylistsWithScore.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}

export default new StylistRecommendationService();
```

#### 2.3 カレンダー同期サービス

`server/src/services/calendar-sync.service.ts`

```typescript
import { google } from 'googleapis';
import Appointment from '../models/Appointment';
import CalendarSync from '../models/CalendarSync';
import SyncLog from '../models/SyncLog';

export class CalendarSyncService {
  // Google Calendarとの同期
  async syncWithGoogleCalendar(userId: string, organizationId: string) {
    try {
      // 認証情報の取得
      const calendarSync = await CalendarSync.findOne({ 
        userId,
        provider: 'google',
        organizationId
      });
      
      if (!calendarSync || !calendarSync.accessToken) {
        throw new Error('Google Calendarの認証情報が設定されていません');
      }
      
      // GoogleカレンダーAPIのセットアップ
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: calendarSync.accessToken });
      const calendar = google.calendar({ version: 'v3', auth });
      
      // Googleカレンダーからイベントを取得
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      const events = response.data.items;
      
      // 同期処理の実装（省略）...
      
      // 同期ログの記録
      await new SyncLog({
        userId,
        organizationId,
        provider: 'google',
        syncedEvents: events.length,
        status: 'success'
      }).save();
      
      return { status: 'success', syncedEvents: events.length };
    } catch (error) {
      // エラーログの記録
      await new SyncLog({
        userId,
        organizationId,
        provider: 'google',
        status: 'error',
        errorMessage: error.message
      }).save();
      
      throw error;
    }
  }
  
  // Apple Calendarとの同期
  // ...
}

export default new CalendarSyncService();
```

### 3. コントローラー実装

#### 3.1 予約管理コントローラー

`server/src/controllers/appointment.controller.ts`

```typescript
import { Request, Response } from 'express';
import appointmentService from '../services/appointment.service';
import { errorHandler } from '../utils/error-handler';

export class AppointmentController {
  // 予約の作成
  async createAppointment(req: Request, res: Response) {
    try {
      const { client, timeSlot, service, notes, stylist } = req.body;
      const organizationId = req.user.organizationId;
      
      const appointment = await appointmentService.createAppointment({
        client,
        timeSlot,
        service,
        notes,
        stylist,
        organizationId
      });
      
      return res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      return errorHandler(error, req, res);
    }
  }
  
  // 予約の取得
  async getAppointments(req: Request, res: Response) {
    try {
      const { date, status, stylist, page = 1, limit = 20 } = req.query;
      const organizationId = req.user.organizationId;
      
      const appointments = await appointmentService.getAppointments({
        date: date as string,
        status: status as string,
        stylist: stylist as string,
        organizationId,
        page: Number(page),
        limit: Number(limit)
      });
      
      return res.status(200).json({ success: true, data: appointments });
    } catch (error) {
      return errorHandler(error, req, res);
    }
  }
  
  // その他のエンドポイント（更新、削除、詳細取得など）
  // ...
}

export default new AppointmentController();
```

### 4. ルート設定

`server/src/routes/appointment.routes.ts`

```typescript
import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';
import stylistRecommendationController from '../controllers/stylist-recommendation.controller';
import calendarSyncController from '../controllers/calendar-sync.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

// 認証とロールチェックのミドルウェア
const authAdmin = [authMiddleware, roleMiddleware(['ADMIN', 'OWNER', 'SUPER_ADMIN'])];
const authStylist = [authMiddleware, roleMiddleware(['STYLIST', 'ADMIN', 'OWNER', 'SUPER_ADMIN'])];

// 予約管理API
router.post('/appointments', authAdmin, appointmentController.createAppointment);
router.get('/appointments', authStylist, appointmentController.getAppointments);
router.get('/appointments/:id', authStylist, appointmentController.getAppointmentById);
router.put('/appointments/:id', authAdmin, appointmentController.updateAppointment);
router.delete('/appointments/:id', authAdmin, appointmentController.deleteAppointment);
router.put('/appointments/:id/status', authStylist, appointmentController.updateAppointmentStatus);

// スタイリスト割り当てAPI
router.get('/appointments/:id/recommended-stylists', authAdmin, stylistRecommendationController.getRecommendedStylists);
router.put('/appointments/:id/stylist', authAdmin, appointmentController.assignStylist);

// タイムスロット管理API
router.post('/timeslots', authAdmin, appointmentController.createTimeSlot);
router.get('/timeslots', authStylist, appointmentController.getTimeSlots);
router.put('/timeslots/:id', authAdmin, appointmentController.updateTimeSlot);
router.delete('/timeslots/:id', authAdmin, appointmentController.deleteTimeSlot);

// カレンダー同期API
router.get('/calendar/auth/google', authStylist, calendarSyncController.googleAuthUrl);
router.get('/calendar/auth/google/callback', calendarSyncController.googleAuthCallback);
router.post('/calendar/sync/google', authStylist, calendarSyncController.syncWithGoogleCalendar);
router.get('/calendar/auth/apple', authStylist, calendarSyncController.appleAuthUrl);
router.get('/calendar/auth/apple/callback', calendarSyncController.appleAuthCallback);
router.post('/calendar/sync/apple', authStylist, calendarSyncController.syncWithAppleCalendar);

export default router;
```

## フロントエンド実装

### 1. 状態管理

#### 1.1 予約状態管理

`client/src/contexts/AppointmentContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import appointmentService from '../services/appointment.service';

interface AppointmentContextType {
  appointments: any[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  fetchAppointments: (date?: Date) => Promise<void>;
  createAppointment: (appointmentData: any) => Promise<any>;
  updateAppointment: (id: string, data: any) => Promise<any>;
  deleteAppointment: (id: string) => Promise<boolean>;
  assignStylist: (appointmentId: string, stylistId: string) => Promise<any>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchAppointments = async (date: Date = selectedDate) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await appointmentService.getAppointments(formattedDate);
      setAppointments(response.data);
    } catch (err) {
      setError('予約データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentService.createAppointment(appointmentData);
      setAppointments([...appointments, response.data]);
      return response.data;
    } catch (err) {
      setError('予約の作成に失敗しました');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // その他のメソッド実装
  const updateAppointment = async (id: string, data: any) => {
    /* 実装省略 */
    return null;
  };
  
  const deleteAppointment = async (id: string) => {
    /* 実装省略 */
    return false;
  };
  
  const assignStylist = async (appointmentId: string, stylistId: string) => {
    /* 実装省略 */
    return null;
  };

  // 初期ロード時に当日の予約を取得
  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // 日付選択が変更されたら予約を再取得
  useEffect(() => {
    if (user) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        error,
        selectedDate,
        setSelectedDate,
        fetchAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        assignStylist,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
```

### 2. APIサービス

`client/src/services/appointment.service.ts`

```typescript
import api from './api.service';

class AppointmentService {
  // 予約の取得
  getAppointments(date: string, status?: string, stylistId?: string) {
    const params = { date };
    if (status) params['status'] = status;
    if (stylistId) params['stylist'] = stylistId;
    
    return api.get('/appointments', { params });
  }
  
  // 予約の詳細取得
  getAppointmentById(id: string) {
    return api.get(`/appointments/${id}`);
  }
  
  // 予約の作成
  createAppointment(appointmentData: any) {
    return api.post('/appointments', appointmentData);
  }
  
  // 予約の更新
  updateAppointment(id: string, data: any) {
    return api.put(`/appointments/${id}`, data);
  }
  
  // 予約の削除
  deleteAppointment(id: string) {
    return api.delete(`/appointments/${id}`);
  }
  
  // 予約ステータスの更新
  updateAppointmentStatus(id: string, status: string) {
    return api.put(`/appointments/${id}/status`, { status });
  }
  
  // スタイリスト割り当て
  assignStylist(appointmentId: string, stylistId: string) {
    return api.put(`/appointments/${appointmentId}/stylist`, { stylistId });
  }
  
  // おすすめスタイリストの取得
  getRecommendedStylists(appointmentId: string) {
    return api.get(`/appointments/${appointmentId}/recommended-stylists`);
  }
  
  // タイムスロット関連
  getTimeSlots(date: string) {
    return api.get('/timeslots', { params: { date } });
  }
  
  createTimeSlot(timeSlotData: any) {
    return api.post('/timeslots', timeSlotData);
  }
  
  // カレンダー同期関連
  getGoogleAuthUrl() {
    return api.get('/calendar/auth/google');
  }
  
  syncWithGoogleCalendar() {
    return api.post('/calendar/sync/google');
  }
  
  getAppleAuthUrl() {
    return api.get('/calendar/auth/apple');
  }
  
  syncWithAppleCalendar() {
    return api.post('/calendar/sync/apple');
  }
}

export default new AppointmentService();
```

### 3. コンポーネント実装

#### 3.1 予約ダッシュボード

`client/src/pages/Appointments/index.tsx`

```tsx
import React, { useState } from 'react';
import { Grid, Paper, Typography, Box, Tabs, Tab, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useAppointments } from '../../contexts/AppointmentContext';
import AppointmentList from '../../components/appointment/AppointmentList';
import TimeSlotGrid from '../../components/appointment/TimeSlotGrid';
import CalendarSyncButton from '../../components/appointment/CalendarSyncButton';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const AppointmentDashboard: React.FC = () => {
  const { 
    appointments, 
    loading, 
    error, 
    selectedDate, 
    setSelectedDate 
  } = useAppointments();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const handleViewChange = (event: React.SyntheticEvent, newValue: 'list' | 'grid') => {
    setView(newValue);
  };

  const handleStatusFilter = (status: string | null) => {
    setFilterStatus(status);
  };

  // 予約をフィルタリング
  const filteredAppointments = appointments.filter(appt => 
    filterStatus === null || appt.status === filterStatus
  );

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            予約管理
          </Typography>
          <CalendarSyncButton />
        </Grid>
        
        <Grid item xs={12} sm={4} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <DatePicker
              label="日付選択"
              value={selectedDate}
              onChange={(newDate) => newDate && setSelectedDate(newDate)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {format(selectedDate, 'yyyy年MM月dd日 (EEE)', { locale: ja })}
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              ステータスフィルター
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Button 
                variant={filterStatus === null ? 'contained' : 'outlined'} 
                onClick={() => handleStatusFilter(null)}
                sx={{ mb: 1 }}
              >
                すべて
              </Button>
              <Button 
                variant={filterStatus === 'scheduled' ? 'contained' : 'outlined'} 
                onClick={() => handleStatusFilter('scheduled')}
                sx={{ mb: 1 }}
              >
                予約済み
              </Button>
              <Button 
                variant={filterStatus === 'completed' ? 'contained' : 'outlined'} 
                onClick={() => handleStatusFilter('completed')}
                sx={{ mb: 1 }}
              >
                完了
              </Button>
              <Button 
                variant={filterStatus === 'cancelled' ? 'contained' : 'outlined'} 
                onClick={() => handleStatusFilter('cancelled')}
                sx={{ mb: 1 }}
              >
                キャンセル
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={8} md={9}>
          <Paper sx={{ p: 2 }}>
            <Tabs
              value={view}
              onChange={handleViewChange}
              sx={{ mb: 2 }}
            >
              <Tab label="リスト表示" value="list" />
              <Tab label="グリッド表示" value="grid" />
            </Tabs>
            
            {loading ? (
              <LoadingIndicator />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <>
                {view === 'list' ? (
                  <AppointmentList appointments={filteredAppointments} />
                ) : (
                  <TimeSlotGrid appointments={filteredAppointments} date={selectedDate} />
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentDashboard;
```

#### 3.2 予約リストコンポーネント

`client/src/components/appointment/AppointmentList.tsx`

```tsx
import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Box,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog
} from '@mui/material';
import { Edit, Delete, PersonAdd, AccessTime } from '@mui/icons-material';
import { format } from 'date-fns';
import { useAppointments } from '../../contexts/AppointmentContext';
import StylistAssignmentModal from './StylistAssignmentModal';
import EditAppointmentModal from './EditAppointmentModal';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface AppointmentListProps {
  appointments: any[];
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments }) => {
  const { deleteAppointment } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isStylistModalOpen, setStylistModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStylistAssign = (appointment: any) => {
    setSelectedAppointment(appointment);
    setStylistModalOpen(true);
  };

  const handleEdit = (appointment: any) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleDelete = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedAppointment) {
      await deleteAppointment(selectedAppointment._id);
      setDeleteDialogOpen(false);
    }
  };

  // 予約ステータスに応じた色とラベルを取得
  const getStatusChip = (status: string) => {
    let color: 'success' | 'error' | 'warning' | 'default' = 'default';
    let label = '';
    
    switch (status) {
      case 'scheduled':
        color = 'default';
        label = '予約済み';
        break;
      case 'completed':
        color = 'success';
        label = '完了';
        break;
      case 'cancelled':
        color = 'error';
        label = 'キャンセル';
        break;
      case 'no-show':
        color = 'warning';
        label = '無断キャンセル';
        break;
    }
    
    return (
      <Chip 
        size="small" 
        color={color} 
        label={label} 
      />
    );
  };

  return (
    <>
      <List>
        {appointments.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            予約が見つかりません
          </Typography>
        ) : (
          appointments.map((appointment) => (
            <ListItem key={appointment._id} sx={{ mb: 2, display: 'block', p: 0 }}>
              <Card variant="outlined" sx={{ width: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" component="div">
                        {appointment.client.name}様
                      </Typography>
                      <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                        <AccessTime fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {format(new Date(appointment.timeSlot.startTime), 'HH:mm')} - 
                          {format(new Date(appointment.timeSlot.endTime), 'HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        サービス: {appointment.service}
                      </Typography>
                      {appointment.notes && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          メモ: {appointment.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box textAlign="right">
                      {getStatusChip(appointment.status)}
                      
                      {appointment.stylist ? (
                        <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                          <Avatar 
                            src={appointment.stylist.profileImage} 
                            sx={{ width: 24, height: 24, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {appointment.stylist.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 2 }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<PersonAdd />}
                            onClick={() => handleStylistAssign(appointment)}
                          >
                            担当者割り当て
                          </Button>
                        </Box>
                      )}
                      
                      {appointment.compatibilityScore > 0 && (
                        <Chip 
                          label={`相性スコア: ${appointment.compatibilityScore}%`}
                          size="small"
                          sx={{ 
                            mt: 1, 
                            bgcolor: 
                              appointment.compatibilityScore >= 80 ? 'success.light' : 
                              appointment.compatibilityScore >= 60 ? 'info.light' : 
                              appointment.compatibilityScore >= 40 ? 'warning.light' : 'error.light'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => handleEdit(appointment)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(appointment)}>
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </ListItem>
          ))
        )}
      </List>
      
      {/* スタイリスト割り当てモーダル */}
      <StylistAssignmentModal 
        open={isStylistModalOpen}
        onClose={() => setStylistModalOpen(false)}
        appointment={selectedAppointment}
      />
      
      {/* 予約編集モーダル */}
      <EditAppointmentModal 
        open={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        appointment={selectedAppointment}
      />
      
      {/* 削除確認ダイアログ */}
      <ConfirmationDialog 
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="予約の削除"
        content="この予約を削除してもよろしいですか？この操作は元に戻せません。"
      />
    </>
  );
};

export default AppointmentList;
```

#### 3.3 スタイリスト割り当てモーダル

`client/src/components/appointment/StylistAssignmentModal.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Chip, 
  Typography, 
  Box, 
  CircularProgress 
} from '@mui/material';
import appointmentService from '../../services/appointment.service';
import { useAppointments } from '../../contexts/AppointmentContext';

interface StylistAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment: any;
}

const StylistAssignmentModal: React.FC<StylistAssignmentModalProps> = ({
  open,
  onClose,
  appointment
}) => {
  const { assignStylist } = useAppointments();
  const [recommendedStylists, setRecommendedStylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && appointment) {
      fetchRecommendedStylists();
    }
  }, [open, appointment]);

  const fetchRecommendedStylists = async () => {
    if (!appointment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentService.getRecommendedStylists(appointment._id);
      setRecommendedStylists(response.data);
    } catch (err) {
      setError('スタイリストデータの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStylist = async (stylistId: string) => {
    if (!appointment) return;
    
    try {
      await assignStylist(appointment._id, stylistId);
      onClose();
    } catch (err) {
      setError('スタイリストの割り当てに失敗しました');
      console.error(err);
    }
  };

  // 相性スコアに基づく色を取得
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'info.main';
    if (score >= 40) return 'warning.main';
    return 'error.main';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>担当スタイリストの割り当て</DialogTitle>
      <DialogContent>
        {appointment && (
          <Typography variant="subtitle1" gutterBottom>
            {appointment.client.name}様の予約にスタイリストを割り当てます
          </Typography>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <List>
            {recommendedStylists.length === 0 ? (
              <Typography variant="body1" sx={{ p: 2 }}>
                スタイリストが見つかりません
              </Typography>
            ) : (
              recommendedStylists.map(({ stylist, compatibilityScore }) => (
                <ListItem 
                  key={stylist._id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAssignStylist(stylist._id)}
                    >
                      割り当て
                    </Button>
                  }
                  sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar src={stylist.profileImage} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={stylist.name}
                    secondary={
                      <Box display="flex" alignItems="center" mt={1}>
                        <Chip 
                          label={`相性スコア: ${compatibilityScore}%`}
                          size="small"
                          sx={{ bgcolor: getScoreColor(compatibilityScore), color: 'white' }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StylistAssignmentModal;
```

#### 3.4 カレンダー同期ボタン

`client/src/components/appointment/CalendarSyncButton.tsx`

```tsx
import React, { useState } from 'react';
import { Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, CircularProgress } from '@mui/material';
import { Sync, Google, Apple } from '@mui/icons-material';
import appointmentService from '../../services/appointment.service';

const CalendarSyncButton: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleGoogleSync = async () => {
    handleClose();
    setSyncInProgress(true);
    setDialogOpen(true);
    
    try {
      // Google認証URLを取得
      const authUrlResponse = await appointmentService.getGoogleAuthUrl();
      const authUrl = authUrlResponse.data.url;
      
      // 新しいウィンドウで認証ページを開く
      const authWindow = window.open(authUrl, '_blank', 'width=600,height=600');
      
      // ここでは認証後のコールバック処理を簡略化しています
      // 実際の実装では、callbackを処理する必要があります
      
      // 同期処理
      const syncResponse = await appointmentService.syncWithGoogleCalendar();
      
      setSyncResult({
        success: true,
        message: `同期が完了しました。${syncResponse.data.syncedEvents}件のイベントを同期しました。`
      });
    } catch (error) {
      console.error('Google Calendar同期エラー:', error);
      setSyncResult({
        success: false,
        message: '同期中にエラーが発生しました。'
      });
    } finally {
      setSyncInProgress(false);
    }
  };
  
  const handleAppleSync = async () => {
    // Appleカレンダー同期の実装
    // Google同様の流れで実装
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSyncResult(null);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Sync />}
        onClick={handleClick}
      >
        カレンダー同期
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleGoogleSync}>
          <Google sx={{ mr: 1 }} /> Googleカレンダー
        </MenuItem>
        <MenuItem onClick={handleAppleSync}>
          <Apple sx={{ mr: 1 }} /> Appleカレンダー
        </MenuItem>
      </Menu>
      
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>カレンダー同期</DialogTitle>
        <DialogContent>
          {syncInProgress ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>同期中です。しばらくお待ちください...</Typography>
            </Box>
          ) : syncResult && (
            <Typography color={syncResult.success ? 'success.main' : 'error'}>
              {syncResult.message}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={syncInProgress}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CalendarSyncButton;
```

### 4. ルーティング設定

`client/src/App.tsx`に予約管理ページへのルートを追加します：

```tsx
// 既存のインポートに追加
import { AppointmentProvider } from './contexts/AppointmentContext';
import AppointmentDashboard from './pages/Appointments';

// ルートの追加
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 既存のルート */}
          
          {/* 予約管理ルート */}
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute roles={['ADMIN', 'OWNER', 'SUPER_ADMIN', 'STYLIST']}>
                <AppointmentProvider>
                  <AppointmentDashboard />
                </AppointmentProvider>
              </ProtectedRoute>
            } 
          />
          
          {/* その他のルート */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}
```

## 統合テスト

### 1. バックエンドテスト

`server/src/tests/services/appointment.service.test.ts`

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Appointment from '../../models/Appointment';
import TimeSlot from '../../models/TimeSlot';
import User from '../../models/User';
import Client from '../../models/Client';
import appointmentService from '../../services/appointment.service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Appointment.deleteMany({});
  await TimeSlot.deleteMany({});
  await User.deleteMany({});
  await Client.deleteMany({});
});

describe('AppointmentService', () => {
  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      // テストデータのセットアップ
      const client = await new Client({
        name: 'テストクライアント',
        email: 'test@example.com',
        phone: '090-1234-5678',
        birthdate: new Date('1990-01-01'),
        organizationId: new mongoose.Types.ObjectId(),
      }).save();
      
      const stylist = await new User({
        name: 'テストスタイリスト',
        email: 'stylist@example.com',
        role: 'STYLIST',
        organizationId: client.organizationId,
      }).save();
      
      const timeSlot = await new TimeSlot({
        startTime: new Date('2025-05-01T10:00:00'),
        endTime: new Date('2025-05-01T11:00:00'),
        organizationId: client.organizationId,
      }).save();
      
      // テスト実行
      const appointment = await appointmentService.createAppointment({
        client: client._id,
        stylist: stylist._id,
        timeSlot: timeSlot._id,
        service: 'カット',
        notes: 'テストメモ',
        organizationId: client.organizationId,
      });
      
      // アサーション
      expect(appointment).toBeDefined();
      expect(appointment.client.toString()).toBe(client._id.toString());
      expect(appointment.stylist.toString()).toBe(stylist._id.toString());
      expect(appointment.timeSlot.toString()).toBe(timeSlot._id.toString());
      expect(appointment.service).toBe('カット');
      expect(appointment.notes).toBe('テストメモ');
      expect(appointment.status).toBe('scheduled');
    });
    
    it('should throw an error if the time slot is already booked', async () => {
      // テストデータのセットアップ
      const organizationId = new mongoose.Types.ObjectId();
      const client1 = await new Client({
        name: 'クライアント1',
        email: 'client1@example.com',
        organizationId,
      }).save();
      
      const client2 = await new Client({
        name: 'クライアント2',
        email: 'client2@example.com',
        organizationId,
      }).save();
      
      const timeSlot = await new TimeSlot({
        startTime: new Date('2025-05-01T10:00:00'),
        endTime: new Date('2025-05-01T11:00:00'),
        organizationId,
      }).save();
      
      // 最初の予約を作成
      await appointmentService.createAppointment({
        client: client1._id,
        timeSlot: timeSlot._id,
        service: 'カット',
        organizationId,
      });
      
      // 同じタイムスロットで2つ目の予約を試みる
      await expect(appointmentService.createAppointment({
        client: client2._id,
        timeSlot: timeSlot._id,
        service: 'カラー',
        organizationId,
      })).rejects.toThrow('このタイムスロットは既に予約されています');
    });
    
    // その他のテストケース
  });
  
  // 他のメソッドのテスト
});
```

### 2. フロントエンドテスト

`client/src/tests/components/appointment/AppointmentList.test.tsx`

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppointmentList from '../../../components/appointment/AppointmentList';
import { AppointmentProvider } from '../../../contexts/AppointmentContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

// モックデータ
const mockAppointments = [
  {
    _id: '1',
    client: {
      _id: 'c1',
      name: 'テスト太郎',
    },
    stylist: {
      _id: 's1',
      name: 'スタイリストA',
      profileImage: '',
    },
    timeSlot: {
      _id: 'ts1',
      startTime: '2025-05-01T10:00:00',
      endTime: '2025-05-01T11:00:00',
    },
    service: 'カット',
    notes: 'テストメモ',
    status: 'scheduled',
    compatibilityScore: 85,
    organizationId: 'org1',
  },
  {
    _id: '2',
    client: {
      _id: 'c2',
      name: '山田花子',
    },
    stylist: null,
    timeSlot: {
      _id: 'ts2',
      startTime: '2025-05-01T13:00:00',
      endTime: '2025-05-01T14:30:00',
    },
    service: 'カラー',
    notes: '',
    status: 'scheduled',
    compatibilityScore: 0,
    organizationId: 'org1',
  },
];

// モックサービス
jest.mock('../../../services/appointment.service', () => ({
  __esModule: true,
  default: {
    getRecommendedStylists: jest.fn().mockResolvedValue({
      data: [
        {
          stylist: {
            _id: 's1',
            name: 'スタイリストA',
            profileImage: '',
          },
          compatibilityScore: 85,
        },
        {
          stylist: {
            _id: 's2',
            name: 'スタイリストB',
            profileImage: '',
          },
          compatibilityScore: 70,
        },
      ],
    }),
    assignStylist: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

// コンテキストのモック
jest.mock('../../../contexts/AppointmentContext', () => ({
  ...jest.requireActual('../../../contexts/AppointmentContext'),
  useAppointments: () => ({
    deleteAppointment: jest.fn().mockResolvedValue(true),
    assignStylist: jest.fn().mockResolvedValue({}),
  }),
}));

describe('AppointmentList Component', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <AppointmentProvider>
            <AppointmentList appointments={mockAppointments} />
          </AppointmentProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('should render the list of appointments', () => {
    renderComponent();
    
    // 予約が表示されていることを確認
    expect(screen.getByText('テスト太郎様')).toBeInTheDocument();
    expect(screen.getByText('山田花子様')).toBeInTheDocument();
    
    // サービス情報が表示されていることを確認
    expect(screen.getByText('サービス: カット')).toBeInTheDocument();
    expect(screen.getByText('サービス: カラー')).toBeInTheDocument();
    
    // スタイリスト情報が表示されていることを確認
    expect(screen.getByText('スタイリストA')).toBeInTheDocument();
    
    // スタイリストが割り当てられていない予約には割り当てボタンが表示されることを確認
    expect(screen.getByText('担当者割り当て')).toBeInTheDocument();
    
    // 相性スコアが表示されていることを確認
    expect(screen.getByText('相性スコア: 85%')).toBeInTheDocument();
  });

  it('should open stylist assignment modal when assign button is clicked', () => {
    renderComponent();
    
    // 担当者割り当てボタンをクリック
    fireEvent.click(screen.getByText('担当者割り当て'));
    
    // モーダルが開くことを確認
    expect(screen.getByText('担当スタイリストの割り当て')).toBeInTheDocument();
  });
  
  // その他のテストケース
});
```

## デプロイメント考慮事項

### 1. パフォーマンス最適化

- **バルクオペレーション**: 多数の予約データを扱う場合、一括操作を使用してデータベース負荷を軽減
- **インデックス最適化**: 頻繁に使用されるクエリフィールドにはインデックスを設定
- **キャッシュ戦略**: 頻繁にアクセスされるデータ（予約一覧、スタイリストリストなど）にはRedisなどを使用したキャッシュを導入
- **ページネーション**: 大量のデータを表示する画面ではページネーションを実装

### 2. セキュリティ

- **認証と認可**: すべてのAPIはJWT認証とロールベースのアクセス制御を実装
- **データ検証**: すべてのユーザー入力は適切にバリデーションを行い、安全でない入力を除外
- **APIレート制限**: 短時間での多数のリクエストを防ぐためのレート制限を実装
- **セキュアな外部API接続**: Google/Appleカレンダー連携では適切な認証と暗号化を実装

### 3. 運用監視

- **エラーロギング**: すべての例外とエラーはログに記録し、重大な問題はアラートとして通知
- **パフォーマンスモニタリング**: APIレスポンスタイムとデータベースクエリのパフォーマンスを監視
- **使用状況分析**: 予約システムの使用パターンを分析し、改善点を特定

### 4. スケーラビリティ

- **水平スケーリング**: 負荷が増加した場合にサーバーインスタンスを追加できるように設計
- **非同期処理**: カレンダー同期などの時間のかかる処理はバックグラウンドタスクとして実装
- **マイクロサービスアーキテクチャ**: 将来的な拡張性を考慮し、予約管理を独立したマイクロサービスとして実装することも検討

## 結論

このガイドでは、美姫命アプリケーションの予約・担当管理システムの実装方法について詳細に説明しました。このシステムは四柱推命に基づいた相性スコアを活用して、クライアントに最適なスタイリストを割り当てることができます。バックエンドからフロントエンドまでの実装手順を示し、テスト方法やデプロイメント考慮事項についても解説しました。このガイドに従って実装することで、効率的で使いやすい予約管理システムを構築できます。