import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function cleanValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  const firstName = cleanValue(meta.first_name);
  const lastName = cleanValue(meta.last_name);
  const fullName =
    cleanValue(meta.full_name) ||
    cleanValue([firstName, lastName].filter(Boolean).join(" "));
  const suggestedSlug =
    cleanValue(meta.suggested_slug) ||
    (fullName ? slugify(fullName) : user.email ? slugify(user.email.split("@")[0]) : null);

  const promoCode = cleanValue(meta.promo_code)?.toUpperCase() || null;
  const referralCode = cleanValue(meta.referral_code_used);
  const isPublicOfficial = Boolean(meta.is_public_official);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      user_id: user.id,
      email: user.email || null,
      full_name: fullName,
      slug: suggestedSlug,
      promo_code_used: promoCode,
      referral_code_used: referralCode,
      is_public_official: isPublicOfficial,
      lifetime_free: promoCode === "FOUNDERS",
      billing_exempt: promoCode === "FOUNDERS",
      stripe_plan_key: promoCode === "FOUNDERS" ? "founder" : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else if (promoCode === "FOUNDERS") {
    await supabase
      .from("profiles")
      .update({
        promo_code_used: promoCode,
        lifetime_free: true,
        billing_exempt: true,
        stripe_plan_key: "founder",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}