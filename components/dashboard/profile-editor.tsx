"use client";

import { useMemo, useState } from "react";
import type { ProfileRecord } from "@/lib/types";
import { normalizeUrl } from "@/lib/utils";
import { classifySlug } from "@/lib/slug-moderation";
import { saveProfileClient } from "@/lib/profile-service-client";
import { getIssuedProfileUrl, getReadableProfileUrl } from "@/lib/urls/profile-url";

type ProfileEditorProps = {
  userId: string;
  initialProfile: ProfileRecord;
};

const LINK_FIELD_CONFIG = [
  {
    titleKey: "primary_link_1_title" as const,
    urlKey: "primary_link_1_url" as const,
    titleLabel: "Link 1 title",
    urlLabel: "Link 1 URL",
    titlePlaceholder: "Call me",
    urlPlaceholder: "tel:13125935309"
  },
  {
    titleKey: "primary_link_2_title" as const,
    urlKey: "primary_link_2_url" as const,
    titleLabel: "Link 2 title",
    urlLabel: "Link 2 URL",
    titlePlaceholder: "Text me",
    urlPlaceholder: "sms:13125935309"
  },
  {
    titleKey: "primary_link_3_title" as const,
    urlKey: "primary_link_3_url" as const,
    titleLabel: "Link 3 title",
    urlLabel: "Link 3 URL",
    titlePlaceholder: "Website",
    urlPlaceholder: "https://example.com"
  },
  {
    titleKey: "primary_link_4_title" as const,
    urlKey: "primary_link_4_url" as const,
    titleLabel: "Link 4 title",
    urlLabel: "Link 4 URL",
    titlePlaceholder: "Download contact card",
    urlPlaceholder: "/john-keating.vcf"
  }
];

export function ProfileEditor({ userId, initialProfile }: ProfileEditorProps) {
  const [form, setForm] = useState<ProfileRecord>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  function update<K extends keyof ProfileRecord>(key: K, value: ProfileRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
        promo_code_used: promo || null,
        website_url: normalizeUrl(form.website_url || ""),
        primary_link_1_url:
          form.primary_link_1_url?.startsWith("tel:") || form.primary_link_1_url?.startsWith("sms:")
            ? form.primary_link_1_url
            : normalizeUrl(form.primary_link_1_url || ""),
        primary_link_2_url:
          form.primary_link_2_url?.startsWith("tel:") || form.primary_link_2_url?.startsWith("sms:")
            ? form.primary_link_2_url
            : normalizeUrl(form.primary_link_2_url || ""),
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
                placeholder="John Keating"
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
                placeholder="signalrefinery.pro"
              />
            </label>
          </div>

          <label className="auth-field" style={{ marginTop: 18 }}>
            <span>Intro</span>
            <textarea
              value={form.intro || ""}
              onChange={(event) => update("intro", event.target.value)}
              rows={4}
              placeholder="Turning complexity into clarity."
            />
          </label>

          <div className="editor-grid" style={{ marginTop: 18 }}>
            <label className="auth-field">
              <span>Email</span>
              <input
                value={form.email || ""}
                onChange={(event) => update("email", event.target.value)}
                placeholder="john@signalrefinery.pro"
              />
            </label>

            <label className="auth-field">
              <span>Phone</span>
              <input
                value={form.phone || ""}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="3125935309"
              />
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
                    value={(form[field.urlKey] as string) || ""}
                    onChange={(event) => update(field.urlKey, event.target.value)}
                    placeholder={field.urlPlaceholder}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Account flags</div>
            <div className="editor-grid">
              <label className="auth-field">
                <span>Promo code</span>
                <input
                  value={form.promo_code_used || ""}
                  onChange={(event) => update("promo_code_used", event.target.value)}
                  placeholder="FOUNDERS"
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