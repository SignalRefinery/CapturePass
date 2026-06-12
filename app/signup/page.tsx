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

export default async function SignupPage({
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
  const loginHref = new URLSearchParams();

  if (plan) loginHref.set("plan", plan);
  if (promoCode) loginHref.set("promo_code", promoCode);
  if (businessType) loginHref.set("business_type", businessType);
  if (nextPath !== "/dashboard") loginHref.set("next", nextPath);

  return (
    <Shell
      footerLeft="TapTagg"
      footerRight="Create account"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/partners", label: "Partners" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>New account</span>
        </div>
        <h1>Start your TapTagg.</h1>
        <p>
          Make one fast page for your links, socials, bookings, music, business,
          and contact info. Share it with a tap.
        </p>
      </section>

      <section className="auth-wrap">
        <div className="auth-card">
          <AuthForm
            mode="signup"
            nextPath={nextPath}
            plan={plan}
            businessType={businessType}
            initialPromoCode={promoCode}
          />

          <div className="card" style={{ marginTop: 18, padding: 16 }}>
            <div className="dashboard-kicker">Already signed up?</div>
            <p className="editor-copy" style={{ margin: "6px 0 0" }}>
              If your email is already connected to a TapTagg account, use the login page instead.
              You can reset your password there if you need to get back in.
            </p>
          </div>

          <p className="auth-switch">
            Already have an account? <Link href={`/login${loginHref.size ? `?${loginHref}` : ""}`}>Log in</Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
