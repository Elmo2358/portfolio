# Portfolio Website

電気通信大学情報理工学域Ⅱ類情報通信工学プログラムに2024年入学した学生のポートフォリオサイト＆アプリケーションハブです。

**🌐 本番URL**: https://elmo2358.net

## 📚 詳しいドキュメント

プロジェクトの詳細なまとめはこちら：**[docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)**

- セットアップ手順
- データベース構造
- 実装済み機能の詳細
- 第2フェーズ以降の実装計画
- 既知の問題と解決策
- 他のPCでの開発環境構築方法

## ⚡ クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/Elmo2358/portfolio.git
cd portfolio

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集してNEXTAUTH_SECRETなどを設定

# データベースの初期化
npx prisma generate
npx prisma migrate dev
npm run seed

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 にアクセスしてください。

## 🔐 認証情報

- **ログインURL**: http://localhost:3000/login
- **ユーザー名**: `admin`
- **パスワード**: `admin123`

⚠️ **本番環境では必ずパスワードを変更してください！**

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **データベース**: Prisma + SQLite (開発) / PostgreSQL (本番)
- **認証**: NextAuth.js (アプリケーションハブ用)

## プロジェクト構成

```
hp/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホームページ
│   ├── about/               # 自己紹介ページ
│   ├── qualifications/      # 資格・試験ページ
│   ├── internships/         # 実習ページ
│   ├── projects/            # プロジェクトページ
│   └── hub/                 # アプリケーションハブ (将来的に実装)
├── components/              # Reactコンポーネント
│   ├── ui/                  # shadcn/uiコンポーネント
│   ├── layout/              # レイアウトコンポーネント
│   ├── portfolio/           # ポートフォリオ用コンポーネント
│   └── hub/                 # ハブ用コンポーネント
├── lib/                     # ユーティリティライブラリ
│   ├── prisma.ts           # Prismaクライアント
│   ├── auth.ts             # 認証設定
│   └── utils.ts            # ユーティリティ関数
├── prisma/                  # Prismaスキーマ
│   └── schema.prisma       # データベーススキーマ
└── public/                  # 静的ファイル
```

## 始め方

### インストール

```bash
npm install
```

### データベースセットアップ

```bash
npx prisma generate
npx prisma migrate dev
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

### ビルド

```bash
npm run build
```

### 本番環境での実行

```bash
npm run start
```

## ページ一覧

### 公開ページ（ポートフォリオ）

- **ホーム** (`/`) - トップページ、専攻分野の紹介
- **自己紹介** (`/about`) - 経歴、スキル、趣味
- **資格・試験** (`/qualifications`) - 取得した資格や試験のスコア
- **実習** (`/internships`) - インターンシップや実習の経験
- **プロジェクト** (`/projects`) - 制作したプロジェクトや作品

### プライベートページ（アプリケーションハブ）

- **ハブトップ** (`/hub`) - 各アプリケーションの入口
- **タスク管理** (`/hub/tasks`) - 将来的に実装
- **収入・家計簿** (`/hub/finance`) - 将来的に実装
- **就活管理** (`/hub/jobhunt`) - 将来的に実装
- **メディア管理** (`/hub/media`) - 将来的に実装
- **やりたいことリスト** (`/hub/bucket`) - 将来的に実装

## デプロイ

2つの方法でデプロイできます：

### 方法1: Vercelダッシュボード（簡単）

1. GitHubリポジトリを作成してコードをプッシュ
2. [Vercel](https://vercel.com) にアクセスしてインポート
3. 環境変数を設定（DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET）
4. デプロイ完了

### 方法2: Terraform（Infrastructure as Code）

```bash
cd terraform
terraform init
terraform apply
```

詳しくは [DEPLOYMENT.md](DEPLOYMENT.md) を参照してください。

## 今後の予定

- [x] 認証機能の実装 (NextAuth.js) - ✅ 完了
- [x] カラフルなデザインとアニメーションの追加 - ✅ 完了
- [ ] データベースとの連携
- [ ] アプリケーションハブの各アプリ実装
  - [ ] タスク管理アプリ
  - [ ] 収入・家計簿アプリ
  - [ ] 就活管理アプリ
  - [ ] メディア管理アプリ
  - [ ] やりたいことリストアプリ
- [ ] ダークモード切替機能
- [ ] SEO最適化

## 認証について

アプリケーションハブ（`/hub`）には認証が必要です。

### ログイン

ログインURL: http://localhost:3000/login

### デフォルト認証情報

- **ユーザー名**: `admin`
- **パスワード**: `admin123`

### 本番環境での設定

本番環境では`.env`ファイルで以下の環境変数を設定してください：

```env
ADMIN_USERNAME="your-username"
ADMIN_PASSWORD="your-secure-password"
NEXTAUTH_SECRET="your-long-random-secret-key"
```

⚠️ **重要**: 本番環境では必ずデフォルトのパスワードを変更してください！

## ライセンス

MIT

## 作者

電気通信大学 情報理工学域2類 情報通信工学プログラム 2024年入学
