"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    PlusCircle,
    Activity,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldAlert
} from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Create Exam", href: "/admin/exams/create", icon: PlusCircle },
        { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100">
            <aside
                className={`${collapsed ? "w-20" : "w-64"} bg-slate-900 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 shadow-xl z-50`}
            >
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
                    {!collapsed && (
                        <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            CISA Admin
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ${collapsed && "mx-auto"}`}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                  ${isActive
                                        ? "bg-emerald-600/20 text-emerald-400"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }
                  ${collapsed ? "justify-center" : ""}
                `}
                                title={collapsed ? item.name : ""}
                            >
                                <item.icon size={20} className={isActive ? "text-emerald-400" : ""} />
                                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    {!collapsed ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ShieldAlert size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">
                                    {user?.email}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.role}</p>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                onClick={() => logout()}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto h-screen bg-slate-100 dark:bg-black/20">
                {children}
            </main>
        </div>
    );
}
