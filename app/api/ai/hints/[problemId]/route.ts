import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, generateCompletion } from "@/lib/ai/anthropic"
import { HINT_PROMPTS } from "@/lib/ai/prompts/atcoder"
import { getAtCoderProblem } from "@/lib/atcoder"

// GET: キャッシュされたヒントを取得、または生成
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // z.ai APIキーの確認
    const apiKey = user.claudeApiKey || getDefaultApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: "z.ai API key not configured", setupRequired: true },
        { status: 400 }
      )
    }

    const { problemId } = await params
    const searchParams = req.nextUrl.searchParams
    const level = parseInt(searchParams.get("level") || "1", 10)

    if (level < 1 || level > 3) {
      return NextResponse.json({ error: "Invalid hint level" }, { status: 400 })
    }

    // キャッシュを確認
    const cached = await prisma.hintCache.findUnique({
      where: { problemId_hintLevel: { problemId, hintLevel: level } },
    })

    if (cached) {
      return NextResponse.json({ hint: cached.hintText, cached: true })
    }

    // 問題情報を取得
    const problem = await getAtCoderProblem(problemId)
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 })
    }

    let hint: string

    try {
      // ヒントを生成
      const promptFn = level === 1 ? HINT_PROMPTS.level1 : level === 2 ? HINT_PROMPTS.level2 : HINT_PROMPTS.level3
      const userPrompt = promptFn(problem.title, `https://atcoder.jp/contests/${problem.contest_id}/tasks/${problem.id}`)

      hint = await generateCompletion(apiKey, [{ role: "user", content: userPrompt }], {
        maxTokens: 500,
        temperature: 0.7,
        systemPrompt: HINT_PROMPTS.system,
      })
    } catch (error: any) {
      // APIエラーの詳細な処理
      if (error.message?.includes("credit balance") || error.message?.includes("upgrade or purchase credits")) {
        return NextResponse.json(
          { error: "z.ai APIのクレジット残高が不足しています。z.ai管理画面でクレジットを追加してください。" },
          { status: 402 }
        )
      }
      if (error.message?.includes("401") || error.message?.includes("authentication_error")) {
        return NextResponse.json(
          { error: "z.ai APIキーが無効です。設定画面で確認してください。" },
          { status: 401 }
        )
      }
      throw error
    }

    // キャッシュに保存
    await prisma.hintCache.create({
      data: {
        problemId,
        hintLevel: level,
        hintText: hint,
      },
    })

    return NextResponse.json({ hint, cached: false })
  } catch (error) {
    console.error("Error generating hint:", error)
    return NextResponse.json(
      { error: "Failed to generate hint", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE: キャッシュを削除して再生成を促す
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { problemId } = await params
    const searchParams = req.nextUrl.searchParams
    const level = parseInt(searchParams.get("level") || "1", 10)

    await prisma.hintCache.deleteMany({
      where: { problemId, hintLevel: level },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting hint cache:", error)
    return NextResponse.json({ error: "Failed to delete hint cache" }, { status: 500 })
  }
}
