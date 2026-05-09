"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Lightbulb, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface Internship {
  id: string
  title: string
  company?: string
  period: string
  description?: string
  learned?: string
}

interface InternshipCardProps {
  internship: Internship
  index: number
  total: number
}

export function InternshipCard({ internship, index, total }: InternshipCardProps) {
  const colorClasses = {
    border: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600",
    badge: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    timeline: "bg-emerald-600 dark:bg-emerald-500",
    icon: "bg-emerald-600 dark:bg-emerald-500"
  }

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      whileHover={{ x: 8 }}
    >
      {index !== total - 1 && (
        <div className={`absolute left-8 top-20 h-[calc(100%-2rem)] w-0.5 ${colorClasses.timeline}`} />
      )}

      <Card className={`ml-16 hover:shadow-xl transition-all border-2 ${colorClasses.border}`}>
        <motion.div
          className={`absolute left-[-3rem] top-8 flex h-8 w-8 items-center justify-center rounded-full ${colorClasses.icon} text-sm font-bold text-white shadow-lg`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.2 + 0.3 }}
          whileHover={{ scale: 1.2 }}
        >
          {index + 1}
        </motion.div>

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-emerald-700 dark:text-emerald-300">{internship.title}</CardTitle>
              {internship.company && (
                <div className="flex items-center gap-2 mt-1 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{internship.company}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={colorClasses.badge}>{internship.period}</Badge>
            </div>
          </div>

          {internship.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">概要</h4>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-6">
                {internship.description}
              </p>
            </div>
          )}

          {internship.learned && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">学んだこと</h4>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-6">
                {internship.learned}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
