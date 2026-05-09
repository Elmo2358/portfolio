import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getTaskLists,
  getTasks,
  insertTask,
  updateTask,
  deleteTask,
  taskToGoogleTask,
} from "@/lib/google-tasks"

// GET: Google Tasksのタスクリストと同期状態を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーのGoogle連携情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        googleTasksEnabled: true,
        googleTasksTasklistId: true,
        googleAccessToken: true,
        googleTokenExpiresAt: true,
      },
    })

    // Google連携が未設定の場合
    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google連携が必要です", setupRequired: true },
        { status: 400 }
      )
    }

    // アクセストークンの有効期限チェック
    if (user.googleTokenExpiresAt && user.googleTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Googleアクセストークンの有効期限が切れています。再連携してください。", setupRequired: true },
        { status: 400 }
      )
    }

    // タスクリストを取得
    const taskLists = await getTaskLists(user.googleAccessToken)

    return NextResponse.json({
      success: true,
      taskLists,
      syncEnabled: user?.googleTasksEnabled || false,
      selectedTasklistId: user?.googleTasksTasklistId,
    })
  } catch (error) {
    console.error("Error fetching Google Tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch Google Tasks" },
      { status: 500 }
    )
  }
}

// POST: Google Tasksとの同期を有効化/設定
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { enabled, tasklistId } = body

    // 同期設定を保存
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        googleTasksEnabled: enabled,
        googleTasksTasklistId: tasklistId,
      },
    })

    return NextResponse.json({
      success: true,
      message: enabled
        ? "Google Tasks同期を有効にしました"
        : "Google Tasks同期を無効にしました",
    })
  } catch (error) {
    console.error("Error setting up Google Tasks sync:", error)
    return NextResponse.json(
      { error: "Failed to setup Google Tasks sync" },
      { status: 500 }
    )
  }
}

// PUT: タスクをGoogle Tasksに同期
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーのGoogle連携情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        googleTasksEnabled: true,
        googleTasksTasklistId: true,
        googleAccessToken: true,
        googleTokenExpiresAt: true,
      },
    })

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google連携が必要です", setupRequired: true },
        { status: 400 }
      )
    }

    if (!user?.googleTasksEnabled || !user.googleTasksTasklistId) {
      return NextResponse.json(
        { error: "Google Tasks sync is not enabled" },
        { status: 400 }
      )
    }

    const accessToken = user.googleAccessToken
    const tasklistId = user.googleTasksTasklistId

    const body = await req.json()
    const { action, taskId, googleTaskId } = body

    switch (action) {
      case "create": {
        // 新規タスクをGoogle Tasksに追加
        const task = await prisma.task.findUnique({
          where: { id: taskId, userId: session.user.id },
        })

        if (!task) {
          return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        const googleTask = taskToGoogleTask(task)
        const created = await insertTask(accessToken, tasklistId, googleTask)

        // Google Task IDを保存
        await prisma.task.update({
          where: { id: taskId },
          data: { googleTaskId: created.id },
        })

        return NextResponse.json({
          success: true,
          googleTaskId: created.id,
        })
      }

      case "update": {
        // タスクを更新
        const task = await prisma.task.findUnique({
          where: { id: taskId, userId: session.user.id },
        })

        if (!task) {
          return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        const googleTask = taskToGoogleTask(task)
        const updated = await updateTask(
          accessToken,
          tasklistId,
          googleTaskId || task.googleTaskId || "",
          {
            ...googleTask,
            status: task.status === "completed" ? "completed" : "needsAction",
          }
        )

        return NextResponse.json({
          success: true,
          googleTaskId: updated.id,
        })
      }

      case "delete": {
        // タスクを削除
        if (googleTaskId) {
          await deleteTask(accessToken, tasklistId, googleTaskId)
        }

        return NextResponse.json({ success: true })
      }

      case "sync": {
        // Google Tasksからサイトに同期（双方向同期）
        const googleTasks = await getTasks(accessToken, tasklistId)

        let created = 0
        let updated = 0

        for (const gt of googleTasks) {
          // 既存のタスクを検索
          const existing = await prisma.task.findFirst({
            where: {
              userId: session.user.id,
              googleTaskId: gt.id,
            },
          })

          if (existing) {
            // 更新
            await prisma.task.update({
              where: { id: existing.id },
              data: {
                title: gt.title,
                description: gt.notes,
                dueDate: gt.due ? new Date(gt.due) : null,
                status: gt.status === "completed" ? "completed" : "in_progress",
                completedAt: gt.completed ? new Date(gt.completed) : null,
              },
            })
            updated++
          } else if (!gt.title.startsWith("[Portfolio Hub]")) {
            // 新規作成（既にサイトから作成されたタスクは除外）
            await prisma.task.create({
              data: {
                userId: session.user.id,
                title: gt.title,
                description: gt.notes,
                dueDate: gt.due ? new Date(gt.due) : null,
                status: gt.status === "completed" ? "completed" : "todo",
                completedAt: gt.completed ? new Date(gt.completed) : null,
                priority: "medium",
                googleTaskId: gt.id,
              },
            })
            created++
          }
        }

        return NextResponse.json({
          success: true,
          created,
          updated,
        })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error syncing with Google Tasks:", error)
    return NextResponse.json(
      { error: "Failed to sync with Google Tasks" },
      { status: 500 }
    )
  }
}
