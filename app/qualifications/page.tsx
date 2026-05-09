import { Card, CardContent } from "@/components/ui/card"
import { Award } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { QualificationCard } from "@/components/qualifications/qualification-card"
import { PageHeader } from "@/components/layout/page-header"

export default async function QualificationsPage() {
  const qualifications = await prisma.qualification.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon={<Award className="h-12 w-12 text-white" />}
          title="資格・試験"
          description="Qualifications & Certificates"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {qualifications.length === 0 ? (
            <Card className="col-span-2 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  資格・試験のデータはまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            qualifications.map((qual, index) => (
              <QualificationCard
                key={qual.id}
                qualification={qual}
                index={index}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
