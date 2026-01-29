"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";

export default function DevRoleSwitcher() {
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        // Check if we are in development environment
        if (process.env.NODE_ENV === "development") {
            setIsDev(true);
        }
    }, []);

    if (!isDev) return null;

    return (
        <Link
            href="/dev/setup"
            className="fixed bottom-4 right-4 z-50 p-3 bg-slate-900 border border-slate-700 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all group"
            title="Developer Setup"
        >
            <Wrench className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Dev Tools
            </span>
        </Link>
    );
}
