"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Users,
    Cpu,
    LogOut,
    Settings
} from "lucide-react";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
        { name: "Manage Users", href: "/super-admin/users", icon: Users },
        { name: "AI Control", href: "/super-admin/ai-control", icon: Cpu },
    ];

    return (
        <div className="min-h-screen bg-black flex font-sans text-slate-100">
            <aside className="w-20 lg:w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-screen sticky top-0">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-900">
                    <div className="w-8 h-8 rounded bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0" />
                    <span className="ml-3 font-bold text-lg hidden lg:block tracking-tighter">SUPER ADMIN</span>
                </div>

                <nav className="flex-1 py-8 space-y-4 px-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? "bg-purple-900/20 text-purple-400"
                                        : "text-slate-500 hover:text-slate-200 hover:bg-slate-900"
                                    }
                  justify-center lg:justify-start
                `}
                            >
                                <item.icon size={24} />
                                <span className="hidden lg:block font-medium">{item.name}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 hidden lg:block" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-900 flex justify-center lg:justify-start">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="hidden lg:block font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
