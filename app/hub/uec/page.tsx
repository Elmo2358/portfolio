import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import dynamic from "next/dynamic"
import { CardListSkeleton } from "@/components/loading/card-skeleton"

// UecPortalManagerを動的インポート
const UecPortalManager = dynamic(
  () => import("@/components/hub/uec-portal-manager").then(mod => ({ default: mod.UecPortalManager })),
  {
    loading: () => <CardListSkeleton count={4} />,
    ssr: false
  }
)

export default async function UecPortalPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                UECポータル
              </h1>
              <p className="text-muted-foreground">
                大学からのお知らせ・予定・時間割を確認
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">
              第6フェーズ：UECポータル連携
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-800 dark:text-emerald-200">
            <ul className="list-disc list-inside space-y-1">
              <li>お知らせの取得・表示（未読フィルター対応）</li>
              <li>今週の予定の確認</li>
              <li>時間割の表示</li>
              <li>手動同期ボタン（最新データを取得）</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              ※ 使用にはuec-portal-cliのインストールとログインが必要です。
            </p>
          </CardContent>
        </Card>

        <UecPortalManager />
      </div>
    </div>
  )
}
