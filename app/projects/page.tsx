import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ProjectCard } from "@/components/projects/project-card"
import { PageHeader } from "@/components/layout/page-header"

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          icon={<FolderOpen className="h-12 w-12 text-white" />}
          title="プロジェクト"
          description="Projects & Works"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <Card className="col-span-2 lg:col-span-3 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  プロジェクトのデータはまだありません。
                </p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
