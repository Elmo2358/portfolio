import { AtCoderManager } from "@/components/hub/atcoder-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"

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
              MVP機能（第1フェーズ）
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-800 dark:text-emerald-200">
            <ul className="list-disc list-inside space-y-1">
              <li>問題の手動追加・編集・削除</li>
              <li>問題名・IDでの検索</li>
              <li>ステータス別フィルタリング</li>
              <li>メモ機能（解法や気づきの記録）</li>
              <li>統計ダッシュボード（AC数、挑戦率、ストリーク）</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              ※ 第2フェーズ以降で、AtCoder Problems APIによる自動同期、ヒートマップ、LLM学習アドバイスなどを追加予定
            </p>
          </CardContent>
        </Card>

        <AtCoderManager />
      </div>
    </div>
  )
}
