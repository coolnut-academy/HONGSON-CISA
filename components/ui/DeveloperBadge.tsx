"use client";

import React from 'react';
import { Sparkles, Code2 } from 'lucide-react';

export const DeveloperBadge = () => {
    return (
        <div className="flex justify-center items-center select-none">
            <div className="group relative inline-flex items-center gap-5.5 px-5 py-2 rounded-full 
                bg-white/80 dark:bg-slate-900/80 
                border-2 border-slate-100 dark:border-slate-800
                backdrop-blur-2xl 
                transition-all duration-300 ease-out 
                hover:scale-105 
                hover:border-amber-200 dark:hover:border-amber-500/30 
                hover:shadow-[0_8px_30px_rgb(251,191,36,0.15)]
            ">

                {/* Ping Animation for 'Live' feel */}
                <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-sm"></span>
                </div>

                <div className="h-4 w-[1.5px] bg-slate-200 dark:bg-slate-700 mx-0.5 rounded-full" />

                {/* Text Content */}
                <div className="flex flex-col sm:flex-row items-baseline sm:gap-1.5 text-sm text-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase text-[10px] sm:text-xs">
                        Developed by
                    </span>
                    <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 dark:from-amber-200 dark:via-yellow-300 dark:to-amber-200 
                        bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent 
                        font-bold tracking-wide shadow-sm"
                        style={{ textShadow: "0 0 40px rgba(251, 191, 36, 0.2)" }}
                    >
                        นายสาธิต ศิริวัชน์
                    </span>
                </div>

                {/* Subtle sheen effect on hover */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            </div>
        </div>
    );
};
