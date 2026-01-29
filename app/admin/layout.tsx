"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassSidebar } from "@/components/ui/GlassSidebar";
import {
    LayoutDashboard,
    PlusCircle,
    Activity,
} from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { logout, user } = useAuth();

    const navItems = [
        { name: "แดชบอร์ด", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "สร้างข้อสอบ", href: "/admin/exams/create", icon: PlusCircle },
        { name: "ตรวจสอบผลสอบ", href: "/admin/monitoring", icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-mesh flex font-sans">
            <GlassSidebar
                navItems={navItems}
                title="ผู้ดูแลระบบ"
                subtitle="Admin Panel"
                accentColor="emerald"
                user={{
                    name: user?.firstName || user?.email?.split("@")[0],
                    email: user?.email ?? undefined,
                    photoURL: user?.photoURL ?? undefined,
                    role: user?.assignedCompetency || "Admin",
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
