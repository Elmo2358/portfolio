import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, DollarSign, Briefcase, Gamepad2, Sparkles, Code2 } from "lucide-react"

const apps = [
  {
    id: 1,
    title: "タスク管理",
    description: "日々のタスクを管理するアプリケーション",
    icon: CheckCircle2,
    path: "/hub/tasks",
    color: "bg-emerald-600 dark:bg-emerald-500",
    status: "available"
  },
  {
    id: 2,
    title: "家計簿",
    description: "収入と支出を管理するアプリケーション",
    icon: DollarSign,
    path: "/hub/finance",
    color: "bg-emerald-600 dark:bg-emerald-500",
    status: "available"
  },
  {
    id: 3,
    title: "就活管理",
    description: "就職活動の情報を管理するアプリケーション",
    icon: Briefcase,
    path: "/hub/jobhunt",
    color: "bg-emerald-600 dark:bg-emerald-500",
    status: "available"
  },
  {
    id: 4,
    title: "メディア管理",
    description: "ゲームと読書の履歴を管理するアプリケーション",
    icon: Gamepad2,
    path: "/hub/media",
    color: "bg-emerald-600 dark:bg-emerald-500",
    status: "available"
  },
  {
    id: 5,
    title: "やりたいことリスト",
    description: "旅行ややりたいことを計画するアプリケーション",
    icon: Sparkles,
    path: "/hub/bucket",
    color: "bg-emerald-600 dark:bg-emerald-500",
    status: "available"
  },
  {
    id: 6,
    title: "AtCoder問題管理",
    description: "競技プログラミングの学習進捗を管理するアプリケーション",
    icon: Code2,
    path: "/hub/atcoder",
    color: "bg-emerald-600 dark:bg-emerald-500",
    status: "available"
  }
]

export default function HubPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            アプリケーション一覧
          </h2>
          <p className="text-lg text-emerald-800 dark:text-emerald-200">Personal Applications</p>
          <p className="mt-4 text-sm text-emerald-800 dark:text-emerald-200">
            ※ 各アプリケーションは現在開発中です
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-200">
          {apps.map((app) => (
            <Card
              key={app.id}
              className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900 animate-slideUp"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${app.color} text-white`}>
                    <app.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-emerald-700 dark:text-emerald-300">{app.title}</CardTitle>
                    <CardDescription className="text-sm text-emerald-600 dark:text-emerald-400">
                      {app.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {app.status === "available" ? (
                  app.id === 2 ? (
                    // 家計簿アプリのみ2つのボタン
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                        asChild
                      >
                        <Link href="/hub/finance?type=income">
                          収入
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                        asChild
                      >
                        <Link href="/hub/finance?type=expense">
                          支出
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                      asChild
                    >
                      <Link href={app.path}>
                        開く
                      </Link>
                    </Button>
                  )
                ) : (
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500" disabled>
                    準備中
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center animate-fadeIn">
          <Card className="inline-block border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-300">
                今後の予定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                すべてのアプリケーションがご利用いただけます！<br />
                タスク管理、家計簿、就活管理、メディア管理、やりたいことリスト、AtCoder問題管理をぜひご活用ください。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
