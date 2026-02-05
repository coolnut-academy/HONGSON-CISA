"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Exam, Submission } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { BookOpen, Sparkles, ArrowLeft, Printer, Loader2 } from "lucide-react";
import Link from "next/link";

import { useRoleProtection } from "@/hooks/useRoleProtection"; // added import

export default function ExamResultPage({ params }: { params: Promise<{ submissionId: string }> }) {
    // Unwrap params using React.use()
    const { submissionId } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading } = useRoleProtection(['student', 'admin', 'super_admin']);

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!submissionId || isAuthLoading) return; // Wait for auth

        async function fetchData() {
            if (!user) return; // Double check

            try {
                // 1. Try fetching from active submissions
                const subRef = doc(db, "submissions", submissionId);
                let subSnap = null;
                let isArchived = false;

                try {
                    subSnap = await getDoc(subRef);
                } catch (err) {
                    console.log("Submissions check skipped or failed:", err);
                }

                // 2. If not found in active, try fetching from archives
                if (!subSnap || !subSnap.exists()) {
                    const archiveRef = doc(db, "submission_archives", submissionId);
                    try {
                        subSnap = await getDoc(archiveRef);
                    } catch (err) {
                        console.error("Archives check failed:", err);
                    }
                    isArchived = true;
                }

                if (!subSnap || !subSnap.exists()) {
                    alert("ไม่พบข้อมูลการส่งคำตอบ หรือคุณไม่มีสิทธิ์เข้าถึง");
                    router.push("/student/dashboard");
                    return;
                }

                const subData = { id: subSnap.id, ...subSnap.data(), isArchived } as Submission & { isArchived: boolean };

                // Verify ownership (client-side check to be safe, though rules handle it)
                const isAdmin = user.role === 'admin' || user.role === 'super_admin';
                if (!isAdmin && subData.studentId !== user.uid) {
                    alert("คุณไม่มีสิทธิ์เข้าถึงผลการสอบนี้");
                    router.push("/student/dashboard");
                    return;
                }

                setSubmission(subData);

                // Fetch Exam
                const examRef = doc(db, "exams", subData.examId);
                const examSnap = await getDoc(examRef);
                if (examSnap.exists()) {
                    setExam({ id: examSnap.id, ...examSnap.data() } as Exam);
                }

            } catch (error) {
                console.error("Error fetching result:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [submissionId, router, isAuthLoading, user]);

    if (loading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-[var(--accent-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin w-10 h-10" />
                    <p>กำลังโหลดผลการประเมิน...</p>
                </div>
            </div>
        );
    }

    if (!submission || !exam) return null;

    return (
        <div className="min-h-screen bg-white text-black p-8 font-serif">
            {/* Toolbar - Hidden in Print */}
            <div className="print:hidden mb-8 flex items-center justify-between">
                <Link href="/student/dashboard" className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={20} /> กลับหน้าหลัก
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:brightness-110 shadow-lg"
                    >
                        <Printer size={20} /> พิมพ์ / บันทึก PDF
                    </button>
                </div>
            </div>

            {/* A4 Format Container */}
            <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:mx-0">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-8 mb-8">
                    <h1 className="text-3xl font-bold mb-2">รายงานผลการประเมินสมรรถนะ (Competency Assessment Report)</h1>
                    <h2 className="text-xl text-gray-600">วิชาฟิสิกส์ - โครงการ Hongson-CISA</h2>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-lg">
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="font-bold w-32">ชื่อ-นามสกุล:</span>
                        <span>{submission.studentName}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="font-bold w-32">รหัสนักเรียน:</span>
                        <span>{user?.studentId || "-"}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="font-bold w-32">ชั้นเรียน:</span>
                        <span>{user?.classRoom ? `ม.${user.classRoom}` : "-"}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="font-bold w-32">วันที่สอบ:</span>
                        <span>{submission.submittedAt?.toDate ? submission.submittedAt.toDate().toLocaleDateString('th-TH') : "-"}</span>
                    </div>
                </div>

                {/* Score Summary Box */}
                <div className={`border border-black rounded-xl p-6 mb-8 flex items-center justify-between ${(submission as any).isArchived ? 'bg-gray-100 border-dashed' : 'bg-gray-50'}`}>
                    <div>
                        <h3 className="text-xl font-bold mb-1">{exam.title}</h3>
                        <p className="text-gray-600 italic">{exam.competency}</p>
                        {(submission as any).isArchived && (
                            <div className="mt-2 inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded uppercase">
                                ฉบับบันทึกย้อนหลัง (Archived Result)
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-500 uppercase">คะแนนรวมสุทธิ (Net Score)</p>
                        <p className="text-5xl font-bold leading-none mt-1">
                            {submission.score ?? 0}<span className="text-xl text-gray-400 font-medium">/10</span>
                        </p>
                    </div>
                </div>

                {/* Overall Feedback */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 border-b border-gray-300 pb-2">
                        <Sparkles size={20} /> บทสรุปและข้อเสนอแนะภาพรวม (Overall Feedback)
                    </h3>
                    <div className="bg-blue-50 p-6 rounded-lg text-gray-800 leading-relaxed text-justify border border-blue-100">
                        {submission.feedback || "ไม่มีข้อเสนอแนะเพิ่มเติม"}
                    </div>
                </div>

                {/* Detailed Analysis */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-300 pb-2">
                        <BookOpen size={20} /> รายละเอียดรายข้อ (Detailed Analysis)
                    </h3>

                    <div className="space-y-6">
                        {exam.items?.map((item, index) => {
                            const rawScore = submission.itemScores?.[item.id] ?? 0;
                            const maxScore = item.score || 10;
                            const aiFeedback = submission.detailedFeedback?.[item.id];
                            const studentAnswer = submission.answers?.[item.id];

                            let answerDisplay = "ไม่มีคำตอบ";
                            if (studentAnswer) {
                                if (item.questionType === 'multiple_choice') {
                                    const opt = item.options?.find(o => o.id === studentAnswer.selectedOptionId);
                                    answerDisplay = opt ? `เลือก: ${opt.text}` : "ไม่มีการเลือก";
                                } else if (studentAnswer.textAnswer) {
                                    answerDisplay = studentAnswer.textAnswer;
                                } else if (item.questionType === 'matching' && studentAnswer.matchingPairs) {
                                    answerDisplay = Object.entries(studentAnswer.matchingPairs || {}).map(([l, r]) => {
                                        const left = item.leftColumn?.find(x => x.id === l)?.text || l;
                                        const right = item.rightColumn?.find(x => x.id === r)?.text || r;
                                        return `${left} -> ${right}`;
                                    }).join(", ");
                                } else {
                                    answerDisplay = "ตอบแล้ว (รูปแบบเฉพาะ)";
                                }
                            }

                            return (
                                <div key={item.id} className="break-inside-avoid border border-gray-200 rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-3">
                                            <div className="bg-black text-white w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="font-medium text-gray-900">{item.question}</div>
                                        </div>
                                        <div className="flex-shrink-0 font-bold bg-gray-100 px-3 py-1 rounded text-sm">
                                            {rawScore} / {maxScore}
                                        </div>
                                    </div>

                                    <div className="ml-9 space-y-3">
                                        <div className="text-sm">
                                            <span className="font-bold text-gray-500 text-xs uppercase block mb-1">คำตอบของคุณ:</span>
                                            <p className="text-gray-900 bg-gray-50 p-2 rounded border border-gray-100 italic">"{answerDisplay}"</p>
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-bold text-blue-600 text-xs uppercase block mb-1">คำอธิบาย/ข้อเสนอแนะ:</span>
                                            <p className="text-gray-700 leading-relaxed text-justify">{aiFeedback || "ไม่มีคำอธิบายเพิ่มเติม"}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Sign */}
                <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between items-end">
                    <div className="text-xs text-gray-400">
                        Generated by Hongson-CISA AI Assessment System<br />
                        Report ID: {submission.id}
                    </div>
                    <div className="text-center">
                        <div className="border-b border-dashed border-gray-400 w-48 mb-2"></div>
                        <p className="text-sm font-bold">ผู้ตรวจประเมิน (AI Assessor)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
