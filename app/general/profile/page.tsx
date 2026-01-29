"use client";

import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { UserCircle } from "lucide-react";

export default function GeneralProfilePage() {
    const { isLoading } = useRoleProtection(['general_user']);

    if (isLoading) return null;

    return (
        <FeaturePlaceholder
            title="My Profile"
            description="Personalize your account, update your display name, and manage your email preferences."
            icon={UserCircle}
            role="general_user"
        />
    );
}
