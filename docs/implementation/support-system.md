# サポートチケットシステム実装ガイド

## 概要

サポートチケットシステムは、サロン管理者とスーパー管理者間のコミュニケーションを効率化する機能です。サロン側からの質問や問い合わせをチケット形式で管理し、スーパー管理者側で一元的に対応することができます。

本ドキュメントでは、サポートチケットシステムの実装方法について説明します。

## システム構成

サポートチケットシステムは以下の2つの主要コンポーネントで構成されます：

1. **サロン管理者サイト (Admin) のサポート機能**
   - チケット作成・閲覧・返信機能
   - チケット一覧と絞り込み表示

2. **スーパー管理者サイト (SuperAdmin) のサポート管理機能**
   - 全組織からのチケット一括管理
   - チケット検索・対応機能

## 1. データベースモデル

### 1.1 サポートチケット（SupportTicket）

```typescript
interface SupportTicket {
  _id: ObjectId;                // MongoDB ObjectID
  ticketNumber: string;         // 表示用チケット番号 (例: TK-0045)
  organizationId: ObjectId;     // 組織ID
  creatorId: ObjectId;          // 作成者ID（ユーザーID）
  title: string;                // チケットタイトル
  status: 'pending' | 'answered'; // ステータス（未回答/回答済み）
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 最終更新日時
}
```

### 1.2 チケットメッセージ（TicketMessage）

```typescript
interface TicketMessage {
  _id: ObjectId;                // MongoDB ObjectID
  ticketId: ObjectId;           // チケットID
  senderId: ObjectId | string;  // 送信者ID (ユーザーIDまたはsuperadmin)
  senderType: 'salon' | 'superadmin'; // 送信者タイプ
  content: string;              // メッセージ内容
  createdAt: Date;              // 送信日時
  isRead: boolean;              // 既読フラグ
}
```

## 2. バックエンド実装

### 2.1 モデル定義

#### 2.1.1 サポートチケットモデル

```typescript
// server/src/models/SupportTicket.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  ticketNumber: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  title: string;
  status: 'pending' | 'answered';
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema: Schema = new Schema({
  ticketNumber: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['pending', 'answered'], default: 'pending' },
}, { timestamps: true });

// チケット番号の自動生成（TK-XXXX形式）
SupportTicketSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }
  
  try {
    // チケット数をカウントして次の番号を生成
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `TK-${(count + 1).toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
```

#### 2.1.2 チケットメッセージモデル

```typescript
// server/src/models/TicketMessage.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId | string;
  senderType: 'salon' | 'superadmin';
  content: string;
  createdAt: Date;
  isRead: boolean;
}

