import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: テスト用のモックコードレビューを作成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // モック問題を作成
    const mockProblem = {
      id: "abc345_a",
      contestId: "abc345",
      title: "A - Hello World",
      difficulty: 10,
      url: "https://atcoder.jp/contests/abc345/tasks/abc345_a",
    }

    await prisma.atCoderProblem.upsert({
      where: { id: mockProblem.id },
      update: {},
      create: mockProblem,
    })

    // モック提出を作成
    const mockSubmission = {
      id: "mock_review_submission",
      problemId: mockProblem.id,
      result: "AC",
      language: "Python (CPython 3.11.4)",
      epochSecond: Math.floor(Date.now() / 1000) - 86400,
      executionTime: 10,
    }

    await prisma.atCoderSubmission.upsert({
      where: { id: mockSubmission.id },
      update: {},
      create: {
        ...mockSubmission,
        userId: session.user.id,
      },
    })

    // モックコードレビューを作成（レビュー済みとして登録）
    const mockReview = await prisma.codeReview.create({
      data: {
        userId: session.user.id,
        submissionId: mockSubmission.id,
        sourceCode: `def solve():
    s = input()
    print(s + s)

if __name__ == "__main__":
    solve()`,
        language: "Python",
        problemId: mockProblem.id,
        problemTitle: mockProblem.title,
        overallRating: "A",
        strengths: JSON.stringify([
          "シンプルで読みやすい実装",
          "適切に関数分けされている",
          "入出力が明確"
        ]),
        improvements: JSON.stringify([
          "型ヒントを追加するとより良くなる",
          "エッジケース（空文字列）の対応を考慮する"
        ]),
        complexityScore: 2,
        bugs: JSON.stringify([]),
        summary: "全体的に良い実装です。シンプルで可読性が高く、Pythonらしい書き方ができています。型ヒントを追加するとさらにコードの品質が向上します。",
      },
    })

    return NextResponse.json({
      message: "Mock code review created",
      review: mockReview,
    })
  } catch (error) {
    console.error("Error creating mock code review:", error)
    return NextResponse.json(
      { error: "Failed to create mock code review" },
      { status: 500 }
    )
  }
}

// DELETE: モックデータをクリア
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.codeReview.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ message: "Mock code reviews cleared" })
  } catch (error) {
    console.error("Error clearing mock data:", error)
    return NextResponse.json(
      { error: "Failed to clear mock data" },
      { status: 500 }
    )
  }
}
