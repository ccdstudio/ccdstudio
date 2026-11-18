"use client"

import { useEffect, useId } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

/*
 * Logo do CCD Studio (public/icon-logo-white.svg) como figura de linha:
 *  - a etiqueta (tag) e o furo usam currentColor — branco no navy, navy no branco;
 *  - o play vai em gradiente teal (ação/vídeo); o brilho da IA em dourado (raro).
 * Todos os traços têm pathLength=1, então o CSS desenha a logo com stroke-dashoffset (.lp-draw).
 */

const TAG =
  "M227.029 138.5L86.5859 138.5C82.3094 138.5 78.1812 136.934 74.9805 134.098L18.4326 83.9922C10.6106 77.0613 10.5669 64.8638 18.3398 57.8779L74.9687 6.98438C78.1811 4.09736 82.348 2.5 86.667 2.5L245 2.5C254.665 2.50001 262.5 10.335 262.5 20L262.5 102.461C262.5 103.936 262.314 105.406 261.945 106.834L259.943 114.59C259.162 117.617 257.584 120.381 255.373 122.592L249.2 128.765C247.771 130.193 246.106 131.364 244.277 132.225L234.48 136.834C232.15 137.931 229.605 138.5 227.029 138.5Z"
const PLAY =
  "M198.54 62.8281C203.971 65.6177 203.971 73.3823 198.54 76.1719L121.677 115.651C116.686 118.215 110.75 114.591 110.75 108.98L110.75 30.0195C110.75 24.4087 116.686 20.785 121.677 23.3486L198.54 62.8281Z"
// Brilho de 4 pontas (mesmo centro e tamanho do original: 224,34 · raio 21).
const SPARK =
  "M224 13C225.6 24.5 229.5 28.4 245 34C229.5 39.6 225.6 43.5 224 55C222.4 43.5 218.5 39.6 203 34C218.5 28.4 222.4 24.5 224 13Z"

// Furo da etiqueta: o pivô do balanço, em % da caixa do desenho (fill-box).
const PIVOT = "18% 50%"

type Props = {
  className?: string
  /** "draw": desenha ao montar (CSS). "interactive": também balança na direção do cursor. */
  mode?: "static" | "draw" | "interactive"
  /** Atraso extra do desenho, em segundos. */
  delay?: number
  title?: string
}

export function StudioLogo({ className, mode = "static", delay = 0, title = "CCD Studio" }: Props) {
  const id = useId().replace(/:/g, "")
  const reduced = useReducedMotion()
  const interactive = mode === "interactive" && !reduced

  // Cursor relativo ao centro da janela (-1…1), com mola.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 70, damping: 14 })
  const sy = useSpring(my, { stiffness: 70, damping: 14 })
  const rotate = useTransform(sx, (v) => v * 9)
  const playX = useTransform(sx, (v) => v * 6)
  const playY = useTransform(sy, (v) => v * 4)
  const sparkX = useTransform(sx, (v) => v * 14)
  const sparkY = useTransform(sy, (v) => v * 10)
  const sparkRotate = useTransform(sx, (v) => v * 45)

  useEffect(() => {
    if (!interactive || !window.matchMedia("(pointer: fine)").matches) return
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [interactive, mx, my])

  const draw = mode !== "static"
  const d = (s: number) => ({ "--d": `${delay + s}s` }) as React.CSSProperties

  return (
    <svg
      viewBox="-12 -12 289 165"
      fill="none"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={cn("overflow-visible", draw && "lp-draw", className)}
    >
      <defs>
        <linearGradient id={`play-${id}`} x1="110" y1="22" x2="204" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ccd-teal-light)" />
          <stop offset="1" stopColor="var(--ccd-teal)" />
        </linearGradient>
        <linearGradient id={`spark-${id}`} x1="203" y1="13" x2="245" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ccd-gold)" />
          <stop offset="0.5" stopColor="var(--ccd-gold-light)" />
          <stop offset="1" stopColor="var(--ccd-gold)" />
        </linearGradient>
      </defs>

      <motion.g style={interactive ? { rotate, transformOrigin: PIVOT, transformBox: "fill-box" } : undefined}>
        <path d={TAG} pathLength={1} stroke="currentColor" strokeWidth={5} strokeLinejoin="round" style={d(0)} />
        <circle cx={55.5} cy={70.5} r={10} pathLength={1} stroke="currentColor" strokeWidth={5} style={d(0.55)} />

        <motion.g style={interactive ? { x: playX, y: playY } : undefined}>
          <path
            d={PLAY}
            pathLength={1}
            stroke={`url(#play-${id})`}
            strokeWidth={5}
            strokeLinejoin="round"
            className="lp-play-fill"
            fill={`url(#play-${id})`}
            fillOpacity={0}
            style={d(0.35)}
          />
        </motion.g>

        <motion.g
          style={
            interactive
              ? { x: sparkX, y: sparkY, rotate: sparkRotate, transformOrigin: "50% 50%", transformBox: "fill-box" }
              : undefined
          }
        >
          <g className="lp-spark" style={{ ...d(0.85), transformOrigin: "50% 50%", transformBox: "fill-box" }}>
            <path
              d={SPARK}
              pathLength={1}
              stroke={`url(#spark-${id})`}
              strokeWidth={2.5}
              strokeLinejoin="round"
              fill={`url(#spark-${id})`}
              fillOpacity={0.25}
              style={d(0.85)}
            />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  )
}

