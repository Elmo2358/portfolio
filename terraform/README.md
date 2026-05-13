# Terraform デプロイガイド

このディレクトリには、VercelへのデプロイをTerraformで管理するための設定ファイルが含まれています。

---

## 前提条件

- [Terraform](https://developer.hashicorp.com/terraform/install) がインストールされていること（v1.0以上）
- Vercelアカウントがあること
- GitHubリポジトリが公開されていること

---

## セットアップ手順

### 1. Vercel APIトークンの取得

1. https://vercel.com/account/tokens にアクセス
2. 「Create Token」をクリック
3. トークン名を入力（例: `terraform-portfolio`）
4. スコープは「Full Account」を選択
5. 生成されたトークンをコピー

### 2. 環境変数の設定

```bash
# macOS / Linux
export VERCEL_API_TOKEN="your-token-here"

# Windows (PowerShell)
$env:VERCEL_API_TOKEN="your-token-here"

# Windows (コマンドプロンプト)
set VERCEL_API_TOKEN=your-token-here
```

または、`terraform.tfvars` ファイルを作成：

```bash
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集して値を入力
```

### 3. terraform.tfvars の編集

```hcl
github_repo              = "Elmo2358/portfolio"
project_name             = "portfolio"
database_region          = "ap-northeast-1"
enable_auto_publication  = false
nextauth_secret          = "openssl rand -base64 32 の出力"
cron_secret              = "openssl rand -base64 32 の出力"
```

**シークレットキーの生成方法**:
```bash
# macOS / Linux
openssl rand -base64 32

# Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

---

## デプロイ手順

### 初回デプロイ

```bash
# 1. Terraformの初期化
terraform init

# 2. 設定の検証
terraform validate

# 3. デプロイプランの確認
terraform plan

# 4. デプロイ実行
terraform apply
```

### データベースの初期化

```bash
# 接続文字列を取得
terraform output -raw prisma_connection_string

# 環境変数に設定して実行
DATABASE_URL="$(terraform output -raw prisma_connection_string)" npx prisma db push

# シードデータを投入（オプション）
DATABASE_URL="$(terraform output -raw prisma_connection_string)" npm run seed
```

---

## よく使うコマンド

### プロジェクトURLの確認
```bash
terraform output project_url
```

### データベース接続文字列の確認
```bash
terraform output -raw prisma_connection_string
```

### 設定の変更
```bash
terraform plan
terraform apply
```

### リソースの削除
```bash
terraform destroy
```

### 状態の確認
```bash
terraform show
```

---

## 構成ファイル

| ファイル | 説明 |
|---------|------|
| `main.tf` | メインのTerraform設定 |
| `variables.tf` | 変数定義 |
| `outputs.tf` | 出力値定義 |
| `versions.tf` | Terraformバージョン設定 |
| `terraform.tfvars.example` | 変数設定例 |
| `.gitignore` | Git除外ファイル |

---

## カスタムドメインの設定

カスタムドメインを使用する場合：

1. `terraform.tfvars` に追加：
```hcl
custom_domain = "your-domain.com"
```

2. `main.tf` の `vercel_project_domain` リソースをコメント解除

3. DNS設定をドメインプロバイダーで追加

---

## 既存のVercelプロジェクトをインポート

既にVercelダッシュボードでプロジェクトを作成している場合：

```bash
# プロジェクトIDの確認（Vercelダッシュボードから）
terraform import vercel_project.portfolio your-project-id
```

---

## トラブルシューティング

### エラー: Error: failed to authenticate

- `VERCEL_API_TOKEN` が正しく設定されているか確認
- トークンの有効期限が切れていないか確認

### エラー: Error: project not found

- GitHubリポジトリ名が正しいか確認
- VercelとGitHubの連携が完了しているか確認

### データベース接続エラー

- `prisma_connection_string` 出力値で接続文字列を確認
- PrismaスキーマがPostgreSQLに変更されているか確認

---

## セキュリティ上の注意

- `terraform.tfvars` は `.gitignore` に追加し、コミットしない
- シークレットキーは安全に管理する
- Terraform状態ファイルに機密情報が含まれる場合は、リモートバックエンド（S3+暗号化等）を使用

---

## 参考リンク

- [Vercel Terraform Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Terraform公式ドキュメント](https://developer.hashicorp.com/terraform/docs)
