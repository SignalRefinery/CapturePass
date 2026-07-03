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

  return (
    <Shell
      footerLeft="CapturePass"
      footerRight="Create account"
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
          <span>New account</span>
        </div>
        <h1>Start your CapturePass.</h1>
        <p>
          Make one fast page for your links, socials, bookings, music, business,
          and contact info. Share it with NFC business cards and mobile QR codes.
        </p>
      </section>

      <section className="auth-wrap">
        <div className="auth-card">
          <AuthForm
            mode="signup"
            nextPath={params?.next || null}
            plan={plan}
            businessType={businessType}
            initialPromoCode={promoCode}
          />

          <div className="card" style={{ marginTop: 18, padding: 16 }}>
            <div className="dashboard-kicker">Already signed up?</div>
            <p className="editor-copy" style={{ margin: "6px 0 0" }}>
              If your email is already connected to a CapturePass account, use the login page instead.
              You can reset your password there if you need to get back in.
            </p>
          </div>

          <p className="auth-switch">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
