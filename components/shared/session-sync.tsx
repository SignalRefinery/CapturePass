"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SessionSync() {
  const pathname = usePathname();

  useEffect(() => {
    const shouldHydrateAuth =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/account" ||
      pathname.startsWith("/account/") ||
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password" ||
      pathname === "/update-password" ||
      pathname.startsWith("/auth/");

    if (!shouldHydrateAuth) {
      return;
    }

    const supabase = createClient();

    // Force session hydration on load.
    supabase.auth.getSession();
  }, [pathname]);

  return null;
}
