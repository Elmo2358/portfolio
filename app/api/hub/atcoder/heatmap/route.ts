import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: ヒートマップ用の学習履歴データを取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // クエリパラメータから期間を取得（デフォルト: 過去1年）
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "365")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // ユーザーの全提出を取得
    const submissions = await prisma.atCoderSubmission.findMany({
      where: {
        userId: session.user.id,
        epochSecond: {
          gte: Math.floor(startDate.getTime() / 1000),
        },
      },
      select: {
        epochSecond: true,
        result: true,
      },
      orderBy: {
        epochSecond: "asc",
      },
    })

    // 日付ごとに集計
    const dailyStats = new Map<string, { total: number; ac: number }>()

    submissions.forEach((submission) => {
      const date = new Date(submission.epochSecond * 1000)
      const dateKey = date.toISOString().split("T")[0] // YYYY-MM-DD

      const existing = dailyStats.get(dateKey) || { total: 0, ac: 0 }
      existing.total++

      if (submission.result === "AC") {
        existing.ac++
      }

      dailyStats.set(dateKey, existing)
    })

    // ヒートマップ用のデータ形式に変換
    const heatmapData = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      ac: stats.ac,
      level: stats.ac > 0 ? Math.min(4, Math.ceil(stats.ac / 2)) : 0,
    }))

    return NextResponse.json({
      success: true,
      data: heatmapData,
      stats: {
        totalDays: heatmapData.length,
        totalSubmissions: submissions.length,
        totalAC: submissions.filter((s) => s.result === "AC").length,
        period: days,
      },
    })
  } catch (error) {
    console.error("Error fetching heatmap data:", error)
    return NextResponse.json(
      { error: "Failed to fetch heatmap data" },
      { status: 500 }
    )
  }
}
