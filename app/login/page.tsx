import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { AuthForm } from "@/components/auth/auth-form";

import { createClient } from "@/lib/supabase/server";

async function getInitialAuth() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    email: user.email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}


export default async function LoginPage() {
  const initialAuth = await getInitialAuth();

  return (
    <Shell
      footerLeft="Signal Pass"
      footerRight="Log in"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/partners", label: "Referral access" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Account access</span>
        </div>
        <h1>Log in to your dashboard.</h1>
        <p>Access your profile controls, issued NFC / QR URL, and account settings.</p>
      </section>

      <section className="auth-wrap">
        <div className="auth-card">
          <AuthForm mode="login" />
          <p className="auth-switch">Need an account? <Link href="/signup">Create one</Link></p>
        </div>
      </section>
    </Shell>
  );
}
