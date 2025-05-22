import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { AuthRequest } from '../../types/auth';

/**
 * 組織一覧を取得する
 * GET /api/v1/superadmin/organizations
 */
export const getOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // クエリパラメータ
    const status = req.query.status as string;
    const search = req.query.search as string;
    const planId = req.query.planId as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortDir = req.query.sortDir as string || 'desc';
    
    // クエリ条件の構築
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (planId) {
      // TODO: プラン情報が別モデルの場合は適宜修正
      query['subscriptionPlan.planId'] = planId;
    }
    
    // ソート条件
    const sort: any = {};
    sort[sortBy] = sortDir === 'asc' ? 1 : -1;
    
    // 総件数の取得
    const total = await Organization.countDocuments(query);
    
    // 組織データの取得（オーナー情報を含む）
    const organizations = await Organization.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('ownerId', '_id displayName email');
    
    // ユーザー数とクライアント数の取得（実際のアプリでは適切なモデルとクエリに修正してください）
    const organizationsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organizationId: org._id });
        
        // クライアント数の取得（この例ではダミー値、実際のアプリケーションに合わせて修正してください）
        const clientCount = 0; // TODO: 実際のクライアントモデルからカウントを取得
        
        return {
          _id: org._id,
          name: org.name,
          status: org.status,
          owner: org.ownerId ? {
            _id: (org.ownerId as any)._id,
            name: (org.ownerId as any).displayName,
            email: (org.ownerId as any).email
          } : null,
          plan: {
            // TODO: プラン情報が別モデルの場合は適宜修正
            _id: 'plan_id',
            name: org.subscriptionPlan.type
          },
          userCount,
          clientCount,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt
        };
      })
    );
    
    // ページネーション情報
    const pages = Math.ceil(total / limit);
    
    return res.status(200).json({
      organizations: organizationsWithCounts,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error('組織一覧取得エラー:', error);
    return res.status(500).json({ message: '組織一覧の取得に失敗しました' });
  }
};

/**
 * 組織詳細を取得する
 * GET /api/v1/superadmin/organizations/:organizationId
 */
export const getOrganizationDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    // ObjectIDの形式チェック
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: '無効な組織IDです' });
    }
    
    // 組織データの取得（オーナー情報を含む）
    const organization = await Organization.findById(organizationId)
      .populate('ownerId', '_id displayName email lastLogin');
    
    if (!organization) {
      return res.status(404).json({ message: '組織が見つかりません' });
    }
    
    // Admin権限を持つユーザーを取得
    const adminUsers = await User.find({
      organizationId: organization._id,
      role: 'Admin'
    }).select('_id displayName email role');
    
    // ユーザー数とクライアント数の取得
    const userCount = await User.countDocuments({ organizationId: organization._id });
    const activeUserCount = await User.countDocuments({ 
      organizationId: organization._id,
      isActive: true
    });
    
    // クライアント数の取得（この例ではダミー値、実際のアプリケーションに合わせて修正してください）
    const clientCount = 0; // TODO: 実際のクライアントモデルからカウントを取得
    
    // レスポンスデータの構築
    const responseData = {
      _id: organization._id,
      name: organization.name,
      address: "未設定", // TODO: 実際のフィールドがあれば変更
      contactInfo: {
        phone: organization.billingInfo.companyName || "未設定",
        email: organization.billingInfo.contactEmail,
        website: "未設定" // TODO: 実際のフィールドがあれば変更
      },
      owner: organization.ownerId ? {
        _id: (organization.ownerId as any)._id,
        name: (organization.ownerId as any).displayName,
        email: (organization.ownerId as any).email,
        lastLoginAt: (organization.ownerId as any).lastLogin
      } : null,
      adminUsers: adminUsers.map(admin => ({
        _id: admin._id,
        name: admin.displayName,
        email: admin.email,
        role: admin.role
      })),
      status: organization.status,
      plan: {
        // TODO: プラン情報が別モデルの場合は適宜修正
        _id: 'plan_id',
        name: organization.subscriptionPlan.type,
        price: 9800 // ダミー値
      },
      subscription: {
        status: organization.subscriptionPlan.isActive ? 'active' : 'inactive',
        startDate: organization.subscriptionPlan.currentPeriodStart,
        currentPeriodEnd: organization.subscriptionPlan.currentPeriodEnd,
        trialEndsAt: organization.subscriptionPlan.trialEndsAt
      },
      statistics: {
        userCount,
        clientCount,
        activeUserCount
      },
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    };
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('組織詳細取得エラー:', error);
    return res.status(500).json({ message: '組織詳細の取得に失敗しました' });
  }
};

