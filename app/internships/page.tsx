import { Card, CardContent } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { InternshipCard } from "@/components/internships/internship-card"
import { PageHeader } from "@/components/layout/page-header"

export default async function InternshipsPage() {
  const internships = await prisma.internship.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon={<Briefcase className="h-12 w-12 text-white" />}
          title="実習・インターンシップ"
          description="Internships & Experiences"
        />

        <div className="space-y-8">
          {internships.length === 0 ? (
            <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  インターンシップや実習の経験はまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            internships.map((internship, index) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                index={index}
                total={internships.length}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
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
