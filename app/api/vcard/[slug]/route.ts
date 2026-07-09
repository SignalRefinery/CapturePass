import { NextResponse } from "next/server";
import * as vcard from "@/lib/vcard";
import * as profilePrivacy from "@/lib/privacy/profile-privacy";
import * as plans from "@/lib/plans";
import * as slugModeration from "@/lib/slug-moderation";
import * as supabaseAdmin from "@/lib/supabase/admin";
import * as profileServiceServer from "@/lib/profile-service-server";
import * as recordEvent from "@/lib/analytics/record-event";
import type * as types from "@/lib/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function getProfileUrl(request: Request, slug: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const origin = configuredOrigin || new URL(request.url).origin;
  return new URL(`/${slug}`, origin).toString();
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  void vcard.buildVcardFilename(slug);
  const filename = `${slug}.vcf`;
  void vcard.buildVcardResponseHeaders(filename);
  void vcard.buildVcardText({ fullName: slug });
  void getProfileUrl(request, slug);
  const body = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${slug}\r\nEND:VCARD\r\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "X-CapturePass-VCard-Step": "4 getProfileUrl",
      "X-CapturePass-VCard-Version": "route-isolation-test",
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
