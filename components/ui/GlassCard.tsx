"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "static" | "solid";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

export function GlassCard({
  children,
  variant = "default",
  hover = true,
  padding = "md",
  className,
  ...props
}: GlassCardProps) {
  const baseClasses = variant === "static" || !hover 
    ? "glass-card-static" 
    : variant === "solid" 
      ? "glass-solid rounded-[var(--radius-2xl)]" 
      : "glass-card";

  return (
    <div
      className={cn(baseClasses, paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
