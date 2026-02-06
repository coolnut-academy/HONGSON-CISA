"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Exam, Submission } from "@/types";
import { BookOpen, Sparkles, ArrowLeft, Loader2, FileText } from "lucide-react";
import Link from "next/link";

import { useRoleProtection } from "@/hooks/useRoleProtection";

// Competency Assessment Type
interface CompetencyAssessment {
    understanding: number;
    systemThinking: number;
    technology: number;
    attributes: number;
    overallLevel: string;
    averageScore: number;
    details: {
        understanding: { reason: string; nextStep: string };
        systemThinking: { reason: string; nextStep: string };
        technology: { reason: string; nextStep: string };
        attributes: { reason: string; nextStep: string };
    };
    summary: string;
}

export default function ExamResultPage({ params }: { params: Promise<{ submissionId: string }> }) {
    const { submissionId } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading } = useRoleProtection(['student', 'admin', 'super_admin']);

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    // Removed showPrintView state - using popup window instead
    const [competencyData, setCompetencyData] = useState<CompetencyAssessment | null>(null);

    // Calculate Competency Assessment
    const calculateCompetency = (submission: Submission, exam: Exam): CompetencyAssessment => {
        const answers = submission.answers || {};
        const detailedFeedback = submission.detailedFeedback || {};
        const itemScores = submission.itemScores || {};
        
        let understandingScore = 0;
        let systemThinkingScore = 0;
        let technologyScore = 0;
        let attributesScore = 0;
        
        const totalItems = exam.items?.length || 1;
        
        exam.items?.forEach((item) => {
            const answer = answers[item.id];
            const feedback = detailedFeedback[item.id] || "";
            const score = itemScores[item.id] || 0;
            const maxScore = item.score || 10;
            const scoreRatio = score / maxScore;
            
            const answerText = answer?.textAnswer || "";
            const lowerFeedback = feedback.toLowerCase();
            const lowerAnswer = answerText.toLowerCase();
            
            if (scoreRatio >= 0.8) {
                if (lowerFeedback.includes("ทฤษฎี") || lowerFeedback.includes("theory") || lowerAnswer.includes("เพราะ") || lowerAnswer.includes("เนื่องจาก")) {
                    understandingScore += 3;
                } else {
                    understandingScore += 2;
                }
            } else if (scoreRatio >= 0.5) {
                understandingScore += 1;
            }
            
            if (lowerFeedback.includes("ระยะยาว") || lowerFeedback.includes("ยั่งยืน") || lowerFeedback.includes("sustainability") || 
                lowerAnswer.includes("วางแผน") || lowerAnswer.includes("ระบบ")) {
                systemThinkingScore += 3;
            } else if (scoreRatio >= 0.7) {
                systemThinkingScore += 2;
            } else if (scoreRatio >= 0.4) {
                systemThinkingScore += 1;
            }
            
            if (lowerFeedback.includes("simulation") || lowerFeedback.includes("เครื่องมือ") || lowerFeedback.includes("ข้อดี") || lowerFeedback.includes("ข้อเสีย")) {
                technologyScore += 3;
            } else if (scoreRatio >= 0.7) {
                technologyScore += 2;
            } else if (scoreRatio >= 0.4) {
                technologyScore += 1;
            }
            
            if (scoreRatio >= 0.8 && answerText.length > 50) {
                attributesScore += 3;
            } else if (scoreRatio >= 0.6) {
                attributesScore += 2;
            } else if (scoreRatio >= 0.3) {
                attributesScore += 1;
            }
        });
        
        const convertToLevel = (score: number) => {
            const avg = score / totalItems;
            if (avg >= 2.5) return 4;
            if (avg >= 1.8) return 3;
            if (avg >= 1.0) return 2;
            return 1;
        };
        
        const u = convertToLevel(understandingScore);
        const s = convertToLevel(systemThinkingScore);
        const t = convertToLevel(technologyScore);
        const a = convertToLevel(attributesScore);
        
        const rawAverage = (u + s + t + a) / 4;
        const roundedAverage = Math.round(rawAverage);
        
        let overallLevel = "ระดับเริ่มต้น (Starting)";
        if (roundedAverage >= 4) overallLevel = "ระดับเหนือความคาดหมาย (Advanced)";
        else if (roundedAverage >= 3) overallLevel = "ระดับสามารถ (Proficient)";
        else if (roundedAverage >= 2) overallLevel = "ระดับกำลังพัฒนา (Developing)";
        
        const generateReason = (score: number, type: string) => {
            const reasons: Record<string, string[]> = {
                understanding: [
                    "อธิบายตามสิ่งที่เห็นใน Simulation ได้ถูกต้อง แต่ยังไม่ได้เชื่อมโยงทฤษฎี",
                    "ใช้ทฤษฎีฟิสิกส์อธิบายเหตุผลประกอบผลที่เห็นได้ดี",
                    "เชื่อมโยงทฤษฎีกับโลกความจริงได้ดี",
                    "วิเคราะห์ขีดจำกัดของทฤษฎีในสภาวะสุดขั้วได้อย่างลึกซึ้ง"
                ],
                systemThinking: [
                    "แก้ปัญหาเฉพาะหน้าได้ตามที่โจทย์กำหนด",
                    "แก้ปัญหาเชิงระบบโดยคำนึงถึงความคุ้มค่า",
                    "เชื่อมโยงไปสู่ความยั่งยืนของธรรมชาติ",
                    "เสนอนวัตกรรมและวิเคราะห์ความอยู่รอดของระบบ"
                ],
                technology: [
                    "ใช้เครื่องมือ Simulation ได้ปลอดภัยและถูกต้อง",
                    "รู้ข้อดี-ข้อเสียของเครื่องมือและเลือกใช้ได้เหมาะสม",
                    "รู้เท่าทันเทรนด์เทคโนโลยีและใช้พยากรณ์อนาคต",
                    "วิเคราะห์ผลกระทบรอบด้านและใช้เทคโนโลยีเพิ่มมูลค่าสูงสุด"
                ],
                attributes: [
                    "มีความอดทนและตั้งใจตอบคำถามให้ครบถ้วน",
                    "มีวิจารณญาณและปรับตัวตามเงื่อนไขโจทย์",
                    "แน่วแน่และพยายามหาทางออกที่ดีที่สุด",
                    "เด็ดเดี่ยว มีภาวะผู้นำ และกล้ายืนยันความถูกต้อง"
                ]
            };
            return reasons[type][Math.min(score - 1, 3)];
        };
        
        const generateNextStep = (score: number, type: string) => {
            if (score < 2) {
                return type === "understanding" ? "ลองอธิบายปรากฏการณ์ด้วยทฤษฎีฟิสิกส์ที่เรียนมา" :
                       type === "systemThinking" ? "ลองคิดถึงผลระยะยาวของการแก้ปัญหา" :
                       type === "technology" ? "ลองวิเคราะห์ข้อดี-ข้อเสียของเครื่องมือที่ใช้" :
                       "ลองตอบคำถามอย่างละเอียดและแสดงความคิดเห็นของตัวเอง";
            } else if (score < 3) {
                return type === "understanding" ? "ลองเปรียบเทียบทฤษฎีกับโลกความจริง" :
                       type === "systemThinking" ? "ลองเชื่อมโยงปัญหากับความยั่งยืนของสิ่งแวดล้อม" :
                       type === "technology" ? "ลองคิดถึงผลกระทบของเทคโนโลยีในระยะยาว" :
                       "ลองแสดงจุดยืนหรือการตัดสินใจที่เด็ดขาดมากขึ้น";
            } else if (score < 4) {
                return type === "understanding" ? "ลองวิเคราะห์ขีดจำกัดของทฤษฎีในสภาวะสุดขั้ว" :
                       type === "systemThinking" ? "ลองเสนอนวัตกรรมใหม่ๆ เพื่อแก้ปัญหา" :
                       type === "technology" ? "ลองวิเคราะห์ผลกระทบรอบด้านของเทคโนโลยี" :
                       "ลองแสดงภาวะผู้นำและกล้าตัดสินใจในสถานการณ์ซับซ้อน";
            }
            return "รักษาระดับนี้ไว้และช่วยเพื่อนที่ยังสอบไม่ผ่าน";
        };
        
        return {
            understanding: u,
            systemThinking: s,
            technology: t,
            attributes: a,
            overallLevel,
            averageScore: roundedAverage,
            details: {
                understanding: {
                    reason: generateReason(u, "understanding"),
                    nextStep: generateNextStep(u, "understanding")
                },
                systemThinking: {
                    reason: generateReason(s, "systemThinking"),
                    nextStep: generateNextStep(s, "systemThinking")
                },
                technology: {
                    reason: generateReason(t, "technology"),
                    nextStep: generateNextStep(t, "technology")
                },
                attributes: {
                    reason: generateReason(a, "attributes"),
                    nextStep: generateNextStep(a, "attributes")
                }
            },
            summary: roundedAverage >= 3 ? 
                `จุดเด่นคือมีความเข้าใจทฤษฎีและแก้ปัญหาได้ดี ควรพัฒนาเพิ่มเติมในเรื่องการวิเคราะห์เชิงลึก` :
                roundedAverage >= 2 ?
                `มีพื้นฐานที่ดีและตั้งใจเรียน ควรฝึกเชื่อมโยงทฤษฎีกับการแก้ปัญหาในโลกจริง` :
                `ตั้งใจทำข้อสอบ ควรพัฒนาการอธิบายปรากฏการณ์ด้วยทฤษฎีและการวิเคราะห์เชิงระบบ`
        };
    };

    useEffect(() => {
        if (!submissionId || isAuthLoading) return;

        async function fetchData() {
            if (!user) return;

            try {
                const subRef = doc(db, "submissions", submissionId);
                let subSnap = null;
                let isArchived = false;

                try {
                    subSnap = await getDoc(subRef);
                } catch (err) {
                    console.log("Submissions check skipped or failed:", err);
                }

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

                const isAdmin = user.role === 'admin' || user.role === 'super_admin';
                if (!isAdmin && subData.studentId !== user.uid) {
                    alert("คุณไม่มีสิทธิ์เข้าถึงผลการสอบนี้");
                    router.push("/student/dashboard");
                    return;
                }

                setSubmission(subData);

                const examRef = doc(db, "exams", subData.examId);
                const examSnap = await getDoc(examRef);
                if (examSnap.exists()) {
                    const examData = { id: examSnap.id, ...examSnap.data() } as Exam;
                    setExam(examData);
                    
                    const competency = calculateCompetency(subData, examData);
                    setCompetencyData(competency);
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
            <div className="flex items-center justify-center min-h-screen text-indigo-600">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin w-10 h-10" />
                    <p>กำลังโหลดผลการประเมิน...</p>
                </div>
            </div>
        );
    }

    if (!submission || !exam || !competencyData) return null;

    // Open print popup window - Competency Only
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
        if (!printWindow) return;

        const examDate = submission.submittedAt?.toDate 
            ? submission.submittedAt.toDate().toLocaleDateString('th-TH') 
            : "-";

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ผลการประเมินสมรรถนะ - ${submission.studentName}</title>
    <style>
        @page { size: auto; margin: 15mm; }
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Sarabun', sans-serif;
            margin: 0; 
            padding: 0; 
            background: white;
            color: #333;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 0;
        }
        
        /* Header */
        .header {
            text-align: center;
            border-bottom: 2px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 18px;
            font-weight: 700;
            color: #047857;
            margin: 0 0 4px 0;
        }
        .header .subtitle {
            font-size: 12px;
            color: #666;
        }
        
        /* Overall Badge - แบบสุขุม */
        .overall-badge {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .overall-badge .level-label {
            font-size: 12px;
            color: #16a34a;
            font-weight: 600;
        }
        .overall-badge .level-name {
            font-size: 18px;
            font-weight: 700;
            color: #047857;
        }
        .overall-badge .score {
            text-align: right;
        }
        .overall-badge .score-label {
            font-size: 11px;
            color: #666;
        }
        .overall-badge .score-value {
            font-size: 32px;
            font-weight: 700;
            color: #059669;
            line-height: 1;
        }
        .overall-badge .score-value span {
            font-size: 14px;
            color: #999;
            font-weight: 400;
        }
        
        /* Student Info */
        .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 30px;
            margin-bottom: 20px;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
        }
        .info-row {
            display: flex;
            gap: 8px;
        }
        .info-row .label {
            color: #666;
            min-width: 90px;
        }
        .info-row .value {
            font-weight: 600;
            color: #333;
        }
        
        /* Section Title */
        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #047857;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #059669;
        }
        
        /* Table */
        .competency-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 11px;
        }
        .competency-table th {
            background: #f0f9ff;
            color: #0369a1;
            font-weight: 600;
            padding: 10px 8px;
            text-align: left;
            border-top: 1px solid #bae6fd;
            border-bottom: 2px solid #7dd3fc;
        }
        .competency-table th:nth-child(2) {
            text-align: center;
            width: 70px;
        }
        .competency-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }
        .competency-table tr:hover td {
            background: #f8fafc;
        }
        .competency-table td:first-child {
            font-weight: 600;
            color: #374151;
            width: 20%;
        }
        .competency-table td:nth-child(2) {
            text-align: center;
            font-weight: 700;
            font-size: 13px;
            color: #059669;
            background: #f0fdf4;
            width: 50px;
        }
        
        /* Summary */
        .summary-box {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 20px;
        }
        .summary-box .title {
            font-weight: 700;
            color: #92400e;
            font-size: 12px;
            margin-bottom: 6px;
        }
        .summary-box .content {
            font-size: 12px;
            color: #78350f;
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
            color: #9ca3af;
        }
        .signature-area {
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px dashed #9ca3af;
            width: 120px;
            margin-bottom: 4px;
            height: 20px;
        }
        .signature-label {
            font-weight: 600;
            color: #4b5563;
            font-size: 11px;
        }
        
        /* Buttons */
        .print-btn, .close-btn {
            position: fixed;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
        .print-btn {
            bottom: 16px;
            right: 16px;
            background: #059669;
            color: white;
        }
        .close-btn {
            bottom: 16px;
            right: 110px;
            background: #6b7280;
            color: white;
        }
        @media print {
            .print-btn, .close-btn { display: none; }
            body { margin: 0; }
            .container { max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ส่วนประเมินสมรรถนะ (Competency Evaluation)</h1>
            <div class="subtitle">โครงการ Hongson-CISA - วิชาฟิสิกส์</div>
        </div>

        <div class="overall-badge">
            <div>
                <div class="level-label">ระดับคุณภาพโดยรวม</div>
                <div class="level-name">${competencyData.overallLevel}</div>
            </div>
            <div class="score">
                <div class="score-label">ค่าเฉลี่ย</div>
                <div class="score-value">${competencyData.averageScore}<span>/4</span></div>
            </div>
        </div>

        <div class="student-info">
            <div class="info-row">
                <span class="label">ชื่อ-นามสกุล:</span>
                <span class="value">${submission.studentName}</span>
            </div>
            <div class="info-row">
                <span class="label">รหัสนักเรียน:</span>
                <span class="value">${user?.studentId || "-"}</span>
            </div>
            <div class="info-row">
                <span class="label">ชั้นเรียน:</span>
                <span class="value">${user?.classRoom || "-"}</span>
            </div>
            <div class="info-row">
                <span class="label">วันที่สอบ:</span>
                <span class="value">${examDate}</span>
            </div>
        </div>

        <div class="section-title">รายละเอียดการประเมิน</div>
        
        <table class="competency-table">
            <thead>
                <tr>
                    <th>องค์ประกอบ</th>
                    <th>คะแนน</th>
                    <th>เหตุผลและหลักฐาน</th>
                    <th>สิ่งที่ควรพัฒนา</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1. การเข้าใจปรากฏการณ์</td>
                    <td>${competencyData.understanding}</td>
                    <td>${competencyData.details.understanding.reason}</td>
                    <td>${competencyData.details.understanding.nextStep}</td>
                </tr>
                <tr>
                    <td>2. การเชื่อมโยงความสัมพันธ์</td>
                    <td>${competencyData.systemThinking}</td>
                    <td>${competencyData.details.systemThinking.reason}</td>
                    <td>${competencyData.details.systemThinking.nextStep}</td>
                </tr>
                <tr>
                    <td>3. เทคโนโลยี</td>
                    <td>${competencyData.technology}</td>
                    <td>${competencyData.details.technology.reason}</td>
                    <td>${competencyData.details.technology.nextStep}</td>
                </tr>
                <tr>
                    <td>4. คุณลักษณะ</td>
                    <td>${competencyData.attributes}</td>
                    <td>${competencyData.details.attributes.reason}</td>
                    <td>${competencyData.details.attributes.nextStep}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary-box">
            <div class="title">บทสรุปผู้ประเมิน</div>
            <div class="content">${competencyData.summary}</div>
        </div>

        <div class="footer">
            <div>
                Hongson-CISA AI Assessment System<br>
                Report ID: ${submission.id}
            </div>
            <div class="signature-area">
                <div class="signature-line"></div>
                <div class="signature-label">ผู้ตรวจประเมิน (AI)</div>
            </div>
        </div>
    </div>

    <button class="print-btn" onclick="window.print()">🖨️ พิมพ์</button>
    <button class="close-btn" onclick="window.close()">ปิด</button>
</body>
</html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // Normal view
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Toolbar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <Link href="/student/dashboard" className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                    <ArrowLeft size={18} /> กลับหน้าหลัก
                </Link>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md text-sm"
                >
                    <FileText size={18} /> พิมพ์รายงาน
                </button>
            </div>

            {/* Main Content */}
            <div className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                        <h1 className="text-2xl font-bold mb-2">ผลการประเมิน</h1>
                        <p className="text-indigo-100">{exam.title}</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-10">
                        {/* Student Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 rounded-lg">
                            <div><span className="text-slate-500 text-sm">ชื่อ-นามสกุล:</span> <span className="font-medium">{submission.studentName}</span></div>
                            <div><span className="text-slate-500 text-sm">รหัสนักเรียน:</span> <span className="font-medium">{user?.studentId || "-"}</span></div>
                            <div><span className="text-slate-500 text-sm">ชั้นเรียน:</span> <span className="font-medium">{user?.classRoom || "-"}</span></div>
                            <div><span className="text-slate-500 text-sm">วันที่สอบ:</span> <span className="font-medium">{submission.submittedAt?.toDate ? submission.submittedAt.toDate().toLocaleDateString('th-TH') : "-"}</span></div>
                        </div>

                        {/* Original Score */}
                        <div className={`border-2 rounded-xl p-6 mb-8 ${(submission as any).isArchived ? 'bg-slate-50 border-slate-300 border-dashed' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{exam.title}</h3>
                                    <p className="text-slate-600 text-sm">{exam.competency}</p>
                                    {(submission as any).isArchived && (
                                        <span className="mt-2 inline-block px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded">ฉบับบันทึกย้อนหลัง</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">คะแนนรวม</p>
                                    <p className="text-4xl font-bold text-indigo-600">
                                        {submission.score ?? 0}<span className="text-xl text-slate-400">/10</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Overall Feedback */}
                        {submission.feedback && (
                            <div className="mb-8">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Sparkles className="text-amber-500" size={20} /> ข้อเสนอแนะจาก AI
                                </h3>
                                <div className="bg-blue-50 p-5 rounded-lg text-slate-700 leading-relaxed border border-blue-100">
                                    {submission.feedback}
                                </div>
                            </div>
                        )}

                        {/* Competency Assessment Section */}
                        <div className="mb-8 border-t border-slate-200 pt-8">
                            <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                                <BookOpen className="text-emerald-500" size={24} /> 
                                ส่วนประเมินสมรรถนะ (Competency Evaluation)
                            </h3>
                            
                            {/* Overall Level Badge */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">ระดับคุณภาพโดยรวม</p>
                                        <p className="text-xl font-bold text-emerald-700">{competencyData.overallLevel}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-600">ค่าเฉลี่ย</p>
                                        <p className="text-3xl font-bold text-emerald-600">{competencyData.averageScore}<span className="text-lg text-slate-400">/4</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Competency Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="text-left p-3 font-semibold text-slate-700">องค์ประกอบ</th>
                                            <th className="text-center p-3 font-semibold text-slate-700 w-24">คะแนน<br/>(1-4)</th>
                                            <th className="text-left p-3 font-semibold text-slate-700">เหตุผลและหลักฐาน</th>
                                            <th className="text-left p-3 font-semibold text-slate-700">สิ่งที่ควรพัฒนา</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-100">
                                            <td className="p-3 font-medium text-slate-800">1. การเข้าใจปรากฏการณ์</td>
                                            <td className="p-3 text-center"><span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">{competencyData.understanding}</span></td>
                                            <td className="p-3 text-slate-600">{competencyData.details.understanding.reason}</td>
                                            <td className="p-3 text-slate-600 text-emerald-600">{competencyData.details.understanding.nextStep}</td>
                                        </tr>
                                        <tr className="border-b border-slate-100">
                                            <td className="p-3 font-medium text-slate-800">2. การเชื่อมโยงความสัมพันธ์</td>
                                            <td className="p-3 text-center"><span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">{competencyData.systemThinking}</span></td>
                                            <td className="p-3 text-slate-600">{competencyData.details.systemThinking.reason}</td>
                                            <td className="p-3 text-slate-600 text-emerald-600">{competencyData.details.systemThinking.nextStep}</td>
                                        </tr>
                                        <tr className="border-b border-slate-100">
                                            <td className="p-3 font-medium text-slate-800">3. เทคโนโลยี</td>
                                            <td className="p-3 text-center"><span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">{competencyData.technology}</span></td>
                                            <td className="p-3 text-slate-600">{competencyData.details.technology.reason}</td>
                                            <td className="p-3 text-slate-600 text-emerald-600">{competencyData.details.technology.nextStep}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-slate-800">4. คุณลักษณะ</td>
                                            <td className="p-3 text-center"><span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">{competencyData.attributes}</span></td>
                                            <td className="p-3 text-slate-600">{competencyData.details.attributes.reason}</td>
                                            <td className="p-3 text-slate-600 text-emerald-600">{competencyData.details.attributes.nextStep}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-800"><strong>💡 บทสรุปผู้ประเมิน:</strong> {competencyData.summary}</p>
                            </div>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="border-t border-slate-200 pt-8">
                            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                                <BookOpen className="text-indigo-500" size={20} /> รายละเอียดรายข้อ
                            </h3>

                            <div className="space-y-4">
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
                                                return `${left} → ${right}`;
                                            }).join(", ");
                                        } else {
                                            answerDisplay = "ตอบแล้ว (รูปแบบเฉพาะ)";
                                        }
                                    }

                                    return (
                                        <div key={item.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-3">
                                                    <div className="bg-indigo-600 text-white w-7 h-7 rounded flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="font-medium text-slate-800">{item.question}</div>
                                                </div>
                                                <div className="flex-shrink-0 font-bold bg-slate-100 px-3 py-1 rounded text-sm">
                                                    {rawScore} / {maxScore}
                                                </div>
                                            </div>

                                            <div className="ml-10 space-y-3">
                                                <div className="text-sm">
                                                    <span className="font-bold text-slate-500 text-xs uppercase block mb-1">คำตอบของคุณ:</span>
                                                    <p className="text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 italic">&ldquo;{answerDisplay}&rdquo;</p>
                                                </div>
                                                {aiFeedback && (
                                                    <div className="text-sm">
                                                        <span className="font-bold text-blue-600 text-xs uppercase block mb-1">คำอธิบาย/ข้อเสนอแนะ:</span>
                                                        <p className="text-slate-600 leading-relaxed">{aiFeedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