/**
 * 組織を作成する
 * POST /api/v1/superadmin/organizations
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      address, 
      contactInfo, 
      initialOwner, 
      plan, 
      trialDays = 30 
    } = req.body;
    
    // 必須フィールドのチェック
    if (!name || !initialOwner?.email || !initialOwner?.name || !initialOwner?.password) {
      return res.status(400).json({ 
        message: '組織名、初期オーナー情報（名前、メールアドレス、パスワード）は必須です' 
      });
    }
    
    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email: initialOwner.email });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'このメールアドレスは既に使用されています' 
      });
    }
    
    // トランザクション開始
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 初期オーナーユーザーの作成
      const newOwner = new User({
        email: initialOwner.email,
        password: initialOwner.password, // モデルのpre saveフックでハッシュ化されます
        displayName: initialOwner.name,
        role: 'Owner',
        // 他の必須フィールドがあれば追加
        plan: 'elite', // または適切なプラン
        isActive: true
      });
      
      await newOwner.save({ session });
      
      // トライアル終了日の計算
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      
      // 組織の作成
      const newOrganization = new Organization({
        name,
        ownerId: newOwner._id,
        status: 'trial',
        // billingInfoなど他の情報を設定
        billingInfo: {
          contactName: initialOwner.name,
          contactEmail: initialOwner.email,
          // 他の請求情報があれば設定
        },
        subscriptionPlan: {
          type: 'trial',
          isActive: true,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
          trialEndsAt: trialEndsAt
        }
      });
      
      await newOrganization.save({ session });
      
      // オーナーユーザーに組織IDを紐付け
      if (newOrganization._id) {
        newOwner.organizationId = newOrganization._id as mongoose.Types.ObjectId;
      }
      await newOwner.save({ session });
      
      // トランザクションのコミット
      await session.commitTransaction();
      session.endSession();
      
      // TODO: オーナーへの招待メールの送信処理
      const invitationSent = true;
      
      return res.status(201).json({
        organization: {
          _id: newOrganization._id,
          name: newOrganization.name,
          status: newOrganization.status,
          createdAt: newOrganization.createdAt
        },
        owner: {
          _id: newOwner._id,
          name: newOwner.displayName,
          email: newOwner.email,
          role: newOwner.role
        },
        invitationSent
      });
      
    } catch (error) {
      // エラー発生時はトランザクションをロールバック
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('組織作成エラー:', error);
    return res.status(500).json({ message: '組織の作成に失敗しました' });
  }
};

/**
 * 組織ステータスを変更する
 * PUT /api/v1/superadmin/organizations/:organizationId/status
 */
