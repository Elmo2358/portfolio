"use client"

import { FadeIn } from "@/components/animations"

interface PageTemplateProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function PageTemplate({ children, title, description, className = "" }: PageTemplateProps) {
  return (
    <FadeIn className={className}>
      {title && (
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </FadeIn>
  )
}

interface SectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({ children, className = "", delay = 0 }: SectionProps) {
  return (
    <FadeIn className={className} delay={delay}>
      {children}
    </FadeIn>
  )
}
