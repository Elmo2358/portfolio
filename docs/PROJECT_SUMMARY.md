# ポートフォリオサイト & AtCoder問題管理アプリ - プロジェクトまとめ

**作成日**: 2026年4月30日  
**GitHub**: https://github.com/Elmo2358/portfolio  
**ステータス**: 第1フェーズ（MVP）完了

---

## 📋 プロジェクト概要

電気通信大学情報理工学域Ⅱ類3年の学生が作成した、以下の2つの機能を統合したWebアプリケーション：

1. **ポートフォリオサイト**: 誰でも閲覧可能な公開サイト
2. **アプリケーションハブ**: 認証済みユーザー（本人）のみが使用するプライベートツール群

---

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: Next.js 14.2.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: CSSアニメーション（globals.cssに定義）

### バックエンド
- **API Routes**: Next.js API Routes
- **Database ORM**: Prisma ORM
- **Database**: SQLite（開発）/ PostgreSQL（本番予定）

### 認証
- **Auth Library**: NextAuth.js v4
- **Strategy**: Credentials Provider（ユーザー名/パスワード）

### ホスティング（予定）
- **Platform**: Vercel
- **Database**: Vercel Postgres（無料枠）

---

## 📁 プロジェクト構造

```
hp/
├── prisma/
│   ├── schema.prisma          # データベーススキーマ定義
│   ├── seed.ts                # 初期データ（ポートフォリオ情報）
│   └── dev.db                 # SQLiteデータベース（開発用）
├── app/
│   ├── layout.tsx             # ルートレイアウト（ヘッダー、フッター）
│   ├── page.tsx               # トップページ
│   ├── about/                 # 自己紹介ページ
│   ├── qualifications/        # 資格・試験ページ
│   ├── internships/           # 実習・インターンシップページ
│   ├── projects/              # プロジェクトページ
│   ├── skills/                # スキルページ
│   ├── contact/               # 連絡先ページ
│   ├── hub/                   # アプリケーションハブ（認証済みのみ）
│   │   ├── layout.tsx         # ハブ用レイアウト（認証チェック）
│   │   ├── page.tsx           # ハブトップ
│   │   ├── tasks/             # タスク管理アプリ
│   │   ├── finance/           # 家計簿アプリ
│   │   ├── jobhunt/           # 就活管理アプリ
│   │   ├── media/             # メディア管理アプリ
│   │   ├── bucket/            # やりたいことリストアプリ
│   │   └── atcoder/           # AtCoder問題管理アプリ
│   ├── login/                 # ログインページ
│   └── api/
│       ├── auth/[...nextauth]/  # NextAuth.js 認証API
│       ├── hub/atcoder/        # AtCoderアプリAPI
│       └── (その他APIルート)
├── components/
│   ├── ui/                    # shadcn/ui コンポーネント
│   ├── layout/                # レイアウトコンポーネント
│   ├── hub/                   # ハブ用マネージャーコンポーネント
│   └── theme-provider.tsx     # テーマプロバイダー
├── lib/
│   ├── auth.ts                # NextAuth.js 設定
│   ├── prisma.ts              # Prisma クライアント
│   └── utils.ts               # ユーティリティ関数
├── types/
│   └── next-auth.d.ts         # NextAuth 型拡張
├── .env.local                 # 環境変数（Git除外）
└── docs/                      # ドキュメント（このファイル）
```

---

## 🗄️ データベーススキーマ

### 主要モデル

