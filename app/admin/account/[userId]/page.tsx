import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import {
  PROFILE_BUTTON_TYPES,
  getProfileButtonEditorValue,
  normalizeProfileButtonHref,
  normalizeProfileButtonLabel,
  normalizeProfileButtonType
} from "@/lib/profile-buttons";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifySlug } from "@/lib/slug-moderation";
import { normalizeUrl } from "@/lib/utils";
import { getSiteOrigin } from "@/lib/site-url";
import { getCurrentCapturePassAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function appUrl() {
  return getSiteOrigin();
}

function passwordSetupUrl(nextPath: string) {
  const url = new URL("/update-password", appUrl());
  url.searchParams.set("next", nextPath);
  return url.toString();
}

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

async function requireAdmin() {
  const adminUser = await getCurrentCapturePassAdmin();
  if (!adminUser) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};

  switch (field) {
    case "full_name":
      updates.full_name = value.trim() || null;
      break;
    case "email":
      {
        const nextEmail = value.trim().toLowerCase();

        if (!nextEmail) {
          updates.email = null;
          break;
        }

        const { error: authError } = await admin.auth.admin.updateUserById(userId, {
          email: nextEmail,
          email_confirm: true
        });

        if (authError) {
          throw new Error(authError.message);
        }

        const { error: resetError } = await admin.auth.resetPasswordForEmail(nextEmail, {
          redirectTo: passwordSetupUrl(`/admin/account/${userId}`)
        });

        if (resetError) {
          throw new Error(resetError.message);
        }

        updates.email = nextEmail;
      }
      break;
    case "slug": {
      const moderation = classifySlug(value);

      if (moderation.state === "blocked") {
        throw new Error(moderation.reason || "That slug is blocked.");
      }

      if (moderation.state === "review") {
        throw new Error(
          moderation.reason ||
            "That slug requires the slug review workflow before it can become public."
        );
      }

      // Direct admin detail edits may only publish allowed slugs. Restricted
      // slugs must go through the moderation queue or explicit override route.
      updates.slug = moderation.normalized;
      updates.slug_requested = null;
      updates.slug_status = "approved";
      updates.slug_review_reason = null;
      break;
    }
    case "role_line":
    case "organization_name":
    case "intro":
    case "phone":
    case "text_phone":
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
    case "primary_link_1":
    case "primary_link_2":
    case "primary_link_3":
    case "primary_link_4": {
      const suffix = field.slice(-1);
      const titleKey = `primary_link_${suffix}_title`;
      const urlKey = `primary_link_${suffix}_url`;
      const typeKey = `primary_link_${suffix}_type`;
      const buttonType = normalizeProfileButtonType(String(formData.get("type") || ""));
      const buttonTitle = String(formData.get("title") || "");
      const buttonValue = String(formData.get("value") || "");

      updates[titleKey] = normalizeProfileButtonLabel(buttonTitle, buttonType);
      updates[typeKey] = buttonType;
      updates[urlKey] = normalizeProfileButtonHref(buttonType, buttonValue);
      break;
    }
    case "primary_link_1_type":
    case "primary_link_2_type":
    case "primary_link_3_type":
    case "primary_link_4_type":
      updates[field] = normalizeProfileButtonType(value);
      break;
    case "promo_code_used": {
      const promo = value.trim().toUpperCase();
      updates.promo_code_used = promo || null;

      if (promo === "FOUNDERS") {
        updates.is_active = true;
        updates.lifetime_free = true;
        updates.billing_exempt = true;
        updates.stripe_plan_key = "creator";
      }
      break;
    }
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
    case "slug_status": {
      const nextStatus = value.trim() || null;

      if (nextStatus && !["approved", "pending_review", "rejected"].includes(nextStatus)) {
        throw new Error("Invalid slug status.");
      }

      if (nextStatus === "approved") {
        const { data: currentProfile, error: currentProfileError } = await admin
          .from("profiles")
          .select("slug")
          .eq("user_id", userId)
          .maybeSingle();

        if (currentProfileError || !currentProfile?.slug) {
          throw new Error("Unable to verify the current slug before approval.");
        }

        const moderation = classifySlug(currentProfile.slug);

        if (moderation.state === "blocked") {
          throw new Error("Blocked slugs cannot be approved.");
        }

        if (moderation.state === "review") {
          throw new Error("Review-required slugs must be approved through the slug review workflow.");
        }
      }

      updates.slug_status = nextStatus;
      break;
    }
    default:
      return;
  }

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

  if (field === "email") {
    redirect(`/admin/account/${userId}?saved=email`);
  }
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
    isAdmin: true
  };
}

