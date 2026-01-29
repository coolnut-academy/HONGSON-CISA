"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--text-primary)]"
          >
            {label}
            {props.required && <span className="text-[var(--accent-danger)] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-glass",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[var(--accent-danger)] focus:border-[var(--accent-danger)]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-[var(--accent-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-[var(--text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--text-primary)]"
          >
            {label}
            {props.required && <span className="text-[var(--accent-danger)] ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "textarea-glass",
            error && "border-[var(--accent-danger)] focus:border-[var(--accent-danger)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--accent-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-[var(--text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = "GlassTextarea";

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, hint, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--text-primary)]"
          >
            {label}
            {props.required && <span className="text-[var(--accent-danger)] ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "select-glass",
            error && "border-[var(--accent-danger)] focus:border-[var(--accent-danger)]",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-[var(--accent-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-[var(--text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = "GlassSelect";

export default GlassInput;
