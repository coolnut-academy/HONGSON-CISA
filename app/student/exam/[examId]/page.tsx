"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Exam, QuestionAnswer } from "@/types";
import { functions } from "@/lib/firebase";
import {
    Loader2,
    AlertCircle,
    ArrowLeft,
    BookOpen,
} from "lucide-react";
import Link from "next/link";

// Import the new ProfessionalExamLayout
import ProfessionalExamLayout from "@/components/exam/ProfessionalExamLayout";

export default function ExamPage() {
    const params = useParams();
    const examId = params?.examId as string;
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading, isAuthorized } = useRoleProtection(['student']);

    const [exam, setExam] = useState<Exam | null>(null);
    const [loadingExam, setLoadingExam] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch exam data
    useEffect(() => {
        async function fetchExam() {
            if (!examId) return;

            try {
                const docRef = doc(db, "exams", examId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as Exam;
                    if (data.isActive) {
                        setExam({ id: docSnap.id, ...data });
                    } else {
                        setError("แบบทดสอบนี้ปิดใช้งานอยู่ในขณะนี้");
                    }
                } else {
                    setError("ไม่พบแบบทดสอบ");
                }
            } catch (err) {
                console.error("Error fetching exam:", err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูลแบบทดสอบ");
            } finally {
                setLoadingExam(false);
            }
        }

        fetchExam();
    }, [examId]);

    // Submit handler
    const handleSubmit = useCallback(async (answers: Record<string, QuestionAnswer>, timeSpentSeconds: number) => {
        if (!user || !exam) return;

        setIsSubmitting(true);

        try {
            // Prepare submission data
            const submitData = {
                examId: exam.id!,
                answers: answers,
                timeSpentSeconds: timeSpentSeconds,
                randomSeed: Math.floor(Math.random() * 1000000),
                generatedValues: {},
            };

            // Call Cloud Function for secure submission
            const submitExam = httpsCallable(functions, 'submitExam');
            const result = await submitExam(submitData);
            const data = result.data as { success: boolean; submissionId: string; message: string };

            console.log("[Exam Submission] Success:", data);

            // Clear auto-save
            localStorage.removeItem(`exam_autosave_${exam.id}_${user.uid}`);

            // Exit fullscreen before redirect
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }

            // Redirect immediately without blocking alert
            router.push("/student/dashboard");
        } catch (err: any) {
            console.error("Error submitting answer:", err);
            
            // Handle specific error codes from Cloud Function
            const errorCode = err.code || 'unknown';
            const errorMessage = err.message || 'Unknown error occurred';
            
            let userMessage = "เกิดข้อผิดพลาดในการส่งคำตอบ กรุณาลองใหม่อีกครั้ง";
            
            switch (errorCode) {
                case 'functions/already-exists':
                    userMessage = "คุณได้ส่งคำตอบชุดนี้ไปแล้ว ไม่สามารถส่งซ้ำได้";
                    break;
                case 'functions/failed-precondition':
                    userMessage = "แบบทดสอบนี้ปิดรับคำตอบแล้ว หรือยังไม่เปิดให้ทำ";
                    break;
                case 'functions/permission-denied':
                    userMessage = "คุณไม่มีสิทธิ์ส่งคำตอบชุดนี้";
                    break;
                case 'functions/unauthenticated':
                    userMessage = "กรุณาเข้าสู่ระบบใหม่ เนื่องจากเซสชันหมดอายุ";
                    break;
                default:
                    userMessage = `เกิดข้อผิดพลาด: ${errorMessage}`;
            }
            
            alert(userMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [user, exam, router]);

    // Loading state
    if (isAuthLoading || loadingExam) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 gap-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={32} />
                </div>
                <p className="text-slate-600 text-lg animate-pulse">กำลังโหลดแบบทดสอบ...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    if (error || !exam) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="text-center max-w-md bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">ไม่สามารถเข้าถึงได้</h1>
                    <p className="text-slate-600 mb-8">{error || "เกิดข้อผิดพลาดบางอย่าง"}</p>
                    <Link
                        href="/student/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-800 font-medium transition-colors"
                    >
                        <ArrowLeft size={20} /> กลับสู่หน้าหลัก
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <ProfessionalExamLayout
            exam={exam}
            examId={examId}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
        />
    );
}
