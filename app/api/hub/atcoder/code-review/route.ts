import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, generateCompletion } from "@/lib/ai/anthropic"
import { CODE_REVIEW_PROMPTS } from "@/lib/ai/prompts/atcoder"
import { updateLearningPlanFromReviews, type PreviousPlan } from "@/lib/ai/learning-plan-generator"

// POST: 直近10件のコードを一括レビュー
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // z.ai APIキーの確認
    const userApiKey = await getUserApiKey(session.user.id)
    const defaultApiKey = getDefaultApiKey()
    const apiKey = userApiKey || defaultApiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: "z.ai API key not configured", setupRequired: true },
        { status: 400 }
      )
    }

    // 直近10件のAC提出を取得
    const recentSubmissions = await prisma.atCoderSubmission.findMany({
      where: {
        userId: session.user.id,
        result: "AC",
      },
      include: { problem: true },
      orderBy: { epochSecond: "desc" },
      take: 10,
    })

    if (recentSubmissions.length === 0) {
      return NextResponse.json(
        { error: "レビュー対象の提出がありません。まずは問題をACしてください。" },
        { status: 400 }
      )
    }

    // 現在の学習プランを取得（レビューのコンテキスト用）
    const currentPlan = await prisma.learningPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    const planContext = currentPlan ? {
      currentZone: currentPlan.currentZone || undefined,
      targetZone: currentPlan.targetZone,
      studyAdvice: currentPlan.studyAdvice || undefined,
    } : undefined

    // 各提出に対してレビュー生成
    const reviews: Array<{
      id: string
      submissionId: string
      problemId: string
      problemTitle: string
      overallRating: string
      summary: string
      strengths: string[]
      improvements: string[]
      complexityScore: number
      bugs: string[]
    }> = []

    for (const submission of recentSubmissions) {
      // 既にレビューがあるか確認
      const existingReview = await prisma.codeReview.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: submission.id,
          },
        },
      })

      // 既にレビューが完了している場合はスキップ
      if (existingReview && existingReview.summary) {
        reviews.push({
          id: existingReview.id,
          submissionId: existingReview.submissionId,
          problemId: existingReview.problemId,
          problemTitle: existingReview.problemTitle || "",
          overallRating: existingReview.overallRating || "C",
          summary: existingReview.summary || "",
          strengths: JSON.parse(existingReview.strengths || "[]"),
          improvements: JSON.parse(existingReview.improvements || "[]"),
          complexityScore: existingReview.complexityScore || 5,
          bugs: JSON.parse(existingReview.bugs || "[]"),
        })
        continue
      }

      // ソースコードを取得
      let sourceCode = ""
      let language = ""

      if (existingReview) {
        sourceCode = existingReview.sourceCode
        language = existingReview.language
      } else {
        const sourceCodeResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/hub/atcoder/submissions/${submission.id}/source-code`
        )

        if (sourceCodeResponse.ok) {
          const sourceData = await sourceCodeResponse.json()
          sourceCode = sourceData.sourceCode
          language = sourceData.language
        } else {
          continue // ソースコード取得失敗時はスキップ
        }
      }

      // AIでコードレビューを生成
      const prompt = CODE_REVIEW_PROMPTS.review(sourceCode, language, {
        title: submission.problem.title,
        difficulty: submission.problem.difficulty || undefined,
      }, planContext)

      const response = await generateCompletion(apiKey, [{ role: "user", content: prompt }], {
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: CODE_REVIEW_PROMPTS.system,
      })

      // レスポンスをパース
      let reviewData: {
        overallRating: string
        strengths: string[]
        improvements: string[]
        complexityScore: number
        bugs: string[]
        summary: string
      }

      try {
        const jsonMatch = response.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          reviewData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("No JSON found in response")
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

      // レビュー結果を保存
      const review = await prisma.codeReview.upsert({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: submission.id,
          },
        },
        create: {
          userId: session.user.id,
          submissionId: submission.id,
          sourceCode,
          language,
          problemId: submission.problemId,
          problemTitle: submission.problem.title,
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

      reviews.push({
        id: review.id,
        submissionId: review.submissionId,
        problemId: review.problemId,
        problemTitle: review.problemTitle || "",
        overallRating: review.overallRating || "C",
        summary: review.summary || "",
        strengths: reviewData.strengths,
        improvements: reviewData.improvements,
        complexityScore: review.complexityScore || 5,
        bugs: reviewData.bugs,
      })
    }

    // 全レビュー完了後、学習プランを再生成
    const previousPlan: PreviousPlan | undefined = currentPlan ? {
      weeklyMilestones: currentPlan.weeklyMilestones,
      studyAdvice: currentPlan.studyAdvice || "",
      reviewCount: currentPlan.reviewCount || 0,
    } : undefined

    await updateLearningPlanFromReviews(
      session.user.id,
      reviews.map(r => ({
        overallRating: r.overallRating,
        improvements: JSON.stringify(r.improvements),
        bugs: JSON.stringify(r.bugs),
      })),
      previousPlan
    )

    return NextResponse.json({
      reviews,
      count: reviews.length,
      message: `${reviews.length}件のコードレビューが完了しました。学習プランを更新しました。`,
    })
  } catch (error) {
    console.error("Error generating code reviews:", error)
    return NextResponse.json(
      { error: "Failed to generate code reviews" },
      { status: 500 }
    )
  }
}

// GET: ユーザーのコードレビュー一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const reviews = await prisma.codeReview.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        submissionId: review.submissionId,
        problemId: review.problemId,
        problemTitle: review.problemTitle,
        overallRating: review.overallRating,
        summary: review.summary,
        createdAt: review.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching code reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch code reviews" },
      { status: 500 }
    )
  }
}

// DELETE: コードレビューを削除
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reviewId } = body

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      )
    }

    const review = await prisma.codeReview.findUnique({
      where: { id: reviewId },
    })

    if (!review || review.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Review not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.codeReview.delete({
      where: { id: reviewId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting code review:", error)
    return NextResponse.json(
      { error: "Failed to delete code review" },
      { status: 500 }
    )
  }
}
