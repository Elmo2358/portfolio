import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: 問題推薦を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type") || "next"

    // 推薦タイプに応じた処理
    let recommendations: Array<{ id: string; title: string; difficulty?: number; reason: string }>

    switch (type) {
      case "next":
        recommendations = await getNextLevelRecommendations(session.user.id)
        break
      case "review":
        recommendations = await getReviewRecommendations(session.user.id)
        break
      default:
        return NextResponse.json({ error: "Invalid recommendation type" }, { status: 400 })
    }

    return NextResponse.json({
      type,
      recommendations,
    })
  } catch (error) {
    console.error("Error in recommendations API:", error)
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 })
  }
}

/**
 * 初回ユーザー向けの入門問題を取得
 */
async function getBeginnerProblems(): Promise<Array<{ id: string; title: string; difficulty?: number; reason: string }>> {
  console.log("[getBeginnerProblems] Fetching beginner problems...")

  // まずはdifficultyがある問題を取得
  const beginnerProblems = await prisma.atCoderProblem.findMany({
    where: {
      difficulty: {
        lte: 400,  // 簡単な問題
      },
      id: {
        endsWith: "_a",  // A問題のみ
      },
    },
    orderBy: {
      difficulty: "asc",
    },
    take: 8,
  })

  if (beginnerProblems.length > 0) {
    console.log(`[getBeginnerProblems] Found ${beginnerProblems.length} beginner problems with difficulty`)
    return beginnerProblems.map((p, index) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty || undefined,
      reason: index === 0
        ? "復帰後の最初の問題！ウォーミングアップとして取り組みましょう。"
        : "復帰用問題：基本的な構文や考え方を思い出しましょう。",
    }))
  }

  // difficultyがない場合は、ABCのA問題を取得
  console.log("[getBeginnerProblems] No problems with difficulty, fetching ABC A problems...")
  const abcAProblems = await prisma.atCoderProblem.findMany({
    where: {
      id: {
        startsWith: "abc",
        endsWith: "_a",
      },
    },
    orderBy: {
      id: "asc",
    },
    take: 8,
  })

  console.log(`[getBeginnerProblems] Found ${abcAProblems.length} ABC A problems`)
  return abcAProblems.map((p, index) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty || undefined,
    reason: index === 0
      ? "復帰後の最初の問題！ウォーミングアップとして取り組みましょう。"
      : "復帰用問題：基本的な構文や考え方を思い出しましょう。",
  }))
}

/**
 * コンテストプレフィックスで問題をフィルタリング
 * AtCoderの問題IDは "abc043_a" 形式で、プレフィックスは "abc" のような3文字
 */
function filterByContestPrefix(problems: any[], prefix: string): any[] {
  const lowerPrefix = prefix.toLowerCase()
  return problems.filter(p => {
    const contestPrefix = p.id.substring(0, 3).toLowerCase()
    return contestPrefix === lowerPrefix
  })
}

/**
 * 次のレベル推薦：学習プランに基づいて問題を推薦
 */
