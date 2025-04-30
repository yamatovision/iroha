# 美姫命アプリケーション ERD (Entity Relationship Diagram)

## 1. 概要

この図は美姫命（びきめい）アプリケーションの主要エンティティとその関係性を示したものです。このERDは、統合データモデル設計に基づいて作成されています。

## 2. 主要エンティティ関係図

```
┌─────────────────────────┐
│    Organization         │
├─────────────────────────┤      ┌───────────────────────┐
│ _id                     ├─────┐│     PricePlan         │
│ name                    │     ││                       │
│ ownerId ───────────┐    │     ││ _id ◄────────────┐    │
│ address            │    │     ││ name             │    │
│ contactEmail       │    │     ││ price            │    │
│ planId ───────────────────────┘│ features         │    │
│ subscriptionPlan   │    │      │ isActive         │    │
│ billingInfo        │    │      └───────────────────────┘
│ isActive           │    │
└────────────────────┼────┘                 ┌───────────────────────┐
                     │                      │     Subscription      │
                     │                      ├───────────────────────┤
                     │                      │ _id                   │
                     │                      │ organizationId ◄──────┘
                     │                      │ planId ◄──────────────┘
                     │                      │ status                │
                     │                      │ nextBillingDate       │
                     │                      └───────────────────────┘
 ┌───────────────────▼───┐
 │      User              │      ┌───────────────────────┐
 ├───────────────────────┤      │      TeamMembership    │
 │ _id                   │      ├───────────────────────┤
 │ email                 │      │ _id                   │
 │ password              │      │ userId ◄──────────────┘
 │ displayName           │      │ teamId ◄────────┐     │
 │ role                  │      │ role            │     │
 │ organizationId ◄──────┘      │ memberRole      │     │
 │ birthDate             │      │ isAdmin         │     │
 │ birthTime             │      └───────────────────────┘
 │ birthPlace            │
 │ birthplaceCoordinates │      ┌───────────────────────┐
 │ fourPillars           │      │       Team            │
 │ elementProfile        │      ├───────────────────────┤
 │ kakukyoku             │      │ _id ◄────────────────┘
 │ yojin                 │      │ name                  │
 │ refreshToken          │      │ description           │
 └───────────────────┬───┘      │ organizationId ◄──────┘
                     │          │ createdBy ◄───────────┘
                     │          └─────────────┬─────────┘
                     │                        │
      ┌──────────────┘                        │
      │              ┌──────────────────────┐ │
      │              │   TeamContextFortune │ │
      │        ┌─────┤                      │ │
      │        │     │ _id                  │ │
      │        │     │ userId ◄─────────────┘ │
      │        │     │ teamId ◄───────────────┘
      │        │     │ date                  │
      │    ┌───▼───┐ │ dayPillarId ◄──┐      │
      │    │DayPillar│ │ score         │      │
      │    │       │ │ teamContextAdvice     │
      │    │ _id ◄─┼─┘ collaborationTips     │
      │    │ date  │   └──────────────────────┘
      │    │ heavenly│
      │    │ earthly │   ┌──────────────────────┐
      │    └───┬───┘    │      DailyFortune     │
      │        │        ├──────────────────────┤
      │        │        │ _id                  │
      │        └────────┤ userId ◄─────────────┘
      │                 │ date                 │
      │                 │ dayPillarId ◄────────┘
      │                 │ score                │
      │                 │ advice               │
      │                 │ luckyItems           │
      │                 └──────────────────────┘
      │
┌─────▼──────────────────┐
│     ChatHistory        │      ┌───────────────────────┐
├───────────────────────┤       │     Friendship        │
│ _id                   │       ├───────────────────────┤
│ userId ◄──────────────┘       │ _id                   │
│ messages[]            │       │ userId1 ◄─────────────┘
│ lastMessageAt         │       │ userId2 ◄─────────────┘
└───────────────────────┘       │ requesterId ◄─────────┘
                                │ status                │
                                │ compatibilityScore    │
                                └─────────┬─────────────┘
                                          │
                                ┌─────────▼─────────────┐
                                │      Compatibility    │
                                ├───────────────────────┤
                                │ _id                   │
                                │ userId1 ◄─────────────┘
                                │ userId2 ◄─────────────┘
                                │ score                 │
                                │ relationType          │
                                │ description           │
                                └───────────────────────┘

┌───────────────────────┐      ┌───────────────────────┐
│     Client            │      │     Appointment       │
├───────────────────────┤      ├───────────────────────┤
│ _id                   │◄────┐│ _id                   │
│ organizationId ◄──────┘     ││ organizationId ◄──────┘
│ name                  │     ││ clientId ◄────────────┘
│ nameReading           │     ││ stylistId ◄───────────┘
│ gender                │     ││ appointmentDate       │
│ birthdate             │     ││ startTime             │
│ birthtime             │     ││ endTime               │
│ birthPlace            │     ││ status                │
│ fourPillars           │     │└───────────────────────┘
│ elementProfile        │     │
│ kakukyoku             │     │      ┌───────────────────────┐
│ yojin                 │     │      │     ClientNote        │
│ personalityDescription│     │      ├───────────────────────┤
│ isFavorite            │     └──────┤ _id                   │
│ hasCompleteSajuProfile│            │ clientId ◄────────────┘
└─────────────┬─────────┘            │ organizationId ◄──────┘
              │                      │ authorId ◄─────────────┘
              │                      │ content                │
              │                      │ noteType               │
              │                      └───────────────────────┘
┌─────────────▼─────────────┐
│    BeautyClientChat       │      ┌───────────────────────┐
├───────────────────────────┤      │  ClientStylistCompat. │
│ _id                       │      ├───────────────────────┤
│ organizationId ◄──────────┘      │ _id                   │
│ clientId ◄────────────────┘      │ clientId ◄────────────┘
│ lastMessageAt             │      │ stylistId ◄───────────┘
│ tokenCount                │      │ organizationId ◄──────┘
│ contextData               │      │ overallScore          │
│ messages[]                │      │ elementRelation       │
└───────────────────────────┘      └───────────────────────┘

┌───────────────────────┐      ┌───────────────────────┐
│     SupportTicket     │      │    TicketMessage      │
├───────────────────────┤      ├───────────────────────┤
│ _id                   │◄─────┤ _id                   │
│ ticketNumber          │      │ ticketId ◄────────────┘
│ organizationId ◄──────┘      │ senderId ◄────────────┘
│ creatorId ◄───────────┘      │ senderType            │
│ title                 │      │ content               │
│ status                │      │ isRead                │
└───────────────────────┘      └───────────────────────┘
```

