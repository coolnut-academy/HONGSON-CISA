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
} from "lucide-react";

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
                <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            สวัสดี, {user?.firstName ? user.firstName : (user?.email?.split('@')[0] || "นักเรียน")}!
                        </h1>
                        <p className="text-blue-100 text-lg flex items-center gap-2">
                            ติดตามความคืบหน้าและเริ่มทำแบบทดสอบสมรรถนะของคุณได้ที่นี่
                        </p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-white text-sm font-medium transition-all"
                    >
                        ออกจากระบบ
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            </div>

            {/* Competency Categories */}
            <div className="space-y-12">
                {COMPETENCIES.map((category) => (
                    <div key={category} className="scroll-mt-24" id={category.replace(/\s+/g, '-').toLowerCase()}>
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                <BookOpen size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {COMP_DISPLAY_TH[category] || category}
                            </h2>
                            <span className="ml-auto text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                                {examsByCompetency[category]?.length || 0} แบบทดสอบ
                            </span>
                        </div>

                        {/* Exam Grid */}
                        {!examsByCompetency[category] || examsByCompetency[category].length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-400 dark:text-slate-500 font-medium">ยังไม่มีแบบทดสอบที่เปิดใช้งานในขณะนี้</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {examsByCompetency[category].map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 flex flex-col group relative overflow-hidden"
                                    >
                                        {/* Card Status Indicator Border */}
                                        <div className={`absolute top-0 left-0 w-1 h-full 
                        ${!exam.submission ? 'bg-blue-500' :
                                                exam.submission.status === 'pending' ? 'bg-amber-400' :
                                                    exam.submission.status === 'graded' ? 'bg-emerald-500' : 'bg-slate-300'}
                     `} />

                                        <div className="flex-1 mb-6 pl-2">
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2" title={exam.title}>
                                                {exam.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                                {exam.scenario}
                                            </p>
                                        </div>

                                        <div className="pl-2 mt-auto">
                                            {!exam.submission ? (
                                                <Link
                                                    href={`/student/exam/${exam.id}`}
                                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 group-hover:scale-[1.02]"
                                                >
                                                    <PlayCircle size={18} /> เริ่มทำแบบทดสอบ
                                                </Link>
                                            ) : exam.submission.status === 'pending' ? (
                                                <div className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium py-3 rounded-xl border border-amber-100 dark:border-amber-800">
                                                    <Clock size={18} /> รอการตรวจผล
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <div className="w-full flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold py-3 px-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                                        <span className="flex items-center gap-2 text-sm"><CheckCircle2 size={18} /> ตรวจแล้ว</span>
                                                        <span className="text-lg">{exam.submission.score}/10</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
