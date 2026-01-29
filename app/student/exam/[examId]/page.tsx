"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Exam, Submission } from "@/types";
import { Loader2, Send, AlertCircle, ArrowLeft, BookOpen, PenTool, MonitorPlay, ChevronDown, ChevronUp } from "lucide-react";
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
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    useEffect(() => {
        async function fetchExam() {
            if (!examId) return;

            try {
                const docRef = doc(db, "exams", examId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as Exam;
                    if (data.isActive) {
                        const examData = { id: docSnap.id, ...data };
                        setExam(examData);
                        // Initialize answers object with empty strings for each item
                        if (data.items && data.items.length > 0) {
                            const initialAnswers: Record<string, string> = {};
                            data.items.forEach(item => {
                                initialAnswers[item.id] = "";
                            });
                            setAnswers(initialAnswers);
                            setExpandedItem(data.items[0].id);
                        }
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

    const handleAnswerChange = (itemId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [itemId]: value }));
    };

    const totalMaxScore = useMemo(() => {
        if (!exam?.items) return 0;
        return exam.items.reduce((sum, item) => sum + item.score, 0);
    }, [exam]);

    const answeredCount = useMemo(() => {
        return Object.values(answers).filter(a => a.trim().length > 0).length;
    }, [answers]);

    const handleSubmit = async () => {
        if (!user || !exam) return;

        const unansweredItems = exam.items.filter(item => !answers[item.id]?.trim());
        if (unansweredItems.length > 0) {
            const confirmSubmit = confirm(
                `คุณยังไม่ได้ตอบคำถาม ${unansweredItems.length} ข้อ คุณแน่ใจหรือไม่ที่จะส่ง?\n(You have ${unansweredItems.length} unanswered questions. Submit anyway?)`
            );
            if (!confirmSubmit) return;
        } else {
            if (!confirm("คุณแน่ใจหรือไม่ที่จะส่งคำตอบ? เมื่อส่งแล้วจะไม่สามารถแก้ไขได้ (Are you sure you want to submit?)")) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const studentName = (user.firstName && user.lastName)
                ? `${user.firstName} ${user.lastName}`
                : (user.email?.split('@')[0] || "Unknown Student");

            // Initialize itemScores with 0 for each item (to be filled by AI grading)
            const initialItemScores: Record<string, number> = {};
            exam.items.forEach(item => {
                initialItemScores[item.id] = 0;
            });

            const submissionData: Submission = {
                examId: exam.id!,
                studentId: user.uid,
                studentName: studentName,
                classRoom: user.classRoom || "N/A",
                competency: exam.competency,
                answers: answers,
                itemScores: initialItemScores,
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
            alert("เกิดข้อผิดพลาดในการส่งคำตอบ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง (Failed to submit)");
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

    const isSimulation = exam.mediaType === 'simulation';

    return (
        <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Left Pane: Stimulus (Text Scenario or Simulation) */}
            <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSimulation ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {isSimulation ? <MonitorPlay size={24} /> : <BookOpen size={24} />}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-white text-lg leading-tight truncate max-w-[200px] sm:max-w-xs" title={exam.title}>
                                {exam.title}
                            </h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{exam.competency}</p>
                                {isSimulation && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                                        Simulation
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Link href="/student/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors md:hidden">
                        <ArrowLeft size={24} />
                    </Link>
                </div>

                {/* Stimulus Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {isSimulation ? (
                        <>
                            {/* Simulation iframe */}
                            <div className="flex-1 relative">
                                <iframe
                                    src={exam.mediaUrl}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    title={exam.title}
                                />
                            </div>
                            {/* Optional scenario text below iframe */}
                            {exam.scenario && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{exam.scenario}</p>
                                </div>
                            )}
                        </>
                    ) : (
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
                    )}
                </div>
            </div>

            {/* Right Pane: Items (Multiple Questions) & Answers */}
            <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-slate-50 dark:bg-slate-950">
                {/* Progress Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-semibold text-slate-800 dark:text-white">คำถาม ({exam.items?.length || 0} ข้อ)</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                                ตอบแล้ว: <span className={`font-bold ${answeredCount === exam.items?.length ? 'text-emerald-600' : 'text-amber-600'}`}>{answeredCount}/{exam.items?.length || 0}</span>
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                                คะแนนเต็ม: <span className="font-bold text-indigo-600">{totalMaxScore}</span>
                            </span>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${(answeredCount / (exam.items?.length || 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                    {exam.items?.map((item, index) => {
                        const isExpanded = expandedItem === item.id;
                        const hasAnswer = answers[item.id]?.trim().length > 0;

                        return (
                            <div 
                                key={item.id}
                                className={`rounded-2xl border-2 transition-all ${
                                    isExpanded 
                                        ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-lg shadow-indigo-500/10' 
                                        : hasAnswer 
                                            ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900' 
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                            >
                                {/* Item Header - Clickable to expand/collapse */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                    className="w-full p-4 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                            hasAnswer 
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                            {hasAnswer ? '✓' : index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white line-clamp-1">
                                                {item.question.length > 60 ? `${item.question.substring(0, 60)}...` : item.question}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                คะแนนเต็ม: {item.score} คะแนน
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasAnswer && !isExpanded && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                ตอบแล้ว
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                    </div>
                                </button>

                                {/* Item Content - Expandable */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4">
                                        {/* Full Question */}
                                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-indigo-100 dark:border-slate-700">
                                            <p className="text-slate-900 dark:text-white font-medium leading-relaxed">
                                                {item.question}
                                            </p>
                                        </div>

                                        {/* Answer Textarea */}
                                        <div className="relative">
                                            <textarea
                                                value={answers[item.id] || ""}
                                                onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                                                className="w-full min-h-[180px] p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all resize-none text-slate-800 dark:text-slate-100 leading-relaxed"
                                                placeholder={`พิมพ์คำตอบข้อที่ ${index + 1} ของคุณที่นี่...`}
                                            />
                                            <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-slate-50/80 dark:bg-slate-800/80 px-2 py-1 rounded">
                                                {answers[item.id]?.length || 0} ตัวอักษร
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                    <Link
                        href="/student/dashboard"
                        className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        ยกเลิก
                    </Link>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                            {answeredCount === exam.items?.length ? (
                                <span className="text-emerald-600 font-medium">✓ ตอบครบทุกข้อแล้ว</span>
                            ) : (
                                <span>เหลือ {(exam.items?.length || 0) - answeredCount} ข้อ</span>
                            )}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || answeredCount === 0}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังส่ง...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    ส่งคำตอบ ({answeredCount}/{exam.items?.length || 0})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