## 3. エンティティ関係の説明

### 3.1 組織・ユーザー関連

- **Organization ↔ User**: 組織は多数のユーザーを持ち、ユーザーは1つの組織に所属します（SuperAdminを除く）。Ownerロールのユーザーは組織のオーナーとして指定されます。
- **Organization ↔ PricePlan**: 組織は1つのプランと関連付けられます。
- **Organization ↔ Subscription**: 組織は1つのサブスクリプション情報を持ちます。

### 3.2 チーム関連

- **User ↔ TeamMembership ↔ Team**: ユーザーは複数のチームに所属でき、チームは複数のメンバーを持ちます。TeamMembershipはユーザーとチームの中間テーブルです。
- **Team ↔ TeamContextFortune**: チームごとに、メンバーごとのチームコンテキスト運勢情報が保存されます。

### 3.3 運勢関連

- **User ↔ DailyFortune**: ユーザーごとに日々の運勢情報が保存されます。
- **DayPillar ↔ DailyFortune/TeamContextFortune**: 日柱情報は運勢計算の基礎として使用されます。

### 3.4 友達関連

- **User ↔ Friendship ↔ User**: ユーザー間の友達関係を表します。
- **Friendship ↔ Compatibility**: 友達関係に対する相性情報が保存されます。

### 3.5 クライアント関連

- **Organization ↔ Client**: 組織（サロン）は多数のクライアント（顧客）を持ちます。
- **Client ↔ BeautyClientChat**: クライアントごとに専用のチャット情報が保存されます。
- **Client ↔ Appointment**: クライアントは複数の予約を持ちます。
- **Client ↔ ClientNote**: クライアントに関するメモ情報が保存されます。
- **Client ↔ ClientStylistCompatibility ↔ User**: クライアントとスタイリスト（User）間の相性情報が保存されます。

### 3.6 サポート関連

- **Organization ↔ SupportTicket**: 組織はサポートチケットを作成できます。
- **SupportTicket ↔ TicketMessage**: サポートチケットには複数のメッセージが紐づきます。

## 4. リレーションシップの種類

- **一対一 (1:1)**: 
  - Organization と OwnerUser
  - Organization と Subscription

- **一対多 (1:N)**: 
  - Organization と User
  - Organization と Client
  - User と DailyFortune
  - User と ChatHistory
  - Client と BeautyClientChat
  - Client と ClientNote
  - Client と Appointment

- **多対多 (M:N)**: 
  - User と Team（TeamMembershipを介して）
  - User と User（Friendshipを介して）
  - Client と User（ClientStylistCompatibilityを介して）

## 5. 主要な制約条件

- **SuperAdminユーザー**: organizationIdは不要（null）
- **Ownerユーザー**: 各組織には必ず1人のOwnerユーザーが存在する
- **クライアント-組織の関係**: クライアントは必ず1つの組織に属する
- **チームのcreator**: 各チームには必ず1人のcreatorロールメンバーが存在する

## 6. インデックス構成

主なインデックスについては、統合データモデル設計書を参照してください。