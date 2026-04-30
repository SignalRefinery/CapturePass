

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error." },
      { status: 500 }
    );
  }
}