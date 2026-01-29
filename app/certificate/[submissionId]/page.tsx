"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Submission, Exam } from "@/types";
import { Loader2, Download, ArrowLeft, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";

export default function CertificatePage() {
    const { submissionId } = useParams();
    const { user } = useAuth(); // Optional: Could be public if Firestore rules allow read
    const router = useRouter();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const certRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchCertificateData() {
            if (!submissionId) return;

            try {
                // Fetch Submission
                const subDoc = await getDoc(doc(db, "submissions", submissionId as string));
                if (!subDoc.exists()) {
                    alert("Certificate not found.");
                    router.push("/");
                    return;
                }
                const subData = subDoc.data() as Submission;

                // Only show if graded
                if (subData.status !== "graded") {
                    alert("Result is still pending.");
                    return;
                }

                setSubmission(subData);

                // Fetch Exam Details for Title
                const examDoc = await getDoc(doc(db, "exams", subData.examId));
                if (examDoc.exists()) {
                    setExam(examDoc.data() as Exam);
                }

            } catch (err) {
                console.error("Error loading certificate:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCertificateData();
    }, [submissionId, router]);

    const handleDownload = async () => {
        if (!certRef.current) return;
        setDownloading(true);

        try {
            const canvas = await html2canvas(certRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");

            // Calculate A4 landscape dimensions (mm)
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificate-${submission?.studentName}-${submission?.competency}.pdf`);

        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const getLevelInfo = (score: number) => {
        if (score >= 8) return { label: "GOLD LEVEL", color: "text-yellow-600", border: "border-yellow-400" };
        if (score >= 5) return { label: "SILVER LEVEL", color: "text-slate-500", border: "border-slate-300" };
        return { label: "BRONZE LEVEL", color: "text-amber-700", border: "border-amber-600" };
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    }

    if (!submission || !exam) return null;

    const level = getLevelInfo(submission.score || 0);
    const dateStr = submission.gradedAt?.toDate().toLocaleDateString("en-GB", { día: 'numeric', month: 'long', year: 'numeric' }) || new Date().toLocaleDateString();

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-10 px-4 flex flex-col items-center">

            {/* Control Bar */}
            <div className="w-full max-w-[297mm] flex justify-between items-center mb-8 no-print">
                <Link
                    href={user?.role === 'general_user' ? "/general/dashboard" : "/student/dashboard"}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    Download PDF
                </button>
            </div>

            {/* Certificate Container - A4 Landscape Ratio aspect-video is close approx */}
            <div className="relative w-full max-w-[1000px] aspect-[1.414/1] bg-white shadow-2xl overflow-hidden text-slate-900" ref={certRef}>

                {/* Background Pattern */}
                <div className="absolute inset-0 border-[20px] border-double border-slate-100 m-4 z-10 pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '40px 40px' }}
                />

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-900 z-0 transform -translate-x-16 -translate-y-16 rotate-45" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-900 z-0 transform translate-x-16 translate-y-16 rotate-45" />

                {/* Content */}
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-20">

                    {/* Logo / Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-serif text-blue-900 tracking-wider font-bold mb-2">CERTIFICATE</h1>
                        <p className="text-xl text-blue-600/60 uppercase tracking-[0.3em]">of Competency Achievement</p>
                    </div>

                    <p className="text-lg text-slate-500 italic mb-6">This is to certify that</p>

                    <div className="mb-8 border-b-2 border-slate-300 px-12 py-2">
                        <h2 className={`text-4xl md:text-5xl font-serif font-bold ${level.color}`}>
                            {submission.studentName}
                        </h2>
                    </div>

                    <div className="space-y-4 mb-12">
                        <p className="text-xl text-slate-600">Has successfully completed the assessment for</p>
                        <h3 className="text-3xl font-bold text-slate-800 max-w-2xl mx-auto leading-tight">{exam.title}</h3>
                        <p className="text-lg text-slate-500">Demonstrating competency in <strong>{submission.competency}</strong></p>
                    </div>

                    {/* Badge / Level */}
                    <div className={`mb-12 px-8 py-3 rounded-full border-2 ${level.border} ${level.color} bg-white inline-block`}>
                        <span className="font-bold tracking-widest text-xl">{level.label}</span>
                        <span className="mx-3 text-slate-300">|</span>
                        <span className="font-medium">Score: {submission.score}/10</span>
                    </div>

                    {/* Footer: Date & Signature */}
                    <div className="w-full flex justify-between items-end px-12 mt-auto">
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-800 border-t border-slate-400 pt-2 px-8">{dateStr}</p>
                            <p className="text-xs text-slate-400 uppercase mt-1">Date Issued</p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-slate-300 font-mono mb-6">ID: {submission.id}</p>
                            <div className="text-center">
                                {/* Mock Signature */}
                                <p className="font-handwriting text-2xl text-blue-800 mb-1 px-8" style={{ fontFamily: 'cursive' }}>Satit S.</p>
                                <p className="text-sm font-bold text-slate-800 border-t border-slate-400 pt-2">Mr. Satit Siriwach</p>
                                <p className="text-xs text-slate-400 uppercase mt-1">System Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
