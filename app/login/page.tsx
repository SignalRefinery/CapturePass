import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { AuthForm } from "@/components/auth/auth-form";

import { checkoutContinuationPath } from "@/lib/auth/checkout-continuation";
import { safeInternalRedirect } from "@/lib/auth/redirect";
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


export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{
    plan?: string;
    next?: string;
    promo_code?: string;
    business_type?: string;
  }>;
}) {
  const initialAuth = await getInitialAuth();
  const params = searchParams ? await searchParams : {};
  const plan = params?.plan || null;
  const businessType = params?.business_type || null;
  const promoCode = params?.promo_code || null;
  const fallbackNextPath = checkoutContinuationPath({
    businessType,
    plan,
    promoCode
  });
  const nextPath = safeInternalRedirect(params?.next, fallbackNextPath);
  const signupHref = new URLSearchParams();

  if (plan) signupHref.set("plan", plan);
  if (promoCode) signupHref.set("promo_code", promoCode);
  if (businessType) signupHref.set("business_type", businessType);
  if (nextPath !== "/dashboard") signupHref.set("next", nextPath);

  return (
    <Shell
      footerLeft="CapturePass"
      footerRight="Log in"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/partners", label: "Partners" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Log in</span>
        </div>
        <h1>Log in to manage your CapturePass.</h1>
        <p>
          Update your links, socials, contact actions, and everything people see when
          they tap a card or scan a mobile QR code.
        </p>
      </section>

      <section className="auth-wrap">
        <div className="auth-card">
          <AuthForm mode="login" nextPath={nextPath} plan={plan} businessType={businessType} />

          <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
            Forgot your password? Use the reset link above.
          </p>

          <p className="auth-switch">
            Need an account? <Link href={`/signup${signupHref.size ? `?${signupHref}` : ""}`}>Create one</Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
