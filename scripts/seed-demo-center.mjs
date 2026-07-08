#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dataPath = path.join(repoRoot, "lib", "demo-center-data.json");

function loadDemoData() {
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createAdmin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

function requireSeedSafety() {
  const seedDemos = process.env.CAPTUREPASS_SEED_DEMOS;
  const seedTarget = process.env.CAPTUREPASS_SEED_TARGET;
  const allowProductionSeed = process.env.CAPTUREPASS_ALLOW_PRODUCTION_DEMO_SEED;

  if (seedDemos !== "true") {
    throw new Error("Refusing to seed demos: set CAPTUREPASS_SEED_DEMOS=true to confirm the operation.");
  }

  if (!seedTarget) {
    throw new Error(
      "Refusing to seed demos: set CAPTUREPASS_SEED_TARGET=local, staging, or production to choose the target."
    );
  }

  if (!["local", "staging", "production"].includes(seedTarget)) {
    throw new Error(
      `Refusing to seed demos: invalid CAPTUREPASS_SEED_TARGET=${seedTarget}. Use local, staging, or production.`
    );
  }

  if (seedTarget === "production" && allowProductionSeed !== "true") {
    throw new Error(
      "Refusing to seed demos into production: set CAPTUREPASS_ALLOW_PRODUCTION_DEMO_SEED=true to confirm the risk."
    );
  }

  console.warn(`[demo-center] Seeding demos into ${seedTarget}. This script is idempotent and will upsert demo rows.`);
  if (seedTarget === "production") {
    console.warn("[demo-center] Production target confirmed. Double-check the Supabase project before continuing.");
  }
}

async function findUserByEmail(admin, email) {
  const target = email.trim().toLowerCase();
  const perPage = 100;

  for (let page = 1; page < 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const users = data?.users || [];
    const match = users.find((user) => (user.email || "").trim().toLowerCase() === target);
    if (match) return match;

    if (users.length < perPage) break;
  }

  return null;
}

async function upsertAuthUser(admin, demo) {
  const existing = await findUserByEmail(admin, demo.profile.email);
  if (existing?.id) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: demo.profile.email,
    password: "DemoPass123!",
    email_confirm: true,
    user_metadata: {
      demo_seed: true,
      demo_slug: demo.slug,
      demo_business_type: demo.businessType
    }
  });

  if (error || !data?.user?.id) {
    throw new Error(error?.message || `Unable to create auth user for ${demo.profile.email}`);
  }

  return data.user.id;
}

async function findDemoProfileBySlug(admin, slug) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data || null;
}

async function upsertDemoProfile(admin, demo, userId, existingProfileId = null) {
  const now = new Date().toISOString();

  const payload = {
    user_id: userId,
    business_type: demo.businessType,
    slug: demo.profile.slug,
    private_token: demo.profile.private_token || null,
    full_name: demo.profile.full_name,
    role_line: demo.profile.role_line,
    organization_name: demo.profile.organization_name,
    intro: demo.profile.intro,
    email: demo.profile.email,
    phone: demo.profile.phone,
    text_phone: demo.profile.text_phone,
    website_url: demo.profile.website_url,
    profile_badge_1: demo.profile.profile_badge_1 || "",
    profile_badge_2: demo.profile.profile_badge_2 || "",
    profile_badge_3: demo.profile.profile_badge_3 || "",
    page_mode: demo.profile.page_mode || "single",
    multi_view_display_mode: demo.profile.multi_view_display_mode || "favorite",
    default_view_id: null,
    primary_link_1_title: demo.profile.primary_links[0]?.title || "",
    primary_link_1_url: demo.profile.primary_links[0]?.url || "",
    primary_link_1_type: demo.profile.primary_links[0]?.type || "website",
    primary_link_2_title: demo.profile.primary_links[1]?.title || "",
    primary_link_2_url: demo.profile.primary_links[1]?.url || "",
    primary_link_2_type: demo.profile.primary_links[1]?.type || "website",
    primary_link_3_title: demo.profile.primary_links[2]?.title || "",
    primary_link_3_url: demo.profile.primary_links[2]?.url || "",
    primary_link_3_type: demo.profile.primary_links[2]?.type || "website",
    primary_link_4_title: demo.profile.primary_links[3]?.title || "",
    primary_link_4_url: demo.profile.primary_links[3]?.url || "",
    primary_link_4_type: demo.profile.primary_links[3]?.type || "website",
    is_active: true,
    consent_public_visibility: true,
    slug_status: "approved",
    theme_key: "capturepass_brand",
    stripe_plan_key: "creator",
    show_text: true,
    updated_at: now
  };

  const profileResult = existingProfileId
    ? await admin.from("profiles").update(payload).eq("id", existingProfileId).select("id, slug").single()
    : await admin.from("profiles").upsert(payload, { onConflict: "user_id" }).select("id, slug").single();

  if (profileResult.error || !profileResult.data) {
    throw new Error(profileResult.error?.message || `Unable to upsert profile for ${demo.slug}`);
  }

  return { profileId: profileResult.data.id };
}

