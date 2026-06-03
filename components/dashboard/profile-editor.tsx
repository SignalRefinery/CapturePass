"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { getProfilePlan } from "@/lib/plans";
import { normalizeUrl } from "@/lib/utils";
import { classifySlug } from "@/lib/slug-moderation";
import { CUSTOM_THEME_KEY, PROFILE_THEME_OPTIONS, coerceThemeForPlan, resolveThemeColors, themeIsAllowedForPlan } from "@/lib/themes";
import {
  deleteProfileViewClient,
  getProfileIdForUserClient,
  isSlugTakenClient,
  saveProfileClient,
  saveProfileViewClient,
  setDefaultProfileViewClient
} from "@/lib/profile-service-client";
import { getIssuedProfileUrl, getReadableProfileUrl } from "@/lib/urls/profile-url";

type ProfileEditorProps = {
  userId: string;
  initialProfile: ProfileRecord;
  initialProfileViews: ProfileViewRecord[];
};

const LINK_FIELD_CONFIG = [
  {
    titleKey: "primary_link_1_title" as const,
    urlKey: "primary_link_1_url" as const,
    titleLabel: "Link 1 title",
    urlLabel: "Link 1 URL",
    titlePlaceholder: "Call",
    urlPlaceholder: "tel:15551234567"
  },
  {
    titleKey: "primary_link_2_title" as const,
    urlKey: "primary_link_2_url" as const,
    titleLabel: "Link 2 title",
    urlLabel: "Link 2 URL",
    titlePlaceholder: "Email",
    urlPlaceholder: "mailto:you@example.com"
  },
  {
    titleKey: "primary_link_3_title" as const,
    urlKey: "primary_link_3_url" as const,
    titleLabel: "Link 3 title",
    urlLabel: "Link 3 URL",
    titlePlaceholder: "Optional link",
    urlPlaceholder: "https://your-link.com"
  },
  {
    titleKey: "primary_link_4_title" as const,
    urlKey: "primary_link_4_url" as const,
    titleLabel: "Link 4 title",
    urlLabel: "Link 4 URL",
    titlePlaceholder: "Optional link",
    urlPlaceholder: "https://your-link.com"
  }
];

const MAX_PROFILE_VIEWS = 3;
const MAX_INTRO_TEXTAREA_HEIGHT = 220;
const LEGACY_INTRO_PROMPT = "Turning complexity into clarity.";
const INTRO_PLACEHOLDER =
  "Write a short line in your own words: what you do, who you help, or the best next step.";

function UpgradeNotice({ children }: { children: React.ReactNode }) {
  return <small className="auth-message">{children}</small>;
}

function cleanIntroValue(value?: string | null) {
  return (value || "").trim() === LEGACY_INTRO_PROMPT ? "" : value || "";
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_INTRO_TEXTAREA_HEIGHT)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_INTRO_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="intro-textarea"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={2}
    />
  );
}

function phoneToTel(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `tel:${digits.length === 10 ? "1" : ""}${digits}`;
}

function emailToMailto(value?: string | null) {
  const email = (value || "").trim();
  if (!email) return "";
  return `mailto:${email}`;
}

