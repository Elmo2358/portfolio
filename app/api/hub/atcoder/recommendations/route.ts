import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, generateCompletion, type Message } from "@/lib/ai/anthropic"
import { RECOMMENDATION_PROMPTS } from "@/lib/ai/prompts/atcoder"
import { getAllProblems, type AtCoderProblemInfo } from "@/lib/atcoder"

// AtCoderの標準的な問題ID形式かチェック
function isValidAtCoderProblemId(problemId: string): boolean {
  // 標準形式: abc{number}_{letter}, arc{number}_{letter}, agc{number}_{letter} 等
  const standardPattern = /^(abc|arc|agc|abr)[0-9]+_[a-z0-9]+$/i
  return standardPattern.test(problemId)
}

// GET: 問題推薦を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // z.ai APIキーの確認
    const userApiKey = await getUserApiKey(session.user.id)
    const defaultApiKey = getDefaultApiKey()
    const apiKey = userApiKey || defaultApiKey

    console.log("API Key check:", {
      hasUserApiKey: !!userApiKey,
      hasDefaultApiKey: !!defaultApiKey,
      userKeyPrefix: userApiKey ? userApiKey.slice(0, 8) : "none",
    })

    if (!apiKey) {
      // 詳細なエラー情報を返す
      const { prisma } = await import("@/lib/prisma")
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { claudeApiKey: true, claudeApiEnabled: true },
      })

      return NextResponse.json(
        {
          error: "z.ai API key not configured",
          setupRequired: true,
          debug: {
            hasApiKey: !!user?.claudeApiKey,
            apiEnabled: user?.claudeApiEnabled,
            hasUserApiKey: !!userApiKey,
            hasDefaultApiKey: !!defaultApiKey,
          },
        },
        { status: 400 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type") || "difficulty"
    const limit = parseInt(searchParams.get("limit") || "5", 10)

    // ユーザーデータを取得
    const userData = await getUserData(session.user.id)

    // 推薦タイプに応じた処理
    let recommendations: Array<{ id: string; title: string; difficulty?: number; reason: string }> = []

    switch (type) {
      case "difficulty":
        recommendations = await getDifficultyBasedRecommendations(userData, limit, apiKey)
        break
      case "review":
        recommendations = await getReviewRecommendations(session.user.id, userData, limit, apiKey)
        break
      case "next":
        recommendations = await getNextProblemRecommendations(userData, limit, apiKey)
        break
      default:
        return NextResponse.json({ error: "Invalid recommendation type" }, { status: 400 })
    }

    return NextResponse.json({
      type,
      recommendations,
      userAnalysis: {
        acCount: userData.acCount,
        avgDifficulty: userData.avgDifficulty,
        targetDifficulty: userData.targetDifficulty,
      },
    })
  } catch (error) {
    console.error("Error in recommendations API:", error)
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 })
  }
}

// ユーザーデータを取得
async function getUserData(userId: string) {
  // ユーザーの問題進捗を取得
  const userProblems = await prisma.atCoderUserProblem.findMany({
    where: { userId },
    include: { problem: true },
  })

  // AC問題のみを抽出
  const acProblems = userProblems.filter(
    (up) => up.status === "contest_ac" || up.status === "upsolved_ac"
  )

  // AC問題のdifficulty平均
  const difficulties = acProblems
    .map((up) => up.problem.difficulty)
    .filter((d): d is number => d !== null && d !== undefined)

  const avgDifficulty = difficulties.length > 0
    ? Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
    : 800 // デフォルト値

  // 目標difficulty（平均+200）
  const targetDifficulty = avgDifficulty + 200

  // 最近のAC問題
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAcProblems = await prisma.atCoderSubmission.findMany({
    where: {
      userId,
      result: "AC",
      createdAt: { gte: thirtyDaysAgo },
    },
    include: { problem: true },
    orderBy: { epochSecond: "desc" },
    take: 20,
  })

  // 既に解いた問題IDのセット（推薦から除外する）
  const solvedProblemIds = new Set(
    userProblems
      .filter((up) => up.status === "contest_ac" || up.status === "upsolved_ac")
      .map((up) => up.problemId)
  )

  // ユーザーが登録している問題IDのセット
  const registeredProblemIds = new Set(
    userProblems.map((up) => up.problemId)
  )

  return {
    acCount: acProblems.length,
    avgDifficulty,
    targetDifficulty,
    recentAcProblems: recentAcProblems.map((s) => ({
      id: s.problemId,
      difficulty: s.problem.difficulty,
      date: new Date(s.epochSecond * 1000).toISOString(),
    })),
    solvedProblemIds,
    registeredProblemIds,
    totalProblems: userProblems.length,
  }
}

