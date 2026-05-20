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

  // Auth lookup failures should not break public profile or token routes.
  // Protected pages still enforce auth server-side; middleware only adds a fast path.
  if (!authError && user && supabase && pathname.startsWith("/dashboard")) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_active, billing_exempt, lifetime_free, promo_code_used, is_admin")
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!error) {
      const hasDashboardAccess =
        !!profile?.is_active ||
        !!profile?.billing_exempt ||
        !!profile?.lifetime_free ||
        profile?.promo_code_used === "FOUNDERS" ||
        !!profile?.is_admin;

      if (!hasDashboardAccess) {
        return NextResponse.redirect(new URL("/pricing", request.url));
      }
    } else {
      // Let the page render its own guarded state instead of risking a lockout
      // from a transient profile lookup problem in middleware.
      console.error(error);
    }
  }

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
