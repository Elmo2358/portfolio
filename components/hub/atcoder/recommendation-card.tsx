"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, RefreshCw, Plus, ExternalLink, Loader2, Play, ArrowRight } from "lucide-react"

interface Recommendation {
  id: string
  title: string
  difficulty?: number
  reason: string
}

interface RecommendationsResponse {
  type: string
  recommendations: Recommendation[]
}

interface RecommendationCardProps {
  onAddProblem?: (problemId: string) => void
  className?: string
}

const typeLabels: Record<string, string> = {
  review: "復習",
  next: "次のレベル",
}

const typeDescriptions: Record<string, string> = {
  review: "前回のレビューで評価が低かった問題を再挑戦",
  next: "学習プランに基づいた次のレベルを目指す問題",
}

export function RecommendationCard({ onAddProblem, className }: RecommendationCardProps) {
  const [activeType, setActiveType] = useState("next")
  const [data, setData] = useState<RecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedProblems, setAddedProblems] = useState<Set<string>>(new Set())
  const [isBeginner, setIsBeginner] = useState(false)

  // 推薦を取得
  const fetchRecommendations = async (type: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/hub/atcoder/recommendations?type=${type}`)

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "推薦の取得に失敗しました")
        return
      }

      const responseData: RecommendationsResponse = await res.json()
      setData(responseData)

      // 初回ユーザー判定（入門問題かどうか）
      const hasBeginnerProblem = responseData.recommendations.some(
        r => r.reason.includes("AtCoderを始めるなら") || r.reason.includes("入門問題")
      )
      setIsBeginner(hasBeginnerProblem)
    } catch (err) {
      console.error("Error fetching recommendations:", err)
      setError("推薦の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード
  useEffect(() => {
    fetchRecommendations(activeType)
  }, [])

  // タブ変更時
  const handleTypeChange = (type: string) => {
    setActiveType(type)
    fetchRecommendations(type)
  }

  // 問題を追加
  const handleAddProblem = async (problemId: string) => {
    try {
      const res = await fetch("/api/hub/atcoder/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          title: data?.recommendations.find((r) => r.id === problemId)?.title || "",
          contestId: problemId.split("_")[0],
          url: `https://atcoder.jp/contests/${problemId.split("_")[0]}/tasks/${problemId}`,
        }),
      })

      if (res.ok) {
        setAddedProblems((prev) => new Set(prev).add(problemId))
        if (onAddProblem) {
          onAddProblem(problemId)
        }
      } else {
        alert("問題の追加に失敗しました")
      }
    } catch (err) {
      console.error("Error adding problem:", err)
      alert("問題の追加に失敗しました")
    }
  }

  // 問題URLを生成
  const getProblemUrl = (problemId: string) => {
    const parts = problemId.split("_")
    return `https://atcoder.jp/contests/${parts[0]}/tasks/${problemId}`
  }

  return (
    <Card className={`border-2 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950 ${className || ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI 問題推薦
            </CardTitle>
            <CardDescription>
              あなたの実力に合わせた問題をAIが推薦
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecommendations(activeType)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isBeginner && (
          <Card className="border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-600 mb-4">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-8 w-8 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                    AtCoderに復帰しましょう！
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    久しぶりのAtCoderです。まずは入門問題から始めて感覚を取り戻しましょう。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeType} onValueChange={handleTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="next">次のレベル</TabsTrigger>
            <TabsTrigger value="review">復習</TabsTrigger>
          </TabsList>

          <TabsContent value={activeType} className="mt-4">
            {error && (
              <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-600 mb-4">
                <CardContent className="py-4 text-center text-sm text-yellow-800 dark:text-yellow-200">
                  {error}
                </CardContent>
              </Card>
            )}

            {!error && !isBeginner && (
              <div className="text-sm text-muted-foreground mb-4">
                {typeDescriptions[activeType] || ""}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-muted-foreground">推薦問題を取得中...</span>
              </div>
            )}

            {!loading && !error && data && data.recommendations.length === 0 && (
              <Card className="border-2 border-gray-300 bg-gray-50 dark:bg-gray-950 dark:border-gray-700">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {activeType === "review"
                    ? "復習対象の問題がありません。まずはコードレビューを行いましょう。"
                    : "推薦する問題が見つかりませんでした。学習プランを作成しましょう。"}
                </CardContent>
              </Card>
            )}

            {!loading && !error && data && data.recommendations.length > 0 && (
              <div className="space-y-3">
                {/* 推薦問題一覧 */}
                {data.recommendations.map((rec, index) => {
                  const isFirstBeginnerProblem = isBeginner && index === 0

                  return (
                    <Card
                      key={rec.id}
                      className={
                        isFirstBeginnerProblem
                          ? "border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-600"
                          : "border border-purple-200 dark:border-purple-900 bg-white dark:bg-gray-900"
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {isFirstBeginnerProblem && (
                                <Badge className="bg-emerald-600 text-white">
                                  ウォームアップ
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">{rec.id}</span>
                              {rec.difficulty !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  difficulty: {rec.difficulty}
                                </Badge>
                              )}
                            </div>
                            <h4 className={`font-semibold mb-2 ${isFirstBeginnerProblem ? "text-emerald-900 dark:text-emerald-100" : ""}`}>
                              {rec.title}
                            </h4>
                            <p className={`text-sm ${isFirstBeginnerProblem ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                              {rec.reason}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={getProblemUrl(rec.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="問題ページを開く"
                            >
                              <Button
                                variant={isFirstBeginnerProblem ? "default" : "outline"}
                                size="sm"
                                className={isFirstBeginnerProblem ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              variant={isFirstBeginnerProblem ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAddProblem(rec.id)}
                              disabled={addedProblems.has(rec.id)}
                              className={isFirstBeginnerProblem ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                              {addedProblems.has(rec.id) ? (
                                <span className="text-xs">追加済み</span>
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
