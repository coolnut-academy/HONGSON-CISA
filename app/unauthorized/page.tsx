"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
    const { logout } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">403</h1>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Permission Denied</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                    Sorry, you do not have access to this page. Please return to the homepage or contact your administrator.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                    >
                        Return to Home
                    </Link>
                    <button
                        onClick={() => {
                            logout();
                            window.location.href = '/';
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-700 text-base font-medium rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
