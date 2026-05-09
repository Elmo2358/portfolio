import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { User, Brain, Heart, Users, Briefcase } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export default async function AboutPage() {
  // サークル活動・チーム開発経験を取得
  const teamExperiences = await prisma.teamExperience.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon={<User className="h-12 w-12 text-white" />}
          title="自己紹介"
          description="About Me"
        />

        <div className="space-y-8">
          {/* Basic Info */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <User className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">基本情報</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                <div>
                  <h3 className="font-semibold">大学</h3>
                  <p className="text-muted-foreground">
                    電気通信大学 情報理工学域Ⅱ類 情報通信工学プログラム
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                <div>
                  <h3 className="font-semibold">入学年度</h3>
                  <p className="text-muted-foreground">2024年入学（現在3年生）</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                <div>
                  <h3 className="font-semibold">キャリアビジョン</h3>
                  <p className="text-muted-foreground">
                    大学院進学予定。通信事業に携わりたいと考えています。
                    具体的な分野はインターンシップや企業研究、研究室体験を通じて決めたいです。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Interests */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">関心のある分野</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-100 p-4 dark:bg-emerald-900 dark:border-emerald-600">
                  <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">無線通信</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Wireless Communication
                  </p>
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                    5G/6Gネットワーク、アンテナ設計、信号処理に興味
                  </p>
                </div>
                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-100 p-4 dark:bg-emerald-900 dark:border-emerald-600">
                  <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">防衛産業</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Defense Industry
                  </p>
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                    日本の武器輸出解禁により広がる分野に興味
                  </p>
                </div>
                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-100 p-4 dark:bg-emerald-900 dark:border-emerald-600">
                  <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">宇宙開発</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Space Development
                  </p>
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                    衛星通信、宇宙通信システムに興味
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Experiences */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">サークル活動・チーム開発経験</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {teamExperiences.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  サークル活動・チーム開発経験のデータはまだありません。
                </p>
              ) : (
                <div className="space-y-4">
                  {teamExperiences.map((exp) => (
                    <div key={exp.id} className="rounded-lg border-2 border-emerald-500 bg-emerald-100 p-4 dark:bg-emerald-900 dark:border-emerald-600">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">{exp.title}</h3>
                        {exp.role && (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                            {exp.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">{exp.organization}</p>
                      <p className="text-sm text-muted-foreground mb-2">{exp.period}</p>
                      {exp.description && (
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-2">
                          {exp.description}
                        </p>
                      )}
                      {exp.learned && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">学んだこと:</p>
                          <p className="text-sm text-emerald-800 dark:text-emerald-200">{exp.learned}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hobbies & Interests */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">趣味・興味</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                <div>
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">技術的な興味</h3>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    Webアプリ開発、ゲーム開発、新しい技術のキャッチアップ
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                <div>
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">好きなもの</h3>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    ゲーム、アニメ、音楽鑑賞
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
