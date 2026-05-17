import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ATCODER_RATING_ZONES } from "@/lib/atcoder-rating"

// GET: プラン詳細を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plan = await prisma.learningPlan.findUnique({
      where: { id: params.planId },
      include: {
        tasks: {
          orderBy: { dueDate: "asc" },
        },
      },
    })

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan not found or access denied" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: plan.id,
      currentRating: plan.currentRating,
      currentZone: plan.currentZone,
      targetRating: plan.targetRating,
      targetZone: plan.targetZone,
      currentZoneName: plan.currentZone
        ? ATCODER_RATING_ZONES[plan.currentZone as keyof typeof ATCODER_RATING_ZONES]?.name
        : undefined,
      targetZoneName: plan.targetZone
        ? ATCODER_RATING_ZONES[plan.targetZone as keyof typeof ATCODER_RATING_ZONES]?.name
        : undefined,
      progress: plan.progress,
      studyAdvice: plan.studyAdvice,
      weeklyMilestones: JSON.parse(plan.weeklyMilestones || "[]"),
      recommendationCriteria: JSON.parse(plan.recommendationCriteria || "{}"),
      completedTasks: JSON.parse(plan.completedTasks || "[]"),
      tasks: plan.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        dueDate: task.dueDate,
        status: task.status,
        problemId: task.problemId,
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching learning plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch learning plan" },
      { status: 500 }
    )
  }
}

// DELETE: プランを削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plan = await prisma.learningPlan.findUnique({
      where: { id: params.planId },
    })

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.learningPlan.delete({
      where: { id: params.planId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting learning plan:", error)
    return NextResponse.json(
      { error: "Failed to delete learning plan" },
      { status: 500 }
    )
  }
}
