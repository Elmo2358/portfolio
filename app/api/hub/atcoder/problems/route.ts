import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAtCoderProblem } from "@/lib/atcoder"

// GET: 問題一覧取得（検索・フィルタリング対応）
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const contestId = searchParams.get("contestId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // ベースとなる問題クエリ
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { id: { contains: search } },
      ]
    }

    if (contestId) {
      where.contestId = { contains: contestId }
    }

    // 問題を取得（ユーザー進捗がある問題のみ）
    const allProblems = await prisma.atCoderProblem.findMany({
      where,
      orderBy: { id: "asc" },
    })

    // ユーザーの進捗データを取得
    const userProblems = await prisma.atCoderUserProblem.findMany({
      where: { userId: session.user.id },
    })

    const userProblemMap = new Map(
      userProblems.map((up) => [up.problemId, up])
    )

    // ユーザー進捗がある問題のみ表示
    const problems = allProblems.filter((p) => userProblemMap.has(p.id))

    // ユーザー進捗をマージ
    let enrichedProblems = problems.map((problem) => {
      const userProblem = userProblemMap.get(problem.id)
      return {
        ...problem,
        userStatus: userProblem?.status || "unattempted",
        userMemo: userProblem?.memo || null,
        lastAttempted: userProblem?.lastAttempted || null,
      }
    })

    // ステータスフィルタ（クライアントサイドでフィルタリング）
    if (status) {
      enrichedProblems = enrichedProblems.filter((p) => p.userStatus === status)
    }

    // ページング適用
    const startIndex = (page - 1) * limit
    const paginatedProblems = enrichedProblems.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      problems: paginatedProblems,
      pagination: {
        total: enrichedProblems.length,
        page,
        limit,
        hasMore: startIndex + limit < enrichedProblems.length,
      },
    })
  } catch (error) {
    console.error("Error fetching AtCoder problems:", error)
    return NextResponse.json(
      { error: "Failed to fetch problems" },
      { status: 500 }
    )
  }
}

// POST: 新しい問題を手動追加
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { problemId, title, url, status, memo } = body
    let contestId = body.contestId

    if (!problemId || !title || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // URL形式の検証
    const validUrlPattern = /^https:\/\/atcoder\.jp\/contests\/[^\/]+\/tasks\/[^\/]+$/
    if (!validUrlPattern.test(url)) {
      return NextResponse.json(
        { error: "無効なAtCoder URLです。正しいURLを入力してください。" },
        { status: 400 }
      )
    }

    // URLから問題IDを抽出して照合
    const urlProblemId = url.split("/tasks/")[1]
    if (urlProblemId !== problemId) {
      return NextResponse.json(
        { error: "URLと問題IDが一致しません。" },
        { status: 400 }
      )
    }

    // AtCoder Problems APIで問題の存在を確認
    try {
      const apiProblem = await getAtCoderProblem(problemId)
      if (!apiProblem) {
        return NextResponse.json(
          { error: "AtCoderに存在しない問題IDです。正しい問題IDを入力してください。" },
          { status: 400 }
        )
      }
      // APIから取得した情報で上書き（より正確なデータ）
      contestId = apiProblem.contest_id
    } catch (apiError) {
      console.error("Error validating problem with AtCoder API:", apiError)
      // APIエラーは無視して続行（ネットワーク問題等の場合）
    }

    // 問題が存在しない場合は作成
    const problem = await prisma.atCoderProblem.upsert({
      where: { id: problemId },
      update: {},
      create: {
        id: problemId,
        title,
        contestId: contestId || problemId.split("_")[0],
        url,
      },
    })

    // ユーザー進捗を作成・更新
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

    return NextResponse.json({
      problem: {
        ...problem,
        userStatus: userProblem.status,
        userMemo: userProblem.memo,
        lastAttempted: userProblem.lastAttempted,
      },
    })
  } catch (error) {
    console.error("Error creating AtCoder problem:", error)
    return NextResponse.json(
      { error: "Failed to create problem" },
      { status: 500 }
    )
  }
}
