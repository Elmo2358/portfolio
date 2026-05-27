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
import { getUserApiKey, getDefaultApiKey, generateCompletion } from "@/lib/ai/anthropic"
import { CODE_REVIEW_PROMPTS } from "@/lib/ai/prompts/atcoder"
import { updateLearningPlanFromReviews, type PreviousPlan } from "@/lib/ai/learning-plan-generator"

// getUserApiKey関数が存在するか確認
async function getUserApiKeyWrapper(userId: string): Promise<string | null> {
  try {
    return await getUserApiKey(userId)
  } catch {
    return null
  }
}

// 分析ステータスの型
interface AnalysisStep {
  name: string
  status: "pending" | "running" | "completed" | "skipped" | "error"
  message?: string
  result?: any
}

interface AnalysisResult {
  steps: AnalysisStep[]
  summary: {
    submissionsSynced: number
    apg4bUpdated: number
    reviewsGenerated: number
    planUpdated: boolean
  }
}

// POST: 統合同期・分析
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const steps: AnalysisStep[] = [
    { name: "提出履歴の同期", status: "pending" },
    { name: "APG4b進捗の更新", status: "pending" },
    { name: "コードレビュー", status: "pending" },
    { name: "学習プランの更新", status: "pending" },
  ]

  const summary = {
    submissionsSynced: 0,
    apg4bUpdated: 0,
    reviewsGenerated: 0,
    planUpdated: false,
  }

  try {
    // ユーザーのAtCoder IDを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { atCoderId: true },
    })

    const atCoderId = user?.atCoderId

    if (!atCoderId) {
      return NextResponse.json(
        { error: "AtCoder ID not set. Please set it in settings." },
        { status: 400 }
      )
    }

    // === ステップ1: 提出履歴の同期 ===
    steps[0].status = "running"
    const syncResult = await syncSubmissions(session.user.id, atCoderId)
    summary.submissionsSynced = syncResult.submissionsCount
    steps[0].status = "completed"
    steps[0].result = { newSubmissions: syncResult.newSubmissions }

    // === ステップ2: APG4b進捗の更新 ===
    steps[1].status = "running"
    if (syncResult.acProblemIds.length > 0) {
      const apg4bResult = await updateApg4bProgress(session.user.id, syncResult.acProblemIds)
      summary.apg4bUpdated += apg4bResult.totalUpdated
      steps[1].status = "completed"
      steps[1].result = { lessonsUpdated: apg4bResult.lessonsUpdated, chaptersUpdated: apg4bResult.chaptersUpdated }
    } else {
      steps[1].status = "skipped"
      steps[1].message = "新しいAC提出がありません"
    }

    // === ステップ3: コードレビュー ===
    steps[2].status = "running"
    const userApiKey = await getUserApiKeyWrapper(session.user.id)
    const apiKey = userApiKey || getDefaultApiKey()

    if (apiKey && syncResult.newAcSubmissions.length > 0) {
      const reviewResult = await generateCodeReviews(session.user.id, syncResult.newAcSubmissions, apiKey)
      summary.reviewsGenerated = reviewResult.count
      steps[2].status = "completed"
      steps[2].result = { reviews: reviewResult.count }
    } else if (!apiKey) {
      steps[2].status = "skipped"
      steps[2].message = "APIキーが設定されていません"
    } else {
      steps[2].status = "skipped"
      steps[2].message = "新しいAC提出がありません"
    }

    // === ステップ4: 学習プランの更新 ===
    steps[3].status = "running"
    if (summary.reviewsGenerated > 0) {
      await updateLearningPlan(session.user.id)
      summary.planUpdated = true
      steps[3].status = "completed"
    } else {
      steps[3].status = "skipped"
      steps[3].message = "新しいレビューがありません"
    }

    return NextResponse.json({
      success: true,
      steps,
      summary,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    // エラーが発生したステップをマーク
    const errorStep = steps.find(s => s.status === "running")
    if (errorStep) {
      errorStep.status = "error"
      errorStep.message = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json(
      {
        success: false,
        steps,
        summary,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// 提出履歴の同期
async function syncSubmissions(userId: string, atCoderId: string) {
  // AtCoderユーザーの存在確認
  const userExists = await getAtCoderUser(atCoderId)
  if (!userExists) {
    throw new Error("AtCoder user not found")
  }

  // 既存の提出IDを取得
  const existingSubmissions = await prisma.atCoderSubmission.findMany({
    where: { userId },
    select: { id: true },
  })
  const existingIds = new Set(existingSubmissions.map(s => s.id))

  // 提出履歴を取得
  const submissions = await getAtCoderSubmissions(atCoderId, 100)
  const newSubmissions = submissions.filter(s => !existingIds.has(String(s.id)))

  // 問題IDのユニークセットを作成
  const problemIds = Array.from(new Set(submissions.map((s) => s.problem_id)))

  let problemsCreated = 0
  let userProblemsUpdated = 0
  const acProblemIds: string[] = []
  const newAcSubmissions: any[] = []

  for (const submission of submissions) {
    // 既存の提出はスキップ
    if (existingIds.has(String(submission.id))) {
      // AC問題は収集
      if (submission.result === "AC") {
        acProblemIds.push(submission.problem_id)
      }
      continue
    }

    // 問題メタデータを取得
    const problemInfo = await getAtCoderProblem(submission.problem_id)
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

    // 提出を保存
    await prisma.atCoderSubmission.upsert({
      where: { id: String(submission.id) },
      update: {},
      create: {
        id: String(submission.id),
        userId,
        problemId: submission.problem_id,
        language: submission.language,
        result: submission.result,
        executionTime: submission.length,
        epochSecond: submission.epoch_second,
      },
    })

    // AC提出の処理
    if (submission.result === "AC") {
      acProblemIds.push(submission.problem_id)
      newAcSubmissions.push(submission)

      const submissionDate = new Date(submission.epoch_second * 1000)
      const now = Date.now()
      const isRecent = (now - submissionDate.getTime()) < 24 * 60 * 60 * 1000

      const existing = await prisma.atCoderUserProblem.findUnique({
        where: {
          userId_problemId: {
            userId,
            problemId: submission.problem_id,
          },
        },
      })

      if (existing) {
        await prisma.atCoderUserProblem.update({
          where: {
            userId_problemId: {
              userId,
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
        await prisma.atCoderUserProblem.create({
          data: {
            userId,
            problemId: submission.problem_id,
            status: isRecent ? "contest_ac" : "upsolved_ac",
            lastAttempted: submissionDate,
          },
        })
        userProblemsUpdated++
      }
    }

    await sleep(1000)
  }

  return {
    submissionsCount: submissions.length,
    newSubmissions: newSubmissions.length,
    problemsCreated,
    userProblemsUpdated,
    acProblemIds,
    newAcSubmissions,
  }
}

// APG4b進捗の更新
async function updateApg4bProgress(userId: string, acProblemIds: string[]) {
  const apg4bLessons = await prisma.apg4bLesson.findMany()
  const apg4bChapters = await prisma.apg4bChapter.findMany()

  let lessonsUpdated = 0
  let chaptersUpdated = 0

  for (const lesson of apg4bLessons) {
    if (acProblemIds.includes(lesson.problemId)) {
      await prisma.apg4bUserProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: lesson.id,
          },
        },
        update: {
          status: "completed",
          completedAt: new Date(),
        },
        create: {
          userId,
          lessonId: lesson.id,
          status: "completed",
          completedAt: new Date(),
        },
      })
      lessonsUpdated++
    }
  }

  for (const chapter of apg4bChapters) {
    if (chapter.problemId && acProblemIds.includes(chapter.problemId)) {
      await prisma.apg4bUserProgress.upsert({
        where: {
          userId_chapterId: {
            userId,
            chapterId: chapter.id,
          },
        },
        update: {
          status: "completed",
          completedAt: new Date(),
        },
        create: {
          userId,
          chapterId: chapter.id,
          status: "completed",
          completedAt: new Date(),
        },
      })
      chaptersUpdated++
    }
  }

  return { lessonsUpdated, chaptersUpdated, totalUpdated: lessonsUpdated + chaptersUpdated }
}

// コードレビューの生成
async function generateCodeReviews(userId: string, submissions: any[], apiKey: string) {
  let count = 0

  for (const submission of submissions) {
    // 既にレビューがあるか確認
    const existingReview = await prisma.codeReview.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId: submission.id,
        },
      },
    })

    if (existingReview && existingReview.summary) {
      continue
    }

    // ソースコードを取得
    const sourceCodeResponse = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/hub/atcoder/submissions/${submission.id}/source-code`
    )

    if (!sourceCodeResponse.ok) {
      continue
    }

    const sourceData = await sourceCodeResponse.json()
    const sourceCode = sourceData.sourceCode
    const language = sourceData.language

    // 問題情報を取得
    const problem = await prisma.atCoderProblem.findUnique({
      where: { id: submission.problem_id },
    })

    // AIでレビュー生成
    const prompt = CODE_REVIEW_PROMPTS.review(sourceCode, language, {
      title: problem?.title || submission.problem_id,
      difficulty: problem?.difficulty || undefined,
    }, undefined)

    const response = await generateCompletion(apiKey, [{ role: "user", content: prompt }], {
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt: CODE_REVIEW_PROMPTS.system,
    })

    // レスポンスをパース
    let reviewData: any
    try {
      const jsonMatch = response.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        reviewData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found")
      }
    } catch {
      reviewData = {
        overallRating: "C",
        strengths: [],
        improvements: [],
        complexityScore: 5,
        bugs: [],
        summary: response.slice(0, 200),
      }
    }

    // レビューを保存
    await prisma.codeReview.upsert({
      where: {
        userId_submissionId: {
          userId,
          submissionId: submission.id,
        },
      },
      create: {
        userId,
        submissionId: submission.id,
        sourceCode,
        language,
        problemId: submission.problem_id,
        problemTitle: problem?.title || "",
        overallRating: reviewData.overallRating,
        strengths: JSON.stringify(reviewData.strengths),
        improvements: JSON.stringify(reviewData.improvements),
        complexityScore: reviewData.complexityScore,
        bugs: JSON.stringify(reviewData.bugs),
        summary: reviewData.summary,
        influencedPlanUpdate: true,
      },
      update: {
        overallRating: reviewData.overallRating,
        strengths: JSON.stringify(reviewData.strengths),
        improvements: JSON.stringify(reviewData.improvements),
        complexityScore: reviewData.complexityScore,
        bugs: JSON.stringify(reviewData.bugs),
        summary: reviewData.summary,
        influencedPlanUpdate: true,
      },
    })

    count++
  }

  return { count }
}

// 学習プランの更新
async function updateLearningPlan(userId: string) {
  const currentPlan = await prisma.learningPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  const previousPlan: PreviousPlan | undefined = currentPlan ? {
    weeklyMilestones: currentPlan.weeklyMilestones,
    studyAdvice: currentPlan.studyAdvice || "",
    reviewCount: currentPlan.reviewCount || 0,
  } : undefined

  // レビューを取得
  const reviews = await prisma.codeReview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  await updateLearningPlanFromReviews(
    userId,
    reviews.map(r => ({
      overallRating: r.overallRating || "C",
      improvements: r.improvements || "[]",
      bugs: r.bugs || "[]",
    })),
    previousPlan
  )
}
