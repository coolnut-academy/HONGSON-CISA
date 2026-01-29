"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !loading) {
            if (user.role === 'admin') router.push('/admin/dashboard');
            else if (user.role === 'super_admin' || (user.role as string) === 'superadmin') router.push('/super-admin/dashboard');
            else if (user.role === 'general_user') router.push('/general/dashboard');
            else router.push('/student/dashboard');
        }
    }, [user, loading, router]);

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
                        <div className="text-center mb-10">
                            <div className="relative w-24 h-24 mb-6 mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                                <div className="relative w-full h-full rounded-3xl overflow-hidden glass p-2">
                                    <Image
                                        src="/logo_cisa.png"
                                        alt="Hongson-CISA Logo"
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
                                Hongson-CISA
                            </h1>
                            <p className="text-[var(--text-secondary)] font-normal text-base flex items-center justify-center gap-2">
                                <Sparkles size={16} className="text-[var(--accent-primary)]" />
                                ระบบประเมินสมรรถนะผู้เรียน
                            </p>
                        </div>

                        <div className="space-y-6">
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
                        </div>
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
