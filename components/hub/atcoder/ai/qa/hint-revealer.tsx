"use client"

import { useState } from "react"
import { Lightbulb, ChevronDown, ChevronRight, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface HintLevel {
  level: number
  title: string
  hint: string | null
  loading: boolean
  revealed: boolean
}

interface HintRevealerProps {
  problemId: string
  problemTitle: string
  className?: string
}

export function HintRevealer({ problemId, problemTitle, className = "" }: HintRevealerProps) {
  const [hints, setHints] = useState<HintLevel[]>([
    { level: 1, title: "ヒント 1（概要）", hint: null, loading: false, revealed: false },
    { level: 2, title: "ヒント 2（詳細）", hint: null, loading: false, revealed: false },
    { level: 3, title: "ヒント 3（実装）", hint: null, loading: false, revealed: false },
  ])
  const [error, setError] = useState<string | null>(null)

  const fetchHint = async (level: number) => {
    setHints((prev) =>
      prev.map((h) =>
        h.level === level ? { ...h, loading: true } : h
      )
    )
    setError(null)

    try {
      const response = await fetch(`/api/ai/hints/${problemId}?level=${level}`)

      if (!response.ok) {
        const data = await response.json()
        if (data.setupRequired) {
          setError("Claude APIキーが設定されていません。設定画面からAPIキーを入力してください。")
          toast.error("APIキーが必要です")
        } else {
          throw new Error(data.error || "Failed to fetch hint")
        }
        return
      }

      const data = await response.json()
      setHints((prev) =>
        prev.map((h) =>
          h.level === level
            ? { ...h, hint: data.hint, loading: false, revealed: true }
            : h
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch hint")
      toast.error("ヒントの取得に失敗しました")
    } finally {
      setHints((prev) =>
        prev.map((h) =>
          h.level === level ? { ...h, loading: false } : h
        )
      )
    }
  }

  const refreshHint = async (level: number) => {
    // キャッシュを削除して再取得
    try {
      await fetch(`/api/ai/hints/${problemId}?level=${level}`, { method: "DELETE" })
      setHints((prev) =>
        prev.map((h) =>
          h.level === level
            ? { ...h, hint: null, revealed: false }
            : h
        )
      )
    } catch (err) {
      toast.error("キャッシュの削除に失敗しました")
    }
  }

  const toggleHint = (level: number) => {
    const hint = hints.find((h) => h.level === level)
    if (!hint) return

    if (!hint.revealed && !hint.hint) {
      fetchHint(level)
    } else {
      setHints((prev) =>
        prev.map((h) =>
          h.level === level ? { ...h, revealed: !h.revealed } : h
        )
      )
    }
  }

  const problemUrl = `https://atcoder.jp/contests/${problemId.split("_")[0]}/tasks/${problemId}`

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
          AI ヒント
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {hints.map((hint) => (
          <div key={hint.level} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleHint(hint.level)}
              disabled={hint.loading}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-sm">{hint.title}</span>
              <div className="flex items-center gap-2">
                {hint.hint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      refreshHint(hint.level)
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                {hint.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                ) : hint.revealed ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>

            {hint.revealed && hint.hint && (
              <div className="p-3 bg-white dark:bg-gray-900 border-t">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {hint.hint}
                </p>
              </div>
            )}

            {hint.loading && (
              <div className="p-3 bg-white dark:bg-gray-900 border-t flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>ヒントを生成中...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        ヒントは段階的に開示されます。最初は概要だけで、徐々に詳細なヒントが表示されます。
      </p>
    </Card>
  )
}
