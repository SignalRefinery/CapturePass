

"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<main className="auth-wrap"><section className="auth-card">Loading...</section></main>}>
      <UpdatePasswordForm />
    </Suspense>
  );
}

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalRedirect(searchParams.get("next"), "/dashboard");
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrateInviteSession() {
      const code = searchParams.get("code");
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search.replace(/[?&]code=[^&]*/, "").replace(/^&/, "?")}`);

        if (codeError && mounted) {
          setError(codeError.message || "This password setup link could not be verified.");
        }
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

        if (sessionError && mounted) {
          setError(sessionError.message || "This password setup link could not be verified.");
        }
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (mounted) {
        if (!session) {
          setError("This password setup link is missing or expired. Please request a new login email.");
        }
        setSessionLoading(false);
      }
    }

    hydrateInviteSession();

    return () => {
      mounted = false;
    };
  }, [searchParams, supabase]);

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

    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setError(updateError.message || "Unable to update password.");
      setLoading(false);
      return;
    }

    setMessage("Your password has been updated.");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
    router.push(nextPath);
    router.refresh();
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

          <button className="button primary" type="submit" disabled={sessionLoading || loading}>
            {sessionLoading ? "Preparing..." : loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="auth-switch">
          Back to <Link href={nextPath}>login</Link>
        </p>
      </section>
    </main>
  );
}
