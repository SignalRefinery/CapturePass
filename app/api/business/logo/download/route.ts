import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessAccessScope } from "@/lib/business/dashboard-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organization_id") || "";

  if (!organizationId) {
    return NextResponse.json({ error: "organization_id is required." }, { status: 400 });
  }

  await getBusinessAccessScope({ organizationId });

  const admin = createAdminClient();
  const { data: organization, error } = await admin
    .from("organizations")
    .select("name, brand_logo_url")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !organization?.brand_logo_url) {
    return NextResponse.json({ error: "Logo not found." }, { status: 404 });
  }

  const upstream = await fetch(organization.brand_logo_url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Unable to download logo." }, { status: 502 });
  }

  const safeName = (organization.name || "business-logo")
    .trim()
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "business-logo";
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "image/png");
  headers.set("Content-Disposition", `attachment; filename="${safeName}.png"`);

  return new NextResponse(await upstream.arrayBuffer(), { status: 200, headers });
}
