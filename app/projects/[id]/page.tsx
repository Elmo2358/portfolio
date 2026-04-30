import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FolderOpen, Github, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"

async function getProject(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/portfolio/projects/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    return null
  }

  return res.json()
}

const techColors: { [key: string]: string } = {
  "Next.js": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100",
  "TypeScript": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "Tailwind CSS": "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-100",
  "Prisma": "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100",
  "Python": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100",
  "NumPy": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "SciPy": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100",
  "Matplotlib": "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-100",
  "Socket": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "Threading": "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100"
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 animate-fadeIn">
          <Button
            variant="outline"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
            asChild
          >
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              プロジェクト一覧に戻る
            </Link>
          </Button>
        </div>

        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-lg bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{project.title}</CardTitle>
                <CardDescription className="text-lg">{project.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 text-xl font-semibold text-emerald-700 dark:text-emerald-300">使用技術</h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech: string) => (
                  <Badge
                    key={tech}
                    className={`${techColors[tech] || "bg-emerald-100 text-emerald-700"} text-sm px-3 py-1`}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              {project.githubUrl && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                  asChild
                >
                  <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5 mr-2" />
                    GitHubで見る
                  </Link>
                </Button>
              )}
              {project.url && (
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  asChild
                >
                  <Link href={project.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    デモを見る
                  </Link>
                </Button>
              )}
            </div>

            {project.imageUrl && (
              <div className="rounded-lg overflow-hidden border-2 border-emerald-500">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-auto"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
