"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  color?: "default" | "purple" | "orange" | "teal"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, color = "default", ...props }, ref) => {
    
    const colorClasses = {
      default: "bg-teal-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      teal: "bg-teal-500"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-in-out",
            colorClasses[color] || colorClasses.default
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
