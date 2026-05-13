"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Code, Database, Wrench, Gamepad2, LucideIcon,
  FileCode, Terminal, Globe, Server, Cloud, Cpu,
  Layout, Palette, Settings, Box, Braces
} from "lucide-react"
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

function getCategoryIcon(iconName: string): LucideIcon {
  const icons: { [key: string]: LucideIcon } = {
    'プログラミング言語': Code,
    'フレームワーク': Code,
    'CSSフレームワーク': Palette,
    'Web技術': Globe,
    'ツール': Wrench,
    'インフラ': Server,
    'ゲーム開発': Gamepad2,
  }
  return icons[iconName] || Code
}

function getSkillIcon(skillName: string): LucideIcon {
  const icons: { [key: string]: LucideIcon } = {
    // プログラミング言語
    'TypeScript': FileCode,
    'JavaScript': FileCode,
    'Python': Terminal,
    'Java': Box,
    'C++': Braces,
    'C#': Braces,
    'Go': FileCode,
    'Rust': Settings,
    'PHP': FileCode,

    // フレームワーク
    'Next.js': Layout,
    'React': Layout,
    'Vue.js': Layout,
    'Nuxt': Layout,
    'Svelte': Layout,
    'NestJS': Box,
    'Express': Server,
    'FastAPI': Server,
    'Django': Server,
    'Flask': Server,
    'Spring Boot': Box,

    // CSS/UI
    'Tailwind CSS': Palette,
    'shadcn/ui': Layout,
    'Chakra UI': Layout,
    'Material-UI': Palette,

    // Web技術
    'HTML': Globe,
    'CSS': Palette,
    'REST API': Globe,
    'GraphQL': Terminal,

    // データベース
    'PostgreSQL': Database,
    'MySQL': Database,
    'SQLite': Database,
    'MongoDB': Database,
    'Redis': Database,
    'Prisma': Database,

    // インフラ/クラウド
    'Docker': Box,
    'Kubernetes': Server,
    'AWS': Cloud,
    'Vercel': Cloud,
    'GitHub': Box,

    // ツール
    'Git': Box,
    'VS Code': FileCode,
    'Figma': Palette,

    // ゲーム開発
    'Unity': Gamepad2,
    'Unreal Engine': Gamepad2,
    'Godot': Gamepad2,
  }
  return icons[skillName] || Code
}

export function SkillCategoryCard({ category, skills, iconName, index }: SkillCategoryCardProps) {
  const CategoryIcon = getCategoryIcon(iconName)

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
              <CategoryIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">{category}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, skillIndex) => {
              const SkillIcon = getSkillIcon(skill.name)
              return (
                <motion.div
                  key={skill.name}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-400 bg-white px-3 py-1.5 dark:bg-emerald-900 dark:border-emerald-700"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.15 + skillIndex * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <SkillIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{skill.name}</span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