async function getNextLevelRecommendations(userId: string) {
  console.log("[getNextLevelRecommendations] Starting for user:", userId)

  // 最新の学習プランを取得
  const plan = await prisma.learningPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  // ユーザーが解いた問題を取得
  const userProblems = await prisma.atCoderUserProblem.findMany({
    where: { userId },
  })

  const solvedProblemIds = new Set(
    userProblems
      .filter((up) => up.status === "contest_ac" || up.status === "upsolved_ac")
      .map((up) => up.problemId)
  )

  console.log("[getNextLevelRecommendations] Solved problems count:", solvedProblemIds.size)

  // 最後のAC日時を取得
  const lastAcProblem = userProblems
    .filter((up) => up.status === "contest_ac" || up.status === "upsolved_ac")
    .sort((a, b) => {
      const dateA = a.lastAttempted ? new Date(a.lastAttempted).getTime() : 0
      const dateB = b.lastAttempted ? new Date(b.lastAttempted).getTime() : 0
      return dateB - dateA
    })[0]

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // まだACしていない、または半年以上ACしていない場合は入門問題を推薦
  const needsBeginnerProblems = solvedProblemIds.size === 0 ||
    (lastAcProblem?.lastAttempted && new Date(lastAcProblem.lastAttempted) < sixMonthsAgo)

  console.log("[getNextLevelRecommendations] needsBeginnerProblems:", needsBeginnerProblems,
    "solvedCount:", solvedProblemIds.size,
    "lastAc:", lastAcProblem?.lastAttempted)

  if (needsBeginnerProblems) {
    return await getBeginnerProblems()
  }

  // プランがない場合はデフォルト基準
  const defaultCriteria = {
    focusAreas: ["全般"],
    difficultyMin: 800,
    difficultyMax: 1200,
    excludeSolved: true,
    preferContest: "ABC",
  }

  const criteria = plan
    ? JSON.parse(plan.recommendationCriteria || "{}")
    : defaultCriteria

  // 有効な基準がない場合はデフォルトを使用
  const effectiveCriteria = {
    focusAreas: criteria.focusAreas || defaultCriteria.focusAreas,
    difficultyMin: criteria.difficultyMin || defaultCriteria.difficultyMin,
    difficultyMax: criteria.difficultyMax || defaultCriteria.difficultyMax,
    excludeSolved: criteria.excludeSolved !== false,
    preferContest: criteria.preferContest || defaultCriteria.preferContest,
  }

  console.log("[getNextLevelRecommendations] Using criteria:", effectiveCriteria)

  /**
   * 問題検索のメインロジック
   *
   * 優先順位:
   * 1. preferContest + 基本範囲
   * 2. preferContest + 拡大範囲
   * 3. 全コンテスト + 基本範囲
   * 4. 全コンテスト + 拡大範囲
   * 5. 全コンテスト + difficultyMax以上（フォールバック）
   */
  let problems: any[] = []
  let usedFallback = false

  const excludeIds: Set<string> = effectiveCriteria.excludeSolved ? solvedProblemIds : new Set<string>()

  // ステップ1: preferContest + 基本範囲
  if (effectiveCriteria.preferContest) {
    const baseProblems = await searchProblems(
      effectiveCriteria.difficultyMin,
      effectiveCriteria.difficultyMax,
      excludeIds,
      50
    )
    const contestFiltered = filterByContestPrefix(baseProblems, effectiveCriteria.preferContest)
    problems = contestFiltered.slice(0, 5)
    console.log(`[getNextLevelRecommendations] Step 1 (contest + base): ${problems.length} problems`)
  }

  // ステップ2: preferContest + 拡大範囲
  if (problems.length < 5 && effectiveCriteria.preferContest) {
    const expandedMin = Math.max(0, effectiveCriteria.difficultyMin - 200)
    const expandedMax = effectiveCriteria.difficultyMax + 400
    const expandedProblems = await searchProblems(expandedMin, expandedMax, excludeIds, 50)
    const contestFiltered = filterByContestPrefix(expandedProblems, effectiveCriteria.preferContest)

    // 重複を除外して追加
    const existingIds = new Set(problems.map(p => p.id))
    const newProblems = contestFiltered.filter(p => !existingIds.has(p.id))
    problems.push(...newProblems.slice(0, 5 - problems.length))
    console.log(`[getNextLevelRecommendations] Step 2 (contest + expanded): ${problems.length} problems`)
  }

  // ステップ3: 全コンテスト + 基本範囲
  if (problems.length < 5) {
    const baseAll = await searchProblems(
      effectiveCriteria.difficultyMin,
      effectiveCriteria.difficultyMax,
      excludeIds,
      50
    )

    // 重複を除外して追加
    const existingIds = new Set(problems.map(p => p.id))
    const newProblems = baseAll.filter(p => !existingIds.has(p.id))
    problems.push(...newProblems.slice(0, 5 - problems.length))
    console.log(`[getNextLevelRecommendations] Step 3 (all + base): ${problems.length} problems`)
  }

  // ステップ4: 全コンテスト + 拡大範囲
  if (problems.length < 5) {
    const expandedMin = Math.max(0, effectiveCriteria.difficultyMin - 200)
    const expandedMax = effectiveCriteria.difficultyMax + 400
    const expandedAll = await searchProblems(expandedMin, expandedMax, excludeIds, 50)

    // 重複を除外して追加
    const existingIds = new Set(problems.map(p => p.id))
    const newProblems = expandedAll.filter(p => !existingIds.has(p.id))
    problems.push(...newProblems.slice(0, 5 - problems.length))
    console.log(`[getNextLevelRecommendations] Step 4 (all + expanded): ${problems.length} problems`)
  }

  // ステップ5: フォールバック（difficultyMax以上）
  if (problems.length < 5) {
    const fallbackProblems = await searchProblems(
      effectiveCriteria.difficultyMax,
      9999,
      excludeIds,
      50
    )

    // 重複を除外して追加
    const existingIds = new Set(problems.map(p => p.id))
    const newProblems = fallbackProblems.filter(p => !existingIds.has(p.id))
    problems.push(...newProblems.slice(0, 5 - problems.length))
    usedFallback = newProblems.length > 0
    console.log(`[getNextLevelRecommendations] Step 5 (fallback): ${problems.length} problems, usedFallback=${usedFallback}`)
  }

  // 最終手段：まだ足りない場合は、既解決問題も含めて検索
  if (problems.length < 5) {
    console.log("[getNextLevelRecommendations] Still not enough, including solved problems...")
    const anyProblems = await searchProblems(
      effectiveCriteria.difficultyMin,
      effectiveCriteria.difficultyMax + 500,
      new Set(), // 既解決問題も含める
      50
    )

    // 重複を除外して追加
    const existingIds = new Set(problems.map(p => p.id))
    const newProblems = anyProblems.filter(p => !existingIds.has(p.id))
    problems.push(...newProblems.slice(0, 5 - problems.length))
    usedFallback = true
    console.log(`[getNextLevelRecommendations] Step 6 (include solved): ${problems.length} problems`)
  }

  /**
   * 理由を生成
   */
  const focusAreasText = effectiveCriteria.focusAreas.join("、")
  const hasHighDifficultyProblems = usedFallback || problems.some(p => (p.difficulty || 0) > effectiveCriteria.difficultyMax)

  let reasonText: string
  if (usedFallback) {
    reasonText = `設定範囲内の問題が見つかりませんでした。難易度${effectiveCriteria.difficultyMax}以上の問題や、既に解いた問題も含めて推薦します`
  } else if (plan) {
    reasonText = `学習プランに基づく推薦：${focusAreasText}分野でdifficulty ${effectiveCriteria.difficultyMin}-${effectiveCriteria.difficultyMax} の問題に取り組みましょう`
  } else {
    reasonText = `次のレベル向け：difficulty ${effectiveCriteria.difficultyMin}-${effectiveCriteria.difficultyMax} の問題に挑戦しましょう`
  }

  const result = problems.slice(0, 10).map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty || undefined,
    reason: reasonText,
  }))

  console.log("[getNextLevelRecommendations] Returning", result.length, "recommendations")
  return result
}

