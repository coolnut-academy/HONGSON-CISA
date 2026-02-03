"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * /student/exams page
 * Redirects to /student/dashboard since exams are displayed there
 */
export default function StudentExamsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard which contains all exams
        router.replace("/student/dashboard");
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin text-[var(--accent-primary)] w-10 h-10" />
            <p className="text-[var(--text-secondary)]">กำลังนำไปยังหน้าแบบทดสอบ...</p>
        </div>
    );
}
