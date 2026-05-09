# プロジェクト現状 (STATUS)

**最終更新**: 2026-05-09
**バージョン**: v2.1.0
**開発サーバー**: http://localhost:3000

---

## 📊 プロジェクト概要

電気通信大学情報理工学域Ⅱ類3年生のポートフォリオサイト & アプリケーションハブ

- **ポートフォリオサイト**: 誰でも閲覧可能な公開サイト
- **アプリケーションハブ**: 認証済みユーザーのみ使用可能なプライベートツール群

---

## 🛠️ 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|----------|------|
| Next.js | 14.2.3 | App Router, React Server Components |
| TypeScript | - | 型安全な開発 |
| Tailwind CSS | - | スタイリング |
| shadcn/ui | - | UIコンポーネント |
| Lucide React | - | アイコン |
| Framer Motion | - | アニメーション |
| Sonner | - | Toast通知 |

### バックエンド
| 技術 | 用途 |
|------|------|
| Next.js API Routes | REST API |
| Prisma ORM | データベースアクセス |
| SQLite | 開発用データベース |
| NextAuth.js v4 | 認証（Credentials + Google Provider） |

### ホスティング（予定）
- **Platform**: Vercel
- **Database**: Vercel Postgres（無料枠）

---

## ✅ 実装済み機能

### ポートフォリオサイト（公開）

| ページ | パス | ステータス |
|--------|------|----------|
| トップページ | `/` | ✅ |
| 自己紹介 | `/about` | ✅ |
| 資格・試験 | `/qualifications` | ✅ |
| 実習・インターンシップ | `/internships` | ✅ |
| プロジェクト | `/projects` | ✅ |
| スキル | `/skills` | ✅ |
| 連絡先 | `/contact` | ✅ |

### アプリケーションハブ（認証済みのみ）

| アプリ | パス | ステータス | 機能 |
|--------|------|----------|------|
| ハブトップ | `/hub` | ✅ | ダッシュボード |
| タスク管理 | `/hub/tasks` | ✅ | CRUD、ステータス管理、期限 |
| 家計簿 | `/hub/finance` | ✅ | 収支記録、カテゴリ別集計 |
| 就活管理 | `/hub/jobhunt` | ✅ | 企業管理、選考ステータス |
| メディア管理 | `/hub/media` | ✅ | ゲーム・読書記録、評価 |
| バケツリスト | `/hub/bucket` | ✅ | やりたいこと、進捗管理 |
| AtCoder管理 | `/hub/atcoder` | ✅ | 問題管理、ヒートマップ、統計 |
| 設定 | `/hub/settings` | ✅ | AtCoder ID、データエクスポート |
| 通知一覧 | `/hub/notifications` | ✅ | 通知履歴、既読化 |
| ダッシュボード | `/hub/dashboard` | ✅ | 統計ダッシュボード |
| 検索 | `/hub/search` | ✅ | 全アプリ横断検索 |

### 第2フェーズ：AtCoder連携

| 機能 | ステータス | 説明 |
|--------|----------|------|
| AtCoder ID設定 | ✅ | `/hub/settings` で設定 |
| 提出履歴自動取得 | ✅ | Kenkoooo API使用 |
| 定期同期 | ✅ | Vercel Cronで1時間ごと |
| ヒートマップ | ✅ | GitHub風カレンダーヒートマップ |
| ストリーク管理 | ✅ | 連続日数、週1回の寛容措置 |
| 統計ダッシュボード | ✅ | AC数、挑戦率 etc. |

### 第3フェーズ：習慣化・通知

| 機能 | ステータス | 説明 |
|--------|----------|------|
| コンテストスケジュール | ✅ | CLIST API、モック対応 |
| Google Calendar連携 | ✅ | コンテスト追加、汎用イベント |
| Google OAuth 2.0連携 | ✅ | Googleアカウント認証、アクセストークン管理 |
| Google Tasks同期 | ✅ | タスクの双方向同期、タスクリスト選択 |
| Notion連携 | ✅ | Notionデータベースとの双方向同期 |
| 汎用リマインダー | ✅ | 全アプリ対応、24h/1h前通知 |
| ブラウザ通知 | ✅ | Web Push API |
| アプリ内通知 | ✅ | Toast（Sonner） |
| 通知アイコン | ✅ | 未読バッジ表示 |
| PWA対応 | ✅ | manifest.json |

### 第4フェーズ：拡張機能

| 機能 | ステータス | 説明 |
|--------|----------|------|
| Notion Wiki連携 | ✅ | Wiki/Docs用データベース連携 |
| Notion URL紐づけ | ✅ | タスク、就活、バケツリストにNotionリンク |
| AtCoder解説リンク | ✅ | 公式解説ページへのクイックアクセス |
| データエクスポート | ✅ | JSON/CSV、全アプリ対応 |
| Chrome拡張機能 | ✅ | 通知、クイックアクセス |
| ページ遷移アニメーション | ✅ | Framer Motion |
| キーボードショートカット | ✅ | Cmd+K等 |
| モバイルナビゲーション | ✅ | ボトムナビ |

---

## 🗄️ データベーススキーマ

### 主要モデル

| モデル | 用途 | リレーション |
|--------|------|-------------|
| User | ユーザー、Google OAuth連携 | 全モデルの親 |
| Qualification | 資格・試験 | User |
| Internship | インターンシップ | User |
| TeamExperience | サークル活動 | User |
| Project | プロジェクト | User |
| Skill | スキル | User |
| Task | タスク、Google Tasks同期 | User |
| Income | 収入 | User |
| Expense | 支出 | User |
| JobApplication | 就活応募 | User |
| Game | ゲーム | User |
| Book | 本 | User |
| BucketListItem | バケツリスト | User |
| AtCoderProblem | AtCoder問題メタデータ | - |
| AtCoderUserProblem | ユーザー問題進捗 | User, AtCoderProblem |
| AtCoderSubmission | 提出履歴 | User, AtCoderProblem |
| ContestReminder | コンテストリマインダー | User |
| Reminder | 汎用リマインダー | User |
| NotificationLog | 通知履歴 | User |

