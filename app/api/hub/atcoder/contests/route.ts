import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getClistCredentials, getDefaultClistCredentials, formatContestsForAI } from "@/lib/clist"

// GET: 今後のコンテストスケジュールを取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // クエリパラメータ
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const sites = searchParams.get("sites")?.split(",") || undefined
    const format = searchParams.get("format") || "json" // json or text (for AI prompts)

    // CLIST API認証情報の確認（ユーザー設定 → 環境変数）
    const userCredentials = await getClistCredentials(session.user.email)
    const defaultCredentials = getDefaultClistCredentials()
    const credentials = userCredentials || defaultCredentials

    if (!credentials) {
      // APIキー未設定時は空の結果を返す（エラーにしない）
      return NextResponse.json({
        success: true,
        contests: [],
        count: 0,
        mock: true,
      })
    }

    // デフォルトではAtCoderのみを取得
    const defaultSites = sites || ["atcoder.jp"]

    // lib/clist.tsの関数を使用（キャッシュ設定が適用される）
    const { getUpcomingContests } = await import("@/lib/clist")
    const contests = await getUpcomingContests(credentials, defaultSites, limit)

    // 空配列チェック（APIエラー時）
    if (!contests) {
      return NextResponse.json({
        success: true,
        contests: [],
        count: 0,
        error: "Failed to fetch contests",
      })
    }

    // テキスト形式（AIプロンプト用）
    if (format === "text") {
      const text = formatContestsForAI(contests)
      return NextResponse.json({
        contests: text,
        count: contests.length,
      })
    }

    return NextResponse.json({
      success: true,
      contests,
      count: contests.length,
    })
  } catch (error) {
    console.error("Error fetching contests:", error)
    // エラー時も空の結果を返す
    return NextResponse.json({
      success: true,
      contests: [],
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
