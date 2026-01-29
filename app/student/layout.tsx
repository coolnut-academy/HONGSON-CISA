"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    UserCircle,
    Menu,
    X,
    LogOut,
    ChevronRight
} from "lucide-react";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const pathname = usePathname();
    const { logout, user } = useAuth();

    // Mobile check could be added here for default state

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [
        { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
        { name: "My Profile", href: "/student/profile", icon: UserCircle },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100">
            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shadow-sm"
            >
                <div className="flex items-center justify-between p-6 h-20">
                    <div className={`font-bold text-xl text-blue-600 flex items-center gap-3 overflow-hidden whitespace-nowrap ${!isSidebarOpen && "w-0 px-0 opacity-0"}`}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0" />
                        <span>Hongson-CISA</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        {isSidebarOpen ? <Menu size={20} /> : <div className="mx-auto"><Menu size={20} /></div>}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                                    }
                `}
                            >
                                <item.icon size={22} className={`${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
                                {isSidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                                {isSidebarOpen && isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-full h-full p-1 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {user?.firstName || user?.email?.split('@')[0] || "Student"}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                onClick={() => logout()}
                                className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen scrollbar-hide">
                {children}
            </main>

            {/* Mobile Nav Overlay could participate here if needed, keeping it simple for now */}
        </div>
    );
}
