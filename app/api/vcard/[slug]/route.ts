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

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  void vcard.buildVcardFilename(slug);
  const filename = `${slug}.vcf`;
  void vcard.buildVcardResponseHeaders(filename);
  const body = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${slug}\r\nEND:VCARD\r\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "X-CapturePass-VCard-Step": "2 buildVcardResponseHeaders",
      "X-CapturePass-VCard-Version": "route-isolation-test",
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
