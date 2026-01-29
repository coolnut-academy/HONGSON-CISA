"use client";

import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { Settings } from "lucide-react";

export default function SystemSettingsPage() {
    const { isLoading } = useRoleProtection(['super_admin']);

    if (isLoading) return null;

    return (
        <FeaturePlaceholder
            title="System Configuration"
            description="Global settings to toggle maintenance mode, configure AI grading parameters, and manage API keys."
            icon={Settings}
            role="super_admin"
        />
    );
}
