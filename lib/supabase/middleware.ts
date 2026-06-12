import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { checkoutContinuationPath } from "@/lib/auth/checkout-continuation";
import { safeInternalRedirect } from "@/lib/auth/redirect";

const AUTH_LOOKUP_TIMEOUT_MS = 2000;

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/signup";
}

function isProtectedPage(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin")
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      response,
      user: null,
      supabase: null,
      authError: null,
      authTimedOut: false
    };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  let user: User | null = null;
  let authError: Error | null = null;
  let authTimedOut = false;

  try {
    const authResult = await Promise.race([
      supabase.auth.getUser().then(({ data, error }) => ({
        user: data.user,
        error: error || null,
        timedOut: false
      })),
      new Promise<{ user: null; error: Error; timedOut: true }>((resolve) => {
        setTimeout(
          () =>
            resolve({
              user: null,
              error: new Error("Supabase auth lookup timed out in middleware."),
              timedOut: true
            }),
          AUTH_LOOKUP_TIMEOUT_MS
        );
      })
    ]);

    user = authResult.user;
    authError = authResult.error;
    authTimedOut = authResult.timedOut;
  } catch (error) {
    authError = error instanceof Error ? error : new Error("Supabase auth lookup failed in middleware.");
  }

  if (authError) {
    console.error(authError);

    // Avoid turning transient Supabase issues into global redirect loops or
    // public profile failures. Page/API-level auth checks remain authoritative.
    return {
      response,
      user: null,
      supabase,
      authError,
      authTimedOut
    };
  }

  if (!user && isProtectedPage(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return {
      response: NextResponse.redirect(redirectUrl),
      user,
      supabase,
      authError,
      authTimedOut
    };
  }

  if (user && isAuthPage(request.nextUrl.pathname)) {
    const plan = request.nextUrl.searchParams.get("plan");
    const promoCode = request.nextUrl.searchParams.get("promo_code");
    const businessType = request.nextUrl.searchParams.get("business_type");
    const fallbackNext = checkoutContinuationPath({
      businessType,
      plan,
      promoCode
    });
    const nextPath = safeInternalRedirect(request.nextUrl.searchParams.get("next"), fallbackNext);

    // Auth pages may carry a checkout continuation. Only internal app paths
    // survive this redirect, so signed-in users cannot be bounced off-site.
    return {
      response: NextResponse.redirect(new URL(nextPath, request.url)),
      user,
      supabase,
      authError,
      authTimedOut
    };
  }

  return {
    response,
    user,
    supabase,
    authError,
    authTimedOut
  };
}
