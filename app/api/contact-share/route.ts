import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ContactPayload = {
  profileId?: string | null;
  slug?: string | null;
  viewId?: string | null;
  organizationId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  note?: string | null;
  source?: string | null;
  website?: string | null;
};

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

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

function isUuid(value?: string | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function rateLimitKey(request: Request, profileId?: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${profileId || "unknown"}`;
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
  const payload = (await request.json().catch(() => null)) as ContactPayload | null;

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
  let notificationEmail: string | null = null;
  let dashboardUrl = `${appUrl()}/dashboard/contacts`;

  if (resolvedOrganizationId && resolvedProfileId) {
    const { data: member } = await admin
      .from("organization_members")
      .select("id, organization_id, user_id, email, status")
      .eq("id", resolvedProfileId)
      .eq("organization_id", resolvedOrganizationId)
      .maybeSingle();

    if (!member || member.status !== "active") {
      return NextResponse.json({ error: "This profile is not available." }, { status: 404 });
    }

    submittedToUserId = member.user_id || null;
    notificationEmail = member.email || null;

    const { data: organization } = await admin
      .from("organizations")
      .select("slug")
      .eq("id", resolvedOrganizationId)
      .maybeSingle();
    dashboardUrl = organization?.slug
      ? `${appUrl()}/${organization.slug}/login`
      : `${appUrl()}/dashboard/business?org=${resolvedOrganizationId}`;
  } else {
    const query = admin
      .from("profiles")
      .select("id, user_id, email, slug")
      .limit(1);
    const { data: profile } = resolvedProfileId
      ? await query.eq("id", resolvedProfileId).maybeSingle()
      : await query.eq("slug", slug as string).maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "This profile is not available." }, { status: 404 });
    }

    resolvedProfileId = profile.id;
    submittedToUserId = profile.user_id || null;
    notificationEmail = profile.email || null;
  }

  const { error } = await admin.from("contact_submissions").insert({
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
    source,
    user_agent: cleanText(request.headers.get("user-agent"), 300) || null
  });

  if (error) {
    console.error("Contact share insert failed", {
      profileId: resolvedProfileId,
      organizationId: resolvedOrganizationId,
      source,
      error: error.message
    });
    return NextResponse.json({ error: "Unable to share your contact right now." }, { status: 500 });
  }

  console.info("contact_shared", {
    profile_id: resolvedProfileId,
    organization_id: resolvedOrganizationId,
    source,
    profile_view_id: viewId
  });

  await sendNotificationEmail({
    to: notificationEmail,
    contact: { name, email, phone, company, title, note },
    dashboardUrl
  });

  return NextResponse.json({ ok: true, message: "Contact shared successfully." });
}
