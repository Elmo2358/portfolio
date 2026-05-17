// 学習プラン生成ヘルパー関数
// コードレビューAPIと学習プランAPIから共有利用

import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, generateCompletion } from "@/lib/ai/anthropic"
import { LEARNING_PLAN_PROMPTS } from "@/lib/ai/prompts/atcoder"
import {
  getRatingZone,
  getNextZone,
  getNextZoneTarget,
  ATCODER_RATING_ZONES,
  type RatingZone,
} from "@/lib/atcoder-rating"

// 再エクスポート
export { ATCODER_RATING_ZONES, type RatingZone } from "@/lib/atcoder-rating"

const AFTER_2026 = new Date("2026-01-01")

export interface UserData {
  currentRating: number
  currentZone: RatingZone
  targetRating: number
  targetZone: RatingZone
  acCount: number
  avgDifficulty: number
}

export interface RecommendationCriteria {
  focusAreas: string[]
  difficultyMin: number
  difficultyMax: number
  excludeSolved: boolean
  preferContest?: string
}

export interface PlanData {
  weeklyMilestones: Array<{
    order: number
    title: string
    description?: string
    goals: string[]
    problemCount: number
    focusArea: string
    difficultyMin: number
    difficultyMax: number
  }>
  recommendationCriteria: RecommendationCriteria
  studyAdvice: string
}

export interface PreviousPlan {
  weeklyMilestones: string
  studyAdvice: string
  reviewCount: number
}

/**
 * ユーザーデータを取得（2026年以降のACのみ）
 */
export async function getUserData(userId: string): Promise<UserData> {
  // ユーザーの問題データを取得
  const userProblems = await prisma.atCoderUserProblem.findMany({
    where: { userId },
    include: { problem: true },
  })

  // 2026年以降のACのみフィルタ
  const acProblems = userProblems.filter(
    (up) =>
      (up.status === "contest_ac" || up.status === "upsolved_ac") &&
      (up.lastAttempted ? new Date(up.lastAttempted) >= AFTER_2026 : false)
  )

  const difficulties = acProblems
    .map((up) => up.problem.difficulty)
    .filter((d): d is number => d !== null && d !== undefined)

  const currentRating =
    difficulties.length > 0
      ? Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
      : 0

  const avgDifficulty =
    difficulties.length > 0
      ? Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
      : 0

  const currentZone = getRatingZone(currentRating)
  const nextZone = getNextZone(currentZone) || "GRAY" // 赤色の場合はGRAYを目標に（更新不要）
  const targetRating = ATCODER_RATING_ZONES[nextZone].min

  return {
    currentRating,
    currentZone,
    targetRating,
    targetZone: nextZone,
    acCount: acProblems.length,
    avgDifficulty,
  }
}

/**
 * 最近のコードレビューを取得
 */
export async function getRecentReviews(userId: string, count: number = 5) {
  const reviews = await prisma.codeReview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: count,
  })

  return reviews.map((r) => ({
    rating: r.overallRating || "C",
    improvements: JSON.parse(r.improvements || "[]"),
    bugs: JSON.parse(r.bugs || "[]"),
  }))
}

/**
 * AIで学習プランを生成
 */
