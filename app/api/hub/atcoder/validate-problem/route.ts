import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAtCoderProblem } from "@/lib/atcoder"

// GET: 問題IDから問題情報を取得（バリデーション用）
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const problemId = searchParams.get("problemId")

    if (!problemId) {
      return NextResponse.json(
        { error: "problemId is required" },
        { status: 400 }
      )
    }

    // AtCoder Problems APIで問題の存在を確認
    const problem = await getAtCoderProblem(problemId)

    if (!problem) {
      return NextResponse.json(
        { error: "問題が見つかりません", exists: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      exists: true,
      problem: {
        id: problem.id,
        title: problem.title,
        contestId: problem.contest_id,
        url: `https://atcoder.jp/contests/${problem.contest_id}/tasks/${problem.id}`,
        difficulty: problem.difficulty,
      },
    })
  } catch (error) {
    console.error("Error validating problem:", error)
    return NextResponse.json(
      { error: "Failed to validate problem" },
      { status: 500 }
    )
  }
}