---

## 🔧 開発環境

### 現在のポート
- **開発サーバー**: 3000
- **NextAuth URL**: `http://localhost:3000`

### 環境変数（.env.local）
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
CRON_SECRET="change-this-to-a-random-string-in-production"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### ログイン情報
- **URL**: `/login`
- **ユーザー名**: `admin`
- **パスワード**: `admin123`

---

## 📁 プロジェクト構造（主要ファイル）

```
hp/
├── app/
│   ├── layout.tsx           # ルートレイアウト
│   ├── template.tsx         # ページ遷移アニメーション
│   ├── page.tsx             # トップページ
│   ├── about/               # 自己紹介
│   ├── qualifications/      # 資格
│   ├── internships/         # インターン
│   ├── projects/            # プロジェクト
│   ├── skills/              # スキル
│   ├── hub/                 # アプリケーションハブ
│   │   ├── page.tsx         # ハブトップ
│   │   ├── tasks/           # タスク管理
│   │   ├── finance/         # 家計簿
│   │   ├── jobhunt/         # 就活管理
│   │   ├── media/           # メディア管理
│   │   ├── bucket/          # バケツリスト
│   │   ├── atcoder/         # AtCoder管理
│   │   ├── settings/        # 設定
│   │   ├── notifications/   # 通知一覧
│   │   ├── dashboard/       # ダッシュボード
│   │   └── search/          # 検索
│   ├── login/               # ログイン
│   ├── admin/               # 管理者ページ
│   └── api/
│       ├── auth/            # NextAuth
│       ├── cron/            # Cronジョブ
│       ├── hub/             # ハブAPI
│       ├── notifications/   # 通知API（拡張機能用）
│       └── debug/           # デバッグAPI
├── components/
│   ├── ui/                  # shadcn/ui
│   ├── layout/              # Header, Footer, PageTransition
│   ├── hub/                 # ハブ用コンポーネント
│   ├── dashboard/           # ダッシュボード
│   ├── command-palette.tsx  # Cmd+K
│   └── keyboard-shortcuts-help.tsx
├── hooks/
│   └── use-keyboard-shortcuts.ts
├── lib/
│   ├── prisma.ts            # Prismaクライアント
│   ├── auth.ts              # NextAuth設定
│   ├── atcoder.ts           # AtCoder API
│   ├── clist.ts             # CLIST API
│   ├── google-calendar.ts   # Google Calendar
│   └── reminders.ts         # リマインダー管理
├── prisma/
│   ├── schema.prisma        # データベーススキーマ
│   └── dev.db               # SQLiteデータベース
├── extension/               # Chrome拡張機能
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html/js
│   ├── content.js
│   └── icons/
├── public/
│   └── manifest.json        # PWAマニフェスト
├── vercel.json              # Vercel Cron設定
└── docs/                    # ドキュメント
    ├── STATUS.md            # このファイル
    ├── GUIDELINES.md        # 設計方針
    └── ROADMAP.md           # 実装待ち機能
```

---

## 🔄 定期実行ジョブ

| ジョブ | スケジュール | エンドポイント |
|--------|-------------|----------------|
| AtCoder同期 | 1時間ごと | `/api/cron/atcoder-sync` |
| 通知送信 | 15分ごと | `/api/cron/notifications` |

---

## 🚀 デプロイ状況

| 環境 | ステータス | URL |
|------|----------|-----|
| ローカル開発 | ✅ | http://localhost:3003 |
| Vercel（本番） | 🔲 | - |

---

## 📝 最近の変更

### 2026-05-09
- ✅ Notion Wiki連携を実装
  - Wiki/Docs用Notionデータベース連携
  - /wikiアプリでNotionページ一覧表示・検索
  - 各アプリ（タスク、就活、バケツリスト）にNotion URL紐づけ機能
  - AtCoder問題に公式解説ページへのリンク
  - Server Actionsを使用した設定保存
- ✅ ユーザー管理の修正
  - admin@portfolio.local ユーザーの作成
  - 認証セッションとデータベースの整合性を修正
- ✅ Google OAuth 2.0連携を実装
  - NextAuth.jsにGoogleプロバイダーを追加
  - アクセストークン、リフレッシュトークンをデータベースに保存
  - Googleアカウント連携UIを追加
- ✅ Google Tasks同期を実装
  - タスクリストの取得
  - タスクの双方向同期
  - 設定ページでタスクリスト選択・同期オンオフ
- ✅ Chrome拡張機能のタスク完了APIを実装

### 2026-05-07
- ✅ Chrome拡張機能の基本実装完了
- ✅ ページ遷移アニメーション（Framer Motion）
- ✅ Server/Client Componentのicon渡し問題を解決

### 2026-04-30（第2-3フェーズ完了）
- ✅ AtCoder連携
- ✅ コンテストスケジュール
- ✅ リマインダー・通知システム

---

## 🎯 次のステップ

詳細は [ROADMAP.md](ROADMAP.md) を参照

1. **Notion連携** - データベース同期、タスク管理
2. **パフォーマンス最適化** - ヒートマップ、遅延読み
3. **Chrome拡張機能の強化** - 通知音、カスタマイズ
4. **パッケージ化と配布** - Chrome Web Store提出
