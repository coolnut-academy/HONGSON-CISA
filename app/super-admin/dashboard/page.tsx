"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import Link from "next/link";
import { ShieldCheck, Users, Cpu, UploadCloud } from "lucide-react";

export default function SuperAdminDashboard() {
    const { isLoading } = useRoleProtection(['super_admin']);

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800 to-black rounded-3xl p-8 text-white shadow-xl border border-slate-700">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-purple-400" />
                    System Control Center
                </h1>
                <p className="text-slate-400">
                    Full access system administration and configuration.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Management</h3>
                            <p className="text-xs text-slate-500">Student & Admin control</p>
                        </div>
                    </div>
                    <button className="w-full py-2 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700">
                        Import Students (CSV)
                    </button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Access</h3>
                            <p className="text-xs text-slate-500">Access Teacher/Admin Tools</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="w-full btn-liquid block text-center py-2 px-4 rounded-lg text-white font-medium transition-transform active:scale-95"
                    >
                        Go to Admin Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
