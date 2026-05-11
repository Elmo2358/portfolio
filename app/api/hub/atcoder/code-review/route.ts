import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, generateCompletion } from "@/lib/ai/anthropic"
import { CODE_REVIEW_PROMPTS } from "@/lib/ai/prompts/atcoder"

// POST: 新しいコードレビューを生成
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

    const body = await req.json()
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      )
    }

    // 提出がユーザーのものか確認
    const submission = await prisma.atCoderSubmission.findUnique({
      where: { id: submissionId },
      include: { problem: true },
    })

    if (!submission || submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Submission not found or access denied" },
        { status: 404 }
      )
    }

    // 既にレビューがあるか確認
    const existingReview = await prisma.codeReview.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId,
        },
      },
    })

    // 既にレビューが完了している場合は返す
    if (existingReview && existingReview.summary) {
      return NextResponse.json({
        id: existingReview.id,
        overallRating: existingReview.overallRating,
        strengths: JSON.parse(existingReview.strengths || "[]"),
        improvements: JSON.parse(existingReview.improvements || "[]"),
        complexityScore: existingReview.complexityScore,
        bugs: JSON.parse(existingReview.bugs || "[]"),
        summary: existingReview.summary,
        cached: true,
      })
    }

    // ソースコードを取得（キャッシュから）
    let sourceCode = ""
    let language = ""

    if (existingReview) {
      sourceCode = existingReview.sourceCode
      language = existingReview.language
    } else {
      // ソースコードを取得
      const sourceCodeResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/hub/atcoder/submissions/${submissionId}/source-code`
      )

      if (!sourceCodeResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch source code" },
          { status: 500 }
        )
      }

      const sourceData = await sourceCodeResponse.json()
      sourceCode = sourceData.sourceCode
      language = sourceData.language
    }

    // AIでコードレビューを生成
    const prompt = CODE_REVIEW_PROMPTS.review(sourceCode, language, {
      title: submission.problem.title,
      difficulty: submission.problem.difficulty || undefined,
    })

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
      // パース失敗時のデフォルト値
      reviewData = {
        overallRating: "C",
        strengths: [],
        improvements: [],
        complexityScore: 5,
        bugs: [],
        summary: response.slice(0, 200),
      }
    }

    // レビュー結果を保存または更新
    const review = await prisma.codeReview.upsert({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId,
        },
      },
      create: {
        userId: session.user.id,
        submissionId,
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
      },
      update: {
        overallRating: reviewData.overallRating,
        strengths: JSON.stringify(reviewData.strengths),
        improvements: JSON.stringify(reviewData.improvements),
        complexityScore: reviewData.complexityScore,
        bugs: JSON.stringify(reviewData.bugs),
        summary: reviewData.summary,
      },
    })

    return NextResponse.json({
      id: review.id,
      overallRating: review.overallRating,
      strengths: reviewData.strengths,
      improvements: reviewData.improvements,
      complexityScore: review.complexityScore,
      bugs: reviewData.bugs,
      summary: review.summary,
      cached: false,
    })
  } catch (error) {
    console.error("Error generating code review:", error)
    return NextResponse.json(
      { error: "Failed to generate code review" },
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
    const submissionId = searchParams.get("submissionId")

    const where: any = { userId: session.user.id }
    if (submissionId) {
      where.submissionId = submissionId
    }

    const reviews = await prisma.codeReview.findMany({
      where,
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

    // レビューがユーザーのものか確認
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
