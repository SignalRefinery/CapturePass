import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const filename = `${slug}.vcf`;
  const body = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${slug}\r\nEND:VCARD\r\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "X-CapturePass-VCard-Version": "stable-isolated-route",
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
