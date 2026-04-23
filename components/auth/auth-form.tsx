"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
      const suggestedSlug =
        slugify(fullName) || slugify(email.split("@")[0] || "");

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: fullName,
            suggested_slug: suggestedSlug,
            referral_code_used: referral.trim() || null,
            promo_code: promoCode.trim().toUpperCase() || null,
            is_public_official: publicOfficial
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setMessage("Check your email to verify your account.");
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
              <span>First name</span>
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

          <div className="editor-grid">
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
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

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
    </form>
  );
}