"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Exam, Submission } from "@/types";
import { Loader2, Send, AlertCircle, ArrowLeft, BookOpen, PenTool } from "lucide-react";
import Link from "next/link";

export default function ExamPage() {
    const params = useParams();
    const examId = params?.examId as string;
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading, isAuthorized } = useRoleProtection(['student']);

    const [exam, setExam] = useState<Exam | null>(null);
    const [loadingExam, setLoadingExam] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                        setError("แบบทดสอบนี้ปิดใช้งานอยู่ในขณะนี้ (Inactive)");
                    }
                } else {
                    setError("ไม่พบแบบทดสอบ (Exam not found)");
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

    const handleSubmit = async () => {
        if (!user || !exam) return;
        if (!answer.trim()) {
            alert("กรุณาพิมพ์คำตอบของท่านก่อนทำการส่ง (Please write an answer before submitting)");
            return;
        }

        if (!confirm("คุณแน่ใจหรือไม่ที่จะส่งคำตอบ? เมื่อส่งแล้วจะไม่สามารถแก้ไขได้ (Are you sure you want to submit?)")) {
            return;
        }

        setIsSubmitting(true);

        try {
            const studentName = (user.firstName && user.lastName)
                ? `${user.firstName} ${user.lastName}`
                : (user.email?.split('@')[0] || "Unknown Student");

            const submissionData: Submission = {
                examId: exam.id!,
                studentId: user.uid,
                studentName: studentName,
                classRoom: user.classRoom || "N/A",
                competency: exam.competency,
                answer: answer,
                status: 'pending',
                score: null,
                feedback: null,
                submittedAt: serverTimestamp(),
            };

            await addDoc(collection(db, "submissions"), submissionData);

            alert("ส่งคำตอบสำเร็จ! ระบบกำลังรอการประเมินจาก AI... (Submitted successfully!)");
            router.push("/student/dashboard");
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("เกิดข้อผิดพลาดในการส่่งคำตอบ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง (Failed to submit)");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthLoading || loadingExam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-slate-500 animate-pulse">กำลังโหลดแบบทดสอบ...</p>
            </div>
        );
    }

    if (!isAuthorized) return null; // Hook handles redirect

    if (error || !exam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
                <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">ไม่สามารถเข้าถึงได้</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">{error || "เกิดข้อผิดพลาดบางอย่าง"}</p>
                    <Link
                        href="/student/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-slate-800 dark:text-white font-medium transition-colors"
                    >
                        <ArrowLeft size={20} /> กลับสู่หน้าหลัก
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Left Pane: Scenario */}
            <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-white text-lg leading-tight truncate max-w-[200px] sm:max-w-xs" title={exam.title}>
                                {exam.title}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{exam.competency}</p>
                        </div>
                    </div>
                    <Link href="/student/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors md:hidden">
                        <ArrowLeft size={24} />
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                        <strong>คำชี้แจง:</strong> กรุณาอ่านสถานการณ์ทางด้านซ้าย และพิมพ์คำตอบของท่านทางด้านขวา
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-loose text-base md:text-lg">
                        {exam.scenario.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4 whitespace-pre-wrap">{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Pane: Question & Answer */}
            <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-slate-50 dark:bg-slate-950">
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-2xl mx-auto space-y-8">
                        {/* Question Card */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800/50 p-6 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
                            <div className="flex gap-3 mb-2">
                                <PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">คำถาม (Question)</h3>
                            </div>
                            <p className="text-slate-900 dark:text-white font-medium text-lg leading-relaxed">
                                {exam.question}
                            </p>
                        </div>

                        {/* Answer Input */}
                        <div>
                            <label htmlFor="answer" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-1">
                                พื้นที่ตอบคำถาม (Your Answer)
                            </label>
                            <div className="relative group">
                                <textarea
                                    id="answer"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="w-full min-h-[300px] md:min-h-[400px] p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all resize-none text-slate-800 dark:text-slate-100 leading-relaxed font-normal shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-600"
                                    placeholder="พิมพ์คำตอบของคุณที่นี่..."
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded">
                                    {answer.length} ตัวอักษร
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                    <Link
                        href="/student/dashboard"
                        className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        ยกเลิก
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !answer.trim()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังส่ง...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                ยืนยันการส่งคำตอบ
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
