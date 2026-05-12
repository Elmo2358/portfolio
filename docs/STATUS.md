# プロジェクト現状 (STATUS)

**最終更新**: 2026-05-11
**バージョン**: v2.2.0
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
| UECポータル | `/hub/uec` | ✅ | お知らせ、予定、時間割 |
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

### 第5フェーズ：AtCoder学習サポートLLM（完了）

| 機能 | ステータス | 説明 |
|--------|----------|------|
| z.ai API連携 | ✅ | ユーザーAPIキー方式（GLM-4.7） |
| AIヒント生成 | ✅ | 問題の3段階ヒント |
| AI Q&Aチャット | ✅ | ストリーミングチャット |
| 会話履歴管理 | ✅ | QaConversationモデル |
| ヒントキャッシュ | ✅ | HintCacheモデル |
| 設定画面統合 | ✅ | z.ai APIキー入力 |
| AtCoderページ統合 | ✅ | 問題編集ダイアログ内AI機能 |
| 問題推薦システム | ✅ | ユーザー分析、推薦アルゴリズム、URL検証、初心者向け段階的推薦 |
| コード分析 | ✅ | 提出コードの取得、AIレビュー、改善提案 |
| 学習プラン生成 | ✅ | 目標設定からの週次プラン、タスク管理 |

**第5フェーズ完了日**: 2026-05-11

### 第6フェーズ：UECポータル連携（実装完了）

**目的**: 大学からのお知らせ・予定・時間割をポータルサイトで確認

**実装方針**: CLIでのログイン + Next.js APIでデータ取得

| ステップ | ステータス | 説明 |
|----------|----------|------|
| Playwright環境セットアップ | ✅ | Playwrightインストール、Chromiumセットアップ |
| モックデータでUI実装 | ✅ | お知らせ、予定、時間割の表示 |
| セッション管理の実装 | ✅ | lib/uec-portal/session.ts |
| CLIログイン実装 | ✅ | scripts/uec-login.ts, scripts/uec-logout.ts |
| スクレイピング処理の実装 | ✅ | lib/uec-portal/scraper.ts |
| ログアウト機能 | ✅ | /api/hub/uec/logout |
| UI統合 | ✅ | CLIログイン案内、データ表示 |
| お知らせ詳細取得 | ✅ | #src1要素から本文抽出 |
| 全お知らせ取得 | ✅ | カテゴリ別クリックですべて取得 |
| カテゴリ別表示 | ✅ | アコーディオンUI、一覧表示切り替え |

