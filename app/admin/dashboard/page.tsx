"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { PlusCircle, FileText, ArrowRight, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
    const { isLoading } = useRoleProtection(['admin', 'super_admin']);
    const { user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    const isSuperAdmin = user?.role === "super_admin";

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                    แผงควบคุมแอดมิน
                                </h1>
                                <GlassBadge variant="success" icon={<Sparkles size={12} />}>
                                    Active
                                </GlassBadge>
                            </div>
                            <p className="text-[var(--text-secondary)] text-lg">
                                กำลังดูแลสมรรถนะ: <span className="text-[var(--accent-success)] font-semibold">{user?.assignedCompetency || "ทุกสมรรถนะ"}</span>
                            </p>
                        </div>
                        
                        {isSuperAdmin && (
                            <Link 
                                href="/super-admin/dashboard" 
                                className="btn-glass btn-secondary btn-sm"
                            >
                                กลับไปหน้า Super Admin
                            </Link>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-[var(--accent-primary)]" />
                    เครื่องมือด่วน
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create Exam Card */}
                    <Link href="/admin/exams/create" className="group">
                        <GlassCard className="h-full flex flex-col">
                            <div className="p-3 w-fit rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)] mb-4 group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                                สร้างข้อสอบใหม่
                            </h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">
                                สร้างแบบทดสอบประเมินสมรรถนะใหม่พร้อมเกณฑ์การให้คะแนนด้วย AI
                            </p>
                            <div className="flex items-center text-[var(--accent-success)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                                เริ่มสร้าง <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </GlassCard>
                    </Link>

                    {/* Monitoring Card */}
                    <Link href="/admin/monitoring" className="group">
                        <GlassCard className="h-full flex flex-col">
                            <div className="p-3 w-fit rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-[var(--accent-primary)] mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                                ตรวจสอบผลสอบ
                            </h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">
                                ดูความคืบหน้าและผลสอบของนักเรียนแบบเรียลไทม์
                            </p>
                            <div className="flex items-center text-[var(--accent-primary)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                                ดูรายงาน <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </GlassCard>
                    </Link>
                </div>
            </div>
        </div>
    );
}
