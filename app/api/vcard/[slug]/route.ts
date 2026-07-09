import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  return new NextResponse(`BEGIN:VCARD
VERSION:3.0
FN:${slug}
END:VCARD`, {
    status: 200,
    headers: {
      "X-CapturePass-VCard-Version": "route-isolation-test",
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`
    }
  });
}
