# ポートフォリオサイト + アプリケーションハブ実装計画

## プロジェクト概要

電気通信大学情報理工学域**2類**情報通信工学プログラムに2024年入学した学生さんが、ポートフォリオサイトと個人的なアプリケーションハブを作成するプロジェクトです。

---

## 技術スタック

### フロントエンド
- **Next.js 14+ (App Router) + TypeScript**
- **shadcn/ui + Tailwind CSS** - モダンでおしゃれなUIコンポーネント
- **Framer Motion** - アニメーション

### バックエンド
- **Next.js API Routes** - フロントエンドと統合されたバックエンド
- **Prisma ORM** - タイプセーフなデータベース操作

### データベース
- **開発**: SQLite（手軽にセットアップ）
- **本番**: Vercel Postgres（マネージドサービス）

### 認証
- **NextAuth.js** - アプリケーションハブのアクセス制御

### ホスティング
- **Vercel** - Next.js製作者による最適化されたプラットフォーム
- 無料枠で運用可能

---

## データベーススキーマ

### 主なモデル

#### User（ユーザー）
- 認証情報
- ロール（admin/user）

#### ポートフォリオ用モデル（公開）
- **Qualification** - 資格・試験情報
- **Internship** - 実習・インターンシップ
- **Project** - プロジェクト・作品
- **Skill** - スキル・専攻分野

#### アプリケーションハブ用モデル（プライベート）
- **Task** - タスク管理
- **Income** - 収入管理
- **Expense** - 家計簿
- **JobApplication** - 就活管理
- **Game** - ゲーム履歴
- **Book** - 読書履歴
- **BucketListItem** - やりたいことリスト

---

## アクセス制御

### ポートフォリオサイト（/）
- 誰でも閲覧可能
- 読み取り専用API

### アプリケーションハブ（/hub）
- NextAuth.jsで認証必須
- 本人のみアクセス可能
- 認証されたユーザーのみがCRUD操作可能

---

## ページ構成

### ポートフォリオサイト（公開）

1. **ホームページ（/）**
   - ヒーローセクション（名前、大学、専攻）
   - プロフィール概要
   - 最新実習・プロジェクト
   - スキルサマリー

2. **自己紹介（/about）**
   - 詳細な経歴
   - 研究興味（無線通信、通信工学、情報理論）
   - 趣味・興味

3. **資格・試験（/qualifications）**
   - 資格カードグリッド
   - TOEICスコア推移
   - カテゴリ別フィルタリング

4. **実習・インターンシップ（/internships）**
   - タイムライン形式
   - 学んだことの詳細

5. **プロジェクト（/projects）**
   - プロジェクトカードグリッド
   - 技術スタックタグ
   - GitHub/デモURL

### アプリケーションハブ（プライベート）

1. **ハブトップ（/hub）**
   - 各アプリへのナビゲーション

2. **タスク管理（/hub/tasks）**
   - CRUD操作、ステータス管理

3. **収入・家計簿（/hub/finance）**
   - 収支記録とレポート

4. **就活管理（/hub/jobhunt）**
   - 企業情報、選考ステータス

5. **メディア管理（/hub/media）**
   - ゲーム・読書履歴

6. **やりたいこと（/hub/bucket）**
   - バケツリスト管理

---

## デザインシステム

### カラーパレット

**ライトモード:**
- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Accent: Cyan (#06b6d4)
- Background: White (#ffffff)
- Foreground: Dark Slate (#0f172a)

**ダークモード:**
- Background: Dark Slate (#0f172a)
- Foreground: Light Gray (#f1f5f9)

### タイポグラフィ
- 見出し: Noto Sans JP
- 本文: Inter / Noto Sans JP
- コード: JetBrains Mono

---

## 実装フェーズ

### フェーズ1: プロジェクトセットアップ
- Next.jsプロジェクト作成
- パッケージインストール
- shadcn/ui初期化
- Prismaセットアップ
- Gitリポジトリ作成

### フェーズ2: データベース構築
- スキーマ定義
- マイグレーション実行
- シードデータ作成

### フェーズ3: 基本レイアウト
- ルートレイアウト
- ダークモード実装
- レスポンシブデザイン
- ページ遷移アニメーション

### フェーズ4: ポートフォリオページ実装
- ホームページ
- 自己紹介ページ
- 資格ページ
- 実習ページ
- プロジェクトページ
- API実装

### フェーズ5: 認証システム
- NextAuth.js設定
- GitHub/Google OAuth

### フェーズ6: デプロイ
- Vercel設定
- データベース設定
- 本番デプロイ

---

## プロジェクト構造

```
hp/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── qualifications/
│   │   ├── internships/
│   │   ├── projects/
│   │   ├── api/
│   │   └── hub/  # 認証必須
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── portfolio/
│   │   └── hub/
│   └── lib/
│       ├── prisma.ts
│       ├── auth.ts
│       └── utils.ts
├── .env.local
├── next.config.js
├── package.json
└── tailwind.config.ts
```

---

## 重要なファイル

- **prisma/schema.prisma** - データベーススキーマ
- **src/app/layout.tsx** - ルートレイアウト
- **src/app/page.tsx** - ホームページ
- **src/app/hub/layout.tsx** - ハブ用レイアウト（認証チェック）
- **src/lib/auth.ts** - NextAuth.js 設定
- **tailwind.config.ts** - デザインシステム設定

---

## コスト見積もり

### 無料枠で運用可能
- **Vercel Hobby**: 無料（100GB帯域幅/月）
- **Vercel Postgres**: 無料枠（256MBストレージ）

### 有料プラン（将来的な拡張時）
- **Vercel Pro**: $20/月
- **Vercel Postgres**: $20/月から

---

## 検証計画

### デプロイ後の確認事項
1. ポートフォリオサイトが公開されているか
2. アプリケーションハブが認証で保護されているか
3. ダークモードが動作するか
4. モバイルでレイアウトが正しいか
5. APIが正しく動作しているか
