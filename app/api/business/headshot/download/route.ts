import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessAccessScope } from "@/lib/business/dashboard-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organization_id") || "";
  const memberId = url.searchParams.get("member_id") || "";

  if (!organizationId || !memberId) {
    return NextResponse.json({ error: "organization_id and member_id are required." }, { status: 400 });
  }

  await getBusinessAccessScope({ organizationId, allowLocationAdmin: true });

  const admin = createAdminClient();
  const { data: member, error } = await admin
    .from("organization_members")
    .select("name, headshot_url")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !member?.headshot_url) {
    return NextResponse.json({ error: "Headshot not found." }, { status: 404 });
  }

  const upstream = await fetch(member.headshot_url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Unable to download headshot." }, { status: 502 });
  }

  const safeName = (member.name || "headshot")
    .trim()
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "headshot";
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
  headers.set("Content-Disposition", `attachment; filename="${safeName}.jpg"`);

  return new NextResponse(await upstream.arrayBuffer(), { status: 200, headers });
}
