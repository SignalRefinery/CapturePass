import { NextResponse } from "next/server";
import {
  deleteBusinessAssetUrl,
  uploadBusinessIndividualLogoAsset
} from "@/lib/business/assets";
import { sendBusinessIndividualLogoEmail } from "@/lib/notifications/send-business-individual-logo-email";
import { getProfilePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRecord } from "@/lib/types";

type ProfileLogoRecord = {
  id: string;
  user_id: string;
  brand_logo_url?: string | null;
  is_active?: boolean | null;
  stripe_plan_key?: string | null;
  billing_exempt?: boolean | null;
  lifetime_free?: boolean | null;
  promo_code_used?: string | null;
  is_admin?: boolean | null;
};

async function getAuthorizedBusinessIndividualProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, user_id, brand_logo_url, is_active, stripe_plan_key, billing_exempt, lifetime_free, promo_code_used, is_admin")
    .eq("user_id", user.id)
    .maybeSingle<ProfileLogoRecord>();

  if (error) {
    return {
      error: NextResponse.json(
        { error: "Unable to load profile." },
        { status: 500 }
      )
    };
  }

  if (!profile?.id) {
    return {
      error: NextResponse.json(
        { error: "Save your profile before uploading a logo." },
        { status: 404 }
      )
    };
  }

  const plan = getProfilePlan(profile as ProfileRecord);
  if (plan.key !== "business_individual") {
    return {
      error: NextResponse.json(
        { error: "Logo upload is available for Business Individual profiles." },
        { status: 403 }
      )
    };
  }

  return { admin, profile };
}

export async function POST(request: Request) {
  const auth = await getAuthorizedBusinessIndividualProfile();
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const logoFile = formData.get("logo");

  if (!(logoFile instanceof File) || logoFile.size === 0) {
    return NextResponse.json(
      { error: "Choose a PNG logo to upload." },
      { status: 400 }
    );
  }

  try {
    const brandLogoUrl = await uploadBusinessIndividualLogoAsset({
      file: logoFile,
      oldUrl: auth.profile.brand_logo_url,
      profileId: auth.profile.id
    });

    const { data, error } = await auth.admin
      .from("profiles")
      .update({ brand_logo_url: brandLogoUrl })
      .eq("id", auth.profile.id)
      .select("brand_logo_url")
      .single<{ brand_logo_url: string | null }>();

    if (error) {
      return NextResponse.json(
        { error: "Logo uploaded, but the profile could not be updated." },
        { status: 500 }
      );
    }

    await sendBusinessIndividualLogoEmail({
      brandLogoUrl: data.brand_logo_url,
      profileId: auth.profile.id
    }).catch((emailError) => {
      console.error("Business Individual logo email failed after upload", {
        profileId: auth.profile.id,
        error: emailError instanceof Error ? emailError.message : "Unknown logo email error"
      });
    });

    return NextResponse.json({ brand_logo_url: data.brand_logo_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "logo_upload_failed";
    const status = message === "logo_too_large" || message === "logo_must_be_png" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  const auth = await getAuthorizedBusinessIndividualProfile();
  if ("error" in auth) return auth.error;

  await deleteBusinessAssetUrl(auth.profile.brand_logo_url);

  const { error } = await auth.admin
    .from("profiles")
    .update({ brand_logo_url: null })
    .eq("id", auth.profile.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to remove logo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ brand_logo_url: null });
}