// 難易度ベースの推薦
async function getDifficultyBasedRecommendations(
  userData: Awaited<ReturnType<typeof getUserData>>,
  limit: number,
  apiKey: string
) {
  const allProblems = await getAllProblems()
  let candidates: typeof allProblems = []

  // 初心者向けの段階的推薦
  if (userData.acCount < 5) {
    // 完全初心者：ABC A問題（最も簡単）
    console.log("Beginner mode: ABC A problems")
    candidates = allProblems
      .filter((p) => {
        if (userData.solvedProblemIds.has(p.id)) return false
        if (!p.id.match(/^abc\d+_a$/i)) return false
        return true
      })
      .slice(0, limit)

    return candidates.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      reason: "初心者向け：まずはABCのA問題から始めましょう！",
    }))
  } else if (userData.acCount < 10) {
    // ABC A問題完了後：B問題
    console.log("Beginner mode: ABC B problems")
    candidates = allProblems
      .filter((p) => {
        if (userData.solvedProblemIds.has(p.id)) return false
        if (!p.id.match(/^abc\d+_b$/i)) return false
        return true
      })
      .slice(0, limit)

    return candidates.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      reason: "初心者向け：ABCのB問題に挑戦しましょう！",
    }))
  } else if (userData.acCount < 20) {
    // ABC B問題完了後：C問題
    console.log("Beginner mode: ABC C problems")
    candidates = allProblems
      .filter((p) => {
        if (userData.solvedProblemIds.has(p.id)) return false
        if (!p.id.match(/^abc\d+_c$/i)) return false
        return true
      })
      .slice(0, limit)

    return candidates.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      reason: "中級者向け：ABCのC問題で実力を付けましょう！",
    }))
  }

  // 中級者以上：AIで推薦
  console.log("AI mode: personalized recommendations")
  const prompt = RECOMMENDATION_PROMPTS.byDifficulty({
    avgDifficulty: userData.avgDifficulty,
    solvedCount: userData.acCount,
    targetDifficulty: userData.targetDifficulty,
  })

  const response = await generateCompletion(apiKey, [{ role: "user", content: prompt }], {
    maxTokens: 500,
    temperature: 0.7,
    systemPrompt: RECOMMENDATION_PROMPTS.system,
  })

  // レスポンスからdifficulty範囲を抽出
  let minDiff = userData.avgDifficulty - 200
  let maxDiff = userData.avgDifficulty + 400

  try {
    const jsonMatch = response.match(/\{[^}]+\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      minDiff = parsed.min || minDiff
      maxDiff = parsed.max || maxDiff
    }
  } catch {
    // パース失敗時はデフォルト値を使用
  }

  candidates = allProblems
    .filter((p) => {
      if (userData.solvedProblemIds.has(p.id)) return false
      if (!p.difficulty) return false
      if (!isValidAtCoderProblemId(p.id)) return false
      return p.difficulty >= minDiff && p.difficulty <= maxDiff
    })
    .sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0))
    .slice(0, limit * 2)

  // 候補が足りない場合は範囲を広げる
  if (candidates.length < limit) {
    console.log(`Not enough candidates (${candidates.length}), expanding range...`)
    const expandedMin = Math.max(0, minDiff - 400)
    const expandedMax = maxDiff + 600
    candidates = allProblems
      .filter((p) => {
        if (userData.solvedProblemIds.has(p.id)) return false
        if (!isValidAtCoderProblemId(p.id)) return false
        if (!p.difficulty) return p.id.match(/^abc\d+_[a-d]$/i)
        return p.difficulty >= expandedMin && p.difficulty <= expandedMax
      })
      .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
      .slice(0, limit * 2)
  }

  // AIで最終選択
  if (candidates.length > 0) {
    const selectionPrompt = RECOMMENDATION_PROMPTS.selectFromProblems(
      candidates.map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
      })),
      limit,
      `difficulty ${minDiff}-${maxDiff}の範囲で、現在のレートに適した問題`
    )

    const selectionResponse = await generateCompletion(apiKey, [{ role: "user", content: selectionPrompt }], {
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: RECOMMENDATION_PROMPTS.system,
    })

    try {
      const jsonMatch = selectionResponse.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return parsed.recommendations.map((rec: { id: string; title: string; reason: string }) => {
            const problem = candidates.find((p) => p.id === rec.id)
            return {
              id: rec.id,
              title: problem?.title || rec.title,
              difficulty: problem?.difficulty,
              reason: rec.reason,
            }
          })
        }
      }
    } catch {
      // パース失敗時は手動選択
    }
  }

  // 最終フォールバック - ABC A-C問題のみ
  if (candidates.length === 0) {
    console.log("Fallback: returning closest problems...")
    candidates = allProblems
      .filter((p) => !userData.solvedProblemIds.has(p.id))
      .filter((p) => isValidAtCoderProblemId(p.id))
      .filter((p) => p.id.match(/^abc\d+_[a-c]$/i))
      .slice(0, limit)
  }

  if (candidates.length === 0) {
    candidates = allProblems
      .filter((p) => !userData.solvedProblemIds.has(p.id))
      .filter((p) => isValidAtCoderProblemId(p.id))
      .slice(0, limit)
  }

  return candidates.slice(0, limit).map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    reason: p.difficulty
      ? `difficulty ${p.difficulty} の問題。現在のレートに適しています。`
      : `推奨問題: ${p.title}`,
  }))
}

