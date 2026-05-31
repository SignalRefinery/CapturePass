"use client";

import { useState } from "react";
import styles from "./taptagg-profile-shell.module.css";

type ContactShareTarget = {
  profileId?: string | null;
  slug?: string | null;
  viewId?: string | null;
  organizationId?: string | null;
  source?: string | null;
};

type ContactShareModalProps = {
  target: ContactShareTarget;
};

type Status = "idle" | "submitting" | "success" | "error";

export function ContactShareModal({ target }: ContactShareModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");
    setError("");

    const response = await fetch("/api/contact-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: target.profileId || null,
        slug: target.slug || null,
        viewId: target.viewId || null,
        organizationId: target.organizationId || null,
        source: target.source || "public_profile",
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        title: formData.get("title"),
        note: formData.get("note"),
        website: formData.get("website")
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus("error");
      setError(result?.error || "Unable to share your contact right now.");
      return;
    }

    form.reset();
    setStatus("success");
  }

  return (
    <>
      <button
        className={`${styles.button} ${styles.profileSubtleButton}`}
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
          setError("");
        }}
      >
        Share My Contact
      </button>

      {open ? (
        <div className={styles.contactModalOverlay} role="dialog" aria-modal="true" aria-labelledby="contact-share-title">
          <div className={styles.contactModalPanel}>
            <button
              className={styles.contactModalClose}
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <div className={styles.signupCtaKicker}>Contact Sharing</div>
            <h2 id="contact-share-title">Share Your Contact</h2>
            <p>Send your contact details directly to this TapTagg user.</p>

            {status === "success" ? (
              <div className={styles.contactSuccess}>Contact shared successfully.</div>
            ) : (
              <form className={styles.contactShareForm} onSubmit={submitContact}>
                <label>
                  <span>Name</span>
                  <input name="name" autoComplete="name" required />
                </label>
                <div className={styles.contactShareGrid}>
                  <label>
                    <span>Email</span>
                    <input name="email" type="email" autoComplete="email" />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input name="phone" type="tel" autoComplete="tel" />
                  </label>
                </div>
                <div className={styles.contactShareGrid}>
                  <label>
                    <span>Company</span>
                    <input name="company" autoComplete="organization" />
                  </label>
                  <label>
                    <span>Title</span>
                    <input name="title" autoComplete="organization-title" />
                  </label>
                </div>
                <label>
                  <span>Note</span>
                  <textarea name="note" maxLength={600} rows={4} />
                </label>
                <label className={styles.contactHoneypot} aria-hidden="true">
                  <span>Website</span>
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                {error ? <div className={styles.contactError}>{error}</div> : null}
                <button
                  className={`${styles.button} ${styles.profilePrimaryButton}`}
                  type="submit"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Sharing..." : "Share My Contact"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
