import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchSubmissionWithCode } from "@/lib/atcoder-scraper"

// GET: 提出のソースコードを取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { submissionId } = await params

    // 既にキャッシュがあるか確認
    const cachedReview = await prisma.codeReview.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId,
        },
      },
    })

    if (cachedReview) {
      return NextResponse.json({
        submissionId,
        sourceCode: cachedReview.sourceCode,
        language: cachedReview.language,
        problemId: cachedReview.problemId,
        problemTitle: cachedReview.problemTitle,
        cached: true,
      })
    }

    // キャッシュがない場合はAtCoderから取得
    // まず、提出がユーザーのものか確認
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

    // AtCoderからソースコードを取得
    const scrapedData = await fetchSubmissionWithCode(
      submissionId,
      submission.problem.contestId
    )

    if (!scrapedData) {
      return NextResponse.json(
        { error: "Failed to fetch source code from AtCoder" },
        { status: 500 }
      )
    }

    // キャッシュに保存
    await prisma.codeReview.create({
      data: {
        userId: session.user.id,
        submissionId,
        sourceCode: scrapedData.sourceCode,
        language: scrapedData.language,
        problemId: scrapedData.problemId,
        problemTitle: scrapedData.problemTitle,
        summary: "",
      },
    })

    return NextResponse.json({
      submissionId,
      sourceCode: scrapedData.sourceCode,
      language: scrapedData.language,
      problemId: scrapedData.problemId,
      problemTitle: scrapedData.problemTitle,
      cached: false,
    })
  } catch (error) {
    console.error("Error fetching source code:", error)
    return NextResponse.json(
      { error: "Failed to fetch source code" },
      { status: 500 }
    )
  }
}
