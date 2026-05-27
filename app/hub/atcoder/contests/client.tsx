"use client"

import { Trophy, Target, ExternalLink, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Apg4bLearningCard } from "@/components/hub/atcoder/apg4b/apg4b-learning-card"
import { contestSeries, type ContestSeries } from "@/lib/data/contests-data"

interface AtCoderContestsClientProps {
  solvedProblemIds: Set<string>
}

export function AtCoderContestsClient({ solvedProblemIds }: AtCoderContestsClientProps) {
  const calculateProgress = (series: ContestSeries) => {
    const solvedCount = series.problems.filter(p => solvedProblemIds.has(p.id)).length
    return {
      solved: solvedCount,
      total: series.problems.length,
      percentage: (solvedCount / series.problems.length) * 100,
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500"
      case "intermediate":
        return "bg-blue-500"
      case "advanced":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "初級"
      case "intermediate":
        return "中級"
      case "advanced":
        return "上級"
      default:
        return "不明"
    }
  }

  return (
    <div className="container py-8 space-y-6">
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-amber-600 dark:bg-amber-500">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              コンテスト進捗
            </h1>
            <p className="text-muted-foreground">
              各種コンテスト・問題集の学習進捗を確認
            </p>
          </div>
        </div>
      </div>

      {/* APG4b学習カード */}
      <Apg4bLearningCard />

      {/* コンテストシリーズ一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            コンテスト問題集
          </CardTitle>
          <CardDescription>
            各種コンテストの問題集進捗
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="abs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="abs">ABS</TabsTrigger>
              <TabsTrigger value="typical90">典型90</TabsTrigger>
              <TabsTrigger value="math-and-algorithm">数学</TabsTrigger>
              <TabsTrigger value="tessoku">鉄則</TabsTrigger>
            </TabsList>

            {contestSeries.map((series) => {
              const progress = calculateProgress(series)

              return (
                <TabsContent key={series.id} value={series.id} className="space-y-4">
                  {/* サマリー */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{series.name}</h3>
                      <p className="text-sm text-muted-foreground">{series.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {progress.solved} / {progress.total}
                      </div>
                      <Badge className={getDifficultyColor(series.difficulty)}>
                        {getDifficultyLabel(series.difficulty)}
                      </Badge>
                    </div>
                  </div>

                  <Progress value={progress.percentage} className="h-2" />

                  {/* 問題リスト */}
                  <div className="grid gap-2 mt-4">
                    {series.problems.map((problem) => {
                      const isSolved = solvedProblemIds.has(problem.id)

                      return (
                        <a
                          key={problem.id}
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isSolved ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                            )}
                            <span className="font-medium">
                              {series.id === "typical90" || series.id === "math" || series.id === "tessoku"
                                ? `${problem.order}. ${problem.title}`
                                : problem.title}
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      )
                    })}
                  </div>

                  <a
                    href={series.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {series.name} を開く
                    </Button>
                  </a>
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
