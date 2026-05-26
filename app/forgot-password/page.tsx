

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/update-password`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getRedirectUrl()
    });

    if (resetError) {
      setError(resetError.message || "Unable to send reset email.");
      setLoading(false);
      return;
    }

    setMessage("If an account exists for that email, a password reset link has been sent.");
    setLoading(false);
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="kicker" style={{ marginBottom: 12 }}>
          <span className="mini-star">✦</span>
          <span>Password reset</span>
        </div>

        <h1 style={{ marginTop: 0 }}>Reset your password.</h1>
        <p className="editor-copy">
          Enter the email connected to your TapTagg account. We will send a secure link to set a new password.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 22 }}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-message">{message}</p> : null}

          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-switch">
          Remembered your password? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}