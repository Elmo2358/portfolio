import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getAtCoderUser,
  getAtCoderSubmissions,
  getAtCoderProblem,
  sleep,
} from "@/lib/atcoder"

// POST: AtCoder IDを保存して提出履歴を同期
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { atCoderId } = body

    if (!atCoderId) {
      return NextResponse.json(
        { error: "AtCoder ID is required" },
        { status: 400 }
      )
    }

    // AtCoderユーザーの存在確認
    const userExists = await getAtCoderUser(atCoderId)
    if (!userExists) {
      return NextResponse.json(
        { error: "AtCoder user not found" },
        { status: 404 }
      )
    }

    // ユーザーのAtCoder IDを保存
    await prisma.user.update({
      where: { id: session.user.id },
      data: { atCoderId },
    })

    // 提出履歴を取得（最新100件）
    const submissions = await getAtCoderSubmissions(atCoderId, 100)

    // 問題IDのユニークセットを作成
    const problemIds = Array.from(new Set(submissions.map((s) => s.problem_id)))

    let problemsCreated = 0
    let userProblemsUpdated = 0

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
        problemsCreated++
      }
      await sleep(500)
    }

    // 各提出履歴を処理
    for (const submission of submissions) {
      // 1. 提出履歴を保存
      await prisma.atCoderSubmission.upsert({
        where: { id: String(submission.id) },
        update: {},
        create: {
          id: String(submission.id),
          userId: session.user.id,
          problemId: submission.problem_id,
          language: submission.language,
          result: submission.result,
          executionTime: submission.length,
          epochSecond: submission.epoch_second,
        },
      })

      // 2. AC提出ならステータスを更新
      if (submission.result === "AC") {
        const existing = await prisma.atCoderUserProblem.findUnique({
          where: {
            userId_problemId: {
              userId: session.user.id,
              problemId: submission.problem_id,
            },
          },
        })

        const submissionDate = new Date(submission.epoch_second * 1000)
        const now = Date.now()
        const isRecent = (now - submissionDate.getTime()) < 24 * 60 * 60 * 1000

        if (existing) {
          // 既存の問題の場合、ステータスを「コンテスト内AC」または「コンテスト後AC」に更新
          await prisma.atCoderUserProblem.update({
            where: {
              userId_problemId: {
                userId: session.user.id,
                problemId: submission.problem_id,
              },
            },
            data: {
              status: isRecent ? "contest_ac" : "upsolved_ac",
              lastAttempted: submissionDate,
            },
          })
          userProblemsUpdated++
        } else {
          // 新規問題の場合、ユーザー進捗を作成
          await prisma.atCoderUserProblem.create({
            data: {
              userId: session.user.id,
              problemId: submission.problem_id,
              status: isRecent ? "contest_ac" : "upsolved_ac",
              lastAttempted: submissionDate,
            },
          })
          userProblemsUpdated++
        }
      }

      // レートリミット回避のため1秒スリープ
      await sleep(1000)
    }

    return NextResponse.json({
      success: true,
      message: "AtCoder連携が完了しました",
      stats: {
        submissionsCount: submissions.length,
        problemsCreated,
        userProblemsUpdated,
      },
    })
  } catch (error) {
    console.error("Error syncing AtCoder data:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to sync AtCoder data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
