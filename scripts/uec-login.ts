#!/usr/bin/env tsx
/**
 * UECポータルログインコマンド
 *
 * 使用方法:
 *   npx tsx scripts/uec-login.ts          # ブラウザで手動ログイン
 *   npx tsx scripts/uec-login.ts <id> <pw> # IDとパスワードでログイン
 */

import { loginToUecPortal, manualLogin, checkLoginStatus } from "../lib/uec-portal/login"

async function main() {
  const args = process.argv.slice(2)

  console.log("\n=== UECポータル ログインツール ===\n")

  // 現在のログイン状態をチェック
  const isLoggedIn = await checkLoginStatus()
  if (isLoggedIn) {
    console.log("✅ 既にログイン済みです（セッション有効）")
    console.log("   新しいセッションを作成するには、先にログアウトしてください\n")
    return
  }

  // IDとパスワードが指定された場合は自動ログイン
  if (args.length >= 2) {
    const [userId, password] = args
    console.log(`🔐 ユーザーID: ${userId} でログインします...\n`)

    const result = await loginToUecPortal({ userId, password })

    if (result.success) {
      console.log("✅ " + result.message)
      console.log("   セッションを保存しました\n")
    } else {
      console.log("❌ " + result.message)
      if (result.requiresTwoFactor) {
        console.log("   2段階認証が必要な場合は、引数なしで実行してブラウザでログインしてください\n")
      }
      process.exit(1)
    }
    return
  }

  // ブラウザで手動ログイン
  console.log("🌐 ブラウザを起動します...")
  console.log("   UECポータルにログインしてください（2段階認証にも対応）\n")

  const result = await manualLogin()

  if (result.success) {
    console.log("✅ " + result.message)
    console.log("   セッションを保存しました\n")
  } else {
    console.log("❌ " + result.message + "\n")
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err)
  process.exit(1)
})
