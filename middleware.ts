import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isLikelyProfilePath, PROFILE_CACHE_HEADERS } from "@/lib/privacy/profile-privacy";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Protect dashboard + admin
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!profile?.is_active) {
      return NextResponse.redirect(new URL("/pricing", request.url));
    }
  }

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
