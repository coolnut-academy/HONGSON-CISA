"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowLeft, Construction } from "lucide-react";

type RoleColor = "student" | "admin" | "super_admin" | "general_user";

interface FeaturePlaceholderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    role?: RoleColor;
    backLink?: string;
    backLabel?: string;
}

export function FeaturePlaceholder({
    title,
    description,
    icon: Icon = Construction,
    role = "student",
    backLink,
    backLabel = "Back to Dashboard"
}: FeaturePlaceholderProps) {

    // Theme configuration based on role
    const themes = {
        student: {
            gradient: "from-blue-600 to-cyan-500",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            text: "text-blue-600 dark:text-blue-400",
            border: "border-blue-100 dark:border-blue-800",
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
        },
        admin: {
            gradient: "from-purple-600 to-fuchsia-500",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            text: "text-purple-600 dark:text-purple-400",
            border: "border-purple-100 dark:border-purple-800",
            button: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
        },
        super_admin: {
            gradient: "from-red-600 to-orange-500",
            bg: "bg-red-50 dark:bg-red-900/20",
            text: "text-red-600 dark:text-red-400",
            border: "border-red-100 dark:border-red-800",
            button: "bg-red-600 hover:bg-red-700 shadow-red-500/30"
        },
        general_user: {
            gradient: "from-slate-600 to-slate-500",
            bg: "bg-slate-50 dark:bg-slate-900/20",
            text: "text-slate-600 dark:text-slate-400",
            border: "border-slate-100 dark:border-slate-800",
            button: "bg-slate-700 hover:bg-slate-800 shadow-slate-500/30"
        }
    };

    const theme = themes[role];
    const dashboardLink = backLink || `/${role === 'general_user' ? 'general' : role.replace('_', '-')}/dashboard`;

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className={`
        relative w-full max-w-lg p-8 rounded-3xl 
        bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl 
        border border-white/50 dark:border-white/10 
        shadow-2xl text-center overflow-hidden
      `}>

                {/* Background blobs */}
                <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br ${theme.gradient} blur-[60px] opacity-20`} />
                <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-tr ${theme.gradient} blur-[60px] opacity-20`} />

                <div className="relative z-10 flex flex-col items-center">
                    {/* Icon Circle */}
                    <div className={`w-20 h-20 rounded-2xl ${theme.bg} ${theme.border} flex items-center justify-center mb-6 shadow-inner`}>
                        <Icon className={`w-10 h-10 ${theme.text}`} />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        {title}
                    </h1>

                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 uppercase tracking-widest mb-6 border border-slate-200 dark:border-slate-700">
                        Coming Soon • Phase 2
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
                        {description}
                    </p>

                    <Link
                        href={dashboardLink}
                        className={`
              flex items-center gap-2 px-6 py-3 rounded-xl 
              text-white font-medium transition-all active:scale-95
              shadow-lg hover:shadow-xl ${theme.button}
            `}
                    >
                        <ArrowLeft size={18} />
                        {backLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}
