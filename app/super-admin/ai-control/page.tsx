"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
    Cpu,
    Play,
    Loader2,
    CheckCircle2,
    BarChart3,
    TerminalSquare
} from "lucide-react";

const COMPETENCIES = [
    "All",
    "1. Scientific Explanations",
    "2. Data Interpretation",
    "3. Inquiry Design",
    "4. Argumentation",
    "5. Societal Implications",
    "6. Nature of Science"
];

export default function AIControlPanel() {
    const { isLoading: isAuthLoading } = useRoleProtection(['super_admin']);
    const { user } = useAuth();

    const [pendingCount, setPendingCount] = useState<number | null>(null);
    const [isGrading, setIsGrading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Form State
    const [selectedCompetency, setSelectedCompetency] = useState("All");
    const [batchSize, setBatchSize] = useState(20);

    // Fetch Stats
    const fetchStats = async () => {
        try {
            const q = query(
                collection(db, "submissions"),
                where("status", "==", "pending")
            );
            const snapshot = await getCountFromServer(q);
            setPendingCount(snapshot.data().count);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            fetchStats();
            // Optional: Polling every 30s
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthLoading]);

    const addLog = (message: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${message}`, ...prev]);
    };

    const handleStartGrading = async () => {
        setIsGrading(true);
        addLog(`Starting batch grading... (Limit: ${batchSize}, Filter: ${selectedCompetency})`);

        try {
            const functions = getFunctions();
            const gradeExamBatch = httpsCallable(functions, 'gradeExamBatch');

            const result: any = await gradeExamBatch({
                limit: batchSize,
                competency: selectedCompetency
            });

            const data = result.data;

            if (data.success) {
                addLog(`Batch complete. Successfully graded: ${data.gradedCount} exams.`);
                if (data.gradedCount === 0) {
                    addLog("No pending submissions matched your criteria.");
                }
            } else {
                addLog(`Batch finished with unexpected response.`);
            }

            // Refresh stats
            fetchStats();

        } catch (error: any) {
            console.error("Cloud Function Error:", error);
            addLog(`Error: ${error.message || "Failed to execute function."}`);
        } finally {
            setIsGrading(false);
        }
    };

    if (isAuthLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-purple-400" />
                        AI Grading-Control
                    </h1>
                    <p className="text-purple-200">
                        Manage Vertex AI grading jobs for student submissions.
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[150px] text-center border border-white/20">
                    <p className="text-sm text-purple-200 mb-1">Pending Queue</p>
                    {pendingCount === null ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/50" />
                    ) : (
                        <p className="text-4xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                            {pendingCount}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Control Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                        <BarChart3 className="text-sky-400" />
                        <h2 className="text-xl font-semibold text-white">Job Configuration</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Target Competency</label>
                            <select
                                value={selectedCompetency}
                                onChange={(e) => setSelectedCompetency(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 flex justify-between">
                                <span>Batch Size Limit</span>
                                <span className="text-slate-500">{batchSize} items</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={batchSize}
                                onChange={(e) => setBatchSize(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>1</span>
                                <span>100</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleStartGrading}
                                disabled={isGrading}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGrading ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Play className="fill-current" /> Start Grading
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logs Console */}
                <div className="bg-black border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col h-[400px]">
                    <div className="flex items-center gap-3 mb-4">
                        <TerminalSquare className="text-emerald-500" />
                        <h2 className="text-lg font-semibold text-white">System Logs</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar pr-2">
                        {logs.length === 0 && (
                            <p className="text-slate-700 italic">Ready to process...</p>
                        )}
                        {logs.map((log, idx) => (
                            <div key={idx} className="text-slate-300 border-l-2 border-slate-800 pl-3 py-1">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
