"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const COMPETENCIES = [
    "1. Scientific Explanations",
    "2. Data Interpretation",
    "3. Inquiry Design",
    "4. Argumentation",
    "5. Societal Implications",
    "6. Nature of Science"
];

export default function CreateExamPage() {
    const { user } = useAuth();
    const { isLoading, isAuthorized } = useRoleProtection(['admin', 'super_admin']);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        competency: "",
        scenario: "",
        question: "",
        rubricPrompt: "",
        isActive: true
    });

    // Pre-fill competency based on user role
    useEffect(() => {
        if (user) {
            if (user.role === 'admin' && user.assignedCompetency) {
                setFormData(prev => ({ ...prev, competency: user.assignedCompetency! }));
            } else if (user.role === 'super_admin' && !formData.competency) {
                // Default to first one or keep empty for super admin to choose
                setFormData(prev => ({ ...prev, competency: COMPETENCIES[0] }));
            }
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "exams"), {
                ...formData,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            });

            alert("Exam created successfully!");
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Error creating exam:", error);
            alert("Failed to create exam. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    // Determine if competency selection is disabled
    const isCompetencyDisabled = user?.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/admin/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Exam</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Design a new competency-based assessment scenario.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">

                {/* Title & Competency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Exam Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Global Warming Analysis"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Target Competency <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                required
                                name="competency"
                                value={formData.competency}
                                onChange={handleChange}
                                disabled={isCompetencyDisabled}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {COMPETENCIES.map((comp) => (
                                    <option key={comp} value={comp}>
                                        {comp}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        {isCompetencyDisabled && (
                            <p className="text-xs text-slate-500">Locked to your assigned competency.</p>
                        )}
                    </div>
                </div>

                {/* Scenario */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Scenario / Stimulus Material <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        name="scenario"
                        value={formData.scenario}
                        onChange={handleChange}
                        rows={8}
                        placeholder="Describe the scientific phenomenon, experiment, or situation..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y font-mono text-sm leading-relaxed"
                    />
                </div>

                {/* Question */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Assessment Question <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        rows={3}
                        placeholder="What should the student answer?"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                    />
                </div>

                {/* Grading Rubric */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        AI Grading Prompt
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">Internal Use</span>
                    </label>
                    <textarea
                        required
                        name="rubricPrompt"
                        value={formData.rubricPrompt}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Instructions for the AI: 'Award full points if the student mentions momentum conservation...'"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y"
                    />
                </div>

                <div className="pt-4 flex items-center justify-end gap-4">
                    <Link
                        href="/admin/dashboard"
                        className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Create Exam
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
