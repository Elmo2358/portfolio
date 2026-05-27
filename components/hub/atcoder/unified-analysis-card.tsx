"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"

interface AnalysisStep {
  name: string
  status: "pending" | "running" | "completed" | "skipped" | "error"
  message?: string
  result?: any
}

interface AnalysisResult {
  success: boolean
  steps: AnalysisStep[]
  summary: {
    submissionsSynced: number
    apg4bUpdated: number
    reviewsGenerated: number
    planUpdated: boolean
  }
  error?: string
}

interface UnifiedAnalysisCardProps {
  onAnalysisComplete?: () => void
  syncStatus: {
    hasAtCoderId: boolean
    lastSync: string | null
    submissionCount: number
  }
}

const stepIcons: Record<string, JSX.Element> = {
  pending: <div className="h-4 w-4 rounded-full border-2 border-gray-300" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  skipped: <div className="h-4 w-4 rounded-full border-2 border-gray-400 bg-gray-100" />,
  error: <AlertCircle className="h-4 w-4 text-red-600" />,
}

const stepStatusColors: Record<string, string> = {
  pending: "text-gray-500",
  running: "text-blue-600",
  completed: "text-emerald-600",
  skipped: "text-gray-400",
  error: "text-red-600",
}

export function UnifiedAnalysisCard({ onAnalysisComplete, syncStatus }: UnifiedAnalysisCardProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const handleAnalyze = async () => {
    if (!syncStatus.hasAtCoderId) {
      setResult({
        success: false,
        steps: [],
        summary: { submissionsSynced: 0, apg4bUpdated: 0, reviewsGenerated: 0, planUpdated: false },
        error: "AtCoder IDが設定されていません。設定ページから設定してください。",
      })
      return
    }

    setAnalyzing(true)
    setResult(null)

    try {
      const res = await fetch("/api/hub/atcoder/analyze", {
        method: "POST",
      })

      const data: AnalysisResult = await res.json()
      setResult(data)

      if (data.success && onAnalysisComplete) {
        onAnalysisComplete()
      }
    } catch (error) {
      setResult({
        success: false,
        steps: [],
        summary: { submissionsSynced: 0, apg4bUpdated: 0, reviewsGenerated: 0, planUpdated: false },
        error: "分析に失敗しました",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index)
  }

  const formatSyncTime = (time: string | null) => {
    if (!time) return "未同期"
    const date = new Date(time)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "たった今"
    if (diffMins < 60) return `${diffMins}分前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`
    return `${Math.floor(diffMins / 1440)}日前`
  }

  return (
    <Card className="border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
              同期・分析
            </CardTitle>
            <CardDescription>
              AtCoderの提出履歴を同期し、AIで分析・学習プランを更新
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus.hasAtCoderId && (
              <Badge variant="outline" className="text-xs">
                {syncStatus.submissionCount}件の提出
              </Badge>
            )}
            <Badge variant={syncStatus.lastSync ? "default" : "secondary"} className="text-xs">
              {formatSyncTime(syncStatus.lastSync)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* エラー表示 */}
        {result && !result.success && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  {result.error || "分析に失敗しました"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 分析ボタン */}
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              同期・分析を実行
            </>
          )}
        </Button>

        {/* 進捗・結果表示 */}
        {result && result.steps.length > 0 && (
          <div className="space-y-3 mt-4">
            {/* サマリー */}
            {result.success && (
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <h3 className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">分析完了</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {result.summary.submissionsSynced > 0 && (
                    <div>
                      <span className="text-muted-foreground">提出履歴: </span>
                      <span className="font-medium">{result.summary.submissionsSynced}件</span>
                    </div>
                  )}
                  {result.summary.apg4bUpdated > 0 && (
                    <div>
                      <span className="text-muted-foreground">APG4b進捗: </span>
                      <span className="font-medium">{result.summary.apg4bUpdated}件更新</span>
                    </div>
                  )}
                  {result.summary.reviewsGenerated > 0 && (
                    <div>
                      <span className="text-muted-foreground">コードレビュー: </span>
                      <span className="font-medium">{result.summary.reviewsGenerated}件</span>
                    </div>
                  )}
                  {result.summary.planUpdated && (
                    <div>
                      <span className="text-muted-foreground">学習プラン: </span>
                      <span className="font-medium">更新済み</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 各ステップの詳細 */}
            <div className="space-y-2">
              {result.steps.map((step, index) => (
                <details
                  key={index}
                  open={expandedStep === index}
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open) {
                      toggleStep(index)
                    }
                  }}
                  className="group"
                >
                  <summary
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors list-none ${
                      step.status === "error" ? "border-red-200 bg-red-50 dark:bg-red-950" :
                      step.status === "completed" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950" :
                      "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {stepIcons[step.status]}
                      <span className={`font-medium ${stepStatusColors[step.status]}`}>
                        {step.name}
                      </span>
                      {step.status === "skipped" && (
                        <Badge variant="secondary" className="text-xs">スキップ</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {step.message && expandedStep !== index && (
                        <span className="text-xs text-muted-foreground">{step.message}</span>
                      )}
                      {expandedStep === index ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </summary>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {step.message && <p>{step.message}</p>}
                    {step.result && (
                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(step.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* 説明 */}
        {!result && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• AtCoderの提出履歴を取得してデータベースに保存</p>
            <p>• APG4bの進捗を自動更新</p>
            <p>• 新しいAC提出に対してAIコードレビューを実行</p>
            <p>• レビュー結果に基づいて学習プランを更新</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