export const updateOrganizationStatus = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { status, reason, notifyOwner } = req.body;
    
    // 入力チェック
    if (!status || !['active', 'trial', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({ message: '有効なステータスを指定してください' });
    }
    
    // ObjectIDの形式チェック
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: '無効な組織IDです' });
    }
    
    // 組織の取得
    const organization = await Organization.findById(organizationId)
      .populate('ownerId', 'displayName email');
    
    if (!organization) {
      return res.status(404).json({ message: '組織が見つかりません' });
    }
    
    // 現在のステータスを保存
    const previousStatus = organization.status;
    
    // ステータスが変わらない場合は早期リターン
    if (previousStatus === status) {
      return res.status(200).json({
        _id: organization._id,
        name: organization.name,
        previousStatus,
        status,
        updatedAt: organization.updatedAt,
        notificationSent: false
      });
    }
    
    // ステータスの更新
    organization.status = status;
    await organization.save();
    
    // オーナーへの通知処理
    let notificationSent = false;
    if (notifyOwner && organization.ownerId) {
      // TODO: 実際の通知ロジックを実装
      // 例: メール送信、通知テーブルへの登録など
      console.log(`組織 ${organization.name} のステータスが ${previousStatus} から ${status} に変更されました。理由: ${reason}`);
      console.log(`オーナー ${(organization.ownerId as any).displayName} (${(organization.ownerId as any).email}) に通知`);
      
      notificationSent = true;
    }
    
    return res.status(200).json({
      _id: organization._id,
      name: organization.name,
      previousStatus,
      status,
      updatedAt: organization.updatedAt,
      notificationSent
    });
    
  } catch (error) {
    console.error('組織ステータス更新エラー:', error);
    return res.status(500).json({ message: '組織ステータスの更新に失敗しました' });
  }
};

/**
 * 組織のトライアル期間を延長する
 * POST /api/v1/superadmin/organizations/:organizationId/extend-trial
 */
export const extendOrganizationTrial = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { days = 14, reason, notifyOwner = true } = req.body;
    
    // 入力チェック
    if (!days || days <= 0 || days > 365) {
      return res.status(400).json({ message: '延長日数は1〜365日の範囲で指定してください' });
    }
    
    // ObjectIDの形式チェック
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: '無効な組織IDです' });
    }
    
    // 組織の取得
    const organization = await Organization.findById(organizationId)
      .populate('ownerId', 'displayName email');
    
    if (!organization) {
      return res.status(404).json({ message: '組織が見つかりません' });
    }
    
    // トライアル終了日の取得
    const previousEndDate = organization.subscriptionPlan.trialEndsAt || 
                            organization.subscriptionPlan.currentPeriodEnd;
    
    // 新しいトライアル終了日の計算
    const newEndDate = new Date(previousEndDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    
    // トライアル情報の更新
    organization.subscriptionPlan.trialEndsAt = newEndDate;
    
    // 現在の期間終了日も延長する場合は更新
    if (organization.status === 'trial') {
      organization.subscriptionPlan.currentPeriodEnd = newEndDate;
    }
    
    await organization.save();
    
    // オーナーへの通知処理
    let notificationSent = false;
    if (notifyOwner && organization.ownerId) {
      // TODO: 実際の通知ロジックを実装
      // 例: メール送信、通知テーブルへの登録など
      console.log(`組織 ${organization.name} のトライアル期間が ${days}日延長されました。理由: ${reason}`);
      console.log(`オーナー ${(organization.ownerId as any).displayName} (${(organization.ownerId as any).email}) に通知`);
      
      notificationSent = true;
    }
    
    return res.status(200).json({
      organization: {
        _id: organization._id,
        name: organization.name
      },
      trial: {
        previousEndDate,
        newEndDate,
        extensionDays: days
      },
      reason,
      notificationSent,
      updatedAt: organization.updatedAt
    });
    
  } catch (error) {
    console.error('トライアル延長エラー:', error);
    return res.status(500).json({ message: 'トライアル期間の延長に失敗しました' });
  }
};

/**
 * 組織の一括ステータス変更
 * PUT /api/v1/superadmin/batch/organizations/status
 */
