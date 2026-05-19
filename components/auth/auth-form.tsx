"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string | null;
  plan?: string | null;
};

export function AuthForm({ mode, nextPath, plan }: AuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const redirectTo = safeInternalRedirect(nextPath);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [referral, setReferral] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [publicOfficial, setPublicOfficial] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (loginError) {
          setError(loginError.message);
          setLoading(false);
          return;
        }

        router.push(redirectTo);
        router.refresh();
        return;
      }

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
      const suggestedSlug =
        slugify(fullName) || slugify(email.split("@")[0] || "");
      const normalizedPromoCode = promoCode.trim().toUpperCase();
      const isFounderSignup = normalizedPromoCode === "FOUNDERS";

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(
            isFounderSignup ? "/dashboard" : redirectTo,
            isFounderSignup ? null : plan
          ),
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: fullName,
            suggested_slug: suggestedSlug,
            referral_code_used: referral.trim() || null,
            promo_code: normalizedPromoCode || null,
            is_public_official: publicOfficial,
            selected_plan: isFounderSignup ? null : plan || null
          }
        }
      });

      if (signUpError) {
        const signUpMessage = signUpError.message || "Unable to create account.";
        const normalizedMessage = signUpMessage.toLowerCase();

        if (
          normalizedMessage.includes("already registered") ||
          normalizedMessage.includes("already exists") ||
          normalizedMessage.includes("user already") ||
          normalizedMessage.includes("email")
        ) {
          setError(
            "That email is already associated with a SignalPass account. Try signing in instead, or use password reset if you need access."
          );
        } else {
          setError(signUpMessage);
        }

        setLoading(false);
        return;
      }

      setMessage(
        plan && promoCode.trim().toUpperCase() !== "FOUNDERS"
          ? "Check your email to verify your account. After verification, you will continue to checkout."
          : "Check your email to verify your account."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "signup" ? (
        <>
          <div className="editor-grid">
            <label className="auth-field">
              <span>First name or title</span>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span>Last name</span>
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="dashboard-card subtle" style={{ padding: 18 }}>
            <label className="toggle-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={publicOfficial}
                onChange={(event) => setPublicOfficial(event.target.checked)}
              />
              <span>I am a public official or operate in a government-facing role.</span>
            </label>
          </div>
        </>
      ) : null}

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

      <label className="auth-field">
        <span>Password</span>
        <div className="password-field">
          <input
            type={passwordVisible ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((current) => !current)}
          >
            {passwordVisible ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {mode === "signup" ? (
        <label className="auth-field">
          <span>Confirm password</span>
          <div className="password-field">
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={confirmPasswordVisible}
              onClick={() => setConfirmPasswordVisible((current) => !current)}
            >
              {confirmPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </label>
      ) : null}

      {mode === "login" ? (
        <div style={{ marginTop: 6, marginBottom: 12 }}>
          <Link
            href="/forgot-password"
            style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}
          >
            Forgot password?
          </Link>
        </div>
      ) : null}

      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-message">{message}</p> : null}

      <button className="button primary auth-submit" type="submit" disabled={loading}>
        {loading
          ? mode === "login"
            ? "Signing in..."
            : "Creating account..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      {mode === "signup" ? (
        <div className="dashboard-card subtle optional-auth-fields">
          <div className="dashboard-kicker">Optional access codes</div>
          <div className="editor-grid" style={{ marginTop: 14 }}>
            <label className="auth-field">
              <span>Referral code</span>
              <input
                type="text"
                value={referral}
                onChange={(event) => setReferral(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Promo code</span>
              <input
                type="text"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
              />
            </label>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function getEmailRedirectUrl(nextPath: string, plan?: string | null) {
  const appOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://signalpass.app";
  const callbackUrl = new URL(
    "/auth/callback",
    appOrigin
  );

  callbackUrl.searchParams.set("next", safeInternalRedirect(nextPath));

  if (plan) {
    callbackUrl.searchParams.set("plan", plan);
  }

  return callbackUrl.toString();
}
