import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isLikelyProfilePath,
  isPublicPassPath,
  isTokenProfilePath,
  PROFILE_CACHE_HEADERS
} from "@/lib/privacy/profile-privacy";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const session = await updateSession(request);
  const { response, supabase, user, authError } = session;
  const { pathname } = request.nextUrl;

  if (response.headers.get("location")) {
    return response;
  }

  // Free / Reserved users can edit and preview from the dashboard. Individual
  // dashboard pages enforce activation only for NFC/QR sharing surfaces.
  void authError;
  void user;
  void supabase;


  const isProfileLike =
    isLikelyProfilePath(pathname) ||
    isTokenProfilePath(pathname) ||
    isPublicPassPath(pathname) ||
    pathname === "/live-demo";

  if (isProfileLike) {
    // Public profiles and private token redirects are intentionally shareable,
    // but they should not become crawlable discovery surfaces.
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
