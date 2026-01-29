"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-white/10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6">
                            <span className="text-white text-2xl font-bold">H</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Hongson-CISA
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            Competency Assessment Platform
                        </p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={signInWithGoogle}
                            className="group relative w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-100 dark:hover:border-blue-900 hover:bg-blue-50/50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold py-4 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
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
                            <span>Sign in with Google</span>
                            <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Secure Access</span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        </div>

                        <p className="text-xs text-center text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
                            By proceeding, you agree to the <a href="#" className="underline hover:text-blue-500">Terms</a> and <a href="#" className="underline hover:text-blue-500">Privacy Policy</a> of coolnut academy.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-xs text-slate-500 font-medium">© 2026 Hongson-CISA. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
    );
}
