"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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
  modalStyle?: CSSProperties;
};

type Status = "idle" | "submitting" | "success" | "error";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function ContactShareModal({ target, modalStyle }: ContactShareModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    const focusFirstElement = () => {
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) || []
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);
      (focusable[0] || panelRef.current)?.focus();
    };

    const animationFrame = window.requestAnimationFrame(focusFirstElement);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);

      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.left = previousBodyStyles.left;
      document.body.style.right = previousBodyStyles.right;
      document.body.style.width = previousBodyStyles.width;
      window.scrollTo(0, scrollY);
      previousActiveElement?.focus();
    };
  }, [open]);

  function openModal() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setClosing(false);
    setOpen(true);
    setStatus("idle");
    setError("");
  }

  function closeModal() {
    setClosing(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 140);
  }

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
        ref={triggerRef}
        className={`${styles.button} ${styles.profileSubtleButton}`}
        type="button"
        onClick={openModal}
      >
        Share My Contact
      </button>

      {mounted && open
        ? createPortal(
            <div
              className={`${styles.contactModalOverlay} ${closing ? styles.contactModalClosing : ""}`}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeModal();
                }
              }}
            >
              <div
                ref={panelRef}
                className={styles.contactModalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="contact-share-title"
                tabIndex={-1}
                style={modalStyle}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  className={styles.contactModalClose}
                  type="button"
                  aria-label="Close"
                  onClick={closeModal}
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
            </div>,
            document.body
          )
        : null}
    </>
  );
}