function normalizeActionUrl(value?: string | null) {
  const trimmed = (value || "").trim();
  if (
    !trimmed ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("sms:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return normalizeUrl(trimmed);
}

function friendlySlugReviewReason(reason?: string | null) {
  if (!reason) return null;

  if (reason === "denied_by_admin") {
    return "This URL was not approved. Choose another one.";
  }

  if (reason === "approved_by_admin" || reason === "approved_by_admin_override") {
    return "Public URL approved.";
  }

  if (reason === "blocked_name_based_slug_fallback") {
    return "We issued a QR link for added privacy.";
  }

  if (reason === "public_office_title") {
    return "This URL may reference a public office, campaign, or organization and requires review.";
  }

  return reason;
}

function friendlySlugRestrictionMessage(reason?: string | null) {
  if (!reason) return "This URL is restricted or unavailable.";

  return reason
    .replace(/^That slug/, "This URL")
    .replace(/^Slugs must/, "URLs must")
    .replace(/\bslug\b/g, "URL")
    .replace(/\bSlug\b/g, "URL");
}

function createViewFromProfile(profile: ProfileRecord, profileId: string, index: number): ProfileViewRecord {
  return {
    profile_id: profileId,
    name: `View ${index + 1}`,
    view_key: `view-${Date.now()}`,
    sort_order: index,
    full_name: profile.full_name || "",
    organization_name: profile.organization_name || "",
    role_line: profile.role_line || "",
    intro: cleanIntroValue(profile.intro),
    email: profile.email || "",
    phone: profile.phone || "",
    website_url: "",
    profile_badge_1: profile.profile_badge_1 || "",
    profile_badge_2: profile.profile_badge_2 || "",
    profile_badge_3: profile.profile_badge_3 || "",
    show_email: true,
    show_phone: true,
    show_text: true,
    show_in_public_nav: true,
    primary_link_1_title: profile.primary_link_1_title || "Call",
    primary_link_1_url: profile.primary_link_1_url || phoneToTel(profile.phone),
    primary_link_2_title: profile.primary_link_2_title || "Email",
    primary_link_2_url: profile.primary_link_2_url || emailToMailto(profile.email),
    primary_link_3_title: "",
    primary_link_3_url: "",
    primary_link_4_title: "",
    primary_link_4_url: ""
  };
}

function normalizeViewForSave(view: ProfileViewRecord): ProfileViewRecord {
  return {
    ...view,
    name: view.name.trim() || "Profile view",
    full_name: view.full_name.trim(),
    organization_name: (view.organization_name || "").trim(),
    role_line: view.role_line.trim(),
    intro: view.intro.trim(),
    email: view.email.trim(),
    phone: view.phone.trim(),
    website_url: normalizeUrl(view.website_url || ""),
    profile_badge_1: (view.profile_badge_1 || "").trim(),
    profile_badge_2: (view.profile_badge_2 || "").trim(),
    profile_badge_3: (view.profile_badge_3 || "").trim(),
    primary_link_1_url: normalizeActionUrl(view.primary_link_1_url),
    primary_link_2_url: normalizeActionUrl(view.primary_link_2_url),
    primary_link_3_url: normalizeActionUrl(view.primary_link_3_url),
    primary_link_4_url: normalizeActionUrl(view.primary_link_4_url),
    updated_at: new Date().toISOString()
  };
}

export function ProfileEditor({
  userId,
  initialProfile,
  initialProfileViews
}: ProfileEditorProps) {
  const [form, setForm] = useState<ProfileRecord>({
    ...initialProfile,
    intro: cleanIntroValue(initialProfile.intro),
    consent_public_visibility: initialProfile.consent_public_visibility !== false,
    theme_key: coerceThemeForPlan(initialProfile.theme_key, getProfilePlan(initialProfile))
  });
  const [views, setViews] = useState<ProfileViewRecord[]>(
    initialProfileViews.map((view) => ({
      ...view,
      show_in_public_nav: view.show_in_public_nav !== false,
      intro: cleanIntroValue(view.intro)
    }))
  );
  const [activeViewKey, setActiveViewKey] = useState(
    initialProfile.default_view_id || initialProfileViews[0]?.id || initialProfileViews[0]?.view_key || ""
  );
  const [saving, setSaving] = useState(false);
  const [viewSaving, setViewSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [viewMessage, setViewMessage] = useState("");
  const [viewError, setViewError] = useState("");
  const [slugInput, setSlugInput] = useState(initialProfile.slug_requested || initialProfile.slug || "");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [slugCheckError, setSlugCheckError] = useState("");
  const slugCheckRequestRef = useRef(0);

  const callLink = phoneToTel(form.phone);
  const emailLink = emailToMailto(form.email);
  const plan = getProfilePlan(form);
  const selectedThemeKey = coerceThemeForPlan(form.theme_key, plan);
  const showCustomThemeColors = selectedThemeKey === CUSTOM_THEME_KEY;

  const slugModeration = useMemo(() => classifySlug(slugInput || ""), [slugInput]);
  const activeSlugModeration = useMemo(() => classifySlug(form.slug || ""), [form.slug]);
  const normalizedSlugInput = slugModeration.normalized;
  const slugMatchesActive = normalizedSlugInput === (form.slug || "");
  const slugMatchesPending = normalizedSlugInput === (form.slug_requested || "");
  const slugHasChanged = !!normalizedSlugInput && !slugMatchesActive;
  const slugIsApproved = form.slug_status === "approved" && activeSlugModeration.state !== "blocked";
  const readableUrl = useMemo(() => getReadableProfileUrl(form), [form]);
  const issuedUrl = useMemo(() => getIssuedProfileUrl(form), [form]);
  const safeReadableUrl = slugIsApproved && plan.isActivated ? readableUrl : null;
  const safeIssuedUrl = form.private_token && plan.isActivated ? issuedUrl : null;
  const profileStatusLabel = slugIsApproved
    ? form.private_token
      ? "Ready for use"
      : "Pending QR"
    : form.slug_status === "pending_review"
      ? "Pending slug approval"
      : activeSlugModeration.state === "blocked"
        ? "Slug blocked"
        : "Not ready";

  const slugStatusLabel =
    slugModeration.state === "blocked"
      ? "Restricted"
      : slugChecking
        ? "Checking"
        : slugTaken
          ? "Unavailable"
          : form.slug_status === "rejected" && !slugHasChanged
            ? "Rejected"
              : form.slug_status === "pending_review" && slugMatchesPending
                ? "Pending"
              : slugModeration.state === "review"
                ? "Review needed"
                : slugHasChanged
                  ? "Available"
                  : slugIsApproved
                    ? "Approved"
                    : "Not ready";

  const slugStatusMessage =
    slugModeration.state === "blocked"
      ? friendlySlugRestrictionMessage(slugModeration.reason)
      : slugChecking
        ? "Checking availability."
        : slugCheckError
          ? slugCheckError
          : slugTaken
            ? "This URL is already in use."
            : form.slug_status === "rejected" && !slugHasChanged
              ? friendlySlugReviewReason(form.slug_review_reason) ||
                "This URL was not approved. Choose another one."
              : form.slug_status === "pending_review" && slugMatchesPending
                ? "This URL is pending review before it goes live."
                : slugModeration.state === "review"
                  ? "This URL may reference a public office, campaign, or organization and requires review."
                  : slugHasChanged
                    ? "This URL looks available."
                    : slugIsApproved
                      ? "Public URL approved."
                      : "";
  const showSlugStatus =
    slugChecking ||
    !!slugCheckError ||
    slugModeration.state === "blocked" ||
    slugTaken ||
    (form.slug_status === "rejected" && !slugHasChanged) ||
    (form.slug_status === "pending_review" && slugMatchesPending) ||
    slugModeration.state === "review" ||
    slugHasChanged ||
    (!!slugStatusMessage && !slugIsApproved);
  const showCurrentUrlReviewNote =
    (form.slug_status === "pending_review" && !!form.slug_requested) ||
    (slugModeration.state === "review" && slugHasChanged);
  const activeView =
    views.find((view) => (view.id || view.view_key) === activeViewKey) || views[0] || null;
  const defaultViewId = form.default_view_id || views[0]?.id || null;
  const isMultiViewMode = plan.hasMoreProfileSections && (form.page_mode || "single") === "multi";

  useEffect(() => {
    setSlugTaken(false);
    setSlugCheckError("");

    if (!normalizedSlugInput || slugModeration.state === "blocked" || slugMatchesActive || slugMatchesPending) {
      setSlugChecking(false);
      return;
    }

    const requestId = slugCheckRequestRef.current + 1;
    slugCheckRequestRef.current = requestId;
    setSlugChecking(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const taken = await isSlugTakenClient(normalizedSlugInput, userId);

        if (slugCheckRequestRef.current !== requestId) return;
        setSlugTaken(taken);
      } catch {
        if (slugCheckRequestRef.current !== requestId) return;
        setSlugCheckError("Unable to check slug availability right now. Try saving again in a moment.");
      } finally {
        if (slugCheckRequestRef.current === requestId) {
          setSlugChecking(false);
        }
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [normalizedSlugInput, slugMatchesActive, slugMatchesPending, slugModeration.state, userId]);

  function update<K extends keyof ProfileRecord>(key: K, value: ProfileRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMultiViewDisplayMode(value: ProfileRecord["multi_view_display_mode"]) {
    setForm((current) => ({
      ...current,
      page_mode: "multi",
      multi_view_display_mode: value
    }));
  }

  function updateView<K extends keyof ProfileViewRecord>(key: K, value: ProfileViewRecord[K]) {
    if (!activeView) return;

    setViews((current) =>
      current.map((view) =>
        (view.id || view.view_key) === (activeView.id || activeView.view_key)
          ? { ...view, [key]: value }
          : view
      )
    );
  }

  async function copyIssuedUrl() {
    try {
      if (!safeIssuedUrl) {
        throw new Error("Issued link is not available yet.");
      }
      await navigator.clipboard.writeText(safeIssuedUrl);
      setMessage("Issued card link copied.");
      setError("");
    } catch {
      setError("Unable to copy the issued link.");
      setMessage("");
    }
  }

  async function saveActiveViewChanges() {
    if (!activeView) return null;

    const result = await saveProfileViewClient(normalizeViewForSave(activeView));

    if (result.error) {
      throw new Error(result.error.message || "Failed to save view.");
    }

    const savedView = result.data as ProfileViewRecord;
    setViews((current) =>
      current.map((view) =>
        (view.id || view.view_key) === (activeView.id || activeView.view_key)
          ? savedView
          : view
      )
    );
    setActiveViewKey(savedView.id || savedView.view_key);

    return savedView;
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || viewSaving) return;

    setSaving(true);
    setViewSaving(isMultiViewMode && !!activeView);
    setError("");
    setMessage("");
    setViewError("");
    setViewMessage("");

    try {
      if (slugModeration.state === "blocked") {
        throw new Error(slugModeration.reason || "This slug is restricted or unavailable.");
      }

      if (slugChecking) {
        throw new Error("Slug availability is still being checked. Try again in a moment.");
      }

      if (slugTaken) {
        throw new Error("This slug is restricted or unavailable. Choose another slug.");
      }

      const payload: ProfileRecord = {
        ...form,
        slug: normalizedSlugInput || form.slug,
        organization_name: (form.organization_name || "").trim(),
        page_mode: plan.hasMoreProfileSections ? form.page_mode || "single" : "single",
        multi_view_display_mode: form.multi_view_display_mode || "favorite",
        website_url: normalizeUrl(form.website_url || ""),
        profile_badge_1: (form.profile_badge_1 || "").trim(),
        profile_badge_2: (form.profile_badge_2 || "").trim(),
        profile_badge_3: (form.profile_badge_3 || "").trim(),
        primary_link_1_url: callLink,
        primary_link_2_url: emailLink,
        primary_link_3_url:
          form.primary_link_3_url?.startsWith("tel:") || form.primary_link_3_url?.startsWith("sms:")
            ? form.primary_link_3_url
            : normalizeUrl(form.primary_link_3_url || ""),
        primary_link_4_url:
          form.primary_link_4_url?.startsWith("tel:") ||
          form.primary_link_4_url?.startsWith("sms:") ||
          form.primary_link_4_url?.startsWith("/")
            ? form.primary_link_4_url
            : normalizeUrl(form.primary_link_4_url || ""),
        updated_at: new Date().toISOString()
      };

      const result = await saveProfileClient(payload, userId);

      if (!result) {
        throw new Error("No response from save.");
      }

      if (result.error) {
        throw new Error(result.error.message || "Failed to save profile.");
      }

      if (result.data) {
        const savedProfile = result.data as ProfileRecord;
        setForm(savedProfile);
        setSlugInput(savedProfile.slug_requested || savedProfile.slug || "");
      }

      const savedSlugStatus = (result.data as ProfileRecord | null)?.slug_status;
      const savedRequestedSlug = (result.data as ProfileRecord | null)?.slug_requested;

      if (isMultiViewMode) {
        try {
          await saveActiveViewChanges();
        } catch (viewErr) {
          console.error("Profile view save failed:", viewErr);
          setViewError(
            viewErr instanceof Error
              ? `Profile saved, but the active view was not saved: ${viewErr.message}`
              : "Profile saved, but the active view was not saved."
          );
          setMessage("Profile saved. The active view still needs attention.");
          return;
        }
      }

      setMessage(
        savedSlugStatus === "pending_review"
          ? `Changes saved. ${savedRequestedSlug ? `/${savedRequestedSlug}` : "Your requested URL"} is pending review.`
          : "Changes saved."
      );
    } catch (err) {
      console.error("Profile save failed:", err);
      setError(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
      setViewSaving(false);
    }
  }

  async function handleCreateView() {
    if (viewSaving || views.length >= MAX_PROFILE_VIEWS || !plan.hasMoreProfileSections) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      let profileId = form.id || null;

      if (!profileId) {
        const profileResult = await getProfileIdForUserClient(userId);

        if (profileResult.error) {
          throw new Error(profileResult.error.message || "Unable to find your profile.");
        }

        profileId = profileResult.data?.id || null;
      }

      if (!profileId) {
        throw new Error("Save your profile once before creating profile views.");
      }

      const draft = createViewFromProfile(form, profileId, views.length);
      const result = await saveProfileViewClient(draft);

      if (result.error) {
        throw new Error(result.error.message || "Failed to create profile view.");
      }

      const savedView = result.data as ProfileViewRecord;
      setViews((current) => [...current, savedView]);
      setActiveViewKey(savedView.id || savedView.view_key);

      if (!form.default_view_id && savedView.id) {
        const defaultResult = await setDefaultProfileViewClient(userId, savedView.id);

        if (!defaultResult.error && defaultResult.data) {
          const savedProfile = defaultResult.data as ProfileRecord;
          setForm((current) => ({
            ...savedProfile,
            page_mode: current.page_mode,
            multi_view_display_mode: current.multi_view_display_mode,
            default_view_id: savedProfile.default_view_id
          }));
        }
      }

      setViewMessage("Profile view created.");
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Unexpected error while creating the view.");
    } finally {
      setViewSaving(false);
    }
  }

  async function handleSetDefaultView(view: ProfileViewRecord) {
    if (!view.id || viewSaving) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      const result = await setDefaultProfileViewClient(userId, view.id);

      if (result.error) {
        throw new Error(result.error.message || "Failed to set default profile view.");
      }

      if (result.data) {
        const savedProfile = result.data as ProfileRecord;
        setForm((current) => ({
          ...savedProfile,
          page_mode: current.page_mode,
          multi_view_display_mode: current.multi_view_display_mode,
          default_view_id: savedProfile.default_view_id
        }));
      } else {
        update("default_view_id", view.id);
      }

      setActiveViewKey(view.id);
      setViewMessage("Default profile view updated.");
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Unexpected error while setting the default view.");
    } finally {
      setViewSaving(false);
    }
  }

  async function handleDeleteView(view: ProfileViewRecord) {
    if (!view.id || view.id === defaultViewId || viewSaving) return;

    const confirmed = window.confirm("Delete this profile view?");
    if (!confirmed) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      const result = await deleteProfileViewClient(view.id);

      if (result.error) {
        throw new Error(result.error.message || "Failed to delete profile view.");
      }

      const remainingViews = views.filter((current) => current.id !== view.id);
      setViews(remainingViews);
      setActiveViewKey(remainingViews[0]?.id || remainingViews[0]?.view_key || "");
      setViewMessage("Profile view deleted.");
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Unexpected error while deleting the view.");
    } finally {
      setViewSaving(false);
    }
  }

  return (
    <section className="dashboard-wrap">
      <div className="card" style={{ padding: 26 }}>
        <div className="dashboard-kicker">Profile</div>
        <h2
          style={{
            margin: "6px 0 10px",
            fontFamily: "var(--font-heading)",
            fontSize: 42,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            fontWeight: 800
          }}
        >
          Edit your TapTagg profile.
        </h2>

        <p className="editor-copy">
          {plan.isActivated
            ? "Shape how people encounter you. Keep the next step clear, make follow-up easier, and present yourself with less clutter."
            : "Your reserved profile is preview-only. Save the basics now, then activate Digital or above when you are ready to go public."}
        </p>
        <p className="auth-message" style={{ marginTop: 10 }}>
          Current plan: <strong>{plan.label}</strong>
        </p>

        <form className="editor-form" onSubmit={handleSave} style={{ marginTop: 24 }}>
          <div className="editor-actions" style={{ marginBottom: 22 }}>
            <button className="button primary" type="submit" disabled={saving || viewSaving}>
              {saving || viewSaving ? "Saving..." : "Save changes"}
            </button>
            <a className="button secondary" href="/dashboard/preview" target="_blank" rel="noreferrer">
              Preview profile
            </a>
          </div>

          <div className="editor-grid">
            <label className="auth-field">
              <span>Full name</span>
              <input
                value={form.full_name || ""}
                onChange={(event) => update("full_name", event.target.value)}
                placeholder="Full name"
              />
            </label>

            <div className="auth-field">
              <span>Current public URL</span>
              <input value={`taptagg.app/${form.slug || ""}`} readOnly disabled />
              {showCurrentUrlReviewNote ? (
                <small className="auth-message">
                  Your current public URL remains active until approval.
                </small>
              ) : null}
            </div>

            <div className="auth-field">
              <span>Requested slug</span>
              <input
                value={slugInput}
                onChange={(event) => setSlugInput(event.target.value)}
                placeholder="your-name"
                aria-invalid={slugModeration.state === "blocked" || slugTaken}
              />
              {showSlugStatus ? (
                <small
                  className={
                    slugModeration.state === "blocked" ||
                    slugTaken ||
                    (form.slug_status === "rejected" && !slugHasChanged)
                      ? "auth-error slug-status-helper"
                      : "auth-message slug-status-helper"
                  }
                >
                  {slugStatusLabel}
                  {slugStatusMessage ? `: ${slugStatusMessage}` : ""}
                </small>
              ) : null}
              {normalizedSlugInput && normalizedSlugInput !== slugInput ? (
                <small className="auth-message">
                  It will be saved as <strong>{normalizedSlugInput}</strong>.
                </small>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ marginTop: 18, padding: 18 }}>
            <label className="toggle-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={form.consent_public_visibility !== false}
                onChange={(event) => update("consent_public_visibility", event.target.checked)}
              />
                <span>
                Use my personalized public profile link.
                <br />
                <br />
                {plan.isActivated
                  ? "Leave this checked so your approved slug can open your profile. Uncheck it for added privacy; your personalized slug will not be publicly findable, and sharing should use the exact issued link from your QR code."
                  : "Free / Reserved profiles are preview-only, so this link will stay private until you activate Digital or above."}
              </span>
            </label>
          </div>

          <div className="card" style={{ marginTop: 18, padding: 18 }}>
            <div className="dashboard-kicker">Profile Theme</div>
            <h3 style={{ margin: "6px 0 8px" }}>Choose a polished look.</h3>
            <p className="editor-copy">
              Presets keep your profile sharp without needing to tune colors manually. Your plan controls which
              themes are available.
            </p>
            <div className="theme-choice-list" role="radiogroup" aria-label="Profile theme">
              {PROFILE_THEME_OPTIONS.map((theme) => {
                const allowed = themeIsAllowedForPlan(theme.key, plan.key);
                const colors = theme.key === CUSTOM_THEME_KEY
                  ? resolveThemeColors({
                      themeKey: CUSTOM_THEME_KEY,
                      customPrimary: form.brand_color_primary,
                      customSecondary: form.brand_color_secondary,
                      customAccent: form.brand_color_accent,
                      customText: form.brand_color_text
                    })
                  : theme.colors;

                return (
                  <label className={`theme-choice-card${allowed ? "" : " is-disabled"}`} key={theme.key}>
                    <input
                      type="radio"
                      name="theme_key"
                      value={theme.key}
                      checked={selectedThemeKey === theme.key}
                      disabled={!allowed}
                      onChange={() => update("theme_key", theme.key)}
                    />
                    <span>
                      <strong>{theme.name}</strong>
                      <small>
                        {theme.description}
                        {!allowed ? ` Upgrade to ${theme.key === CUSTOM_THEME_KEY ? "Creator" : "Pro"} to unlock.` : ""}
                      </small>
                      <span
                        className="theme-preview-strip"
                        style={{
                          "--theme-preview-primary": colors.primary,
                          "--theme-preview-secondary": colors.secondary,
                          "--theme-preview-accent": colors.accent,
                          "--theme-preview-background": colors.background,
                          "--theme-preview-text": colors.text || "#FFFFFF"
                        } as React.CSSProperties}
                        aria-hidden="true"
                      >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {showCustomThemeColors ? (
              <div className="editor-grid theme-custom-grid">
                <label className="auth-field">
                  <span>Primary color</span>
                  <input
                    type="color"
                    value={form.brand_color_primary || "#0F172A"}
                    onChange={(event) => update("brand_color_primary", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Secondary color</span>
                  <input
                    type="color"
                    value={form.brand_color_secondary || "#1E293B"}
                    onChange={(event) => update("brand_color_secondary", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Accent color</span>
                  <input
                    type="color"
                    value={form.brand_color_accent || "#2563EB"}
                    onChange={(event) => update("brand_color_accent", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Text color</span>
                  <input
                    type="color"
                    value={form.brand_color_text || "#FFFFFF"}
                    onChange={(event) => update("brand_color_text", event.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="editor-grid" style={{ marginTop: 18 }}>
            <label className="auth-field">
              <span>Organization or business name</span>
              <input
                value={form.organization_name || ""}
                onChange={(event) => update("organization_name", event.target.value)}
                placeholder="Optional"
              />
              <small className="auth-message">
                Included in your contact card when someone adds you to contacts.
              </small>
            </label>

            <label className="auth-field">
              <span>Role/Title</span>
              <input
                value={form.role_line || ""}
                onChange={(event) => update("role_line", event.target.value)}
                placeholder="Creator, Stylist, Founder"
              />
            </label>

            <label className="auth-field">
              <span>Website URL</span>
              <input
                value={form.website_url || ""}
                onChange={(event) => update("website_url", event.target.value)}
                placeholder="https://example.com"
              />
            </label>
          </div>

          <label className="auth-field" style={{ marginTop: 18 }}>
            <span>Intro</span>
            <AutoResizeTextarea
              value={form.intro || ""}
              onChange={(value) => update("intro", value)}
              placeholder={INTRO_PLACEHOLDER}
            />
          </label>

          <div className="card view-subsection" style={{ marginTop: 18 }}>
            <div className="dashboard-kicker">Profile badges</div>
            <div className="editor-grid" style={{ marginTop: 14 }}>
              <label className="auth-field">
                <span>Badge 1</span>
                <input
                  value={form.profile_badge_1 || ""}
                  onChange={(event) => update("profile_badge_1", event.target.value)}
                  placeholder="Direct profile"
                  disabled={!plan.hasAdvancedCustomization}
                />
              </label>

              <label className="auth-field">
                <span>Badge 2</span>
                <input
                  value={form.profile_badge_2 || ""}
                  onChange={(event) => update("profile_badge_2", event.target.value)}
                  placeholder="Direct follow-up"
                  disabled={!plan.hasAdvancedCustomization}
                />
              </label>

              <label className="auth-field">
                <span>Badge 3</span>
                <input
                  value={form.profile_badge_3 || ""}
                  onChange={(event) => update("profile_badge_3", event.target.value)}
                  placeholder="Verified contact card"
                  disabled={!plan.hasAdvancedCustomization}
                />
              </label>
            </div>
            {!plan.hasAdvancedCustomization ? (
              <UpgradeNotice>Advanced profile badges unlock with Tagg+.</UpgradeNotice>
            ) : null}
          </div>

          <div className="editor-grid" style={{ marginTop: 18 }}>
            <label className="auth-field">
              <span>Email</span>
              <input
                value={form.email || ""}
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-field">
              <span>Phone *</span>
              <input
                required
                type="tel"
                value={form.phone || ""}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="5551234567"
              />
              {!form.phone ? (
                <small className="auth-error">
                  Phone is required to enable the Call action.
                </small>
              ) : (
                <small className="auth-message">
                  Used to automatically generate your Call button.
                </small>
              )}
            </label>
          </div>

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Primary links</div>
            <h3 style={{ margin: "6px 0 10px", fontSize: "1.25rem", lineHeight: 1.1 }}>
              Put your most useful next steps first.
            </h3>
            <p className="editor-copy" style={{ marginBottom: 18 }}>
              These are the core actions people should see first. On your public profile, only
              completed links should appear.
            </p>

            {LINK_FIELD_CONFIG.map((field, index) => (
              <div
                className="editor-grid"
                style={{ marginTop: index === 0 ? 0 : 14 }}
                key={field.titleKey}
              >
                <label className="auth-field">
                  <span>{field.titleLabel}</span>
                  <input
                    value={(form[field.titleKey] as string) || ""}
                    onChange={(event) => update(field.titleKey, event.target.value)}
                    placeholder={field.titlePlaceholder}
                    disabled={!plan.hasExpandedLinks && index > 1}
                  />
                </label>

                <label className="auth-field">
                  <span>{field.urlLabel}</span>
                  <input
                    value={
                      field.urlKey === "primary_link_1_url"
                        ? callLink
                        : field.urlKey === "primary_link_2_url"
                          ? emailLink
                          : ((form[field.urlKey] as string) || "")
                    }
                    onChange={(event) => update(field.urlKey, event.target.value)}
                    placeholder={field.urlPlaceholder}
                    readOnly={field.urlKey === "primary_link_1_url" || field.urlKey === "primary_link_2_url"}
                    disabled={!plan.hasExpandedLinks && index > 1}
                  />
                </label>
              </div>
            ))}
            {!plan.hasExpandedLinks ? (
              <UpgradeNotice>Free / Reserved profiles include basic Call, Email, and Website fields. Expanded links unlock with Digital.</UpgradeNotice>
            ) : null}
          </div>

          {plan.hasMoreProfileSections ? (
          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Profile views</div>
            <h3 style={{ margin: "6px 0 10px", fontSize: "1.25rem", lineHeight: 1.1 }}>
              Configure single or multi-view display.
            </h3>
            <p className="editor-copy" style={{ marginBottom: 18 }}>
              Single mode keeps your current profile behavior. Multi mode lets visitors switch
              between up to three configured views.
            </p>

            <div className="editor-grid">
              <label className="auth-field">
                <span>Page mode</span>
                <select
                  value={form.page_mode || "single"}
                  onChange={(event) =>
                    update("page_mode", event.target.value as ProfileRecord["page_mode"])
                  }
                  disabled={!plan.hasMoreProfileSections}
                >
                  <option value="single">single</option>
                  <option value="multi">multi</option>
                </select>
                {!plan.hasMoreProfileSections ? (
                  <UpgradeNotice>More profile sections and multi-view profiles unlock with Creator.</UpgradeNotice>
                ) : null}
              </label>

              {isMultiViewMode ? (
                <label className="auth-field">
                  <span>Multi-view display</span>
                  <select
                    value={form.multi_view_display_mode || "favorite"}
                    onChange={(event) =>
                      updateMultiViewDisplayMode(
                        event.target.value as ProfileRecord["multi_view_display_mode"]
                      )
                    }
                  >
                    <option value="favorite">favorite</option>
                    <option value="landing">landing</option>
                  </select>
                </label>
              ) : null}
            </div>

            {isMultiViewMode ? (
              <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
              <div className="status-list">
                {views.length > 0 ? (
                  views.map((view) => {
                    const viewKey = view.id || view.view_key;
                    const isActive = viewKey === activeViewKey;
                    const isDefault = !!view.id && view.id === defaultViewId;

                    return (
                      <div className="status-row" key={viewKey}>
                        <span>
                          <strong>{view.name || "Profile view"}</strong>
                          <br />
                          <small style={{ opacity: 0.72 }}>
                            {isDefault ? "Default / favorite" : view.view_key}
                          </small>
                        </span>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            className={isActive ? "button primary" : "button secondary"}
                            type="button"
                            onClick={() => setActiveViewKey(viewKey)}
                          >
                            {isActive ? "Editing" : "Edit"}
                          </button>

                          {isMultiViewMode ? (
                            <button
                              className="button secondary"
                              type="button"
                              disabled={!view.id || isDefault || viewSaving}
                              onClick={() => handleSetDefaultView(view)}
                            >
                              {isDefault ? "Default" : "Set default"}
                            </button>
                          ) : null}

                          <button
                            className="button secondary"
                            type="button"
                            disabled={!view.id || isDefault || viewSaving}
                            onClick={() => handleDeleteView(view)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="status-row">
                    <span>No profile views created yet. Single profile active.</span>
                  </div>
                )}
              </div>

              {viewError ? <p className="auth-error">{viewError}</p> : null}
              {viewMessage ? <p className="auth-message">{viewMessage}</p> : null}

              <div className="editor-actions">
                <button
                  className="button secondary"
                  type="button"
                  disabled={viewSaving || views.length >= MAX_PROFILE_VIEWS}
                  onClick={handleCreateView}
                >
                  {views.length >= MAX_PROFILE_VIEWS ? "View limit reached" : "Create profile view"}
                </button>
              </div>
            </div>
            ) : (
              <p className="editor-copy" style={{ marginTop: 18 }}>
                Single mode uses your main profile information. Switch to multi to manage separate views.
              </p>
            )}

            {isMultiViewMode && activeView ? (
              <div className="card" style={{ marginTop: 20, padding: 18 }}>
                <div className="dashboard-kicker">Editing view</div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>View name</span>
                    <input
                      value={activeView.name || ""}
                      onChange={(event) => updateView("name", event.target.value)}
                      placeholder="Campaign view"
                    />
                  </label>

                  <label className="auth-field">
                    <span>Full name</span>
                    <input
                      value={activeView.full_name || ""}
                      onChange={(event) => updateView("full_name", event.target.value)}
                      placeholder="Full name"
                    />
                  </label>
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>Organization or business name</span>
                    <input
                      value={activeView.organization_name || ""}
                      onChange={(event) => updateView("organization_name", event.target.value)}
                      placeholder="Optional"
                    />
                    <small className="auth-message">
                      Included in this view contact card.
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>Role/Title</span>
                    <input
                      value={activeView.role_line || ""}
                      onChange={(event) => updateView("role_line", event.target.value)}
                      placeholder="Creator, Stylist, Founder"
                    />
                  </label>
                </div>

                <label className="auth-field" style={{ marginTop: 14 }}>
                  <span>Intro</span>
                  <AutoResizeTextarea
                    value={activeView.intro || ""}
                    onChange={(value) => updateView("intro", value)}
                    placeholder={INTRO_PLACEHOLDER}
                  />
                </label>

                <div className="card view-subsection" style={{ marginTop: 18 }}>
                  <div className="dashboard-kicker">Profile badges</div>
                  <div className="editor-grid" style={{ marginTop: 14 }}>
                    <label className="auth-field">
                      <span>Badge 1</span>
                        <input
                          value={activeView.profile_badge_1 || ""}
                          onChange={(event) => updateView("profile_badge_1", event.target.value)}
                          placeholder="Direct profile"
                          disabled={!plan.hasAdvancedCustomization}
                        />
                    </label>

                    <label className="auth-field">
                      <span>Badge 2</span>
                        <input
                          value={activeView.profile_badge_2 || ""}
                          onChange={(event) => updateView("profile_badge_2", event.target.value)}
                          placeholder="Direct follow-up"
                          disabled={!plan.hasAdvancedCustomization}
                        />
                    </label>

                    <label className="auth-field">
                      <span>Badge 3</span>
                        <input
                          value={activeView.profile_badge_3 || ""}
                          onChange={(event) => updateView("profile_badge_3", event.target.value)}
                          placeholder="Verified contact card"
                          disabled={!plan.hasAdvancedCustomization}
                        />
                    </label>
                  </div>
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      value={activeView.email || ""}
                      onChange={(event) => updateView("email", event.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="auth-field">
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={activeView.phone || ""}
                      onChange={(event) => updateView("phone", event.target.value)}
                      placeholder="5551234567"
                    />
                  </label>
                </div>

                <div className="card view-subsection" style={{ marginTop: 18 }}>
                  <div className="dashboard-kicker">Contact visibility</div>
                  <div className="visibility-list">
                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_email}
                        onChange={(event) => updateView("show_email", event.target.checked)}
                      />
                      <span>Display email address on this view.</span>
                    </label>

                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_phone}
                        onChange={(event) => updateView("show_phone", event.target.checked)}
                      />
                      <span>Display phone number on this view.</span>
                    </label>

                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={activeView.show_in_public_nav !== false}
                        onChange={(event) => updateView("show_in_public_nav", event.target.checked)}
                      />
                      <span>
                        Show this view as a public profile button.
                        <br />
                        <small className="auth-message">
                          Turn this off for views you only want opened by card tap, QR scan, or digital pass.
                        </small>
                      </span>
                    </label>

                    <div className="action-choice-row">
                      <span className="action-choice-label">Secondary button</span>
                      <div className="action-choice-options" aria-label="Secondary profile button">
                        <button
                          className={activeView.show_text === true ? "action-choice is-active" : "action-choice"}
                          type="button"
                          disabled={!plan.hasCustomButtons}
                          onClick={() => updateView("show_text", true)}
                        >
                          Text
                        </button>

                        <button
                          className={activeView.show_text === false ? "action-choice is-active" : "action-choice"}
                          type="button"
                          disabled={!plan.hasCustomButtons}
                          onClick={() => updateView("show_text", false)}
                        >
                          Email
                        </button>

                        <button
                          className={activeView.show_text === null ? "action-choice is-active" : "action-choice"}
                          type="button"
                          disabled={!plan.hasCustomButtons}
                          onClick={() => updateView("show_text", null)}
                        >
                          None
                        </button>
                      </div>
                      {!plan.hasCustomButtons ? (
                        <UpgradeNotice>Custom profile buttons unlock with Tagg+.</UpgradeNotice>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="card view-subsection link-fields-card" style={{ marginTop: 18 }}>
                  <div className="dashboard-kicker">View primary links</div>
                  {LINK_FIELD_CONFIG.map((field, index) => (
                    <div
                      className="editor-grid link-field-row"
                      style={{ marginTop: index === 0 ? 14 : 14 }}
                      key={`view-${field.titleKey}`}
                    >
                      <label className="auth-field">
                        <span>{field.titleLabel}</span>
                        <input
                          value={(activeView[field.titleKey] as string) || ""}
                          onChange={(event) => updateView(field.titleKey, event.target.value)}
                          placeholder={field.titlePlaceholder}
                        />
                      </label>

                      <label className="auth-field">
                        <span>{field.urlLabel}</span>
                        <input
                          value={(activeView[field.urlKey] as string) || ""}
                          onChange={(event) => updateView(field.urlKey, event.target.value)}
                          placeholder={field.urlPlaceholder}
                        />
                      </label>
                    </div>
                  ))}
                </div>

                {isMultiViewMode ? (
                  <div className="editor-actions" style={{ marginTop: 18 }}>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={!activeView.id || activeView.id === defaultViewId || saving || viewSaving}
                      onClick={() => handleSetDefaultView(activeView)}
                    >
                      {activeView.id === defaultViewId ? "Default view" : "Set as default"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          ) : null}

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Account flags</div>
            <div className="editor-grid">
              <label className="auth-field">
                <span>Promo code</span>
                <input
                  value={form.promo_code_used || "None"}
                  readOnly
                  disabled
                />
              </label>

              <div className="auth-field">
                <span>Access</span>
                <input
                  value={form.lifetime_free ? "Founder lifetime access" : plan.label}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="card metadata-card" style={{ marginTop: 24 }}>
            <div className="dashboard-kicker">Technical details</div>
            <h3 className="metadata-title">
              Profile access and distribution
            </h3>

            <div className="metadata-list">
              <div className="metadata-row">
                <span className="metadata-label">Public profile</span>
                <strong className="metadata-value">
                  {safeReadableUrl
                    ? safeReadableUrl.replace(/^https?:\/\//, "")
                    : "Pending approval"}
                </strong>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Issued card / QR</span>
                <strong className="metadata-value">
                  {safeIssuedUrl
                    ? safeIssuedUrl.replace(/^https?:\/\//, "")
                    : "Not issued"}
                </strong>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Status</span>
                <strong className="metadata-value">{profileStatusLabel}</strong>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Slug status</span>
                <strong className="metadata-value">{slugStatusLabel}</strong>
              </div>
            </div>
          </div>

          {error ? <p className="auth-error" style={{ marginTop: 18 }}>{error}</p> : null}
          {message ? <p className="auth-message" style={{ marginTop: 18 }}>{message}</p> : null}

          <div className="editor-actions" style={{ marginTop: 24 }}>
            <button className="button primary" type="submit" disabled={saving || viewSaving}>
              {saving || viewSaving ? "Saving..." : "Save changes"}
            </button>

            <button
              className="button secondary"
              type="button"
              onClick={copyIssuedUrl}
              disabled={!safeIssuedUrl}
            >
              Copy issued link
            </button>

            {safeIssuedUrl ? (
              <a className="button secondary" href={safeIssuedUrl} target="_blank" rel="noreferrer">
                Open issued profile
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
