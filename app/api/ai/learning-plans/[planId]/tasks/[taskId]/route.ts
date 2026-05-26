import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH: タスクのステータスを更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { status } = body

    if (!status || !["pending", "in_progress", "completed", "skipped"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      )
    }

    const { planId, taskId } = await params
    // タスクがユーザーのものか確認
    const task = await prisma.learningTask.findUnique({
      where: { id: taskId },
      include: { plan: true },
    })

    if (!task || task.userId !== session.user.id || task.planId !== planId) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      )
    }

    // タスクを更新
    const updatedTask = await prisma.learningTask.update({
      where: { id: taskId },
      data: { status },
    })

    // プランの進捗を再計算
    const allTasks = await prisma.learningTask.findMany({
      where: { planId },
    })

    const completedCount = allTasks.filter((t) => t.status === "completed").length
    const progress = allTasks.length > 0 ? (completedCount / allTasks.length) * 100 : 0

    await prisma.learningPlan.update({
      where: { id: planId },
      data: {
        progress,
        completedTasks: JSON.stringify(
          allTasks.filter((t) => t.status === "completed").map((t) => t.id)
        ),
      },
    })

    return NextResponse.json({
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      progress,
    })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

// DELETE: タスクを削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId, taskId } = await params
    // タスクがユーザーのものか確認
    const task = await prisma.learningTask.findUnique({
      where: { id: taskId },
    })

    if (!task || task.userId !== session.user.id || task.planId !== planId) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.learningTask.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
