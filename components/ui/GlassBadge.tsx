"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "badge-glass",
  primary: "badge-glass badge-primary",
  secondary: "badge-glass badge-secondary",
  success: "badge-glass badge-success",
  warning: "badge-glass badge-warning",
  danger: "badge-glass badge-danger",
};

export function GlassBadge({
  children,
  variant = "default",
  icon,
  className,
}: GlassBadgeProps) {
  return (
    <span className={cn(variantClasses[variant], className)}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export default GlassBadge;
