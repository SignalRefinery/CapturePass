import { createClient } from "@/lib/supabase/server";
import type { ProfileRecord } from "@/lib/types";

export type PublicProfileRecord = ProfileRecord & {
  private_token?: null;
};

type PublicProfileRpcName =
  | "get_public_profile_by_slug"
  | "get_public_profile_by_token";

async function getPublicProfileFromRpc(
  rpcName: PublicProfileRpcName,
  params: Record<string, string>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc(rpcName, params)
    .maybeSingle<PublicProfileRecord>();

  if (error) {
    console.error("Public profile RPC lookup failed", {
      rpcName,
      code: error.code,
      error: error.message
    });
    return null;
  }

  return data || null;
}

export async function getPublicProfileBySlug(slug: string) {
  return getPublicProfileFromRpc("get_public_profile_by_slug", {
    profile_slug: slug
  });
}

export async function getPublicProfileByToken(token: string) {
  return getPublicProfileFromRpc("get_public_profile_by_token", {
    profile_token: token
  });
}
