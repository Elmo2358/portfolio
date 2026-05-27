import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ReviewHistory } from "@/components/hub/atcoder/reviews/review-history"
import { FileText } from "lucide-react"

export default async function AtCoderReviewsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  // 初回表示用のレビューを取得
  const reviews = await prisma.codeReview.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const serializedReviews = reviews.map((review) => ({
    id: review.id,
    submissionId: review.submissionId,
    problemId: review.problemId,
    problemTitle: review.problemTitle || "",
    overallRating: review.overallRating || "C",
    summary: review.summary || "",
    strengths: review.strengths ? JSON.parse(review.strengths) : [],
    improvements: review.improvements ? JSON.parse(review.improvements) : [],
    complexityScore: review.complexityScore || 5,
    bugs: review.bugs ? JSON.parse(review.bugs) : [],
    sourceCode: review.sourceCode || "",
    language: review.language || "",
    createdAt: review.createdAt.toISOString(),
  }))

  return (
    <div className="container py-8 space-y-6">
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-purple-600 dark:bg-purple-500">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              コードレビュー履歴
            </h1>
            <p className="text-muted-foreground">
              AIによるコードレビュー結果の確認
            </p>
          </div>
        </div>
      </div>

      <ReviewHistory initialReviews={serializedReviews} />
    </div>
  )
}
