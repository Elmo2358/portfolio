# ===================================================================
# 変数定義
# ===================================================================

variable "vercel_api_token" {
  description = "Vercel APIトークン（https://vercel.com/account/tokens から取得）"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth用シークレットキー"
  type        = string
  sensitive   = true
}

variable "cron_secret" {
  description = "Cronジョブ用シークレットキー"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHubリポジトリ（owner/repo 形式）"
  type        = string
  default     = "Elmo2358/portfolio"
}

variable "project_name" {
  description = "Vercelプロジェクト名"
  type        = string
  default     = "portfolio"
}
