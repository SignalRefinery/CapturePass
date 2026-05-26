

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setError(updateError.message || "Unable to update password.");
      setLoading(false);
      return;
    }

    setMessage("Your password has been updated. You can now log in.");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="kicker" style={{ marginBottom: 12 }}>
          <span className="mini-star">✦</span>
          <span>Set new password</span>
        </div>

        <h1 style={{ marginTop: 0 }}>Create a new password.</h1>
        <p className="editor-copy">
          Enter a new password for your TapTagg account. This will replace your previous password.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 22 }}>
          <label className="auth-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-message">{message}</p> : null}

          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="auth-switch">
          Back to <Link href="/login">login</Link>
        </p>
      </section>
    </main>
  );
}