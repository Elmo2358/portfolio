# ===================================================================
# 出力値
# ===================================================================

output "project_url" {
  description = "デプロイされたプロジェクトのURL"
  value       = "https://elmo2358.net"
}

output "custom_domain" {
  description = "カスタムドメイン"
  value       = "elmo2358.net"
}

output "project_id" {
  description = "VercelプロジェクトID"
  value       = vercel_project.portfolio.id
}

output "setup_commands" {
  description = "初期セットアップに必要なコマンド"
  value       = <<-EOT
    # 1. Terraformを適用
    cd terraform
    terraform apply

    # 2. Vercel Postgres を作成（Vercelダッシュボードから）
    # - Storage → Create Database → Postgres
    # - リージョン: ap-northeast-1 (東京)
    # - 作成後、DATABASE_URL を環境変数に追加

    # 3. データベースを初期化
    # VercelダッシュボードのDATABASE_URLを使用
    npx prisma db push

    # 4. シードデータを投入（オプション）
    DATABASE_URL="your-database-url" npm run seed
  EOT
}
