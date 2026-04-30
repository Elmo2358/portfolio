import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/media/games - ゲーム一覧取得
export async function GET(req: NextRequest) {
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

    // クエリパラメータ
    const { searchParams } = new URL(req.url)
    const completed = searchParams.get("completed")

    const games = await prisma.game.findMany({
      where: {
        userId: user.id,
        ...(completed && completed !== "all" && { completed: completed === "true" })
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(games)
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}

// POST /api/hub/media/games - ゲーム追加
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { title, genre, platform, completed, rating, notes } = body

    // バリデーション
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const game = await prisma.game.create({
      data: {
        userId: user.id,
        title: title.trim(),
        genre: genre?.trim() || null,
        platform: platform?.trim() || null,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        rating: rating || null,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}
