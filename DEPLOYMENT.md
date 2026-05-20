# デプロイガイド

このプロジェクトは、**Vercel** + **Prisma Postgres** でデプロイされています。

---

## 🎯 デプロイ状況

| 項目 | ステータス | URL |
|------|-----------|-----|
| **本番環境** | ✅ デプロイ完了 | https://elmo2358.net |
| **Vercel URL** | ✅ 有効 | https://portfolio.vercel.app |
| **データベース** | ✅ Prisma Postgres | Tokyo (ap-northeast-1) |
| **カスタムドメイン** | ✅ Cloudflare DNS | elmo2358.net |

---

## 🚀 クイックデプロイ（更新時）

コードを変更したら、以下のコマンドでデプロイしてください：

```bash
# 1. 変更をコミット
git add .
git commit -m "your commit message"

# 2. GitHubにプッシュ（自動デプロイ）
git push origin main

# または、手動デプロイ
vercel --prod
```

---

## 📋 初期デプロイ手順（参考）

### 1. TerraformでVercelプロジェクト作成

```bash
cd terraform
terraform init
terraform apply
```

### 2. Vercel Postgres作成

1. Vercelダッシュボード →「Storage」→「Create Database」→「Prisma Postgres」
2. リージョン: Tokyo (ap-northeast-1)
3. 環境変数 `DATABASE_URL` が自動追加される

### 3. データベース初期化

```bash
# 本番DBの接続URLを取得
vercel env pull .env.production

# データベースを初期化
pnpm prisma db push

# シードデータを投入
pnpm seed
```

### 4. デプロイ

```bash
vercel --prod
```

---

## 🔧 環境変数

以下の環境変数が設定されています：

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | Prisma Postgres接続URL |
| `NEXTAUTH_URL` | https://elmo2358.net |
| `NEXTAUTH_SECRET` | NextAuth用シークレット |
| `CRON_SECRET` | Cronジョブ用シークレット |

---

## 🌐 カスタムドメイン設定

### DNS設定（Cloudflare）

```
タイプ: CNAME
名前: @
値: portfolio.vercel.app
プロキシ: DNS only（グレー）
```

### ネームサーバー

- `dahlia.ns.cloudflare.com`
- `leif.ns.cloudflare.com`

---

## 🔐 ログイン情報

- **URL**: https://elmo2358.net/login
- **ユーザー名**: `admin`
- **パスワード**: `admin123`

⚠️ **本番環境ではパスワードを変更してください！**

---

## 📚 参考リンク

- [Vercelダッシュボード](https://vercel.com/dashboard)
- [Vercelプロジェクト](https://vercel.com/elmo2358-s-projects/portfolio)
- [Cloudflareダッシュボード](https://dash.cloudflare.com)
