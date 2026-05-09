"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FolderOpen, ExternalLink, Github } from "lucide-react"
import { motion } from "framer-motion"

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
  "Threading": "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100",
  "React": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "Vercel": "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700",
  "GCP Job": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "LLM": "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100",
  "discord.py": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "自然言語処理": "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-100",
  "Node.js": "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-100",
  "discord.js": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "JavaScript": "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100",
  "Godot Engine": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "GDScript": "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100",
  "Unity": "bg-slate-700 text-white hover:bg-slate-600 dark:bg-slate-600",
  "C#": "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100",
  "VRChat SDK": "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
  "UdonSharp": "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100",
  "pandas": "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-100",
  "データ分析": "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-100",
  "統計解析": "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100"
}

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string
    technologies: string | string[]
    githubUrl?: string
    url?: string
  }
  index: number
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const colorClasses = {
    border: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600",
    icon: "bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
  }

  const technologies = typeof project.technologies === 'string'
    ? JSON.parse(project.technologies)
    : project.technologies

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
    >
      <Card className={`flex flex-col h-full border-2 ${colorClasses.border}`}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">使用技術</h4>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech: string) => (
                <Badge
                  key={tech}
                  className={`text-xs ${techColors[tech] || "bg-emerald-100 text-emerald-700"}`}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-auto flex gap-2">
            {project.githubUrl && (
              <Button
                size="sm"
                variant="outline"
                className={`flex-1 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500`}
                asChild
              >
                <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-1" />
                  GitHub
                </Link>
              </Button>
            )}
            {project.url && (
              <Button
                size="sm"
                className={`flex-1 ${colorClasses.button} text-white`}
                asChild
              >
                <Link href={project.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  サイトを開く
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
