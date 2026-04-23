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


export default async function SignupPage() {
  const initialAuth = await getInitialAuth();

  return (
    <Shell
      footerLeft="Signal Pass"
      footerRight="Create account"
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
          <span>New account</span>
        </div>
        <h1>Create your Signal Pass account.</h1>
        <p>Start with a controlled profile, direct-link access, and token-first NFC / QR issuance.</p>
      </section>

      <section className="auth-wrap">
        <div className="auth-card">
          <AuthForm mode="signup" />
          <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
        </div>
      </section>
    </Shell>
  );
}