#### 1. User（ユーザー）
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          String    @default("user")
  // リレーション
  qualifications Qualification[]
  internships     Internship[]
  teamExperiences TeamExperience[]
  projects        Project[]
  skills          Skill[]
  tasks           Task[]
  incomes         Income[]
  expenses        Expense[]
  jobApplications JobApplication[]
  games           Game[]
  books           Book[]
  bucketListItems BucketListItem[]
  atCoderUserProblems AtCoderUserProblem[]
  atCoderSubmissions AtCoderSubmission[]
}
```

#### 2. AtCoderProblem（問題メタデータ）
```prisma
model AtCoderProblem {
  id          String   @id  // 問題ID (例: abc250_a)
  contestId   String        // コンテストID (例: abc250)
  title       String        // 問題タイトル
  difficulty  Int?          // 推定難易度
  tags        String?       // アルゴリズムタグ（JSON配列）
  url         String        // AtCoder問題ページURL
  userProblems  AtCoderUserProblem[]
  submissions   AtCoderSubmission[]
}
```

#### 3. AtCoderUserProblem（ユーザー進捗管理）
```prisma
model AtCoderUserProblem {
  id             String   @id @default(cuid())
  userId         String
  problemId      String
  status         String   @default("unattempted")
  memo           String?
  lastAttempted  DateTime?
  problem        AtCoderProblem @relation(fields: [problemId], references: [id])
  userRel        User           @relation(fields: [userId], references: [id])

  @@unique([userId, problemId])
}
```

#### 4. AtCoderSubmission（提出履歴）
```prisma
model AtCoderSubmission {
  id             String   @id
  userId         String
  problemId      String
  language       String
  result         String
  executionTime  Int?
  epochSecond    BigInt
  problem        AtCoderProblem @relation(fields: [problemId], references: [id])
  userRel        User           @relation(fields: [userId], references: [id])
}
```

### ステータス定義
- `unattempted`: 未着手
- `in_progress`: 途中
- `contest_ac`: コンテスト内AC
- `upsolved_ac`: コンテスト後AC
- `review`: 復習中

---

## ✅ 第1フェーズ（MVP）実装済み機能

### ポートフォリオサイト（公開）
1. **トップページ** (`/`)
   - ヒーローセクション
   - 基本情報（大学、専攻、キャッチフレーズ）
   - 最新実習・プロジェクト・スキルのプレビュー

2. **自己紹介ページ** (`/about`)
   - 基本情報（大学、入学年度、キャリアビジョン）
   - 関心のある分野（無線通信、防衛産業、宇宙開発）
   - サークル活動・チーム開発経験（team411での活動）
   - 趣味・興味

3. **資格・試験ページ** (`/qualifications`)
   - TOEIC 650点、ITパスポート合格
   - 応用情報技術者試験（今年再受験予定）
   - 陸上無線技術士（1陸特、2026年6月受験予定）

4. **実習・インターンシップページ** (`/internships`)

5. **プロジェクトページ** (`/projects`)
   - りさナビ（LLMチャットボット）
   - Discord Bot、VRChatワールド制作など

6. **スキルページ** (`/skills`)
   - TypeScript、Next.js、React、Git/GitHub
   - レベル1-5で表示

7. **連絡先ページ** (`/contact`)
   - GitHub、Qiita、Zennへのリンク

### アプリケーションハブ（プライベート）
1. **タスク管理アプリ** (`/hub/tasks`)
   - CRUD操作
   - ステータス管理（todo, in_progress, completed）
   - 優先度設定、期限管理

2. **家計簿アプリ** (`/hub/finance`)
   - 収入・支出の記録
   - カテゴリ別集計
   - よく使う項目のクイック追加

3. **就活管理アプリ** (`/hub/jobhunt`)
   - 本選考・インターンシップ対応
   - 選考ステータス管理
   - 統計ダッシュボード

4. **メディア管理アプリ** (`/hub/media`)
   - ゲーム・読書の記録
   - 評価システム（1-5）
   - 完了状況管理

5. **やりたいことリストアプリ** (`/hub/bucket`)
   - 旅行・体験・目標の管理
   - カテゴリ別表示
   - 優先度・ステータス管理

6. **AtCoder問題管理アプリ** (`/hub/atcoder`) ⭐ NEW
   - 問題の手動追加・編集・削除
   - 5段階ステータス管理
   - メモ機能
   - 検索・フィルタリング（問題名、ID、ステータス）
   - 統計ダッシュボード
     - 総問題数、AC数、挑戦率、AC率、ストリーク

---

## 🚀 第2フェーズ以降の実装計画

### 第2フェーズ：自動同期と統計ダッシュボード
**目標**: 手動入力の負荷を排除し、学習可視化を実現

1. **AtCoder Problems API (Kenkoooo API) との連携**
   - ユーザーの提出履歴を自動取得
   - 問題のメタデータを自動同期
   - バックグラウンドでの定期同期（Cronジョブ）
   - **注意**: リクエスト間に1秒以上のスリープ必須（IPブロック対策）

2. **統計ダッシュボードの拡張**
   - ヒートマップ（学習履歴の可視化）
   - コンテスト別AC数推移
   - 難易度別AC数
   - ストリーク管理の強化（連続日数表示）

### 第3フェーズ：習慣化とライブコンテスト連携
1. **CLIST API連携**
   - ライブコンテストスケジュールの自動取得
   - Google Calendar APIとの連携
   - リマインダー設定（コンテスト24時間前、1時間前）

2. **ゲーミフィケーション**
   - ヒートマップの視覚化
   - ストリークメカニクス（週1回の寛容措置）
   - 進捗の可視化

### 第4フェーズ：AI連携とパーソナライズ
1. **OpenAI Structured Outputsの統合**
   - ユーザーの提出データ分析
   - C++学習パスの自動生成
   - コード分析と改善提案

2. **LLMによる学習アドバイス**
   - 弱点分野の特定
   - 次に学ぶべきトピックの推奨
   - 推奨問題の提示

---

## 🔧 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/Elmo2358/portfolio.git
cd portfolio
```

