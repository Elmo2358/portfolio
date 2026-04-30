import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/tasks - タスク一覧取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log("GET /api/hub/tasks - Session:", session?.user?.email)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    console.log("GET /api/hub/tasks - User found:", user)

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        email: session.user.email
      }, { status: 404 })
    }

    // クエリパラメータからフィルターを取得
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    // タスクを取得
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(status && status !== "all" && { status }),
        ...(priority && priority !== "all" && { priority })
      },
      orderBy: [
        { status: "asc" }, // 未完了→進行中→完了の順
        { dueDate: "asc" }, // 期限が近い順
        { createdAt: "desc" }
      ]
    })

    console.log("GET /api/hub/tasks - Tasks found:", tasks.length)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

// POST /api/hub/tasks - タスク作成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log("POST /api/hub/tasks - Session:", session)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    console.log("POST /api/hub/tasks - User found:", user)

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        email: session.user.email
      }, { status: 404 })
    }

    const body = await req.json()
    console.log("POST /api/hub/tasks - Request body:", body)

    const { title, description, status, priority, dueDate } = body

    // バリデーション
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!status || !["todo", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (!priority || !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
    }

    // タスクを作成
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    console.log("POST /api/hub/tasks - Task created:", task)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({
      error: "Failed to create task",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
