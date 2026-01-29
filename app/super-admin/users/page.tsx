"use client";

import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { Users } from "lucide-react";

export default function UserManagementPage() {
    const { isLoading } = useRoleProtection(['super_admin']);

    if (isLoading) return null;

    return (
        <FeaturePlaceholder
            title="User Management"
            description="Advanced user control panel to manually add, edit, or remove users and manage roles directly."
            icon={Users}
            role="super_admin"
        />
    );
}
