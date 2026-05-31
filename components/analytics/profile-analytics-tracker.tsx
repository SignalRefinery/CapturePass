"use client";

import { useEffect } from "react";

type AnalyticsTarget = {
  profileId?: string | null;
  slug?: string | null;
  organizationId?: string | null;
  organizationMemberId?: string | null;
  profileViewId?: string | null;
  cardId?: string | null;
};

type AnalyticsEvent = {
  event_type: string;
  source?: string;
  action_type?: string | null;
  action_label?: string | null;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
};

function postAnalytics(target: AnalyticsTarget, event: AnalyticsEvent) {
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      profile_id: target.profileId || null,
      slug: target.slug || null,
      organization_id: target.organizationId || null,
      organization_member_id: target.organizationMemberId || null,
      profile_view_id: target.profileViewId || null,
      card_id: target.cardId || null,
      ...event
    })
  }).catch(() => {});
}

function sourceFromLocation() {
  const source = new URLSearchParams(window.location.search).get("source");
  if (source === "nfc") return { source: "nfc", eventType: "nfc_tap" };
  if (source === "qr") return { source: "qr", eventType: "qr_scan" };
  if (source === "share") return { source: "shared_link", eventType: "shared_link_visit" };
  return { source: "direct", eventType: "direct_visit" };
}

function actionTypeFor(label?: string | null, href?: string | null) {
  const text = `${label || ""} ${href || ""}`.toLowerCase();
  if (href?.startsWith("tel:") || text.includes("call")) return "call";
  if (href?.startsWith("sms:") || text.includes("text")) return "text";
  if (href?.startsWith("mailto:") || text.includes("email")) return "email";
  if (text.includes("linkedin")) return "linkedin";
  if (text.includes("facebook")) return "facebook";
  if (text.includes("instagram")) return "instagram";
  if (text.includes("tiktok")) return "tiktok";
  if (text.includes("youtube")) return "youtube";
  if (text.includes("calendly")) return "calendly";
  if (text.includes("review")) return "review_link";
  if (href?.startsWith("http")) return "website";
  return "custom_button";
}

export function trackProfileAction(
  target: AnalyticsTarget,
  item: { title?: string | null; href?: string | null }
) {
  const href = item.href || "";
  const label = item.title || "";
  const actionType = actionTypeFor(label, href);

  postAnalytics(target, {
    event_type: "button_click",
    source: sourceFromLocation().source,
    action_type: actionType,
    action_label: label,
    action_url: href
  });

  if (href.includes("/api/vcard/") || href.includes("/api/pass-vcard/")) {
    postAnalytics(target, {
      event_type: "vcard_download",
      source: sourceFromLocation().source,
      action_type: "custom_button",
      action_label: label,
      action_url: href
    });
    postAnalytics(target, {
      event_type: "contact_save",
      source: sourceFromLocation().source,
      action_type: "custom_button",
      action_label: label,
      action_url: href
    });
  }
}

export function ProfileAnalyticsTracker({ target }: { target: AnalyticsTarget }) {
  const profileId = target.profileId || null;
  const slug = target.slug || null;
  const organizationId = target.organizationId || null;
  const organizationMemberId = target.organizationMemberId || null;
  const profileViewId = target.profileViewId || null;
  const cardId = target.cardId || null;

  useEffect(() => {
    const stableTarget = { profileId, slug, organizationId, organizationMemberId, profileViewId, cardId };
    const { source, eventType } = sourceFromLocation();
    const key = `tt-analytics:${profileId || organizationMemberId || slug}:${source}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    postAnalytics(stableTarget, {
      event_type: "profile_view",
      source,
      metadata: { path: window.location.pathname }
    });
    postAnalytics(stableTarget, {
      event_type: eventType,
      source,
      metadata: { path: window.location.pathname }
    });
  }, [cardId, organizationId, organizationMemberId, profileId, profileViewId, slug]);

  return null;
}