export const batchUpdateOrganizationStatus = async (req: Request, res: Response) => {
  try {
    const { organizationIds, status, reason, notifyOwners } = req.body;
    
    // 入力チェック
    if (!organizationIds || !Array.isArray(organizationIds) || organizationIds.length === 0) {
      return res.status(400).json({ message: '組織IDの配列が必要です' });
    }
    
    if (!status || !['active', 'trial', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({ message: '有効なステータスを指定してください' });
    }
    
    // ObjectIDの形式チェック
    const validIds = organizationIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== organizationIds.length) {
      return res.status(400).json({ message: '無効な組織IDが含まれています' });
    }
    
    // 対象組織の取得
    const organizations = await Organization.find({ _id: { $in: validIds } })
      .populate('ownerId', 'displayName email');
    
    if (organizations.length === 0) {
      return res.status(404).json({ message: '指定された組織が見つかりません' });
    }
    
    // 組織ステータスの更新
    const updateResults = [];
    let notificationsCount = 0;
    
    for (const org of organizations) {
      const previousStatus = org.status;
      
      // ステータスが変わらない場合はスキップ
      if (previousStatus === status) {
        updateResults.push({
          _id: org._id,
          name: org.name,
          previousStatus,
          status,
          statusChanged: false
        });
        continue;
      }
      
      // ステータスを更新
      org.status = status;
      await org.save();
      
      // オーナーへの通知処理
      let notified = false;
      if (notifyOwners && org.ownerId) {
        // TODO: 実際の通知ロジックを実装
        // 例: メール送信、通知テーブルへの登録など
        console.log(`組織 ${org.name} のステータスが ${previousStatus} から ${status} に変更されました。理由: ${reason}`);
        console.log(`オーナー ${(org.ownerId as any).displayName} (${(org.ownerId as any).email}) に通知`);
        
        notified = true;
        notificationsCount++;
      }
      
      updateResults.push({
        _id: org._id,
        name: org.name,
        previousStatus,
        status,
        statusChanged: true,
        notified
      });
    }
    
    return res.status(200).json({
      updatedCount: updateResults.filter(r => r.statusChanged).length,
      organizations: updateResults.map(r => ({
        _id: r._id,
        name: r.name,
        previousStatus: r.previousStatus,
        status
      })),
      notificationsSent: notificationsCount,
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error('一括ステータス更新エラー:', error);
    return res.status(500).json({ message: '組織ステータスの一括更新に失敗しました' });
  }
};

/**
 * 組織情報を更新する
 * PUT /api/v1/superadmin/organizations/:organizationId
 */
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { name, address, contactInfo } = req.body;
    
    // 必須フィールドのチェック
    if (!name) {
      return res.status(400).json({ message: '組織名は必須です' });
    }
    
    // ObjectIDの形式チェック
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: '無効な組織IDです' });
    }
    
    // 組織の取得
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: '組織が見つかりません' });
    }
    
    // 組織情報の更新
    organization.name = name;
    
    // 任意フィールドの更新
    if (contactInfo) {
      // 既存の請求情報を保持しながら、提供された情報で更新
      organization.billingInfo = {
        ...organization.billingInfo,
        companyName: contactInfo.phone || organization.billingInfo.companyName,
        contactEmail: contactInfo.email || organization.billingInfo.contactEmail,
        // その他のフィールドも必要に応じて更新
      };
    }
    
    // 住所などの情報は現在のモデルに直接のフィールドがないため、
    // 将来的な拡張に備えて注釈として残しておく
    // TODO: 組織モデルに追加のフィールド（住所、ウェブサイトなど）がある場合、それらも更新
    
    await organization.save();
    
    return res.status(200).json({
      _id: organization._id,
      name: organization.name,
      updatedAt: organization.updatedAt
    });
    
  } catch (error) {
    console.error('組織更新エラー:', error);
    return res.status(500).json({ message: '組織情報の更新に失敗しました' });
  }
};

/**
 * 組織オーナー情報を取得する
 * GET /api/v1/superadmin/organizations/:organizationId/owner
 */
