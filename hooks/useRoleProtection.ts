"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export function useRoleProtection(allowedRoles: UserRole[]) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in
                router.push("/login");
            } else if (!allowedRoles.includes(user.role) && user.role !== 'super_admin') {
                // Logged in but not allowed
                console.warn(`[RoleProtection] Access denied. User role: "${user.role}", Allowed: [${allowedRoles.join(', ')}]`);
                router.push("/unauthorized");
            } else {
                // Authorized
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router, allowedRoles]);

    return { isLoading: loading || !isAuthorized, isAuthorized };
}