const TicketMessageSchema: Schema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
  senderId: { type: Schema.Types.Mixed, required: true },
  senderType: { type: String, enum: ['salon', 'superadmin'], required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<ITicketMessage>('TicketMessage', TicketMessageSchema);
```

### 2.2 サービス実装

#### 2.2.1 サポートチケットサービス

```typescript
// server/src/services/support.service.ts

import SupportTicket, { ISupportTicket } from '../models/SupportTicket';
import TicketMessage, { ITicketMessage } from '../models/TicketMessage';
import mongoose from 'mongoose';
import { NotificationService } from './notification.service';

export class SupportService {
  // チケット作成
  async createTicket(data: {
    organizationId: string;
    creatorId: string;
    title: string;
    content: string;
  }): Promise<{ ticket: ISupportTicket; message: ITicketMessage }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // チケット作成
      const ticket = await SupportTicket.create([{
        organizationId: new mongoose.Types.ObjectId(data.organizationId),
        creatorId: new mongoose.Types.ObjectId(data.creatorId),
        title: data.title,
        status: 'pending',
      }], { session });

      // 初期メッセージ作成
      const message = await TicketMessage.create([{
        ticketId: ticket[0]._id,
        senderId: new mongoose.Types.ObjectId(data.creatorId),
        senderType: 'salon',
        content: data.content,
        isRead: false,
      }], { session });

      // 通知作成（SuperAdmin向け）
      await NotificationService.createNotification({
        type: 'NEW_SUPPORT_TICKET',
        recipients: ['superadmin'],
        title: '新しいサポートチケット',
        content: `${ticket[0].ticketNumber}: ${data.title}`,
        metadata: {
          ticketId: ticket[0]._id.toString(),
        }
      }, session);

      await session.commitTransaction();

      return { ticket: ticket[0], message: message[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // チケット一覧取得（サロン側）
  async getTicketsByOrganization(organizationId: string, options: {
    status?: 'all' | 'pending' | 'answered';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    tickets: ISupportTicket[];
    pagination: { total: number; page: number; limit: number; pages: number };
    counts: { all: number; pending: number; answered: number };
  }> {
    const { status = 'all', page = 1, limit = 10 } = options;
    
    // ステータスによるフィルタリング
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (status !== 'all') {
      filter.status = status;
    }

    // 各ステータスのカウント取得
    const [all, pending, answered] = await Promise.all([
      SupportTicket.countDocuments({ organizationId: new mongoose.Types.ObjectId(organizationId) }),
      SupportTicket.countDocuments({ organizationId: new mongoose.Types.ObjectId(organizationId), status: 'pending' }),
      SupportTicket.countDocuments({ organizationId: new mongoose.Types.ObjectId(organizationId), status: 'answered' }),
    ]);

    // チケット一覧取得
    const total = await SupportTicket.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      tickets,
      pagination: { total, page, limit, pages },
      counts: { all, pending, answered },
    };
  }

  // チケット詳細取得
  async getTicketDetail(ticketId: string, organizationId?: string): Promise<{
    ticket: ISupportTicket;
    messages: ITicketMessage[];
  }> {
    // チケット情報取得
    const query: any = { _id: new mongoose.Types.ObjectId(ticketId) };
    if (organizationId) {
      // サロン側からのリクエストの場合、組織IDで絞り込み
      query.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      throw new Error('チケットが見つかりません');
    }

    // メッセージ履歴取得
    const messages = await TicketMessage.find({
      ticketId: ticket._id,
    }).sort({ createdAt: 1 });

    return { ticket, messages };
  }

  // チケットへの返信
  async replyToTicket(ticketId: string, data: {
    senderId: string;
    senderType: 'salon' | 'superadmin';
    content: string;
    organizationId?: string;
  }): Promise<{ message: ITicketMessage; updatedTicket: ISupportTicket }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // チケット取得
      const query: any = { _id: new mongoose.Types.ObjectId(ticketId) };
      if (data.organizationId) {
        // サロン側からのリクエストの場合、組織IDで絞り込み
        query.organizationId = new mongoose.Types.ObjectId(data.organizationId);
      }

      const ticket = await SupportTicket.findOne(query).session(session);
      if (!ticket) {
        throw new Error('チケットが見つかりません');
      }

      // メッセージ作成
      const message = await TicketMessage.create([{
        ticketId: ticket._id,
        senderId: data.senderType === 'superadmin' ? 'superadmin' : new mongoose.Types.ObjectId(data.senderId),
        senderType: data.senderType,
        content: data.content,
        isRead: false,
      }], { session });

      // チケットステータス更新
      let newStatus = ticket.status;
      if (data.senderType === 'superadmin') {
        newStatus = 'answered';
      } else if (data.senderType === 'salon' && ticket.status === 'answered') {
        newStatus = 'pending';
      }

      if (newStatus !== ticket.status) {
        ticket.status = newStatus;
        await ticket.save({ session });
      }

      // 通知作成
      if (data.senderType === 'superadmin') {
        // SuperAdminからの返信時は組織のメンバーに通知
        await NotificationService.createNotification({
          type: 'SUPPORT_TICKET_REPLIED',
          recipientOrganizationId: ticket.organizationId.toString(),
          title: 'サポートチケットへの回答',
          content: `${ticket.ticketNumber}: ${ticket.title}`,
          metadata: {
            ticketId: ticket._id.toString(),
          }
        }, session);
      } else {
        // サロンからの返信時はSuperAdminに通知
        await NotificationService.createNotification({
          type: 'SUPPORT_TICKET_UPDATED',
          recipients: ['superadmin'],
          title: 'サポートチケットの更新',
          content: `${ticket.ticketNumber}: ${ticket.title}`,
          metadata: {
            ticketId: ticket._id.toString(),
          }
        }, session);
      }

      await session.commitTransaction();

      return { message: message[0], updatedTicket: ticket };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // SuperAdmin用のチケット一覧取得
  async getAllTickets(options: {
    status?: 'all' | 'pending' | 'answered';
    organizationId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    tickets: any[]; // 組織情報を含むため拡張型を使用
    pagination: { total: number; page: number; limit: number; pages: number };
    counts: { all: number; pending: number; answered: number };
  }> {
    const { status = 'all', organizationId, search, page = 1, limit = 20 } = options;
    
    // フィルター条件作成
    const filter: any = {};
    if (status !== 'all') {
      filter.status = status;
    }
    if (organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // 各ステータスのカウント取得
    const [all, pending, answered] = await Promise.all([
      SupportTicket.countDocuments({}),
      SupportTicket.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: 'answered' }),
    ]);

    // チケット一覧取得（組織情報とユーザー情報を結合）
    const total = await SupportTicket.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.aggregate([
      { $match: filter },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // 組織情報を結合
      {
        $lookup: {
          from: 'organizations',
          localField: 'organizationId',
          foreignField: '_id',
          as: 'organization'
        }
      },
      { $unwind: '$organization' },
      // ユーザー情報を結合
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      // 必要なフィールドのみ選択
      {
        $project: {
          _id: 1,
          ticketNumber: 1,
          title: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          'organization._id': 1,
          'organization.name': 1,
          'creator._id': 1,
          'creator.name': 1
        }
      }
    ]);

    return {
      tickets,
      pagination: { total, page, limit, pages },
      counts: { all, pending, answered },
    };
  }

  // 統計情報取得
  async getStatistics(): Promise<{
    totalTickets: number;
    pendingTickets: number;
    answeredTickets: number;
    avgResponseTime: number;
    topOrganizations: any[];
    ticketsPerDay: any[];
  }> {
    // 総チケット数と状態別チケット数
    const [totalTickets, pendingTickets, answeredTickets] = await Promise.all([
      SupportTicket.countDocuments({}),
      SupportTicket.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: 'answered' }),
    ]);

    // 平均応答時間の計算（回答済みチケットの初回メッセージと最初のsuperadmin返信の時間差）
    const avgResponseTimeData = await TicketMessage.aggregate([
      // チケットIDでグループ化して最初のメッセージと最初のsuperadmin返信を取得
      {
        $group: {
          _id: '$ticketId',
          firstMessage: { $min: { $cond: [{ $eq: ['$senderType', 'salon'] }, '$createdAt', null] } },
          firstResponse: { $min: { $cond: [{ $eq: ['$senderType', 'superadmin'] }, '$createdAt', null] } }
        }
      },
      // 両方のメッセージがあるチケットのみフィルタリング
      {
        $match: {
          firstMessage: { $ne: null },
          firstResponse: { $ne: null }
        }
      },
      // 応答時間を計算（ミリ秒単位）
      {
        $project: {
          responseTime: { $subtract: ['$firstResponse', '$firstMessage'] }
        }
      },
      // 平均を計算
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$responseTime' }
        }
      }
    ]);

    // ミリ秒を時間に変換（デフォルト値は0）
    const avgResponseTime = avgResponseTimeData.length > 0
      ? avgResponseTimeData[0].avgTime / (1000 * 60 * 60)
      : 0;

    // チケット数上位の組織
    const topOrganizations = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$organizationId',
          ticketCount: { $sum: 1 }
        }
      },
      { $sort: { ticketCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'organizations',
          localField: '_id',
          foreignField: '_id',
          as: 'organization'
        }
      },
      { $unwind: '$organization' },
      {
        $project: {
          id: '$_id',
          name: '$organization.name',
          ticketCount: 1,
          _id: 0
        }
      }
    ]);

    // 直近7日間の日別チケット数
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const ticketsPerDay = await SupportTicket.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    return {
      totalTickets,
      pendingTickets,
      answeredTickets,
      avgResponseTime,
      topOrganizations,
      ticketsPerDay,
    };
  }
}

