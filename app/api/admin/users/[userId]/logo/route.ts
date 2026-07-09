import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteBusinessAssetUrl,
  uploadProfileLogoAsset
} from "@/lib/business/assets";
import { requireCapturePassAdmin } from "@/lib/auth/admin";

type ProfileLogoRecord = {
  id: string;
  brand_logo_url?: string | null;
  user_id?: string | null;
};

async function getAuthorizedProfile(userId: string) {
  const adminUser = await requireCapturePassAdmin();
  if (!adminUser) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, brand_logo_url, user_id")
    .eq("user_id", userId)
    .maybeSingle<ProfileLogoRecord>();

  if (error) {
    return {
      error: NextResponse.json({ error: "Unable to load profile." }, { status: 500 })
    };
  }

  if (!profile?.id) {
    return {
      error: NextResponse.json({ error: "Profile not found." }, { status: 404 })
    };
  }

  return { admin, profile };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const auth = await getAuthorizedProfile(userId);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const logoFile = formData.get("logo");

  if (!(logoFile instanceof File) || logoFile.size === 0) {
    return NextResponse.json({ error: "Choose a PNG logo to upload." }, { status: 400 });
  }

  try {
    const brandLogoUrl = await uploadProfileLogoAsset({
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

    return NextResponse.json({ brand_logo_url: data.brand_logo_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "logo_upload_failed";
    const status = message === "logo_too_large" || message === "logo_must_be_png" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const auth = await getAuthorizedProfile(userId);
  if ("error" in auth) return auth.error;

  await deleteBusinessAssetUrl(auth.profile.brand_logo_url);

  const { error } = await auth.admin
    .from("profiles")
    .update({ brand_logo_url: null })
    .eq("id", auth.profile.id);

  if (error) {
    return NextResponse.json({ error: "Unable to remove logo." }, { status: 500 });
  }

  return NextResponse.json({ brand_logo_url: null });
}
