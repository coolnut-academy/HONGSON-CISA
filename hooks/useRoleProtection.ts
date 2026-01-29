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
            } else if (!allowedRoles.includes(user.role)) {
                // Logged in but not allowed
                router.push("/unauthorized");
            } else {
                // Authorized
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router, allowedRoles]);

    return { isLoading: loading || !isAuthorized, isAuthorized };
}
