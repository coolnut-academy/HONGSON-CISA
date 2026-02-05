"use client";

import { useEffect, useState } from "react";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Submission } from "@/types";
import {
    History,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    RotateCcw,
    Trophy,
    TrendingUp,
    FileText,
    ArrowRight
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";

interface HistoryItem extends Submission {
    id: string;
    type: 'active' | 'archive';
    archivedAt?: any;
    resetReason?: string;
}

export default function StudentHistoryPage() {
    const { isLoading: isRoleLoading } = useRoleProtection(['student']);
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid || isRoleLoading) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Active Submissions
                const subQuery = query(
                    collection(db, "submissions"),
                    where("studentId", "==", user.uid)
                );

                // 2. Fetch Archived Submissions
                const archiveQuery = query(
                    collection(db, "submission_archives"),
                    where("studentId", "==", user.uid)
                );

                const [subSnap, archiveSnap] = await Promise.all([
                    getDocs(subQuery),
                    getDocs(archiveQuery)
                ]);

                const activeItems = subSnap.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    type: 'active'
                })) as HistoryItem[];

                const archiveItems = archiveSnap.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    type: 'archive'
                })) as HistoryItem[];

                // Combine and sort by submittedAt (newest first) - Client side search to avoid index issues
                const allItems = [...activeItems, ...archiveItems].sort((a, b) => {
                    const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
                    const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                setHistory(allItems);

            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isRoleLoading]);

    if (isRoleLoading || loading) {
        return <div className="flex justify-center items-center py-20 text-[var(--accent-primary)] animate-pulse">Loading History...</div>;
    }

    // Calculate Stats
    const totalExams = history.length;
    const gradedExams = history.filter(h => h.status === 'graded' && h.score !== null);
    const averageScore = gradedExams.length > 0
        ? (gradedExams.reduce((acc, curr) => acc + (curr.score || 0), 0) / gradedExams.length).toFixed(1)
        : "N/A";

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-purple-400">
                            <History className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                ประวัติการสอบ
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Timeline การสอบและพัฒนาการของคุณ
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="flex flex-col items-center justify-center p-4">
                    <div className="text-[var(--text-secondary)] text-sm mb-1">การสอบทั้งหมด</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{totalExams}</div>
                </GlassCard>
                <GlassCard className="flex flex-col items-center justify-center p-4">
                    <div className="text-[var(--text-secondary)] text-sm mb-1">คะแนนเฉลี่ย</div>
                    <div className="text-2xl font-bold text-[var(--accent-success)]">{averageScore}</div>
                </GlassCard>
                {/* Add clearly graded count */}
                <GlassCard className="flex flex-col items-center justify-center p-4">
                    <div className="text-[var(--text-secondary)] text-sm mb-1">ตรวจแล้ว</div>
                    <div className="text-2xl font-bold text-[var(--accent-primary)]">{gradedExams.length}</div>
                </GlassCard>
                <GlassCard className="flex flex-col items-center justify-center p-4">
                    <div className="text-[var(--text-secondary)] text-sm mb-1">รอตรวจ</div>
                    <div className="text-2xl font-bold text-[var(--accent-warning)]">
                        {history.filter(h => h.status === 'pending').length}
                    </div>
                </GlassCard>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] px-2">Timeline กิจกรรม</h2>

                {history.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-tertiary)] bg-[var(--glass-bg-subtle)] rounded-2xl">
                        ยังไม่มีประวัติการสอบ
                    </div>
                ) : (
                    history.map((item) => {
                        const submittedDate = item.submittedAt?.toDate ? item.submittedAt.toDate() : new Date(item.submittedAt);
                        const isArchived = item.type === 'archive';

                        return (
                            <GlassCard key={`${item.id}-${item.type}`} className={`group relative transition-all duration-300 ${isArchived ? 'opacity-75 grayscale-[0.3]' : 'hover:scale-[1.01] hover:border-[var(--accent-primary)]'}`}>
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    {/* Icon / Status */}
                                    <div className="shrink-0 pt-1 md:pt-0">
                                        {isArchived ? (
                                            <div className="p-3 rounded-full bg-slate-500/10 text-slate-400">
                                                <RotateCcw size={24} />
                                            </div>
                                        ) : item.status === 'graded' ? (
                                            <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                                                <Trophy size={24} />
                                            </div>
                                        ) : item.status === 'error' ? (
                                            <div className="p-3 rounded-full bg-red-500/10 text-red-500">
                                                <XCircle size={24} />
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                                                <Clock size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-[var(--text-primary)] truncate pr-2">
                                                {item.competency || "แบบทดสอบไม่ระบุชื่อ"}
                                            </h3>
                                            {isArchived && (
                                                <GlassBadge variant="secondary" className="text-xs py-0.5 px-2">
                                                    Reset / Archived
                                                </GlassBadge>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-tertiary)]">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {submittedDate.toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            {item.score !== null && item.score !== undefined && (
                                                <div className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
                                                    <TrendingUp size={14} className="text-[var(--accent-success)]" />
                                                    Score: {item.score}/10
                                                </div>
                                            )}
                                        </div>

                                        {/* Reset Info if archived */}
                                        {isArchived && item.archivedAt && (
                                            <div className="mt-2 text-xs text-[var(--text-tertiary)] italic border-l-2 border-[var(--glass-border)] pl-2">
                                                ถูกรีเซ็ตเมื่อ: {item.archivedAt?.toDate ? item.archivedAt.toDate().toLocaleDateString('th-TH') : "N/A"}
                                                <br />
                                                โดย: Admin
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    {(item.status === 'graded' || isArchived) && (
                                        <div className="w-full md:w-auto mt-2 md:mt-0">
                                            <GlassButton
                                                variant="outline"
                                                size="sm"
                                                className="w-full md:w-auto"
                                                onClick={() => window.location.href = `/student/result/${item.id}`}
                                            >
                                                <FileText size={16} className="mr-2" />
                                                ดูผลละเอียด
                                            </GlassButton>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })
                )}
            </div>
        </div>
    );
}
