import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/hub/media/stats - メディア統計取得
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

    // 全データを取得
    const [games, books] = await Promise.all([
      prisma.game.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      }),
      prisma.book.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      })
    ])

    // ゲーム統計
    const totalGames = games.length
    const completedGames = games.filter(g => g.completed).length
    const playingGames = games.filter(g => !g.completed).length
    const averageGameRating = games.filter(g => g.rating).reduce((sum, g) => sum + (g.rating || 0), 0) / games.filter(g => g.rating).length || 0

    // 本統計
    const totalBooks = books.length
    const completedBooks = books.filter(b => b.completed).length
    const readingBooks = books.filter(b => !b.completed).length
    const averageBookRating = books.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) / books.filter(b => b.rating).length || 0

    return NextResponse.json({
      games: {
        total: totalGames,
        completed: completedGames,
        playing: playingGames,
        averageRating: Math.round(averageGameRating * 10) / 10
      },
      books: {
        total: totalBooks,
        completed: completedBooks,
        reading: readingBooks,
        averageRating: Math.round(averageBookRating * 10) / 10
      },
      recentActivity: {
        games: games.slice(0, 3),
        books: books.slice(0, 3)
      }
    })
  } catch (error) {
    console.error("Error fetching media stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
