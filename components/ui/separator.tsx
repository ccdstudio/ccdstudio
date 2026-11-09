"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "cn"

// DESIGN.md: divisores hairline tracejados (1px, Cork Border).
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 border-dashed border-border data-horizontal:w-full data-horizontal:border-t data-vertical:self-stretch data-vertical:border-l",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
