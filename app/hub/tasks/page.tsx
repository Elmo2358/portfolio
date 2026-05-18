import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TasksClient } from "@/components/hub/tasks-client"

export default async function TasksPage() {
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
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  })

  // 日付をISO文字列に変換（クライアントへ渡すため）
  const serializedTasks = tasks.map(task => ({
    ...task,
    dueDate: task.dueDate?.toISOString() || null,
    completedAt: task.completedAt?.toISOString() || null,
    createdAt: task.createdAt.toISOString()
  }))

  return (
    <div className="container py-8">
      <TasksClient initialTasks={serializedTasks} />
    </div>
  )
}
