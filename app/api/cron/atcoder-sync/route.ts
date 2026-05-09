import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getAtCoderUser,
  getAtCoderSubmissions,
  getAtCoderProblem,
  sleep,
} from "@/lib/atcoder"

// POST: Vercel Cron Jobから呼び出され、全ユーザーのAtCoderデータを同期
export async function POST(req: NextRequest) {
  try {
    // Cron Secretによる認証（Vercel環境変数: CRON_SECRET）
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting AtCoder sync cron job...")

    // AtCoder IDを持つ全ユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        atCoderId: {
          not: null,
        },
      },
      select: {
        id: true,
        atCoderId: true,
      },
    })

    console.log(`Found ${users.length} users with AtCoder ID`)

    let totalSubmissionsProcessed = 0
    let totalProblemsUpdated = 0
    const errors: string[] = []

    // 各ユーザーの提出履歴を同期
    for (const user of users) {
      if (!user.atCoderId) continue

      try {
        console.log(`Syncing user: ${user.atCoderId}`)

        // 最新の提出IDを取得（既存の提出）
        const existingSubmissions = await prisma.atCoderSubmission.findMany({
          where: { userId: user.id },
          select: { id: true },
          orderBy: { epochSecond: "desc" },
          take: 1,
        })

        const latestSubmissionId = existingSubmissions[0]?.id

        // 最新の提出履歴を取得
        const submissions = await getAtCoderSubmissions(user.atCoderId, 100)

        // 新しい提出のみを処理
        const newSubmissions = latestSubmissionId
          ? submissions.filter((s) => String(s.id) > String(latestSubmissionId))
          : submissions

        if (newSubmissions.length === 0) {
          console.log(`No new submissions for ${user.atCoderId}`)
          continue
        }

        console.log(`Processing ${newSubmissions.length} new submissions for ${user.atCoderId}`)

        // ユニークな問題IDを取得
        const problemIds = Array.from(new Set(newSubmissions.map((s) => s.problem_id)))

        // まず、全問題のメタデータを作成
        for (const problemId of problemIds) {
          const problemInfo = await getAtCoderProblem(problemId)
          if (problemInfo) {
            await prisma.atCoderProblem.upsert({
              where: { id: problemInfo.id },
              update: {},
              create: {
                id: problemInfo.id,
                contestId: problemInfo.contest_id,
                title: problemInfo.title,
                difficulty: problemInfo.difficulty,
                url: `https://atcoder.jp/contests/${problemInfo.contest_id}/tasks/${problemInfo.id}`,
              },
            })
          }
          await sleep(500)
        }

        // 各提出履歴を処理
        for (const submission of newSubmissions) {
          // 提出履歴を保存
          await prisma.atCoderSubmission.upsert({
            where: { id: String(submission.id) },
            update: {},
            create: {
              id: String(submission.id),
              userId: user.id,
              problemId: submission.problem_id,
              language: submission.language,
              result: submission.result,
              executionTime: submission.length,
              epochSecond: submission.epoch_second,
            },
          })

          // AC提出ならステータスを更新
          if (submission.result === "AC") {
            const existing = await prisma.atCoderUserProblem.findUnique({
              where: {
                userId_problemId: {
                  userId: user.id,
                  problemId: submission.problem_id,
                },
              },
            })

            const submissionDate = new Date(submission.epoch_second * 1000)
            const now = Date.now()
            const isRecent = (now - submissionDate.getTime()) < 24 * 60 * 60 * 1000

            if (existing) {
              await prisma.atCoderUserProblem.update({
                where: {
                  userId_problemId: {
                    userId: user.id,
                    problemId: submission.problem_id,
                  },
                },
                data: {
                  status: isRecent ? "contest_ac" : "upsolved_ac",
                  lastAttempted: submissionDate,
                },
              })
              totalProblemsUpdated++
            } else {
              await prisma.atCoderUserProblem.create({
                data: {
                  userId: user.id,
                  problemId: submission.problem_id,
                  status: isRecent ? "contest_ac" : "upsolved_ac",
                  lastAttempted: submissionDate,
                },
              })
              totalProblemsUpdated++
            }
          }

          totalSubmissionsProcessed++
          await sleep(1000)
        }

        console.log(`Successfully synced ${user.atCoderId}`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`Error syncing user ${user.atCoderId}:`, errorMsg)
        errors.push(`${user.atCoderId}: ${errorMsg}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "AtCoder sync completed",
      stats: {
        usersProcessed: users.length,
        submissionsProcessed: totalSubmissionsProcessed,
        problemsUpdated: totalProblemsUpdated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error in AtCoder sync cron job:", error)
    return NextResponse.json(
      {
        error: "Failed to sync AtCoder data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
