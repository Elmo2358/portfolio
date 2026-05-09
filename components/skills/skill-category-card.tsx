"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Database, Wrench, Gamepad2, LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface Skill {
  name: string
  level: number
  description: string
}

interface SkillCategoryCardProps {
  category: string
  skills: Skill[]
  iconName: string
  index: number
}

function getIconByName(iconName: string): LucideIcon {
  const icons: { [key: string]: LucideIcon } = {
    'プログラミング言語': Code,
    'フレームワーク': Code,
    'CSSフレームワーク': Code,
    'Web技術': Code,
    'ツール': Wrench,
    'インフラ': Database,
    'ゲーム開発': Gamepad2,
  }
  return icons[iconName] || Code
}

function getLevelColor(level: number): string {
  switch (level) {
    case 5:
      return "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400"
    case 4:
      return "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
    case 3:
      return "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
    case 2:
      return "bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-400"
    case 1:
      return "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400"
    default:
      return "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400"
  }
}

function getLevelText(level: number): string {
  switch (level) {
    case 5:
      return "専門家"
    case 4:
      return "熟練"
    case 3:
      return "中級"
    case 2:
      return "初級"
    case 1:
      return "学習中"
    default:
      return "-"
  }
}

export function SkillCategoryCard({ category, skills, iconName, index }: SkillCategoryCardProps) {
  const Icon = getIconByName(iconName)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
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
            {skills.map((skill, skillIndex) => (
              <motion.div
                key={skill.name}
                className="rounded-lg border-2 border-emerald-500 bg-emerald-100 p-3 dark:bg-emerald-900 dark:border-emerald-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.15 + skillIndex * 0.05 }}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">{skill.name}</h4>
                  <Badge className={getLevelColor(skill.level)}>
                    {getLevelText(skill.level)}
                  </Badge>
                </div>
                {skill.description && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {skill.description}
                  </p>
                )}
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < skill.level
                          ? "bg-emerald-600 dark:bg-emerald-500"
                          : "bg-emerald-300 dark:bg-emerald-800"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
