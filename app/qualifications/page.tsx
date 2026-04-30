import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Star } from "lucide-react"
import { prisma } from "@/lib/prisma"

const getColorClasses = (color: string) => {
  const colors = {
    emerald: {
      border: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600",
      badge: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
      icon: "bg-emerald-600 dark:bg-emerald-500"
    }
  }
  return colors.emerald
}

export default async function QualificationsPage() {
  const qualifications = await prisma.qualification.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Award className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            資格・試験
          </h1>
          <p className="text-xl text-emerald-800 dark:text-emerald-200">Qualifications & Certificates</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 stagger-200">
          {qualifications.length === 0 ? (
            <Card className="col-span-2 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  資格・試験のデータはまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            qualifications.map((qual) => {
              const colorClasses = getColorClasses("emerald")
              return (
                <Card
                  key={qual.id}
                  className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 animate-slideUp ${colorClasses.border}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>{qual.name}</CardTitle>
                          <CardDescription>{qual.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={colorClasses.badge}>{qual.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">結果</span>
                        <span className="font-semibold text-lg text-emerald-600">{qual.score}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">受験日/取得日</span>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                          {new Date(qual.date).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {qual.description && (
                        <div className="mt-3 pt-3 border-t border-emerald-500 dark:border-emerald-600">
                          <p className="text-sm text-emerald-800 dark:text-emerald-200">{qual.description}</p>
                        </div>
                      )}
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
