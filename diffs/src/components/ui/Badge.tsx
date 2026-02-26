"use client";

// ---------------------------------------------------------------------------
// Badge — status/type indicator
// ---------------------------------------------------------------------------

import React from "react";

type BadgeVariant = "text" | "image" | "original" | "unknown" | "info" | "error";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  text: "badge-text",
  image: "badge-image",
  original: "badge-original",
  unknown: "badge-unknown",
  info: "badge-info",
  error: "badge-error",
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
