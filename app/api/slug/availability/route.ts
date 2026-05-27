import { NextResponse } from "next/server";
import { classifySlug } from "@/lib/slug-moderation";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileSlugRow = {
  user_id: string | null;
};

async function slugHasOwner(column: "slug" | "slug_requested", slug: string, currentUserId: string | null) {
  const supabase = createAdminClient();
  let query = supabase.from("profiles").select("user_id").eq(column, slug).limit(1);

  if (currentUserId) {
    query = query.neq("user_id", currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return !!(data as ProfileSlugRow[] | null)?.length;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawSlug = url.searchParams.get("slug") || "";
  const currentUserId = url.searchParams.get("userId") || null;
  const moderation = classifySlug(rawSlug);

  if (moderation.state === "blocked") {
    return NextResponse.json({
      available: false,
      normalizedSlug: moderation.normalized,
      state: moderation.state,
      reason: moderation.reason
    });
  }

  try {
    // Slug gating lives here so signup and profile editing both check the same
    // reserved namespace: active public slugs and pending requested slugs.
    const [activeTaken, requestedTaken] = await Promise.all([
      slugHasOwner("slug", moderation.normalized, currentUserId),
      slugHasOwner("slug_requested", moderation.normalized, currentUserId)
    ]);

    const available = !activeTaken && !requestedTaken;

    return NextResponse.json({
      available,
      normalizedSlug: moderation.normalized,
      state: moderation.state,
      reason: available ? moderation.reason : "That @tagg is already taken."
    });
  } catch (error) {
    console.error("Slug availability check failed", {
      slug: moderation.normalized,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Unable to check slug availability. Please try again." },
      { status: 500 }
    );
  }
}
