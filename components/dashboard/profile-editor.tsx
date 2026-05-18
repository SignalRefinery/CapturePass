"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { normalizeUrl } from "@/lib/utils";
import { classifySlug } from "@/lib/slug-moderation";
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
    titlePlaceholder: "Website 1",
    urlPlaceholder: "https://example.com"
  },
  {
    titleKey: "primary_link_4_title" as const,
    urlKey: "primary_link_4_url" as const,
    titleLabel: "Link 4 title",
    urlLabel: "Link 4 URL",
    titlePlaceholder: "Website",
    urlPlaceholder: "https://example.com"
  }
];

const MAX_PROFILE_VIEWS = 3;
const MAX_INTRO_TEXTAREA_HEIGHT = 220;
const LEGACY_INTRO_PROMPT = "Turning complexity into clarity.";
const INTRO_PLACEHOLDER =
  "Write a short line in your own words: what you do, who you help, or the best next step.";

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
    return "That slug was rejected after review. Choose another slug and save to request it.";
  }

  if (reason === "approved_by_admin" || reason === "approved_by_admin_override") {
    return "This slug was approved by Signal Pass review.";
  }

  if (reason === "blocked_name_based_slug_fallback") {
    return "Your original signup slug was restricted, so Signal Pass issued a safe fallback.";
  }

  if (reason === "public_office_title") {
    return "This slug requires manual review because it may reference a public office or official title.";
  }

  return reason;
}

function createViewFromProfile(profile: ProfileRecord, profileId: string, index: number): ProfileViewRecord {
  return {
    profile_id: profileId,
    name: `View ${index + 1}`,
    view_key: `view-${Date.now()}`,
    sort_order: index,
    full_name: profile.full_name || "",
    role_line: profile.role_line || "",
    intro: cleanIntroValue(profile.intro),
    email: profile.email || "",
    phone: profile.phone || "",
    website_url: profile.website_url || "",
    profile_badge_1: profile.profile_badge_1 || "",
    profile_badge_2: profile.profile_badge_2 || "",
    profile_badge_3: profile.profile_badge_3 || "",
    show_email: true,
    show_phone: true,
    show_text: false,
    primary_link_1_title: profile.primary_link_1_title || "Call",
    primary_link_1_url: profile.primary_link_1_url || phoneToTel(profile.phone),
    primary_link_2_title: profile.primary_link_2_title || "Email",
    primary_link_2_url: profile.primary_link_2_url || emailToMailto(profile.email),
    primary_link_3_title: profile.primary_link_3_title || "Website 1",
    primary_link_3_url: profile.primary_link_3_url || "",
    primary_link_4_title: profile.primary_link_4_title || "Website",
    primary_link_4_url: profile.primary_link_4_url || ""
  };
}

