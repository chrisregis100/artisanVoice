"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface BilloLogoMarkProps {
  className?: string;
  size?: number;
  title?: string;
  /** Sur fond vert (ex. bandeau brand) : pastille claire + B blanc */
  variant?: "default" | "onBrand";
}

/**
 * Monogramme Billo : dégradé émeraude + B en traits arrondis (facture / voix).
 */
export function BilloLogoMark({
  className,
  size = 36,
  title,
  variant = "default",
}: BilloLogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `billo-surface-${uid}`;

  const pathD =
    "M 15 13 L 15 35 M 15 13 Q 28.5 17.5 15 22 M 15 22 Q 31 28.5 15 35";

  if (variant === "onBrand") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={cn("shrink-0", className)}
        role="img"
        aria-hidden={title ? undefined : true}
        aria-label={title}
      >
        {title ? <title>{title}</title> : null}
        <rect
          width="48"
          height="48"
          rx="12"
          fill="rgba(255,255,255,0.22)"
        />
        <path
          d={pathD}
          fill="none"
          stroke="white"
          strokeWidth="4.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={gradId}
          x1="8"
          y1="8"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke="white"
        strokeWidth="4.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
