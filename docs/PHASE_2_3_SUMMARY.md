# 第2-3フェーズ実装总结

## 実施期間
2025年X月X日 - 2025年X月X日

---

## 第2フェーズ：AtCoder問題管理アプリ

### 目的
競技プログラミングの学習履歴を管理・可視化し、継続的な学習習慣を身につける。

### 実装機能

#### 1. AtCoder連携
- **AtCoder ID設定**: `/hub/settings` でAtCoderユーザーIDを保存
- **提出履歴の自動取得**: Kenkoooo API（AtCoder Problems API）を使用
  - ユーザーの全提出履歴を取得
  - ACした問題を自動的に問題管理に反映
- **定期同期**: Vercel Cronで1時間ごとに自動同期

#### 2. 問題管理機能
- **問題一覧表示**: 難易度・ステータス・タグでフィルタリング
- **問題ステータス**:
  - `unattempted`: 未挑戦
  - `in_progress`: 挑戦中
  - `contest_ac`: コンテスト中にAC
  - `upsolved_ac：コンテスト後にAC
  - `review`: 復習中
- **メモ機能**: 各問題にメモ・解法を保存
- **検索機能**: 問題タイトル・IDで検索

#### 3. 学習履歴の可視化
- **ヒートマップ**: GitHubコントリビューションのようなカレンダーヒートマップ
  - 日付ごとの提出数を色分け表示
  - 個別の問題詳細も確認可能
- **ストリーク管理**: 連続日数の可視化
  - 週1回の「寛容措置」（0提出でもストリーク継続）
  - 現在のストリーク、最長ストリークを表示

#### 4. 技術的な実装
- **API**: `/api/hub/atcoder/*`
  - `/sync`: AtCoder IDを保存して即時同期
  - `/stats`: ストリーク統計を取得
  - `/heatmap`: ヒートマップデータを取得
- **外部API**:
  - `lib/atcoder.ts`: Kenkoooo APIのラッパー
  - snake_case対応（epochSecondなど）
- **データベース**:
  - `AtCoderProblem`: 問題メタデータ
  - `AtCoderUserProblem`: ユーザーの問題進捗管理
  - `AtCoderSubmission`: 提出履歴

---

## 第3フェーズ：習慣化とライブコンテスト連携

### 目的
ライブコンテストへの参加を促進し、リマインダーシステムで習慣化をサポート。

### 実装機能

#### 1. コンテストスケジュール
- **CLIST API連携**: `lib/clist.ts`で競技プログラミングサイトのコンテストを取得
  - AtCoder, Codeforces, yukicoderなどに対応
  - モックデータフォールバック（APIキー未設定時）
- **コンテスト表示**:
  - 今後のコンテスト一覧を表示
  - サイト名、開始時刻、コンテスト時間を表示
- **リマインダー設定**: 各コンテストに通知オン・オフ

#### 2. Google Calendar連携
- **カレンダー追加**: コンテストをGoogleカレンダーに追加
  - API: `/api/hub/atcoder/calendar`
  - イベント作成時に24時間前・1時間前のリマインダーも設定
  - カレンダーリンクを自動的に新しいタブで開く
- **汎用カレンダー連携**: `lib/google-calendar.ts`
  - `createContestEvent`: コンテスト用
  - `createGenericEvent`: タスク・就活など汎用
  - `addEventToCalendar`: Google Calendar API v3で追加

#### 3. 汎用リマインダーシステム
- **Reminderモデル**: 全アプリ共通のリマインダー機能
  - タスク、就活、バケツリスト、コンテストに対応
  - 通知タイミングのカスタマイズ（24時間前・1時間前）
  - Googleカレンダーとの紐付け（calendarEventId）
- **NotificationLogモデル**: 通知履歴を記録
  - 送信日時、ステータス（sent/failed）
  - 既読・未読の管理

#### 4. 通知送信システム
- **Cronジョブ**: `/api/cron/notifications`
  - 15分ごとに実行（Vercel Cron設定）
  - 通知時刻が来たリマインダーを自動送信
  - 事前通知（24時間前・1時間前）にも対応
- **通知方法**:
  - **アプリ内通知**: Toast（Sonnerライブラリ）
  - **ブラウザ通知**: Web Push API（Notification.requestPermission）
  - **通知アイコン**: ヘッダーのベルアイコンで未読数を表示
- **リアルタイム更新**: `useNotifications`フックで30秒ごとにポーリング

#### 5. UIコンポーネント
- **ReminderButton**: 汎用リマインダー設定ボタン
  - Dialog（Radix UI）で通知日時・タイミングを設定
  - カレンダー追加のチェックボックス
- **NotificationIcon**: 通知ドロップダウン
  - 未読バッジ表示
  - 通知一覧・既読化機能
- **通知一覧ページ**: `/hub/notifications`
  - 全通知履歴を表示
  - 既読化・削除が可能

#### 6. PWA対応
- **manifest.json**: ホーム画面に追加対応
  - name, short_name, display: standalone
  - shortcuts: Hubへのクイックアクセス
- **metaタグ**:
  - `mobile-web-app-capable`: スマートフォン対応
  - `apple-mobile-web-app-*`: iOS対応

---

## 技術スタック

### フロントエンド
- **Next.js 14.2**: App Router, React Server Components
- **TypeScript**: 型安全な開発
- **shadcn/ui**: UIコンポーネントライブラリ
  - Dialog, DropdownMenu, Checkbox, Toastなど
- **Tailwind CSS**: スタイリング
- **date-fns**: 日付フォーマット（日本語ロケール）

### バックエンド
- **Next.js API Routes**: REST API
- **Prisma ORM**: データベースアクセス
- **SQLite**: 開発環境（本番はVercel Postgres想定）

### 認証
- **NextAuth.js v4**: GitHub/Google OAuth
- **Session管理**: ユーザー認証状態管理

### 外部API
- **AtCoder Problems API**: Kenkoooo API
  - 提出履歴、問題情報、コンテスト情報
- **CLIST API**: コンテストスケジュール（オプション）
- **Google Calendar API v3**: カレンダー連携

### 通知
- **Sonner**: Toast通知ライブラリ
- **Web Push API**: ブラウザ通知
- **Vercel Cron**: 定期実行

---

## データベーススキーマ

### 追加したモデル
1. **AtCoderProblem**: 問題メタデータ
2. **AtCoderUserProblem**: ユーザーの問題進捗
3. **AtCoderSubmission**: 提出履歴
4. **ContestReminder**: コンテストリマインダー（専用）
5. **Reminder**: 汎用リマインダー
6. **NotificationLog**: 通知履歴

---

## ディレクトリ構造

```
hp/
├── app/
│   ├── api/
│   │   ├── cron/                          # Cronジョブ
│   │   │   ├── atcoder-sync/              # AtCoder定期同期
│   │   │   └── notifications/             # 通知送信
│   │   ├── debug/                         # 開発用デバッグAPI
│   │   │   ├── trigger-notifications/    # 手動通知トリガー
│   │   │   └── check-reminders/          # リマインダー確認
│   │   └── hub/
│   │       ├── atcoder/                   # AtCoder関連API
│   │       │   ├── calendar/             # Googleカレンダー
│   │       │   ├── contests/              # コンテストスケジュール
│   │       │   ├── heatmap/               # ヒートマップ
│   │       │   ├── reminders/             # コンテストリマインダー
│   │       │   ├── sync/                  # AtCoder同期
│   │       │   └── stats/                 # 統計情報
│   │       ├── notifications/             # 通知管理
│   │       │   ├── [id]/read/             # 既読化
│   │       │   └── [id]/                  # 削除
│   │       └── reminders/                 # 汎用リマインダー
│   ├── hub/
│   │   ├── atcoder/                       # AtCoder管理ページ
│   │   ├── notifications/                 # 通知一覧ページ
│   │   ├── settings/                      # 設定ページ
│   │   └── layout.tsx                     # NotificationsProvider
│   └── layout.tsx                         # Toaster追加
├── components/
│   ├── hub/
│   │   ├── atcoder/                       # AtCoder関連コンポーネント
│   │   │   ├── heatmap.tsx                # ヒートマップ
│   │   │   ├── streak-card.tsx            # ストリークカード
│   │   │   └── contest-schedule.tsx       # コンテストスケジュール
│   │   ├── reminder-button.tsx            # 汎用リマインダーボタン
│   │   ├── notifications-provider.tsx     # 通知ポーリング
│   │   ├── atcoder-manager.tsx            # 既存（更新）
│   │   ├── tasks-manager.tsx              # 既存（更新）
│   │   ├── jobhunt-manager.tsx            # 既存（更新）
│   │   └── bucket-list-manager.tsx        # 既存（更新）
│   ├── layout/
│   │   ├── notification-icon.tsx          # 通知アイコン
│   │   └── Header.tsx                     # 既存（更新）
│   └── ui/                                 # shadcn/uiコンポーネント
│       ├── checkbox.tsx
│       ├── dialog.tsx                      # 更新（Radix UI）
│       └── dropdown-menu.tsx
├── hooks/
│   └── use-notifications.ts               # 通知ポーリングフック
├── lib/
│   ├── atcoder.ts                         # AtCoder APIラッパー
│   ├── clist.ts                           # CLIST APIラッパー
│   ├── google-calendar.ts                 # Google Calendar API
│   └── reminders.ts                       # リマインダー管理
├── prisma/
│   └── schema.prisma                       # データベーススキーマ
└── public/
    └── manifest.json                       # PWAマニフェスト
```

---

## 追加したnpmパッケージ

### 依存関係
- `sonner`: Toast通知
- `@radix-ui/react-dialog`: Dialogコンポーネント
- `@radix-ui/react-dropdown-menu`: DropdownMenu
- `@radix-ui/react-checkbox`: Checkbox
- `date-fns`: 日付操作
- `@prisma/client`: Prisma Client

---

## Vercel設定

### vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/atcoder-sync",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/notifications",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- **AtCoder同期**: 1時間ごと（0 * * * *）
- **通知送信**: 15分ごと（*/15 * * * *）

