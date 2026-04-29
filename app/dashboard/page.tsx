import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { InactiveState } from "@/components/dashboard/inactive-state";
import { getProfileForUserServer } from "@/lib/profile-service-server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialAuth = await getInitialAuth();
  const existing = await getProfileForUserServer(user.id);

  const firstName = user.user_metadata?.first_name || "";
  const lastName = user.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user.email || "";

  const initialProfile =
    existing ?? {
      user_id: user.id,
      full_name: fullName,
      slug:
        user.user_metadata?.suggested_slug ||
        slugify(fullName) ||
        slugify(email.split("@")[0] || "") ||
        `profile-${user.id.slice(0, 8)}`,
      role_line: "",
      intro: "",
      email,
      phone: "",
      website_url: "",
      primary_link_1_title: "Call",
      primary_link_1_url: "",
      primary_link_2_title: "Email",
      primary_link_2_url: "",
      primary_link_3_title: "Website 1",
      primary_link_3_url: "",
      primary_link_4_title: "Website",
      primary_link_4_url: "",
      is_active: false,
      referral_code: null,
      referred_by: user.user_metadata?.referral_code_used || null,
      is_affiliate: false,
      affiliate_tier: null,
      billing_exempt: false,
      lifetime_free: false,
      promo_code_used: user.user_metadata?.promo_code || null,
      is_public_official: !!user.user_metadata?.is_public_official
    };

  const fullAccess = !!initialProfile.is_active || !!initialProfile.billing_exempt;
  const myProfileHref = initialProfile.slug ? `/${initialProfile.slug}` : null;

  return (
    <Shell
      footerLeft="Dashboard"
      footerRight="Signal Pass"
      myProfileHref={myProfileHref}
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
          <span>Dashboard</span>
        </div>
        <h1>{fullAccess ? "Manage your live profile." : "Account created. Activation pending."}</h1>
        <p>
          You are signed in as <strong>{user.email}</strong>.{" "}
          {fullAccess
            ? "Refine your public presence, keep your links current, and control how your profile is presented."
            : "Complete activation to unlock the full dashboard. Founder accounts and other billing-exempt accounts bypass this requirement automatically."}
        </p>
      </section>

      {fullAccess ? (
        <>
          <ProfileEditor userId={user.id} initialProfile={initialProfile} />

          <section className="dashboard-wrap status-bottom">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Profile status</div>
                <h2>Account and plan</h2>
                <p className="editor-copy">
                  A concise view of your current access level, referral standing, and account state.
                </p>
                <div className="status-list">
                  <div className="status-row">
                    <span>Access</span>
                    <strong>{initialProfile.billing_exempt ? "Billing exempt" : initialProfile.is_active ? "Active" : "Inactive"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Plan</span>
                    <strong>{initialProfile.lifetime_free ? "Founder lifetime access" : initialProfile.stripe_plan_key || "Not set"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Referral code</span>
                    <strong>{initialProfile.referral_code || "Pending"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Affiliate standing</span>
                    <strong>{initialProfile.is_affiliate ? initialProfile.affiliate_tier || "Affiliate" : "Standard user"}</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-kicker">Compliance</div>
                <h2>Flags and origin details</h2>
                <p className="editor-copy">
                  This section surfaces signup context and any role-based items that may matter later.
                </p>
                <div className="status-list">
                  <div className="status-row">
                    <span>Public official / government-facing role</span>
                    <strong>{initialProfile.is_public_official ? "Flagged" : "No"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Promo code used</span>
                    <strong>{initialProfile.promo_code_used || "None"}</strong>
                  </div>
                  <div className="status-row">
                    <span>Referred by</span>
                    <strong>{initialProfile.referred_by || "Direct signup"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <InactiveState email={user.email || ""} />
      )}
    </Shell>
  );
}