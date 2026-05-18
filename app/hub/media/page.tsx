import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MediaManager } from "@/components/hub/media-manager"

export default async function MediaPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">ログインが必要です</p>
        </div>
      </div>
    )
  }

  // サーバーサイドで初期データを取得
  const [games, books, stats] = await Promise.all([
    prisma.game.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.book.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/hub/media/stats`, {
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ games: { total: 0, completed: 0, playing: 0, averageRating: 0 }, books: { total: 0, completed: 0, reading: 0, averageRating: 0 }, recentActivity: { games: [], books: [] } }))
  ])

  // 日付をISO文字列に変換
  const serializedGames = games.map(game => ({
    ...game,
    completedAt: game.completedAt?.toISOString() || null,
    createdAt: game.createdAt.toISOString()
  }))

  const serializedBooks = books.map(book => ({
    ...book,
    completedAt: book.completedAt?.toISOString() || null,
    createdAt: book.createdAt.toISOString()
  }))

  return (
    <div className="container py-8 animate-fadeIn">
      <MediaManager
        initialGames={serializedGames}
        initialBooks={serializedBooks}
        initialStats={stats}
      />
    </div>
  )
}
