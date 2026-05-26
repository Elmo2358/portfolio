import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Code } from "lucide-react"
import { SkillCategoryCard } from "@/components/skills/skill-category-card"
import { PageHeader } from "@/components/layout/page-header"

export const dynamic = 'force-dynamic'

async function getSkills() {
  const skills = await prisma.skill.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })
  return skills
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
        <PageHeader
          icon={<Code className="h-12 w-12 text-white" />}
          title="技術スタック"
          description="Skills & Technologies"
        />

        <div className="grid gap-8 md:grid-cols-2">
          {skills.length === 0 ? (
            <Card className="col-span-2 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  スキルのデータはまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(skillsByCategory).map(([category, categorySkills]: [string, any], index) => {
              return (
                <SkillCategoryCard
                  key={category}
                  category={category}
                  skills={categorySkills}
                  iconName={category}
                  index={index}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
