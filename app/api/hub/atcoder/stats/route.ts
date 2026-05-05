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

    // 日別AC数（提出履歴から集計）
    const dailyAC = new Map<string, number>()
    const submissions = await prisma.atCoderSubmission.findMany({
      where: {
        userId: session.user.id,
        result: "AC",
      },
      select: {
        epochSecond: true,
      },
      orderBy: {
        epochSecond: "asc",
      },
    })

    submissions.forEach((sub) => {
      const date = new Date(sub.epochSecond * 1000).toISOString().split("T")[0]
      dailyAC.set(date, (dailyAC.get(date) || 0) + 1)
    })

    // 週番号を取得する関数（日曜開始）
    const getWeekNumber = (dateStr: string) => {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const oneJan = new Date(year, 0, 1)
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
      return Math.ceil((date.getDay() + 1 + numberOfDays) / 7)
    }

    // ストリーク計算（週1回の寛容措置付き）
    const sortedDates = Array.from(dailyAC.keys()).sort().reverse()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let forgivenessUsed = 0 // 使用した寛容措置の回数
    const weeklyForgiveness = new Map<string, boolean>() // 週ごとの寛容使用状況

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    // 現在のストリーク計算
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i]
      const expectedDate = i === 0 ? today : new Date(
        new Date(sortedDates[i - 1]).getTime() - 86400000
      ).toISOString().split("T")[0]

      const weekKey = `${expectedDate.split('-')[0]}-W${getWeekNumber(expectedDate)}`

      if (date === expectedDate || (i === 0 && date === yesterday)) {
        currentStreak++
        // 最長ストリークも更新
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
        }
      } else {
        // ACがない日の場合、寛容措置をチェック
        if (!weeklyForgiveness.has(weekKey) && currentStreak > 0) {
          weeklyForgiveness.set(weekKey, true)
          forgivenessUsed++
          // ストリークは維持
        } else {
          // 寛容措置を使い切っている場合はストリーク終了
          break
        }
      }
    }

    // 最長ストリーク計算（全期間）
    const allDates = Array.from(dailyAC.keys()).sort()
    tempStreak = 0

    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prevDate = new Date(allDates[i - 1])
        const currDate = new Date(allDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000))

        if (diffDays <= 8) { // 週1回の寛容を含めて8日以内なら継続
          tempStreak++
        } else {
          tempStreak = 1
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
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
        streak: currentStreak,
        longestStreak,
        forgivenessUsed,
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
