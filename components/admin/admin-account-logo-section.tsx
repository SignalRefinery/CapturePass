"use client";

import { useRef, useState, type FormEvent } from "react";

type AdminAccountLogoSectionProps = {
  userId: string;
  brandLogoUrl?: string | null;
  displayName?: string | null;
};

export function AdminAccountLogoSection({
  userId,
  brandLogoUrl,
  displayName
}: AdminAccountLogoSectionProps) {
  const [logoUrl, setLogoUrl] = useState(brandLogoUrl || null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || removing) return;

    const file = inputRef.current?.files?.[0] || null;
    if (!file) {
      setError("Choose a PNG logo before saving.");
      setMessage("");
      return;
    }

    if (file.type !== "image/png") {
      setError("Logos must be PNG files.");
      setMessage("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Logos must be 5 MB or smaller.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("logo", file);

      const response = await fetch(`/api/admin/users/${userId}/logo`, {
        method: "POST",
        body: formData
      });
      const result = (await response.json().catch(() => ({}))) as {
        brand_logo_url?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Logo upload failed.");
      }

      setLogoUrl(result.brand_logo_url || null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setMessage("Logo uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (saving || removing) return;

    setRemoving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${userId}/logo`, {
        method: "DELETE"
      });
      const result = (await response.json().catch(() => ({}))) as {
        brand_logo_url?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to remove logo.");
      }

      setLogoUrl(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setMessage("Logo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove logo.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 className="section-title" style={{ fontSize: 22 }}>
        Brand logo
      </h2>
      <p className="editor-copy" style={{ marginTop: 0 }}>
        Upload a PNG logo for the public profile, pass pages, and admin-managed branding workflows.
      </p>

      <form className="editor-form" onSubmit={handleSave} style={{ marginTop: 16 }}>
        <label className="editor-label">
          Logo PNG
          {logoUrl ? (
            <div className="business-logo-preview">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage-backed customer logos are remote runtime uploads. */}
              <img src={logoUrl} alt={`${displayName || "User"} logo`} />
              <span className="table-subtext">Current logo</span>
            </div>
          ) : (
            <span className="table-subtext">No logo uploaded.</span>
          )}
          <input
            className="editor-input"
            ref={inputRef}
            type="file"
            accept="image/png"
            disabled={saving || removing}
          />
          <span className="table-subtext">PNG only. Max 5 MB.</span>
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="button primary" type="submit" disabled={saving || removing}>
            {saving ? "Uploading..." : "Upload logo"}
          </button>
          {logoUrl ? (
            <button className="button secondary" type="button" onClick={handleRemove} disabled={saving || removing}>
              {removing ? "Removing..." : "Remove logo"}
            </button>
          ) : null}
        </div>

        {message ? <p className="auth-message" style={{ margin: 0 }}>{message}</p> : null}
        {error ? <p className="auth-error" style={{ margin: 0 }}>{error}</p> : null}
      </form>
    </div>
  );
}
