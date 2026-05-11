import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserApiKey, getDefaultApiKey, generateCompletion } from "@/lib/ai/anthropic"
import { LEARNING_PLAN_PROMPTS } from "@/lib/ai/prompts/atcoder"

// POST: 新しい学習プランを生成
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

    const body = await req.json()
    const { targetRating, targetDate, focusAreas } = body

    if (!targetDate) {
      return NextResponse.json(
        { error: "targetDate is required" },
        { status: 400 }
      )
    }

    // ユーザーデータを取得
    const userProblems = await prisma.atCoderUserProblem.findMany({
      where: { userId: session.user.id },
      include: { problem: true },
    })

    const acProblems = userProblems.filter(
      (up) => up.status === "contest_ac" || up.status === "upsolved_ac"
    )

    const difficulties = acProblems
      .map((up) => up.problem.difficulty)
      .filter((d): d is number => d !== null && d !== undefined)

    const avgDifficulty = difficulties.length > 0
      ? Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
      : undefined

    // 現在のレート（推定）
    const currentRating = avgDifficulty

    // ユーザーデータを構築
    const userData = {
      currentRating,
      acCount: acProblems.length,
      avgDifficulty,
    }

    // 目標データを構築
    const goals = {
      targetRating,
      targetDate,
      focusAreas,
    }

    // AIで学習プランを生成
    const prompt = LEARNING_PLAN_PROMPTS.generatePlan(userData, goals)

    const response = await generateCompletion(apiKey, [{ role: "user", content: prompt }], {
      maxTokens: 3000,
      temperature: 0.7,
      systemPrompt: LEARNING_PLAN_PROMPTS.system,
    })

    // レスポンスをパース
    let planData: {
      weeklyMilestones: Array<{
        week: number
        title: string
        goals: string[]
        problemCount: number
        focusArea: string
        difficultyMin: number
        difficultyMax: number
      }>
      recommendedProblems: Array<{ id: string; reason: string }>
      studyAdvice: string
    }

    try {
      const jsonMatch = response.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch {
      // パース失敗時のデフォルト値
      const weeksUntilGoal = Math.ceil(
        (new Date(targetDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
      )

      planData = {
        weeklyMilestones: Array.from({ length: Math.min(weeksUntilGoal, 8) }, (_, i) => ({
          week: i + 1,
          title: `第${i + 1}週`,
          goals: ["問題を解く", "復習する"],
          problemCount: 10,
          focusArea: "DP",
          difficultyMin: 800,
          difficultyMax: 1200,
        })),
        recommendedProblems: [],
        studyAdvice: response.slice(0, 500),
      }
    }

    // 学習プランを保存
    const plan = await prisma.learningPlan.create({
      data: {
        userId: session.user.id,
        targetRating,
        targetDate: new Date(targetDate),
        currentRating,
        weeklyMilestones: JSON.stringify(planData.weeklyMilestones),
        recommendedProblems: JSON.stringify(planData.recommendedProblems),
        studyAdvice: planData.studyAdvice,
      },
    })

    // タスクを生成
    const tasks = []
    for (const milestone of planData.weeklyMilestones) {
      const dueDate = new Date(plan.targetDate)
      dueDate.setDate(dueDate.getDate() - (planData.weeklyMilestones.length - milestone.week) * 7)

      for (const goal of milestone.goals) {
        tasks.push({
          planId: plan.id,
          userId: session.user.id,
          title: goal,
          description: `${milestone.title}: ${milestone.focusArea}`,
          taskType: "concept",
          dueDate,
          status: "pending",
        })
      }
    }

    if (tasks.length > 0) {
      await prisma.learningTask.createMany({
        data: tasks,
      })
    }

    return NextResponse.json({
      id: plan.id,
      targetRating: plan.targetRating,
      targetDate: plan.targetDate,
      currentRating: plan.currentRating,
      weeklyMilestones: planData.weeklyMilestones,
      recommendedProblems: planData.recommendedProblems,
      studyAdvice: plan.studyAdvice,
      progress: 0,
      taskCount: tasks.length,
    })
  } catch (error) {
    console.error("Error generating learning plan:", error)
    return NextResponse.json(
      { error: "Failed to generate learning plan" },
      { status: 500 }
    )
  }
}

// GET: ユーザーの学習プラン一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plans = await prisma.learningPlan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          orderBy: { dueDate: "asc" },
          take: 10,
        },
      },
    })

    return NextResponse.json({
      plans: plans.map((plan) => ({
        id: plan.id,
        targetRating: plan.targetRating,
        targetDate: plan.targetDate,
        currentRating: plan.currentRating,
        progress: plan.progress,
        studyAdvice: plan.studyAdvice,
        weeklyMilestones: JSON.parse(plan.weeklyMilestones || "[]"),
        recommendedProblems: JSON.parse(plan.recommendedProblems || "[]"),
        taskCount: plan.tasks.length,
        completedTaskCount: plan.tasks.filter((t) => t.status === "completed").length,
        createdAt: plan.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching learning plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch learning plans" },
      { status: 500 }
    )
  }
}
