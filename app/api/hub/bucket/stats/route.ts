import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/bucket/stats - バケツリスト統計取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 全項目を取得
    const items = await prisma.bucketListItem.findMany({
      where: { userId: user.id },
      orderBy: [
        { priority: "desc" },
        { targetDate: "asc" }
      ]
    })

    // 統計計算
    const total = items.length
    const completed = items.filter(item => item.status === "completed").length
    const inProgress = items.filter(item => item.status === "in_progress").length
    const planning = items.filter(item => item.status === "planning").length

    // カテゴリ別集計
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 達成率
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 優先度別分布
    const priorityCounts = items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // 最近の達成アイテム（最新5件）
    const recentCompleted = items
      .filter(item => item.status === "completed")
      .slice(0, 5)

    return NextResponse.json({
      total,
      completed,
      inProgress,
      planning,
      categoryCounts,
      completionRate,
      priorityCounts,
      recentCompleted
    })
  } catch (error) {
    console.error("Error fetching bucket list stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
