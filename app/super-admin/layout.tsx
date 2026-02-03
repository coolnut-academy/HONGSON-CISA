"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassSidebar } from "@/components/ui/GlassSidebar";
import {
    LayoutDashboard,
    Users,
    Cpu,
    Settings,
    BookOpen,
} from "lucide-react";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { logout, user } = useAuth();

    const navItems = [
        { name: "แดชบอร์ด", href: "/super-admin/dashboard", icon: LayoutDashboard },
        { name: "คลังข้อสอบ", href: "/super-admin/exams", icon: BookOpen },
        { name: "จัดการผู้ใช้งาน", href: "/super-admin/users", icon: Users },
        { name: "ควบคุม AI", href: "/super-admin/ai-control", icon: Cpu },
        { name: "ตั้งค่าระบบ", href: "/super-admin/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-mesh flex font-sans">
            <GlassSidebar
                navItems={navItems}
                title="Super Admin"
                subtitle="ศูนย์ควบคุมระบบ"
                accentColor="purple"
                user={{
                    name: user?.firstName || user?.email?.split("@")[0],
                    email: user?.email ?? undefined,
                    photoURL: user?.photoURL ?? undefined,
                    role: "ผู้ดูแลสูงสุด",
                }}
                onLogout={logout}
            />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