export const getOrganizationOwner = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    // ObjectIDの形式チェック
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: '無効な組織IDです' });
    }
    
    // 組織の取得
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: '組織が見つかりません' });
    }
    
    if (!organization.ownerId) {
      return res.status(404).json({ message: 'この組織にはオーナーが設定されていません' });
    }
    
    // オーナー情報の取得
    const owner = await User.findById(organization.ownerId);
    
    if (!owner) {
      return res.status(404).json({ message: 'オーナーユーザーが見つかりません' });
    }
    
    return res.status(200).json({
      _id: owner._id,
      name: owner.displayName,
      email: owner.email,
      role: owner.role,
      organizationId: organization._id,
      lastLoginAt: owner.lastLogin,
      createdAt: owner.createdAt
    });
    
  } catch (error) {
    console.error('組織オーナー取得エラー:', error);
    return res.status(500).json({ message: '組織オーナー情報の取得に失敗しました' });
  }
};

/**
 * 組織オーナーを変更する
 * PUT /api/v1/superadmin/organizations/:organizationId/owner
 */
export const changeOrganizationOwner = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { userId, notifyPreviousOwner = true, notifyNewOwner = true } = req.body;
    
    // 入力チェック
    if (!userId) {
      return res.status(400).json({ message: '新しいオーナーのユーザーIDを指定してください' });
    }
    
    // ObjectIDの形式チェック
    if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: '無効なIDが指定されています' });
    }
    
    // トランザクション開始
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 組織の取得
      const organization = await Organization.findById(organizationId).session(session);
      
      if (!organization) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: '組織が見つかりません' });
      }
      
      // 新しいオーナーユーザーの取得
      const newOwner = await User.findById(userId).session(session);
      
      if (!newOwner) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: '指定されたユーザーが見つかりません' });
      }
      
      // 指定されたユーザーが同じ組織に所属しているか確認
      if (newOwner.organizationId && organization._id && !newOwner.organizationId.equals(organization._id as mongoose.Types.ObjectId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: '指定されたユーザーは異なる組織に所属しています' });
      }
      
      // 現在のオーナーを取得
      let previousOwner = null;
      if (organization.ownerId) {
        previousOwner = await User.findById(organization.ownerId).session(session);
      }
      
      // 変更前後のオーナーが同じ場合は何もしない
      if (previousOwner && previousOwner._id && newOwner._id && 
          (previousOwner._id as mongoose.Types.ObjectId).equals(newOwner._id as mongoose.Types.ObjectId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ 
          message: '指定されたユーザーは既にこの組織のオーナーです',
          organization: {
            _id: organization._id,
            name: organization.name
          },
          owner: {
            _id: previousOwner._id,
            name: previousOwner.displayName,
            email: previousOwner.email,
            role: previousOwner.role
          }
        });
      }
      
      // 既存オーナーのロールを変更（存在する場合）
      if (previousOwner && previousOwner.role === 'Owner') {
        previousOwner.role = 'Admin';
        await previousOwner.save({ session });
      }
      
      // 新しいオーナーのロールを設定
      newOwner.role = 'Owner';
      
      // ユーザーの組織IDを設定（まだ設定されていない場合）
      if (!newOwner.organizationId && organization._id) {
        newOwner.organizationId = organization._id as mongoose.Types.ObjectId;
      }
      
      await newOwner.save({ session });
      
      // 組織のオーナーIDを更新
      if (newOwner._id) {
        organization.ownerId = newOwner._id as mongoose.Types.ObjectId;
      }
      await organization.save({ session });
      
      // トランザクションのコミット
      await session.commitTransaction();
      session.endSession();
      
      // 通知処理（実際の実装はここに追加）
      let previousOwnerNotified = false;
      let newOwnerNotified = false;
      
      if (notifyPreviousOwner && previousOwner) {
        // TODO: 前オーナーへの通知処理
        // 例: メール送信、通知テーブルへの登録など
        console.log(`前オーナー ${previousOwner.displayName} (${previousOwner.email}) に変更を通知`);
        previousOwnerNotified = true;
      }
      
      if (notifyNewOwner) {
        // TODO: 新オーナーへの通知処理
        // 例: メール送信、通知テーブルへの登録など
        console.log(`新オーナー ${newOwner.displayName} (${newOwner.email}) に変更を通知`);
        newOwnerNotified = true;
      }
      
      return res.status(200).json({
        organization: {
          _id: organization._id,
          name: organization.name
        },
        newOwner: {
          _id: newOwner._id,
          name: newOwner.displayName,
          email: newOwner.email,
          previousRole: previousOwner && previousOwner._id && newOwner._id && 
                    (previousOwner._id as mongoose.Types.ObjectId).equals(newOwner._id as mongoose.Types.ObjectId) ? 'Owner' : 
                    (newOwner.role === 'Owner' ? 'Admin' : newOwner.role)
        },
        previousOwner: previousOwner ? {
          _id: previousOwner._id,
          name: previousOwner.displayName,
          email: previousOwner.email,
          newRole: 'Admin'
        } : null,
        notificationSent: {
          previousOwner: previousOwnerNotified,
          newOwner: newOwnerNotified
        },
        updatedAt: new Date()
      });
      
    } catch (error) {
      // エラー発生時はトランザクションをロールバック
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('組織オーナー変更エラー:', error);
    return res.status(500).json({ message: '組織オーナーの変更に失敗しました' });
  }
};

