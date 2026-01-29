"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Exam, Submission } from "@/types";
import {
    BookOpen,
    PlayCircle,
    Clock,
    CheckCircle2,
    Loader2,
    Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";

// The 6 Competency Categories in order - Mapped to Display Names if needed, 
// but using the Database keys for lookup to match exam.competency
const COMPETENCIES = [
    "Scientific Explanations",
    "Data Interpretation",
    "Inquiry Design",
    "Argumentation",
    "Societal Implications",
    "Nature of Science"
];

// Display text mapping
const COMP_DISPLAY_TH: Record<string, string> = {
    "Scientific Explanations": "1. การอธิบายเชิงวิทยาศาสตร์ (Scientific Explanations)",
    "Data Interpretation": "2. การแปลความหมายข้อมูลและประจักษ์พยาน (Data Interpretation)",
    "Inquiry Design": "3. การออกแบบและประเมินกระบวนการสืบเสาะ (Inquiry Design)",
    "Argumentation": "4. การสร้างข้อโต้แย้งทางวิทยาศาสตร์ (Argumentation)",
    "Societal Implications": "5. ผลกระทบของวิทยาศาสตร์ต่อสังคม (Societal Implications)",
    "Nature of Science": "6. ธรรมชาติของวิทยาศาสตร์ (Nature of Science)"
};


interface ExamWithStatus extends Exam {
    submission?: Submission;
}

export default function StudentDashboard() {
    const { isLoading: isAuthLoading } = useRoleProtection(['student']);
    const { user, logout } = useAuth();

    const [examsByCompetency, setExamsByCompetency] = useState<Record<string, ExamWithStatus[]>>({});
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                // 1. Fetch Active Exams
                const examsQuery = query(
                    collection(db, "exams"),
                    where("isActive", "==", true),
                    orderBy("createdAt", "desc")
                );
                const examsSnap = await getDocs(examsQuery);
                const examsList = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));

                // 2. Fetch User Submissions
                const submissionsQuery = query(
                    collection(db, "submissions"),
                    where("studentId", "==", user.uid)
                );
                const submissionsSnap = await getDocs(submissionsQuery);
                const submissionsList = submissionsSnap.docs.map(doc => doc.data() as Submission);

                // 3. Map Submissions to Exams
                const processedExams: Record<string, ExamWithStatus[]> = {};

                // Initialize categories
                COMPETENCIES.forEach(comp => {
                    processedExams[comp] = [];
                });

                examsList.forEach(exam => {
                    const userSubmission = submissionsList.find(sub => sub.examId === exam.id);
                    const examWithStatus = { ...exam, submission: userSubmission };

                    // Simple fuzzy matching or direct mapping
                    const key = COMPETENCIES.find(c => exam.competency.includes(c)) || "Other";

                    if (processedExams[key]) {
                        processedExams[key].push(examWithStatus);
                    } else {
                        if (!processedExams["Other"]) processedExams["Other"] = [];
                        processedExams["Other"].push(examWithStatus);
                    }
                });

                setExamsByCompetency(processedExams);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoadingData(false);
            }
        }

        if (!isAuthLoading) {
            fetchData();
        }
    }, [user, isAuthLoading]);

    if (isAuthLoading || loadingData) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-[var(--accent-primary)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                    สวัสดี, {user?.firstName ? user.firstName : (user?.email?.split('@')[0] || "นักเรียน")}!
                                </h1>
                                <GlassBadge variant="primary" icon={<Sparkles size={12} />}>
                                    {user?.classRoom ? `ม.${user.classRoom}` : "นักเรียน"}
                                </GlassBadge>
                            </div>
                            <p className="text-[var(--text-secondary)] text-lg">
                                ติดตามความคืบหน้าและเริ่มทำแบบทดสอบสมรรถนะของคุณได้ที่นี่
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Competency Categories */}
            <div className="space-y-12">
                {COMPETENCIES.map((category) => (
                    <div key={category} className="scroll-mt-24" id={category.replace(/\s+/g, '-').toLowerCase()}>
                        <div className="flex items-center gap-3 mb-6 border-b border-[var(--glass-border-subtle)] pb-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-[var(--accent-primary)]">
                                <BookOpen size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                {COMP_DISPLAY_TH[category] || category}
                            </h2>
                            <GlassBadge className="ml-auto">
                                {examsByCompetency[category]?.length || 0} แบบทดสอบ
                            </GlassBadge>
                        </div>

                        {/* Exam Grid */}
                        {!examsByCompetency[category] || examsByCompetency[category].length === 0 ? (
                            <GlassCard hover={false} className="text-center border-dashed">
                                <p className="text-[var(--text-tertiary)] font-medium">ยังไม่มีแบบทดสอบที่เปิดใช้งานในขณะนี้</p>
                            </GlassCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {examsByCompetency[category].map((exam) => (
                                    <GlassCard
                                        key={exam.id}
                                        className="flex flex-col group relative overflow-hidden"
                                    >
                                        {/* Card Status Indicator Border */}
                                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-full
                                            ${!exam.submission ? 'bg-[var(--accent-primary)]' :
                                                exam.submission.status === 'pending' ? 'bg-[var(--accent-warning)]' :
                                                    exam.submission.status === 'graded' ? 'bg-[var(--accent-success)]' : 'bg-[var(--text-tertiary)]'}
                                        `} />

                                        <div className="flex-1 mb-6 pl-2">
                                            <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2 line-clamp-2" title={exam.title}>
                                                {exam.title}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                                                {exam.scenario}
                                            </p>
                                        </div>

                                        <div className="pl-2 mt-auto">
                                            {!exam.submission ? (
                                                <Link
                                                    href={`/student/exam/${exam.id}`}
                                                    className="btn-glass btn-primary w-full"
                                                >
                                                    <PlayCircle size={18} /> เริ่มทำแบบทดสอบ
                                                </Link>
                                            ) : exam.submission.status === 'pending' ? (
                                                <div className="w-full flex items-center justify-center gap-2 badge-glass badge-warning py-3 px-4">
                                                    <Clock size={18} /> รอการตรวจผล
                                                </div>
                                            ) : (
                                                <div className="w-full flex items-center justify-between badge-glass badge-success py-3 px-4">
                                                    <span className="flex items-center gap-2 text-sm"><CheckCircle2 size={18} /> ตรวจแล้ว</span>
                                                    <span className="text-lg font-bold">{exam.submission.score}/10</span>
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