export default new SupportService();
```

### 2.3 コントローラー実装

#### 2.3.1 サロン側サポートコントローラー

```typescript
// server/src/controllers/support.controller.ts

import { Request, Response } from 'express';
import SupportService from '../services/support.service';
import { errorHandler } from '../utils/error-handler';

export class SupportController {
  // チケット作成
  async createTicket(req: Request, res: Response) {
    try {
      const { title, content } = req.body;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      if (!title || !content) {
        return res.status(400).json({
          statusCode: 400,
          message: '必須パラメータが不足しています。'
        });
      }

      const result = await SupportService.createTicket({
        organizationId,
        creatorId: userId,
        title,
        content
      });

      return res.status(201).json({
        ticketId: result.ticket._id,
        ticketNumber: result.ticket.ticketNumber,
        title: result.ticket.title,
        content: result.message.content,
        status: result.ticket.status,
        createdAt: result.ticket.createdAt
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }

  // チケット一覧取得
  async getTickets(req: Request, res: Response) {
    try {
      const organizationId = req.user.organizationId;
      const { status = 'all', page, limit } = req.query;

      const result = await SupportService.getTicketsByOrganization(organizationId, {
        status: status as 'all' | 'pending' | 'answered',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      // レスポンス形式に変換
      const tickets = result.tickets.map(ticket => ({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      }));

      return res.status(200).json({
        tickets,
        pagination: result.pagination,
        counts: result.counts
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }

  // チケット詳細取得
  async getTicketDetail(req: Request, res: Response) {
    try {
      const ticketId = req.params.ticketId;
      const organizationId = req.user.organizationId;

      const result = await SupportService.getTicketDetail(ticketId, organizationId);

      // メッセージの形式変換
      const messages = result.messages.map(message => ({
        messageId: message._id,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: message.senderId,
          name: message.senderType === 'superadmin' ? 'スーパー管理者' : req.user.name, // ユーザー名の取得方法は要調整
          type: message.senderType
        },
        isRead: message.isRead
      }));

      return res.status(200).json({
        ticketId: result.ticket._id,
        ticketNumber: result.ticket.ticketNumber,
        title: result.ticket.title,
        status: result.ticket.status,
        createdAt: result.ticket.createdAt,
        updatedAt: result.ticket.updatedAt,
        messages
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }

  // チケットへの返信
  async replyToTicket(req: Request, res: Response) {
    try {
      const ticketId = req.params.ticketId;
      const { content } = req.body;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      if (!content) {
        return res.status(400).json({
          statusCode: 400,
          message: '返信内容を入力してください。'
        });
      }

      const result = await SupportService.replyToTicket(ticketId, {
        senderId: userId,
        senderType: 'salon',
        content,
        organizationId
      });

      return res.status(200).json({
        messageId: result.message._id,
        content: result.message.content,
        createdAt: result.message.createdAt,
        sender: {
          id: userId,
          name: req.user.name,
          type: 'salon'
        },
        ticketStatus: result.updatedTicket.status
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }
}

export default new SupportController();
```

#### 2.3.2 SuperAdmin側サポートコントローラー

```typescript
// server/src/controllers/admin/support.controller.ts

import { Request, Response } from 'express';
import SupportService from '../../services/support.service';
import { errorHandler } from '../../utils/error-handler';

export class AdminSupportController {
  // チケット一覧取得
  async getTickets(req: Request, res: Response) {
    try {
      const { status, organizationId, search, page, limit } = req.query;

      const result = await SupportService.getAllTickets({
        status: status as 'all' | 'pending' | 'answered',
        organizationId: organizationId as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      // レスポンスの形式変換
      const tickets = result.tickets.map(ticket => ({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        organization: {
          id: ticket.organization._id,
          name: ticket.organization.name
        },
        creator: {
          id: ticket.creator._id,
          name: ticket.creator.name
        }
      }));

      return res.status(200).json({
        tickets,
        pagination: result.pagination,
        counts: result.counts
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }

  // チケット詳細取得
  async getTicketDetail(req: Request, res: Response) {
    try {
      const ticketId = req.params.ticketId;

      const result = await SupportService.getTicketDetail(ticketId);
      
      // 組織情報とユーザー情報を取得（実際の実装では関連データを結合するクエリを使用）
      const organizationName = 'サンプル組織'; // 実際には組織名を取得
      const creatorName = 'サンプルユーザー'; // 実際にはユーザー名を取得

      // メッセージの形式変換
      const messages = result.messages.map(message => ({
        messageId: message._id,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: message.senderId,
          name: message.senderType === 'superadmin' ? 'スーパー管理者' : creatorName,
          type: message.senderType
        },
        isRead: message.isRead
      }));

      return res.status(200).json({
        ticketId: result.ticket._id,
        ticketNumber: result.ticket.ticketNumber,
        title: result.ticket.title,
        status: result.ticket.status,
        createdAt: result.ticket.createdAt,
        updatedAt: result.ticket.updatedAt,
        organization: {
          id: result.ticket.organizationId,
          name: organizationName
        },
        creator: {
          id: result.ticket.creatorId,
          name: creatorName,
          role: 'owner' // 実際の役割を取得
        },
        messages
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }

  // チケットへの返信
  async replyToTicket(req: Request, res: Response) {
    try {
      const ticketId = req.params.ticketId;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          statusCode: 400,
          message: '返信内容を入力してください。'
        });
      }

      const result = await SupportService.replyToTicket(ticketId, {
        senderId: 'superadmin',
        senderType: 'superadmin',
        content
      });

      return res.status(200).json({
        messageId: result.message._id,
        content: result.message.content,
        createdAt: result.message.createdAt,
        sender: {
          id: 'superadmin',
          name: 'スーパー管理者',
          type: 'superadmin'
        },
        ticketStatus: result.updatedTicket.status
      });
    } catch (error) {
      return errorHandler(error, res);
    }
  }

  // 統計情報取得
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await SupportService.getStatistics();
      return res.status(200).json(stats);
    } catch (error) {
      return errorHandler(error, res);
    }
  }
}

export default new AdminSupportController();
```

### 2.4 ルート定義

#### 2.4.1 サロン側サポートルート

```typescript
// server/src/routes/support.routes.ts

import { Router } from 'express';
import SupportController from '../controllers/support.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 認証ミドルウェア（Owner/Admin権限のみアクセス可能）
const ownerAdminAuth = [
  authMiddleware,
  (req, res, next) => {
    if (['owner', 'admin'].includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        statusCode: 403,
        message: 'アクセス権限がありません。'
      });
    }
  }
];

// チケット作成
router.post('/tickets', ownerAdminAuth, SupportController.createTicket);

// チケット一覧取得
router.get('/tickets', ownerAdminAuth, SupportController.getTickets);

// チケット詳細取得
router.get('/tickets/:ticketId', ownerAdminAuth, SupportController.getTicketDetail);

// チケットへの返信
router.post('/tickets/:ticketId/reply', ownerAdminAuth, SupportController.replyToTicket);

export default router;
```

#### 2.4.2 SuperAdmin側サポートルート

```typescript
// server/src/routes/admin/support.routes.ts

import { Router } from 'express';
import AdminSupportController from '../../controllers/admin/support.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// SuperAdmin認証ミドルウェア
const superAdminAuth = [
  authMiddleware,
  (req, res, next) => {
    if (req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({
        statusCode: 403,
        message: 'スーパー管理者のみアクセス可能です。'
      });
    }
  }
];

// チケット一覧取得
router.get('/tickets', superAdminAuth, AdminSupportController.getTickets);

// チケット詳細取得
router.get('/tickets/:ticketId', superAdminAuth, AdminSupportController.getTicketDetail);

// チケットへの返信
router.post('/tickets/:ticketId/reply', superAdminAuth, AdminSupportController.replyToTicket);

// 統計情報取得
router.get('/stats', superAdminAuth, AdminSupportController.getStatistics);

export default router;
```

#### 2.4.3 メインルートへの追加

```typescript
// server/src/index.ts (または適切なルート定義ファイル)

import supportRoutes from './routes/support.routes';
import adminSupportRoutes from './routes/admin/support.routes';

// サロン側サポートルート
app.use('/api/support', supportRoutes);

// SuperAdmin側サポートルート
app.use('/api/admin/support', adminSupportRoutes);
```

## 3. フロントエンド実装

### 3.1 サロン管理者サイト (Admin)

#### 3.1.1 サポートサービス

```typescript
// admin/src/services/support.service.ts

import ApiService from './api.service';
import { API_PATHS } from '../../../shared';

class SupportService {
  // チケット作成
  async createTicket(data: { title: string; content: string }) {
    return ApiService.post(API_PATHS.SUPPORT_TICKETS, data);
  }

  // チケット一覧取得
  async getTickets(params: { status?: 'all' | 'pending' | 'answered'; page?: number; limit?: number } = {}) {
    return ApiService.get(API_PATHS.SUPPORT_TICKETS, { params });
  }

  // チケット詳細取得
  async getTicketDetail(ticketId: string) {
    return ApiService.get(API_PATHS.SUPPORT_TICKET_DETAIL(ticketId));
  }

  // チケットへの返信
  async replyToTicket(ticketId: string, content: string) {
    return ApiService.post(API_PATHS.SUPPORT_TICKET_REPLY(ticketId), { content });
  }
}

export default new SupportService();
```

#### 3.1.2 サポート一覧ページコンポーネント

`admin/src/pages/Support/index.tsx`に実装します。実装詳細はモックアップに基づいて作成します。

### 3.2 スーパー管理者サイト (SuperAdmin)

#### 3.2.1 サポートサービス

```typescript
// superadmin/src/services/support.service.ts

import ApiService from './api.service';
import { API_PATHS } from '../../../shared';

class AdminSupportService {
  // チケット一覧取得
  async getTickets(params: {
    status?: 'all' | 'pending' | 'answered';
    organizationId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    return ApiService.get(API_PATHS.ADMIN_SUPPORT_TICKETS, { params });
  }

  // チケット詳細取得
  async getTicketDetail(ticketId: string) {
    return ApiService.get(API_PATHS.ADMIN_SUPPORT_TICKET_DETAIL(ticketId));
  }

  // チケットへの返信
  async replyToTicket(ticketId: string, content: string) {
    return ApiService.post(API_PATHS.ADMIN_SUPPORT_TICKET_REPLY(ticketId), { content });
  }

  // 統計情報取得
  async getStatistics() {
    return ApiService.get(API_PATHS.ADMIN_SUPPORT_STATS);
  }
}

export default new AdminSupportService();
```

#### 3.2.2 サポート管理ページコンポーネント

`superadmin/src/pages/Support/index.tsx`に実装します。実装詳細はモックアップに基づいて作成します。

## 4. 共通コンポーネント

実装を効率化するために、以下の共通コンポーネントを作成することをお勧めします：

1. **TicketListItem**: チケット一覧の各アイテムを表示するコンポーネント
2. **TicketStatus**: チケットのステータスバッジを表示するコンポーネント
3. **MessageList**: チケット内のメッセージリストを表示するコンポーネント
4. **MessageItem**: 個々のメッセージを表示するコンポーネント
5. **ReplyForm**: 返信フォームを表示するコンポーネント

## 5. 通知システムとの連携

サポートチケットシステムは、既存の通知システムと連携して以下の通知を送信します：

1. **新規チケット作成時**: SuperAdmin向けに通知
2. **スーパー管理者からの返信時**: チケット作成者とその組織のOwner/Admin向けに通知
3. **サロンからの返信時**: SuperAdmin向けに通知

これらの通知は、SupportService内で適切なタイミングで送信されます。

## 6. 実装の優先順位

以下の順序で実装することをお勧めします：

1. データベースモデルの実装（SupportTicket, TicketMessage）
2. サービス層の基本機能の実装
3. コントローラーとルートの実装
4. サロン管理者サイト (Admin) のUI実装
5. スーパー管理者サイト (SuperAdmin) のUI実装
6. 通知機能の連携
7. 統計情報機能の実装

## 7. テスト戦略

以下のテストを実装することをお勧めします：

1. **ユニットテスト**:
   - サービス層の各メソッド
   - 重要なビジネスロジック（チケット番号の生成ロジックなど）

2. **APIテスト**:
   - 各エンドポイントの動作確認
   - 権限チェックのテスト

3. **結合テスト**:
   - 通知システムとの連携
   - タイムラインテスト（チケット作成から回答、再質問までの一連のフロー）

## 8. 注意点と課題

1. **パフォーマンス考慮点**:
   - チケット数が増加した場合のクエリのパフォーマンス
   - 添付ファイル機能を追加する場合のストレージ考慮

2. **セキュリティ対策**:
   - クロスサイトスクリプティング（XSS）対策
   - 権限チェックの徹底

3. **将来の拡張性**:
   - 添付ファイル機能の追加
   - チケットのカテゴリ分け
   - 優先度設定機能

## 9. シンプル化のポイント

- カテゴリや優先度などの追加フィールドは初期段階では実装せず、基本機能に集中
- チケットステータスは「未回答(pending)」と「回答済み(answered)」の2つに限定
- ユーザーインターフェースはシンプルに保ち、直感的な操作性を重視