export default async function AdminUserPage({ params, searchParams }: PageProps) {
  const { userId } = await params;
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();
  const query = searchParams ? await searchParams : {};

  const initialAuth = await getInitialAuth();
  const myProfileHref = initialAuth?.slug ? `/${initialAuth.slug}` : null;

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (!profile) {
    return (
      <Shell
        footerLeft="Admin"
        footerRight="User not found"
        myProfileHref={myProfileHref}
        initialAuth={initialAuth}
        pageVariant="admin"
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
      pageVariant="admin"
      navLinks={[{ href: "/admin", label: "Back to admin" }]}
    >
      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          {query.saved === "email" ? (
            <div className="card" style={{ padding: 20 }}>
              <div className="dashboard-kicker">Updated</div>
              <p className="editor-copy">
                Email updated. A password setup link was sent to the new address.
              </p>
            </div>
          ) : null}
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
                  <input type="hidden" name="field" value="organization_name" />
                  <label className="label" htmlFor="profile-organization-name">
                    Organization
                  </label>
                  <input
                    id="profile-organization-name"
                    name="value"
                    defaultValue={profile.organization_name || ""}
                    placeholder="Organization or business name"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save organization
                  </button>
                </form>

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
                    placeholder="Advisor, Stylist, Founder"
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
                  <input type="hidden" name="field" value="text_phone" />
                  <label className="label" htmlFor="profile-text-phone">
                    Text phone
                  </label>
                  <input
                    id="profile-text-phone"
                    name="value"
                    defaultValue={profile.text_phone || ""}
                    placeholder="5551234567"
                    style={{ width: "100%", padding: 10, margin: "8px 0" }}
                  />
                  <button className="button primary" type="submit">
                    Save text phone
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
                    placeholder="Optional: Enter promo code if you have one"
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

              <div className="card" style={{ padding: 14, marginTop: 12 }}>
                <h4 className="section-title" style={{ fontSize: 16 }}>
                  CTA buttons
                </h4>

                {[
                  {
                    field: "primary_link_1",
                    titleKey: "primary_link_1_title",
                    urlKey: "primary_link_1_url",
                    typeKey: "primary_link_1_type",
                    label: "Button 1"
                  },
                  {
                    field: "primary_link_2",
                    titleKey: "primary_link_2_title",
                    urlKey: "primary_link_2_url",
                    typeKey: "primary_link_2_type",
                    label: "Button 2"
                  },
                  {
                    field: "primary_link_3",
                    titleKey: "primary_link_3_title",
                    urlKey: "primary_link_3_url",
                    typeKey: "primary_link_3_type",
                    label: "Button 3"
                  },
                  {
                    field: "primary_link_4",
                    titleKey: "primary_link_4_title",
                    urlKey: "primary_link_4_url",
                    typeKey: "primary_link_4_type",
                    label: "Button 4"
                  }
                ].map(({ field, titleKey, urlKey, typeKey, label }) => {
                  const buttonType = normalizeProfileButtonType(
                    profile[typeKey] ||
                      (field === "primary_link_1"
                        ? profile.primary_link_1_type
                        : field === "primary_link_2"
                          ? profile.primary_link_2_type
                          : field === "primary_link_3"
                            ? profile.primary_link_3_type
                            : profile.primary_link_4_type) ||
                      "website"
                  );

                  return (
                  <form
                    key={field}
                    action={updateUserAction}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(180px, 1.2fr) minmax(180px, 0.9fr) minmax(220px, 1.3fr) auto",
                      gap: 10,
                      alignItems: "end",
                      marginTop: 10
                    }}
                  >
                    <input type="hidden" name="userId" value={profile.user_id} />
                    <input type="hidden" name="field" value={field} />
                    <label className="label" htmlFor={`profile-${titleKey}`}>
                      {label} label
                    </label>
                    <input
                      id={`profile-${titleKey}`}
                      name="title"
                      defaultValue={profile[titleKey] || ""}
                      placeholder="Call, Email, Website"
                      style={{ width: "100%", padding: 10 }}
                    />
                    <div>
                      <label className="label" htmlFor={`profile-${typeKey}`}>
                        Type
                      </label>
                      <select
                        id={`profile-${typeKey}`}
                        name="type"
                        defaultValue={buttonType}
                        style={{ width: "100%", padding: 10, marginTop: 8 }}
                      >
                        {PROFILE_BUTTON_TYPES.map((buttonTypeOption) => (
                          <option key={buttonTypeOption} value={buttonTypeOption}>
                            {buttonTypeOption === "website"
                              ? "Website"
                              : buttonTypeOption === "email"
                                ? "Email"
                                : buttonTypeOption === "phone"
                                  ? "Phone"
                                  : buttonTypeOption === "text"
                                    ? "Text"
                                    : buttonTypeOption === "booking"
                                      ? "Booking"
                                      : buttonTypeOption === "directions"
                                        ? "Directions"
                                        : buttonTypeOption === "pdf"
                                          ? "PDF"
                                          : buttonTypeOption === "payment"
                                            ? "Payment"
                                            : "Custom"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`profile-${urlKey}`}>
                        Value
                      </label>
                      <input
                        id={`profile-${urlKey}`}
                        name="value"
                        defaultValue={getProfileButtonEditorValue(buttonType, profile[urlKey] || "")}
                        placeholder={
                          buttonType === "phone"
                            ? "15551234567"
                            : buttonType === "email"
                              ? "you@example.com"
                              : buttonType === "directions"
                                ? "1600 Amphitheatre Parkway"
                                : buttonType === "text"
                                  ? "15551234567"
                                  : buttonType === "pdf"
                                    ? "https://example.com/file.pdf"
                                    : buttonType === "payment"
                                      ? "https://checkout.example.com"
                                      : "https://example.com"
                        }
                        style={{ width: "100%", padding: 10, marginTop: 8 }}
                      />
                    </div>
                    <button className="button secondary" type="submit">
                      Save
                    </button>
                  </form>
                  );
                })}
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
