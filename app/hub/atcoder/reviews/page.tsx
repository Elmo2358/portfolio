import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ReviewHistory } from "@/components/hub/atcoder/reviews/review-history"
import { FileText } from "lucide-react"

// モックレビューデータ（開発用）
const mockReviews: Array<{
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
}> = [
  {
    id: "mock-1",
    submissionId: "mock-sub-1",
    problemId: "abc086_a",
    problemTitle: "Product",
    overallRating: "A",
    summary: "このコードは基本的な積の計算を正しく実装しています。変数名が明確で、読みやすいコードです。",
    strengths: [
      "シンプルで明確な実装",
      "適切な変数名の使用",
      "標準入力の処理が正しい"
    ],
    improvements: [
      "型アノテーションを追加するとさらに読みやすくなります",
      "エッジケース（負の数など）の考慮ができます"
    ],
    complexityScore: 2,
    bugs: [],
    sourceCode: `a, b = map(int, input().split())
print(a * b)`,
    language: "Python",
    createdAt: "2026-05-29T10:00:00.000Z",
  },
  {
    id: "mock-2",
    submissionId: "mock-sub-2",
    problemId: "abc049_c",
    problemTitle: "Daydream",
    overallRating: "S",
    summary: "優れた実装です。文字列の置換を効率的に行っており、時間計算量も適切です。",
    strengths: [
      "効率的なアルゴリズム選択",
      "クリアなコード構造",
      "適切な文字列処理"
    ],
    improvements: [
      "コメントを追加すると保守性が向上します"
    ],
    complexityScore: 5,
    bugs: [],
    sourceCode: `s = input().strip()
for t in ["dream", "dreamer", "erase", "eraser"]:
    s = s.replace(t, "")
print("YES" if s == "" else "NO")`,
    language: "Python",
    createdAt: "2026-05-28T10:00:00.000Z",
  },
  {
    id: "mock-3",
    submissionId: "mock-sub-3",
    problemId: "abc081_b",
    problemTitle: "Shift only",
    overallRating: "B",
    summary: "基本的な実装ですが、若干の改善余地があります。",
    strengths: [
      "正しいアルゴリズム",
      "シンプルな実装"
    ],
    improvements: [
      "whileループの代わりに再帰を使うとより関数的になります",
      "カウント変数の初期化を明確にしましょう"
    ],
    complexityScore: 3,
    bugs: [
      "入力がすべて0の場合の処理が考慮されていません"
    ],
    sourceCode: `n = int(input())
a = list(map(int, input().split()))
count = 0
while all(x % 2 == 0 for x in a):
    a = [x // 2 for x in a]
    count += 1
print(count)`,
    language: "Python",
    createdAt: "2026-05-27T10:00:00.000Z",
  },
]

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

  // レビューがない場合はモックデータを使用
  const displayReviews = reviews.length > 0
    ? [
        ...reviews.map((review) => ({
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
        })),
        ...mockReviews,
      ]
    : mockReviews

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
              {reviews.length === 0 && "（現在モックデータを表示中）"}
            </p>
          </div>
        </div>
      </div>

      <ReviewHistory initialReviews={displayReviews} />
    </div>
  )
}
