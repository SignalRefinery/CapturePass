import { NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics/record-event";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfileBySlug } from "@/lib/profiles/public-profile-source";
import { isSlugPubliclyAllowed } from "@/lib/slug-moderation";
import { parseContactPayload, type ContactPayload } from "@/lib/validation/api-payloads";
import { buildContactSharedWebhookPayload, queueOrganizationWebhook } from "@/lib/webhooks/sendWebhook";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const CONTACT_CONSENT_TEXT = "I agree to be contacted by this person or organization regarding my inquiry.";

function cleanText(value?: string | null, max = 180) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function escapeHtml(value?: string | null) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanNote(value?: string | null) {
  return cleanText(value, 600);
}

function cleanEmail(value?: string | null) {
  const email = cleanText(value, 254).toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "__invalid__";
}

function cleanPhone(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "__invalid__";
  return `+${digits}`;
}

function cleanUrl(value?: string | null) {
  const url = cleanText(value, 500);
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

function consentWasGiven(value: ContactPayload["consent_to_contact"]) {
  return value === true || value === "true" || value === "on";
}

function isUuid(value?: string | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function rateLimitKey(request: Request, profileId?: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${profileId || "unknown"}`;
}

function clientIp(request: Request) {
  return cleanText(
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "",
    80
  ) || null;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);

  if (!current || current.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

function sourceFor(value?: string | null) {
  const source = cleanText(value, 80);
  if (source === "business_profile") return "business_profile";
  if (source === "public_profile") return "public_profile";
  if (source === "nfc") return "nfc";
  if (source === "qr") return "qr";
  if (source === "share") return "shared_link";
  if (source === "shared_link") return "shared_link";
  return "unknown";
}

function contactShareInsertErrorMessage(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  if (error.code === "42P01" || /contact_submissions/i.test(error.message || "")) {
    return "Contact sharing is not fully configured yet.";
  }

  if (error.code === "42703" || error.code === "PGRST204") {
    return "Contact sharing needs a database update before it can save contacts.";
  }

  return "Unable to share your contact right now.";
}

async function sendNotificationEmail({
  to,
  contact,
  dashboardUrl
}: {
  to?: string | null;
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    title: string | null;
    note: string | null;
  };
  dashboardUrl: string;
}) {
  if (!process.env.RESEND_API_KEY || !to) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "TapTagg <notifications@taptagg.app>",
        to,
        subject: "New Contact Shared",
        html: `
          <h2>New Contact Shared</h2>
          <p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>
          <p><strong>Company:</strong> ${escapeHtml(contact.company) || "—"}</p>
          <p><strong>Title:</strong> ${escapeHtml(contact.title) || "—"}</p>
          <p><strong>Email:</strong> ${escapeHtml(contact.email) || "—"}</p>
          <p><strong>Phone:</strong> ${escapeHtml(contact.phone) || "—"}</p>
          <p><strong>Note:</strong><br />${escapeHtml(contact.note) || "—"}</p>
          <p><a href="${dashboardUrl}">Dashboard → Contacts</a></p>
        `
      })
    });

    if (!response.ok) {
      console.error("Contact share notification failed", {
        status: response.status,
        body: await response.text()
      });
    }
  } catch (error) {
    console.error("Contact share notification threw", {
      error: error instanceof Error ? error.message : "Unknown email error"
    });
  }
}

export async function POST(request: Request) {
  const payload = parseContactPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (cleanText(payload.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const name = cleanText(payload.name, 120);
  const email = cleanEmail(payload.email);
  const phone = cleanPhone(payload.phone);
  const company = cleanText(payload.company, 140) || null;
  const title = cleanText(payload.title, 140) || null;
  const note = cleanNote(payload.note) || null;
  const source = cleanText(payload.source, 80) || "public_profile";
  const profileId = cleanText(payload.profileId, 64) || null;
  const organizationId = cleanText(payload.organizationId, 64) || null;
  const viewId = cleanText(payload.viewId, 64) || null;
  const slug = cleanText(payload.slug, 80).toLowerCase() || null;
  const consentToContact = consentWasGiven(payload.consent_to_contact);
  const sourceUrl = cleanUrl(request.headers.get("referer"));
  const userAgent = cleanText(request.headers.get("user-agent"), 300) || null;
  const ipAddress = clientIp(request);

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (email === "__invalid__") {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (phone === "__invalid__") {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
  }

  if (!consentToContact) {
    return NextResponse.json(
      { error: "Please agree to be contacted about your inquiry before sharing your contact." },
      { status: 400 }
    );
  }

  if ((profileId && !isUuid(profileId)) || (organizationId && !isUuid(organizationId)) || (viewId && !isUuid(viewId))) {
    return NextResponse.json({ error: "Invalid profile target." }, { status: 400 });
  }

  if (!profileId && !slug) {
    return NextResponse.json({ error: "Invalid profile target." }, { status: 400 });
  }

  if (!checkRateLimit(rateLimitKey(request, profileId || slug))) {
    return NextResponse.json({ error: "Please wait a moment before sharing another contact." }, { status: 429 });
  }

  const admin = createAdminClient();
  let resolvedProfileId = profileId;
  let resolvedOrganizationId = organizationId;
  let submittedToUserId: string | null = null;
  let resolvedMember: { id: string; name: string; locationId?: string | null; regionId?: string | null } | null = null;
  let notificationEmail: string | null = null;
  let dashboardUrl = `${appUrl()}/dashboard/contacts`;

  if (resolvedOrganizationId && resolvedProfileId) {
    const { data: member } = await admin
      .from("organization_members")
      .select("id, organization_id, user_id, name, email, status, location_id")
      .eq("id", resolvedProfileId)
      .eq("organization_id", resolvedOrganizationId)
      .maybeSingle();

    if (!member || member.status !== "active") {
      return NextResponse.json({ error: "This profile is not available." }, { status: 404 });
    }

    submittedToUserId = member.user_id || null;
    notificationEmail = member.email || null;
    resolvedMember = member
      ? { id: member.id, name: member.name, locationId: member.location_id || null }
      : null;

    if (resolvedMember?.locationId) {
      const { data: location } = await admin
        .from("business_locations")
        .select("id, region_id")
        .eq("id", resolvedMember.locationId)
        .maybeSingle();
      resolvedMember.regionId = location?.region_id || null;
    }

    const { data: organization } = await admin
      .from("organizations")
      .select("slug")
      .eq("id", resolvedOrganizationId)
      .maybeSingle();
    dashboardUrl = organization?.slug
      ? `${appUrl()}/${organization.slug}/login`
      : `${appUrl()}/dashboard/business?org=${resolvedOrganizationId}`;
  } else {
    const { data: profile } = resolvedProfileId
      ? await admin
          .from("profiles")
          .select("id, user_id, email, slug, is_active, slug_status")
          .eq("id", resolvedProfileId)
          .maybeSingle()
      : { data: await getPublicProfileBySlug(slug as string) };

    if (
      !profile ||
      profile.is_active !== true ||
      profile.slug_status !== "approved" ||
      !isSlugPubliclyAllowed(profile.slug, profile.slug_status)
    ) {
      return NextResponse.json({ error: "This profile is not available." }, { status: 404 });
    }

    resolvedProfileId = profile.id;
    submittedToUserId = profile.user_id || null;
    notificationEmail = profile.email || null;
  }

  const contactSubmission = {
    profile_id: resolvedProfileId,
    organization_id: resolvedOrganizationId,
    profile_view_id: viewId,
    submitted_to_user_id: submittedToUserId,
    name,
    email,
    phone,
    company,
    title,
    note,
    source: sourceFor(source),
    consent_to_contact: true,
    consent_text: CONTACT_CONSENT_TEXT,
    consent_given_at: new Date().toISOString(),
    source_profile_slug: slug,
    source_url: sourceUrl,
    user_agent: userAgent,
    ip_address: ipAddress
  };

  const { error } = await admin.from("contact_submissions").insert(contactSubmission);

  if (error) {
    console.error("Contact share insert failed", {
      profileId: resolvedProfileId,
      organizationId: resolvedOrganizationId,
      source,
      code: error.code,
      details: error.details,
      hint: error.hint,
      error: error.message,
      migration: "Run supabase/phase73_contact_sharing.sql in Supabase if this table or columns are missing."
    });
    return NextResponse.json(
      { error: contactShareInsertErrorMessage(error) },
      { status: error.code === "42P01" || error.code === "42703" || error.code === "PGRST204" ? 503 : 500 }
    );
  }

  console.info("contact_shared", {
    profile_id: resolvedProfileId,
    organization_id: resolvedOrganizationId,
    source: sourceFor(source),
    profile_view_id: viewId
  });

  await recordAnalyticsEvent({
    event_type: "contact_shared",
    profile_id: resolvedOrganizationId ? null : resolvedProfileId,
    organization_id: resolvedOrganizationId,
    organization_member_id: resolvedOrganizationId ? resolvedProfileId : null,
    location_id: resolvedMember?.locationId || null,
    region_id: resolvedMember?.regionId || null,
    profile_view_id: viewId,
    user_id: submittedToUserId,
    source: sourceFor(source),
    action_type: "other",
    action_label: "Share My Contact",
    user_agent: userAgent,
    referrer: cleanText(request.headers.get("referer"), 400) || null,
    metadata: {}
  }, {
    client: admin,
    logLabel: "Contact shared analytics insert failed",
    logContext: {
      profileId: resolvedProfileId,
      organizationId: resolvedOrganizationId
    }
  });

  if (resolvedOrganizationId && resolvedProfileId && resolvedMember) {
    const { data: organization } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", resolvedOrganizationId)
      .maybeSingle();

    if (organization) {
      queueOrganizationWebhook({
        organizationId: resolvedOrganizationId,
        event: "contact.shared",
        payload: buildContactSharedWebhookPayload({
          organization,
          employee: resolvedMember,
          contact: {
            name,
            email,
            phone,
            company,
            note
          }
        })
      });
    }
  }

  await sendNotificationEmail({
    to: notificationEmail,
    contact: { name, email, phone, company, title, note },
    dashboardUrl
  });

  return NextResponse.json({ ok: true, message: "Contact shared successfully." });
}
