import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUrl } from "@/lib/utils";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

type PageProps = {
  params: Promise<{ userId: string }>;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !user.email ||
    !ADMIN_EMAILS.includes(user.email.toLowerCase())
  ) {
    redirect("/dashboard");
  }

  return user;
}

async function updateUserAction(formData: FormData) {
  "use server";

  await requireAdmin();

  const userId = String(formData.get("userId") || "");
  const field = String(formData.get("field") || "");
  const value = String(formData.get("value") || "");

  if (!userId || !field) return;

  const updates: Record<string, unknown> = {};

  switch (field) {
    case "full_name":
      updates.full_name = value.trim() || null;
      break;
    case "email":
      updates.email = value.trim() || null;
      break;
    case "slug": {
      const nextSlug = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      updates.slug = nextSlug || null;
      break;
    }
    case "role_line":
    case "intro":
    case "phone":
    case "primary_link_1_title":
    case "primary_link_2_title":
    case "primary_link_3_title":
    case "primary_link_4_title":
      updates[field] = value.trim() || null;
      break;
    case "website_url":
      updates.website_url = normalizeUrl(value.trim() || "") || null;
      break;
    case "primary_link_1_url":
    case "primary_link_2_url":
    case "primary_link_3_url":
    case "primary_link_4_url": {
      const trimmed = value.trim();
      updates[field] =
        trimmed.startsWith("tel:") ||
        trimmed.startsWith("sms:") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("/")
          ? trimmed
          : normalizeUrl(trimmed || "") || null;
      break;
    }
    case "promo_code_used": {
      const promo = value.trim().toUpperCase();
      updates.promo_code_used = promo || null;

      if (promo === "FOUNDERS") {
        updates.lifetime_free = true;
        updates.billing_exempt = true;
        updates.stripe_plan_key = "founder";
      }
      break;
    }
    case "consent_public_visibility":
      updates.consent_public_visibility = value === "true";
      break;
    case "is_active":
    case "billing_exempt":
    case "is_affiliate":
    case "is_public_official":
      updates[field] = value === "true";
      break;
    case "affiliate_tier":
      updates.affiliate_tier = value.trim() || null;
      updates.is_affiliate = value.trim().length > 0;
      break;
    case "referral_code":
      updates.referral_code = value.trim().toUpperCase() || null;
      updates.is_affiliate = value.trim().length > 0 || undefined;
      break;
    case "stripe_plan_key":
      updates.stripe_plan_key = value.trim() || null;
      break;
    case "subscription_status":
      updates.subscription_status = value.trim() || null;
      break;
    case "slug_status":
      updates.slug_status = value.trim() || null;
      break;
    default:
      return;
  }

  const admin = createAdminClient();
  if (field === "slug" && updates.slug) {
    const { data: existingSlug } = await admin
      .from("profiles")
      .select("user_id")
      .eq("slug", updates.slug)
      .neq("user_id", userId)
      .maybeSingle();

    if (existingSlug) {
      throw new Error("That slug is already in use.");
    }
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/account/${userId}`);
}

async function getInitialAuth() {
  const supabase = await createClient();
  const {
    data: { user },
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
    slug: profile?.slug || null,
  };
}

export default async function AdminUserPage({ params }: PageProps) {
  const { userId } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const initialAuth = await getInitialAuth();
  const myProfileHref = initialAuth?.slug ? `/${initialAuth.slug}` : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    return (
      <Shell
        footerLeft="Admin"
        footerRight="User not found"
        myProfileHref={myProfileHref}
        initialAuth={initialAuth}
        navLinks={[{ href: "/admin", label: "Back to admin" }]}
      >
        <section className="section-wrap">
          <div className="card" style={{ padding: 20 }}>
            User not found.
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell
      footerLeft="Admin"
      footerRight="User detail"
      myProfileHref={myProfileHref}
      initialAuth={initialAuth}
      navLinks={[{ href: "/admin", label: "Back to admin" }]}
    >
      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <div className="dashboard-kicker">Admin account detail</div>
            <h1 className="section-title" style={{ marginTop: 6 }}>
              {profile.full_name || profile.email || "User"}
            </h1>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 className="section-title" style={{ fontSize: 22 }}>
              User
            </h2>
            <div className="account-grid">
              <div>
                <span className="label">User ID</span>
                <div>{profile.user_id || "—"}</div>
              </div>
              <div>
                <span className="label">Name</span>
                <div>{profile.full_name || "—"}</div>
              </div>
              <div>
                <span className="label">Email</span>
                <div>{profile.email || "—"}</div>
              </div>
              <div>
                <span className="label">Slug</span>
                <div>{profile.slug ? `/${profile.slug}` : "—"}</div>
              </div>
              <div>
                <span className="label">Status</span>
                <div>{profile.is_active ? "Active" : "Inactive"}</div>
              </div>
              <div>
                <span className="label">Sign up date</span>
                <div>
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                marginTop: 18,
                paddingTop: 18,
              }}
            >
              <h3 className="section-title" style={{ fontSize: 18 }}>
                Edit profile basics
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="full_name" />
                  <label className="label" htmlFor="full-name">
                    Full name
                  </label>
                  <input
                    id="full-name"
                    name="value"
                    defaultValue={profile.full_name || ""}
                    placeholder="Full name"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save name
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="email" />
                  <label className="label" htmlFor="profile-email">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    name="value"
                    defaultValue={profile.email || ""}
                    placeholder="name@example.com"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save email
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="slug" />
                  <label className="label" htmlFor="profile-slug">
                    Profile slug
                  </label>
                  <input
                    id="profile-slug"
                    name="value"
                    defaultValue={profile.slug || ""}
                    placeholder="profile-slug"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save slug
                  </button>
                </form>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <form action={updateUserAction} className="card" style={{ padding: 14 }}>
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="role_line" />
                  <label className="label" htmlFor="profile-role-line">
                    Role line
                  </label>
                  <input
                    id="profile-role-line"
                    name="value"
                    defaultValue={profile.role_line || ""}
                    placeholder="Founder & Principal"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save role line
                  </button>
                </form>

                <form action={updateUserAction} className="card" style={{ padding: 14 }}>
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="website_url" />
                  <label className="label" htmlFor="profile-website-url">
                    Website URL
                  </label>
                  <input
                    id="profile-website-url"
                    name="value"
                    defaultValue={profile.website_url || ""}
                    placeholder="https://example.com"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save website
                  </button>
                </form>

                <form action={updateUserAction} className="card" style={{ padding: 14 }}>
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="phone" />
                  <label className="label" htmlFor="profile-phone">
                    Phone
                  </label>
                  <input
                    id="profile-phone"
                    name="value"
                    defaultValue={profile.phone || ""}
                    placeholder="5551234567"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save phone
                  </button>
                </form>

                <form action={updateUserAction} className="card" style={{ padding: 14 }}>
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="promo_code_used" />
                  <label className="label" htmlFor="profile-promo-code">
                    Promo code
                  </label>
                  <input
                    id="profile-promo-code"
                    name="value"
                    defaultValue={profile.promo_code_used || ""}
                    placeholder="Optional promo code"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save promo
                  </button>
                </form>
              </div>

              <form action={updateUserAction} className="card" style={{ padding: 14, marginTop: 12 }}>
                <input type="hidden" name="userId" value={profile.user_id} />
                <input type="hidden" name="field" value="intro" />
                <label className="label" htmlFor="profile-intro">
                  Intro
                </label>
                <textarea
                  id="profile-intro"
                  name="value"
                  defaultValue={profile.intro || ""}
                  rows={4}
                  placeholder="A short introduction for the profile."
                  style={{ width: "100%", padding: 10, margin: "8px 0" }}
                />
                <button className="button primary" type="submit">
                  Save intro
                </button>
              </form>

              <form action={updateUserAction} className="card" style={{ padding: 14, marginTop: 12 }}>
                <input type="hidden" name="userId" value={profile.user_id} />
                <input type="hidden" name="field" value="consent_public_visibility" />
                <label className="label" htmlFor="profile-consent-public-visibility">
                  Public visibility consent
                </label>
                <select
                  id="profile-consent-public-visibility"
                  name="value"
                  defaultValue={profile.consent_public_visibility ? "true" : "false"}
                  style={{ width: "100%", padding: 10, margin: "8px 0" }}
                >
                  <option value="true">Visible / consent granted</option>
                  <option value="false">Discreet / consent not granted</option>
                </select>
                <button className="button primary" type="submit">
                  Save visibility
                </button>
              </form>

              <div className="card" style={{ padding: 14, marginTop: 12 }}>
                <h4 className="section-title" style={{ fontSize: 16 }}>
                  Primary links
                </h4>

                {[
                  ["primary_link_1_title", "Link 1 title", profile.primary_link_1_title || "", "Call"],
                  ["primary_link_1_url", "Link 1 URL", profile.primary_link_1_url || "", "tel:15551234567"],
                  ["primary_link_2_title", "Link 2 title", profile.primary_link_2_title || "", "Email"],
                  ["primary_link_2_url", "Link 2 URL", profile.primary_link_2_url || "", "mailto:you@example.com"],
                  ["primary_link_3_title", "Link 3 title", profile.primary_link_3_title || "", "Website 1"],
                  ["primary_link_3_url", "Link 3 URL", profile.primary_link_3_url || "", "https://example.com"],
                  ["primary_link_4_title", "Link 4 title", profile.primary_link_4_title || "", "Website"],
                  ["primary_link_4_url", "Link 4 URL", profile.primary_link_4_url || "", "https://example.com"],
                ].map(([fieldName, label, defaultValue, placeholder]) => (
                  <form
                    key={fieldName}
                    action={updateUserAction}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(150px, 220px) 1fr auto",
                      gap: 10,
                      alignItems: "end",
                      marginTop: 10,
                    }}
                  >
                    <input type="hidden" name="userId" value={profile.user_id} />
                    <input type="hidden" name="field" value={fieldName} />
                    <label className="label" htmlFor={`profile-${fieldName}`}>
                      {label}
                    </label>
                    <input
                      id={`profile-${fieldName}`}
                      name="value"
                      defaultValue={defaultValue}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: 10 }}
                    />
                    <button className="button secondary" type="submit">
                      Save
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 className="section-title" style={{ fontSize: 22 }}>
              Billing
            </h2>
            <div className="account-grid">
              <div>
                <span className="label">Plan</span>
                <div>{profile.stripe_plan_key || "—"}</div>
              </div>
              <div>
                <span className="label">Subscription status</span>
                <div>{profile.subscription_status || "—"}</div>
              </div>
              <div>
                <span className="label">Customer ID</span>
                <div>{profile.stripe_customer_id || "—"}</div>
              </div>
              <div>
                <span className="label">Subscription ID</span>
                <div>{profile.stripe_subscription_id || "—"}</div>
              </div>
              <div>
                <span className="label">Subscription end date</span>
                <div>
                  {profile.subscription_current_period_end
                    ? new Date(
                        profile.subscription_current_period_end,
                      ).toLocaleDateString()
                    : profile.current_period_end
                      ? new Date(
                          profile.current_period_end,
                        ).toLocaleDateString()
                      : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 className="section-title" style={{ fontSize: 22 }}>
              Flags
            </h2>
            <div className="account-grid">
              <div>
                <span className="label">Affiliate</span>
                <div>{profile.is_affiliate ? "Yes" : "No"}</div>
              </div>
              <div>
                <span className="label">Affiliate tier</span>
                <div>{profile.affiliate_tier || "—"}</div>
              </div>
              <div>
                <span className="label">Referral code</span>
                <div>{profile.referral_code || "—"}</div>
              </div>
              <div>
                <span className="label">Billing exempt</span>
                <div>{profile.billing_exempt ? "Yes" : "No"}</div>
              </div>
              <div>
                <span className="label">Public official</span>
                <div>{profile.is_public_official ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 className="section-title" style={{ fontSize: 22 }}>
              Actions
            </h2>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {profile.slug ? (
                  <a href={`/${profile.slug}`} className="button secondary">
                    View profile
                  </a>
                ) : null}

                <Link href="/admin" className="button secondary">
                  Back to admin
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="is_active" />
                  <input
                    type="hidden"
                    name="value"
                    value={profile.is_active ? "false" : "true"}
                  />
                  <div className="label">Profile status</div>
                  <button className="button primary" type="submit">
                    {profile.is_active
                      ? "Deactivate profile"
                      : "Activate profile"}
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="billing_exempt" />
                  <input
                    type="hidden"
                    name="value"
                    value={profile.billing_exempt ? "false" : "true"}
                  />
                  <div className="label">Billing exemption</div>
                  <button className="button primary" type="submit">
                    {profile.billing_exempt
                      ? "Remove exemption"
                      : "Grant exemption"}
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input
                    type="hidden"
                    name="field"
                    value="is_public_official"
                  />
                  <input
                    type="hidden"
                    name="value"
                    value={profile.is_public_official ? "false" : "true"}
                  />
                  <div className="label">Public official flag</div>
                  <button className="button primary" type="submit">
                    {profile.is_public_official
                      ? "Remove official flag"
                      : "Mark as official"}
                  </button>
                </form>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="affiliate_tier" />
                  <label className="label" htmlFor="affiliate-tier">
                    Affiliate tier
                  </label>
                  <select
                    id="affiliate-tier"
                    name="value"
                    defaultValue={profile.affiliate_tier || ""}
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  >
                    <option value="">Not affiliate</option>
                    <option value="standard">standard</option>
                    <option value="founder">founder</option>
                    <option value="partner">partner</option>
                  </select>
                  <button className="button primary" type="submit">
                    Save affiliate tier
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="referral_code" />
                  <label className="label" htmlFor="referral-code">
                    Referral code
                  </label>
                  <input
                    id="referral-code"
                    name="value"
                    defaultValue={profile.referral_code || ""}
                    placeholder="PARTNER-CODE"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save referral code
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="stripe_plan_key" />
                  <label className="label" htmlFor="plan-key">
                    Plan key override
                  </label>
                  <input
                    id="plan-key"
                    name="value"
                    defaultValue={profile.stripe_plan_key || ""}
                    placeholder="tier_1, tier_2, tier_3"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save plan key
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input
                    type="hidden"
                    name="field"
                    value="subscription_status"
                  />
                  <label className="label" htmlFor="subscription-status">
                    Subscription status override
                  </label>
                  <select
                    id="subscription-status"
                    name="value"
                    defaultValue={profile.subscription_status || ""}
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  >
                    <option value="">Unset</option>
                    <option value="active">active</option>
                    <option value="trialing">trialing</option>
                    <option value="past_due">past_due</option>
                    <option value="canceled">canceled</option>
                    <option value="inactive">inactive</option>
                  </select>
                  <button className="button primary" type="submit">
                    Save subscription status
                  </button>
                </form>

                <form
                  action={updateUserAction}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <input type="hidden" name="userId" value={profile.user_id} />
                  <input type="hidden" name="field" value="slug_status" />
                  <label className="label" htmlFor="slug-status">
                    Slug status
                  </label>
                  <select
                    id="slug-status"
                    name="value"
                    defaultValue={profile.slug_status || ""}
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  >
                    <option value="">Unset</option>
                    <option value="approved">approved</option>
                    <option value="pending_review">pending_review</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <button className="button primary" type="submit">
                    Save slug status
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
