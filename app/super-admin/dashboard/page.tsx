"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import Link from "next/link";
import { ShieldCheck, Users, Cpu, LayoutDashboard, ArrowRight, Upload, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Papa from "papaparse";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { db } from "@/lib/firebase";
import { doc, setDoc, writeBatch } from "firebase/firestore";

export default function SuperAdminDashboard() {
    const { isLoading } = useRoleProtection(['super_admin']);
    const { user } = useAuth();
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvResult, setCsvResult] = useState<any[]>([]);
    const [csvError, setCsvError] = useState<string>("");
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportSuccess(null);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvResult(results.data as any[]);
                setCsvError("");
            },
            error: () => {
                setCsvError("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV");
            }
        });
    };

    const handleImportToFirestore = async () => {
        if (csvResult.length === 0) return;
        
        setImporting(true);
        setImportSuccess(null);
        
        try {
            const batchSize = 400;
            let totalImported = 0;
            
            for (let i = 0; i < csvResult.length; i += batchSize) {
                const chunk = csvResult.slice(i, i + batchSize);
                const batch = writeBatch(db);
                
                for (const row of chunk) {
                    const studentId = row.studentId || row.รหัสนักเรียน || row.id;
                    if (!studentId) continue;
                    
                    const userRef = doc(db, "users", studentId);
                    batch.set(userRef, {
                        studentId: studentId,
                        firstName: row.firstName || row.ชื่อ || "",
                        lastName: row.lastName || row.นามสกุล || "",
                        classRoom: row.classRoom || row.ห้องเรียน || row.class || "",
                        role: "student",
                        createdAt: new Date(),
                    }, { merge: true });
                    
                    totalImported++;
                }
                
                await batch.commit();
            }
            
            setImportSuccess(`นำเข้าข้อมูลสำเร็จ ${totalImported} รายการ`);
            setCsvResult([]);
        } catch (error) {
            console.error("Import error:", error);
            setCsvError("เกิดข้อผิดพลาดในการนำเข้าข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setImporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-secondary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldCheck className="w-8 h-8 text-[var(--accent-secondary)]" />
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                    ศูนย์ควบคุมระบบ
                                </h1>
                                <GlassBadge variant="secondary">Super Admin</GlassBadge>
                            </div>
                            <p className="text-[var(--text-secondary)] text-lg">
                                ยินดีต้อนรับ <span className="text-[var(--accent-secondary)] font-semibold">{user?.firstName || user?.email?.split("@")[0]}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Management */}
                <GlassCard className="flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-[var(--accent-secondary)]">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">จัดการผู้ใช้งาน</h3>
                            <p className="text-xs text-[var(--text-tertiary)]">ควบคุมนักเรียนและแอดมิน</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-auto">
                        <GlassButton
                            variant="ghost"
                            icon={<Upload size={18} />}
                            onClick={() => setShowImportModal(true)}
                            fullWidth
                        >
                            นำเข้านักเรียน (CSV)
                        </GlassButton>
                        <Link href="/super-admin/users" className="btn-glass btn-secondary w-full text-center">
                            ดูรายชื่อผู้ใช้ทั้งหมด
                        </Link>
                    </div>
                </GlassCard>

                {/* AI Control */}
                <Link href="/super-admin/ai-control" className="group">
                    <GlassCard className="h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-500 group-hover:scale-110 transition-transform">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">ควบคุม AI</h3>
                                <p className="text-xs text-[var(--text-tertiary)]">จัดการระบบตรวจข้อสอบอัตโนมัติ</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">
                            ตั้งค่าและสั่งให้ AI ตรวจข้อสอบที่รอดำเนินการ
                        </p>
                        <div className="flex items-center text-cyan-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all">
                            เปิดแผงควบคุม <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </GlassCard>
                </Link>

                {/* Admin Dashboard Link */}
                <Link href="/admin/dashboard" className="group">
                    <GlassCard className="h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)] group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">หน้าแอดมิน</h3>
                                <p className="text-xs text-[var(--text-tertiary)]">เครื่องมือสำหรับครู/แอดมิน</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">
                            สร้างข้อสอบ ตรวจสอบผลสอบ และจัดการแบบทดสอบ
                        </p>
                        <div className="flex items-center text-[var(--accent-success)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all">
                            ไปยังหน้าแอดมิน <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </GlassCard>
                </Link>
            </div>

            {/* Import Modal */}
            <GlassModal
                isOpen={showImportModal}
                onClose={() => { setShowImportModal(false); setCsvResult([]); setCsvError(""); setImportSuccess(null); }}
                title="นำเข้านักเรียนจากไฟล์ CSV"
                size="lg"
                footer={
                    <>
                        <GlassButton
                            variant="ghost"
                            onClick={() => { setShowImportModal(false); setCsvResult([]); setCsvError(""); setImportSuccess(null); }}
                        >
                            ปิดหน้าต่าง
                        </GlassButton>
                        {csvResult.length > 0 && (
                            <GlassButton
                                variant="primary"
                                onClick={handleImportToFirestore}
                                loading={importing}
                            >
                                บันทึกข้อมูล ({csvResult.length} รายการ)
                            </GlassButton>
                        )}
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <a
                            href="/template/student_import_template.csv"
                            download
                            className="btn-glass btn-ghost btn-sm"
                        >
                            <Download size={16} />
                            ดาวน์โหลดเทมเพลต
                        </a>
                    </div>
                    
                    <div className="border-2 border-dashed border-[var(--glass-border)] rounded-2xl p-6 text-center hover:border-[var(--accent-primary)] transition-colors">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="w-full cursor-pointer"
                        />
                        <p className="text-sm text-[var(--text-tertiary)] mt-2">
                            รองรับไฟล์ .csv เท่านั้น
                        </p>
                    </div>
                    
                    {csvError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--accent-danger)]">
                            {csvError}
                        </div>
                    )}
                    
                    {importSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--accent-success)]">
                            ✓ {importSuccess}
                        </div>
                    )}
                    
                    {csvResult.length > 0 && (
                        <div>
                            <p className="font-semibold text-[var(--text-primary)] mb-2">
                                ตัวอย่างข้อมูล ({csvResult.length} รายการ):
                            </p>
                            <div className="overflow-x-auto max-h-48 rounded-xl border border-[var(--glass-border)]">
                                <table className="table-glass w-full text-sm">
                                    <thead>
                                        <tr>
                                            {Object.keys(csvResult[0]).map((key) => (
                                                <th key={key}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvResult.slice(0, 5).map((row, idx) => (
                                            <tr key={idx}>
                                                {Object.values(row).map((val, i) => (
                                                    <td key={i}>{val as string}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {csvResult.length > 5 && (
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                    แสดงตัวอย่าง 5 แถวแรก จากทั้งหมด {csvResult.length} รายการ
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </GlassModal>
        </div>
    );
}
