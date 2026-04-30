import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Building2, Lightbulb, TrendingUp } from "lucide-react"
import { prisma } from "@/lib/prisma"

const getColorClasses = (color: string) => {
  const colors = {
    emerald: {
      border: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600",
      badge: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
      timeline: "bg-emerald-600 dark:bg-emerald-500",
      icon: "bg-emerald-600 dark:bg-emerald-500"
    }
  }
  return colors.emerald
}

export default async function InternshipsPage() {
  const internships = await prisma.internship.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Briefcase className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            実習・インターンシップ
          </h1>
          <p className="text-xl text-emerald-800 dark:text-emerald-200">Internships & Experiences</p>
        </div>

        <div className="space-y-8 stagger-200">
          {internships.length === 0 ? (
            <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  インターンシップや実習の経験はまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            internships.map((internship, index) => {
              const colorClasses = getColorClasses("emerald")
              return (
                <div key={internship.id} className="relative">
                  {index !== internships.length - 1 && (
                    <div className={`absolute left-8 top-20 h-[calc(100%-2rem)] w-0.5 ${colorClasses.timeline}`} />
                  )}
                  <Card className={`ml-16 hover:shadow-xl transition-all hover:-translate-y-1 border-2 animate-slideUp ${colorClasses.border}`}>
                    <div className={`absolute left-[-3rem] top-8 flex h-8 w-8 items-center justify-center rounded-full ${colorClasses.icon} text-sm font-bold text-white shadow-lg`}>
                      {index + 1}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{internship.title}</CardTitle>
                            <CardDescription>{internship.company}</CardDescription>
                          </div>
                        </div>
                        <Badge className={colorClasses.badge}>{internship.period}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="mb-1 font-semibold text-emerald-700 dark:text-emerald-300">内容</h4>
                          <p className="text-sm text-emerald-800 dark:text-emerald-200">{internship.description}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="mb-1 font-semibold text-emerald-700 dark:text-emerald-300">学んだこと</h4>
                          <p className="text-sm text-emerald-800 dark:text-emerald-200">{internship.learned}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