### 2. 依存関係のインストール
```bash
npm install
# または
yarn install
# または
pnpm install
```

### 3. 環境変数の設定
`.env.local`ファイルを作成：

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# 管理者認証情報（任意、デフォルト: admin/admin123）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

### 4. データベースの初期化
```bash
# Prismaクライアントの生成
npx prisma generate

# マイグレーションの実行
npx prisma migrate dev

# シードデータの投入
npm run seed
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

サーバーが起動したら、 http://localhost:3000 にアクセス。

### 6. ログイン情報
- **URL**: http://localhost:3000/login
- **ユーザー名**: `admin`
- **パスワード**: `admin123`

---

## 📝 開発手順

### コミット前にやること
1. 変更を確認: `git status`
2. 変更をステージ: `git add .`
3. コミット: `git commit -m "メッセージ"`
4. プッシュ: `git push origin main`

### マイグレーション作成時
```bash
npx prisma migrate dev --name migration_name
```

### シードデータの再投入
```bash
npm run seed
```

### 開発サーバーの再起動
`.next`キャッシュが破損した場合：
```bash
rm -rf .next node_modules/.cache
npm run dev
```

---

## 🎨 デザインシステム

### カラーパレット
- **Primary**: Emerald（エメラルド）
  - メインカラー: `bg-emerald-600`, `text-emerald-600`
  - ホバー: `hover:bg-emerald-700`
  - ダークモード: `bg-emerald-500`, `text-emerald-400`

### アニメーション（globals.css）
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn, .animate-slideUp, .stagger-200 などで使用
```

### コンポーネントスタイル
- カード: 角丸、ボーダー（emeraldベース）
- ボタン: グラデーションなし、単色
- アニメーション: 純CSSで実装（Framer Motion不使用）

---

## ⚠️ 既知の問題と解決策

### 1. .nextキャッシュ破損エラー
**症状**: 
```
Error: Could not find the module "app/providers.tsx#Providers"
```

**解決策**:
```bash
rm -rf .next node_modules/.cache
npm run dev
```

### 2. Framer Motionビルドエラー
**症状**: Next.js 14.2.3と互換性なし

**解決策**: 純CSSアニメーションに移行（既に実装済み）

### 3. SQLiteでの検索エラー
**症状**: `Unknown argument 'mode'`

**解決策**: `mode: "insensitive"` を削除（SQLiteでは非対応）

### 4. AtCoder Problems APIのレートリミット
**注意**: リクエスト間に必ず1秒以上のスリープを入れる

### 5. ダークモード時の色見づき
**解決策**: `dark:`プレフィックスでダークモード用の色を定義

---

## 🔐 環境変数

### 開発環境（.env.local）
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

### 本番環境（Vercel設定）
```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="本番用の強力なシークレットキー"
```

---

## 🚀 デプロイ手順（Vercel）

### 1. Vercelプロジェクトの作成
1. https://vercel.com にアクセス
2. 「Add New Project」をクリック
3. GitHubリポジトリをインポート

