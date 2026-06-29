"use client";

import Link from "next/link";

export function UserMenu({
  mobile = false,
  initialEmail = null,
  initialFullName = null,
  initialSlug = null,
  initialIsAdmin = false
}: {
  mobile?: boolean;
  initialEmail?: string | null;
  initialFullName?: string | null;
  initialSlug?: string | null;
  initialIsAdmin?: boolean;
}) {
  const isLoggedIn = !!initialEmail;

  if (!isLoggedIn) {
    return mobile ? (
      <div className="mobile-auth">
        <Link href="/login" className="button secondary">
          Sign in
        </Link>
        <Link href="/signup" className="button primary">
          Get started
        </Link>
      </div>
    ) : (
      <div className="auth-buttons" style={{ gap: "28px" }}>
        <Link href="/login">Sign in</Link>
        <Link href="/signup" className="button primary">
          Get started
        </Link>
      </div>
    );
  }

  if (!mobile) {
    return (
      <div className="desktop-user-menu">
        <Link href="/account" className="desktop-account-link">
          Account
        </Link>
        <form action="/auth/signout" method="post">
          <button className="desktop-signout-button" type="submit">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="user-popover-mobile">
      <div className="user-meta">
        <div className="user-meta-label">Signed in as</div>
        <div className="user-meta-email">{initialEmail}</div>
      </div>

      <div className="user-links">
        <Link href="/dashboard" className="user-link">
          Dashboard
        </Link>
        <Link href="/account" className="user-link">
          Account
        </Link>
        {initialIsAdmin ? (
          <Link href="/admin" className="user-link">
            Admin
          </Link>
        ) : null}

        <form action="/auth/signout" method="post">
          <button className="user-link user-link-button" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <Link href="/dashboard" className="button primary user-dashboard-cta">
        Go to your dashboard
      </Link>
    </div>
  );
}
