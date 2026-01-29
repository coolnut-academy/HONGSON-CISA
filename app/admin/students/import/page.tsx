"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import { db } from "@/lib/firebase";
import { writeBatch, doc } from "firebase/firestore";

interface StudentImportData {
    studentId: string;
    firstName: string;
    lastName: string;
    classRoom: string;
}

// Rate limiting configuration for Firebase quota
const IMPORT_CONFIG = {
    batchSize: 100,           // Smaller batches to avoid quota
    delayBetweenBatches: 1500, // 1.5 seconds between batches
    maxStudentsPerImport: 5000 // Max students per import
};

export default function StudentImportPage() {
    useRoleProtection(['admin', 'super_admin']);

    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<StudentImportData[]>([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [totalBatches, setTotalBatches] = useState(0);
    const [importStatus, setImportStatus] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setSuccessMessage(null);
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                setError("กรุณาอัปโหลดไฟล์ CSV เท่านั้น");
                return;
            }
            setFile(selectedFile);

            // Parse for preview
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data as any[];
                    // Basic validation of header
                    if (data.length > 0 && (!data[0].studentId || !data[0].firstName)) {
                        setError("รูปแบบไฟล์ไม่ถูกต้อง: ต้องมีคอลัมน์ studentId และ firstName");
                        return;
                    }
                    setPreviewData(data.slice(0, 5) as StudentImportData[]);
                    if (data.length > IMPORT_CONFIG.maxStudentsPerImport) {
                        setError(`จำนวนข้อมูลเกินกว่าที่กำหนด (สูงสุด ${IMPORT_CONFIG.maxStudentsPerImport} รายการ)`);
                        return;
                    }
                    setTotal(data.length);
                    setTotalBatches(Math.ceil(data.length / IMPORT_CONFIG.batchSize));
                },
                error: (err) => {
                    setError("เกิดข้อผิดพลาดในการอ่านไฟล์: " + err.message);
                }
            });
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setProgress(0);
        setError(null);
        setSuccessMessage(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data as StudentImportData[];
                const batchSize = IMPORT_CONFIG.batchSize;
                const numBatches = Math.ceil(data.length / batchSize);
                setTotalBatches(numBatches);

                try {
                    for (let i = 0; i < numBatches; i++) {
                        setCurrentBatch(i + 1);
                        setImportStatus(`กำลังบันทึก batch ${i + 1}/${numBatches}...`);
                        
                        const batch = writeBatch(db);
                        const start = i * batchSize;
                        const end = start + batchSize;
                        const chunk = data.slice(start, end);

                        chunk.forEach((student) => {
                            if (student.studentId) {
                                // Write to pre_registered_students collection
                                const ref = doc(db, "pre_registered_students", student.studentId.trim());
                                batch.set(ref, {
                                    studentId: student.studentId.trim(),
                                    firstName: student.firstName?.trim() || "",
                                    lastName: student.lastName?.trim() || "",
                                    classRoom: student.classRoom?.trim() || "",
                                    updatedAt: new Date()
                                });
                            }
                        });

                        await batch.commit();

                        // Rate limiting delay to avoid Firebase quota limits
                        // Longer delay for larger imports
                        const delay = data.length > 1000 
                            ? IMPORT_CONFIG.delayBetweenBatches 
                            : 500;
                        
                        setImportStatus(`รอ ${delay/1000} วินาที เพื่อหลีกเลี่ยง quota...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        
                        setProgress(((i + 1) / numBatches) * 100);
                    }

                    setImportStatus("");
                    setSuccessMessage(`นำเข้าข้อมูลสำเร็จทั้งหมด ${data.length} รายการ`);
                    setFile(null);
                    setPreviewData([]);
                    setTotal(0);
                } catch (err: any) {
                    console.error("Import error:", err);
                    setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + err.message);
                } finally {
                    setImporting(false);
                }
            },
            error: (err) => {
                setImporting(false);
                setError("เกิดข้อผิดพลาดในการประมวลผล CSV: " + err.message);
            }
        });
    };

    const downloadTemplate = () => {
        const csvContent = "studentId,firstName,lastName,classRoom\n67001,สมชาย,ใจดี,ม.4/1\n67002,สมหญิง,รักเรียน,ม.4/2\n67003,วิชัย,เก่งกาจ,ม.5/1\n67004,มานี,ขยัน,ม.5/2\n67005,ปิยะ,สดใส,ม.6/1";
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/admin/dashboard" className="p-2 rounded-full hover:bg-[var(--glass-bg)] transition-colors text-[var(--text-secondary)]">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                นำเข้าข้อมูลนักเรียน (CSV)
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                เพิ่มรายชื่อนักเรียนเข้าระบบล่วงหน้าเพื่อการเข้าใช้งานที่รวดเร็ว
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Upload className="text-[var(--accent-primary)]" size={20} />
                                อัปโหลดไฟล์
                            </h2>
                            <GlassButton variant="outline" size="sm" onClick={downloadTemplate} icon={<Download size={16} />}>
                                ดาวน์โหลด Template
                            </GlassButton>
                        </div>

                        <div className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 text-center transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--glass-bg)] group relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={importing}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 rounded-full bg-[var(--glass-bg-solid)] text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">
                                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        รองรับไฟล์นามสกุล .CSV (UTF-8)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {importing && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>
                                        กำลังนำเข้าข้อมูล... 
                                        {currentBatch > 0 && <span className="text-[var(--text-tertiary)]"> (Batch {currentBatch}/{totalBatches})</span>}
                                    </span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                {importStatus && (
                                    <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                                        <Loader2 size={12} className="animate-spin" />
                                        {importStatus}
                                    </p>
                                )}
                                <div className="h-2 bg-[var(--glass-bg-solid)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-[var(--accent-danger)]">
                                <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold">เกิดข้อผิดพลาด</p>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 text-[var(--accent-success)]">
                                <CheckCircle2 className="flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold">ดำเนินการเสร็จสิ้น</p>
                                    <p className="text-sm opacity-90">{successMessage}</p>
                                </div>
                            </div>
                        )}

                        {file && !importing && !successMessage && (
                            <GlassButton
                                fullWidth
                                variant="primary"
                                size="lg"
                                onClick={handleImport}
                                disabled={total === 0}
                            >
                                ยืนยันการนำเข้า {total} รายชื่อ
                            </GlassButton>
                        )}
                    </GlassCard>
                </div>

                {/* Preview / Instructions */}
                <div className="space-y-6">
                    {file && previewData.length > 0 && (
                        <GlassCard>
                            <h3 className="font-semibold mb-4 text-[var(--text-primary)]">ตัวอย่างข้อมูล ({total} รายการ)</h3>
                            <div className="space-y-3">
                                {previewData.map((row, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-[var(--glass-bg)] text-sm">
                                        <div className="font-medium text-[var(--text-primary)]">
                                            {row.studentId}
                                        </div>
                                        <div className="text-[var(--text-secondary)]">
                                            {row.firstName} {row.lastName}
                                        </div>
                                        {row.classRoom && (
                                            <div className="text-xs text-[var(--text-tertiary)] mt-1">
                                                ห้อง: {row.classRoom}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {total > 5 && (
                                    <p className="text-center text-xs text-[var(--text-tertiary)] pt-2">
                                        ...และอีก {total - 5} รายการ
                                    </p>
                                )}
                            </div>
                        </GlassCard>
                    )}

                    <GlassCard>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-[var(--accent-warning)]" />
                            คำแนะนำ
                        </h3>
                        <ul className="text-sm text-[var(--text-secondary)] space-y-2 list-disc list-inside">
                            <li>ไฟล์ CSV ต้องมีคอลัมน์ <code>studentId</code>, <code>firstName</code> เป็นอย่างน้อย</li>
                            <li>หากรหัสนักเรียนซ้ำ ระบบจะทำการอัปเดตข้อมูลเดิม</li>
                            <li>ระบบจะบันทึกข้อมูลเพื่อเตรียมสร้างบัญชีเมื่อนักเรียนล็อกอินครั้งแรก</li>
                            <li>สามารถนำเข้าได้ครั้งละไม่เกิน {IMPORT_CONFIG.maxStudentsPerImport.toLocaleString()} รายชื่อ</li>
                            <li>สำหรับไฟล์ขนาดใหญ่ (1,000+) ระบบจะหน่วงเวลาระหว่าง batch เพื่อหลีกเลี่ยง Firebase quota</li>
                            <li>นักเรียนกรอกแค่รหัสนักเรียนก็สามารถเข้าใช้งานได้ทันที</li>
                        </ul>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
