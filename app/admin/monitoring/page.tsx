"use client";

import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { Activity } from "lucide-react";

export default function AdminMonitoringPage() {
    const { isLoading } = useRoleProtection(['admin', 'super_admin']);

    if (isLoading) return null;

    return (
        <FeaturePlaceholder
            title="ตรวจสอบข้อสอบสด"
            description="แดชบอร์ดเรียลไทม์สำหรับติดตามความคืบหน้าของนักเรียน แจ้งเตือนปัญหา และควบคุมการสอบจากระยะไกล"
            icon={Activity}
            role="admin"
        />
    );
}
