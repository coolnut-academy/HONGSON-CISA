"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassSidebar } from "@/components/ui/GlassSidebar";
import {
    LayoutDashboard,
    History,
    BookOpen,
} from "lucide-react";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { logout, user } = useAuth();

    const navItems = [
        { name: "แดชบอร์ด", href: "/student/dashboard", icon: LayoutDashboard },
        { name: "ประวัติการสอบ", href: "/student/history", icon: History },
    ];

    return (
        <div className="min-h-screen bg-mesh flex font-sans">
            <GlassSidebar
                navItems={navItems}
                title="Hongson-CISA"
                subtitle="ระบบประเมินสมรรถนะ"
                accentColor="blue"
                user={{
                    name: user?.firstName || user?.email?.split("@")[0],
                    email: user?.email ?? undefined,
                    photoURL: user?.photoURL ?? undefined,
                    role: user?.classRoom ? `ห้อง ${user.classRoom}` : "นักเรียน",
                }}
                onLogout={logout}
            />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen md:ml-0 ml-0 pt-20 md:pt-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