export async function generateLearningPlan(
  userId: string,
  newReviews: Array<{
    overallRating: string | null
    improvements: string | null
    bugs: string | null
  }>,
  previousPlan?: PreviousPlan,
  apiKey?: string
): Promise<PlanData> {
  // APIキーの確認
  const userApiKey = apiKey || (await getUserApiKey(userId))
  const defaultApiKey = getDefaultApiKey()
  const key = userApiKey || defaultApiKey

  if (!key) {
    throw new Error("z.ai API key not configured")
  }

  // ユーザーデータを取得
  const userData = await getUserData(userId)

  // 既に赤色なら更新不要
  if (userData.currentZone === "RED") {
    return {
      weeklyMilestones: [],
      recommendationCriteria: {
        focusAreas: [],
        difficultyMin: 0,
        difficultyMax: 9999,
        excludeSolved: true,
      },
      studyAdvice: "すでに最高ランク（赤色）に到達しています。引き続き実力を維持・向上させていきましょう。",
    }
  }

  // 新しいレビューを整形
  const newReviewsFormatted = newReviews.map(r => ({
    rating: r.overallRating || "C",
    improvements: JSON.parse(r.improvements || "[]"),
    bugs: JSON.parse(r.bugs || "[]"),
  }))

  // 既存のレビューを取得（新しいレビューの後ろに追加）
  const existingReviews = await getRecentReviews(userId, 5)

  // マージして最大10件
  const recentReviews = [...newReviewsFormatted, ...existingReviews].slice(0, 10)

  // 前回のプランからデータを取得
  let previousMilestones: any[] = []
  let previousAdvice = ""
  if (previousPlan) {
    try {
      previousMilestones = JSON.parse(previousPlan.weeklyMilestones || "[]")
      previousAdvice = previousPlan.studyAdvice || ""
    } catch {
      // パース失敗時は無視
    }
  }

  // コンテスト情報を取得（オプション）- APIルート経由でキャッシュを活用
  let upcomingContests: string | undefined = undefined
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/hub/atcoder/contests?limit=5&sites=atcoder.jp`, {
      // キャッシュを10分間有効に
      next: { revalidate: 600 },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.contests && data.contests.length > 0 && !data.mock) {
        // テキスト形式に変換
        const { formatContestsForAI } = await import("@/lib/clist")
        upcomingContests = formatContestsForAI(data.contests)
      }
    }
  } catch (error) {
    console.log("Could not fetch contest info, continuing without it")
  }

  // AIで学習プランを生成
  const prompt = LEARNING_PLAN_PROMPTS.generatePlan({
    ...userData,
    recentReviews,
    previousMilestones,
    previousAdvice,
    upcomingContests,
  })

  const response = await generateCompletion(
    key,
    [{ role: "user", content: prompt }],
    {
      maxTokens: 3000,
      temperature: 0.7,
      systemPrompt: LEARNING_PLAN_PROMPTS.system,
    }
  )

  // レスポンスをパース
  try {
    let jsonStr = response

    // マークダウンコードブロックを除去
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    } else {
      // コードブロックがない場合、余分なテキストを除去
      // 最初の{から最後の}までを抽出
      const firstBrace = response.indexOf('{')
      const lastBrace = response.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = response.substring(firstBrace, lastBrace + 1)
      }
    }

    const parsed = JSON.parse(jsonStr)
    return parsed
  } catch (error) {
    console.error("Failed to parse AI response for learning plan:", error)
    console.error("Response was:", response.slice(0, 1000))

    // パース失敗時は適切なデフォルトプランを返す
    return {
      weeklyMilestones: [
        {
          order: 1,
          title: "基礎固め",
          description: "現在のレートを固める",
          goals: ["問題を解く", "復習する", "解法を理解する"],
          problemCount: 10,
          focusArea: "全般",
          difficultyMin: Math.max(0, userData.avgDifficulty - 200),
          difficultyMax: userData.avgDifficulty + 200,
        },
      ],
      recommendationCriteria: {
        focusAreas: ["全般"],
        difficultyMin: Math.max(0, userData.avgDifficulty - 200),
        difficultyMax: userData.avgDifficulty + 200,
        excludeSolved: true,
      },
      studyAdvice: `現在のレート${userData.currentRating}から目標の${userData.targetZone}に向けて、まずは基礎を固めましょう。解けた問題は復習し、解けなかった問題は解説を読んで理解を深めてください。`,
    }
  }
}

/**
 * 学習プランを保存または更新
 */
export async function saveLearningPlan(
  userId: string,
  planData: PlanData
): Promise<{ planId: string; isNew: boolean }> {
  const userData = await getUserData(userId)

  // 既存のプランを取得
  const existingPlan = await prisma.learningPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  if (existingPlan) {
    // 更新
    await prisma.learningPlan.update({
      where: { id: existingPlan.id },
      data: {
        currentRating: userData.currentRating,
        currentZone: userData.currentZone,
        targetRating: userData.targetRating,
        targetZone: userData.targetZone,
        weeklyMilestones: JSON.stringify(planData.weeklyMilestones),
        recommendationCriteria: JSON.stringify(planData.recommendationCriteria),
        studyAdvice: planData.studyAdvice,
        lastUpdatedFromReview: new Date(),
        reviewCount: (existingPlan.reviewCount || 0) + 1,
      },
    })
    return { planId: existingPlan.id, isNew: false }
  } else {
    // 新規作成
    const plan = await prisma.learningPlan.create({
      data: {
        userId,
        currentRating: userData.currentRating,
        currentZone: userData.currentZone,
        targetRating: userData.targetRating,
        targetZone: userData.targetZone,
        weeklyMilestones: JSON.stringify(planData.weeklyMilestones),
        recommendationCriteria: JSON.stringify(planData.recommendationCriteria),
        studyAdvice: planData.studyAdvice,
        reviewCount: 1,
      },
    })
    return { planId: plan.id, isNew: true }
  }
}

/**
 * コードレビュー後に学習プランを自動更新
 */
export async function updateLearningPlanFromReviews(
  userId: string,
  newReviews: Array<{
    overallRating: string | null
    improvements: string | null
    bugs: string | null
  }>,
  previousPlan?: PreviousPlan
): Promise<void> {
  try {
    // プランを生成
    const planData = await generateLearningPlan(userId, newReviews, previousPlan)
    // 保存
    await saveLearningPlan(userId, planData)
  } catch (error) {
    console.error("Failed to update learning plan from reviews:", error)
    // エラーを投げないで静かに失敗（レビュー自体は成功しているべき）
  }
}
