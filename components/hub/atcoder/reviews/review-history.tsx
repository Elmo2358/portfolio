"use client"

import { useState, useEffect } from "react"
import { FileText, ChevronDown, ChevronRight, ExternalLink, Trash2, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CodeReview {
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
  sourceCode: string
  language: string
  createdAt: string
}

interface ReviewHistoryProps {
  initialReviews?: CodeReview[]
}

const ratingColors: Record<string, string> = {
  S: "bg-yellow-500 text-yellow-950 dark:text-yellow-50",
  A: "bg-emerald-500 text-emerald-950 dark:text-emerald-50",
  B: "bg-blue-500 text-blue-950 dark:text-blue-50",
  C: "bg-gray-500 text-gray-950 dark:text-gray-50",
  D: "bg-red-500 text-red-950 dark:text-red-50",
}

export function ReviewHistory({ initialReviews = [] }: ReviewHistoryProps) {
  const [reviews, setReviews] = useState<CodeReview[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(initialReviews.length)
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const itemsPerPage = 10
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  useEffect(() => {
    // 初期データがある場合は、最初のAPI呼び出しをスキップ
    if (!initialized && initialReviews.length > 0) {
      setInitialized(true)
      return
    }
    fetchReviews()
  }, [page, ratingFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((page - 1) * itemsPerPage).toString(),
      })
      if (ratingFilter !== "all") {
        params.append("rating", ratingFilter)
      }

      const res = await fetch(`/api/hub/atcoder/code-review?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setTotalCount(data.total || data.reviews?.length || 0)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("このレビューを削除しますか？")) return

    try {
      const res = await fetch("/api/hub/atcoder/code-review", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      })

      if (res.ok) {
        await fetchReviews()
      }
    } catch (error) {
      console.error("Error deleting review:", error)
    }
  }

  const toggleExpand = (reviewId: string) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId)
  }

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">フィルター:</span>
        </div>
        <Select value={ratingFilter} onValueChange={(value) => { setRatingFilter(value); setPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <span>{ratingFilter === "all" ? "すべて" : `${ratingFilter} ランク`}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="S">S ランク</SelectItem>
            <SelectItem value="A">A ランク</SelectItem>
            <SelectItem value="B">B ランク</SelectItem>
            <SelectItem value="C">C ランク</SelectItem>
            <SelectItem value="D">D ランク</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* レビュー一覧 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {ratingFilter !== "all" ? "条件に一致するレビューがありません" : "レビューがまだありません"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={ratingColors[review.overallRating] || ratingColors.C}>
                        {review.overallRating} ランク
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        複雑度: {review.complexityScore}/10
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{review.problemTitle}</CardTitle>
                    <CardDescription>{review.problemId}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(review.id)}
                    >
                      {expandedReview === review.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <a
                      href={`https://atcoder.jp/contests/submissions/${review.submissionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedReview === review.id && (
                <CardContent className="border-t pt-4 space-y-4">
                  {/* サマリー */}
                  <div>
                    <h4 className="font-medium mb-2">サマリー</h4>
                    <p className="text-sm text-muted-foreground">{review.summary}</p>
                  </div>

                  {/* 強み */}
                  {review.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">強み</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {review.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 改善点 */}
                  {review.improvements.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">改善点</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {review.improvements.map((improvement, i) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* バグ */}
                  {review.bugs.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">発見されたバグ</h4>
                      <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                        {review.bugs.map((bug, i) => (
                          <li key={i}>{bug}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ソースコード */}
                  {review.sourceCode && (
                    <div>
                      <h4 className="font-medium mb-2">ソースコード ({review.language})</h4>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                        <code>{review.sourceCode}</code>
                      </pre>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            前へ
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages} ページ
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}
