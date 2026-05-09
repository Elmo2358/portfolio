"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

interface QualificationCardProps {
  qualification: {
    id: string
    name: string
    score: string
    date: Date
    description: string
    category: string
  }
  index: number
}

export function QualificationCard({ qualification, index }: QualificationCardProps) {
  const colorClasses = {
    border: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600",
    badge: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    icon: "bg-emerald-600 dark:bg-emerald-500"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
    >
      <Card className={`hover:shadow-xl transition-all border-2 h-full ${colorClasses.border}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>{qualification.name}</CardTitle>
                <CardDescription>{qualification.description}</CardDescription>
              </div>
            </div>
            <Badge className={colorClasses.badge}>{qualification.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">結果</span>
              <span className="font-semibold text-lg text-emerald-600">{qualification.score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">受験日/取得日</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                {new Date(qualification.date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
