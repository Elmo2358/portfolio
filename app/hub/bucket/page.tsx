import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BucketClient } from "@/components/hub/bucket-client"

export default async function BucketPage() {
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
  const [items, stats] = await Promise.all([
    prisma.bucketListItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/hub/bucket/stats`, {
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ total: 0, completed: 0, inProgress: 0, planning: 0, categoryCounts: {}, completionRate: 0, priorityCounts: {}, recentCompleted: [] }))
  ])

  // 日付をISO文字列に変換
  const serializedItems = items.map(item => ({
    ...item,
    targetDate: item.targetDate?.toISOString() || null,
    completedAt: item.completedAt?.toISOString() || null,
    createdAt: item.createdAt.toISOString()
  }))

  return (
    <div className="container py-8 animate-fadeIn">
      <BucketClient initialItems={serializedItems} initialStats={stats} />
    </div>
  )
}
