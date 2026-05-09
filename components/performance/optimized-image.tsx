import { useState } from "react"
import Image, { ImageProps } from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  skeletonClassName?: string
}

export function OptimizedImage({
  skeletonClassName,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <Skeleton
          className={`absolute inset-0 z-10 ${skeletonClassName || ""}`}
        />
      )}
      <Image
        {...props}
        onLoad={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${props.className || ""}`}
      />
    </div>
  )
}
