"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import { Exam } from "@/types";
import {
    Loader2,
    Search,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    AlertTriangle,
    FileText,
    MonitorPlay,
    Filter,
    Copy,
    CheckCircle,
    ArrowLeft,
    RefreshCw,
    LayoutGrid,
    List
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";

interface ExamWithDuplicates extends Exam {
    possibleDuplicates?: string[];
    isDuplicate?: boolean;
}

export default function SuperAdminExamsPage() {
    const { isLoading: isAuthLoading } = useRoleProtection(['super_admin']);
    const [exams, setExams] = useState<ExamWithDuplicates[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "duplicates">("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchExams = async () => {
        try {
            const examsQuery = query(
                collection(db, "exams"),
                orderBy("createdAt", "desc")
            );
            const examsSnap = await getDocs(examsQuery);
            const examsList = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamWithDuplicates));

            // Detect duplicates by comparing titles
            const titleCounts = new Map<string, string[]>();
            examsList.forEach(exam => {
                const normalizedTitle = exam.title.toLowerCase().trim();
                if (!titleCounts.has(normalizedTitle)) {
                    titleCounts.set(normalizedTitle, []);
                }
                titleCounts.get(normalizedTitle)!.push(exam.id!);
            });

            // Mark duplicates
            const processedExams = examsList.map(exam => {
                const normalizedTitle = exam.title.toLowerCase().trim();
                const duplicateIds = titleCounts.get(normalizedTitle) || [];
                if (duplicateIds.length > 1) {
                    return {
                        ...exam,
                        possibleDuplicates: duplicateIds.filter(id => id !== exam.id),
                        isDuplicate: true
                    };
                }
                return exam;
            });

            setExams(processedExams);
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            fetchExams();
        }
    }, [isAuthLoading]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchExams();
    };

    const handleDelete = async (examId: string, examTitle: string) => {
        if (!confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบข้อสอบ "${examTitle}"?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
            return;
        }

        setDeletingId(examId);
        try {
            await deleteDoc(doc(db, "exams", examId));
            setExams(prev => prev.filter(e => e.id !== examId));
        } catch (error) {
            console.error("Error deleting exam:", error);
            alert("เกิดข้อผิดพลาดในการลบข้อสอบ");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (examId: string, currentStatus: boolean) => {
        setTogglingId(examId);
        try {
            await updateDoc(doc(db, "exams", examId), {
                isActive: !currentStatus
            });
            setExams(prev => prev.map(e =>
                e.id === examId ? { ...e, isActive: !currentStatus } : e
            ));
        } catch (error) {
            console.error("Error toggling exam status:", error);
            alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        } finally {
            setTogglingId(null);
        }
    };

    // Filter and search
    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            // Search filter
            const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.competency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.scenario?.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            let matchesFilter = true;
            if (filterStatus === "active") matchesFilter = exam.isActive;
            else if (filterStatus === "inactive") matchesFilter = !exam.isActive;
            else if (filterStatus === "duplicates") matchesFilter = exam.isDuplicate || false;

            return matchesSearch && matchesFilter;
        });
    }, [exams, searchTerm, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        const total = exams.length;
        const active = exams.filter(e => e.isActive).length;
        const inactive = exams.filter(e => !e.isActive).length;
        const duplicates = exams.filter(e => e.isDuplicate).length;
        const simulations = exams.filter(e => e.mediaType === 'simulation').length;
        return { total, active, inactive, duplicates, simulations };
    }, [exams]);

    if (isAuthLoading || loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-[var(--accent-primary)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Back Button */}
            <div className="flex items-center gap-4">
                <Link
                    href="/super-admin/dashboard"
                    className="p-2 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                        📚 คลังข้อสอบทั้งหมด
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        จัดการ ค้นหา และแก้ไขข้อสอบทั้งหมดในระบบ
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <GlassCard padding="sm" hover={false} className="text-center">
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">ข้อสอบทั้งหมด</p>
                </GlassCard>
                <GlassCard padding="sm" hover={false} className="text-center">
                    <p className="text-3xl font-bold text-emerald-500">{stats.active}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">เปิดใช้งาน</p>
                </GlassCard>
                <GlassCard padding="sm" hover={false} className="text-center">
                    <p className="text-3xl font-bold text-slate-500">{stats.inactive}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">ปิดใช้งาน</p>
                </GlassCard>
                <GlassCard padding="sm" hover={false} className="text-center">
                    <p className="text-3xl font-bold text-amber-500">{stats.duplicates}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">ซ้ำกัน</p>
                </GlassCard>
                <GlassCard padding="sm" hover={false} className="text-center">
                    <p className="text-3xl font-bold text-purple-500">{stats.simulations}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Simulations</p>
                </GlassCard>
            </div>

            {/* Duplicate Warning */}
            {stats.duplicates > 0 && (
                <GlassCard hover={false} className="border-amber-500/50 bg-amber-500/5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                                ⚠️ พบข้อสอบที่อาจซ้ำกัน {stats.duplicates} รายการ
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                ระบบพบข้อสอบที่มีชื่อเหมือนกัน กรุณาตรวจสอบและลบข้อสอบที่ซ้ำออก เพื่อไม่ให้นักเรียนเห็นข้อสอบซ้ำกัน
                            </p>
                            <button
                                onClick={() => setFilterStatus("duplicates")}
                                className="mt-2 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                                ดูเฉพาะข้อสอบซ้ำ →
                            </button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Search and Filters */}
            <GlassCard hover={false}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาข้อสอบ ชื่อ สมรรถนะ หรือเนื้อหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all text-[var(--text-primary)]"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilterStatus("all")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === "all"
                                ? "bg-[var(--accent-primary)] text-white"
                                : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]"
                                }`}
                        >
                            ทั้งหมด
                        </button>
                        <button
                            onClick={() => setFilterStatus("active")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === "active"
                                ? "bg-emerald-500 text-white"
                                : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]"
                                }`}
                        >
                            <Eye size={14} className="inline mr-1" /> เปิดใช้งาน
                        </button>
                        <button
                            onClick={() => setFilterStatus("inactive")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === "inactive"
                                ? "bg-slate-500 text-white"
                                : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]"
                                }`}
                        >
                            <EyeOff size={14} className="inline mr-1" /> ปิดใช้งาน
                        </button>
                        <button
                            onClick={() => setFilterStatus("duplicates")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === "duplicates"
                                ? "bg-amber-500 text-white"
                                : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]"
                                }`}
                        >
                            <Copy size={14} className="inline mr-1" /> ซ้ำกัน
                        </button>
                    </div>

                    {/* View Mode & Refresh */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                            className="p-3 rounded-xl bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)] transition-colors"
                            title={viewMode === "list" ? "Grid View" : "List View"}
                        >
                            {viewMode === "list" ? <LayoutGrid size={20} /> : <List size={20} />}
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 rounded-xl bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)] transition-colors disabled:opacity-50"
                            title="รีเฟรช"
                        >
                            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Exams List */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {filteredExams.length === 0 ? (
                    <GlassCard hover={false} className="col-span-full text-center py-10">
                        <p className="text-[var(--text-tertiary)]">ไม่พบข้อสอบที่ตรงกับเงื่อนไข</p>
                    </GlassCard>
                ) : (
                    filteredExams.map((exam) => (
                        <GlassCard
                            key={exam.id}
                            className={`relative overflow-hidden ${exam.isDuplicate ? "border-amber-500/50" : ""}`}
                        >
                            {/* Status indicator */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${exam.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />

                            <div className="flex flex-col md:flex-row gap-4 pl-3">
                                {/* Main Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-2">
                                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1" title={exam.title}>
                                            {exam.title}
                                        </h3>
                                        {exam.isDuplicate && (
                                            <GlassBadge variant="warning" className="flex-shrink-0">
                                                <Copy size={10} className="mr-1" /> ซ้ำ
                                            </GlassBadge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <GlassBadge variant={exam.isActive ? "success" : "secondary"}>
                                            {exam.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                        </GlassBadge>
                                        <GlassBadge variant={exam.mediaType === 'simulation' ? "primary" : "secondary"}>
                                            {exam.mediaType === 'simulation' ? (
                                                <><MonitorPlay size={10} className="mr-1" /> Simulation</>
                                            ) : (
                                                <><FileText size={10} className="mr-1" /> Text</>
                                            )}
                                        </GlassBadge>
                                        <GlassBadge variant="secondary">
                                            {exam.items?.length || 0} ข้อย่อย
                                        </GlassBadge>
                                    </div>

                                    <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-2">
                                        {exam.competency}
                                    </p>

                                    {exam.mediaType === 'simulation' && exam.mediaUrl && (
                                        <p className="text-xs text-purple-500 dark:text-purple-400 line-clamp-1 mb-2">
                                            🔗 {exam.mediaUrl}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex md:flex-col gap-2 justify-end">
                                    <Link href={`/super-admin/exams/${exam.id}/edit`}>
                                        <GlassButton
                                            variant="ghost"
                                            size="sm"
                                            icon={<Edit3 size={16} />}
                                            className="w-full"
                                        >
                                            <span className="hidden md:inline">แก้ไข</span>
                                        </GlassButton>
                                    </Link>
                                    <GlassButton
                                        variant="ghost"
                                        size="sm"
                                        icon={togglingId === exam.id ? <Loader2 size={16} className="animate-spin" /> : (exam.isActive ? <EyeOff size={16} /> : <Eye size={16} />)}
                                        onClick={() => handleToggleActive(exam.id!, exam.isActive)}
                                        disabled={togglingId === exam.id}
                                        className={exam.isActive ? "text-slate-500" : "text-emerald-500"}
                                    >
                                        <span className="hidden md:inline">{exam.isActive ? "ปิด" : "เปิด"}</span>
                                    </GlassButton>
                                    <GlassButton
                                        variant="ghost"
                                        size="sm"
                                        icon={deletingId === exam.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        onClick={() => handleDelete(exam.id!, exam.title)}
                                        disabled={deletingId === exam.id}
                                        className="text-red-500 hover:bg-red-500/10"
                                    >
                                        <span className="hidden md:inline">ลบ</span>
                                    </GlassButton>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Results count */}
            <p className="text-center text-sm text-[var(--text-tertiary)]">
                แสดง {filteredExams.length} จาก {exams.length} รายการ
            </p>
        </div>
    );
}
