import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: 統計情報を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーの全進捗データを取得
    const userProblems = await prisma.atCoderUserProblem.findMany({
      where: { userId: session.user.id },
      include: {
        problem: true,
      },
    })

    // ステータス別集計
    const statusStats = {
      unattempted: 0,
      in_progress: 0,
      contest_ac: 0,
      upsolved_ac: 0,
      review: 0,
    }

    userProblems.forEach((up) => {
      if (up.status in statusStats) {
        statusStats[up.status as keyof typeof statusStats]++
      }
    })

    // AC数（コンテスト内 + アップソルブ）
    const totalAC = statusStats.contest_ac + statusStats.upsolved_ac

    // コンテスト別集計
    const contestStats = new Map<string, number>()
    userProblems.forEach((up) => {
      const contestId = up.problem.contestId
      if (up.status === "contest_ac" || up.status === "upsolved_ac") {
        contestStats.set(contestId, (contestStats.get(contestId) || 0) + 1)
      }
    })

    const contestStatsArray = Array.from(contestStats.entries())
      .map(([contestId, acCount]) => ({ contestId, acCount }))
      .sort((a, b) => b.contestId.localeCompare(a.contestId))

    // 難易度別AC数
    const difficultyStats = new Map<string, { solved: number; total: number }>()
    userProblems.forEach((up) => {
      const difficulty = up.problem.difficulty
        ? Math.floor(up.problem.difficulty / 100) * 100 + "-" +
          Math.floor(up.problem.difficulty / 100) * 100 + 99
        : "未分類"

      if (!difficultyStats.has(difficulty)) {
        difficultyStats.set(difficulty, { solved: 0, total: 0 })
      }

      const stats = difficultyStats.get(difficulty)!
      stats.total++
      if (up.status === "contest_ac" || up.status === "upsolved_ac") {
        stats.solved++
      }
    })

    const difficultyStatsArray = Array.from(difficultyStats.entries())
      .map(([range, stats]) => ({ range, ...stats }))
      .sort((a, b) => {
        if (a.range === "未分類") return 1
        if (b.range === "未分類") return -1
        return parseInt(a.range.split("-")[0]) - parseInt(b.range.split("-")[0])
      })

    // 最近の活動（直近7日）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.atCoderSubmission.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { epochSecond: "desc" },
      take: 20,
    })

    // 日別AC数（ヒートマップ用）
    const dailyAC = new Map<string, number>()
    userProblems.forEach((up) => {
      if (
        (up.status === "contest_ac" || up.status === "upsolved_ac") &&
        up.lastAttempted
      ) {
        const date = up.lastAttempted.toISOString().split("T")[0]
        dailyAC.set(date, (dailyAC.get(date) || 0) + 1)
      }
    })

    // ストリーク計算（連続日数）
    const sortedDates = Array.from(dailyAC.keys())
      .sort()
      .reverse()

    let streak = 0
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i]
      const expectedDate = i === 0 ? today : new Date(
        new Date(sortedDates[i - 1]).getTime() - 86400000
      ).toISOString().split("T")[0]

      if (date === expectedDate || (i === 0 && date === yesterday)) {
        streak++
      } else {
        break
      }
    }

    return NextResponse.json({
      overview: {
        totalProblems: userProblems.length,
        totalAC,
        attemptRate: userProblems.length > 0
          ? Math.round(((statusStats.in_progress + totalAC) / userProblems.length) * 100)
          : 0,
        acRate: userProblems.length > 0
          ? Math.round((totalAC / userProblems.length) * 100)
          : 0,
        streak,
      },
      statusBreakdown: statusStats,
      contestStats: contestStatsArray,
      difficultyStats: difficultyStatsArray,
      recentActivity,
      dailyAC: Object.fromEntries(dailyAC),
    })
  } catch (error) {
    console.error("Error fetching AtCoder stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
