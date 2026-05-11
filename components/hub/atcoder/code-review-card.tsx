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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Code2, Loader2, Sparkles, ExternalLink } from "lucide-react"

interface Submission {
  id: string
  problemId: string
  result: string
  language: string
  epochSecond: number
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
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("")
  const [reviews, setReviews] = useState<CodeReviewData[]>([])
  const [loading, setLoading] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedReview, setSelectedReview] = useState<CodeReviewData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // 提出一覧を取得
  useEffect(() => {
    fetchSubmissions()
  }, [])

  // レビュー一覧を取得
  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true)
    setError(null)

    try {
      // 統計APIから提出履歴を取得
      const res = await fetch("/api/hub/atcoder/stats")

      if (!res.ok) {
        throw new Error("Failed to fetch submissions")
      }

      const data = await res.json()

      // 最近のAC提出を取得
      const recentAc = await prismaGetRecentSubmissions()

      setSubmissions(recentAc)
    } catch (err) {
      console.error("Error fetching submissions:", err)
      setError("提出の取得に失敗しました")
    } finally {
      setSubmissionsLoading(false)
    }
  }

  // Prismaから最近の提出を取得するヘルパー関数
  // ※実際にはAPIを通して取得する必要がありますが、簡略化のため
  const prismaGetRecentSubmissions = async (): Promise<Submission[]> => {
    // ここではAPIを呼び出して最近の提出を取得
    try {
      const res = await fetch("/api/hub/atcoder/submissions?limit=20&result=AC")
      if (res.ok) {
        const data = await res.json()
        return data.submissions || []
      }
    } catch {
      // エラー時は空配列
    }
    return []
  }

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/hub/atcoder/code-review?limit=5")

      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error("Error fetching reviews:", err)
    }
  }

  const generateReview = async () => {
    if (!selectedSubmissionId) return

    setGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/hub/atcoder/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: selectedSubmissionId }),
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

      const reviewData = await res.json()

      // レビュー一覧を更新
      await fetchReviews()

      // レビュー詳細を設定してダイアログを開く
      setSelectedReview({
        id: reviewData.id,
        submissionId: selectedSubmissionId,
        problemId: reviewData.problemId || "",
        problemTitle: reviewData.problemTitle || "",
        overallRating: reviewData.overallRating,
        summary: reviewData.summary,
        createdAt: new Date().toISOString(),
      })
      setDialogOpen(true)

      if (onReviewGenerated) {
        onReviewGenerated()
      }
    } catch (err) {
      console.error("Error generating review:", err)
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
                提出コードをAIが分析・改善提案
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
            {/* 提出選択 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                レビューする提出を選択
              </label>
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  まだAC提出がありません
                </div>
              ) : (
                <Select value={selectedSubmissionId} onValueChange={setSelectedSubmissionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="提出を選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {submissions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.problemId} - {new Date(sub.epochSecond * 1000).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 生成ボタン */}
            <Button
              onClick={generateReview}
              disabled={!selectedSubmissionId || generating}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Code2 className="h-4 w-4 mr-2" />
                  レビューを生成
                </>
              )}
            </Button>

            {/* 過去のレビュー */}
            {reviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">過去のレビュー</h3>
                <div className="space-y-2">
                  {reviews.slice(0, 3).map((review) => (
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
      // 詳細データを取得
      const res = await fetch(`/api/hub/atcoder/code-review?submissionId=${review.submissionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.reviews && data.reviews.length > 0) {
          setFullReview(data.reviews[0])
        } else {
          // データがない場合は既存のreviewを使う
          setFullReview(null)
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

  // 表示するデータ（詳細が取得できればそれを使う）
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
    </div>
  )
}
