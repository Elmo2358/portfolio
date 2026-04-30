import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT: 問題のステータス・メモを更新
export async function PUT(
  req: NextRequest,
  { params }: { params: { problemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { problemId } = params
    const body = await req.json()
    const { status, memo } = body

    // ユーザー進捗を更新
    const userProblem = await prisma.atCoderUserProblem.upsert({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId,
        },
      },
      update: {
        status: status || "unattempted",
        memo,
        lastAttempted: new Date(),
      },
      create: {
        userId: session.user.id,
        problemId,
        status: status || "unattempted",
        memo,
      },
    })

    // 問題データも取得
    const problem = await prisma.atCoderProblem.findUnique({
      where: { id: problemId },
    })

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 })
    }

    return NextResponse.json({
      problem: {
        ...problem,
        userStatus: userProblem.status,
        userMemo: userProblem.memo,
        lastAttempted: userProblem.lastAttempted,
      },
    })
  } catch (error) {
    console.error("Error updating AtCoder problem:", error)
    return NextResponse.json(
      { error: "Failed to update problem" },
      { status: 500 }
    )
  }
}

// DELETE: 問題を削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { problemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { problemId } = params

    // ユーザー進捗のみ削除（問題メタデータは残す）
    await prisma.atCoderUserProblem.deleteMany({
      where: {
        userId: session.user.id,
        problemId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting AtCoder problem:", error)
    return NextResponse.json(
      { error: "Failed to delete problem" },
      { status: 500 }
    )
  }
}
