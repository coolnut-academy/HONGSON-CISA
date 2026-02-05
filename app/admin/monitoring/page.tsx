"use client";

import { useEffect, useState } from "react";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, deleteDoc, doc, limit, where, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Submission, Exam } from "@/types";
import {
    Activity,
    Trash2,
    Search,
    RefreshCw,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Filter,
    BookOpen,
    RotateCcw
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";

interface SubmissionWithExam extends Submission {
    id: string;
    examTitle?: string;
}

export default function AdminMonitoringPage() {
    const { isLoading: isRoleLoading } = useRoleProtection(['admin', 'super_admin']);
    const { user } = useAuth();
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    const [submissions, setSubmissions] = useState<SubmissionWithExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'pending' | 'error' | 'archived'>('all');
    const [showArchived, setShowArchived] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState<SubmissionWithExam | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        try {
            // 1. Fetch Exams (for titles)
            // Ideally we should cache this or fetch only needed, but for monitoring list we grab active ones or all
            // For optimization, we can fetch all exams once and create a map
            const examsQuery = query(collection(db, "exams"));
            const examsSnap = await getDocs(examsQuery);
            const examMap = new Map<string, string>();
            examsSnap.forEach(doc => {
                examMap.set(doc.id, doc.data().title);
            });

            // 2. Fetch Submissions
            const submissionsQuery = query(
                collection(db, "submissions"),
                orderBy("submittedAt", "desc"),
                limit(100)
            );

            // 3. Fetch Archives
            const archivesQuery = query(
                collection(db, "submission_archives"),
                orderBy("submittedAt", "desc"),
                limit(50)
            );

            const [submissionsSnap, archivesSnap] = await Promise.all([
                getDocs(submissionsQuery),
                getDocs(archivesQuery)
            ]);

            const submissionsList = submissionsSnap.docs.map(doc => {
                const data = doc.data() as Submission;
                return {
                    ...data,
                    id: doc.id,
                    isArchived: false,
                    examTitle: examMap.get(data.examId) || "Unknown Exam",
                    submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt as any)
                };
            });

            const archivesList = archivesSnap.docs.map(doc => {
                const data = doc.data() as Submission;
                return {
                    ...data,
                    id: doc.id,
                    isArchived: true,
                    status: 'archived',
                    examTitle: examMap.get(data.examId) || "Unknown Exam",
                    submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt as any)
                };
            });

            // Combine and sort
            const combinedList = [...submissionsList, ...archivesList].sort((a, b) => {
                const dateA = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
                const dateB = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0;
                return dateB - dateA;
            });

            setSubmissions(combinedList as any);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isRoleLoading) {
            fetchData();
        }
    }, [isRoleLoading]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDeleteSubmission = async () => {
        if (!submissionToDelete) return;

        setIsDeleting(true);
        try {
            // 1. Archive the submission
            // Sanitize data to remove undefined values (Firestore rejects undefined)
            const cleanData = JSON.parse(JSON.stringify(submissionToDelete));

            await setDoc(doc(db, "submission_archives", submissionToDelete.id), {
                ...cleanData,
                originalSubmissionId: submissionToDelete.id,
                archivedAt: serverTimestamp(),
                archivedBy: user?.uid || 'unknown',
                archivedByEmail: user?.email || 'unknown',
                resetReason: "Admin Reset"
            });

            // 2. Delete the original submission
            await deleteDoc(doc(db, "submissions", submissionToDelete.id));

            setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
            setShowDeleteModal(false);
            setSubmissionToDelete(null);
        } catch (error) {
            console.error("Error deleting submission:", error);
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = (submission: SubmissionWithExam) => {
        setSubmissionToDelete(submission);
        setShowDeleteModal(true);
    };

    // Filter Logic
    const filteredSubmissions = submissions.filter((sub: any) => {
        const matchesSearch =
            (sub.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (sub.examTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all'
            ? (sub.isArchived ? showArchived : true)
            : sub.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string, score?: number) => {
        switch (status) {
            case 'graded':
                return (
                    <GlassBadge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        ตรวจแล้ว ({score}/10)
                    </GlassBadge>
                );
            case 'pending':
                return (
                    <GlassBadge variant="warning" className="flex items-center gap-1">
                        <Clock size={12} />
                        รอตรวจ
                    </GlassBadge>
                );
            case 'error':
                return (
                    <GlassBadge variant="danger" className="flex items-center gap-1">
                        <XCircle size={12} />
                        ผิดพลาด
                    </GlassBadge>
                );
            case 'archived':
                return (
                    <GlassBadge variant="secondary" className="flex items-center gap-1 opacity-70">
                        <RotateCcw size={12} />
                        บันทึกย้อนหลัง
                    </GlassBadge>
                );
            default:
                return <GlassBadge>{status}</GlassBadge>;
        }
    };

    if (isRoleLoading || loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-[var(--accent-primary)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-[var(--accent-primary)]">
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                    ติดตามผลการสอบ
                                </h1>
                                <p className="text-[var(--text-secondary)]">
                                    ดูสถานะและจัดการผลการสอบของนักเรียนแบบเรียลไทม์
                                </p>
                            </div>
                        </div>
                        <GlassButton
                            variant="ghost"
                            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            รีเฟรชข้อมูล
                        </GlassButton>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mt-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === 'all'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                onClick={() => setStatusFilter('graded')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === 'graded'
                                    ? 'bg-[var(--accent-success)] text-white'
                                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                            >
                                ตรวจแล้ว
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === 'pending'
                                    ? 'bg-[var(--accent-warning)] text-white'
                                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                            >
                                รอตรวจ
                            </button>
                            <button
                                onClick={() => setStatusFilter('error')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === 'error'
                                    ? 'bg-[var(--accent-danger)] text-white'
                                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                            >
                                ผิดพลาด
                            </button>
                            <button
                                onClick={() => {
                                    setStatusFilter('archived');
                                    setShowArchived(true);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === 'archived'
                                    ? 'bg-slate-600 text-white'
                                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                            >
                                บันทึกย้อนหลัง (Archived)
                            </button>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <label className="text-sm text-[var(--text-secondary)] flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                />
                                แสดงรายการ Archive ใน 'ทั้งหมด'
                            </label>
                        </div>
                        <div className="relative flex-1 md:max-w-xs ml-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อนักเรียน หรือวิชา..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border-subtle)] focus:border-[var(--accent-primary)] focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Submissions Table */}
            <GlassCard padding="none" hover={false}>
                <div className="overflow-x-auto">
                    <table className="table-glass">
                        <thead>
                            <tr>
                                <th>วันที่ส่ง</th>
                                <th>นักเรียน</th>
                                <th>แบบทดสอบ</th>
                                <th>สถานะ/คะแนน</th>
                                {isAdmin && <th className="text-right">จัดการ</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-[var(--text-tertiary)]">
                                        ไม่พบข้อมูลการสอบ
                                    </td>
                                </tr>
                            ) : (
                                filteredSubmissions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                                            {sub.submittedAt instanceof Date ? sub.submittedAt.toLocaleString('th-TH') : "N/A"}
                                        </td>
                                        <td className="font-medium text-[var(--text-primary)]">
                                            {sub.studentName || "ไม่ระบุชื่อ"}
                                            <div className="text-xs text-[var(--text-tertiary)] font-normal">{sub.studentId}</div>
                                        </td>
                                        <td className="text-[var(--text-secondary)]" title={sub.competency}>
                                            {sub.examTitle}
                                        </td>
                                        <td>
                                            {getStatusBadge(sub.status, sub.score ?? undefined)}
                                        </td>
                                        {isAdmin && (
                                            <td className="text-right space-x-2">
                                                <button
                                                    onClick={() => window.open(`/student/result/${sub.id}`, '_blank')}
                                                    className="p-2 rounded-lg hover:bg-blue-500/10 text-[var(--accent-primary)] hover:text-blue-500 transition-colors"
                                                    title="ดูผลการสอบ (View Result)"
                                                >
                                                    <BookOpen size={18} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(sub)}
                                                    className={`p-2 rounded-lg transition-colors ${(sub as any).isArchived
                                                        ? 'opacity-20 cursor-not-allowed text-[var(--text-tertiary)]'
                                                        : 'hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500'}`}
                                                    title={(sub as any).isArchived ? "รายการถูก Archive แล้ว" : "รีเซ็ตการสอบ (ลบและ Archive)"}
                                                    disabled={(sub as any).isArchived}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Delete Confirmation Modal */}
            <GlassModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="ยืนยันการรีเซ็ตการสอบ"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
                            ยกเลิก
                        </GlassButton>
                        <GlassButton
                            variant="danger"
                            onClick={handleDeleteSubmission}
                            loading={isDeleting}
                        >
                            ยืนยันการลบ
                        </GlassButton>
                    </>
                }
            >
                {submissionToDelete && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
                            <AlertTriangle className="text-red-500 shrink-0" size={24} />
                            <div>
                                <h3 className="font-bold text-red-500">คำเตือน</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    คุณกำลังจะลบผลสอบของนักเรียน <strong>{submissionToDelete.studentName}</strong> <br />
                                    วิชา: <strong>{submissionToDelete.examTitle}</strong>
                                </p>
                            </div>
                        </div>
                        <p className="text-[var(--text-primary)] text-sm">
                            ระบบจะทำการ <strong>บันทึกประวัติการสอบเดิม (Archive)</strong> ไว้ <br />
                            และนักเรียนจะสามารถทำข้อสอบนี้ใหม่ได้ทันที
                        </p>
                    </div>
                )}
            </GlassModal>
        </div>
    );
}
