"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Shield, User, GraduationCap, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function DevSetupPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            router.push("/404");
        }
    }, [router]);

    if (process.env.NODE_ENV !== "development") {
        return null; // Or return generic 404 UI
    }

    if (loading) return <div className="p-10">Loading...</div>;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Developer Setup</h1>
                    <p className="mb-4">Please login first to use this tool.</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const updateRole = async (
        role: 'student' | 'admin' | 'super_admin',
        additionalData: any = {}
    ) => {
        if (!user.uid) return;

        setIsUpdating(true);
        setStatus(null);

        try {
            const userRef = doc(db, "users", user.uid);

            // Basic data update
            const updateData = {
                role,
                ...additionalData
            };

            await updateDoc(userRef, updateData);

            setStatus(`Successfully updated role to ${role}`);

            // Force reload to refresh context is often easiest, or wait for onAuthStateChanged
            // But typically onAuthStateChanged listener in AuthContext handles updates if we listen to doc changes
            // Our AuthContext currently listens to Auth state, but inside it fetches fresh doc data on auth state change.
            // It DOES NOT set up a realtime listener on the user DOC. 
            // So to see changes immediately in the app without refresh, we might need a refresh.
            // Let's reload the page after a short delay to ensure context updates.
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Error updating role:", error);
            setStatus("Error updating role");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-3 mb-8">
                    <AlertTriangle className="text-amber-500 w-8 h-8" />
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Developer Setup</h1>
                        <p className="text-slate-500">Only visible in development mode</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Current Session</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 block">UID</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded select-all">{user.uid}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Email</span>
                            <span className="font-medium">{user.email}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Current Role</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                ${user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                                    user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                        'bg-blue-100 text-blue-800'}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${status.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                        {status.includes("Error") ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                        {status}
                    </div>
                )}

                <div className="grid gap-4">
                    <button
                        disabled={isUpdating}
                        onClick={() => updateRole('student', {
                            studentId: '660101',
                            firstName: 'Dev',
                            lastName: 'Student',
                            classRoom: '4/1',
                            assignedCompetency: null // Clear admin fields
                        })}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                    >
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white">Set as Student</div>
                            <div className="text-sm text-slate-500">
                                Sets role to 'student' with ID 660101
                            </div>
                        </div>
                    </button>

                    <button
                        disabled={isUpdating}
                        onClick={() => updateRole('admin', {
                            assignedCompetency: 'Thinking',
                            studentId: null, // Clear student fields
                            firstName: 'Dev',
                            lastName: 'Admin',
                            classRoom: null
                        })}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all text-left group"
                    >
                        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <User size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white">Set as Admin</div>
                            <div className="text-sm text-slate-500">
                                Sets role to 'admin' (Competency: Thinking)
                            </div>
                        </div>
                    </button>

                    <button
                        disabled={isUpdating}
                        onClick={() => updateRole('super_admin', {
                            assignedCompetency: null,
                            studentId: null,
                            classRoom: null
                        })}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left group"
                    >
                        <div className="p-3 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Shield size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white">Set as Super Admin</div>
                            <div className="text-sm text-slate-500">
                                Sets role to 'super_admin' with full access
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
