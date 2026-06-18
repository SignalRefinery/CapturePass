

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PARTNER_REQUEST_EMAIL_TO = "hello@capturepass.com";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin.from("partner_requests").insert({
      name: body.name,
      email: body.email,
      organization: body.organization || null,
      role: body.role || null,
      network: body.network || null,
      notes: body.notes || null,
      created_at: new Date().toISOString()
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "CapturePass <notifications@capturepass.com>",
          to: PARTNER_REQUEST_EMAIL_TO,
          subject: `New CapturePass partner request: ${body.name}`,
          html: `
            <h2>New CapturePass partner request</h2>
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Organization:</strong> ${body.organization || "—"}</p>
            <p><strong>Role:</strong> ${body.role || "—"}</p>
            <p><strong>Who they can introduce:</strong><br />${body.network || "—"}</p>
            <p><strong>Notes:</strong><br />${body.notes || "—"}</p>
          `
        })
      }).catch((emailError) => {
        console.error("Partner request email failed:", emailError);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error." },
      { status: 500 }
    );
  }
}