### 2. 環境変数の設定
Vercelダッシュボードの「Settings」→「Environment Variables」で以下を追加：
- `DATABASE_URL`: PostgreSQL接続URL
- `NEXTAUTH_URL`: 本番ドメイン
- `NEXTAUTH_SECRET`: ランダムな文字列

### 3. デプロイ
- 「Deploy」ボタンをクリック
- 自動ビル＆デプロイが完了

### 4. Prismaの設定
```bash
# 本番環境でデータベースをプッシュ
npx prisma db push
```

---

## 📊 第1フェーズ完了時の統計

- **ファイル数**: 86ファイル
- **コード行数**: 約17,399行
- **実装期間**: 数日（MVPのみ）
- **主要機能**: 13ページ（ポートフォリオ6 + ハブ6アプリ + 認証）

---

## 📚 仕様書・ドキュメント

- **アプリケーションロードロードマップ**: `APPLICATION_ROADMAP.md`
- **実装計画**: `IMPLEMENTATION_PLAN.md`
- **AtCoderアプリ仕様**: `AtCodersupport.md`

---

## 🤝 コントリビューション

このプロジェクトはMITライセンスの下で公開されています。

### 第3者ライブラリ
- Next.js
- React
- Prisma
- NextAuth.js
- shadcn/ui
- Lucide React
- Tailwind CSS

---

## 📞 サポート

### 問題報告
- GitHub Issues: https://github.com/Elmo2358/portfolio/issues

### 作者情報
- **名前**: Elmo
- **大学**: 電気通信大学 情報理工学域Ⅱ類 情報通信工学プログラム
- **卒業年度**: 2027年予定（現在3年生）
- **GitHub**: https://github.com/Elmo2358

---

## ⏰ 定期同期機能

### 概要
AtCoderの提出履歴を毎時自動的に取得し、データベースを更新します。

### 技術仕様
- **Vercel Cron Jobs**: 毎時0分に実行（`0 * * * *`）
- **APIエンドポイント**: `/api/cron/atcoder-sync`
- **認証**: `CRON_SECRET` 環境変数によるBearerトークン認証
- **処理内容**:
  1. AtCoder IDを持つ全ユーザーを取得
  2. 各ユーザーの最新の提出履歴（100件）を取得
  3. 新しい提出のみを処理（重複排除）
  4. 問題メタデータを作成/更新
  5. ユーザーの進捗を更新

### 環境変数
```bash
# .env.local または .env.production
CRON_SECRET="random-secret-string-here"
```

### 本番環境へのデプロイ
1. Vercelプロジェクトの環境変数に `CRON_SECRET` を設定
2. `vercel.json` のcron設定が自動的に適用される
3. デプロイ完了後、毎時自動実行が開始

### 手動同期（開発環境）
開発環境ではcronが動作しないため、手動で同期できます：

```bash
# 設定ページから
1. http://localhost:3000/hub/settings にアクセス
2. 「今すぐ同期」ボタンをクリック

# またはAPIを直接呼び出し
curl -X POST http://localhost:3000/api/debug/cron
```

### APIレスポンス例
```json
{
  "success": true,
  "message": "AtCoder sync completed",
  "stats": {
    "usersProcessed": 5,
    "submissionsProcessed": 23,
    "problemsUpdated": 12,
    "errors": 0
  }
}
```

### ログの確認

```bash
# Vercelダッシュボード
1. プロジェクトの「Deployments」タブ
2. 最新のデプロイをクリック
3. 「Logs」でcronジョブの実行ログを確認

# またはVercel CLI
vercel logs --follow
```

---

## 🎯 次のステップ

### 第2フェーズの残り実装：
1. AtCoder Problems API (Kenkoooo API) の調査
2. バックグラウンド同期ジョブの設計
3. ヒートマップコンポーネントの実装
4. CLIST APIとの連携

### 開発を継続するには：
1. `git pull origin main` で最新の変更を取得
2. `npm install` で依存関係をインストール
3. `npx prisma migrate dev` で最新のマイグレーションを適用
4. `npm run dev` で開発サーバーを起動

---

**最終更新**: 2026年4月30日  
**バージョン**: v1.0.0 (MVP - 第1フェーズ完了)
