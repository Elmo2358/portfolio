import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: テスト用のモック提出データを作成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // モック問題を作成（存在しない場合）
    const mockProblems = [
      {
        id: "abc345_a",
        contestId: "abc345",
        title: "A - Hello World",
        difficulty: 10,
        url: "https://atcoder.jp/contests/abc345/tasks/abc345_a",
      },
      {
        id: "abc345_b",
        contestId: "abc345",
        title: "B - Echo",
        difficulty: 50,
        url: "https://atcoder.jp/contests/abc345/tasks/abc345_b",
      },
      {
        id: "abc346_a",
        contestId: "abc346",
        title: "A - Sum",
        difficulty: 15,
        url: "https://atcoder.jp/contests/abc346/tasks/abc346_a",
      },
    ]

    for (const prob of mockProblems) {
      await prisma.atCoderProblem.upsert({
        where: { id: prob.id },
        update: {},
        create: prob,
      })
    }

    // モック提出を作成
    const mockSubmissions = [
      {
        id: "mock_submission_1",
        problemId: "abc345_a",
        result: "AC",
        language: "Python (CPython 3.11.4)",
        epochSecond: Math.floor(Date.now() / 1000) - 86400, // 1日前
        executionTime: 10,
      },
      {
        id: "mock_submission_2",
        problemId: "abc345_b",
        result: "AC",
        language: "Python (CPython 3.11.4)",
        epochSecond: Math.floor(Date.now() / 1000) - 172800, // 2日前
        executionTime: 15,
      },
      {
        id: "mock_submission_3",
        problemId: "abc346_a",
        result: "AC",
        language: "Python (CPython 3.11.4)",
        epochSecond: Math.floor(Date.now() / 1000) - 259200, // 3日前
        executionTime: 8,
      },
    ]

    const created = []
    for (const sub of mockSubmissions) {
      const existing = await prisma.atCoderSubmission.findUnique({
        where: { id: sub.id },
      })

      if (!existing) {
        const createdSub = await prisma.atCoderSubmission.create({
          data: {
            ...sub,
            userId: session.user.id,
          },
        })
        created.push(createdSub)
      }
    }

    return NextResponse.json({
      message: "Mock submissions created",
      count: created.length,
      submissions: created,
    })
  } catch (error) {
    console.error("Error creating mock submissions:", error)
    return NextResponse.json(
      { error: "Failed to create mock submissions" },
      { status: 500 }
    )
  }
}
