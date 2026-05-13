# Vercelプロバイダー
provider "vercel" {
  api_token = var.vercel_api_token
  # team_id = "your-team-id" # チームを使用している場合
}

# ===================================================================
# Vercelプロジェクト
# ===================================================================
resource "vercel_project" "portfolio" {
  name      = "portfolio"
  framework = "nextjs"

  # Gitリポジトリとの連携（GitHub統合をインストール後に有効化）
  git_repository = {
    type = "github"
    repo = "Elmo2358/portfolio"
  }

  # ビルド設定
  build_command = "npm run build"
  dev_command   = "npm run dev"
  install_command = "npm install"

  # 環境変数（共通）
  environment = [
    {
      key    = "NEXTAUTH_URL"
      value  = "https://elmo2358.net"
      target = ["production"]
    },
    {
      key    = "CRON_SECRET"
      value  = var.cron_secret
      target = ["production", "preview", "development"]
    }
  ]
}

# ===================================================================
# 環境変数（シークレット）
# ===================================================================
# 注: DATABASE_URL は Vercel ダッシュボードから手動で設定してください
# Vercel Postgres を作成後、接続URLを環境変数に追加

resource "vercel_project_environment_variable" "nextauth_secret" {
  project_id = vercel_project.portfolio.id
  key        = "NEXTAUTH_SECRET"
  value      = var.nextauth_secret
  target     = ["production"]
}

# ===================================================================
# カスタムドメイン
# ===================================================================
resource "vercel_project_domain" "custom_domain" {
  project_id = vercel_project.portfolio.id
  domain     = "elmo2358.net"
}

# ===================================================================
# 注意点
# ===================================================================
# Vercel Postgres は Terraform で管理できないため、以下の手順で作成してください：
# 1. Vercel ダッシュボードでプロジェクトを作成後、「Storage」→「Create Database」→「Postgres」
# 2. データベース作成後、接続URLをコピー
# 3. 「Settings」→「Environment Variables」で DATABASE_URL を設定
# 4. または、Vercel CLI を使用:
#    vercel link
#    vercel env pull .env.local
