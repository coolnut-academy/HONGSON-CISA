"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc, getDoc } from "firebase/firestore";
import { Loader2, Users, Shield, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = "satitsiriwach@gmail.com";

export default function FixRolesPage() {
    const { user } = useAuth();
    const { isLoading, isAuthorized } = useRoleProtection(['super_admin']);

    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        updated: number;
        skipped: number;
        superAdminFound: boolean;
        logs: string[];
    } | null>(null);
    const [syncResult, setSyncResult] = useState<{
        total: number;
        synced: number;
        notFound: number;
        logs: string[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFixRoles = async () => {
        if (!confirm("ยืนยันการอัพเดท role ทุกคนเป็น 'student' ยกเว้น super admin?")) {
            return;
        }

        setProcessing(true);
        setError(null);
        setResult(null);

        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);

            if (snapshot.empty) {
                setError("ไม่พบผู้ใช้ในระบบ");
                setProcessing(false);
                return;
            }

            const logs: string[] = [];
            let updatedCount = 0;
            let skippedCount = 0;
            let superAdminFound = false;

            const batch = writeBatch(db);

            snapshot.forEach((docSnap) => {
                const userData = docSnap.data();
                const email = userData.email || '';
                const currentRole = userData.role;

                if (email === SUPER_ADMIN_EMAIL) {
                    if (currentRole !== 'super_admin') {
                        batch.update(doc(db, "users", docSnap.id), { role: 'super_admin' });
                        logs.push(`👑 ${email}: ${currentRole} → super_admin`);
                        updatedCount++;
                    } else {
                        logs.push(`👑 ${email}: super_admin (คงเดิม)`);
                        skippedCount++;
                    }
                    superAdminFound = true;
                } else {
                    if (currentRole !== 'student') {
                        batch.update(doc(db, "users", docSnap.id), { role: 'student' });
                        logs.push(`📝 ${email}: ${currentRole} → student`);
                        updatedCount++;
                    } else {
                        logs.push(`✓ ${email}: student (ถูกต้องแล้ว)`);
                        skippedCount++;
                    }
                }
            });

            if (updatedCount > 0) {
                await batch.commit();
            }

            setResult({
                total: snapshot.size,
                updated: updatedCount,
                skipped: skippedCount,
                superAdminFound,
                logs
            });

        } catch (err: any) {
            console.error("Error fixing roles:", err);
            setError(err.message || "เกิดข้อผิดพลาด");
        } finally {
            setProcessing(false);
        }
    };

    const handleSyncPreRegistered = async () => {
        if (!confirm("ยืนยันการซิงค์ข้อมูลจาก pre_registered_students ไปยัง users ที่มีอยู่แล้ว?")) {
            return;
        }

        setProcessing(true);
        setError(null);
        setSyncResult(null);

        try {
            const usersRef = collection(db, "users");
            const usersSnapshot = await getDocs(usersRef);

            if (usersSnapshot.empty) {
                setError("ไม่พบผู้ใช้ในระบบ");
                setProcessing(false);
                return;
            }

            const logs: string[] = [];
            let syncedCount = 0;
            let notFoundCount = 0;

            const batch = writeBatch(db);

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const studentId = userData.studentId;

                // Skip users without studentId
                if (!studentId) {
                    logs.push(`⏭️ ${userData.email}: ไม่มี studentId`);
                    continue;
                }

                // Try to get pre-registered data
                try {
                    const preRegRef = doc(db, "pre_registered_students", studentId);
                    const preRegSnap = await getDoc(preRegRef);

                    if (preRegSnap.exists()) {
                        const preData = preRegSnap.data();

                        // Check if update is needed
                        const needsUpdate =
                            userData.firstName === studentId ||
                            userData.firstName === "นักเรียน" ||
                            !userData.firstName ||
                            (preData.firstName && userData.firstName !== preData.firstName);

                        if (needsUpdate && preData.firstName) {
                            batch.update(doc(db, "users", userDoc.id), {
                                firstName: preData.firstName,
                                lastName: preData.lastName || '',
                                classRoom: preData.classRoom || userData.classRoom || null
                            });
                            logs.push(`✅ ${studentId}: ${userData.firstName} → ${preData.firstName} ${preData.lastName || ''}`);
                            syncedCount++;
                        } else {
                            logs.push(`✓ ${studentId}: ${userData.firstName} ${userData.lastName || ''} (ไม่ต้องอัพเดท)`);
                        }
                    } else {
                        logs.push(`⚠️ ${studentId}: ไม่พบใน pre_registered_students`);
                        notFoundCount++;
                    }
                } catch (fetchError: any) {
                    logs.push(`❌ ${studentId}: Error - ${fetchError.message}`);
                }
            }

            if (syncedCount > 0) {
                await batch.commit();
            }

            setSyncResult({
                total: usersSnapshot.size,
                synced: syncedCount,
                notFound: notFoundCount,
                logs
            });

        } catch (err: any) {
            console.error("Error syncing pre-registered:", err);
            setError(err.message || "เกิดข้อผิดพลาด");
        } finally {
            setProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={48} />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                        ไม่มีสิทธิ์เข้าถึง
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        เฉพาะ Super Admin เท่านั้นที่สามารถใช้หน้านี้ได้
                    </p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Fix Roles Card */}
            <GlassCard>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            แก้ไข Role ผู้ใช้ทั้งหมด
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            อัพเดททุกคนเป็น student ยกเว้น {SUPER_ADMIN_EMAIL}
                        </p>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                        ⚠️ ข้อควรระวัง
                    </h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• การดำเนินการนี้จะเปลี่ยน role ของผู้ใช้ทุกคน</li>
                        <li>• เฉพาะ <strong>{SUPER_ADMIN_EMAIL}</strong> ที่จะคง role เป็น super_admin</li>
                        <li>• ผู้ใช้อื่นทั้งหมดจะถูกเปลี่ยนเป็น student</li>
                    </ul>
                </div>

                <button
                    onClick={handleFixRoles}
                    disabled={processing}
                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {processing ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            กำลังดำเนินการ...
                        </>
                    ) : (
                        <>
                            <Users size={20} />
                            อัพเดท Role ทั้งหมด
                        </>
                    )}
                </button>
            </GlassCard>

            {/* Sync Pre-registered Card */}
            <GlassCard>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-600">
                        <RefreshCw size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            ซิงค์ข้อมูลนักเรียน
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            อัพเดทชื่อ-นามสกุลจาก pre_registered_students ไปยังผู้ใช้ที่มีอยู่แล้ว
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        📋 ฟังก์ชันนี้จะ:
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• ดึงข้อมูล ชื่อ-นามสกุล-ห้องเรียน จาก pre_registered_students</li>
                        <li>• อัพเดทไปยัง users ที่มี studentId ตรงกัน</li>
                        <li>• ช่วยแก้ปัญหาผู้ใช้ที่มีชื่อเป็นรหัสนักเรียน</li>
                    </ul>
                </div>

                <button
                    onClick={handleSyncPreRegistered}
                    disabled={processing}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {processing ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            กำลังซิงค์...
                        </>
                    ) : (
                        <>
                            <UserCheck size={20} />
                            ซิงค์ข้อมูลนักเรียน
                        </>
                    )}
                </button>
            </GlassCard>

            {/* Error Message */}
            {error && (
                <GlassCard className="border-red-500/50">
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertCircle size={24} />
                        <p className="font-medium">{error}</p>
                    </div>
                </GlassCard>
            )}

            {/* Fix Roles Result */}
            {result && (
                <GlassCard>
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="text-green-500" size={28} />
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            อัพเดท Role เสร็จสิ้น!
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-[var(--glass-bg)] rounded-xl">
                            <p className="text-3xl font-bold text-[var(--accent-primary)]">{result.total}</p>
                            <p className="text-sm text-[var(--text-secondary)]">ผู้ใช้ทั้งหมด</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-xl">
                            <p className="text-3xl font-bold text-green-600">{result.updated}</p>
                            <p className="text-sm text-[var(--text-secondary)]">อัพเดทแล้ว</p>
                        </div>
                        <div className="text-center p-4 bg-gray-500/10 rounded-xl">
                            <p className="text-3xl font-bold text-gray-600">{result.skipped}</p>
                            <p className="text-sm text-[var(--text-secondary)]">ข้าม (ถูกต้องแล้ว)</p>
                        </div>
                    </div>

                    {!result.superAdminFound && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                            <p className="text-yellow-800 dark:text-yellow-200">
                                ⚠️ ไม่พบ {SUPER_ADMIN_EMAIL} ในระบบ กรุณา Login ด้วยบัญชีนี้อย่างน้อย 1 ครั้ง
                            </p>
                        </div>
                    )}

                    <div className="bg-[var(--glass-bg)] rounded-xl p-4 max-h-64 overflow-y-auto">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2">Log:</h3>
                        <div className="text-sm text-[var(--text-secondary)] space-y-1 font-mono">
                            {result.logs.map((log, i) => (
                                <p key={i}>{log}</p>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Sync Result */}
            {syncResult && (
                <GlassCard>
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="text-blue-500" size={28} />
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            ซิงค์ข้อมูลเสร็จสิ้น!
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-[var(--glass-bg)] rounded-xl">
                            <p className="text-3xl font-bold text-[var(--accent-primary)]">{syncResult.total}</p>
                            <p className="text-sm text-[var(--text-secondary)]">ผู้ใช้ทั้งหมด</p>
                        </div>
                        <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                            <p className="text-3xl font-bold text-blue-600">{syncResult.synced}</p>
                            <p className="text-sm text-[var(--text-secondary)]">ซิงค์แล้ว</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-500/10 rounded-xl">
                            <p className="text-3xl font-bold text-yellow-600">{syncResult.notFound}</p>
                            <p className="text-sm text-[var(--text-secondary)]">ไม่พบข้อมูล</p>
                        </div>
                    </div>

                    <div className="bg-[var(--glass-bg)] rounded-xl p-4 max-h-64 overflow-y-auto">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2">Log:</h3>
                        <div className="text-sm text-[var(--text-secondary)] space-y-1 font-mono">
                            {syncResult.logs.map((log, i) => (
                                <p key={i}>{log}</p>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="text-center">
                <Link
                    href="/super-admin/dashboard"
                    className="text-[var(--accent-primary)] hover:underline"
                >
                    ← กลับไปหน้า Dashboard
                </Link>
            </div>
        </div>
    );
}
