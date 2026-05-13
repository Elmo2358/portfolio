# デプロイガイド

このプロジェクトは、**Vercel手動デプロイ**または**TerraformによるInfrastructure as Code**の2つの方法でデプロイできます。

---

## 🚀 デプロイ方法の選択

| 方法 | メリット | デメリット | 向いている人 |
|------|----------|------------|--------------|
| **Vercelダッシュボード** | 簡単・GUIで操作 | 環境構築が手動 | 初めてデプロイする人 |
| **Terraform** | コードで管理・再現可能 | 学習コストあり | インフラをコードで管理したい人 |

---

## 方法1: Vercelダッシュボードでのデプロイ

[PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) の「デプロイ手順（Vercel）」セクションを参照してください。

**手順の概要**:
1. Vercelでプロジェクト作成
2. Vercel Postgresを作成
3. 環境変数を設定
4. デプロイ実行
5. データベース初期化

---

## 方法2: Terraformによるデプロイ（Infrastructure as Code）

Terraformを使用すると、インフラ構成をコードで管理できます。

### 前提条件

- [Terraform](https://developer.hashicorp.com/terraform/install) v1.0以上
- Vercelアカウント
- GitHubリポジトリ

### セットアップ手順

#### 1. Vercel APIトークンの取得

1. https://vercel.com/account/tokens にアクセス
2. 「Create Token」をクリック
3. トークン名を入力（例: `terraform-portfolio`）
4. スコープは「Full Account」を選択
5. 生成されたトークンをコピー

#### 2. 環境変数の設定

```bash
# macOS / Linux
export VERCEL_API_TOKEN="your-token-here"

# Windows (PowerShell)
$env:VERCEL_API_TOKEN="your-token-here"
```

#### 3. terraform.tfvars の作成

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` を編集:

```hcl
# GitHubリポジトリ
github_repo = "Elmo2358/portfolio"  # 自分のリポジトリに変更

# プロジェクト名
project_name = "portfolio"

# データベースリージョン（ap-northeast-1: 東京）
database_region = "ap-northeast-1"

# 自動デプロイ（false: 手動デプロイ）
enable_auto_publication = false

# シークレットキーの生成
# macOS/Linux: openssl rand -base64 32
# Windows PowerShell: -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
nextauth_secret = "生成したシークレット"
cron_secret = "生成したシークレット"
```

#### 4. Terraformの実行

```bash
# terraformディレクトリへ移動
cd terraform

# 初期化
terraform init

# 設定の検証
terraform validate

# デプロイプランの確認
terraform plan

# デプロイ実行
terraform apply
```

#### 5. データベースの初期化

```bash
# 接続文字列を取得
terraform output -raw prisma_connection_string

# データベースを初期化
DATABASE_URL="$(terraform output -raw prisma_connection_string)" npx prisma db push

# シードデータを投入（オプション）
DATABASE_URL="$(terraform output -raw prisma_connection_string)" npm run seed
```

### よく使うコマンド

| コマンド | 説明 |
|----------|------|
| `terraform init` | Terraformの初期化 |
| `terraform plan` | 変更内容のプレビュー |
| `terraform apply` | 変更の適用 |
| `terraform output` | 出力値の確認 |
| `terraform destroy` | リソースの削除 |

詳細は [terraform/README.md](terraform/README.md) を参照してください。

---

## 📝 デプロイ後の作業

### 1. Prismaスキーマの確認

本番環境ではPostgreSQLを使用するため、[prisma/schema.prisma](prisma/schema.prisma)が以下のようになっていることを確認してください：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. 環境変数の確認

以下の環境変数が設定されていることを確認：

- `DATABASE_URL`: PostgreSQL接続URL
- `NEXTAUTH_URL`: 本番ドメイン
- `NEXTAUTH_SECRET`: 認証用シークレット
- `CRON_SECRET`: Cronジョブ用シークレット

### 3. Cronジョブの確認

`vercel.json` で設定されたCronジョブが動作しているか確認：

```json
{
  "crons": [{
    "path": "/api/cron/atcoder-sync",
    "schedule": "0 * * * *"
  }]
}
```

> **注意**: CronジョブはVercel Proプラン以上でのみ使用できます。Freeプランの場合は手動同期になります。

---

## 🔧 トラブルシューティング

### デプロイに失敗する場合

1. **環境変数の確認**: すべての必須環境変数が設定されているか確認
2. **Prismaスキーマの確認**: PostgreSQLに変更されているか確認
3. **Node.jsバージョンの確認**: Node.js 20以上を使用しているか確認

### データベース接続エラー

1. **接続文字列の確認**: `DATABASE_URL` が正しいか確認
2. **SSLの確認**: 接続文字列に `?sslmode=require` が含まれているか確認
3. **PgBouncerの確認**: Vercel Postgresの場合、`?pgbouncer=true` を追加

### Cronジョブが動作しない

1. **プランの確認**: Proプラン以上であるか確認
2. **CRON_SECRETの確認**: 環境変数に設定されているか確認
3. **ログの確認**: VercelダッシュボードのLogsでエラーを確認

---

## 📚 参考リンク

- [Vercelデプロイメント](https://vercel.com/docs/deployments/overview)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Terraform Vercel Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Prismaデプロイガイド](https://www.prisma.io/docs/guides/deployment/vercel)
