import { NextResponse } from "next/server";
import { getPublicProfileBySlug } from "@/lib/profiles/public-profile-source";
import { buildVcardFilename, buildVcardResponseHeaders, buildVcardText } from "@/lib/vcard";
import { getReadableProfileUrl } from "@/lib/urls/profile-url";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filename = buildVcardFilename(profile.full_name || profile.organization_name || slug);
  const body = buildVcardText({
    fullName: profile.full_name,
    organizationName: profile.organization_name || "",
    title: profile.role_line || "",
    phone: profile.phone || "",
    email: profile.email || "",
    websiteUrl: getReadableProfileUrl(profile),
    profileUrl: getReadableProfileUrl(profile)
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "X-CapturePass-VCard-Version": "stable-isolated-route",
      ...buildVcardResponseHeaders(filename),
      "Content-Type": "text/x-vcard; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