---

## 環境変数

### .env.example
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Cron Job Secret
CRON_SECRET="change-this-to-a-random-string-in-production"

# CLIST API（オプション）
# CLIST_USERNAME="your-username"
# CLIST_API_KEY="your-api-key"

# Google Calendar API（オプション）
# GOOGLE_CALENDAR_ACCESS_TOKEN="your-access-token"

# OAuth Providers（オプション）
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

---

## 既知の問題と制限事項

### 技術的な制限
1. **CLIST API**: 認証形式の問題でモックデータ使用中
2. **開発環境のCronジョブ**: Vercelデプロイ後のみ自動実行
   - 開発中は `/api/debug/trigger-notifications` で手動トリガー
3. **Google Calendar**: アクセストークン直入力（OAuth未実装）

### デザインの課題
1. **レスポンシブ対応**: 一部のUIでモバイル表示に改善の余地
2. **ダークモード**: 一部のコンポーネントで色調整が必要

---

## 今後の改善案

### 第4フェーズで実装予定
1. **Chrome拡張機能**: サイト外通知
2. **メール通知**: Resend/SendGrid統合
3. **パフォーマンス最適化**: ヒートマップのレンダリング
4. **テスト**: 単体テスト・E2Eテスト追加

---

## 学んだこと

### 技術的知見
1. **PrismaのBigInt**: SQLiteではInt型が扱いやすい
2. **Radix UI**: Dialog, DropdownMenuなどモダンコンポーネントの実装
3. **Cronジョブ**: Vercel Cronの設定とデバッグ方法
4. **Web Push API**: ブラウザ通知の権限リクエストと実装
5. **PWA**: manifest.jsonとmetaタグの設定

### 開発プロセス
1. **段階的実装**: 第2フェーズ→第3フェーズと順を追って実装
2. **エラーハンドリング**: APIエラー時のモックデータフォールバック
3. **UIフィードバック**: ユーザーからのフィードバックでレイアウト調整
4. **Git管理**: コミットメッセージでの履歴管理

---

## コミット情報

- **Commit**: `d336963`
- **Message**: `feat: 第2-3フェーズ実装（AtCoder連携・リマインダー・通知システム）`
- **Date**: 2025年X月X日
- **Files**: 48 files changed, 5496 insertions(+), 263 deletions(-)
