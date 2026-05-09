"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = (val: string) => {
    console.log('handleValueChange:', val, 'currentValue:', currentValue, 'new currentValue will be:', val)
    if (onValueChange) onValueChange(val)
    if (controlledValue === undefined) setInternalValue(val)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value: triggerValue, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext)
  const isActive = context.value === triggerValue

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive ? "bg-background text-foreground shadow-sm" : "",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value: contentValue, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext)

  if (context.value !== contentValue) return null

  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  )
}
