import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * ダッシュボード用統計データを取得
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "week" // week, month, all

    // 期間の計算
    const now = new Date()
    let startDate = new Date(now)

    if (period === "week") {
      startDate.setDate(now.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1)
    }

    // 各アプリの統計を並列取得
    const [
      taskStats,
      jobHuntStats,
      bucketStats,
      atcoderStats,
    ] = await Promise.all([
      getTaskStats(session.user.id, startDate, now),
      getJobHuntStats(session.user.id, startDate, now),
      getBucketStats(session.user.id, startDate, now),
      getAtCoderStats(session.user.id, startDate, now),
    ])

    return NextResponse.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      stats: {
        tasks: taskStats,
        jobHunt: jobHuntStats,
        bucket: bucketStats,
        atcoder: atcoderStats,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch stats", details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * タスク管理の統計
 */
async function getTaskStats(userId: string, startDate: Date, endDate: Date) {
  const total = await prisma.task.count({
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  const completed = await prisma.task.count({
    where: {
      userId,
      status: "completed",
      completedAt: { gte: startDate, lte: endDate },
    },
  })

  const byStatus = await prisma.task.groupBy({
    by: ["status"],
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  })

  const byPriority = await prisma.task.groupBy({
    by: ["priority"],
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  })

  // 期間中の完了タスク（日次）- Prismaで取得してJSで集計
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "completed",
      completedAt: { gte: startDate, lte: endDate },
    },
    select: {
      completedAt: true,
    },
  })

  // 日次集計
  const completedByDayMap = new Map<string, number>()
  completedTasks.forEach(task => {
    if (task.completedAt) {
      const date = new Date(task.completedAt)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      completedByDayMap.set(dateKey, (completedByDayMap.get(dateKey) || 0) + 1)
    }
  })

  const completedByDay = Array.from(completedByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>),
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count
      return acc
    }, {} as Record<string, number>),
    completedByDay,
  }
}

/**
 * 就活管理の統計
 */
async function getJobHuntStats(userId: string, startDate: Date, endDate: Date) {
  const total = await prisma.jobApplication.count({
    where: {
      userId,
      appliedDate: { gte: startDate, lte: endDate },
    },
  })

  const offers = await prisma.jobApplication.count({
    where: {
      userId,
      status: "内定",
      appliedDate: { gte: startDate, lte: endDate },
    },
  })

  const byStatus = await prisma.jobApplication.groupBy({
    by: ["status"],
    where: {
      userId,
      appliedDate: { gte: startDate, lte: endDate },
    },
    _count: true,
  })

  const byType = await prisma.jobApplication.groupBy({
    by: ["type"],
    where: {
      userId,
      appliedDate: { gte: startDate, lte: endDate },
    },
    _count: true,
  })

  return {
    total,
    offers,
    offerRate: total > 0 ? Math.round((offers / total) * 100) : 0,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count
      return acc
    }, {} as Record<string, number>),
  }
}

/**
 * バケツリストの統計
 */
async function getBucketStats(userId: string, startDate: Date, endDate: Date) {
  const total = await prisma.bucketListItem.count({
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  const completed = await prisma.bucketListItem.count({
    where: {
      userId,
      status: "completed",
      completedAt: { gte: startDate, lte: endDate },
    },
  })

  const byStatus = await prisma.bucketListItem.groupBy({
    by: ["status"],
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  })

  const byCategory = await prisma.bucketListItem.groupBy({
    by: ["category"],
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  })

  return {
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>),
    byCategory: byCategory.reduce((acc, item) => {
      acc[item.category] = item._count
      return acc
    }, {} as Record<string, number>),
  }
}

/**
 * AtCoderの統計
 */
async function getAtCoderStats(userId: string, startDate: Date, endDate: Date) {
  // 期間中のAC数
  const solved = await prisma.atCoderUserProblem.count({
    where: {
      userId,
      status: { in: ["contest_ac", "upsolved_ac"] },
      updatedAt: { gte: startDate, lte: endDate },
    },
  })

  // 全問題数
  const totalProblems = await prisma.atCoderUserProblem.count({
    where: { userId },
  })

  // 期間中の提出数
  const submissions = await prisma.atCoderSubmission.count({
    where: {
      userId,
      epochSecond: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
    },
  })

  // 期間中のAC提出（日次）- Prismaで取得してJSで集計
  const acSubmissions = await prisma.atCoderSubmission.findMany({
    where: {
      userId,
      result: "AC",
      epochSecond: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
    },
    select: {
      epochSecond: true,
    },
  })

  // 日次集計
  const submissionsByDayMap = new Map<string, number>()
  acSubmissions.forEach(submission => {
    const date = new Date(submission.epochSecond * 1000)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
    submissionsByDayMap.set(dateKey, (submissionsByDayMap.get(dateKey) || 0) + 1)
  })

  const submissionsByDay = Array.from(submissionsByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    solved,
    totalProblems,
    solveRate: totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0,
    submissions,
    submissionsByDay,
  }
}