/* ------------------------------------------------------------------ versão preenchida (rebranding) */

/**
 * Marca preenchida do CCD Studio: etiqueta em degradê teal com brilho no topo, furo vazado,
 * play branco e o brilho da IA em dourado. Sem PNG — nítida em qualquer tamanho e nos dois fundos.
 */
export function StudioMark({ className, title = "" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 265 141"
      className={cn("overflow-visible", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <defs>
        <linearGradient id={`tag-${id}`} x1="20" y1="0" x2="250" y2="141" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ccd-teal-light)" />
          <stop offset="0.6" stopColor="var(--ccd-teal)" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--ccd-teal) 55%, var(--ccd-navy))" />
        </linearGradient>
        <linearGradient id={`shine-${id}`} x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.35" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`gold-${id}`} x1="203" y1="13" x2="245" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ccd-gold)" />
          <stop offset="0.5" stopColor="var(--ccd-gold-light)" />
          <stop offset="1" stopColor="var(--ccd-gold)" />
        </linearGradient>
        {/* furo vazado: mostra o fundo atrás da etiqueta */}
        <mask id={`hole-${id}`}>
          <rect width="265" height="141" fill="white" />
          <circle cx="55.5" cy="70.5" r="11" fill="black" />
        </mask>
      </defs>
      <g mask={`url(#hole-${id})`}>
        <path d={TAG} fill={`url(#tag-${id})`} />
        <path d={TAG} fill={`url(#shine-${id})`} />
      </g>
      <path d={PLAY} fill="white" />
      <g className="lp-spark" style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}>
        <path d={SPARK} fill={`url(#gold-${id})`} />
      </g>
    </svg>
  )
}

/** Logo completa: marca preenchida + "CCD" (branco ou navy, conforme o fundo) + "Studio" em ouro. */
export function StudioWordmark({
  className,
  tone = "light",
  size = "md",
}: {
  className?: string
  /** "light": texto claro, para fundo navy. "dark": texto navy, para fundo branco. */
  tone?: "light" | "dark"
  size?: "md" | "lg"
}) {
  return (
    <span className={cn("group inline-flex items-center", size === "lg" ? "gap-3" : "gap-2.5", className)}>
      <StudioMark className={size === "lg" ? "h-10 w-auto" : "h-7 w-auto md:h-8"} />
      <span
        className={cn(
          "leading-none font-bold whitespace-nowrap transition-colors duration-300",
          size === "lg" ? "text-3xl" : "text-xl md:text-[1.4rem]",
          tone === "light" ? "text-white" : "text-ccd-navy",
        )}
      >
        CCD <span className="text-gradient-gold">Studio</span>
      </span>
    </span>
  )
}

/**
 * Logo "adesivo": o contorno em linha (currentColor) com a marca preenchida por dentro — o estado final
 * da abertura da landing. `fill` pode receber a animação de entrada (ex.: .lp-intro-fill).
 * Os `!` vencem regras que forçam tamanho em todo svg (ex.: [&_svg]:size-4 do botão da sidebar).
 */
export function StudioSticker({
  className,
  outlineMode = "static",
  fillClassName,
}: {
  className?: string
  outlineMode?: "static" | "draw"
  fillClassName?: string
}) {
  return (
    <span className={cn("relative block [&_svg]:block [&_svg]:h-auto! [&_svg]:w-full!", className)} aria-hidden>
      <StudioLogo mode={outlineMode} title="" />
      {/* marca centrada e um pouco menor que o contorno: sobra uma borda branca igual em volta ("adesivo") */}
      <span className={cn("absolute inset-0 flex items-center justify-center", fillClassName)}>
        <span className="w-[84%]">
          <StudioMark />
        </span>
      </span>
    </span>
  )
}
