"use client";

import "./globals.css";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function SessionSync() {
  useEffect(() => {
    const supabase = createClient();

    // Force session hydration on load
    supabase.auth.getSession();
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionSync />
        {children}
      </body>
    </html>
  );
}