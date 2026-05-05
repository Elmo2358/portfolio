import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUpcomingContests } from "@/lib/clist"

// GET: 今後のコンテストスケジュールを取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // クエリパラメータ
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const sites = searchParams.get("sites")?.split(",") || undefined

    // CLIST API認証情報（環境変数から取得）
    const username = process.env.CLIST_USERNAME
    const apiKey = process.env.CLIST_API_KEY

    // APIキーが未設定の場合はモックデータを返す
    if (!username || !apiKey) {
      console.log("CLIST API credentials not configured, using mock data")
      return NextResponse.json({
        success: true,
        contests: getMockContests(),
        count: 3,
        mock: true,
      })
    }

    // デフォルトではAtCoderと主要なコンテストサイトを取得
    const defaultSites = sites || [
      "atcoder.jp",
      "codeforces.com",
      "yukicoder.me",
    ]

    const contests = await getUpcomingContests(
      username,
      apiKey,
      defaultSites,
      limit
    )

    return NextResponse.json({
      success: true,
      contests,
      count: contests.length,
    })
  } catch (error) {
    console.error("Error fetching contests:", error)

    // エラーの場合はモックデータを返す
    console.log("Falling back to mock data due to error")
    return NextResponse.json({
      success: true,
      contests: getMockContests(),
      count: 3,
      mock: true,
    })
  }
}

// モックデータ（APIキー未設定時用）
function getMockContests() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    {
      id: "mock1",
      event: "AtCoder Beginner Contest",
      resource: "atcoder.jp",
      start: tomorrow.toISOString(),
      end: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      duration: "02:00:00",
      href: "https://atcoder.jp/contests/abc001",
      icons: [],
    },
    {
      id: "mock2",
      event: "Codeforces Round",
      resource: "codeforces.com",
      start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      duration: "02:00:00",
      href: "https://codeforces.com/contest/1234",
      icons: [],
    },
    {
      id: "mock3",
      event: "Yukicoder Contest",
      resource: "yukicoder.me",
      start: nextWeek.toISOString(),
      end: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      duration: "02:00:00",
      href: "https://yukicoder.me/contests/123",
      icons: [],
    },
  ]
}
