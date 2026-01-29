"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, User, GraduationCap, ArrowRight } from "lucide-react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function LoginPage() {
    const { user, loading, signInWithGoogle, loginWithStudentId } = useAuth();
    const router = useRouter();
    const [loginType, setLoginType] = useState<'student' | 'general'>('student');
    const [studentId, setStudentId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && !loading) {
            if (user.role === 'admin') router.push('/admin/dashboard');
            else if (user.role === 'super_admin' || (user.role as string) === 'superadmin') router.push('/super-admin/dashboard');
            else if (user.role === 'general_user') router.push('/general/dashboard');
            else router.push('/student/dashboard');
        }
    }, [user, loading, router]);

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!studentId.trim()) {
            setError("กรุณากรอกรหัสนักเรียน");
            return;
        }

        setIsSubmitting(true);
        try {
            await loginWithStudentId(studentId.trim());
            // Redirect handled by useEffect
        } catch (err: any) {
            setError("ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบรหัสนักเรียน");
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-mesh">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-mesh p-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md z-10"
            >
                <GlassCard padding="xl" hover={false} className="relative overflow-hidden">
                    {/* Inner glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="relative w-20 h-20 mb-4 mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                                <div className="relative w-full h-full rounded-2xl overflow-hidden glass p-2">
                                    <Image
                                        src="/logo_cisa.png"
                                        alt="Hongson-CISA Logo"
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">
                                Hongson-CISA
                            </h1>
                            <p className="text-[var(--text-secondary)] font-normal text-sm flex items-center justify-center gap-2">
                                <Sparkles size={14} className="text-[var(--accent-primary)]" />
                                ระบบประเมินสมรรถนะผู้เรียน
                            </p>
                        </div>

                        {/* Toggle Switch */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--glass-bg-solid)] rounded-xl mb-8 border border-[var(--glass-border)]">
                            <button
                                onClick={() => setLoginType('student')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${loginType === 'student'
                                        ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20'
                                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                                    }`}
                            >
                                <GraduationCap size={18} />
                                สำหรับนักเรียน
                            </button>
                            <button
                                onClick={() => setLoginType('general')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${loginType === 'general'
                                        ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20'
                                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                                    }`}
                            >
                                <User size={18} />
                                บุคคลทั่วไป
                            </button>
                        </div>

                        {/* Login Forms */}
                        <AnimatePresence mode="wait">
                            {loginType === 'student' ? (
                                <motion.form
                                    key="student-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    onSubmit={handleStudentLogin}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <GlassInput
                                            label="Student ID (รหัสนักเรียน)"
                                            placeholder="เช่น 67001"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            leftIcon={<GraduationCap size={18} />}
                                            error={error}
                                            autoFocus
                                            maxLength={5}
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)] text-center">
                                            กรอกเลขประจำตัว 5 หลักเพื่อเข้าสู่ระบบ
                                        </p>
                                    </div>

                                    <GlassButton
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        loading={isSubmitting}
                                        icon={<ArrowRight size={18} />}
                                        iconPosition="right"
                                        size="lg"
                                        className="shadow-xl shadow-blue-500/10"
                                    >
                                        เข้าทดสอบทันที
                                    </GlassButton>

                                    <p className="text-xs text-center text-[var(--text-tertiary)]">
                                        *กรอกรหัสนักเรียนเพื่อเข้าสู่ระบบและเริ่มทำแบบทดสอบได้ทันที
                                    </p>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="general-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <button
                                        onClick={signInWithGoogle}
                                        className="group relative w-full flex items-center justify-center gap-3 glass hover:bg-[var(--glass-bg-solid)] text-[var(--text-primary)] font-semibold py-4 px-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-[var(--glass-border)] hover:border-[var(--accent-primary)]"
                                    >
                                        <svg className="w-6 h-6 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span className="text-base">เข้าสู่ระบบด้วย Google</span>
                                    </button>

                                    <div className="flex items-center gap-4 py-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />
                                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Secure Access</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />
                                    </div>

                                    <p className="text-xs text-center text-[var(--text-tertiary)] max-w-xs mx-auto leading-relaxed">
                                        การเข้าใช้งานระบบถือว่าคุณยอมรับ{" "}
                                        <a href="#" className="underline hover:text-[var(--accent-primary)] transition-colors">ข้อกำหนดการใช้งาน</a>
                                        {" "}และ{" "}
                                        <a href="#" className="underline hover:text-[var(--accent-primary)] transition-colors">นโยบายความเป็นส่วนตัว</a>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </GlassCard>

                <div className="text-center mt-8">
                    <p className="text-xs text-[var(--text-tertiary)] font-medium tracking-wide">
                        © 2026 Hongson-CISA by Coolnut Academy
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
