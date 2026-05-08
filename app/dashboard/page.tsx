import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { InactiveState } from "@/components/dashboard/inactive-state";
import { getProfileForUserServer } from "@/lib/profile-service-server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

async function submitFounderCardClaim(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, slug, private_token, billing_exempt, lifetime_free, promo_code_used")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.billing_exempt && !profile?.lifetime_free && profile?.promo_code_used !== "FOUNDERS") {
    redirect("/dashboard");
  }

  const shippingName = String(formData.get("shipping_name") || "").trim();
  const line1 = String(formData.get("line1") || "").trim();
  const line2 = String(formData.get("line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const postalCode = String(formData.get("postal_code") || "").trim();

  if (!shippingName || !line1 || !city || !state || !postalCode) {
    redirect("/dashboard?claim_founder_card=1&claim_error=missing_fields");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://signal-pass.vercel.app").replace(/\/$/, "");
  const tokenUrl = profile?.private_token ? `${siteUrl}/u/${profile.private_token}` : null;
  const qrUrl = tokenUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(tokenUrl)}&size=600`
    : null;

  if (!process.env.RESEND_API_KEY) {
    redirect("/dashboard?claim_founder_card=1&claim_error=email_not_configured");
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "SignalPass <notifications@signalpass.app>",
      to: "john@signalpass.app",
      subject: `Founder card claimed: ${shippingName}`,
      html: `
        <h2>Founder card claimed</h2>
        <p><strong>Name:</strong> ${profile?.full_name || shippingName}</p>
        <p><strong>Email:</strong> ${profile?.email || user.email || "—"}</p>
        <p><strong>Promo:</strong> ${profile?.promo_code_used || "FOUNDERS"}</p>
        <p><strong>Shipping Address:</strong><br />
          ${shippingName}<br />
          ${line1}<br />
          ${line2 ? `${line2}<br />` : ""}
          ${city}, ${state} ${postalCode}<br />
          US
        </p>
        <p><strong>Slug:</strong> ${profile?.slug || "—"}</p>
        ${tokenUrl ? `<p><strong>Token URL:</strong> <a href="${tokenUrl}">${tokenUrl}</a></p>` : ""}
        ${qrUrl ? `<p><strong>QR image URL:</strong> <a href="${qrUrl}">${qrUrl}</a></p><p><img src="${qrUrl}" alt="QR code" width="300" height="300" /></p>` : ""}
      `
    })
  });

  if (!resendResponse.ok) {
    redirect("/dashboard?claim_founder_card=1&claim_error=email_failed");
  }

  redirect("/dashboard?founder_card_claimed=1");
}

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

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{
    claim_founder_card?: string;
    founder_card_claimed?: string;
    claim_error?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialAuth = await getInitialAuth();
  const existing = await getProfileForUserServer(user.id);

  const params = searchParams ? await searchParams : {};

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

  const showFounderClaimForm =
    params?.claim_founder_card === "1" &&
    (!!initialProfile.billing_exempt || !!initialProfile.lifetime_free || initialProfile.promo_code_used === "FOUNDERS");

  const founderClaimed = params?.founder_card_claimed === "1";
  const claimError = params?.claim_error || null;

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
          {founderClaimed ? (
            <section className="dashboard-wrap">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Founder card</div>
                <h2>Founder card claim received.</h2>
                <p className="editor-copy">
                  Your shipping details were sent successfully. You can continue editing your profile below.
                </p>
              </div>
            </section>
          ) : null}

          {showFounderClaimForm ? (
            <section className="dashboard-wrap">
              <div className="dashboard-card">
                <div className="dashboard-kicker">Founder card</div>
                <h2>Claim your founder card.</h2>
                <p className="editor-copy">
                  Founder access bypasses Stripe, so enter your shipping details here to have your physical SignalPass card prepared.
                </p>

                {claimError ? (
                  <p className="editor-copy">
                    {claimError === "email_failed"
                      ? "The claim was submitted, but the notification email failed to send. Check the Resend configuration and try again."
                      : claimError === "email_not_configured"
                        ? "The claim form is working, but the email service is not configured. Add RESEND_API_KEY and try again."
                        : "Please complete the required shipping fields before submitting."}
                  </p>
                ) : null}

                <form action={submitFounderCardClaim} className="editor-form">
                  <label className="editor-label">
                    Shipping name
                    <input
                      className="editor-input"
                      name="shipping_name"
                      defaultValue={initialProfile.full_name || ""}
                      required
                    />
                  </label>

                  <label className="editor-label">
                    Address line 1
                    <input className="editor-input" name="line1" required />
                  </label>

                  <label className="editor-label">
                    Address line 2
                    <input className="editor-input" name="line2" />
                  </label>

                  <div className="editor-grid">
                    <label className="editor-label">
                      City
                      <input className="editor-input" name="city" required />
                    </label>

                    <label className="editor-label">
                      State
                      <input className="editor-input" name="state" maxLength={2} required />
                    </label>

                    <label className="editor-label">
                      ZIP
                      <input className="editor-input" name="postal_code" inputMode="numeric" required />
                    </label>
                  </div>

                  <button className="button button-primary" type="submit">
                    Send founder card claim
                  </button>
                </form>
              </div>
            </section>
          ) : null}

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