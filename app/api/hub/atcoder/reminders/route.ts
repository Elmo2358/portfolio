import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: コンテストのリマインダーを設定
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { contestId, event, resource, start, end, href, remind24h, remind1h } = body

    if (!contestId || !event || !start) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 既存のリマインダーを確認
    const existing = await prisma.contestReminder.findUnique({
      where: {
        userId_contestId: {
          userId: session.user.id,
          contestId,
        },
      },
    })

    if (existing) {
      // 既存の場合は更新
      const reminder = await prisma.contestReminder.update({
        where: {
          userId_contestId: {
            userId: session.user.id,
            contestId,
          },
        },
        data: {
          remind24h: remind24h !== undefined ? remind24h : existing.remind24h,
          remind1h: remind1h !== undefined ? remind1h : existing.remind1h,
        },
      })

      return NextResponse.json({
        success: true,
        reminder,
        message: "リマインダーを更新しました",
      })
    } else {
      // 新規作成
      const reminder = await prisma.contestReminder.create({
        data: {
          userId: session.user.id,
          contestId,
          event,
          resource,
          start,
          end,
          href,
          remind24h: remind24h !== undefined ? remind24h : true,
          remind1h: remind1h !== undefined ? remind1h : true,
        },
      })

      return NextResponse.json({
        success: true,
        reminder,
        message: "リマインダーを設定しました",
      })
    }
  } catch (error) {
    console.error("Error setting reminder:", error)
    return NextResponse.json(
      { error: "Failed to set reminder" },
      { status: 500 }
    )
  }
}

// GET: 設定済みのリマインダー一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reminders = await prisma.contestReminder.findMany({
      where: {
        userId: session.user.id,
        start: {
          gte: new Date().toISOString(),
        },
      },
      orderBy: {
        start: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
    })
  } catch (error) {
    console.error("Error fetching reminders:", error)
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    )
  }
}

// DELETE: リマインダーを削除
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contestId = searchParams.get("contestId")

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      )
    }

    await prisma.contestReminder.delete({
      where: {
        userId_contestId: {
          userId: session.user.id,
          contestId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "リマインダーを削除しました",
    })
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    )
  }
}
