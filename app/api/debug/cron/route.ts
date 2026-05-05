import { NextRequest, NextResponse } from "next/server"

// POST: 開発環境でのcronジョブのテスト用
// 本番環境では /api/cron/atcoder-sync を使用
export async function POST(req: NextRequest) {
  try {
    // 開発環境でのみ許可
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      )
    }

    console.log("Development cron test: calling /api/cron/atcoder-sync...")

    // cronエンドポイントを呼び出し
    const cronResponse = await fetch(
      new URL("/api/cron/atcoder-sync", req.url),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    )

    const data = await cronResponse.json()

    if (!cronResponse.ok) {
      return NextResponse.json(
        { error: "Cron job failed", details: data },
        { status: cronResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Development cron test completed",
      cronResult: data,
    })
  } catch (error) {
    console.error("Error in development cron test:", error)
    return NextResponse.json(
      {
        error: "Failed to test cron job",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
