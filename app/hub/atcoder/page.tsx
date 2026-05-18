import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AtCoderManager } from "@/components/hub/atcoder-manager"

export default async function AtCoderPage() {
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
  const problems = await prisma.atCoderUserProblem.findMany({
    where: { userId: session.user.id },
    orderBy: { lastAttempted: "desc" },
    take: 100
  })

  // 日付をISO文字列に変換
  const serializedProblems = problems.map(problem => ({
    ...problem,
    lastAttempted: problem.lastAttempted?.toISOString() || null,
    createdAt: problem.createdAt.toISOString()
  }))

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <Code2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                AtCoder 問題管理
              </h1>
              <p className="text-muted-foreground">
                競技プログラミングの学習進捗を管理・追跡
              </p>
            </div>
          </div>
        </div>

        <AtCoderManager />
      </div>
    </div>
  )
}
