import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey } from "@/lib/ai/anthropic"
import {
  generateLearningPlan,
  saveLearningPlan,
  getUserData,
  ATCODER_RATING_ZONES,
} from "@/lib/ai/learning-plan-generator"

// POST: 学習プランを手動再生成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // z.ai APIキーの確認
    const userApiKey = await getUserApiKey(session.user.id)
    const defaultApiKey = getDefaultApiKey()
    const apiKey = userApiKey || defaultApiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: "z.ai API key not configured", setupRequired: true },
        { status: 400 }
      )
    }

    // プランを生成（手動再生成時はレビューなし）
    const planData = await generateLearningPlan(session.user.id, [], undefined, apiKey)

    // 保存
    const { planId, isNew } = await saveLearningPlan(session.user.id, planData)

    // ユーザーデータを再取得
    const userData = await getUserData(session.user.id)

    return NextResponse.json({
      id: planId,
      currentRating: userData.currentRating,
      currentZone: userData.currentZone,
      targetRating: userData.targetRating,
      targetZone: userData.targetZone,
      currentZoneName: ATCODER_RATING_ZONES[userData.currentZone].name,
      targetZoneName: ATCODER_RATING_ZONES[userData.targetZone].name,
      weeklyMilestones: planData.weeklyMilestones,
      recommendationCriteria: planData.recommendationCriteria,
      studyAdvice: planData.studyAdvice,
      progress: 0,
      isNew,
    })
  } catch (error) {
    console.error("Error generating learning plan:", error)
    return NextResponse.json(
      { error: "Failed to generate learning plan" },
      { status: 500 }
    )
  }
}

// GET: ユーザーの現在の学習プランを取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 最新のプランを取得
    const plan = await prisma.learningPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          orderBy: { dueDate: "asc" },
          take: 10,
        },
      },
    })

    if (!plan) {
      return NextResponse.json({
        plan: null,
        message: "学習プランがありません。コードレビューを行うと自動的に作成されます。",
      })
    }

    // ゾーン名を取得
    const currentZoneName = plan.currentZone
      ? ATCODER_RATING_ZONES[plan.currentZone as keyof typeof ATCODER_RATING_ZONES]?.name
      : "不明"
    const targetZoneName = plan.targetZone
      ? ATCODER_RATING_ZONES[plan.targetZone as keyof typeof ATCODER_RATING_ZONES]?.name
      : "不明"

    return NextResponse.json({
      plan: {
        id: plan.id,
        currentRating: plan.currentRating,
        currentZone: plan.currentZone,
        targetRating: plan.targetRating,
        targetZone: plan.targetZone,
        currentZoneName,
        targetZoneName,
        progress: plan.progress,
        studyAdvice: plan.studyAdvice,
        weeklyMilestones: JSON.parse(plan.weeklyMilestones || "[]"),
        recommendationCriteria: JSON.parse(plan.recommendationCriteria || "{}"),
        lastUpdatedFromReview: plan.lastUpdatedFromReview,
        reviewCount: plan.reviewCount,
        taskCount: plan.tasks.length,
        completedTaskCount: plan.tasks.filter((t) => t.status === "completed").length,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching learning plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch learning plan" },
      { status: 500 }
    )
  }
}
