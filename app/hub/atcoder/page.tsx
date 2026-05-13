import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"
import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

// AtCoderManagerを動的インポート
const AtCoderManager = dynamic(
  () => import("@/components/hub/atcoder-manager").then(mod => ({ default: mod.AtCoderManager })),
  {
    loading: () => <CardListSkeleton count={4} />,
    ssr: false
  }
)

export default async function AtCoderPage() {
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
