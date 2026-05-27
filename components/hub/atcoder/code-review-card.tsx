"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Code2, Loader2, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react"

interface BulkReviewResponse {
  reviews: Array<{
    id: string
    submissionId: string
    problemId: string
    problemTitle: string
    overallRating: string
    summary: string
    strengths: string[]
    improvements: string[]
    complexityScore: number
    bugs: string[]
  }>
  count: number
  message: string
}

interface CodeReviewData {
  id: string
  submissionId: string
  problemId: string
  problemTitle: string
  overallRating: string
  summary: string
  createdAt: string
}

interface CodeReviewCardProps {
  onReviewGenerated?: () => void
  className?: string
}

const ratingColors: Record<string, string> = {
  S: "bg-yellow-500 text-white",
  A: "bg-emerald-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-orange-500 text-white",
  D: "bg-red-500 text-white",
}

const ratingLabels: Record<string, string> = {
  S: "S - 模範的な解答",
  A: "A - 優れた解答",
  B: "B - 良い解答",
  C: "C - 改善が必要",
  D: "D - 問題あり",
}

export function CodeReviewCard({ onReviewGenerated, className }: CodeReviewCardProps) {
  const [recentReviews, setRecentReviews] = useState<CodeReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedReview, setSelectedReview] = useState<CodeReviewData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkReviewResponse | null>(null)

  useEffect(() => {
    fetchRecentReviews()
  }, [])

  const fetchRecentReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/hub/atcoder/code-review?limit=3")

      if (res.ok) {
        const data = await res.json()
        setRecentReviews(data.reviews || [])
      }
    } catch (err) {
      console.error("Error fetching reviews:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateBulkReview = async () => {
    setGenerating(true)
    setError(null)
    setCompletedCount(0)
    setTotalCount(10)

    try {
      const res = await fetch("/api/hub/atcoder/code-review", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.setupRequired) {
          setError("z.ai APIキーが必要です。設定画面から入力してください。")
        } else {
          setError(data.error || "レビューの生成に失敗しました")
        }
        return
      }

      const data: BulkReviewResponse = await res.json()
      setBulkResult(data)
      setCompletedCount(data.count)
      setTotalCount(data.count)

      // レビュー一覧を更新
      await fetchRecentReviews()

      if (onReviewGenerated) {
        onReviewGenerated()
      }
    } catch (err) {
      console.error("Error generating bulk review:", err)
      setError("レビューの生成に失敗しました")
    } finally {
      setGenerating(false)
    }
  }

  const getProblemUrl = (problemId: string) => {
    const parts = problemId.split("_")
    if (parts.length >= 2) {
      return `https://atcoder.jp/contests/${parts[0]}/tasks/${problemId}`
    }
    return "#"
  }

  return (
    <>
      <Card className={`border-2 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 ${className || ""}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-600" />
                AI コードレビュー
              </CardTitle>
              <CardDescription>
                直近10件のACコードを一括レビューして学習プランを更新
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-600 mb-4">
              <CardContent className="py-3 text-center text-sm text-yellow-800 dark:text-yellow-200">
                {error}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {/* 説明 */}
            <div className="text-sm text-muted-foreground">
              <p>クリックすると、直近10件のACコードをAIがレビューします。</p>
              <p>レビュー結果は学習プランの自動更新に使用されます。</p>
            </div>

            {/* 一括レビューボタン */}
            <Button
              onClick={generateBulkReview}
              disabled={generating}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  レビュー中... ({completedCount}/{totalCount})
                </>
              ) : (
                <>
                  <Code2 className="h-4 w-4 mr-2" />
                  直近10件のコードをレビュー
                </>
              )}
            </Button>

            {/* 完了メッセージ */}
            {bulkResult && !generating && (
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                      {bulkResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 最近のレビュー */}
            {recentReviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">最近のレビュー</h3>
                <div className="space-y-2">
                  {recentReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-pointer hover:border-orange-300"
                      onClick={() => {
                        setSelectedReview(review)
                        setDialogOpen(true)
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${ratingColors[review.overallRating] || "bg-gray-500"}`}>
                            {review.overallRating || "C"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {review.problemId}
                          </span>
                        </div>
                        <p className="text-sm truncate">{review.summary}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* レビュー詳細ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedReview && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>コードレビュー結果</DialogTitle>
                    <DialogDescription>
                      {selectedReview.problemTitle || selectedReview.problemId}
                    </DialogDescription>
                  </div>
                  <Badge className={ratingColors[selectedReview.overallRating] || "bg-gray-500"}>
                    {ratingLabels[selectedReview.overallRating] || selectedReview.overallRating}
                  </Badge>
                </div>
              </DialogHeader>

              <CodeReviewDialogContent review={selectedReview} />

              <div className="flex justify-end pt-4">
                <a
                  href={getProblemUrl(selectedReview.problemId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    問題ページを開く
                  </Button>
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// レビュー詳細内容コンポーネント
interface CodeReviewDialogContentProps {
  review: CodeReviewData
}

function CodeReviewDialogContent({ review }: CodeReviewDialogContentProps) {
  const [fullReview, setFullReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviewDetail()
  }, [review.id])

  const fetchReviewDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/hub/atcoder/code-review?submissionId=${review.submissionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.reviews && data.reviews.length > 0) {
          setFullReview(data.reviews[0])
        }
      }
    } catch (err) {
      console.error("Error fetching review detail:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const displayReview = fullReview || review

  return (
    <div className="space-y-6">
      {/* 要約 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">要約</h3>
        <p className="text-sm text-muted-foreground">{displayReview.summary}</p>
      </div>

      {/* 複雑度スコア */}
      {displayReview.complexityScore && (
        <div>
          <h3 className="text-lg font-semibold mb-2">複雑度スコア</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full"
                style={{ width: `${displayReview.complexityScore * 10}%` }}
              />
            </div>
            <span className="text-sm font-medium">{displayReview.complexityScore}/10</span>
          </div>
        </div>
      )}

      {/* 良い点 */}
      {displayReview.strengths && displayReview.strengths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-emerald-600">良い点</h3>
          <ul className="list-disc list-inside space-y-1">
            {displayReview.strengths.map((item: string, i: number) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 改善点 */}
      {displayReview.improvements && displayReview.improvements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-blue-600">改善案</h3>
          <ul className="list-disc list-inside space-y-1">
            {displayReview.improvements.map((item: string, i: number) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 潜在的なバグ */}
      {displayReview.bugs && displayReview.bugs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">潜在的な問題</h3>
          <ul className="list-disc list-inside space-y-1">
            {displayReview.bugs.map((item: string, i: number) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 提出コード */}
      {displayReview.sourceCode && (
        <div>
          <h3 className="text-lg font-semibold mb-2">提出コード</h3>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs whitespace-pre-wrap">{displayReview.sourceCode}</pre>
          </div>
          {displayReview.language && (
            <p className="text-xs text-muted-foreground mt-1">
              言語: {displayReview.language}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