// 復習用推薦
async function getReviewRecommendations(
  userId: string,
  userData: Awaited<ReturnType<typeof getUserData>>,
  limit: number,
  apiKey: string
) {
  // 復習条件をAIで決定
  const prompt = RECOMMENDATION_PROMPTS.review(userData)

  const response = await generateCompletion(apiKey, [{ role: "user", content: prompt }], {
    maxTokens: 500,
    temperature: 0.7,
    systemPrompt: RECOMMENDATION_PROMPTS.system,
  })

  let targetDifficultyMax = 1200
  let daysAgo = 30

  try {
    const jsonMatch = response.match(/\{[^}]+\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      targetDifficultyMax = parsed.difficultyMax || targetDifficultyMax
      daysAgo = parsed.daysAgo || daysAgo
    }
  } catch {
    // パース失敗時はデフォルト値を使用
  }

  // 過去にACした問題から、指定条件のものを取得
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - daysAgo)

  const pastAcSubmissions = await prisma.atCoderSubmission.findMany({
    where: {
      userId,
      result: "AC",
    },
    include: { problem: true },
    orderBy: { epochSecond: "desc" },
    take: 100,
  })

  // difficultyが低めの問題を優先（基礎復習）
  let reviewCandidates = pastAcSubmissions
    .filter((s) => s.problem.difficulty && s.problem.difficulty <= targetDifficultyMax)
    .sort((a, b) => (a.problem.difficulty || 0) - (b.problem.difficulty || 0))
    .slice(0, limit)

  // 復習候補がない場合は、既に解いた問題の中からdifficultyが低めのものを返す
  if (reviewCandidates.length === 0) {
    const userAcProblems = await prisma.atCoderUserProblem.findMany({
      where: {
        userId,
        status: { in: ["contest_ac", "upsolved_ac"] },
      },
      include: { problem: true },
    })

    reviewCandidates = userAcProblems
      .filter((up) => up.problem.difficulty)
      .sort((a, b) => (a.problem.difficulty || 0) - (b.problem.difficulty || 0))
      .slice(0, limit)
      .map((up) => ({
        problemId: up.problemId,
        problem: up.problem,
        result: "AC",
        id: "",
        userId,
        language: "",
        executionTime: null,
        epochSecond: 0,
        createdAt: new Date(),
      })) as typeof reviewCandidates
  }

  return reviewCandidates.map((s) => ({
    id: s.problemId,
    title: s.problem.title,
    difficulty: s.problem.difficulty || undefined,
    reason: `復習用: ${s.problem.title}（difficulty ${s.problem.difficulty}）`,
  }))
}

// 次の問題推薦（現在のレートから少し難しめ）
async function getNextProblemRecommendations(
  userData: Awaited<ReturnType<typeof getUserData>>,
  limit: number,
  apiKey: string
) {
  // 目標difficultyより少し上の問題を推薦
  const targetMin = userData.avgDifficulty + 100
  const targetMax = userData.avgDifficulty + 500

  const allProblems = await getAllProblems()
  let candidates = allProblems
    .filter((p) => {
      // 既に解いた問題は除外
      if (userData.solvedProblemIds.has(p.id)) return false
      if (!p.difficulty) return false
      if (!isValidAtCoderProblemId(p.id)) return false
      return p.difficulty >= targetMin && p.difficulty <= targetMax
    })
    .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
    .slice(0, limit)

  // 候補が足りない場合は範囲を広げる
  if (candidates.length < limit) {
    const expandedMin = Math.max(400, targetMin - 300)
    const expandedMax = targetMax + 400
    candidates = allProblems
      .filter((p) => {
        if (userData.solvedProblemIds.has(p.id)) return false
        if (!p.difficulty) return false
        if (!isValidAtCoderProblemId(p.id)) return false
        return p.difficulty >= expandedMin && p.difficulty <= expandedMax
      })
      .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
      .slice(0, limit)
  }

  // 最終フォールバック
  if (candidates.length === 0) {
    candidates = allProblems
      .filter((p) => p.difficulty && p.difficulty >= userData.avgDifficulty && !userData.solvedProblemIds.has(p.id))
      .filter((p) => isValidAtCoderProblemId(p.id))
      .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
      .slice(0, limit)
  }

  // さらにそれでも0件の場合
  if (candidates.length === 0) {
    candidates = allProblems
      .filter((p) => !userData.solvedProblemIds.has(p.id) && !userData.registeredProblemIds?.has(p.id))
      .filter((p) => isValidAtCoderProblemId(p.id))
      .slice(0, limit)
  }

  // 最終的にABC/ARC/AGCの問題のみ返す
  if (candidates.length === 0) {
    candidates = allProblems
      .filter((p) => isValidAtCoderProblemId(p.id))
      .filter((p) => !userData.solvedProblemIds.has(p.id))
      .slice(0, limit)
  }

  return candidates.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    reason: p.difficulty
      ? `レートアップ目標: difficulty ${p.difficulty}。現在のレートより少し難しい問題です。`
      : `レートアップ目標: ${p.title}`,
  }))
}
