"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface PageHeaderProps {
  icon: ReactNode
  title: string
  description: string
}

export function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <motion.div
      className="mb-12 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="mb-4 flex justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
          {icon && typeof icon === 'object' && 'type' in icon ? (
            <icon.type {...icon.props} className="h-12 w-12 text-white" />
          ) : (
            icon
          )}
        </div>
      </motion.div>
      <motion.h1
        className="mb-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="text-xl text-emerald-800 dark:text-emerald-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {description}
      </motion.p>
    </motion.div>
  )
}
