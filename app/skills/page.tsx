import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { Code, Database, Wrench, Gamepad2 } from "lucide-react"

async function getSkills() {
  const skills = await prisma.skill.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })
  return skills
}

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: any } = {
    'プログラミング言語': Code,
    'フレームワーク': Code,
    'CSSフレームワーク': Code,
    'Web技術': Code,
    'ツール': Wrench,
    'インフラ': Database,
    'ゲーム開発': Gamepad2,
  }
  return icons[category] || Code
}

export default async function SkillsPage() {
  const skills = await getSkills()

  // カテゴリ別にグループ化
  const skillsByCategory = skills.reduce((acc: any, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {})

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Code className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            技術スタック
          </h1>
          <p className="text-xl text-emerald-800 dark:text-emerald-200">Skills & Technologies</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 stagger-200">
          {skills.length === 0 ? (
            <Card className="col-span-2 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  スキルのデータはまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(skillsByCategory).map(([category, categorySkills]: [string, any]) => {
              const Icon = getCategoryIcon(category)
              return (
                <Card key={category} className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-emerald-700 dark:text-emerald-300">{category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categorySkills.map((skill: any) => (
                        <div key={skill.id} className="rounded-lg border-2 border-emerald-500 bg-emerald-100 p-3 dark:bg-emerald-900 dark:border-emerald-600">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">{skill.name}</h3>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < skill.level
                                      ? 'fill-emerald-600 text-emerald-600 dark:fill-emerald-500 dark:text-emerald-500'
                                      : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          {skill.description && (
                            <p className="text-sm text-emerald-800 dark:text-emerald-200">{skill.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
