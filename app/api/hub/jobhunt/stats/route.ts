import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/jobhunt/stats - 就活統計取得
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

    // 全企業を取得
    const applications = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { appliedDate: "desc" }
    })

    // ステータス別集計
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // タイプ別集計
    const typeCounts = applications.reduce((acc, app) => {
      acc[app.type] = (acc[app.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 総数
    const total = applications.length

    // 内定率
    const offers = statusCounts["内定"] || 0
    const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0

    // 最近の活動（最新5件）
    const recentActivity = applications.slice(0, 5)

    return NextResponse.json({
      total,
      statusCounts,
      typeCounts,
      offerRate,
      offers,
      recentActivity
    })
  } catch (error) {
    console.error("Error fetching job hunt stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