/**
 * 問題を検索するヘルパー関数
 */
async function searchProblems(
  difficultyMin: number,
  difficultyMax: number,
  excludeIds: Set<string>,
  take: number
): Promise<Array<{ id: string; title: string; difficulty: number | null }>> {
  const whereClause: any = {
    difficulty: {
      gte: difficultyMin,
      lte: difficultyMax,
    },
  }

  if (excludeIds.size > 0) {
    whereClause.id = { notIn: Array.from(excludeIds) }
  }

  return await prisma.atCoderProblem.findMany({
    where: whereClause,
    orderBy: { difficulty: "asc" },
    take,
  })
}

/**
 * 復習推薦：評価が低かった問題を推薦
 */
async function getReviewRecommendations(userId: string) {
  // 直近のコードレビューから評価C/Dの問題を取得
  const recentReviews = await prisma.codeReview.findMany({
    where: {
      userId,
      overallRating: { in: ["C", "D"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  if (recentReviews.length === 0) {
    // レビューがない場合は空の配列を返す
    return []
  }

  // 評価が低かった問題IDを抽出（重複除外）
  const poorRatedProblemIds = Array.from(new Set(recentReviews.map((r) => r.problemId)))

  // 最近（30日以内）にACした問題を除外
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAcSubmissions = await prisma.atCoderSubmission.findMany({
    where: {
      userId,
      result: "AC",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { problemId: true },
  })

  const recentAcProblemIds = new Set(recentAcSubmissions.map((s) => s.problemId))

  // 最近ACしていない問題のみをフィルタ
  const reviewProblemIds = poorRatedProblemIds.filter(
    (id) => !recentAcProblemIds.has(id)
  )

  if (reviewProblemIds.length === 0) {
    return []
  }

  // 問題を取得（最大3件）
  const problems = await prisma.atCoderProblem.findMany({
    where: {
      id: { in: reviewProblemIds.slice(0, 3) },
    },
    take: 3,
  })

  return problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty || undefined,
    reason: "前回のレビューで評価が低かった問題。再挑戦して理解を深めましょう。",
  }))
}
