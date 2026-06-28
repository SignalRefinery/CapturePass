import { createAdminClient } from "@/lib/supabase/admin";

export const BUSINESS_ASSETS_BUCKET = "business-assets";
export const BUSINESS_HEADSHOT_MAX_BYTES = 2 * 1024 * 1024;
export const BUSINESS_LOGO_MAX_BYTES = 5 * 1024 * 1024;

const PUBLIC_OBJECT_PATH = `/storage/v1/object/public/${BUSINESS_ASSETS_BUCKET}/`;

type BusinessAssetKind = "headshot" | "logo";

type UploadBusinessAssetOptions = {
  file: File | null;
  kind: BusinessAssetKind;
  memberId?: string | null;
  oldUrl?: string | null;
  organizationId: string;
};

type UploadProfileLogoOptions = {
  file: File | null;
  oldUrl?: string | null;
  profileId: string;
};

function cleanFilenamePart(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function objectPathFromPublicUrl(url?: string | null) {
  if (!url) return null;
  const markerIndex = url.indexOf(PUBLIC_OBJECT_PATH);
  if (markerIndex === -1) return null;
  return decodeURIComponent(url.slice(markerIndex + PUBLIC_OBJECT_PATH.length));
}

export async function deleteBusinessAssetUrl(url?: string | null) {
  const objectPath = objectPathFromPublicUrl(url);
  if (!objectPath) return;

  const admin = createAdminClient();
  await admin.storage.from(BUSINESS_ASSETS_BUCKET).remove([objectPath]);
}

export async function uploadBusinessAsset({
  file,
  kind,
  memberId,
  oldUrl,
  organizationId
}: UploadBusinessAssetOptions) {
  if (!file || file.size === 0) return null;

  const isLogo = kind === "logo";
  const maxBytes = isLogo ? BUSINESS_LOGO_MAX_BYTES : BUSINESS_HEADSHOT_MAX_BYTES;
  const allowedTypes = isLogo
    ? ["image/png"]
    : ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxBytes) {
    throw new Error(isLogo ? "logo_too_large" : "headshot_too_large");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(isLogo ? "logo_must_be_png" : "headshot_invalid_type");
  }

  const admin = createAdminClient();
  const extension = isLogo
    ? "png"
    : file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const safeOrganizationId = cleanFilenamePart(organizationId);
  const timestamp = Date.now();
  const path = isLogo
    ? `organizations/${safeOrganizationId}/branding/logo-${timestamp}.${extension}`
    : `organizations/${safeOrganizationId}/members/${cleanFilenamePart(memberId || "member")}/headshot-${timestamp}.${extension}`;

  const { error } = await admin.storage.from(BUSINESS_ASSETS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new Error(error.message || "asset_upload_failed");
  }

  if (oldUrl) {
    await deleteBusinessAssetUrl(oldUrl);
  }

  const { data } = admin.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfileLogoAsset({
  file,
  oldUrl,
  profileId
}: UploadProfileLogoOptions) {
  if (!file || file.size === 0) return null;

  if (file.size > BUSINESS_LOGO_MAX_BYTES) {
    throw new Error("logo_too_large");
  }

  if (file.type !== "image/png") {
    throw new Error("logo_must_be_png");
  }

  const admin = createAdminClient();
  const safeProfileId = cleanFilenamePart(profileId);
  const path = `profiles/${safeProfileId}/branding/logo-${Date.now()}.png`;

  const { error } = await admin.storage.from(BUSINESS_ASSETS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new Error(error.message || "asset_upload_failed");
  }

  if (oldUrl) {
    await deleteBusinessAssetUrl(oldUrl);
  }

  const { data } = admin.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const uploadBusinessIndividualLogoAsset = uploadProfileLogoAsset;
