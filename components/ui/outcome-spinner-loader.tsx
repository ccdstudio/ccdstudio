"use client";

// Componente de terceiro (enviado pelo dono do produto), mantido como veio. Usa só tokens do tema
// (stroke-chart-2, stroke-destructive, stroke-primary, muted-foreground).

import * as React from "react";

type SpanProps = React.ComponentProps<"span">;

export type SpinnerStatus = "idle" | "pending" | "progress" | "success" | "error";

export type OutcomeSpinnerLoaderProps = {
  status: SpinnerStatus;
  progress?: number;
  size?: "sm" | "md" | "lg" | number;
  strokeWidth?: number;
  tone?: "default" | "primary" | "inherit";
  label?: string;
  labels?: { [status in SpinnerStatus]?: React.ReactNode };
  showPercent?: boolean;
  onSettled?: (status: "success" | "error") => void;
  settleMs?: number;
  className?: string;
  ref?: SpanProps["ref"];
};

const SIZES = { sm: 16, md: 24, lg: 40 } as const;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(true);
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function RollingLabel({ text, rollKey, reduced }: { text: React.ReactNode; rollKey: string; reduced: boolean }) {
  const ref = React.useRef(null as HTMLSpanElement | null);
  const first = React.useRef(true);
  React.useLayoutEffect(() => {
    const node = ref.current;
    const initial = first.current;
    first.current = false;
    if (!node || initial || reduced || typeof node.animate !== "function") return;
    node.animate([{ transform: "translateY(100%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 300, easing: EASE });
  }, [rollKey]);
  return <span className="inline-block overflow-hidden align-bottom"><span ref={ref} data-spinner-label className="inline-block">{text}</span></span>;
}

export function OutcomeSpinnerLoader({
  status,
  progress,
  size = "md",
  strokeWidth,
  tone = "default",
  label = "Carregando",
  labels,
  showPercent = false,
  onSettled,
  settleMs = 0,
  className = "",
  ref,
}: OutcomeSpinnerLoaderProps) {
  const reduced = useReducedMotion();
  const px = typeof size === "number" ? size : SIZES[size];
  const stroke = strokeWidth ?? (px <= 20 ? 2.4 : 2);
  const clamped = Math.max(0, Math.min(100, progress ?? 0));
  const arcRef = React.useRef(null as SVGCircleElement | null);
  const svgRef = React.useRef(null as SVGSVGElement | null);
  const checkRef = React.useRef(null as SVGPathElement | null);
  const crossRef = React.useRef(null as SVGGElement | null);
  const spin = React.useRef(null as Animation | null);
  const previousProgress = React.useRef(clamped);
  const previousStatus = React.useRef(status);
  const settled = status === "success" || status === "error";
  const arcLength = status === "pending" ? 28 : status === "progress" ? clamped : settled ? 100 : 0;

  React.useLayoutEffect(() => {
    const arc = arcRef.current;
    const svg = svgRef.current;
    const was = previousStatus.current;
    previousStatus.current = status;
    const from = previousProgress.current;
    previousProgress.current = clamped;
    if (!arc || !svg) return;
    const canAnimate = !reduced && typeof arc.animate === "function";
    if (status === "pending") {
      if (!spin.current && canAnimate) spin.current = arc.animate([{ transform: "rotate(-90deg)" }, { transform: "rotate(270deg)" }], { duration: 900, iterations: Infinity, easing: "linear" });
      return;
    }
    spin.current?.cancel();
    spin.current = null;
    if (status === "progress" && canAnimate && was === "progress" && from !== clamped) {
      arc.animate([{ strokeDasharray: `${from} ${100 - from}` }, { strokeDasharray: `${clamped} ${100 - clamped}` }], { duration: 320, easing: EASE });
    }
    if (settled && was !== status && canAnimate) {
      const fromLength = was === "pending" ? 28 : was === "progress" ? from : 0;
      arc.animate([{ strokeDasharray: `${fromLength} ${100 - fromLength}` }, { strokeDasharray: "100 0" }], { duration: 260, easing: EASE });
      const mark = status === "success" ? checkRef.current : crossRef.current;
      const paths = mark instanceof SVGPathElement ? [mark] : mark ? [...mark.querySelectorAll("path")] : [];
      for (const path of paths) path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 300, delay: 180, easing: "ease-out", fill: "backwards" });
      if (status === "success") svg.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)", offset: 0.5 }, { transform: "scale(1)" }], { duration: 420, delay: 160, easing: EASE });
      else svg.animate([{ transform: "translateX(0)" }, { transform: "translateX(-2px)" }, { transform: "translateX(2px)" }, { transform: "translateX(-1px)" }, { transform: "translateX(0)" }], { duration: 360, delay: 120, easing: "ease-out" });
    }
  }, [status, clamped, reduced]);

  React.useEffect(() => {
    if (!settled) return;
    const timer = window.setTimeout(() => onSettled?.(status as "success" | "error"), settleMs);
    return () => window.clearTimeout(timer);
  }, [status, settleMs]);

  React.useEffect(() => () => spin.current?.cancel(), []);

  const arcClass = status === "success" ? "stroke-chart-2" : status === "error" ? "stroke-destructive" : tone === "primary" ? "stroke-primary" : tone === "inherit" ? "stroke-current" : "stroke-foreground";
  const text = labels?.[status];
  const announced = typeof text === "string" ? text : status === "progress" ? `${label} ${Math.round(clamped)}%` : status === "success" ? "Concluído" : status === "error" ? "Falhou" : status === "pending" ? label : "";

  return (
    <span ref={ref} data-slot="outcome-spinner-loader" data-status={status} data-progress={status === "progress" ? Math.round(clamped) : undefined} role="status" aria-live="polite" aria-label={announced || undefined} className={`inline-flex items-center gap-2 align-middle ${className}`}>
      <svg ref={svgRef} data-ring viewBox="0 0 24 24" width={px} height={px} aria-hidden="true" className="shrink-0 overflow-visible">
        <circle cx="12" cy="12" r="10" fill="none" strokeWidth={stroke} className={status === "idle" ? "stroke-muted-foreground/20" : "stroke-muted-foreground/25"} />
        <circle
          ref={arcRef}
          data-arc
          cx="12" cy="12" r="10" fill="none" strokeWidth={stroke} strokeLinecap="round" pathLength={100}
          style={{ strokeDasharray: `${arcLength} ${100 - arcLength}`, transformOrigin: "12px 12px", transform: status === "pending" ? undefined : "rotate(-90deg)" }}
          className={`transition-[stroke] duration-300 motion-reduce:transition-none ${arcClass} ${status === "idle" ? "opacity-0" : "opacity-100"}`}
        />
        <path ref={checkRef} data-check d="M7.5 12.5 10.5 15.5 16.5 9" fill="none" strokeWidth={stroke + 0.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: status === "success" ? 0 : 1 }} className={`stroke-chart-2 ${status === "success" ? "opacity-100" : "opacity-0"}`} />
        <g ref={crossRef} data-cross className={`stroke-destructive ${status === "error" ? "opacity-100" : "opacity-0"}`} fill="none" strokeWidth={stroke + 0.4} strokeLinecap="round">
          <path d="M8.5 8.5 15.5 15.5" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: status === "error" ? 0 : 1 }} />
          <path d="M15.5 8.5 8.5 15.5" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: status === "error" ? 0 : 1 }} />
        </g>
        {showPercent && status === "progress" && px >= 32 && <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fontSize="6.5" className="fill-foreground font-mono">{Math.round(clamped)}</text>}
      </svg>
      {text !== undefined && <span data-label className="text-sm"><RollingLabel text={text} rollKey={status} reduced={reduced} /></span>}
    </span>
  );
}

export default OutcomeSpinnerLoader;