async function upsertDemoViews(admin, demo, profileId) {
  const viewDefs = demo.views || [];
  let defaultViewId = null;

  for (const view of viewDefs) {
    const payload = {
      profile_id: profileId,
      view_key: view.view_key,
      name: view.name,
      sort_order: view.sort_order,
      full_name: view.full_name,
      organization_name: view.organization_name,
      role_line: view.role_line,
      intro: view.intro,
      email: view.email,
      phone: view.phone,
      text_phone: view.text_phone,
      website_url: view.website_url,
      profile_badge_1: view.profile_badge_1 || "",
      profile_badge_2: view.profile_badge_2 || "",
      profile_badge_3: view.profile_badge_3 || "",
      show_email: true,
      show_phone: true,
      show_text: true,
      show_in_public_nav: view.show_in_public_nav !== false,
      primary_link_1_title: view.primary_links[0]?.title || "",
      primary_link_1_url: view.primary_links[0]?.url || "",
      primary_link_1_type: view.primary_links[0]?.type || "website",
      primary_link_2_title: view.primary_links[1]?.title || "",
      primary_link_2_url: view.primary_links[1]?.url || "",
      primary_link_2_type: view.primary_links[1]?.type || "website",
      primary_link_3_title: view.primary_links[2]?.title || "",
      primary_link_3_url: view.primary_links[2]?.url || "",
      primary_link_3_type: view.primary_links[2]?.type || "website",
      primary_link_4_title: view.primary_links[3]?.title || "",
      primary_link_4_url: view.primary_links[3]?.url || "",
      primary_link_4_type: view.primary_links[3]?.type || "website",
      updated_at: new Date().toISOString()
    };

    const result = await admin
      .from("profile_views")
      .upsert(payload, { onConflict: "profile_id,view_key" })
      .select("id, view_key")
      .single();

    if (result.error || !result.data) {
      throw new Error(result.error?.message || `Unable to upsert view ${view.view_key} for ${demo.slug}`);
    }

    if (view.view_key === demo.profile.default_view_key) {
      defaultViewId = result.data.id;
    }
  }

  const { data: existingViews, error: listError } = await admin
    .from("profile_views")
    .select("id, view_key")
    .eq("profile_id", profileId);

  if (listError) {
    throw new Error(listError.message);
  }

  const desiredViewKeys = new Set(viewDefs.map((view) => view.view_key));
  const staleViewIds = (existingViews || [])
    .filter((view) => !desiredViewKeys.has(view.view_key))
    .map((view) => view.id)
    .filter(Boolean);

  for (const staleViewId of staleViewIds) {
    const { error } = await admin.from("profile_views").delete().eq("id", staleViewId);
    if (error) {
      throw new Error(error.message);
    }
  }

  return defaultViewId;
}

async function clearDemoViews(admin, profileId) {
  const { data: existingViews, error: listError } = await admin
    .from("profile_views")
    .select("id")
    .eq("profile_id", profileId);

  if (listError) {
    throw new Error(listError.message);
  }

  for (const view of existingViews || []) {
    const { error } = await admin.from("profile_views").delete().eq("id", view.id);
    if (error) {
      throw new Error(error.message);
    }
  }
}

async function seedDemoCenter() {
  requireSeedSafety();
  const admin = createAdmin();
  const demoData = loadDemoData();

  for (const demo of demoData.demos) {
    const existingProfile = await findDemoProfileBySlug(admin, demo.slug);
    const userId = existingProfile?.user_id || (await upsertAuthUser(admin, demo));
    const { profileId } = await upsertDemoProfile(admin, demo, userId, existingProfile?.id || null);

    if (demo.views?.length) {
      const defaultViewId = await upsertDemoViews(admin, demo, profileId);

      if (defaultViewId) {
        const { error } = await admin
          .from("profiles")
          .update({
            default_view_id: defaultViewId,
            updated_at: new Date().toISOString()
          })
          .eq("id", profileId);

        if (error) {
          throw new Error(error.message);
        }
      }
    } else {
      await clearDemoViews(admin, profileId);
    }

    console.log(`Seeded ${demo.slug}`);
  }
}

seedDemoCenter().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
