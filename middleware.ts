import type { NextRequest } from "next/server";
import { isLikelyProfilePath, PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProfileLike = isLikelyProfilePath(pathname) || pathname === "/live-demo";

  if (isProfileLike) {
    for (const [key, value] of Object.entries(PROFILE_CACHE_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"
  ]
};
