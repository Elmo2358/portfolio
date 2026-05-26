import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT: 問題の解説URLを更新
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { problemId } = await params
    const body = await req.json()
    const { explanationUrl } = body

    // 問題メタデータを更新（管理者のみ、または自分で作成した問題のみ）
    const problem = await prisma.atCoderProblem.findUnique({
      where: { id: problemId },
    })

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 })
    }

    // 解説URLを更新
    const updated = await prisma.atCoderProblem.update({
      where: { id: problemId },
      data: {
        explanationUrl: explanationUrl?.trim() || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating explanation URL:", error)
    return NextResponse.json(
      { error: "Failed to update explanation URL" },
      { status: 500 }
    )
  }
}
