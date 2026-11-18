"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

type Direction = "up" | "left" | "right" | "none"

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 24 },
  left: { x: -24 },
  right: { x: 24 },
  none: {},
}

/**
 * Entrada ao rolar (DESIGN - LP.md → Reveal): fade com 24px de deslocamento, 0.5s, uma vez.
 * Com "reduzir movimento" vira só fade. `index` atrasa em grids (index × 0.1s).
 */
export function Reveal({
  children,
  className,
  direction = "up",
  index = 0,
}: {
  children: ReactNode
  className?: string
  direction?: Direction
  index?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...(reduced ? {} : offset[direction]) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
    >
      {children}
    </motion.div>
  )
}
