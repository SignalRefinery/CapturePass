import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`profile-report:${ip}`, 5, 10 * 60 * 1000);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many reports submitted from this connection. Please wait and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000))
          }
        }
      );
    }

    const body = await request.json();
    const profileId = String(body.profileId || "");
    const slug = String(body.slug || "");
    const reason = String(body.reason || "").trim();

    if (!slug || !reason) {
      return NextResponse.json({ error: "Missing slug or reason." }, { status: 400 });
    }

    if (reason.length > 1200) {
      return NextResponse.json({ error: "Reason is too long." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Profile report email service missing", {
        route: "/api/profile-report",
        slug,
        profileId: profileId || null
      });
      return NextResponse.json({ error: "Unable to submit report right now." }, { status: 500 });
    }

    const to = process.env.INTERNAL_ORDER_EMAIL || "hello@signalpass.app";
    const from = process.env.INTERNAL_FROM_EMAIL || "Signal Pass <noreply@signalpass.app>";

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2 style="margin:0 0 16px;">Profile issue report</h2>
        <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr><td><strong>Profile ID</strong></td><td>${escapeHtml(profileId || "unknown")}</td></tr>
          <tr><td><strong>Slug</strong></td><td>${escapeHtml(slug)}</td></tr>
          <tr><td><strong>Reason</strong></td><td>${escapeHtml(reason)}</td></tr>
          <tr><td><strong>Source IP</strong></td><td>${escapeHtml(ip)}</td></tr>
        </table>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Profile issue reported: ${slug}`,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Profile report email provider failed", {
        route: "/api/profile-report",
        slug,
        profileId: profileId || null,
        status: response.status,
        error: errorText || "No provider response body"
      });
      return NextResponse.json({ error: "Unable to submit report right now." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile report submission failed", {
      route: "/api/profile-report",
      error: error instanceof Error ? error.message : "Unknown profile report error"
    });
    return NextResponse.json({ error: "Unable to submit report." }, { status: 500 });
  }
}