function normalizeViewForSave(view: ProfileViewRecord): ProfileViewRecord {
  return {
    ...view,
    name: view.name.trim() || "Profile view",
    full_name: view.full_name.trim(),
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
    intro: cleanIntroValue(initialProfile.intro)
  });
  const [views, setViews] = useState<ProfileViewRecord[]>(
    initialProfileViews.map((view) => ({
      ...view,
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

  const slugModeration = useMemo(() => classifySlug(slugInput || ""), [slugInput]);
  const activeSlugModeration = useMemo(() => classifySlug(form.slug || ""), [form.slug]);
  const normalizedSlugInput = slugModeration.normalized;
  const slugMatchesActive = normalizedSlugInput === (form.slug || "");
  const slugMatchesPending = normalizedSlugInput === (form.slug_requested || "");
  const slugHasChanged = !!normalizedSlugInput && !slugMatchesActive;
  const slugIsApproved = form.slug_status === "approved" && activeSlugModeration.state !== "blocked";
  const readableUrl = useMemo(() => getReadableProfileUrl(form), [form]);
  const issuedUrl = useMemo(() => getIssuedProfileUrl(form), [form]);
  const safeReadableUrl = slugIsApproved ? readableUrl : null;
  const safeIssuedUrl = form.private_token ? issuedUrl : null;
  const profileStatusLabel = slugIsApproved
    ? form.private_token
      ? "Ready for use"
      : "Pending token"
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
              ? "Pending review"
              : slugModeration.state === "review"
                ? "Manual review"
                : slugHasChanged
                  ? "Available"
                  : slugIsApproved
                    ? "Approved"
                    : "Not ready";

  const slugStatusMessage =
    slugModeration.state === "blocked"
      ? slugModeration.reason || "This slug is restricted or unavailable."
      : slugChecking
        ? "Checking whether this slug is available."
        : slugCheckError
          ? slugCheckError
          : slugTaken
            ? "This slug is restricted or unavailable. Choose another slug."
            : form.slug_status === "rejected" && !slugHasChanged
              ? friendlySlugReviewReason(form.slug_review_reason) ||
                "That slug was rejected after review. Choose another slug and save to request it."
              : form.slug_status === "pending_review" && slugMatchesPending
                ? `${friendlySlugReviewReason(form.slug_review_reason) || "This slug requires manual review."} Your current public URL remains active until review is completed.`
                : slugModeration.state === "review"
                  ? `${slugModeration.reason || "This slug requires manual review."} Your current public URL remains active until review is completed.`
                  : slugHasChanged
                    ? "This slug looks available. Save your profile to request it."
                    : slugIsApproved
                      ? "This slug is approved and can be used publicly."
                      : "This slug is not ready yet.";
  const activeView =
    views.find((view) => (view.id || view.view_key) === activeViewKey) || views[0] || null;
  const defaultViewId = form.default_view_id || views[0]?.id || null;

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
    setViewSaving(!!activeView);
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

      const promo = (form.promo_code_used || "").trim().toUpperCase();
      const isFounder = promo === "FOUNDERS";

      const payload: ProfileRecord = {
        ...form,
        slug: normalizedSlugInput || form.slug,
        page_mode: form.page_mode || "single",
        multi_view_display_mode: form.multi_view_display_mode || "favorite",
        promo_code_used: promo || null,
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
        ...(isFounder
          ? {
              lifetime_free: true,
              billing_exempt: true,
              stripe_plan_key: "founder"
            }
          : {}),
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

      setMessage(
        savedSlugStatus === "pending_review"
          ? `Changes saved. ${savedRequestedSlug ? `/${savedRequestedSlug}` : "Your requested slug"} requires manual review. Your current public URL remains active until review is completed.`
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
    if (viewSaving || views.length >= MAX_PROFILE_VIEWS) return;

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
          setForm(defaultResult.data as ProfileRecord);
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
        setForm(result.data as ProfileRecord);
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
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 42,
            lineHeight: 0.95,
            letterSpacing: "-0.02em"
          }}
        >
          Edit your Signal Pass profile.
        </h2>

        <p className="editor-copy">
          Shape how people encounter you. Keep the next step clear, make follow-up easier, and
          present yourself with less clutter.
        </p>

        <form className="editor-form" onSubmit={handleSave} style={{ marginTop: 24 }}>
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
              <input value={`signalpass.app/${form.slug || ""}`} readOnly disabled />
              <small className="auth-message">
                This remains active while any slug request is reviewed.
              </small>
            </div>

            <div className="auth-field">
              <span>Requested slug</span>
              <input
                value={slugInput}
                onChange={(event) => setSlugInput(event.target.value)}
                placeholder="your-name"
                aria-invalid={slugModeration.state === "blocked" || slugTaken}
              />
              <small
                className={
                  slugModeration.state === "blocked" ||
                  slugTaken ||
                  (form.slug_status === "rejected" && !slugHasChanged)
                    ? "auth-error"
                    : "auth-message"
                }
              >
                Slug status: {slugStatusLabel}. {slugStatusMessage}
              </small>
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
                checked={!!form.consent_public_visibility}
                onChange={(event) => update("consent_public_visibility", event.target.checked)}
              />
              <span>
                I understand that the information I publish may be visible to anyone who opens my
                profile link.
                <br />
                <br />
                If I prefer a more discreet public presence, I can leave this unchecked and Signal
                Pass will issue an anonymized URL for cards, QR codes, and direct sharing.
              </span>
            </label>
          </div>

          <div className="editor-grid" style={{ marginTop: 18 }}>
            <label className="auth-field">
              <span>Role/Title</span>
              <input
                value={form.role_line || ""}
                onChange={(event) => update("role_line", event.target.value)}
                placeholder="Founder & Principal"
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
                />
              </label>

              <label className="auth-field">
                <span>Badge 2</span>
                <input
                  value={form.profile_badge_2 || ""}
                  onChange={(event) => update("profile_badge_2", event.target.value)}
                  placeholder="Direct follow-up"
                />
              </label>

              <label className="auth-field">
                <span>Badge 3</span>
                <input
                  value={form.profile_badge_3 || ""}
                  onChange={(event) => update("profile_badge_3", event.target.value)}
                  placeholder="Verified contact card"
                />
              </label>
            </div>
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
                  />
                </label>
              </div>
            ))}
          </div>

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
                >
                  <option value="single">single</option>
                  <option value="multi">multi</option>
                </select>
              </label>

              <label className="auth-field">
                <span>Multi-view display</span>
                <select
                  value={form.multi_view_display_mode || "favorite"}
                  onChange={(event) =>
                    update(
                      "multi_view_display_mode",
                      event.target.value as ProfileRecord["multi_view_display_mode"]
                    )
                  }
                  disabled={(form.page_mode || "single") === "single"}
                >
                  <option value="favorite">favorite</option>
                  <option value="landing">landing</option>
                </select>
              </label>
            </div>

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

                          <button
                            className="button secondary"
                            type="button"
                            disabled={!view.id || isDefault || viewSaving}
                            onClick={() => handleSetDefaultView(view)}
                          >
                            {isDefault ? "Default" : "Set default"}
                          </button>

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

            {activeView ? (
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
                    <span>Role/Title</span>
                    <input
                      value={activeView.role_line || ""}
                      onChange={(event) => updateView("role_line", event.target.value)}
                      placeholder="Founder & Principal"
                    />
                  </label>

                  <label className="auth-field">
                    <span>Website URL</span>
                    <input
                      value={activeView.website_url || ""}
                      onChange={(event) => updateView("website_url", event.target.value)}
                      placeholder="https://example.com"
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
                      />
                    </label>

                    <label className="auth-field">
                      <span>Badge 2</span>
                      <input
                        value={activeView.profile_badge_2 || ""}
                        onChange={(event) => updateView("profile_badge_2", event.target.value)}
                        placeholder="Direct follow-up"
                      />
                    </label>

                    <label className="auth-field">
                      <span>Badge 3</span>
                      <input
                        value={activeView.profile_badge_3 || ""}
                        onChange={(event) => updateView("profile_badge_3", event.target.value)}
                        placeholder="Verified contact card"
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

                    <div className="action-choice-row">
                      <span className="action-choice-label">Secondary button</span>
                      <div className="action-choice-options" aria-label="Secondary profile button">
                        <button
                          className={!activeView.show_text ? "action-choice is-active" : "action-choice"}
                          type="button"
                          onClick={() => updateView("show_text", false)}
                        >
                          Email
                        </button>

                        <button
                          className={activeView.show_text ? "action-choice is-active" : "action-choice"}
                          type="button"
                          onClick={() => updateView("show_text", true)}
                        >
                          Text
                        </button>
                      </div>
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
              </div>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Account flags</div>
            <div className="editor-grid">
              <label className="auth-field">
                <span>Promo code</span>
                <input
                  value={form.promo_code_used || ""}
                  onChange={(event) => update("promo_code_used", event.target.value)}
                  placeholder="Optional promo code"
                />
              </label>

              <div className="auth-field">
                <span>Access</span>
                <input
                  value={
                    form.lifetime_free
                      ? "Founder lifetime access"
                      : form.billing_exempt
                        ? "Billing exempt"
                        : form.stripe_plan_key || "Not set"
                  }
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