/**
 * 組織の一括トライアル延長
 * POST /api/v1/superadmin/batch/organizations/extend-trial
 */
export const batchExtendOrganizationTrial = async (req: Request, res: Response) => {
  try {
    const { organizationIds, days = 14, reason, notifyOwners = true } = req.body;
    
    // 入力チェック
    if (!organizationIds || !Array.isArray(organizationIds) || organizationIds.length === 0) {
      return res.status(400).json({ message: '組織IDの配列が必要です' });
    }
    
    if (!days || days <= 0 || days > 365) {
      return res.status(400).json({ message: '延長日数は1〜365日の範囲で指定してください' });
    }
    
    // ObjectIDの形式チェック
    const validIds = organizationIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== organizationIds.length) {
      return res.status(400).json({ message: '無効な組織IDが含まれています' });
    }
    
    // 対象組織の取得
    const organizations = await Organization.find({ _id: { $in: validIds } })
      .populate('ownerId', 'displayName email');
    
    if (organizations.length === 0) {
      return res.status(404).json({ message: '指定された組織が見つかりません' });
    }
    
    // トライアル延長の実行
    const updateResults = [];
    let notificationsCount = 0;
    
    for (const org of organizations) {
      // トライアル終了日の取得
      const previousEndDate = org.subscriptionPlan.trialEndsAt || 
                              org.subscriptionPlan.currentPeriodEnd;
      
      // 新しいトライアル終了日の計算
      const newEndDate = new Date(previousEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);
      
      // トライアル情報の更新
      org.subscriptionPlan.trialEndsAt = newEndDate;
      
      // 現在の期間終了日も延長する場合は更新
      if (org.status === 'trial') {
        org.subscriptionPlan.currentPeriodEnd = newEndDate;
      }
      
      await org.save();
      
      // オーナーへの通知処理
      let notified = false;
      if (notifyOwners && org.ownerId) {
        // TODO: 実際の通知ロジックを実装
        // 例: メール送信、通知テーブルへの登録など
        console.log(`組織 ${org.name} のトライアル期間が ${days}日延長されました。理由: ${reason}`);
        console.log(`オーナー ${(org.ownerId as any).displayName} (${(org.ownerId as any).email}) に通知`);
        
        notified = true;
        notificationsCount++;
      }
      
      updateResults.push({
        _id: org._id,
        name: org.name,
        previousEndDate,
        newEndDate,
        notified
      });
    }
    
    return res.status(200).json({
      updatedCount: updateResults.length,
      organizations: updateResults.map(r => ({
        _id: r._id,
        name: r.name,
        trial: {
          previousEndDate: r.previousEndDate,
          newEndDate: r.newEndDate
        }
      })),
      notificationsSent: notificationsCount,
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error('一括トライアル延長エラー:', error);
    return res.status(500).json({ message: 'トライアル期間の一括延長に失敗しました' });
  }
};