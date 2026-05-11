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

        <Card className="mb-6 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">
              AI機能（第5フェーズ完了 ✅）
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-800 dark:text-emerald-200">
            <ul className="list-disc list-inside space-y-1">
              <li>AIヒント生成（問題のヒントを3段階で提供）</li>
              <li>AI Q&Aチャット（競技プログラミングについて質問応答）</li>
              <li>AI問題推薦（実力に合わせた問題を提案）</li>
              <li>AIコードレビュー（提出コードの分析と改善提案）</li>
              <li>AI学習プラン（目標から最適な学習計画を生成）</li>
              <li>問題編集ダイアログから直接AI機能を利用可能</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              ※ 使用にはz.ai APIキーが必要です。設定画面から入力してください。
            </p>
          </CardContent>
        </Card>

        <AtCoderManager />
      </div>
    </div>
  )
}
