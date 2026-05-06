"use client";

import { cn } from "@/lib/utils";

/** Aligné sur `public/billo-mark.svg` — ondes / voix. */
const MARK_VIEW_BOX = "0 0 192 192";
const WAVES_GROUP_TRANSFORM =
  "translate(96 96) scale(1.88) translate(-65 -96)";
const WAVE_PATH_DS = [
  "M42 86 Q102 96 42 106",
  "M42 74 Q118 96 42 118",
  "M42 58 Q134 96 42 134",
] as const;
const WAVE_STROKE_WIDTH = 10;

interface BilloLogoMarkProps {
  className?: string;
  size?: number;
  title?: string;
  /** Sur fond brand (ex. bandeau) : pastille claire + motif blanc */
  variant?: "default" | "onBrand";
}

function BilloWaveMark({ stroke }: { stroke: string }) {
  return (
    <g
      fill="none"
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={WAVE_STROKE_WIDTH}
      transform={WAVES_GROUP_TRANSFORM}
    >
      {WAVE_PATH_DS.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

/**
 * Pictogramme Billo : trois ondes (même tracé que `billo-mark.svg`).
 */
export function BilloLogoMark({
  className,
  size = 36,
  title,
  variant = "default",
}: BilloLogoMarkProps) {
  const svgBase = {
    width: size,
    height: size,
    viewBox: MARK_VIEW_BOX,
    role: "img" as const,
    "aria-hidden": title ? undefined : true,
    "aria-label": title,
  } as const;

  if (variant === "onBrand") {
    return (
      <svg {...svgBase} className={cn("shrink-0", className)}>
        {title ? <title>{title}</title> : null}
        <rect
          width="192"
          height="192"
          rx="44"
          fill="currentColor"
          fillOpacity="0.22"
        />
        <BilloWaveMark stroke="currentColor" />
      </svg>
    );
  }

  return (
    <svg {...svgBase} className={cn("shrink-0 text-primary", className)}>
      {title ? <title>{title}</title> : null}
      <BilloWaveMark stroke="currentColor" />
    </svg>
  );
}

interface BilloLogoProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  size?: number;
  showWordmark?: boolean;
}

export function BilloLogo({
  className,
  iconClassName,
  wordmarkClassName,
  size = 36,
  showWordmark = true,
}: BilloLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BilloLogoMark className={iconClassName} size={size} />
      {showWordmark ? (
        <span
          className={cn(
            "font-display text-lg font-bold tracking-tight text-brand",
            wordmarkClassName,
          )}
        >
          Billo
        </span>
      ) : null}
    </span>
  );
}
