"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import Link from "next/link";
import { ShieldCheck, Cpu, LayoutDashboard, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";

export default function SuperAdminDashboard() {
    const { isLoading } = useRoleProtection(['super_admin']);
    const { user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-secondary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldCheck className="w-8 h-8 text-[var(--accent-secondary)]" />
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                    ศูนย์ควบคุมระบบ
                                </h1>
                                <GlassBadge variant="secondary">Super Admin</GlassBadge>
                            </div>
                            <p className="text-[var(--text-secondary)] text-lg">
                                ยินดีต้อนรับ <span className="text-[var(--accent-secondary)] font-semibold">{user?.firstName || user?.email?.split("@")[0]}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Control */}
                <Link href="/super-admin/ai-control" className="group">
                    <GlassCard className="h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-500 group-hover:scale-110 transition-transform">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">ควบคุม AI</h3>
                                <p className="text-xs text-[var(--text-tertiary)]">จัดการระบบตรวจข้อสอบอัตโนมัติ</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">
                            ตั้งค่าและสั่งให้ AI ตรวจข้อสอบที่รอดำเนินการ
                        </p>
                        <div className="flex items-center text-cyan-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all">
                            เปิดแผงควบคุม <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </GlassCard>
                </Link>

                {/* Admin Dashboard Link */}
                <Link href="/admin/dashboard" className="group">
                    <GlassCard className="h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)] group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">หน้าแอดมิน</h3>
                                <p className="text-xs text-[var(--text-tertiary)]">เครื่องมือสำหรับครู/แอดมิน</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">
                            สร้างข้อสอบ ตรวจสอบผลสอบ และจัดการแบบทดสอบ
                        </p>
                        <div className="flex items-center text-[var(--accent-success)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all">
                            ไปยังหน้าแอดมิน <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </GlassCard>
                </Link>
            </div>
        </div>
    );
}
