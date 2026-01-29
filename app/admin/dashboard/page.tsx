"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { PlusCircle, FileText, Settings, Users, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
    const { isLoading } = useRoleProtection(['admin', 'super_admin']);
    const { user, logout } = useAuth(); // Destructure logout

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full bg-blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            Admin Panel
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Managing: <span className="text-emerald-400 font-semibold">{user?.assignedCompetency || "General"}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium transition-all border border-white/10"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                        <PlusCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Create New Exam</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-left mb-4">
                        Create a new competency assessment test.
                    </p>
                    <div className="mt-auto flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 transition-transform">
                        Start Creating <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </button>

                <button className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Monitoring</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-left">
                        View student progress and test results.
                    </p>
                </button>
            </div>
        </div>
    );
}
