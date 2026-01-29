"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { Exam, Submission } from "@/types";
import {
    Award,
    RotateCcw,
    Clock,
    CheckCircle2,
    ChevronRight,
    Loader2,
    BookOpen
} from "lucide-react";

interface ExamProgress extends Exam {
    latestSubmission?: Submission;
    historyCount: number;
}

export default function GeneralDashboard() {
    const { isLoading: isAuthLoading } = useRoleProtection(['general_user']);
    const { user } = useAuth();

    const [exams, setExams] = useState<ExamProgress[]>([]);
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

                // 2. Fetch ALL User Submissions
                const submissionsQuery = query(
                    collection(db, "submissions"),
                    where("studentId", "==", user.uid),
                    orderBy("submittedAt", "desc") // Latest first
                );
                const submissionsSnap = await getDocs(submissionsQuery);
                const submissionsList = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

                // 3. Map Submissions to Exams
                const processedExams: ExamProgress[] = examsList.map(exam => {
                    const examSubmissions = submissionsList.filter(s => s.examId === exam.id);
                    return {
                        ...exam,
                        latestSubmission: examSubmissions[0] || undefined,
                        historyCount: examSubmissions.length
                    };
                });

                setExams(processedExams);

            } catch (error) {
                console.error("Error fetching general dashboard:", error);
            } finally {
                setLoadingData(false);
            }
        }

        if (!isAuthLoading) fetchData();
    }, [user, isAuthLoading]);

    const getLevel = (score: number) => {
        if (score >= 8) return { label: "Gold", color: "text-yellow-500 bg-yellow-50 border-yellow-200" };
        if (score >= 5) return { label: "Silver", color: "text-slate-500 bg-slate-100 border-slate-200" };
        return { label: "Bronze", color: "text-amber-700 bg-amber-50 border-amber-200" };
    };

    if (isAuthLoading || loadingData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 font-sans">

            {/* Header */}
            <div className="max-w-6xl mx-auto mb-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    ศูนย์การประเมินสมรรถนะ (Assessment Center)
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    ยินดีต้อนรับ, {user?.firstName}. ติดตามความก้าวหน้าทางสมรรถนะของคุณและรับเกียรติบัตรได้ที่นี่
                </p>
            </div>

            <div className="max-w-6xl mx-auto grid gap-6">
                {exams.map(exam => (
                    <div
                        key={exam.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6"
                    >

                        {/* Icon & Title */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <BookOpen size={20} />
                                </span>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{exam.title}</h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 md:line-clamp-1">
                                {exam.competency} - {exam.scenario}
                            </p>
                            {exam.historyCount > 0 && (
                                <p className="text-xs text-slate-400 mt-2">
                                    จำนวนครั้งที่ทำ: {exam.historyCount}
                                </p>
                            )}
                        </div>

                        {/* Status & Actions */}
                        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">

                            {/* Status Badge */}
                            {exam.latestSubmission ? (
                                exam.latestSubmission.status === 'pending' ? (
                                    <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800 flex items-center justify-center gap-2">
                                        <Clock size={16} /> รอการตรวจผลจาก AI
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold ${getLevel(exam.latestSubmission.score || 0).color}`}>
                                            <Award size={18} />
                                            {exam.latestSubmission.score}/10 ({getLevel(exam.latestSubmission.score || 0).label})
                                        </div>
                                        <Link
                                            href={`/certificate/${exam.latestSubmission.id}`}
                                            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity text-center text-sm"
                                        >
                                            ดาวน์โหลดเกียรติบัตร
                                        </Link>
                                    </div>
                                )
                            ) : (
                                <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm italic text-center">
                                    ยังไม่เริ่มทำ
                                </div>
                            )}

                            {/* Retake / Start Button */}
                            <Link
                                href={`/student/exam/${exam.id}`}
                                className="px-5 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                            >
                                {exam.latestSubmission ? <><RotateCcw size={18} /> ทำแบบทดสอบอีกครั้ง</> : 'เริ่มทำแบบทดสอบ'}
                            </Link>

                        </div>
                    </div>
                ))}

                {exams.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400">ยังไม่มีแบบทดสอบที่เปิดใช้งานในขณะนี้</p>
                    </div>
                )}
            </div>
        </div>
    );
}
