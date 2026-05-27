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

    // ユーザーのAtCoder IDを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { atCoderId: true },
    })

    let atCoderId = user?.atCoderId

    console.log("[Sync] User's AtCoder ID:", atCoderId)

    // リクエストボディにatCoderIdがあれば優先（初期設定時）
    try {
      const body = await req.json()
      if (body.atCoderId) {
        atCoderId = body.atCoderId
      }
    } catch {
      // ボディがない場合は無視（同期ボタンからの呼び出し）
    }

    if (!atCoderId) {
      return NextResponse.json(
        { error: "AtCoder ID not set. Please set it in settings." },
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
    const acProblemIds: string[] = []

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
        acProblemIds.push(submission.problem_id)
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

    // APG4b進捗を更新（AC提出から）
    let apg4bLessonsCompleted = 0
    let apg4bChaptersCompleted = 0

    // デバッグログ
    console.log("[APG4b Sync] AC problem IDs:", acProblemIds)

    if (acProblemIds.length > 0) {
      // APG4bの全レッスンと章を取得
      const apg4bLessons = await prisma.apg4bLesson.findMany()
      const apg4bChapters = await prisma.apg4bChapter.findMany()

      console.log("[APG4b Sync] Lessons in DB:", apg4bLessons.map(l => ({ id: l.lessonId, problemId: l.problemId })))
      console.log("[APG4b Sync] Chapters in DB:", apg4bChapters.map(c => ({ id: c.chapterId, problemId: c.problemId })))

      // レッスンの進捗を更新
      for (const lesson of apg4bLessons) {
        if (acProblemIds.includes(lesson.problemId)) {
          await prisma.apg4bUserProgress.upsert({
            where: {
              userId_lessonId: {
                userId: session.user.id,
                lessonId: lesson.id,
              },
            },
            update: {
              status: "completed",
              completedAt: new Date(),
            },
            create: {
              userId: session.user.id,
              lessonId: lesson.id,
              status: "completed",
              completedAt: new Date(),
            },
          })
          apg4bLessonsCompleted++
        }
      }

      // 章の進捗を更新（説明課題のACをチェック）
      for (const chapter of apg4bChapters) {
        if (chapter.problemId && acProblemIds.includes(chapter.problemId)) {
          await prisma.apg4bUserProgress.upsert({
            where: {
              userId_chapterId: {
                userId: session.user.id,
                chapterId: chapter.id,
              },
            },
            update: {
              status: "completed",
              completedAt: new Date(),
            },
            create: {
              userId: session.user.id,
              chapterId: chapter.id,
              status: "completed",
              completedAt: new Date(),
            },
          })
          apg4bChaptersCompleted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "AtCoder連携が完了しました",
      stats: {
        submissionsCount: submissions.length,
        problemsCreated,
        userProblemsUpdated,
        apg4bLessonsCompleted,
        apg4bChaptersCompleted,
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
