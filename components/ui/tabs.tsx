"use client"

import * as React from "react"

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            value: currentValue,
            onValueChange: (val: string) => {
              if (onValueChange) onValueChange(val)
              if (value === undefined) setInternalValue(val)
            },
          })
        }
        return child
      })}
    </div>
  )
}

export function TabsList({ className, children, value, onValueChange }: any) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className || ""}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            value,
            onValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

export function TabsTrigger({ value, onValueChange, children, className, ...props }: any) {
  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${value === props.value ? "bg-background text-foreground shadow-sm" : ""} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className, ...props }: any) {
  if (value !== props.value) return null

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ""}`} {...props}>
      {children}
    </div>
  )
}
