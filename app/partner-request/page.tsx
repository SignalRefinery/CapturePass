

"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

export default function PartnerRequestPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    network: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/partner-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not submit partner request.");
      }

      setSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not submit partner request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="kicker" style={{ marginBottom: 12 }}>
          <span className="mini-star">✦</span>
          <span>Partner request</span>
        </div>
        <h1 style={{ marginTop: 0 }}>Request a partner code.</h1>
        <p className="editor-copy">
          Tell us who you work with and how you would help more people share CapturePass.
          We review requests manually.
        </p>
        {submitted ? (
          <div style={{ marginTop: 20 }}>
            <p className="auth-message">
              Request received. We’ll review and follow up shortly.
            </p>
            <p className="auth-switch">
              Back to <Link href="/">home</Link>
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 22 }}>
            <label className="auth-field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </label>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </label>
            <label className="auth-field">
              <span>Organization</span>
              <input
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
              />
            </label>
            <label className="auth-field">
              <span>Role</span>
              <input
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </label>
            <label className="auth-field">
              <span>Who you can introduce</span>
              <textarea
                value={form.network}
                onChange={(e) => update("network", e.target.value)}
                rows={3}
              />
            </label>
            <label className="auth-field">
              <span>Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
              />
            </label>
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit request"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
