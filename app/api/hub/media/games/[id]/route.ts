import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/hub/media/games/[id] - ゲーム更新
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const existingGame = await prisma.game.findUnique({
      where: { id }
    })

    if (!existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (existingGame.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, genre, platform, completed, rating, notes } = body

    // バリデーション
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // completedがtrueになったときはcompletedAtを設定
    let completedAt = undefined
    if (completed === true && !existingGame.completed) {
      completedAt = new Date()
    } else if (completed === false) {
      completedAt = null
    }

    const game = await prisma.game.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(genre !== undefined && { genre: genre.trim() || null }),
        ...(platform !== undefined && { platform: platform.trim() || null }),
        ...(completed !== undefined && { completed }),
        ...(completedAt !== undefined && { completedAt }),
        ...(rating !== undefined && { rating }),
        ...(notes !== undefined && { notes: notes.trim() || null })
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error("Error updating game:", error)
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 })
  }
}

// DELETE /api/hub/media/games/[id] - ゲーム削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const existingGame = await prisma.game.findUnique({
      where: { id }
    })

    if (!existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (existingGame.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.game.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Game deleted successfully" })
  } catch (error) {
    console.error("Error deleting game:", error)
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 })
  }
}
