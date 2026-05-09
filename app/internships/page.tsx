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
