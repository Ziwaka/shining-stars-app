"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasPageAccess } from "@/lib/permissions";
import { getDefaultPathForRole, readStoredUser } from "./authStorage";

export default function AuthGate({
  allowedRoles = [],
  children,
  fallback = null,
  redirectTo = "/login",
  checkPagePermission = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const allowedRoleKey = allowedRoles.join("|");

  useEffect(() => {
    const auth = readStoredUser();
    const role = auth?.userRole;
    const allowed = allowedRoles.length === 0 || allowedRoles.includes(role);
    const pageAllowed = !auth || !checkPagePermission || hasPageAccess(auth, pathname);

    if (!auth || !allowed) {
      router.replace(redirectTo);
      setReady(false);
      return;
    }

    if (!pageAllowed) {
      router.replace(getDefaultPathForRole(role));
      setReady(false);
      return;
    }

    setUser(auth);
    setReady(true);
  }, [allowedRoleKey, checkPagePermission, pathname, redirectTo, router]);

  if (!ready) return fallback;

  return typeof children === "function" ? children(user) : children;
}
