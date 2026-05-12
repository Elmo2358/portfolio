#!/usr/bin/env tsx
/**
 * UECポータル ログアウトコマンド
 *
 * 使用方法:
 *   npx tsx scripts/uec-logout.ts
 */

import { deleteSession, sessionExists } from "../lib/uec-portal/session"

async function main() {
  console.log("\n=== UECポータル ログアウト ===\n")

  const exists = await sessionExists()
  if (!exists) {
    console.log("ℹ️  セッションが存在しません（既にログアウト済み）\n")
    return
  }

  await deleteSession()
  console.log("✅ セッションを削除しました\n")
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err)
  process.exit(1)
})
