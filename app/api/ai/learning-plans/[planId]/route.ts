import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      targetRating: plan.targetRating,
      targetDate: plan.targetDate,
      currentRating: plan.currentRating,
      progress: plan.progress,
      studyAdvice: plan.studyAdvice,
      weeklyMilestones: JSON.parse(plan.weeklyMilestones || "[]"),
      recommendedProblems: JSON.parse(plan.recommendedProblems || "[]"),
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
