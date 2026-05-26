import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: プランのタスク一覧を取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await params
    // プランがユーザーのものか確認
    const plan = await prisma.learningPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan not found or access denied" },
        { status: 404 }
      )
    }

    const tasks = await prisma.learningTask.findMany({
      where: {
        planId,
      },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json({
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        dueDate: task.dueDate,
        status: task.status,
        problemId: task.problemId,
        resources: task.resources ? JSON.parse(task.resources) : [],
      })),
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

// POST: 新しいタスクを追加
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await params
    // プランがユーザーのものか確認
    const plan = await prisma.learningPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan not found or access denied" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, description, taskType, dueDate, problemId } = body

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      )
    }

    const task = await prisma.learningTask.create({
      data: {
        planId,
        userId: session.user.id,
        title,
        description,
        taskType: taskType || "concept",
        dueDate: dueDate ? new Date(dueDate) : null,
        problemId,
      },
    })

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      dueDate: task.dueDate,
      status: task.status,
      problemId: task.problemId,
    })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
