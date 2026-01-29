"use client";

import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { Activity } from "lucide-react";

export default function AdminMonitoringPage() {
    const { isLoading } = useRoleProtection(['admin', 'super_admin']);

    if (isLoading) return null;

    return (
        <FeaturePlaceholder
            title="Live Exam Monitoring"
            description="Real-time dashboard to watch student progress, flag issues, and control exam sessions remotely."
            icon={Activity}
            role="admin"
        />
    );
}
