import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { status, memo, type } = await req.json()

  try {
    let progress

    if (type === "chapter") {
      // 章の進捗を更新
      progress = await prisma.apg4bUserProgress.upsert({
        where: {
          userId_chapterId: {
            userId: session.user.id,
            chapterId: id,
          },
        },
        update: {
          status,
          memo,
          ...(status === "completed" ? { completedAt: new Date() } : {}),
          ...(status === "in_progress" ? { startedAt: new Date() } : {}),
        },
        create: {
          userId: session.user.id,
          chapterId: id,
          status,
          memo,
          ...(status === "in_progress" ? { startedAt: new Date() } : {}),
          ...(status === "completed" ? { completedAt: new Date() } : {}),
        },
        include: {
          chapter: true,
        },
      })
    } else {
      // レッスンの進捗を更新
      progress = await prisma.apg4bUserProgress.upsert({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId: id,
          },
        },
        update: {
          status,
          memo,
          ...(status === "completed" ? { completedAt: new Date() } : {}),
          ...(status === "in_progress" ? { startedAt: new Date() } : {}),
        },
        create: {
          userId: session.user.id,
          lessonId: id,
          status,
          memo,
          ...(status === "in_progress" ? { startedAt: new Date() } : {}),
          ...(status === "completed" ? { completedAt: new Date() } : {}),
        },
        include: {
          lesson: {
            include: {
              chapter: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error("APG4b progress update error:", error)
    return NextResponse.json(
      { error: "Failed to update progress", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE: 進捗を削除（リセット）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { type } = await req.json()

  try {
    if (type === "chapter") {
      await prisma.apg4bUserProgress.deleteMany({
        where: {
          userId: session.user.id,
          chapterId: id,
        },
      })
    } else {
      await prisma.apg4bUserProgress.deleteMany({
        where: {
          userId: session.user.id,
          lessonId: id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("APG4b progress delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete progress", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
