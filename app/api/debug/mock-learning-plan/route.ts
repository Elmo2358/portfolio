import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: テスト用のモック学習プランを作成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 30) // 30日後

    // モック学習プランを作成
    const mockPlan = await prisma.learningPlan.create({
      data: {
        userId: session.user.id,
        targetRating: 1200,
        targetDate,
        currentRating: 800,
        weeklyMilestones: JSON.stringify([
          {
            week: 1,
            title: "基礎固め：DP入門",
            goals: [
              "DPの基本概念を理解する",
              "ナップサック問題を解く",
              "区間DPの基礎を学ぶ"
            ],
            problemCount: 10,
            focusArea: "DP",
            difficultyMin: 800,
            difficultyMax: 1000
          },
          {
            week: 2,
            title: "グラフ理論の基礎",
            goals: [
              "DFS/BFSをマスターする",
              "最短経路問題を解く",
              "Union-Findを理解する"
            ],
            problemCount: 12,
            focusArea: "graph",
            difficultyMin: 900,
            difficultyMax: 1100
          },
          {
            week: 3,
            title: "文字列処理",
            goals: [
              "文字列探索を学ぶ",
              "動的計画法 in 文字列",
              "文字列の前処理テクニック"
            ],
            problemCount: 10,
            focusArea: "string",
            difficultyMin: 1000,
            difficultyMax: 1200
          },
          {
            week: 4,
            title: "総復習と実践",
            goals: [
              "苦手分野の復習",
              "バーチャルコンテスト参加",
              "過去問の復習"
            ],
            problemCount: 15,
            focusArea: "review",
            difficultyMin: 1000,
            difficultyMax: 1300
          }
        ]),
        recommendedProblems: JSON.stringify([
          { id: "abc297_c", reason: "PCの基礎" },
          { id: "abc288_c", reason: "配列操作の練習" },
          { id: "abc283_d", reason: "DPの入門" },
          { id: "abc270_d", reason: "グラフの基礎" }
        ]),
        studyAdvice: "まずは各分野の典型問題を確実に解けるようになりましょう。コンテストには定期的に参加して、実戦経験を積むことも大切です。",
        progress: 0,
        completedTasks: JSON.stringify([]),
      },
    })

    // モックタスクを作成
    const week1Goals = [
      "DPの基本概念を理解する",
      "ナップサック問題を解く",
      "区間DPの基礎を学ぶ"
    ]

    for (const goal of week1Goals) {
      await prisma.learningTask.create({
        data: {
          planId: mockPlan.id,
          userId: session.user.id,
          title: goal,
          description: "第1週の目標",
          taskType: "concept",
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          resources: JSON.stringify([]),
        },
      })
    }

    return NextResponse.json({
      message: "Mock learning plan created",
      plan: mockPlan,
    })
  } catch (error) {
    console.error("Error creating mock learning plan:", error)
    return NextResponse.json(
      { error: "Failed to create mock learning plan" },
      { status: 500 }
    )
  }
}

// GET: モックデータの状態を確認
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plans = await prisma.learningPlan.findMany({
      where: { userId: session.user.id },
      include: {
        tasks: true,
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching mock data:", error)
    return NextResponse.json(
      { error: "Failed to fetch mock data" },
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

    // ユーザーの全学習プランとタスクを削除
    await prisma.learningTask.deleteMany({
      where: { userId: session.user.id },
    })

    await prisma.learningPlan.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ message: "Mock data cleared" })
  } catch (error) {
    console.error("Error clearing mock data:", error)
    return NextResponse.json(
      { error: "Failed to clear mock data" },
      { status: 500 }
    )
  }
}
