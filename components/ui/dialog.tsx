"use client"

import * as React from "react"
import { X } from "lucide-react"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { open, onOpenChange })
        }
        return child
      })}
    </>
  )
}

export function DialogTrigger({ asChild, children, ...props }: any) {
  return <>{children}</>
}

export function DialogContent({
  className,
  children,
  open,
  onOpenChange,
  ...props
}: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div
        className={`relative z-50 bg-background rounded-lg shadow-lg border max-w-lg w-full p-6 ${className || ""}`}
        {...props}
      >
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }: any) {
  return <div className={className || ""} {...props} />
}

export function DialogFooter({ className, ...props }: any) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ""}`} {...props} />
  )
}

export function DialogTitle({ className, ...props }: any) {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`} {...props} />
  )
}

export function DialogDescription({ className, ...props }: any) {
  return (
    <p className={`text-sm text-muted-foreground ${className || ""}`} {...props} />
  )
}