**実装済み機能**:
- Prismaスキーマ（UecNotice, UecScheduleEntry, UecTimetableEntry, UecSyncLog）
- APIルート（/api/hub/uec/*）
  - GET/POST /status - 連携状態・有効/無効切り替え
  - GET /login - セッション状態確認
  - POST /logout - ログアウト
  - POST /sync - データ同期
  - GET /notices - お知らせ取得（limit=all対応）
  - GET /schedule - 予定取得
  - GET /timetable - 時間割取得
- UECポータルページ（/hub/uec）- タブ式UI
- セッション管理（.uec-sessions/ディレクトリ、7日有効期限）
- CLI同期機能（`npm run uec:sync`）
  - ブラウザ手動ログイン（2段階認証対応）
  - Enterキーでログイン検出（自動遷移なし）
  - カテゴリ別お知らせ取得（全169件対応）
  - ID+カテゴリ複合キーで重複排除
- お知らせ詳細取得（getNoticeDetail.phpから#src1要素を抽出）
- カテゴリ別表示UI（アコーディオン形式、一覧/カテゴリ切り替え）
- 設定画面連携（UECポータル有効/無効切り替え）

**使用方法**:

```bash
# 同期（ブラウザが起動します）
npm run uec:sync

# ログアウト
npm run uec:logout
```

**技術スタック**:
- Playwright (Chromium)
- Prismaキャッシュモデル
- Next.js API Routes
- Node.js スクリプト（scripts/uec-sync.js）

**制約事項**:
- Vercel Serverless Functionsでは動作しない（ローカルまたはRailway等のコンテナ環境での使用を想定）
- ログインはCLIのみ対応（Webからのログインはセキュリティ上の理由で非対応）

**第6フェーズ完了日**: 2026-05-12

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
| QaConversation | AI Q&A会話履歴 | User |
| CodeReview | AIコードレビュー | User |
| LearningPlan | 学習プラン | User |
| LearningTask | 学習タスク | User, LearningPlan |
| UecNotice | UECお知らせキャッシュ | User |
| UecScheduleEntry | UEC予定キャッシュ | User |
| UecTimetableEntry | UEC時間割キャッシュ | User |
| UecSyncLog | UEC同期ログ | User |

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

### 2026-05-12

- ✅ 第6フェーズ：UECポータル連携お知らせ機能強化
  - お知らせ詳細取得機能（#src1要素から本文抽出）
  - カテゴリ別お知らせ取得（全169件対応）
  - ID+カテゴリ複合キーで重複排除（同じお知らせが複数カテゴリに属する場合に対応）
  - Enterキーでログイン検出（自動遷移によるログイン妨害問題を解決）
  - カテゴリ別表示UI（アコーディオン形式、一覧/カテゴリ表示切り替え）
  - limit=allパラメータ対応ですべてのお知らせを取得
- ✅ コード整理・本番環境準備
  - `lib/uec-portal.ts` からモック関数を削除（スクレイピング実装に置き換え済み）
  - デバッグ用モックAPIを削除（mock-learning-plan, mock-submissions, mock-code-review, etc.）
  - 設定ページをグループ化して整理（外部サービス連携、通知設定、データ管理）
  - 「第3フェーズ実装中」情報カードを削除
  - アプリカードの順序を調整（タスク管理、AtCoder、家計簿、就活、Wiki、メディア、バケツリスト、UEC）

### 2026-05-11

- ✅ 第5フェーズ：コード分析機能実装完了
  - AtCoderからのソースコード取得（lib/atcoder-scraper.ts）
  - AIコードレビュー生成（評価、改善点、バグ検出）
  - CodeReviewモデル（ソースコードキャッシュ、レビュー結果保存）
  - コードレビューカードUI
  - レビュー詳細ダイアログ
- ✅ 第5フェーズ：学習プラン生成機能実装完了
  - 目標設定（レート、日付、重点分野）
  - AIによる週次マイルストーン生成
  - タスク管理（進捗追跡、チェックボックス）
  - タスク詳細説明ボタン（学習ステップ、参考リソース表示）
  - LearningPlan/LearningTaskモデル
  - 学習プランカードUI
- ✅ 第5フェーズ完了（AtCoder学習サポートLLM）
  - Q&Aシステム（ヒント生成、チャットボット）
  - 問題推薦システム（難易度ベース、復習、次のレベル）
  - コード分析（レビュー生成、詳細表示）
  - 学習プラン生成（週次マイルストーン、タスク管理）
- ✅ テスト用モックAPI追加
  - `/api/debug/mock-submissions` - モック提出データ作成
  - `/api/debug/mock-code-review` - モックコードレビュー作成
  - `/api/debug/mock-learning-plan` - モック学習プラン作成

### 2026-05-10

- ✅ 第5フェーズ：問題推薦システム実装完了
  - 難易度ベース推薦（ユーザーのAC問題平均difficultyから適正問題）
  - 初心者向け段階的推薦（AC数 < 5でABC A、< 10でABC B、< 20でABC C）
  - 復習用推薦（過去のAC問題から）
  - 次のレベル推薦（現在のレートより少し上の問題）
  - ワンクリックで問題追加機能
  - z.ai API連携による知能推薦
  - URL検証機能（無効なAtCoder URLの事前検証）
- ✅ 第5フェーズ：AtCoder学習サポートLLM（Q&Aシステム）実装完了
  - z.ai API連携（GLM-4.7、Anthropic互換エンドポイント）
  - ユーザーAPIキー方式（ご自身のz.aiアカウントで利用可能）
  - AIヒント生成（3段階ヒント、キャッシュ機能）
  - AI Q&Aチャット（ストリーミング対応、会話履歴管理）
  - AtCoderページへの統合（問題編集ダイアログ内）
  - 設定画面でz.ai APIキー管理
- ✅ TabsコンポーネントをReact Contextで再実装
- ✅ .gitignoreにdev.dbとsettings.local.jsonを追加

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

### 第5フェーズ：残りの機能

1. **コード分析** - 提出コードの取得と改善提案
2. **学習プラン生成** - 目標設定からのカリキュラム作成

### その他
- **パフォーマンス最適化** - ヒートマップ、遅延読み込み
- **Chrome拡張機能の強化** - 通知音、カスタマイズ
