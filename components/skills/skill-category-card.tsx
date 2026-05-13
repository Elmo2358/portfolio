"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Code, Database, Wrench, Gamepad2, LucideIcon
} from "lucide-react"
import { motion } from "framer-motion"
import {
  SiTypescript, SiJavascript, SiNextdotjs, SiReact,
  SiTailwindcss, SiHtml5, SiPython, SiGit,
  SiGithub, SiRuby, SiPostgresql, SiMysql, SiVercel,
  SiGodotengine, SiUnity, SiC
} from "react-icons/si"

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
    'CSSフレームワーク': Code,
    'Web技術': Code,
    'ツール': Wrench,
    'インフラ': Database,
    'ゲーム開発': Gamepad2,
  }
  return icons[iconName] || Code
}

// ブランドカラーマッピング
const brandColors: { [key: string]: string } = {
  'TypeScript': '#3178C6',
  'JavaScript': '#F7DF1E',
  'Next.js': '#000000',
  'React': '#61DAFB',
  'Tailwind CSS': '#06B6D4',
  'HTML/CSS': '#E34F26',
  'HTML': '#E34F26',
  'CSS': '#1572B6',
  'Python': '#3776AB',
  'Git': '#F05032',
  'GitHub': '#181717',
  'Git/GitHub': '#181717',
  'C言語': '#A8B9CC',
  'C': '#A8B9CC',
  'Ruby': '#CC342D',
  'PostgreSQL': '#336791',
  'MySQL': '#4479A1',
  'データベース': '#336791',
  'Vercel': '#000000',
  'Godot Engine': '#478CBF',
  'Godot': '#478CBF',
  'Unity': '#222C37',
}

const skillIconMap: { [key: string]: React.ComponentType<{ style?: React.CSSProperties }> } = {
  'TypeScript': SiTypescript,
  'JavaScript': SiJavascript,
  'Next.js': SiNextdotjs,
  'React': SiReact,
  'Tailwind CSS': SiTailwindcss,
  'HTML/CSS': SiHtml5,
  'HTML': SiHtml5,
  'Python': SiPython,
  'Git': SiGit,
  'GitHub': SiGithub,
  'Git/GitHub': SiGithub,
  'C言語': SiC,
  'C': SiC,
  'Ruby': SiRuby,
  'PostgreSQL': SiPostgresql,
  'MySQL': SiMysql,
  'データベース': SiPostgresql,
  'Vercel': SiVercel,
  'Godot Engine': SiGodotengine,
  'Godot': SiGodotengine,
  'Unity': SiUnity,
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
              const SkillIcon = skillIconMap[skill.name]
              const brandColor = brandColors[skill.name]
              return (
                <motion.div
                  key={skill.name}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-400 bg-white px-2.5 py-2 dark:bg-emerald-900 dark:border-emerald-700"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.15 + skillIndex * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {SkillIcon && brandColor ? (
                    <SkillIcon style={{ color: brandColor }} className="h-6 w-6" />
                  ) : null}
                  <span className="text-xs text-gray-700 dark:text-gray-300">{skill.name}</span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
