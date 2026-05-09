import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getDatabases,
  getDatabaseSchema,
  createPage,
  updatePage,
  queryDatabase,
  taskToNotionTask,
  notionPageToTask,
} from "@/lib/notion"

// GET: Notionデータベース一覧と同期状態を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = req.headers.get("x-notion-access-token")

    if (!accessToken) {
      return NextResponse.json(
        { error: "Notion access token is required", setupRequired: true },
        { status: 400 }
      )
    }

    // ユーザーの同期設定を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notionEnabled: true,
        notionDatabaseId: true,
        notionPropertyMapping: true,
      },
    })

    // データベース一覧を取得
    const databases = await getDatabases(accessToken)

    return NextResponse.json({
      success: true,
      databases,
      syncEnabled: user?.notionEnabled || false,
      selectedDatabaseId: user?.notionDatabaseId,
      propertyMapping: user?.notionPropertyMapping,
    })
  } catch (error) {
    console.error("Error fetching Notion data:", error)
    return NextResponse.json(
      { error: "Failed to fetch Notion data" },
      { status: 500 }
    )
  }
}

// POST: Notion同期を有効化/設定
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { enabled, databaseId, propertyMapping } = body

    // 同期設定を保存
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notionEnabled: enabled,
        notionDatabaseId: databaseId,
        notionPropertyMapping: propertyMapping
          ? JSON.stringify(propertyMapping)
          : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: enabled
        ? "Notion同期を有効にしました"
        : "Notion同期を無効にしました",
    })
  } catch (error) {
    console.error("Error setting up Notion sync:", error)
    return NextResponse.json(
      { error: "Failed to setup Notion sync" },
      { status: 500 }
    )
  }
}

// PUT: タスクをNotionに同期
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = req.headers.get("x-notion-access-token")

    if (!accessToken) {
      return NextResponse.json(
        { error: "Notion access token is required" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { action, taskId, notionPageId } = body

    // ユーザーの設定を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notionEnabled: true,
        notionDatabaseId: true,
        notionPropertyMapping: true,
      },
    })

    if (!user?.notionEnabled || !user.notionDatabaseId || !user.notionPropertyMapping) {
      return NextResponse.json(
        { error: "Notion sync is not enabled" },
        { status: 400 }
      )
    }

    const propertyMapping = JSON.parse(user.notionPropertyMapping)
    const databaseId = user.notionDatabaseId

    switch (action) {
      case "create": {
        // 新規タスクをNotionに追加
        const task = await prisma.task.findUnique({
          where: { id: taskId, userId: session.user.id },
        })

        if (!task) {
          return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        const notionTask = taskToNotionTask(task)
        const created = await createPage(accessToken, databaseId, notionTask, propertyMapping)

        // Notion Page IDを保存
        await prisma.task.update({
          where: { id: taskId },
          data: { notionPageId: created.id },
        })

        return NextResponse.json({
          success: true,
          notionPageId: created.id,
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

        const notionTask = taskToNotionTask(task)
        const updated = await updatePage(
          accessToken,
          notionPageId || task.notionPageId || "",
          notionTask,
          propertyMapping
        )

        return NextResponse.json({
          success: true,
          notionPageId: updated.id,
        })
      }

      case "sync": {
        // Notionからサイトに同期（双方向同期）
        const pages = await queryDatabase(accessToken, databaseId)

        let created = 0
        let updated = 0

        for (const page of pages) {
          // 既存のタスクを検索
          const existing = await prisma.task.findFirst({
            where: {
              userId: session.user.id,
              notionPageId: page.id,
            },
          })

          const taskData = notionPageToTask(page, propertyMapping)

          if (existing) {
            // 更新
            await prisma.task.update({
              where: { id: existing.id },
              data: {
                title: taskData.title,
                description: taskData.description,
                dueDate: taskData.dueDate,
                status: taskData.status,
              },
            })
            updated++
          } else if (!taskData.title.startsWith("[Portfolio Hub]")) {
            // 新規作成
            await prisma.task.create({
              data: {
                userId: session.user.id,
                title: taskData.title,
                description: taskData.description,
                dueDate: taskData.dueDate,
                status: taskData.status,
                priority: "medium",
                notionPageId: page.id,
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
    console.error("Error syncing with Notion:", error)
    return NextResponse.json(
      { error: "Failed to sync with Notion" },
      { status: 500 }
    )
  }
}
