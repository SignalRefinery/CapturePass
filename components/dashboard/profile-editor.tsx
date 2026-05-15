"use client";

import { useMemo, useState } from "react";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { normalizeUrl } from "@/lib/utils";
import { classifySlug } from "@/lib/slug-moderation";
import {
  deleteProfileViewClient,
  getProfileIdForUserClient,
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

function createViewFromProfile(profile: ProfileRecord, profileId: string, index: number): ProfileViewRecord {
  return {
    profile_id: profileId,
    name: `View ${index + 1}`,
    view_key: `view-${Date.now()}`,
    sort_order: index,
    full_name: profile.full_name || "",
    role_line: profile.role_line || "",
    intro: profile.intro || "",
    email: profile.email || "",
    phone: profile.phone || "",
    website_url: profile.website_url || "",
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
  const [form, setForm] = useState<ProfileRecord>(initialProfile);
  const [views, setViews] = useState<ProfileViewRecord[]>(initialProfileViews);
  const [activeViewKey, setActiveViewKey] = useState(
    initialProfile.default_view_id || initialProfileViews[0]?.id || initialProfileViews[0]?.view_key || ""
  );
  const [saving, setSaving] = useState(false);
  const [viewSaving, setViewSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [viewMessage, setViewMessage] = useState("");
  const [viewError, setViewError] = useState("");

  const callLink = phoneToTel(form.phone);
  const emailLink = emailToMailto(form.email);

  const slugModeration = useMemo(() => classifySlug(form.slug || ""), [form.slug]);
  const slugIsApproved = form.slug_status === "approved" && slugModeration.state !== "blocked";
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
      : slugModeration.state === "blocked"
        ? "Slug blocked"
        : "Not ready";

  const slugStatusLabel =
    slugModeration.state === "blocked"
      ? "Blocked"
      : form.slug_status === "pending_review"
        ? "In review"
        : slugIsApproved
          ? "Approved"
          : "Not ready";

  const slugStatusMessage =
    slugModeration.state === "blocked"
      ? slugModeration.reason || "This slug is blocked and cannot be used."
      : form.slug_status === "pending_review"
        ? form.slug_review_reason ||
          "This slug needs admin approval before it can go live. Your current public profile URL will stay hidden until approval."
        : slugIsApproved
          ? "This slug is approved and can be used publicly."
          : "This slug is not ready yet.";
  const activeView =
    views.find((view) => (view.id || view.view_key) === activeViewKey) || views[0] || null;
  const defaultViewId = form.default_view_id || views[0]?.id || null;

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

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const promo = (form.promo_code_used || "").trim().toUpperCase();
      const isFounder = promo === "FOUNDERS";

      const payload: ProfileRecord = {
        ...form,
        slug: initialProfile.slug,
        page_mode: form.page_mode || "single",
        multi_view_display_mode: form.multi_view_display_mode || "favorite",
        promo_code_used: promo || null,
        website_url: normalizeUrl(form.website_url || ""),
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
        setForm(result.data as ProfileRecord);
      }

      const savedSlugStatus = (result.data as ProfileRecord | null)?.slug_status;
      setMessage(
        savedSlugStatus === "pending_review"
          ? "Profile saved. Your requested slug is in review and will not go live until approved."
          : "Profile saved."
      );
    } catch (err) {
      console.error("Profile save failed:", err);
      setError(err instanceof Error ? err.message : "Unexpected error while saving.");
    } finally {
      setSaving(false);
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

  async function handleSaveView() {
    if (!activeView || viewSaving) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      const result = await saveProfileViewClient(normalizeViewForSave(activeView));

      if (result.error) {
        throw new Error(result.error.message || "Failed to save profile view.");
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
      setViewMessage("Profile view saved.");
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Unexpected error while saving the view.");
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
              <span>Public URL</span>
              <input value={form.slug || ""} readOnly disabled />
              <small className={slugModeration.state === "blocked" ? "auth-error" : "auth-message"}>
                Slug status: {slugStatusLabel}. {slugStatusMessage}
              </small>
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
              <span>Role line</span>
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
            <textarea
              value={form.intro || ""}
              onChange={(event) => update("intro", event.target.value)}
              rows={4}
              placeholder="A short introduction for your profile."
            />
          </label>

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
                    <span>Role line</span>
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
                  <textarea
                    value={activeView.intro || ""}
                    onChange={(event) => updateView("intro", event.target.value)}
                    rows={4}
                    placeholder="A short introduction for this view."
                  />
                </label>

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

                <div className="card" style={{ marginTop: 18, padding: 18 }}>
                  <div className="dashboard-kicker">Contact visibility</div>
                  <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_email}
                        onChange={(event) => updateView("show_email", event.target.checked)}
                      />
                      <span>Show email contact details in this view.</span>
                    </label>

                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_phone}
                        onChange={(event) => updateView("show_phone", event.target.checked)}
                      />
                      <span>Show phone contact details in this view.</span>
                    </label>

                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_text}
                        onChange={(event) => updateView("show_text", event.target.checked)}
                      />
                      <span>Show the Text button in this view.</span>
                    </label>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 18, padding: 18 }}>
                  <div className="dashboard-kicker">View primary links</div>
                  {LINK_FIELD_CONFIG.map((field, index) => (
                    <div
                      className="editor-grid"
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
                    className="button primary"
                    type="button"
                    disabled={viewSaving}
                    onClick={handleSaveView}
                  >
                    {viewSaving ? "Saving view..." : "Save profile view"}
                  </button>

                  <button
                    className="button secondary"
                    type="button"
                    disabled={!activeView.id || activeView.id === defaultViewId || viewSaving}
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

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Technical details</div>
            <h3 style={{ margin: "6px 0 12px", fontSize: "1.1rem" }}>
              Profile access and distribution
            </h3>

            <div className="status-list">
              <div className="status-row">
                <span>Public profile</span>
                <strong>
                  {safeReadableUrl
                    ? safeReadableUrl.replace(/^https?:\/\//, "")
                    : "Pending approval"}
                </strong>
              </div>

              <div className="status-row">
                <span>Issued card / QR</span>
                <strong>
                  {safeIssuedUrl
                    ? safeIssuedUrl.replace(/^https?:\/\//, "")
                    : "Not issued"}
                </strong>
              </div>

              <div className="status-row">
                <span>Status</span>
                <strong>{profileStatusLabel}</strong>
              </div>

              <div className="status-row">
                <span>Slug status</span>
                <strong>{slugStatusLabel}</strong>
              </div>
            </div>
          </div>

          {error ? <p className="auth-error" style={{ marginTop: 18 }}>{error}</p> : null}
          {message ? <p className="auth-message" style={{ marginTop: 18 }}>{message}</p> : null}

          <div className="editor-actions" style={{ marginTop: 24 }}>
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
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
