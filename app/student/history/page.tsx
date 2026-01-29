"use client";

import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { History } from "lucide-react";

export default function StudentHistoryPage() {
    const { isLoading } = useRoleProtection(['student']);

    if (isLoading) return null;

    return (
        <FeaturePlaceholder
            title="Detailed History"
            description="A comprehensive timeline of all your past exams, showing improvement trends and detailed feedback analysis."
            icon={History}
            role="student"
        />
    );
}
