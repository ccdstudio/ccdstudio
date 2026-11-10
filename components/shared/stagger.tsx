"use client"

import { Children, type ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

/**
 * Entrada animada em cascata: cada filho direto aparece com fade e uma leve subida, um depois do outro.
 * Usado nos resultados da IA (otimização, roteiro). Os filhos podem ser componentes de servidor.
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <motion.div
          key={i}
          className="min-w-0"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
