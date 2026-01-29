"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If user is already logged in, redirect to correct dashboard
        if (user && !loading) {
            if (user.role === 'admin') router.push('/admin/dashboard');
            else if (user.role === 'super_admin' || (user.role as string) === 'superadmin') router.push('/super-admin/dashboard');
            else if (user.role === 'general_user') router.push('/general/dashboard');
            else router.push('/student/dashboard');
        }
    }, [user, loading, router]);

    // Show a loading spinner while checking auth status
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-mesh">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-mesh p-4 relative overflow-hidden font-sans">

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Spring-like ease
                className="w-full max-w-md z-10"
            >
                <div className="glass-card p-10 bg-white/70 dark:bg-slate-900/70 border border-white/40 dark:border-white/10 shadow-2xl shadow-blue-900/10">
                    <div className="text-center mb-10">

                        <div className="relative w-28 h-28 mb-8 mx-auto drop-shadow-xl filter">
                            <Image
                                src="/logo_cisa.png"
                                alt="Hongson-CISA Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Hongson-CISA
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-normal text-lg">
                            Competency Assessment Platform
                        </p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={signInWithGoogle}
                            className="group relative w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold py-4 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <svg className="w-6 h-6 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="text-base">Sign in with Google</span>
                        </button>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Access</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                        </div>

                        <p className="text-xs text-center text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed font-light">
                            By proceeding, you agree to the <a href="#" className="underline decoration-slate-300 hover:text-blue-500 hover:decoration-blue-400 transition-colors">Terms</a> and <a href="#" className="underline decoration-slate-300 hover:text-blue-500 hover:decoration-blue-400 transition-colors">Privacy Policy</a> of coolnut academy.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-xs text-slate-400 font-medium tracking-wide">© 2026 Hongson-CISA. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
    );
}
